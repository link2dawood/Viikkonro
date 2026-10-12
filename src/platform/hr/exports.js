import { buildXlsx } from "../export/xlsx.js";
import { buildIcs } from "../export/ics.js";
import { isCalendarIdentity, utcIcsStamp } from "../export/companyIcs.js";
import { calendarTable, TABLE_HEADER } from "../export/calendar.js";
import { toDate } from "../calendar/events.js";
import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { renderTemplatePdf } from "../templates/pdf.js";
import { HR_EVENT_TYPES, HR_ORIGINS } from "./eventTypes.js";
import { HR_LEGAL_SOURCE } from "./statutory.js";
import { hrRecordDescription } from "./model.js";
const sheet = (name, headers, rows) => ({ name, columns: headers.map((header) => ({ header, width: 28 })), rows, freezeHeader: true });
export function hrWorkbook(model) {
  const rows = model.records.map((r) => [toDate(r.start), toDate(r.end), isoWeek(toDate(r.start)), isoYear(toDate(r.start)), r.label, HR_EVENT_TYPES[r.type] ?? (r.type === "holiday" ? "Pyhäpäivä" : "Lakimuistutus"), HR_ORIGINS[r.origin], r.reference ?? "", r.url ?? "", r.reviewed ?? "", hrRecordDescription(r)]);
  const days = calendarTable(model.calendar, { dates: "date" });
  return { sheets: [sheet("Merkinnät", ["Alku", "Loppu", "ISO-viikko", "ISO-viikkovuosi", "Merkintä", "Laji", "Alkuperä", "Viite", "Lähde", "Tarkistettu", "Huomautus"], rows), sheet("Kalenteri", TABLE_HEADER, days), sheet("Ohjeet", ["Aihe", "Tieto"], [["Yritys", model.config.companyName], ["Vuosi", model.config.year], ["Varoitus", model.warning], ["Lakilähde", HR_LEGAL_SOURCE.url], ["Lähteen tarkistus", HR_LEGAL_SOURCE.reviewed], ["Muistutukset", model.config.statutory ? "Käytössä" : "Ei käytössä"], ["Tietosuoja", "Vain selaimessa. ICS on yksityinen tuontitiedosto, ei päivittyvä tilaus."]])] };
}
export const hrToXlsx = (model) => buildXlsx(hrWorkbook(model));
export function hrToIcs(model, { calendarId, stamp = utcIcsStamp() } = {}) {
  if (!isCalendarIdentity(calendarId) || !/^\d{8}T\d{6}Z$/.test(stamp)) throw new Error("Invalid private calendar identity or timestamp.");
  const events = model.records.map((r) => ({ uid: `${calendarId}-hr-${r.id}@viikkonro.fi`, date: toDate(r.start), endDate: toDate(r.end), summary: `[${HR_ORIGINS[r.origin]}] ${r.label}`, description: hrRecordDescription(r) }));
  for (const w of model.weeks) events.push({ uid: `${calendarId}-hr-week-${w.weekYear}-${w.week}@viikkonro.fi`, date: w.from, summary: `ISO-viikko ${w.week}/${w.weekYear}` });
  return buildIcs({ calName: `${model.config.companyName || "HR-kalenteri"} ${model.config.year}`, calDesc: model.warning, events, stamp, refresh: false });
}
export function renderHrPdf(model, options) {
  const main = sheet("HR", ["Alku", "Loppu", "ISO", "Merkintä", "Alkuperä"], model.records.map((r) => [toDate(r.start), toDate(r.end), `${isoWeek(toDate(r.start))}/${isoYear(toDate(r.start))}`, r.label, HR_ORIGINS[r.origin]]));
  return renderTemplatePdf({ template: { category: "hr", finnishName: "HR-kalenteri" }, year: model.config.year, title: `${model.config.companyName || "HR-kalenteri"} ${model.config.year}`, instructionTitle: "Soveltuvuus, lähteet ja omat huomiot", instructions: [model.warning, "Yleiset pyhäpäivät eivät yksin ratkaise työvelvoitetta tai palkkaa. Yrityksen omat päivät ja TES-merkinnät ovat käyttäjän antamia.", ...model.records.filter((r) => r.origin !== "calendar").map((r) => `${r.label} (${r.start}-${r.end}): ${hrRecordDescription(r)}`)], main, groups: [{ subtitle: "Vuoden HR-merkinnät ja niiden alkuperä", rows: main.rows }, { subtitle: "ISO-viikot ja viikon merkinnät", rows: model.weeks.map((w) => [w.from, w.to, `${w.week}/${w.weekYear}`, w.events.map((e) => e.title).join("; "), "Viikkonäkymä"]) }] }, options);
}
export async function hrToPdf(model) { const module = await import("pdfkit/js/pdfkit.standalone.js"); return renderHrPdf(model, { PDFDocument: module.default ?? module }); }
