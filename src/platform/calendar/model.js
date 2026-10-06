// The calendar model: a configuration turned into months, ISO weeks and days,
// each day carrying whether it counts under the configured day rule and the
// events that fall on it. Every renderer (PDF, HTML, XLSX, ICS) draws from
// this one structure, so they cannot disagree about a date.
import { isoWeek, isoYear, M_FULL } from "../../components/dateUtils.js";
import { addDays } from "../../data/planningDates.js";
import { dayReason } from "../../data/dayRules.js";
import { dayKey, groupByDate } from "./events.js";
import { finnishCalendarEvents } from "./sources.js";

export const WEEKDAYS_MON_FIRST = Object.freeze(["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"]);

/**
 * A month as Monday-first week rows: arrays of 7 with null for days outside
 * the month, so a month that starts mid-week lines up under the right weekday.
 * (The calendar PDF in prerender.js uses this same function.)
 */
export function monthRows(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const rows = [];
  let current = null;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, monthIndex, d);
    const col = (date.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
    if (col === 0 || !current) {
      current = new Array(7).fill(null);
      rows.push(current);
    }
    current[col] = { day: d, date };
  }
  return rows;
}

const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

/**
 * Every ISO week that touches the year, Monday to Sunday, as the week-number
 * list needs it. Days outside the calendar year are shown in the range but
 * never counted. Each week lists the events that overlap it once, with their
 * full date range, so a multi-week closure reads the same in every week.
 */
export function weekList(model) {
  const { year, config } = model;
  const mode = config.dayRuleMode;
  const first = addDays(new Date(year, 0, 1), -((new Date(year, 0, 1).getDay() + 6) % 7));
  const lastDay = new Date(year, 11, 31);
  const weeks = [];
  for (let monday = first; monday <= lastDay; monday = addDays(monday, 7)) {
    const sunday = addDays(monday, 6);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const inYear = date.getFullYear() === year;
      return { date, inYear, counts: inYear && dayReason(mode, date) === null };
    });
    const events = model.events
      .filter((e) => e.kind !== "week" && e.date <= sunday && (e.endDate ?? e.date) >= monday)
      .map((e) => ({
        title: e.title,
        kind: e.kind,
        from: e.date,
        to: e.endDate ?? e.date,
        text: e.endDate ? `${e.title} ${dm(e.date)}-${dm(e.endDate)}` : `${e.title} ${dm(e.date)}`,
      }));
    weeks.push({
      week: isoWeek(monday),
      weekYear: isoYear(monday),
      from: monday,
      to: sunday,
      days,
      workingDays: days.filter((d) => d.counts).length,
      events,
    });
  }
  return weeks;
}

/**
 * @param {import("./config.js").CalendarConfig} config
 * @param {import("./events.js").CalendarEvent[]} [events]  defaults to every event the configuration asks for
 */
export function buildCalendarModel(config, events = finnishCalendarEvents(config)) {
  const byDate = groupByDate(events);
  const mode = config.dayRuleMode;
  const makeDay = ({ day, date }, column) => {
    const reason = dayReason(mode, date);
    const key = dayKey(date);
    return Object.freeze({ date, day, key, column, reason, counts: reason === null, events: byDate.get(key) ?? [] });
  };

  const months = Array.from({ length: 12 }, (_, index) => ({
    index,
    name: M_FULL[index],
    rows: monthRows(config.year, index).map((cells) => {
      const anchor = cells.find(Boolean).date;
      return {
        week: isoWeek(anchor),
        weekYear: isoYear(anchor),
        days: cells.map((cell, column) => (cell ? makeDay(cell, column) : null)),
      };
    }),
  }));

  let counted = 0;
  let total = 0;
  for (let d = new Date(config.year, 0, 1); d.getFullYear() === config.year; d = addDays(d, 1)) {
    total += 1;
    if (dayReason(mode, d) === null) counted += 1;
  }
  const eventsByKind = {};
  for (const e of events) if (e.kind !== "week") eventsByKind[e.kind] = (eventsByKind[e.kind] ?? 0) + 1;

  return Object.freeze({
    config,
    year: config.year,
    months,
    events,
    eventsByDate: byDate,
    stats: Object.freeze({ days: total, counted, notCounted: total - counted, eventsByKind }),
  });
}
