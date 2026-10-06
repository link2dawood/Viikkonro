// Finnish event sources: the site's existing holiday, flag-day and payday
// data turned into platform CalendarEvents. Nothing here recomputes a date;
// each function wraps the module that already owns the rule
// (holidays.js, flagDayPages.js, paydayPages.js).
import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { addDays } from "../../data/planningDates.js";
import { holidaysInYear } from "../../data/holidays.js";
import { flagDaysInYear } from "../../data/flagDayPages.js";
import { DEFAULT_PAYDAY, paydaysInYear } from "../../data/paydayPages.js";
import { CONFIDENCE, SCHOOL_HOLIDAY_SOURCES, schoolHolidayPage } from "../../data/schoolHolidayPages.js";
import { createEvent, dayKey, sortEvents, toDate } from "./events.js";
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

/** Individual payday dates a company lists by hand ("YYYY-MM-DD" or Date). */
export function paydayDateEvents(dates, taken = new Set()) {
  return dates
    .map((value) => createEvent({ id: `payday-date-${dayKey(toDate(value))}`, date: value, title: "Palkkapäivä", kind: "payday", source: "company" }))
    .filter((e) => !taken.has(dayKey(e.date)));
}

/** Cities the school-holiday data names for a year (empty when the year has no data). */
export function schoolHolidayCities(year) {
  const page = schoolHolidayPage(year);
  if (!page) return [];
  const names = new Set();
  for (const group of [...page.winter, ...page.autumn]) for (const city of group.cities) names.add(city);
  return [...names].sort((a, b) => a.localeCompare(b, "fi"));
}

/** Which of a city's school holidays the data has for a year. */
export function schoolHolidayCoverage(year, city) {
  const page = schoolHolidayPage(year);
  const has = (groups) => Boolean(page) && groups.some((g) => g.cities.includes(city));
  return { winter: has(page?.winter ?? []), autumn: has(page?.autumn ?? []) };
}

/**
 * Winter (hiihtoloma) and autumn (syysloma) holidays of one city, from the
 * site's existing school-holiday data. A holiday the data does not have for
 * that city and year is left out, never guessed.
 */
export function schoolHolidayCalendarEvents(year, city) {
  const page = schoolHolidayPage(year);
  if (!page || !city) return [];
  const events = [];
  const add = (groups, name, idPart) => {
    for (const g of groups) {
      if (!g.cities.includes(city)) continue;
      const estimated = g.confidence !== CONFIDENCE.CONFIRMED;
      events.push(
        createEvent({
          id: `school-${idPart}-${year}-${g.week}`,
          date: g.startDate,
          endDate: g.endDate,
          title: `${name} (viikko ${g.week})${estimated ? ", arvio" : ""}`,
          kind: "school",
          source: "viikkonro:school-holidays",
          description: `${SCHOOL_HOLIDAY_SOURCES[g.sourceKey].label}. Tarkista oman koulusi päivät.`,
        }),
      );
    }
  };
  add(page.winter, "Hiihtoloma", "winter");
  add(page.autumn, "Syysloma", "autumn");
  return events;
}

/** Every event a calendar configuration asks for, sorted. */
export function finnishCalendarEvents(config) {
  const { year, include } = config;
  const ruleDays = new Set(include.paydays ? paydayCalendarEvents(year, include.paydays.day).map((e) => dayKey(e.date)) : []);
  return sortEvents([
    ...(include.holidays ? holidayCalendarEvents(year) : []),
    ...(include.flagDays ? flagDayCalendarEvents(year) : []),
    ...(include.paydays ? paydayCalendarEvents(year, include.paydays.day) : []),
    ...paydayDateEvents(config.paydayDates, ruleDays),
    ...(include.schoolHolidays ? schoolHolidayCalendarEvents(year, include.schoolHolidays.city) : []),
    ...(include.weekNumbers ? weekNumberEvents(year) : []),
    ...config.periods.map(periodToEvent),
    ...config.events,
  ]);
}
