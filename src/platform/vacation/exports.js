import { buildXlsx } from "../export/xlsx.js";
import { calendarTable, TABLE_HEADER } from "../export/calendar.js";
import { companyCalendarToIcs } from "../export/companyIcs.js";
import { toDate } from "../calendar/events.js";

export function vacationWorkbook(model) {
  const { config } = model;
  return { sheets: [
    { name: "Yhteenveto", columns: ["Henkilö", "Loman laskentapäiviä", "Muun poissaolon työpäiviä", "Työpäiviä ennen poissaoloja", "Käytettävissä olevia työpäiviä", "Päällekkäisiä kalenteripäiviä"].map((header) => ({ header, width: 28 })),
      rows: model.summaries.map((person) => [person.label, person.vacationDays, person.absenceDays, person.workingDays, person.availableDays, person.overlapDays]) },
    { name: "Jaksot", columns: ["Henkilö", "Laji", "Nimi", "Alkaa", "Päättyy", "Koko jakson laskentapäiviä", "Huomautus"].map((header) => ({ header, width: 25 })),
      rows: model.periods.map((period) => [period.person, period.type === "vacation" ? "Loma" : "Muu poissaolo", period.label, toDate(period.start), toDate(period.end), period.counted, period.note]) },
    { name: "Sulkupäivät", columns: ["Nimi", "Alkaa", "Päättyy", "Huomautus"].map((header) => ({ header, width: 30 })), rows: config.closures.map((period) => [period.label, toDate(period.start), toDate(period.end), period.note]) },
    { name: "Kalenteri", columns: TABLE_HEADER.map((header) => ({ header, width: 25 })), rows: calendarTable(model.calendar, { dates: "date" }) },
    { name: "Ohjeet", columns: [{ header: "Laskentatapa ja huomautukset", width: 100 }], rows: [
      [model.disclosure], [model.workDisclosure],
      ["Yhteenveto koskee vain valittua kalenterivuotta ja laskee saman päivän vain kerran. Jaksot-sivu kertoo koko jakson päivät; rivejä ei pidä summata päällekkäisissä jaksoissa."],
      ["Sulkupäivät vähentävät suunnittelun työpäiviä. Vuosilomalain laskentatavassa ne eivät automaattisesti vähennä loman kulutusta. Muut poissaolot eivät kuluta lomapäiviä tässä suunnitelmassa."], [config.notes],
    ] },
  ] };
}
export const vacationToXlsx = (model) => buildXlsx(vacationWorkbook(model));
export function vacationToIcs(model, options = {}) {
  return companyCalendarToIcs(model.calendar, { ...options, calendarId: model.config.calendarId,
    description: `Lomasuunnitelma ${model.config.year}. ${model.disclosure} ${model.config.notes}` });
}
