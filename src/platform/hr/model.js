import { holidaysInYear } from "../../data/holidays.js";
import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel, weekList } from "../calendar/model.js";
import { createEvent, dayKey, toDate } from "../calendar/events.js";
import { weekNumberEvents } from "../calendar/sources.js";
import { createHrConfig } from "./config.js";
import { HR_ORIGINS, HR_WARNING, HR_AGREEMENT_WARNING } from "./eventTypes.js";
import { statutoryHrDates } from "./statutory.js";
export function hrRecordDescription(row) {
  return [HR_ORIGINS[row.origin], row.reference, row.url, row.reviewed && `Lähde tarkistettu: ${row.reviewed}`, row.note, row.origin === "agreement" && HR_AGREEMENT_WARNING, HR_WARNING].filter(Boolean).join("\n");
}
export function buildHrModel(input) {
  const config = createHrConfig(input);
  const records = [...config.records,
    ...(config.holidays ? holidaysInYear(config.year).filter((h) => h.official).map((h) => ({ id: `holiday-${dayKey(h.date)}`, start: dayKey(h.date), end: dayKey(h.date), label: h.name, origin: "calendar", type: "holiday", note: "Suomen yleinen pyhäpäivä. Työvelvoite ja palkka riippuvat sovellettavista ehdoista." })) : []),
    ...(config.statutory ? statutoryHrDates(config.year) : [])].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const events = records.map((r) => createEvent({ id: `hr-${r.id}`, date: r.start, endDate: r.end, title: `${HR_ORIGINS[r.origin]}: ${r.label}`.slice(0, 120), kind: r.type === "holiday" ? "holiday" : r.type === "payday" ? "payday" : r.type === "closure" ? "closure" : r.type === "vacation" ? "leave" : "company", description: hrRecordDescription(r) }));
  const calendar = buildCalendarModel(createCalendarConfig({ year: config.year, dayRuleMode: "FINLAND_PROJECT", branding: { companyName: config.companyName }, include: { holidays: false, weekNumbers: true }, product: "hr-payroll-calendar" }), [...events, ...weekNumberEvents(config.year)]);
  return { config, records, calendar, weeks: weekList(calendar), warning: HR_WARNING, dates: records.map((r) => ({ ...r, date: toDate(r.start) })) };
}
