import { buildXlsx } from "../export/xlsx.js";
import { buildIcs } from "../export/ics.js";
import { utcIcsStamp } from "../export/companyIcs.js";
import { renderTemplatePdf } from "../templates/pdf.js";
import { toDate } from "../calendar/events.js";
import { isoWeek, isoYear } from "../../components/dateUtils.js";
const sheet = (name, headers, rows) => ({ name, columns: headers.map((header) => ({ header, width: 24 })), rows, freezeHeader: true });
const iso = (model, shift) => { const d = toDate(model.local(shift.starts_at).slice(0, 10)); return `${isoWeek(d)}/${isoYear(d)}`; };
const row = (model, s) => [s.member.label, s.template.name, model.local(s.starts_at).replace("T", " "), model.local(s.ends_at).replace("T", " "), iso(model, s), s.conflicts.join(", "), s.notes];
export function shiftWorkbook(model) {
  return { sheets: [sheet("Työvuorot", ["Henkilö", "Vuoro", "Alku (Suomen aika)", "Loppu (Suomen aika)", "ISO-viikko/vuosi", "Huomiot", "Muistiinpanot"], model.shifts.map((s) => row(model, s))), sheet("Päiväkattavuus", ["Päivä", "ISO-viikko", "ISO-vuosi", "Vuorossa päivän aikana", "Vuoroja", "Huomio"], model.days.map((d) => [d.date, d.week, d.weekYear, d.scheduled, d.shifts.length, d.closed ? "Yrityksen sulku" : d.lowShiftCoverage ? "Alle organisaation päivätavoitteen" : ""])), sheet("Esteet", ["Henkilö", "Alku (Suomen aika)", "Loppu (Suomen aika)", "Muistiinpano"], model.availability.map((r) => [model.snapshot.members.find((m) => m.id === r.member_id)?.label, model.local(r.starts_at).replace("T", " "), model.local(r.ends_at).replace("T", " "), r.notes])), sheet("Ohjeet", ["Aihe", "Tieto"], [["Organisaatio", model.snapshot.organization.name], ["Jakso", `${model.from} - ${model.to}`], ["Käyttö", model.disclosure], ["Tietosuoja", "Yksityinen tiedosto. Jaa vain valtuutetuille henkilöille."]])] };
}
export const shiftsToXlsx = (model) => buildXlsx(shiftWorkbook(model));
export const shiftsToIcs = (model, { stamp = utcIcsStamp() } = {}) => buildIcs({ calName: `${model.snapshot.organization.name}: työvuorot`, calDesc: model.disclosure, stamp, refresh: false, events: model.shifts.map((s) => ({ uid: `${model.snapshot.organization.id}-shift-${s.id}@viikkonro.fi`, startsAt: s.starts_at, endsAt: s.ends_at, summary: `${s.member.label}: ${s.template.name}`, description: `ISO ${iso(model, s)}. ${s.conflicts.join(", ")}\n${s.notes}\nYksityinen työvuoro.` })) });
export function renderShiftPdf(model, options) {
  const main = shiftWorkbook(model).sheets[0];
  const groups = new Map();
  for (const d of model.days) {
    const key = `${d.weekYear}/${d.week}`;
    if (!groups.has(key)) groups.set(key, { subtitle: `ISO-viikko ${key}. Suomen aika.`, rows: [] });
    // Each shift is printed once, even if it spans midnight or an ISO boundary.
    for (const s of d.shifts) if (model.local(s.starts_at).slice(0, 10) === d.key || (d.key === model.from && model.local(s.starts_at).slice(0, 10) < model.from)) groups.get(key).rows.push(row(model, s));
  }
  return renderTemplatePdf({ template: { category: "shift-roster", finnishName: "Työvuorosuunnitelma" }, year: model.year, title: `${model.snapshot.organization.name}: työvuorot ${model.from} - ${model.to}`, instructionTitle: "Yksityinen työvuorosuunnitelma", instructions: [model.disclosure, "Jaa tiedosto vain valtuutetuille henkilöille. ICS on tuontitiedosto, ei julkinen tilaus.", ...model.shifts.filter((s) => s.notes).map((s) => `${s.member.label}, ${model.local(s.starts_at)}: ${s.notes}`)], main, groups: [...groups.values(), { subtitle: "Päiväkattavuus: eri henkilöt päivän aikana, ei yhtäaikainen miehitys", rows: model.days.map((d) => [d.key, "", "", "", `${d.week}/${d.weekYear}`, `${d.scheduled} henkilöä / ${d.shifts.length} vuoroa`, d.closed ? "Yrityksen sulku" : d.lowShiftCoverage ? "Alle päivätavoitteen" : ""]) }] }, options);
}
export async function shiftsToPdf(model) { const m = await import("pdfkit/js/pdfkit.standalone.js"); return renderShiftPdf(model, { PDFDocument: m.default ?? m }); }
