import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { describe, expect, it } from "vitest";
import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel, weekList } from "../calendar/model.js";
import { renderCalendarPdf } from "./pdf.js";
import { dayStyle, legendKinds } from "./dayStyle.js";
import { prepareLogoForPdf } from "./logo.js";
import { fitText, pdfSafe, wrapText } from "./text.js";
import { THEMES } from "../design/themes.js";

// An 8x4 red PNG: a real, valid image small enough to live in a test.
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAAAEUlEQVR4nGM4ISeHFTFQTwIAbv4ggUBHKgEAAAAASUVORK5CYII=";
const generatedOn = new Date(2026, 9, 7, 12, 0, 0);

const hasPdftotext = spawnSync("pdftotext", ["-v"]).status !== null;
function pdfText(bytes) {
  const dir = mkdtempSync(join(tmpdir(), "yk-"));
  try {
    writeFileSync(join(dir, "a.pdf"), bytes);
    return spawnSync("pdftotext", ["-layout", join(dir, "a.pdf"), "-"], { encoding: "utf8" }).stdout;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const latin1 = (bytes) => Buffer.from(bytes).toString("latin1");
const mediaBox = (bytes) => [...latin1(bytes).matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map((m) => [Number(m[1]), Number(m[2])]);

async function render(input, options = {}) {
  const model = buildCalendarModel(createCalendarConfig({ year: 2027, ...input }));
  return renderCalendarPdf(model, { PDFDocument, generatedOn, ...options });
}

describe("PDF renderer: structure", () => {
  it("writes a valid PDF in every layout for 2026, 2027 and 2028", async () => {
    const expectedPages = { "year-glance": 2, "month-page": 12, "week-list": 2 };
    for (const year of [2026, 2027, 2028]) {
      for (const id of Object.keys(expectedPages)) {
        const r = await render({ year, layout: { id } });
        expect(latin1(r.bytes.subarray(0, 5)), `${id} ${year}`).toBe("%PDF-");
        expect(latin1(r.bytes.subarray(-8))).toContain("%%EOF");
        expect(r.pages, `${id} ${year}`).toBe(expectedPages[id]);
        expect(r.warnings).toEqual([]);
      }
    }
  });
  it("uses A4 portrait, A4 landscape and A3 page sizes", async () => {
    expect(mediaBox((await render({})).bytes)[0]).toEqual([595.28, 841.89]);
    expect(mediaBox((await render({ layout: { id: "month-page" } })).bytes)[0]).toEqual([841.89, 595.28]);
    expect(mediaBox((await render({ layout: { id: "week-list", paper: "A3" } })).bytes)[0]).toEqual([841.89, 1190.55]);
    expect(mediaBox((await render({ layout: { id: "year-glance", orientation: "landscape" } })).bytes)[0]).toEqual([841.89, 595.28]);
  });
  it("is deterministic for the same input and date", async () => {
    const a = await render({ branding: { companyName: "Oy Testi Ab" } });
    const b = await render({ branding: { companyName: "Oy Testi Ab" } });
    expect(Buffer.from(a.bytes).equals(Buffer.from(b.bytes))).toBe(true);
  });
  it("needs a PDFDocument constructor", async () => {
    const model = buildCalendarModel(createCalendarConfig({ year: 2027 }));
    await expect(renderCalendarPdf(model, {})).rejects.toThrow(/PDFDocument/);
  });
  it("puts the company and year in the document title", async () => {
    const r = await render({ branding: { companyName: "Oy Testi Ab" } });
    expect(latin1(r.bytes)).toContain("Oy Testi Ab - Kalenteri 2027");
  });
});

describe.skipIf(!hasPdftotext)("PDF renderer: text", () => {
  it("draws Finnish letters, the company, events and ISO week numbers", async () => {
    const r = await render({
      branding: { companyName: "Äänekosken Työläiset Oy – Ylä-Pohjanmaa" },
      include: { paydays: { day: 15 }, flagDays: true },
      periods: [{ label: "Kesäsulku", start: "2027-07-05", end: "2027-07-30" }],
      events: [{ date: "2027-05-12", title: "Yhtiökokous ja kevätjuhla" }],
    });
    const text = pdfText(r.bytes);
    for (const needle of ["Äänekosken Työläiset Oy", "Ylä-Pohjanmaa", "Kesäsulku", "Yhtiökokous ja kevätjuhla", "Uudenvuodenpäivä", "Palkkapäivä", "pääsiäispäivä"]) {
      expect(text, needle).toContain(needle);
    }
    expect(text).toContain("Vk");
    expect(text).toMatch(/Tammikuu[\s\S]*53/); // 1 Jan 2027 belongs to ISO week 53 of 2026
  });
  it("shows the week-number list with every ISO week and the year's working days", async () => {
    const text = pdfText((await render({ layout: { id: "week-list" } })).bytes);
    expect(text).toContain("Viikkonumerot 2027");
    expect(text).toContain("Työpäiviä 2027");
    for (const week of ["53", "1", "26", "52"]) expect(text).toMatch(new RegExp(`^${week}\\s`, "m"));
    expect(text).toContain("Loppiainen 6.1.");
  });
  it("includes 29 February in a leap year and a month-per-page calendar for it", async () => {
    const r = await render({ year: 2028, layout: { id: "month-page" }, events: [{ date: "2028-02-29", title: "Karkauspäivän tapahtuma" }] });
    expect(r.pages).toBe(12);
    const text = pdfText(r.bytes);
    expect(text).toContain("Helmikuu 2028");
    expect(text).toContain("Karkauspäivän tapahtuma");
    expect(text).toMatch(/\b29\b/);
    const nonLeap = pdfText((await render({ year: 2027, layout: { id: "month-page" } })).bytes);
    expect(nonLeap.split("Helmikuu 2027")[1].split("Maaliskuu 2027")[0]).not.toMatch(/\b29\b/);
  });
  it("handles a closure that crosses a year boundary in both directions", async () => {
    const r = await render({
      periods: [
        { label: "Vuodenvaihteen sulku", start: "2026-12-28", end: "2027-01-05" },
        { label: "Joulusulku", start: "2027-12-23", end: "2028-01-09" },
      ],
    });
    const text = pdfText(r.bytes);
    expect(text).toContain("Vuodenvaihteen sulku");
    expect(text).toContain("Joulusulku");
  });
});

describe("PDF renderer: robustness", () => {
  it("keeps a very long company name inside the page", async () => {
    const long = "Pohjois-Karjalan Maatalous- ja Metsäkonekeskus Osuuskunta Yhteistyökumppanit ".repeat(4).trim();
    for (const id of ["year-glance", "month-page", "week-list"]) {
      const r = await render({ layout: { id }, branding: { companyName: long.slice(0, 80) } });
      expect(r.pages).toBe({ "year-glance": 2, "month-page": 12, "week-list": 2 }[id]);
    }
    const oneWord = await render({ branding: { companyName: "X".repeat(80) } });
    expect(oneWord.bytes.length).toBeGreaterThan(1000);
  });
  it("renders without a logo, with a PNG logo, and reports a broken logo without failing", async () => {
    const none = await render({});
    const png = await render({ branding: { companyName: "Oy Testi" } }, { logo: PNG });
    expect(latin1(png.bytes)).toContain("/Subtype /Image");
    expect(latin1(none.bytes)).not.toContain("/Subtype /Image");
    const broken = await render({}, { logo: "data:image/png;base64,AAAA" });
    expect(broken.warnings).toContain("Logoa ei voitu lisätä PDF-tiedostoon.");
    expect(latin1(broken.bytes.subarray(0, 5))).toBe("%PDF-");
  });
  it("prepares logos: PNG passes through, SVG goes through the rasteriser, failures become warnings", async () => {
    expect(await prepareLogoForPdf(null)).toEqual({ src: null, warning: null });
    expect(await prepareLogoForPdf({ mime: "image/png", dataUri: PNG })).toEqual({ src: PNG, warning: null });
    const svg = { mime: "image/svg+xml", dataUri: "data:image/svg+xml;base64,PHN2Zy8+" };
    expect(await prepareLogoForPdf(svg, async () => PNG)).toEqual({ src: PNG, warning: null });
    expect((await prepareLogoForPdf(svg)).warning).toMatch(/SVG/);
    expect((await prepareLogoForPdf(svg, async () => { throw new Error("no canvas"); })).warning).toMatch(/SVG/);
  });
  it("replaces characters the PDF font cannot draw and says so", async () => {
    const r = await render({ branding: { companyName: "Ōsaka 東京 Oy" }, events: [{ date: "2027-03-03", title: "Päivä 🎉" }] });
    expect(r.warnings).toEqual(["Joitakin merkkejä ei voi tulostaa PDF:ään, ne on korvattu merkillä ?."]);
  });
  it("copes with hundreds of events, many on the same day", async () => {
    const events = Array.from({ length: 300 }, (_, i) => ({ date: `2027-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 4) + 10)}`, title: `Tapahtuma numero ${i + 1} jolla on pitkä nimi` }));
    for (const id of ["year-glance", "month-page", "week-list"]) {
      const r = await render({ layout: { id }, events });
      expect(latin1(r.bytes.subarray(0, 5))).toBe("%PDF-");
      expect(r.pages).toBeGreaterThanOrEqual({ "year-glance": 4, "month-page": 12, "week-list": 2 }[id]);
    }
  });
  it("handles overlapping closures, leave, season, school holidays and events on the same days", async () => {
    const input = {
      include: { schoolHolidays: { city: "Helsinki" }, flagDays: true, paydays: { day: 15 } },
      periods: [
        { id: "a", label: "Sulku", start: "2027-02-22", end: "2027-03-05", kind: "closure" },
        { id: "b", label: "Loma", start: "2027-02-24", end: "2027-03-02", kind: "leave" },
        { id: "c", label: "Lomakausi", start: "2027-02-01", end: "2027-03-31", kind: "season" },
      ],
      events: [{ date: "2027-02-25", title: "Henkilöstöpäivä" }, { date: "2027-02-25", title: "Palaveri" }],
    };
    const model = buildCalendarModel(createCalendarConfig({ year: 2027, ...input }));
    const day = model.months[1].rows.flatMap((r) => r.days).find((d) => d?.key === "2027-02-25");
    expect(day.events.map((e) => e.kind)).toEqual(expect.arrayContaining(["closure", "leave", "season", "school", "company"]));
    expect(dayStyle(day, THEMES.classic.colors).fill).toBe(THEMES.classic.colors.closureTint); // closure wins
    for (const id of ["year-glance", "month-page", "week-list"]) {
      const r = await renderCalendarPdf(buildCalendarModel(createCalendarConfig({ year: 2027, layout: { id }, ...input })), { PDFDocument, generatedOn });
      expect(r.pages).toBeGreaterThan(0);
    }
  });
});

describe("day styling and the week list", () => {
  const colors = THEMES.classic.colors;
  const day = (date, kinds) => ({ date, events: kinds.map((kind) => ({ kind })) });
  it("lets the strongest range win and keeps markers independent", () => {
    expect(dayStyle(day(new Date(2027, 1, 24), ["season", "leave"]), colors).fill).toBe(colors.leaveTint);
    expect(dayStyle(day(new Date(2027, 1, 24), ["school", "season"]), colors).fill).toBe(colors.seasonTint);
    expect(dayStyle(day(new Date(2027, 1, 24), ["school"]), colors).fill).toBe(colors.schoolTint);
    const holiday = dayStyle(day(new Date(2027, 0, 6), ["holiday", "flag-day", "payday", "company"]), colors);
    expect(holiday).toMatchObject({ fill: colors.holidayTint, bold: true, flag: true, payday: true, company: true });
    expect(dayStyle(day(new Date(2027, 1, 28), []), colors)).toMatchObject({ numberColor: colors.weekendText, fill: null }); // Sunday
  });
  it("lists only the kinds that are present in the legend", () => {
    expect(legendKinds({ events: [{ kind: "week" }, { kind: "holiday" }] })).toEqual(["holiday"]);
    expect(legendKinds({ events: [] })).toEqual([]);
  });
  it("covers every ISO week touching the year, counting only days inside it", () => {
    const model = buildCalendarModel(createCalendarConfig({ year: 2027 }));
    const weeks = weekList(model);
    expect(weeks).toHaveLength(53);
    expect(weeks[0]).toMatchObject({ week: 53, weekYear: 2026, workingDays: 0 }); // 1 Jan is a holiday, 2-3 Jan a weekend
    expect(weeks[1]).toMatchObject({ week: 1, weekYear: 2027, workingDays: 4 }); // 6 Jan is a holiday
    expect(weeks.at(-1)).toMatchObject({ week: 52, weekYear: 2027 });
    expect(weeks.every((w) => w.from.getDay() === 1 && w.to.getDay() === 0)).toBe(true);
    const leap = weekList(buildCalendarModel(createCalendarConfig({ year: 2028 })));
    expect(leap[0]).toMatchObject({ week: 52, weekYear: 2027 });
    expect(leap.some((w) => w.days.some((d) => d.date.getMonth() === 1 && d.date.getDate() === 29))).toBe(true);
  });
});

describe("text helpers", () => {
  it("keeps every Finnish letter and the euro sign", () => {
    expect(pdfSafe("Äiti ööliä åke Ä Ö Å €5 “lainaus” – kevät")).toEqual({ text: "Äiti ööliä åke Ä Ö Å €5 “lainaus” – kevät", replaced: false });
  });
  it("strips accents it can, marks the rest, and removes control characters", () => {
    expect(pdfSafe("Łódź")).toEqual({ text: "?ódz", replaced: true });
    expect(pdfSafe("日本")).toEqual({ text: "??", replaced: true });
    expect(pdfSafe("a\u0000b\tc\n d")).toEqual({ text: "a b c d", replaced: false });
    expect(pdfSafe("ä").text).toBe("ä"); // decomposed letters are recomposed
    expect(pdfSafe(null).text).toBe("");
  });
  it("shrinks, then cuts, text that is too wide", () => {
    const doc = new PDFDocument();
    const fit = fitText(doc, "Hyvin pitkä yrityksen nimi joka ei mahdu", 100, { size: 12, minSize: 8 });
    doc.font("Helvetica").fontSize(fit.size);
    expect(doc.widthOfString(fit.text)).toBeLessThanOrEqual(100);
    expect(fit.text.endsWith("…")).toBe(true);
    expect(fitText(doc, "Lyhyt", 200, { size: 12 })).toEqual({ text: "Lyhyt", size: 12 });
  });
  it("wraps text into at most the allowed lines and breaks an over-long word", () => {
    const doc = new PDFDocument();
    const lines = wrapText(doc, "Yhtiökokous ja kevätjuhla koko henkilökunnalle sekä sidosryhmille", 70, 3, { size: 8 });
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.at(-1).endsWith("…")).toBe(true);
    doc.font("Helvetica").fontSize(8);
    for (const l of lines) expect(doc.widthOfString(l)).toBeLessThanOrEqual(70);
    const word = wrapText(doc, "X".repeat(60), 50, 5, { size: 8 });
    expect(word.length).toBeGreaterThan(1);
    for (const l of word) expect(doc.widthOfString(l)).toBeLessThanOrEqual(50);
  });
});
