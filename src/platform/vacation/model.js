import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
import { dayKey, toDate } from "../calendar/events.js";
import { countsAsDay, DAY_RULES } from "../../data/dayRules.js";
import { addDays } from "../../data/planningDates.js";
import { validateVacationConfig } from "./config.js";

const covers = (row, key) => row.start <= key && key <= row.end;
export function buildVacationModel(input) {
  const validated = validateVacationConfig(input);
  if (!validated.config) throw new Error(validated.issues.join(" "));
  const config = validated.config;
  const personById = new Map(config.people.map((person) => [person.id, person]));
  const calendar = buildCalendarModel(createCalendarConfig({ year: config.year, dayRuleMode: config.workRule,
    branding: { companyName: "Lomasuunnitelma Pro" }, layout: { id: config.layout, paper: "A4" },
    include: { weekNumbers: true, holidays: true },
    events: config.periods.map((period) => ({ id: `vacation-${period.id}`, date: period.start, endDate: period.end,
      title: `${personById.get(period.personId).label}: ${period.label}`, kind: period.type === "vacation" ? "leave" : "company",
      description: `${period.type === "vacation" ? "Loma" : "Muu poissaolo"}. ${period.note}`, source: "vacation-pro" })),
    periods: config.closures.map((period) => ({ ...period, kind: "closure" })),
  }));
  const days = calendar.months.flatMap((month) => month.rows.flatMap((row) => row.days.filter(Boolean)));
  const summaries = config.people.map((person) => {
    let vacationDays = 0, absenceDays = 0, workingDays = 0, availableDays = 0, overlapDays = 0;
    const rows = config.periods.filter((period) => period.personId === person.id);
    for (const day of days) {
      const key = dayKey(day.date);
      const closed = config.closures.some((period) => covers(period, key));
      const vacation = rows.some((period) => period.type === "vacation" && covers(period, key));
      const absence = rows.some((period) => period.type === "absence" && covers(period, key));
      const work = countsAsDay(config.workRule, day.date) && !closed;
      // Closures affect planning availability, never statutory consumption.
      if (vacation && countsAsDay(config.leaveRule, day.date) && (config.leaveRule === "FINLAND_STATUTORY_LEAVE" || !closed)) vacationDays += 1;
      if (absence && work) absenceDays += 1;
      if (work) workingDays += 1;
      if (work && !vacation && !absence) availableDays += 1;
      if (rows.filter((period) => covers(period, key)).length > 1) overlapDays += 1;
    }
    return Object.freeze({ ...person, vacationDays, absenceDays, workingDays, availableDays, overlapDays });
  });
  const periodDays = (period) => {
    let count = 0;
    const from = toDate(period.start), to = toDate(period.end);
    // Row counts describe the full period, annual summaries only selected-year dates.
    for (let date = from; date <= to; date = addDays(date, 1)) {
      const key = dayKey(date), closed = config.closures.some((closure) => covers(closure, key));
      const mode = period.type === "vacation" ? config.leaveRule : config.workRule;
      if (countsAsDay(mode, date) && (period.type === "vacation" && mode === "FINLAND_STATUTORY_LEAVE" || !closed)) count += 1;
    }
    return count;
  };
  return Object.freeze({ config, calendar, summaries: Object.freeze(summaries),
    periods: Object.freeze(config.periods.map((period) => Object.freeze({ ...period, person: personById.get(period.personId).label, counted: periodDays(period) }))),
    disclosure: DAY_RULES[config.leaveRule].disclosure, workDisclosure: DAY_RULES[config.workRule].disclosure });
}
