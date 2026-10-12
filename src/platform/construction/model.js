import { addDays } from "../../data/planningDates.js";
import { countsAsDay } from "../../data/dayRules.js";
import { holidaysInYear } from "../../data/holidays.js";
import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { dayKey, toDate } from "../calendar/events.js";
import { createPeriod } from "../calendar/periods.js";
import { calendarGroups, workingDayRule } from "../planning/dates.js";
import { CONSTRUCTION_RULE, validateConstructionConfig } from "./config.js";

export function buildConstructionModel(input) {
  const config = validateConstructionConfig(input);
  const start = toDate(config.start), end = toDate(config.end);
  const records = config.records.map((row) => Object.freeze({ ...row, from: toDate(row.start), to: toDate(row.end), week: isoWeek(toDate(row.start)), weekYear: isoYear(toDate(row.start)) })).sort((a, b) => a.from - b.from || a.id.localeCompare(b.id));
  const shutdowns = records.filter((row) => row.type === "shutdown").map((row) => createPeriod({ id: row.id, label: row.label, start: row.from, end: row.to, note: row.note }));
  const closedDates = new Set();
  for (const period of shutdowns) for (let date = period.start; date <= period.end; date = addDays(date, 1)) if (countsAsDay(CONSTRUCTION_RULE, date)) closedDates.add(dayKey(date));
  const holidays = [];
  for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) holidays.push(...holidaysInYear(year).filter((h) => h.official && h.date >= start && h.date <= end));
  const weeks = calendarGroups(start, end, CONSTRUCTION_RULE).map((week) => {
    let shutdownDays = 0;
    for (let date = week.from; date <= week.to; date = addDays(date, 1)) if (closedDates.has(dayKey(date))) shutdownDays += 1;
    return Object.freeze({ ...week, shutdownDays, availableDays: week.workingDays - shutdownDays,
      records: Object.freeze(records.filter((row) => row.from <= week.to && row.to >= week.from)), holidays: Object.freeze(holidays.filter((h) => h.date >= week.from && h.date <= week.to)) });
  });
  const conflicts = records.filter((row) => row.type !== "shutdown" && shutdowns.some((period) => row.from <= period.end && row.to >= period.start));
  return Object.freeze({ config, start, end, records: Object.freeze(records), weeks: Object.freeze(weeks), holidays: Object.freeze(holidays), shutdowns: Object.freeze(shutdowns),
    workingDays: weeks.reduce((sum, week) => sum + week.workingDays, 0), availableDays: weeks.reduce((sum, week) => sum + week.availableDays, 0),
    conflicts: Object.freeze(conflicts), disclosure: workingDayRule(CONSTRUCTION_RULE).disclosure });
}
export function constructionWeek(model, key) {
  return model.weeks.find((week) => week.key === key) ?? model.weeks[0];
}
export function constructionConflicts(model, weekKey = null) {
  if (weekKey === null) return model.conflicts;
  const week = constructionWeek(model, weekKey);
  return model.conflicts.filter((row) => model.shutdowns.some((period) => Math.max(+row.from, +period.start, +week.from) <= Math.min(+row.to, +period.end, +week.to)));
}
