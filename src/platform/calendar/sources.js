// Finnish event sources: the site's existing holiday, flag-day and payday
// data turned into platform CalendarEvents. Nothing here recomputes a date;
// each function wraps the module that already owns the rule
// (holidays.js, flagDayPages.js, paydayPages.js).
import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { addDays } from "../../data/planningDates.js";
import { holidaysInYear } from "../../data/holidays.js";
import { flagDaysInYear } from "../../data/flagDayPages.js";
import { DEFAULT_PAYDAY, paydaysInYear } from "../../data/paydayPages.js";
import { createEvent, dayKey, sortEvents } from "./events.js";
import { periodToEvent } from "./periods.js";

// "1. pääsiäispäivä" -> "1-paasiaispaiva"
const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "Vk N" on every Monday of the calendar year. */
export function weekNumberEvents(year) {
  const events = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = addDays(d, 1)) {
    if (d.getDay() !== 1) continue;
    const week = isoWeek(d);
    events.push(
      createEvent({
        id: `week-${isoYear(d)}-${week}`,
        date: d,
        title: `Vk ${week}`,
        kind: "week",
        source: "viikkonro:weeks",
      }),
    );
  }
  return events;
}

export function holidayCalendarEvents(year) {
  return holidaysInYear(year).map((h) =>
    createEvent({
      id: `holiday-${dayKey(h.date)}-${slug(h.name)}`,
      date: h.date,
      title: h.name,
      kind: "holiday",
      source: "viikkonro:holidays",
      description: h.official
        ? "Virallinen arkipyhä Suomessa."
        : "Ei virallinen arkipyhä, mutta laajalti vapaapäivä. Pankit ovat kiinni.",
    }),
  );
}

export function flagDayCalendarEvents(year) {
  return flagDaysInYear(year).map((f) =>
    createEvent({
      id: `flag-${dayKey(f.date)}-${f.slug}`,
      date: f.date,
      title: `${f.name} (liputuspäivä)`,
      kind: "flag-day",
      source: "viikkonro:flag-days",
      description: f.categoryLabel,
    }),
  );
}

/** One payday a month, moved to the previous banking day when needed. */
export function paydayCalendarEvents(year, day = DEFAULT_PAYDAY) {
  return paydaysInYear(year, day).map((p) =>
    createEvent({
      id: `payday-${dayKey(p.actual)}`,
      date: p.actual,
      title: "Palkkapäivä",
      kind: "payday",
      source: "viikkonro:paydays",
      description: p.moved ? `Sovittu päivä on ${p.reason.toLowerCase()}, joten palkka maksetaan edellisenä pankkipäivänä.` : null,
    }),
  );
}

/** Every event a calendar configuration asks for, sorted. */
export function finnishCalendarEvents(config) {
  const { year, include } = config;
  return sortEvents([
    ...(include.holidays ? holidayCalendarEvents(year) : []),
    ...(include.flagDays ? flagDayCalendarEvents(year) : []),
    ...(include.paydays ? paydayCalendarEvents(year, include.paydays.day) : []),
    ...(include.weekNumbers ? weekNumberEvents(year) : []),
    ...config.periods.map(periodToEvent),
    ...config.events,
  ]);
}
