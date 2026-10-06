// Small date helpers shared by the planning tools (/lomasuunnittelija,
// /projektiaikataulu, /sprinttisuunnittelija). Plain .js so prerender.js can
// import the data modules that use it.
import { isoWeek, isoYear } from "../components/dateUtils.js";
import { addDays, atMidnight, isWorkingDay, officialHolidayOn } from "./dateCalculator.js";

export { addDays, atMidnight, isWorkingDay, officialHolidayOn };

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

// "2027-03-22" (an <input type="date"> value) -> local midnight, or null.
export function parseIsoDate(value) {
  const p = String(value ?? "").split("-").map(Number);
  if (p.length !== 3 || p.some((n) => !Number.isInteger(n)) || p[0] < 1000) return null;
  const d = new Date(p[0], p[1] - 1, p[2]);
  return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2] ? d : null;
}

export const toIsoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "22.3." and "22.3.2027"
export const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
export const dmy = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

// The Monday on or after `date`.
export function nextMonday(date) {
  const d = atMidnight(date);
  return addDays(d, (8 - d.getDay()) % 7);
}

// "viikko 12" or "viikot 12-14" (a range inside one ISO year), with the year
// only when the span crosses an ISO year boundary.
export function weekRangeLabel(from, to) {
  const a = isoWeek(from);
  const b = isoWeek(to);
  const ay = isoYear(from);
  const by = isoYear(to);
  if (ay === by) return a === b ? `viikko ${a}` : `viikot ${a}-${b}`;
  return `viikot ${a}/${ay}-${b}/${by}`;
}
