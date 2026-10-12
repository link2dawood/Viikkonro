import { buildXlsx } from "../export/xlsx.js";
import { buildIcs } from "../export/ics.js";
import { isCalendarIdentity, utcIcsStamp } from "../export/companyIcs.js";
import { holidaysInYear } from "../../data/holidays.js";
import { dayKey } from "../calendar/events.js";
import { dmy } from "../../data/planningDates.js";
import { renderTemplatePdf } from "../templates/pdf.js";

const sheet = (name, headers, rows) => ({ name, columns: headers.map((header) => ({ header, width: 24 })), rows });
export function plannerWorkbook(model) {
  const summary = sheet("Yhteenveto", ["Tieto", "Arvo"], [["Suunnitelma", model.config.name], ["Alku", model.start], ["Loppu", model.end], ["Päiväsääntö", model.disclosure]]);
  const weeks = sheet("Viikot", ["ISO-viikko", "ISO-viikkovuosi", "Alku", "Loppu", "Työpäiviä", "Arkipyhät"], model.weeks.map((row) => [row.week, row.year, row.from, row.to, row.workingDays, row.holidays.map((h) => `${h.name} ${dmy(h.date)}`).join(", ")]));
  const months = sheet("Kuukaudet", ["Vuosi", "Kuukausi", "Alku", "Loppu", "Työpäiviä"], model.months.map((row) => [row.calendarYear, row.month, row.from, row.to, row.workingDays]));
  const phases = sheet("Vaiheet", ["Tunniste", "Nimi", "Alku", "Loppu", "Työpäiviä", "Riippuvuudet", "Huomautus"], model.phases.map((p) => [p.id, p.label, p.start, p.end, p.workingDays, p.dependsOn.join(", "), p.note]));
  const milestones = sheet("Välitavoitteet", ["Nimi", "Päivä", "ISO-viikko", "ISO-viikkovuosi", "Huomautus"], (model.config.kind === "project" ? [...model.base.milestones.map((m) => ({ ...m, label: `${m.percent} %`, note: "" })), ...model.milestones] : []).map((m) => [m.label, m.date, m.week, m.weekYear, m.note]));
  const sprints = sheet("Sprintit", ["Sprintti", "Alku", "Loppu", "ISO-viikko alussa", "ISO-vuosi alussa", "ISO-viikko lopussa", "ISO-vuosi lopussa", "Työpäiviä", "Kapasiteetti %"], model.config.kind === "sprint" ? model.base.map((s) => [s.number, s.from, s.to, s.weekFrom, s.weekFromYear, s.weekTo, s.weekToYear, s.workingDays, s.capacity]) : []);
  return { sheets: [summary, weeks, months, ...(model.config.kind === "project" ? [phases, milestones] : [sprints])] };
}
export const plannerToXlsx = (model) => buildXlsx(plannerWorkbook(model));

export function plannerToIcs(model, { calendarId, stamp = utcIcsStamp() } = {}) {
  if (!isCalendarIdentity(calendarId) || !/^\d{8}T\d{6}Z$/.test(stamp)) throw new Error("Invalid private calendar identity or timestamp.");
  const events = [];
  const add = (id, date, endDate, summary, description = "") => events.push({ uid: `${calendarId}-${id}@viikkonro.fi`, date, endDate, summary, description });
  if (model.config.kind === "project") {
    add("project-start", model.start, model.start, `${model.config.name}: alku`);
    add("project-end", model.end, model.end, `${model.config.name}: loppu`);
    for (const phase of model.phases) add(`phase-${phase.id}`, phase.start, phase.end, phase.label, phase.note);
    for (const m of model.base.milestones) add(`percent-${m.percent}`, m.date, m.date, `${model.config.name}: ${m.percent} %`);
    for (const m of model.milestones) add(`milestone-${m.id}`, m.date, m.date, m.label, m.note);
  } else for (const s of model.base) add(`sprint-${s.number}`, s.from, s.to, `Sprintti ${s.number}`, `${s.workingDays} työpäivää. ${model.disclosure}`);
  for (let year = model.start.getFullYear(); year <= model.end.getFullYear(); year += 1) {
    for (const h of holidaysInYear(year)) if (h.official && h.date >= model.start && h.date <= model.end) add(`holiday-${dayKey(h.date)}`, h.date, h.date, h.name);
  }
  for (const week of model.weeks) add(`week-${week.year}-${week.week}`, week.from, week.from, `ISO-viikko ${week.week}/${week.year}`);
  // RFC serializer accepts arbitrary inclusive periods, including multi-year phases.
  return buildIcs({ calName: model.config.name, calDesc: model.disclosure, events, stamp, refresh: false });
}

export async function renderPlannerPdf(model, options) {
  const workbook = plannerWorkbook(model);
  const main = workbook.sheets[1];
  const phaseNames = new Map(model.phases.map((p) => [p.id, p.label]));
  const instructions = [model.disclosure, `Suunnitelma ${dmy(model.start)}-${dmy(model.end)}. Tiedot käsitellään omassa selaimessasi.`,
    ...model.phases.flatMap((p) => [`${p.label}: ${dmy(p.start)}-${dmy(p.end)}, ${p.workingDays} työpäivää. Riippuvuudet: ${p.dependsOn.map((id) => phaseNames.get(id)).join(", ") || "ei riippuvuuksia"}.`, ...(p.note ? [p.note] : [])]),
    ...model.milestones.flatMap((m) => [`${m.label}: ${dmy(m.date)}, ISO-viikko ${m.week}/${m.weekYear}.`, ...(m.note ? [m.note] : [])]),
    ...(model.config.kind === "sprint" ? model.base.map((s) => `Sprintti ${s.number}: ${dmy(s.from)}-${dmy(s.to)}, ${s.workingDays} työpäivää, kapasiteetti ${s.capacity} %.`) : model.base.milestones.map((m) => `${m.percent} %: ${dmy(m.date)}, ISO-viikko ${m.week}/${m.weekYear}.`))];
  return renderTemplatePdf({ template: { category: "planning", finnishName: model.config.name }, year: model.start.getFullYear(), title: model.config.name, instructionTitle: "Suunnitelman tiedot", subtitle: `Viikkosuunnitelma ${dmy(model.start)}-${dmy(model.end)}.`, main, instructions }, options);
}
export async function plannerToPdf(model) {
  const pdfkit = await import("pdfkit/js/pdfkit.standalone.js");
  return renderPlannerPdf(model, { PDFDocument: pdfkit.default ?? pdfkit });
}
