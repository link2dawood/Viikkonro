import { addDays } from "../../data/planningDates.js";
import { dayKey, toDate } from "../calendar/events.js";

export const CONSTRUCTION_TYPES = Object.freeze({ phase: "Työvaihe", task: "Viikkotehtävä", milestone: "Välitavoite", delivery: "Toimitus", inspection: "Tarkastus", shutdown: "Työmaan tauko" });
export const CONSTRUCTION_LAYOUTS = Object.freeze({ weekly: "Viikkoaikataulu", overview: "Projektin yleiskuva" });
export const MAX_CONSTRUCTION_ROWS = 250;
export const CONSTRUCTION_RULE = "FINLAND_PROJECT";
const pointTypes = ["milestone", "delivery", "inspection"];
export const isConstructionPoint = (type) => pointTypes.includes(type);
const text = (value, max, required = false) => {
  if (typeof value !== "string" || value.length > max || required && !value.trim()) throw new Error(`Tarkista nimi ja huomautukset. Nimen enimmäispituus on 100 ja huomautuksen 1000 merkkiä.`);
  return value.trim();
};
const date = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !toDate(value)) throw new Error("Tarkista päivämäärät.");
  return toDate(value);
};
export function newConstructionDraft(start) {
  const from = toDate(start);
  if (!from) throw new Error("Tarkista projektin aloituspäivä.");
  return { version: 1, projectName: "Rakennusprojekti", siteName: "", start: dayKey(from), end: dayKey(addDays(from, 55)), layout: "weekly", subcontractorNotes: "", weatherNotes: "", records: [] };
}
/** Plain versioned configuration; no employee/person or remote storage fields. */
export function validateConstructionConfig(input) {
  if (!input || input.version !== 1 || !Object.hasOwn(CONSTRUCTION_LAYOUTS, input.layout)) throw new Error("Tarkista suunnitelman versio ja näkymä.");
  const start = date(input.start), end = date(input.end);
  if (end < start || end > addDays(start, 1095)) throw new Error("Projektijakson pitää olla 1-1096 kalenteripäivää.");
  if (!Array.isArray(input.records) || input.records.length > MAX_CONSTRUCTION_ROWS) throw new Error(`Lisää enintään ${MAX_CONSTRUCTION_ROWS} merkintää.`);
  const ids = new Set();
  const records = input.records.map((row) => {
    if (!row || typeof row.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,59}$/.test(row.id) || ids.has(row.id) || !Object.hasOwn(CONSTRUCTION_TYPES, row.type)) throw new Error("Merkinnän tunniste tai laji on virheellinen.");
    ids.add(row.id);
    const from = date(row.start), to = date(row.end);
    if (to < from || from < start || to > end || isConstructionPoint(row.type) && +from !== +to) throw new Error("Merkintöjen pitää osua projektijaksoon. Toimitus, tarkastus ja välitavoite merkitään yhdelle päivälle.");
    return Object.freeze({ id: row.id, type: row.type, label: text(row.label, 100, true), start: dayKey(from), end: dayKey(to),
      note: text(row.note ?? "", 1000), subcontractorNote: text(row.subcontractorNote ?? "", 1000), weatherRisk: text(row.weatherRisk ?? "", 1000) });
  });
  return Object.freeze({ version: 1, projectName: text(input.projectName, 100, true), siteName: text(input.siteName ?? "", 100), start: dayKey(start), end: dayKey(end),
    layout: input.layout, subcontractorNotes: text(input.subcontractorNotes ?? "", 1000), weatherNotes: text(input.weatherNotes ?? "", 1000), records: Object.freeze(records) });
}
