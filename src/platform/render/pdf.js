// Print-ready PDF for a calendar model, in three layouts:
//   year-glance  all twelve months on one page, then a list of every date;
//   month-page   one landscape page per month with events inside the days;
//   week-list    a table of every ISO week with its dates and events.
//
// The renderer does not import pdfkit: the caller passes the PDFDocument
// constructor. Node (the tests, a future serverless function) passes
// `import PDFDocument from "pdfkit"`; the browser loads the standalone build on
// demand (see loadBrowserPdfKit in src/data/companyCalendar.js), so the 2 MB
// library is never part of a page load.
//
// Text uses the PDF standard font Helvetica, which draws all Finnish letters.
// Anything the font cannot draw is replaced (pdfSafe) and reported in
// `warnings`. Every text goes through fitText or wrapText, so a long company
// name or event title is shrunk or cut with an ellipsis, never printed over
// its neighbours or off the page.
import { resolveLayout } from "../design/layouts.js";
import { resolveTheme } from "../design/themes.js";
import { readableTextColor } from "../design/branding.js";
import { EVENT_KIND_LABELS_FI } from "../calendar/events.js";
import { WEEKDAYS_MON_FIRST, weekList } from "../calendar/model.js";
import { dayStyle, legendKinds } from "./dayStyle.js";
import { fitText, pdfSafe, wrapText } from "./text.js";

const BOLD = "Helvetica-Bold";
const REGULAR = "Helvetica";
const NOTE_KINDS = new Set(["closure", "leave", "season", "school", "company", "payday", "flag-day"]);
const KIND_ORDER = ["holiday", "flag-day", "payday", "closure", "leave", "season", "school", "company"];
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const fiLong = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

/**
 * @param {ReturnType<typeof import("../calendar/model.js").buildCalendarModel>} model
 * @param {object} options
 * @param {new (options: object) => any} options.PDFDocument
 * @param {string|null} [options.logo]  PNG or JPEG data URI (rasterise an SVG first)
 * @param {Date} [options.generatedOn]
 * @param {boolean} [options.compress]
 * @returns {Promise<{bytes: Uint8Array, pages: number, warnings: string[]}>}
 */
