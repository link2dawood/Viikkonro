// The calendar event model every platform product shares: holidays, flag
// days, paydays, company closures, leave and custom company dates all become
// the same frozen object, so a renderer or exporter never needs to know where
// an event came from.
import { addDays, atMidnight, parseIsoDate, toIsoDate } from "../../data/planningDates.js";

/**
 * @typedef {object} CalendarEvent
 * @property {string} id  stable identifier, unique inside one calendar
 * @property {Date} date  first day, local midnight
 * @property {Date|null} endDate  last day (inclusive) of a multi-day event
 * @property {string} title
 * @property {string} kind  one of EVENT_KINDS
 * @property {string} source  where the event came from, e.g. "viikkonro:holidays"
 * @property {string|null} description
 * @property {string|null} url
 */

// Ordered: a day's events are listed in this order.
export const EVENT_KINDS = Object.freeze([
  "holiday",
  "flag-day",
  "payday",
  "closure",
  "leave",
  "season",
  "company",
  "week",
]);

export const MAX_EVENT_SPAN_DAYS = 400;
export const MAX_TITLE_LENGTH = 120;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,99}$/;

export const dayKey = (date) => toIsoDate(date);

/** A Date or a "YYYY-MM-DD" string to local midnight, or null. */
export function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : atMidnight(value);
  if (typeof value === "string") return parseIsoDate(value);
  return null;
}

/** @returns {CalendarEvent} */
export function createEvent(input) {
  const date = toDate(input?.date);
  if (!date) throw new Error("Event date must be a valid date.");
  const end = input.endDate == null ? null : toDate(input.endDate);
  if (input.endDate != null && !end) throw new Error("Event endDate must be a valid date.");
  if (end && end < date) throw new Error("Event endDate cannot be before its date.");
  if (end && Math.round((end - date) / 86400000) + 1 > MAX_EVENT_SPAN_DAYS) {
    throw new Error(`An event can span at most ${MAX_EVENT_SPAN_DAYS} days.`);
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) throw new Error("Event title is required.");
  if (title.length > MAX_TITLE_LENGTH) throw new Error(`Event title is longer than ${MAX_TITLE_LENGTH} characters.`);
  if (!EVENT_KINDS.includes(input.kind)) throw new Error(`Unknown event kind "${input.kind}".`);
  if (typeof input.id !== "string" || !ID_RE.test(input.id)) throw new Error(`Invalid event id "${input.id}".`);
  return Object.freeze({
    id: input.id,
    date,
    endDate: end && end.getTime() !== date.getTime() ? end : null,
    title,
    kind: input.kind,
    source: input.source || "custom",
    description: input.description?.trim() || null,
    url: input.url || null,
  });
}

/** One event per day for a multi-day event; a single-day event comes back as is. */
export function expandEvent(event) {
  if (!event.endDate) return [event];
  const days = [];
  for (let d = event.date; d <= event.endDate; d = addDays(d, 1)) {
    days.push(Object.freeze({ ...event, id: `${event.id}:${dayKey(d)}`, date: d, endDate: null }));
  }
  return days;
}

export function sortEvents(events) {
  return [...events].sort(
    (a, b) =>
      a.date - b.date ||
      EVENT_KINDS.indexOf(a.kind) - EVENT_KINDS.indexOf(b.kind) ||
      a.title.localeCompare(b.title, "fi") ||
      a.id.localeCompare(b.id),
  );
}

/** Map of "YYYY-MM-DD" to that day's events (multi-day events expanded), in display order. */
export function groupByDate(events) {
  const map = new Map();
  for (const event of sortEvents(events.flatMap(expandEvent))) {
    const key = dayKey(event.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  }
  return map;
}

/** Events in the shape src/platform/export/ics.js writes. */
export function eventsToIcs(events, { domain = "viikkonro.fi" } = {}) {
  return sortEvents(events).map((e) => ({
    uid: `${e.id}@${domain}`,
    date: e.date,
    endDate: e.endDate,
    summary: e.title,
    description: e.description,
    url: e.url,
  }));
}
