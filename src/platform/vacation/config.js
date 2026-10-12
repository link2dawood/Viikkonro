// Local annual plans. Leave consumption and work availability are separate rules.
import { dayKey, toDate } from "../calendar/events.js";
import { MIN_YEAR, MAX_YEAR } from "../calendar/config.js";
import { isCalendarIdentity } from "../export/companyIcs.js";

export const VACATION_PRODUCT = "vacation-planner-pro";
export const VACATION_RULES = Object.freeze(["FINLAND_PLANNER", "FINLAND_STATUTORY_LEAVE"]);
export const VACATION_WORK_RULE = "FINLAND_PLANNER";
export const VACATION_DRAFT_KEY = "viikkonro:vacation-pro:draft:v1";
export const VACATION_LIMITS = Object.freeze({ people: 20, periods: 100, closures: 50, note: 1000 });
const idOk = (id) => typeof id === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,59}$/.test(id);
const text = (value, max) => typeof value === "string" && value.trim().length <= max ? value.trim() : null;

export function newVacationDraft(year) {
  return { version: 1, calendarId: null, year, leaveRule: "FINLAND_PLANNER", layout: "year-glance",
    people: [{ id: "person1", label: "Henkilö 1" }], periods: [], closures: [], notes: "" };
}

/** Validate every row; partial or out-of-year records never disappear silently. */
export function validateVacationConfig(input) {
  const issues = [];
  const error = (message) => issues.push(message);
  if (!input || input.version !== 1) return { config: null, issues: ["Luonnoksen versio ei ole tuettu."] };
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) error(`Valitse vuosi ${MIN_YEAR}-${MAX_YEAR}.`);
  if (!VACATION_RULES.includes(input.leaveRule)) error("Valitse loman laskentatapa: suunnittelu tai vuosilomalaki.");
  if (input.workRule !== undefined && input.workRule !== VACATION_WORK_RULE) error("Tämän lomasuunnitelman työpäivät lasketaan viisipäiväisellä suunnitteluviikolla.");
  if (!["year-glance", "month-page"].includes(input.layout)) error("Valitse tuettu PDF-asettelu.");
  if (input.calendarId !== null && !isCalendarIdentity(input.calendarId)) error("Luonnoksen kalenteritunniste on virheellinen.");
  const notes = text(input.notes, VACATION_LIMITS.note);
  if (notes === null) error("Suunnitelman huomautus saa sisältää enintään 1000 merkkiä.");
  const people = [], periods = [], closures = [];
  const used = new Set();
  const identity = (row) => {
    if (!idOk(row?.id) || used.has(row.id)) { error("Jokaisella henkilöllä ja jaksolla pitää olla oma tunniste."); return false; }
    used.add(row.id); return true;
  };
  if (!Array.isArray(input.people) || !input.people.length || input.people.length > VACATION_LIMITS.people) error("Lisää 1-20 henkilöä tai tunnistetta.");
  else for (const person of input.people) {
    if (!identity(person)) continue;
    const label = text(person.label, 60);
    if (!label) error("Anna jokaiselle henkilölle nimi tai tunniste (enintään 60 merkkiä).");
    else people.push(Object.freeze({ id: person.id, label }));
  }
  const peopleIds = new Set(people.map((person) => person.id));
  const range = (row, closure) => {
    if (!identity(row)) return;
    const start = toDate(row.start), end = toDate(row.end || row.start);
    const label = text(row.label, closure ? 120 : 50), note = text(row.note ?? "", VACATION_LIMITS.note);
    if (!label) error("Anna jaksolle nimi: loma tai poissaolo enintään 50, sulku enintään 120 merkkiä.");
    if (note === null) error("Jakson huomautus saa sisältää enintään 1000 merkkiä.");
    if (!start || !end || end < start) { error("Tarkista jakson alku- ja loppupäivä."); return; }
    const days = (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000 + 1;
    if (days > 400) error("Yksi jakso saa kestää enintään 400 päivää.");
    if (end < new Date(year, 0, 1) || start > new Date(year, 11, 31)) error("Jokaisen jakson pitää osua ainakin osittain valittuun vuoteen.");
    if (!closure && (!peopleIds.has(row.personId) || !["vacation", "absence"].includes(row.type))) error("Valitse jaksolle henkilö ja laji.");
    const normalized = Object.freeze({ id: row.id, start: dayKey(start), end: dayKey(end), label, note: note ?? "",
      ...(!closure ? { personId: row.personId, type: row.type } : {}) });
    (closure ? closures : periods).push(normalized);
  };
  for (const [key, limit] of [["periods", VACATION_LIMITS.periods], ["closures", VACATION_LIMITS.closures]]) {
    if (!Array.isArray(input[key]) || input[key].length > limit) error(`Jaksoja voi olla enintään ${limit}.`);
    else for (const row of input[key]) range(row, key === "closures");
  }
  return { config: issues.length ? null : Object.freeze({ version: 1, calendarId: input.calendarId, year, leaveRule: input.leaveRule,
    workRule: VACATION_WORK_RULE, layout: input.layout, people: Object.freeze(people), periods: Object.freeze(periods), closures: Object.freeze(closures), notes }), issues };
}

export function vacationConfigToJson(config) {
  const result = validateVacationConfig(config);
  if (!result.config) throw new Error(result.issues.join(" "));
  return JSON.stringify(result.config);
}
export function vacationConfigFromJson(raw) {
  if (typeof raw !== "string" || raw.length > 250000) return { config: null, issues: ["Luonnos on liian suuri tai virheellinen."] };
  try { return validateVacationConfig(JSON.parse(raw)); }
  catch { return { config: null, issues: ["Luonnosta ei voitu lukea."] }; }
}
