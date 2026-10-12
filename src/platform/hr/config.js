import { createEvent, dayKey } from "../calendar/events.js";
import { HR_EVENT_TYPES } from "./eventTypes.js";
import { HR_LEGAL_SOURCE } from "./statutory.js";
export const MAX_HR_RECORDS = 250;
export function newHrDraft(year) { return { version: 1, year, companyName: "", holidays: true, statutory: false, records: [] }; }
export function createHrConfig(input) {
  const year = Number(input.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Valitse vuosi väliltä 2000-2100.");
  if (input.version !== 1) throw new Error("Tuntematon HR-kalenterin versio.");
  if (typeof input.holidays !== "boolean" || typeof input.statutory !== "boolean") throw new Error("Tarkista kalenterin valinnat.");
  if (input.statutory && !HR_LEGAL_SOURCE.years.includes(year)) throw new Error("Lakimuistutukset on tarkistettu vain vuosille 2026, 2027 ja 2028.");
  const text = (value, max) => { if (typeof value !== "string" || value.length > max) throw new Error(`Tekstin enimmäispituus on ${max} merkkiä.`); return value.trim(); };
  if (!Array.isArray(input.records) || input.records.length > MAX_HR_RECORDS) throw new Error(`Enintään ${MAX_HR_RECORDS} merkintää.`);
  const ids = new Set();
  const records = input.records.map((row) => {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,58}$/.test(row.id) || ids.has(row.id)) throw new Error("Merkinnän tunniste puuttuu tai toistuu.");
    ids.add(row.id);
    if (!Object.hasOwn(HR_EVENT_TYPES, row.type)) throw new Error("Tuntematon HR-merkinnän laji.");
    if (!["company", "agreement"].includes(row.origin)) throw new Error("Oma merkintä ei voi olla tarkistettu lakimuistutus.");
    const label = text(row.label, 120), reference = text(row.reference ?? "", 300), note = text(row.note ?? "", 1000);
    if (!label || (row.origin === "agreement" && !reference)) throw new Error("Anna merkinnän nimi sekä TES-merkinnälle sopimus ja kohta.");
    let event;
    if (typeof row.start !== "string" || typeof row.end !== "string") throw new Error("Anna merkinnän alku ja loppu.");
    try { event = createEvent({ id: `hr-${row.id}`, title: label, date: row.start, endDate: row.end, kind: "company" }); }
    catch { throw new Error("Tarkista merkinnän päivät. Jakso saa olla enintään 400 päivää."); }
    const end = event.endDate ?? event.date;
    if (event.date > new Date(year, 11, 31) || end < new Date(year, 0, 1)) throw new Error("Merkinnän tulee osua valittuun vuoteen.");
    if (!["closure", "vacation"].includes(row.type) && dayKey(event.date) !== dayKey(end)) throw new Error("Tälle merkinnälle annetaan yksi päivä.");
    return Object.freeze({ id: row.id, type: row.type, origin: row.origin, label, start: dayKey(event.date), end: dayKey(end), note, reference });
  });
  return Object.freeze({ version: 1, year, companyName: text(input.companyName ?? "", 80), holidays: input.holidays, statutory: input.statutory, records: Object.freeze(records) });
}
