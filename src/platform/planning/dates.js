import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { addDays, atMidnight } from "../../data/planningDates.js";
import { countsAsDay, dayReason, summarizeDayRange, DAY_RULES } from "../../data/dayRules.js";

export const MAX_PROJECT_DAYS = 520;
export const MILESTONES = [25, 50, 75, 100];
export const SPRINT_WEEKS = [1, 2, 3, 4, 5, 6];
export const MAX_SPRINTS = 26;
/** WorkingDayRule: a named Finnish working-day mode, never a statutory leave rule. */
export function workingDayRule(mode) {
  if (!["FINLAND_PROJECT", "FINLAND_SPRINT", "FINLAND_WORKDAY"].includes(mode)) throw new Error("Unsupported project/sprint working-day rule.");
  return DAY_RULES[mode];
}

// First working day on or after `date`.
export function firstWorkingDay(date, mode = "FINLAND_PROJECT") {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  workingDayRule(mode);
  let d = atMidnight(date);
  while (!countsAsDay(mode, d)) d = addDays(d, 1);
  return d;
}

/** Shared ISO-week and month boundaries, with the original Finnish day rule. */
export function calendarGroups(from, to, mode, by = "week") {
  workingDayRule(mode);
  const rows = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const week = isoWeek(date), year = isoYear(date);
    const key = by === "month" ? `${date.getFullYear()}-${date.getMonth() + 1}` : `${year}-${week}`;
    let row = rows[rows.length - 1];
    if (!row || row.key !== key) {
      row = { key, week, year, month: date.getMonth() + 1, calendarYear: date.getFullYear(), from: date, to: date, workingDays: 0, holidays: [] };
      rows.push(row);
    }
    row.to = date;
    const reason = dayReason(mode, date);
    if (reason === null) row.workingDays += 1;
    else if (date.getDay() >= 1 && date.getDay() <= 5) row.holidays.push({ date, name: reason });
  }
  return rows;
}

// The project plan, or null for unusable input. Give `workingDays` (length)
// or `end` (last day); the project starts on the first working day on or after
// `start`.
export function buildProjectTimeline(start, { workingDays, end, mode = "FINLAND_PROJECT" } = {}) {
  if (!(start instanceof Date) || !Number.isFinite(start.getTime()) || end && (!(end instanceof Date) || !Number.isFinite(end.getTime()))) return null;
  workingDayRule(mode);
  const first = firstWorkingDay(start, mode);
  const days = [];
  if (end) {
    const last = atMidnight(end);
    if (last < first) return null;
    for (let d = first; d <= last && days.length <= MAX_PROJECT_DAYS; d = addDays(d, 1)) {
      if (countsAsDay(mode, d)) days.push(d);
    }
    if (!days.length || days.length > MAX_PROJECT_DAYS) return null;
  } else {
    const n = Math.trunc(Number(workingDays));
    if (!Number.isFinite(n) || n < 1 || n > MAX_PROJECT_DAYS) return null;
    for (let d = first; days.length < n; d = addDays(d, 1)) if (countsAsDay(mode, d)) days.push(d);
  }
  const lastDay = days[days.length - 1];

  const rows = calendarGroups(first, lastDay, mode).map(({ week, year, from, to, workingDays, holidays }) => ({ week, year, from, to, workingDays, holidays }));

  const milestones = MILESTONES.map((percent) => {
    const date = days[Math.ceil((days.length * percent) / 100) - 1];
    return { percent, date, week: isoWeek(date), weekYear: isoYear(date) };
  });
  const calendarDays = Math.round((lastDay - first) / 86400000) + 1;
  return { start: first, end: lastDay, workingDays: days.length, calendarDays, rows, milestones };
}


// The sprint plan, or null for unusable input.
export function buildSprintTimeline(start, weeks, count, firstNumber = 1, mode = "FINLAND_SPRINT") {
  const w = Math.trunc(Number(weeks));
  const n = Math.trunc(Number(count));
  if (!start || !SPRINT_WEEKS.includes(w) || !Number.isFinite(n) || n < 1 || n > MAX_SPRINTS) return null;
  if (!(start instanceof Date) || !Number.isFinite(start.getTime()) || !Number.isInteger(Number(firstNumber)) || Number(firstNumber) < 1 || Number(firstNumber) > 1000000) return null;
  workingDayRule(mode);
  const first = atMidnight(start);
  const nominal = w * 5;
  return Array.from({ length: n }, (_, i) => {
    const from = addDays(first, i * w * 7);
    const to = addDays(from, w * 7 - 1);
    const { counted: workingDays, weekdayExclusions: holidays } = summarizeDayRange(mode, from, to);
    return {
      number: Number(firstNumber) + i,
      from,
      to,
      weekFrom: isoWeek(from),
      weekFromYear: isoYear(from),
      weekTo: isoWeek(to),
      weekToYear: isoYear(to),
      workingDays,
      capacity: Math.round((workingDays / nominal) * 100),
      holidays,
    };
  });
}