export async function renderCalendarPdf(model, { PDFDocument, logo = null, generatedOn = new Date(), compress = true }) {
  if (!PDFDocument) throw new Error("renderCalendarPdf needs a PDFDocument constructor.");
  const { config } = model;
  const layout = resolveLayout(config.layout);
  const theme = resolveTheme(config.theme, config.branding);
  const c = theme.colors;
  const warnings = [];
  const safe = (value) => {
    const r = pdfSafe(value);
    if (r.replaced && !warnings.includes("Joitakin merkkejä ei voi tulostaa PDF:ään, ne on korvattu merkillä ?.")) {
      warnings.push("Joitakin merkkejä ei voi tulostaa PDF:ään, ne on korvattu merkillä ?.");
    }
    return r.text;
  };
  const company = safe(config.branding.companyName);
  const title = `Kalenteri ${model.year}`;

  const doc = new PDFDocument({
    size: [layout.page.width, layout.page.height],
    margin: 0,
    autoFirstPage: false,
    compress,
    info: {
      Title: company ? `${company} - ${title}` : title,
      Subject: `ISO 8601 -viikkonumerot, Suomen pyhäpäivät ja yrityksen omat päivät ${model.year}`,
      Creator: "Viikkonro Yrityskalenteri (viikkonro.fi)",
      CreationDate: generatedOn,
    },
  });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    doc.on("end", resolve);
    doc.on("error", reject);
  });

  let pageNo = 0;
  const { content, page } = layout;
  const right = content.x + content.width;

  // Fits an image into a box without distorting it, aligned to the box's right edge.
  function placeLogo(box) {
    if (!logo) return;
    try {
      const img = doc.openImage(logo);
      const k = Math.min(box.w / img.width, box.h / img.height);
      const w = img.width * k;
      const h = img.height * k;
      doc.image(logo, box.x + box.w - w, box.y + (box.h - h) / 2, { width: w, height: h });
    } catch {
      warnings.push("Logoa ei voitu lisätä PDF-tiedostoon.");
    }
  }

  function addPage(subtitle) {
    doc.addPage({ size: [page.width, page.height], margin: 0 });
    pageNo += 1;
    doc.rect(0, 0, page.width, 8).fill(c.accent);
    const logoW = logo ? 150 : 0;
    const nameW = content.width - logoW - (logo ? 16 : 0);
    const name = fitText(doc, company || title, nameW, { font: BOLD, size: 17, minSize: 10 });
    doc.font(BOLD).fontSize(name.size).fillColor(c.ink).text(name.text, content.x, 22, { width: nameW, lineBreak: false });
    const sub = fitText(doc, subtitle, nameW, { size: 9, minSize: 7 });
    doc.font(REGULAR).fontSize(sub.size).fillColor(c.inkSoft).text(sub.text, content.x, 44, { width: nameW, lineBreak: false });
    placeLogo({ x: right - logoW, y: 16, w: logoW, h: 46 });
    // Footer
    doc.font(REGULAR).fontSize(6.5).fillColor(c.inkSoft);
    doc.text("Tehty Viikkonro Yrityskalenterilla, viikkonro.fi", content.x, page.height - 26, { width: content.width / 2, lineBreak: false });
    doc.text(`Sivu ${pageNo}`, right - 60, page.height - 26, { width: 60, align: "right", lineBreak: false });
  }

  function legend(x, y, maxWidth) {
    let cx = x;
    const items = legendKinds(model);
    doc.font(REGULAR).fontSize(6.5);
    for (const kind of items) {
      const label = EVENT_KIND_LABELS_FI[kind];
      const need = 14 + doc.widthOfString(label) + 14;
      if (cx + need > x + maxWidth) break;
      const swatch = { holiday: c.holidayTint, closure: c.closureTint, leave: c.leaveTint, season: c.seasonTint, school: c.schoolTint };
      if (swatch[kind]) doc.rect(cx, y, 8, 8).fill(swatch[kind]).rect(cx, y, 8, 8).lineWidth(0.3).stroke(c.line);
      else if (kind === "flag-day") doc.circle(cx + 4, y + 4, 2).fill(c.flag);
      else if (kind === "payday") doc.rect(cx + 1, y + 1, 6, 6).fill(c.ink);
      else doc.circle(cx + 4, y + 4, 2).fill(c.accent);
      doc.fillColor(c.inkSoft).text(label, cx + 12, y + 1, { lineBreak: false });
      cx += need;
    }
  }

  // Marks on one day cell: flag dot (top right), company dot (bottom right), payday square (bottom left).
  function markers(style, x, y, w, h) {
    if (style.flag) doc.circle(x + w - 3, y + 2.2, 1.3).fill(c.flag);
    if (style.company) doc.circle(x + w - 3, y + h - 3, 1.3).fill(c.accent);
    if (style.payday) doc.rect(x + 1.2, y + h - 3.6, 2.4, 2.4).fill(c.ink);
  }

  // ── Year at a glance ──────────────────────────────────────────────────────
  function drawYearGlance() {
    addPage(`Viikkokalenteri ${model.year}, ISO 8601 -viikkonumerot`);
    const { cell, top, columns } = layout.grid;
    const k = cell.height / 150;
    model.months.forEach((month, i) => {
      const x = content.x + (i % columns) * (cell.width + layout.gap.column);
      const y = top + Math.floor(i / columns) * (cell.height + layout.gap.row);
      const colW = cell.width / 8;
      const rowH = 11 * k;
      doc.font(BOLD).fontSize(8.5).fillColor(c.accent).text(month.name, x, y, { width: cell.width, lineBreak: false });
      let cy = y + 12 * k;
      doc.font(BOLD).fontSize(5.5).fillColor(c.inkSoft);
      doc.text("Vk", x, cy, { width: colW, align: "center", lineBreak: false });
      WEEKDAYS_MON_FIRST.forEach((label, d) => doc.text(label, x + colW * (d + 1), cy, { width: colW, align: "center", lineBreak: false }));
      cy += 9 * k;
      for (const row of month.rows) {
        doc.font(BOLD).fontSize(6).fillColor(c.inkSoft).text(String(row.week), x, cy, { width: colW, align: "center", lineBreak: false });
        row.days.forEach((day, col) => {
          if (!day) return;
          const dx = x + colW * (col + 1);
          const style = dayStyle(day, c);
          if (style.fill) doc.rect(dx, cy - 1, colW, rowH).fill(style.fill);
          doc.font(style.bold ? BOLD : REGULAR).fontSize(6.5).fillColor(style.numberColor);
          doc.text(String(day.day), dx, cy, { width: colW, align: "center", lineBreak: false });
          markers(style, dx, cy - 1, colW, rowH);
        });
        cy += rowH;
      }
      // The month's own days (closures, events, paydays...) under the grid.
      const notes = [];
      for (const e of model.events.filter((ev) => NOTE_KINDS.has(ev.kind) && ev.date.getMonth() === i && ev.date.getFullYear() === model.year)) {
        notes.push(`${dm(e.date)}${e.endDate ? `-${dm(e.endDate)}` : ""} ${safe(e.title)}`);
      }
      const room = Math.floor((y + cell.height - cy - 4) / 7);
      doc.font(REGULAR).fontSize(5.5).fillColor(c.ink);
      notes.slice(0, Math.max(0, room)).forEach((text, n) => {
        const line = n === room - 1 && notes.length > room ? `+${notes.length - room + 1} muuta, katso lista` : text;
        const f = fitText(doc, line, cell.width, { size: 5.5, minSize: 5 });
        doc.font(REGULAR).fontSize(f.size).fillColor(c.ink).text(f.text, x, cy + 3 + n * 7, { width: cell.width, lineBreak: false });
      });
    });
    legend(content.x, top + 4 * (cell.height + layout.gap.row) + 2, content.width);

    // List of every date that is not a plain weekday, in as many pages as it needs.
    const rows = model.events.filter((e) => e.kind !== "week");
    if (!rows.length) return;
    const rowH = 12;
    let index = 0;
    while (index < rows.length) {
      addPage(`Päivät ja tapahtumat ${model.year}`);
      let y = 90;
      doc.font(BOLD).fontSize(7.5).fillColor(c.inkSoft);
      doc.text("Päivämäärä", content.x, y, { lineBreak: false });
      doc.text("Tapahtuma", content.x + 110, y, { lineBreak: false });
      doc.text("Laji", right - 110, y, { lineBreak: false });
      y += 12;
      doc.moveTo(content.x, y - 2).lineTo(right, y - 2).lineWidth(0.5).stroke(c.line);
      while (index < rows.length && y + rowH < page.height - 44) {
        const e = rows[index];
        const when = e.endDate ? `${fiLong(e.date)} - ${fiLong(e.endDate)}` : fiLong(e.date);
        doc.font(REGULAR).fontSize(7.5).fillColor(c.ink).text(when, content.x, y, { width: 108, lineBreak: false });
        const t = fitText(doc, safe(e.title), right - 110 - (content.x + 110) - 8, { size: 7.5, minSize: 6 });
        doc.font(REGULAR).fontSize(t.size).fillColor(c.ink).text(t.text, content.x + 110, y, { lineBreak: false });
        doc.font(REGULAR).fontSize(7.5).fillColor(c.inkSoft).text(EVENT_KIND_LABELS_FI[e.kind], right - 110, y, { width: 110, lineBreak: false });
        y += rowH;
        index += 1;
      }
    }
  }

  // ── One month per page ────────────────────────────────────────────────────
  function drawMonthPages() {
    for (const month of model.months) {
      addPage(`${month.name} ${model.year}`);
      const top = 78;
      doc.font(BOLD).fontSize(20).fillColor(c.accent).text(`${month.name} ${model.year}`, content.x, top, { width: content.width, lineBreak: false });
      const gridTop = top + 34;
      const weekW = 38;
      const colW = (content.width - weekW) / 7;
      const bottom = page.height - 60;
      const rowH = (bottom - gridTop - 16) / month.rows.length;
      doc.font(BOLD).fontSize(8).fillColor(c.inkSoft);
      doc.text("Viikko", content.x, gridTop, { width: weekW, align: "center", lineBreak: false });
      WEEKDAYS_MON_FIRST.forEach((label, d) => doc.text(label, content.x + weekW + colW * d, gridTop, { width: colW, align: "center", lineBreak: false }));
      let y = gridTop + 14;
      for (const row of month.rows) {
        doc.rect(content.x, y, weekW, rowH).fill(c.accent);
        const onAccent = readableTextColor(c.accent);
        doc.font(BOLD).fontSize(15).fillColor(onAccent).text(String(row.week), content.x, y + rowH / 2 - 8, { width: weekW, align: "center", lineBreak: false });
        row.days.forEach((day, col) => {
          const x = content.x + weekW + colW * col;
          doc.rect(x, y, colW, rowH).lineWidth(0.4).stroke(c.line);
          if (!day) return;
          const style = dayStyle(day, c);
          if (style.fill) doc.rect(x + 0.2, y + 0.2, colW - 0.4, rowH - 0.4).fill(style.fill);
          doc.font(BOLD).fontSize(12).fillColor(style.numberColor).text(String(day.day), x + 4, y + 3, { width: 24, lineBreak: false });
          markers(style, x, y, colW, rowH);
          const lines = Math.floor((rowH - 20) / 8.5);
          const items = [...day.events]
            .filter((e) => e.kind !== "week")
            .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
          items.slice(0, Math.max(0, lines)).forEach((e, n) => {
            const last = n === lines - 1 && items.length > lines;
            const text = last ? `+${items.length - lines + 1} muuta` : safe(e.title);
            const wrapped = wrapText(doc, text, colW - 8, 1, { size: 6.5 });
            doc.font(e.kind === "holiday" ? BOLD : REGULAR).fontSize(6.5).fillColor(c.ink).text(wrapped[0], x + 4, y + 18 + n * 8.5, { width: colW - 8, lineBreak: false });
          });
        });
        y += rowH;
      }
      legend(content.x, bottom + 4, content.width);
    }
  }

  // ── Week-number list ──────────────────────────────────────────────────────
  function drawWeekList() {
    const weeks = weekList(model);
    const rowH = 15;
    let index = 0;
    while (index < weeks.length) {
      addPage(`Viikkonumerot ${model.year}`);
      let y = 84;
      const cols = { week: content.x, dates: content.x + 42, wd: content.x + 150, notes: content.x + 224 };
      doc.font(BOLD).fontSize(7.5).fillColor(c.inkSoft);
      doc.text("Viikko", cols.week, y, { lineBreak: false });
      doc.text("Päivät", cols.dates, y, { lineBreak: false });
      doc.text(`Työpäiviä ${model.year}`, cols.wd, y, { lineBreak: false });
      doc.text("Merkittävät päivät", cols.notes, y, { lineBreak: false });
      y += 12;
      doc.moveTo(content.x, y - 2).lineTo(right, y - 2).lineWidth(0.5).stroke(c.line);
      while (index < weeks.length && y + rowH < page.height - 44) {
        const w = weeks[index];
        if (index % 2 === 1) doc.rect(content.x, y - 3, content.width, rowH).fill(c.holidayTint);
        doc.font(BOLD).fontSize(10).fillColor(c.accent).text(String(w.week), cols.week, y - 1, { width: 36, lineBreak: false });
        doc.font(REGULAR).fontSize(8).fillColor(c.ink).text(`${dm(w.from)} - ${dm(w.to)}`, cols.dates, y, { width: 114, lineBreak: false });
        doc.text(String(w.workingDays), cols.wd, y, { width: 48, lineBreak: false });
        const summary = w.events.map((e) => safe(e.text)).join("; ");
        const f = fitText(doc, summary, right - cols.notes, { size: 7.5, minSize: 5.5 });
        doc.font(REGULAR).fontSize(f.size).fillColor(c.ink).text(f.text, cols.notes, y + 0.5, { width: right - cols.notes, lineBreak: false });
        y += rowH;
        index += 1;
      }
    }
  }

  if (layout.id === "month-page") drawMonthPages();
  else if (layout.id === "week-list") drawWeekList();
  else drawYearGlance();

  doc.end();
  await finished;
  const size = chunks.reduce((n, ch) => n + ch.length, 0);
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const ch of chunks) {
    bytes.set(ch, at);
    at += ch.length;
  }
  return { bytes, pages: pageNo, warnings };
}
