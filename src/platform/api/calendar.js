import { isoWeek, isoYear, mondayOf, weeksInIsoYear } from "../../components/dateUtils.js";
import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
import { dayKey } from "../calendar/events.js";
import { schoolHolidayCities, schoolHolidayCalendarEvents, schoolHolidayCoverage } from "../calendar/sources.js";
import { holidaysInYear } from "../../data/holidays.js";
import { flagDaysInYear } from "../../data/flagDayPages.js";
import { paydaysInYear } from "../../data/paydayPages.js";
import { schoolHolidayPage, SCHOOL_HOLIDAY_SOURCES } from "../../data/schoolHolidayPages.js";
import { DAY_RULES, summarizeDayRange } from "../../data/dayRules.js";
import { parseIsoDate, addDays } from "../../data/planningDates.js";

export const API_RESOURCES = Object.freeze(["calendar", "holidays", "working-days", "week", "paydays", "flag-days", "school-holidays"]);
export class ApiInputError extends Error {}
const invalid = () => { throw new ApiInputError("Virheellinen tai puuttuva parametri."); };
const number = (value, min, max) => { if (!/^\d+$/.test(value ?? "")) invalid(); const n = Number(value); if (!Number.isSafeInteger(n) || n < min || n > max) invalid(); return n; };
const date = (value) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) invalid(); const d = parseIsoDate(value); if (!d || d.getFullYear() < 2000 || d.getFullYear() > 2100) invalid(); return d; };
const allowed = {
  calendar: ["year", "rule"], holidays: ["year"], "flag-days": ["year"], paydays: ["year", "day"],
  "working-days": ["from", "to", "rule"], week: ["date", "year", "week"], "school-holidays": ["year", "city"],
};
const rule = (params) => { const id = params.get("rule") ?? "FINLAND_WORKDAY"; if (!Object.hasOwn(DAY_RULES, id)) invalid(); return id; };
const stamp = (d) => ({ date: dayKey(d), week: isoWeek(d), weekYear: isoYear(d) });

// Date-only output uses civil dates from the existing engine, never UTC slicing.
export function calendarApiData(resource, params) {
  if (!API_RESOURCES.includes(resource)) invalid();
  for (const key of params.keys()) if (!allowed[resource].includes(key) || params.getAll(key).length !== 1) invalid();
  if (resource === "working-days") {
    const from = date(params.get("from")), to = date(params.get("to")), mode = rule(params);
    if (to < from || to > addDays(from, 365)) invalid();
    const result = summarizeDayRange(mode, from, to);
    return { from: dayKey(from), to: dayKey(to), inclusive: true, rule: mode, disclosure: DAY_RULES[mode].disclosure,
      days: result.days, counted: result.counted, weekdayExclusions: result.weekdayExclusions.map((r) => ({ ...stamp(r.date), reason: r.name })) };
  }
  if (resource === "week") {
    let d;
    if (params.has("date")) { if (params.has("year") || params.has("week")) invalid(); d = date(params.get("date")); }
    else { const year = number(params.get("year"), 2000, 2100); d = mondayOf(number(params.get("week"), 1, weeksInIsoYear(year)), year); }
    const monday = mondayOf(isoWeek(d), isoYear(d));
    return { ...stamp(d), from: dayKey(monday), to: dayKey(addDays(monday, 6)) };
  }
  const year = number(params.get("year"), 2000, 2100);
  if (resource === "holidays") return { year, holidays: holidaysInYear(year).map((h) => ({ ...stamp(h.date), name: h.name, official: Boolean(h.official) })) };
  if (resource === "flag-days") return { year, flagDays: flagDaysInYear(year).map((f) => ({ ...stamp(f.date), name: f.name, slug: f.slug, category: f.categoryLabel })) };
  if (resource === "paydays") {
    const day = params.get("day") ?? "15", selected = day === "last" ? day : number(day, 1, 31);
    return { year, day: selected, rule: "FINLAND_BANKING", disclosure: DAY_RULES.FINLAND_BANKING.disclosure,
      paydays: paydaysInYear(year, selected).map((p) => ({ ...stamp(p.actual), nominal: dayKey(p.nominal), month: p.month, moved: p.moved, reason: p.reason })) };
  }
  if (resource === "school-holidays") {
    const cities = schoolHolidayCities(year), city = params.get("city");
    if (!cities.length || !city || !cities.includes(city)) invalid();
    const page = schoolHolidayPage(year);
    const references = [...page.winter, ...page.autumn].filter((group) => group.cities.includes(city)).map((group) => ({
      from: dayKey(group.startDate), to: dayKey(group.endDate), confidence: group.confidence,
      sourceUrl: SCHOOL_HOLIDAY_SOURCES[group.sourceKey].url, verifiedAt: SCHOOL_HOLIDAY_SOURCES[group.sourceKey].verifiedAt,
    }));
    return { year, city, coverage: schoolHolidayCoverage(year, city), disclosure: "Aineisto kattaa hiihto- ja syyslomia. Arviot on merkitty otsikkoon. Tarkista oman koulun päivät; muut lomat eivät sisälly aineistoon.",
      periods: schoolHolidayCalendarEvents(year, city).map((e) => ({ ...references.find((r) => r.from === dayKey(e.date) && r.to === dayKey(e.endDate ?? e.date)), from: dayKey(e.date), to: dayKey(e.endDate ?? e.date), title: e.title, source: e.source, reference: e.description })) };
  }
  const mode = rule(params), model = buildCalendarModel(createCalendarConfig({ year, dayRuleMode: mode, include: { holidays: true } }));
  return { year, rule: mode, disclosure: DAY_RULES[mode].disclosure, days: model.months.flatMap((m) => m.rows.flatMap((r) => r.days.filter(Boolean))).map((d) => ({ ...stamp(d.date), counted: d.counts, reason: d.reason })) };
}
