// Periods: a company closure, a leave block or a season (such as a holiday
// season) with a start, an end and a label. They become calendar events and
// can be counted under any day rule, which is what a leave planner needs.
import { addDays } from "../../data/planningDates.js";
import { countsAsDay } from "../../data/dayRules.js";
import { createEvent, dayKey, toDate } from "./events.js";

export const PERIOD_KINDS = Object.freeze(["closure", "leave", "season"]);

/**
 * @typedef {object} Period
 * @property {string} id
 * @property {string} label
 * @property {Date} start
 * @property {Date} end  inclusive
 * @property {"closure"|"leave"|"season"} kind
 * @property {string|null} note
 */

/** @returns {Period} */
export function createPeriod({ id, label, start, end, kind = "closure", note } = {}) {
  const from = toDate(start);
  const to = toDate(end ?? start);
  if (!from || !to) throw new Error("A period needs a valid start and end date.");
  if (to < from) throw new Error("A period cannot end before it starts.");
  if (!PERIOD_KINDS.includes(kind)) throw new Error(`Unknown period kind "${kind}".`);
  const text = typeof label === "string" ? label.trim() : "";
  if (!text) throw new Error("A period needs a label.");
  return Object.freeze({
    id: id || `${kind}-${dayKey(from)}`,
    label: text,
    start: from,
    end: to,
    kind,
    note: note?.trim() || null,
  });
}

export function periodToEvent(period) {
  return createEvent({
    id: `period-${period.id}`,
    date: period.start,
    endDate: period.end,
    title: period.label,
    kind: period.kind,
    source: "company",
    description: period.note,
  });
}

/** Days of the period that count under a day-rule mode (e.g. leave days used). */
export function countPeriodDays(period, mode) {
  let n = 0;
  for (let d = period.start; d <= period.end; d = addDays(d, 1)) if (countsAsDay(mode, d)) n += 1;
  return n;
}

/** Pairs of periods that share at least one day. */
export function findOverlaps(periods) {
  const pairs = [];
  for (let i = 0; i < periods.length; i += 1) {
    for (let j = i + 1; j < periods.length; j += 1) {
      const a = periods[i];
      const b = periods[j];
      if (a.start <= b.end && b.start <= a.end) pairs.push([a, b]);
    }
  }
  return pairs;
}
