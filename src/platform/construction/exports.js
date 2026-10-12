import { buildXlsx } from "../export/xlsx.js";
import { toCsv } from "../export/csv.js";
import { buildIcs } from "../export/ics.js";
import { isCalendarIdentity, utcIcsStamp } from "../export/companyIcs.js";
import { dayKey } from "../calendar/events.js";
import { dmy } from "../../data/planningDates.js";
import { renderTemplatePdf } from "../templates/pdf.js";
import { CONSTRUCTION_TYPES } from "./config.js";
import { constructionWeek, constructionConflicts } from "./model.js";

const sheet = (name, headers, rows) => ({ name, columns: headers.map((header) => ({ header, width: 24 })), rows });
const details = (row) => [row.note, row.subcontractorNote && `Aliurakoitsijahuomio: ${row.subcontractorNote}`, row.weatherRisk && `Sääriski (oma huomio): ${row.weatherRisk}`].filter(Boolean);
export function constructionWorkbook(model) {
  return { sheets: [
    sheet("Projekti", ["Tieto", "Arvo"], [["Projekti", model.config.projectName], ["Työmaa", model.config.siteName], ["Alku", model.start], ["Loppu", model.end], ["Työpäiviä ennen taukoja", model.workingDays], ["Työpäiviä taukojen jälkeen", model.availableDays], ["Aliurakoitsijahuomiot", model.config.subcontractorNotes], ["Sääriskit (omat huomiot)", model.config.weatherNotes], ["Päiväsääntö", model.disclosure]]),
    sheet("Viikot", ["ISO-viikko", "ISO-viikkovuosi", "Alku", "Loppu", "Työpäiviä", "Taukopäiviä", "Käytettävissä", "Pyhäpäivät"], model.weeks.map((week) => [week.week, week.year, week.from, week.to, week.workingDays, week.shutdownDays, week.availableDays, week.holidays.map((h) => `${h.name} ${dmy(h.date)}`).join(", ")])),
    sheet("Merkinnät", ["Tunniste", "Laji", "Nimi", "Alku", "Loppu", "ISO-viikko alussa", "ISO-vuosi alussa", "Huomautus", "Aliurakoitsijahuomio", "Sääriski (oma huomio)"], model.records.map((row) => [row.id, CONSTRUCTION_TYPES[row.type], row.label, row.from, row.to, row.week, row.weekYear, row.note, row.subcontractorNote, row.weatherRisk])),
    sheet("Pyhäpäivät", ["Päivä", "Nimi"], model.holidays.map((h) => [h.date, h.name])),
  ] };
}
export const constructionToXlsx = (model) => buildXlsx(constructionWorkbook(model));
export function constructionToCsv(model) {
  const headers = ["Projekti", "Työmaa", "ISO-viikko", "ISO-viikkovuosi", "Viikon alku", "Viikon loppu", "Työpäiviä taukojen jälkeen", "Laji", "Merkintä", "Merkinnän alku", "Merkinnän loppu", "Huomautus", "Aliurakoitsijahuomio", "Sääriski (oma huomio)", "Pyhäpäivät", "Projektin aliurakoitsijahuomiot", "Projektin sääriskihuomiot"];
  const rows = model.weeks.flatMap((week) => (week.records.length ? week.records : [null]).map((row) => [model.config.projectName, model.config.siteName, week.week, week.year, dayKey(week.from), dayKey(week.to), week.availableDays, row ? CONSTRUCTION_TYPES[row.type] : "", row?.label ?? "", row?.start ?? "", row?.end ?? "", row?.note ?? "", row?.subcontractorNote ?? "", row?.weatherRisk ?? "", week.holidays.map((h) => `${h.name} ${dmy(h.date)}`).join(", "), model.config.subcontractorNotes, model.config.weatherNotes]));
  return toCsv([headers, ...rows], { delimiter: ";", eol: "\r\n", bom: true, escapeFormulas: true });
}
export function constructionToIcs(model, { calendarId, stamp = utcIcsStamp() } = {}) {
  if (!isCalendarIdentity(calendarId) || !/^\d{8}T\d{6}Z$/.test(stamp)) throw new Error("Invalid private calendar identity or timestamp.");
  const events = model.records.map((row) => ({ uid: `${calendarId}-construction-${row.id}@viikkonro.fi`, date: row.from, endDate: row.to, summary: `${CONSTRUCTION_TYPES[row.type]}: ${row.label}`, description: details(row).join("\n") }));
  for (const holiday of model.holidays) events.push({ uid: `${calendarId}-holiday-${dayKey(holiday.date)}@viikkonro.fi`, date: holiday.date, summary: holiday.name });
  for (const week of model.weeks) events.push({ uid: `${calendarId}-week-${week.year}-${week.week}@viikkonro.fi`, date: week.from, summary: `ISO-viikko ${week.week}/${week.year}`, description: `${week.availableDays} työpäivää taukojen jälkeen.` });
  return buildIcs({ calName: `${model.config.projectName}${model.config.siteName ? ` | ${model.config.siteName}` : ""}`, calDesc: [model.disclosure, model.config.subcontractorNotes, model.config.weatherNotes && `Sääriskit (omat huomiot): ${model.config.weatherNotes}`].filter(Boolean).join("\n"), events, stamp, refresh: false });
}
export async function renderConstructionPdf(model, { weekKey, ...options } = {}) {
  const weekly = model.config.layout === "weekly", week = constructionWeek(model, weekKey);
  const records = weekly ? week.records : model.records;
  const conflicts = constructionConflicts(model, weekly ? week.key : null);
  const instructions = [model.disclosure, `Projekti: ${model.config.projectName}. Työmaa: ${model.config.siteName || "ei määritelty"}.`,
    `Projektijakso ${dmy(model.start)}-${dmy(model.end)}. Työpäiviä ennen taukoja ${model.workingDays}, taukojen jälkeen ${model.availableDays}. Tauot eivät siirrä merkintöjen päivämääriä.`,
    ...(weekly ? [`ISO-viikko ${week.week}/${week.year}, ${dmy(week.from)}-${dmy(week.to)}: ${week.availableDays} työpäivää taukojen jälkeen.`, ...week.holidays.map((h) => `${h.name}: ${dmy(h.date)}.`)] : []),
    ...(model.config.subcontractorNotes ? [`Aliurakoitsijahuomiot: ${model.config.subcontractorNotes}`] : []),
    ...(model.config.weatherNotes ? [`Sääriskit (omat huomiot): ${model.config.weatherNotes}`] : []),
    ...conflicts.map((row) => `Tauon kanssa päällekkäin: ${row.label}. Tarkista ajoitus.`),
    ...records.flatMap((row) => [`${CONSTRUCTION_TYPES[row.type]}: ${row.label}, ${dmy(row.from)}-${dmy(row.to)}, ISO-viikko alussa ${row.week}/${row.weekYear}.`, ...details(row)])];
  const main = sheet("Aikataulu", ["Laji", "Merkintä", "Alku", "Loppu", "Huomiot"], records.map((row) => [CONSTRUCTION_TYPES[row.type], row.label, row.from, row.to, details(row).join(" ")]));
  const groups = [{ subtitle: weekly ? `Viikkoaikataulu: ISO-viikko ${week.week}/${week.year}, ${dmy(week.from)}-${dmy(week.to)}.` : `Projektin merkinnät ${dmy(model.start)}-${dmy(model.end)}.`, rows: main.rows }];
  if (!weekly) groups.push({ subtitle: "Projektin ISO-viikot. Työpäivät ja tauot näkyvät Excelissä erillisissä sarakkeissa.", rows: model.weeks.map((w) => ["ISO-viikko", `${w.week}/${w.year}`, w.from, w.to, `${w.availableDays} työpäivää taukojen jälkeen. ${w.holidays.map((h) => h.name).join(", ")}`]) });
  return renderTemplatePdf({ template: { category: "construction", finnishName: model.config.projectName }, year: model.start.getFullYear(), title: model.config.projectName, instructionTitle: weekly ? `Viikko ${week.week}/${week.year}: tiedot ja huomiot` : "Projektin tiedot ja huomiot", main, instructions, groups }, options);
}
export async function constructionToPdf(model, options = {}) {
  const pdfkit = await import("pdfkit/js/pdfkit.standalone.js");
  return renderConstructionPdf(model, { ...options, PDFDocument: pdfkit.default ?? pdfkit });
}
