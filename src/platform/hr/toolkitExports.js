import { buildXlsx } from "../export/xlsx.js";
import { buildIcs } from "../export/ics.js";
import { isCalendarIdentity, utcIcsStamp } from "../export/companyIcs.js";
import { renderTemplatePdf } from "../templates/pdf.js";
import { toolkitRecordDescription, TOOLKIT_CLASSIFICATIONS } from "./toolkit.js";
const sheet = (name, headers, rows) => ({ name, columns: headers.map((header) => ({ header, width: 28 })), rows, freezeHeader: true });
export function toolkitWorkbook(model) {
  return { sheets: [sheet("Suunnitelma", ["Päivä", "Vuosi", "ISO-viikko", "ISO-vuosi", "Tehtävä", "Luokitus", "Peruste", "Lähde", "Lähteen osoite", "Tarkistettu", "Selitys ja huomiot"], model.records.map((r) => [r.date, r.applicableYear, r.week, r.weekYear, r.label, TOOLKIT_CLASSIFICATIONS[r.classification], r.reference, r.source.name, r.source.url, r.source.reviewed, toolkitRecordDescription(r)])), sheet("Ohjeet", ["Aihe", "Tieto"], [["Suunnitelma", model.title], ["Ankkuripäivä", model.anchor], ["Rajaus", model.disclosure]])] };
}
export const toolkitToXlsx = (model) => buildXlsx(toolkitWorkbook(model));
export function toolkitToIcs(model, { calendarId, stamp = utcIcsStamp() } = {}) {
  if (!isCalendarIdentity(calendarId)) throw new Error("Invalid private calendar identity.");
  return buildIcs({ calName: model.title, calDesc: model.disclosure, stamp, refresh: false, events: model.records.map((r) => ({ uid: `${calendarId}-${r.id}@viikkonro.fi`, date: r.date, summary: `[${TOOLKIT_CLASSIFICATIONS[r.classification]}] ${r.label}`, description: toolkitRecordDescription(r) })) });
}
export function renderToolkitPdf(model, options) {
  const main = sheet("HR-malli", ["Päivä", "Vuosi / ISO", "Tehtävä", "Luokitus", "Huomio"], model.records.map((r) => [r.date, `${r.applicableYear} / ${r.week}/${r.weekYear}`, r.label, TOOLKIT_CLASSIFICATIONS[r.classification], r.caution]));
  return renderTemplatePdf({ template: { category: "hr-toolkit", finnishName: model.title }, year: model.years[0], title: `${model.title}: ${model.anchor}`, instructionTitle: "Mallin rajaus, päivien lähteet ja perusteet", instructions: [model.disclosure, ...model.records.map((r) => `${r.label} ${r.start}: ${toolkitRecordDescription(r)}`)], main, subtitle: "Koko suunnitelma vuodenvaihteen yli. ISO-viikot ja kalenterivuosi." }, options);
}
export async function toolkitToPdf(model) { const m = await import("pdfkit/js/pdfkit.standalone.js"); return renderToolkitPdf(model, { PDFDocument: m.default ?? m }); }
