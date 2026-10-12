import { helsinkiDayKey, isoWeek, isoYear, mondayOf } from "../../components/dateUtils.js";
import { monthRows } from "../calendar/model.js";
import { createEvent, dayKey, groupByDate } from "../calendar/events.js";
import { holidaysInYear } from "../../data/holidays.js";
import { parseIsoDate, addDays } from "../../data/planningDates.js";

export const WIDGET_VERSION = 1;
export const BUSINESS_WIDGET_PATH = "/widget/calendar/v1";
export const WIDGET_TIERS = Object.freeze({ free: { attribution: true, events: true, appearance: true }, premium: { available: false, plannedFeatures: ["verified-white-label", "custom-logo"] } });
const civilDate = (value) => {
  const d = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseIsoDate(value) : null;
  if (!d || d.getFullYear() < 2000 || d.getFullYear() > 2100) throw new Error("Virheellinen päivä. Käytä vuosia 2000..2100.");
  return d;
};
export function widgetConfiguration(input = {}, instant = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Virheelliset asetukset.");
  for (const key of Object.keys(input)) if (!["date", "view", "theme", "color", "companyName", "holidays", "events"].includes(key)) throw new Error("Tuntematon asetus.");
  const date = civilDate(input.date ?? helsinkiDayKey(instant));
  const view = input.view ?? "month", theme = input.theme ?? "light", color = input.color ?? "#1f7a5c";
  if (!["month", "week"].includes(view) || !["light", "dark"].includes(theme) || !/^#[a-fA-F0-9]{6}$/.test(color)) throw new Error("Virheellinen ulkoasu.");
  const companyName = input.companyName ?? "";
  if (typeof companyName !== "string" || companyName.length > 160) throw new Error("Yrityksen nimi on liian pitkä.");
  if (input.holidays != null && typeof input.holidays !== "boolean") throw new Error("Virheellinen pyhäpäiväasetus.");
  const rows = input.events ?? [];
  if (!Array.isArray(rows) || rows.length > 100) throw new Error("Enintään 100 yrityksen tapahtumaa.");
  const ids = new Set();
  const events = rows.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error("Virheellinen tapahtuma.");
    civilDate(row.date); if (row.endDate != null) civilDate(row.endDate);
    const event = createEvent({ id: row.id ?? `widget-${i}`, date: row.date, endDate: row.endDate, title: row.title, kind: "company", source: "host" });
    if (ids.has(event.id)) throw new Error("Tapahtuman tunniste esiintyy kahdesti."); ids.add(event.id); return event;
  });
  return { date, view, theme, color, companyName, holidays: input.holidays ?? true, events };
}
export function widgetQuery(search) {
  const p = new URLSearchParams(search);
  for (const key of p.keys()) if (!["date", "view", "theme", "color", "holidays"].includes(key) || p.getAll(key).length !== 1) throw new Error("URL saa sisältää vain ulkoasun ja päivän asetuksia.");
  const input = Object.fromEntries(p);
  if (input.holidays != null) { if (!["true", "false"].includes(input.holidays)) throw new Error("Virheellinen asetus."); input.holidays = input.holidays === "true"; }
  return input;
}
export function buildWidgetModel(config) {
  const anchor = config.date;
  const rows = config.view === "month" ? monthRows(anchor.getFullYear(), anchor.getMonth()) : [Array.from({ length: 7 }, (_, i) => {
    const date = addDays(mondayOf(isoWeek(anchor), isoYear(anchor)), i); return { date, day: date.getDate() };
  })];
  const dates = rows.flat().filter(Boolean).map((d) => d.date), years = [...new Set(dates.map((d) => d.getFullYear()))];
  const holidays = config.holidays ? years.flatMap((year) => holidaysInYear(year)) : [];
  const events = groupByDate(config.events);
  return { date: dayKey(anchor), week: isoWeek(anchor), weekYear: isoYear(anchor), rows: rows.map((row) => {
    const first = row.find(Boolean).date;
    return { week: isoWeek(first), weekYear: isoYear(first), days: row.map((cell) => cell ? {
      date: dayKey(cell.date), day: cell.day, holidays: holidays.filter((h) => dayKey(h.date) === dayKey(cell.date)).map((h) => ({ title: h.name, official: Boolean(h.official) })),
      events: events.get(dayKey(cell.date)) ?? [],
    } : null) };
  }) };
}
export function moveWidgetDate(config, direction) {
  const d = config.date;
  const next = config.view === "week" ? addDays(d, direction * 7) : new Date(d.getFullYear(), d.getMonth() + direction, 1);
  return next.getFullYear() >= 2000 && next.getFullYear() <= 2100 ? dayKey(next) : null;
}
