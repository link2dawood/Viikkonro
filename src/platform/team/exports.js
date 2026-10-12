import { buildXlsx } from "../export/xlsx.js";
import { buildIcs } from "../export/ics.js";
import { utcIcsStamp } from "../export/companyIcs.js";
import { renderTemplatePdf } from "../templates/pdf.js";
import { toDate } from "../calendar/events.js";
import { isoWeek, isoYear } from "../../components/dateUtils.js";
const sheet = (name, headers, rows) => ({ name, columns: headers.map((header) => ({ header, width: 24 })), rows, freezeHeader: true });
export function teamWorkbook(model) {
  return { sheets: [sheet("Saatavuus", ["Päivä", "ISO-viikko", "ISO-viikkovuosi", "Jäseniä", "Poissa", "Saatavilla", "Tila"], model.days.map((d) => [d.date, d.week, d.weekYear, model.members.length, d.absent, d.available, d.closed ? "Yrityksen sulku" : !d.working ? "Ei suunnittelutyöpäivä" : d.lowCoverage ? "Alle tavoitteen" : ""])),
    sheet("Poissaolot ja kalenteri", ["Alku", "Loppu", "Merkintä", "Tila"], model.records.map((r) => [toDate(r.start_date), toDate(r.end_date), r.label, r.description])),
    sheet("Ohjeet", ["Aihe", "Tieto"], [["Organisaatio", model.snapshot.organization.name], ["Vuosi", model.calendar.year], ["Rajaus", model.departmentId ? "Valittu osasto" : "Koko tiimi"], ["Odottavat pyynnöt", model.includePending ? "Mukana, alustava suunnitelma" : "Vain hyväksytyt"], ["Suunnittelusääntö", model.disclosure], ["Tietosuoja", "Yksityinen tiedosto. Jaa vain henkilöille, joilla on oikeus näihin tietoihin."]])] };
}
export const teamToXlsx = (model) => buildXlsx(teamWorkbook(model));
export function teamToIcs(model, { stamp = utcIcsStamp() } = {}) {
  const id = model.snapshot.organization.id;
  return buildIcs({ calName: `${model.snapshot.organization.name} ${model.calendar.year}`, calDesc: model.disclosure, refresh: false, stamp,
    events: model.records.map((r) => ({ uid: `${id}-team-${r.id}@viikkonro.fi`, date: toDate(r.start_date), endDate: toDate(r.end_date), summary: r.label, description: `${r.description}\nISO-viikko ${isoWeek(toDate(r.start_date))}/${isoYear(toDate(r.start_date))}. Yksityinen tiimikalenteri.` })) });
}
export function renderTeamPdf(model, options) {
  const main = sheet("Tiimi", ["Alku", "Loppu", "ISO", "Merkintä", "Tila"], model.records.map((r) => [toDate(r.start_date), toDate(r.end_date), `${isoWeek(toDate(r.start_date))}/${isoYear(toDate(r.start_date))}`, r.label, r.description]));
  return renderTemplatePdf({ template: { category: "team", finnishName: "Tiimin lomasuunnitelma" }, year: model.calendar.year, title: `${model.snapshot.organization.name} ${model.calendar.year}`, instructionTitle: "Yksityinen tiimin suunnitelma", instructions: [model.disclosure, "Jaa tiedosto vain henkilöille, joilla on oikeus nähdä sen tiedot. ICS on tuontitiedosto, ei julkinen kalenteritilaus.", model.includePending ? "Odottavat pyynnöt ovat mukana alustavassa saatavuusarviossa." : "Mukana vain hyväksytyt poissaolot.", model.departmentId ? "Rajaus: valittu osasto. Organisaation vähimmäiskattavuutta ei sovelleta osastorajaukseen." : `Koko tiimi. Saatavuustavoite ${model.snapshot.organization.min_coverage} henkilöä.`, ...model.records.map((r) => `${r.label}: ${r.start_date}-${r.end_date}, ${r.description}.`)], main,
    groups: [{ subtitle: "Poissaolot, yrityksen sulut ja pyhäpäivät", rows: main.rows }, { subtitle: "Työpäivien saatavuus", rows: model.days.filter((d) => d.working).map((d) => [d.date, d.date, `${d.week}/${d.weekYear}`, `${d.available}/${model.members.length} saatavilla`, `${d.lowCoverage ? "Alle tavoitteen. " : ""}${d.duplicates.length ? "Päällekkäisiä saman henkilön jaksoja" : ""}`]) }] }, options);
}
export async function teamToPdf(model) { const module = await import("pdfkit/js/pdfkit.standalone.js"); return renderTeamPdf(model, { PDFDocument: module.default ?? module }); }
