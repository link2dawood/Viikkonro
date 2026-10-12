// Private company files reuse the existing serializer and date engine.
// DATE values deliberately have no TZID: all-day dates must not shift in DST.
import { buildIcs } from "./ics.js";
import { dayKey, sortEvents } from "../calendar/events.js";
import { paydaysInYear } from "../../data/paydayPages.js";

export const COMPANY_ICS_MIME = "text/calendar;charset=utf-8";
export const isCalendarIdentity = (value) => typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
export function newCalendarIdentity() {
  if (!globalThis.crypto?.randomUUID) throw new Error("Secure random identifiers are unavailable.");
  return globalThis.crypto.randomUUID().replace(/-/g, "");
}
export const utcIcsStamp = (date = new Date()) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Stable per-calendar UIDs; identical rows collapse, distinct overlapping events remain. */
export function companyIcsEvents(model, calendarId, { paydayRows = [] } = {}) {
  if (!isCalendarIdentity(calendarId)) throw new Error("A company calendar needs a persistent random identity.");
  const identities = new Map();
  const content = new Set();
  const events = [];
  const paydayMonths = new Map(model.config.include.paydays ? paydaysInYear(model.year, model.config.include.paydays.day).map((payday) => [dayKey(payday.actual), payday.nominal.getMonth() + 1]) : []);
  for (const event of sortEvents(model.events)) {
    const key = JSON.stringify([event.kind, dayKey(event.date), dayKey(event.endDate ?? event.date), event.title.normalize("NFC"), event.description ?? ""]);
    const paydayRow = event.kind === "payday" && event.source === "company" ? paydayRows.find((row) => row.date === dayKey(event.date)) : null;
    if (paydayRow && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(paydayRow.id)) throw new Error("Invalid payday row identifier.");
    const id = event.source === "viikkonro:paydays" ? `payday-month-${model.year}-${paydayMonths.get(dayKey(event.date))}` : paydayRow ? `payday-row-${paydayRow.id}` : event.id;
    const uid = `${calendarId}-${id}@viikkonro.fi`;
    if (identities.has(uid) && identities.get(uid) !== key) throw new Error("Conflicting company event identifiers.");
    identities.set(uid, key);
    if (content.has(key)) continue;
    content.add(key);
    events.push({ uid, date: event.date, endDate: event.endDate, summary: event.title, description: event.description, kind: event.kind });
  }
  return events;
}

export function companyCalendarToIcs(model, { calendarId, stamp = utcIcsStamp(), paydayRows = [], description } = {}) {
  if (!/^\d{8}T\d{6}Z$/.test(stamp)) throw new Error("DTSTAMP must be a UTC timestamp.");
  return buildIcs({
    calName: `${model.config.branding.companyName || "Yrityskalenteri"} ${model.year}`,
    calDesc: description ?? `Yrityskalenteri ${model.year}. Kokopäiväiset merkinnät, Europe/Helsinki.`,
    events: companyIcsEvents(model, calendarId, { paydayRows }), stamp, refresh: false,
  });
}

// No hosted company data, URL tokens or local blob URL presented as a subscription.
export const COMPANY_SUBSCRIPTION = Object.freeze({ available: false, mode: "private-file" });
