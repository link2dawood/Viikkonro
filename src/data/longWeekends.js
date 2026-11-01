// Long weekends (pitkät viikonloput) and bridge days (siltapäivät) for a
// calendar year, for the yearly calendar page's planning section.
//
// Both are derived, not listed: the free/working split comes from
// DAY_RULES.FINLAND_PLANNER, the one mode dayRules.js already defines as "a
// five-day week for finding long breaks" (Saturdays, Sundays and every day in
// holidaysInYear(), jouluaatto and juhannusaatto included). Reusing that mode
// is what keeps this page agreeing with /vuosilomalaskuri and the planners
// instead of inventing a sixth definition of a day off. The stricter
// työpäivälaskuri mode (FINLAND_WORKDAY, where the two eves are working days)
// is deliberately not used here: a page about long breaks that called
// jouluaatto a working day would read as wrong to every Finnish visitor.
//
// A run of free days has to reach three to count as a long weekend, so a plain
// Saturday and Sunday never does; by that rule every long weekend listed
// contains at least one holiday. Runs are scanned across the year boundary in
// both directions, because the new year break regularly starts in December of
// the previous year and a Christmas break can end in January.
import { countsAsDay } from "./dayRules.js";
import { holidaysInYear } from "./holidays.js";
import { isoWeek, isoYear } from "../components/dateUtils.js";

const MODE = "FINLAND_PLANNER";
const MIN_LONG_WEEKEND_DAYS = 3;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isFree(date) {
  return !countsAsDay(MODE, date);
}

// Holidays by date string for every calendar year a scan window can touch.
function holidayNamesBetween(start, end) {
  const years = new Set([start.getFullYear(), end.getFullYear()]);
  return [...years]
    .flatMap((year) => holidaysInYear(year))
    .filter((holiday) => holiday.date >= start && holiday.date <= end)
    .sort((a, b) => a.date - b.date)
    .map((holiday) => holiday.name);
}

// The ISO weeks a date range touches, each with its own ISO year, so a caller
// can link /viikko-<week>-<year> without recomputing the year boundary.
function weeksBetween(start, end) {
  const weeks = [];
  for (let day = new Date(start); day <= end; day = addDays(day, 1)) {
    const week = isoWeek(day);
    const year = isoYear(day);
    if (!weeks.some((item) => item.week === week && item.year === year)) {
      weeks.push({ week, year });
    }
  }
  return weeks;
}

function describeRun(start, end) {
  const days = Math.round((end - start) / 86400000) + 1;
  return {
    start,
    end,
    days,
    holidays: holidayNamesBetween(start, end),
    weeks: weeksBetween(start, end),
  };
}

// Maximal runs of free days in a window wide enough to catch a break that
// starts in the previous December or ends in the following January.
function freeRuns(year) {
  const runs = [];
  const last = new Date(year + 1, 1, 15);
  let start = null;
  let previous = null;
  for (let day = new Date(year - 1, 10, 15); day <= last; day = addDays(day, 1)) {
    if (isFree(day)) {
      if (!start) start = new Date(day);
      previous = new Date(day);
    } else if (start) {
      runs.push(describeRun(start, previous));
      start = null;
    }
  }
  if (start) runs.push(describeRun(start, previous));
  return runs;
}

const longWeekendCache = new Map();

// Every long weekend that any part of falls in `year`, in calendar order. A
// break spanning new year appears on both years' pages, with its real dates
// and its real length rather than a length truncated at 31 December.
export function longWeekends(year) {
  const cached = longWeekendCache.get(year);
  if (cached) return cached;
  const runs = freeRuns(year).filter(
    (run) =>
      run.days >= MIN_LONG_WEEKEND_DAYS &&
      (run.start.getFullYear() === year || run.end.getFullYear() === year),
  );
  longWeekendCache.set(year, runs);
  return runs;
}

const bridgeDayCache = new Map();

// Working days with free days on both sides: taking one day off joins the two
// runs, and `freeDays` is how long the resulting break actually becomes. Only
// single-day gaps count, because that is the whole appeal of a siltapäivä.
export function bridgeDays(year) {
  const cached = bridgeDayCache.get(year);
  if (cached) return cached;
  const days = [];
  for (
    let day = new Date(year, 0, 1);
    day.getFullYear() === year;
    day = addDays(day, 1)
  ) {
    if (isFree(day)) continue;
    const before = addDays(day, -1);
    const after = addDays(day, 1);
    if (!isFree(before) || !isFree(after)) continue;
    let start = before;
    while (isFree(addDays(start, -1))) start = addDays(start, -1);
    let end = after;
    while (isFree(addDays(end, 1))) end = addDays(end, 1);
    const run = describeRun(start, end);
    days.push({
      date: new Date(day),
      freeDays: run.days,
      start: run.start,
      end: run.end,
      holidays: run.holidays,
      weeks: run.weeks,
    });
  }
  bridgeDayCache.set(year, days);
  return days;
}
