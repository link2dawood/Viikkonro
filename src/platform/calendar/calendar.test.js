import { describe, expect, it } from "vitest";
import { createEvent, dayKey, eventsToIcs, expandEvent, groupByDate, sortEvents, toDate } from "./events.js";
import { countPeriodDays, createPeriod, findOverlaps, periodToEvent } from "./periods.js";
import {
  finnishCalendarEvents,
  flagDayCalendarEvents,
  holidayCalendarEvents,
  paydayCalendarEvents,
  paydayDateEvents,
  schoolHolidayCalendarEvents,
  schoolHolidayCities,
  schoolHolidayCoverage,
  weekNumberEvents,
} from "./sources.js";
import {
  CONFIG_VERSION,
  MAX_COMPANY_EVENTS,
  configFromJson,
  configToJson,
  createCalendarConfig,
  validateCalendarConfig,
} from "./config.js";
import { buildCalendarModel, monthRows } from "./model.js";
import { holidaysInYear } from "../../data/holidays.js";
import { flagDaysInYear } from "../../data/flagDayPages.js";

const d = (y, m, day) => new Date(y, m - 1, day);

describe("calendar events", () => {
  const base = { id: "e1", date: "2027-03-22", title: "  Kokous  ", kind: "company" };
  it("normalises dates, titles and optional fields", () => {
    const e = createEvent({ ...base, endDate: "2027-03-22", description: " x ", url: "" });
    expect(e.date).toEqual(d(2027, 3, 22));
    expect(e.endDate).toBeNull(); // same day is a single-day event
    expect(e.title).toBe("Kokous");
    expect(e.description).toBe("x");
    expect(e.url).toBeNull();
    expect(e.source).toBe("custom");
    expect(Object.isFrozen(e)).toBe(true);
  });
  it("accepts a Date and strips the time of day", () => {
    expect(createEvent({ ...base, date: new Date(2027, 2, 22, 15, 30) }).date).toEqual(d(2027, 3, 22));
    expect(toDate("2027-02-30")).toBeNull();
    expect(toDate(42)).toBeNull();
  });
  it("rejects bad input with a clear message", () => {
    expect(() => createEvent({ ...base, date: "nope" })).toThrow(/date/);
    expect(() => createEvent({ ...base, endDate: "2027-03-01" })).toThrow(/before/);
    expect(() => createEvent({ ...base, endDate: "bad" })).toThrow(/endDate/);
    expect(() => createEvent({ ...base, endDate: "2029-03-22" })).toThrow(/at most/);
    expect(() => createEvent({ ...base, title: "   " })).toThrow(/title/);
    expect(() => createEvent({ ...base, title: "x".repeat(121) })).toThrow(/longer/);
    expect(() => createEvent({ ...base, kind: "party" })).toThrow(/kind/);
    expect(() => createEvent({ ...base, id: "bad id!" })).toThrow(/id/);
    expect(() => createEvent(null)).toThrow();
  });
  it("expands a multi-day event into one event per day", () => {
    const e = createEvent({ ...base, date: "2027-07-29", endDate: "2027-08-02" });
    const days = expandEvent(e);
    expect(days.map((x) => dayKey(x.date))).toEqual(["2027-07-29", "2027-07-30", "2027-07-31", "2027-08-01", "2027-08-02"]);
    expect(new Set(days.map((x) => x.id)).size).toBe(5);
    expect(expandEvent(createEvent(base))).toHaveLength(1);
  });
  it("sorts by date, then kind, then title", () => {
    const list = sortEvents([
      createEvent({ id: "c", date: "2027-01-01", title: "B", kind: "company" }),
      createEvent({ id: "h", date: "2027-01-01", title: "Z", kind: "holiday" }),
      createEvent({ id: "a", date: "2027-01-01", title: "A", kind: "company" }),
      createEvent({ id: "e", date: "2026-12-31", title: "Early", kind: "week" }),
    ]);
    expect(list.map((x) => x.id)).toEqual(["e", "h", "a", "c"]);
  });
  it("groups events by day and maps them to ICS events", () => {
    const e = createEvent({ ...base, date: "2027-07-29", endDate: "2027-07-30" });
    const grouped = groupByDate([e]);
    expect([...grouped.keys()]).toEqual(["2027-07-29", "2027-07-30"]);
    const [ics] = eventsToIcs([e], { domain: "example.fi" });
    expect(ics).toMatchObject({ uid: "e1@example.fi", summary: "Kokous", date: d(2027, 7, 29), endDate: d(2027, 7, 30) });
  });
});

describe("periods", () => {
  it("creates a period and turns it into one multi-day event", () => {
    const p = createPeriod({ label: "Kesäsulku", start: "2027-07-05", end: "2027-07-30" });
    expect(p).toMatchObject({ id: "closure-2027-07-05", kind: "closure", note: null });
    const e = periodToEvent(p);
    expect(e).toMatchObject({ kind: "closure", title: "Kesäsulku", source: "company" });
    expect(dayKey(e.endDate)).toBe("2027-07-30");
  });
  it("treats a missing end as a one-day period and validates input", () => {
    expect(createPeriod({ label: "Päivä", start: "2027-03-01" }).end).toEqual(d(2027, 3, 1));
    expect(() => createPeriod({ label: "x", start: "2027-03-02", end: "2027-03-01" })).toThrow(/before/);
    expect(() => createPeriod({ label: "", start: "2027-03-01" })).toThrow(/label/);
    expect(() => createPeriod({ label: "x", start: "2027-03-01", kind: "nap" })).toThrow(/kind/);
    expect(() => createPeriod({ label: "x" })).toThrow(/start/);
  });
  it("counts the days that count under each day rule", () => {
    // 19-24 April 2027: Monday to Saturday, no holidays.
    const week = createPeriod({ label: "Loma", start: "2027-04-19", end: "2027-04-24", kind: "leave" });
    expect(countPeriodDays(week, "FINLAND_STATUTORY_LEAVE")).toBe(6); // a Saturday is a leave day
    expect(countPeriodDays(week, "FINLAND_PLANNER")).toBe(5);
    expect(countPeriodDays(week, "FINLAND_PROJECT")).toBe(5);
  });
  it("finds overlapping periods", () => {
    const a = createPeriod({ id: "a", label: "A", start: "2027-07-01", end: "2027-07-10" });
    const b = createPeriod({ id: "b", label: "B", start: "2027-07-10", end: "2027-07-15" });
    const c = createPeriod({ id: "c", label: "C", start: "2027-08-01", end: "2027-08-02" });
    expect(findOverlaps([a, b, c]).map(([x, y]) => x.id + y.id)).toEqual(["ab"]);
  });
});

describe("Finnish event sources", () => {
  it("wraps every holiday and flag day without recomputing them", () => {
    const holidays = holidayCalendarEvents(2027);
    expect(holidays).toHaveLength(holidaysInYear(2027).length);
    expect(holidays.every((e) => e.kind === "holiday")).toBe(true);
    expect(holidays.find((e) => e.title === "Jouluaatto").description).toMatch(/Ei virallinen/);
    expect(holidays.find((e) => e.title === "Loppiainen").description).toMatch(/Virallinen/);
    expect(holidays.find((e) => e.title === "1. pääsiäispäivä").id).toBe("holiday-2027-03-28-1-paasiaispaiva");
    expect(flagDayCalendarEvents(2027)).toHaveLength(flagDaysInYear(2027).length);
  });
  it("gives one payday a month and moves it to the previous banking day", () => {
    const paydays = paydayCalendarEvents(2027, 15);
    expect(paydays).toHaveLength(12);
    const may = paydays.find((e) => e.date.getMonth() === 4);
    expect(dayKey(may.date)).toBe("2027-05-14"); // the 15th is a Saturday
    expect(may.description).toMatch(/lauantai/);
    expect(paydays.find((e) => e.date.getMonth() === 0).description).toBeNull();
    expect(paydayCalendarEvents(2027, "last")).toHaveLength(12);
  });
  it("lists a week number on every Monday of the calendar year", () => {
    const weeks = weekNumberEvents(2027);
    expect(weeks).toHaveLength(52);
    expect(weeks[0]).toMatchObject({ id: "week-2027-1", title: "Vk 1" });
    const w2026 = weekNumberEvents(2026);
    expect(w2026[w2026.length - 1].id).toBe("week-2026-53"); // 28 Dec 2026 is a Monday in ISO week 53
  });
  it("builds exactly the events a configuration asks for", () => {
    const base = { year: 2027, periods: [{ label: "Sulku", start: "2027-07-05", end: "2027-07-09" }], events: [{ date: "2027-05-12", title: "Päivä" }] };
    const none = createCalendarConfig({ ...base, include: { weekNumbers: false, holidays: false, flagDays: false } });
    expect(finnishCalendarEvents(none).map((e) => e.kind).sort()).toEqual(["closure", "company"]);
    const all = createCalendarConfig({ ...base, include: { flagDays: true, paydays: true } });
    const kinds = new Set(finnishCalendarEvents(all).map((e) => e.kind));
    expect([...kinds].sort()).toEqual(["closure", "company", "flag-day", "holiday", "payday", "week"]);
    expect(finnishCalendarEvents(all)).toEqual(sortEvents(finnishCalendarEvents(all)));
  });
});

describe("calendar configuration", () => {
  const input = {
    year: 2027,
    dayRuleMode: "FINLAND_WORKDAY",
    include: { flagDays: true, paydays: { day: "last" } },
    events: [{ id: "agm", date: "2027-05-12", title: "Yhtiökokous", description: "Toimisto" }],
    periods: [{ id: "summer", label: "Kesäsulku", start: "2027-07-05", end: "2027-07-30", kind: "closure", note: "Toimisto kiinni" }],
    branding: { companyName: "Oy Testi Ab", primaryColor: "#1F7A5C" },
    theme: "minimal",
    layout: { id: "month-page", paper: "A3" },
    product: "company-calendar",
  };
  it("applies defaults for a bare year", () => {
    const c = createCalendarConfig({ year: 2027 });
    expect(c).toMatchObject({
      dayRuleMode: "FINLAND_PLANNER",
      include: { weekNumbers: true, holidays: true, flagDays: false, paydays: null },
      theme: "classic",
      layout: { id: "year-glance", paper: "A4", orientation: null },
      product: null,
    });
    expect(c.branding).toMatchObject({ companyName: "", logo: null, primaryColor: null });
  });
  it("is immutable", () => {
    const c = createCalendarConfig(input);
    expect(Object.isFrozen(c)).toBe(true);
    expect(Object.isFrozen(c.include)).toBe(true);
    expect(Object.isFrozen(c.events)).toBe(true);
    expect(() => {
      "use strict";
      c.year = 2030;
    }).toThrow();
  });
  it("round-trips through JSON without losing anything", () => {
    const c = createCalendarConfig(input);
    const json = configToJson(c);
    expect(json.version).toBe(CONFIG_VERSION);
    const wire = JSON.parse(JSON.stringify(json));
    expect(wire.events[0].date).toBe("2027-05-12");
    expect(wire.branding.primaryColor).toBe("#1f7a5c");
    expect(configToJson(configFromJson(wire))).toEqual(json);
  });
  it("rejects an unsupported saved version", () => {
    expect(() => configFromJson({ version: 99, year: 2027 })).toThrow(/version/);
    expect(() => configFromJson(null)).toThrow(/version/);
  });
  it("reports every problem at once instead of stopping at the first", () => {
    const { config, issues } = validateCalendarConfig({
      year: 1999,
      dayRuleMode: "NOPE",
      theme: "neon",
      product: "teleporter",
      layout: { id: "poster" },
      branding: { primaryColor: "red" },
      include: { paydays: { day: 40 } },
      events: [{ date: "x", title: "T" }],
      periods: [{ label: "P", start: "2027-02-02", end: "2027-02-01" }],
    });
    expect(config).toBeNull();
    expect(issues.length).toBeGreaterThanOrEqual(9);
    expect(issues.join(" ")).toMatch(/year/);
    expect(issues.join(" ")).toMatch(/dayRuleMode/);
    expect(issues.join(" ")).toMatch(/primaryColor/);
    expect(issues.join(" ")).toMatch(/events\[0\]/);
    expect(issues.join(" ")).toMatch(/periods\[0\]/);
    expect(() => createCalendarConfig({ year: 1999 })).toThrow(/Invalid calendar configuration/);
  });
  it("rejects duplicate ids and over-large lists", () => {
    expect(validateCalendarConfig({ year: 2027, events: [{ id: "x", date: "2027-01-01", title: "A" }, { id: "x", date: "2027-01-02", title: "B" }] }).issues.join()).toMatch(/Duplicate id "x"/);
    const many = Array.from({ length: MAX_COMPANY_EVENTS + 1 }, (_, i) => ({ date: "2027-01-01", title: `E${i}` }));
    expect(validateCalendarConfig({ year: 2027, events: many }).issues.join()).toMatch(/At most/);
  });
  it("accepts true as the default payday", () => {
    expect(createCalendarConfig({ year: 2027, include: { paydays: true } }).include.paydays).toEqual({ day: 15 });
  });
});

describe("calendar model", () => {
  // The month-row algorithm as it was written in prerender.js before the extraction.
  function legacyPdfMonthRows(year, monthIndex) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const rows = [];
    let current = null;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      const col = (date.getDay() + 6) % 7;
      if (col === 0 || !current) {
        current = new Array(7).fill(null);
        rows.push(current);
      }
      current[col] = { day, date };
    }
    return rows;
  }
  it("produces the same month rows as the PDF generator did", () => {
    for (let year = 2024; year <= 2030; year += 1) {
      for (let m = 0; m < 12; m += 1) expect(monthRows(year, m)).toEqual(legacyPdfMonthRows(year, m));
    }
  });
  it("lines every day up under its weekday and covers each day once", () => {
    for (const year of [2026, 2027, 2028]) {
      const days = [];
      for (let m = 0; m < 12; m += 1) {
        for (const row of monthRows(year, m)) {
          row.forEach((cell, col) => {
            if (!cell) return;
            expect((cell.date.getDay() + 6) % 7).toBe(col);
            days.push(dayKey(cell.date));
          });
        }
      }
      expect(days).toHaveLength(year === 2028 ? 366 : 365);
      expect(new Set(days).size).toBe(days.length);
    }
  });
  const config = createCalendarConfig({
    year: 2028,
    events: [{ date: "2028-02-29", title: "Karkauspäivä" }],
    periods: [{ label: "Sulku", start: "2028-07-03", end: "2028-07-07" }],
  });
  const model = buildCalendarModel(config);
  const allDays = model.months.flatMap((mo) => mo.rows.flatMap((r) => r.days.filter(Boolean)));
  it("gives each row its ISO week and each day its events", () => {
    expect(model.months).toHaveLength(12);
    expect(model.months[0].name).toBe("Tammikuu");
    expect(model.months[0].rows[0]).toMatchObject({ week: 52, weekYear: 2027 }); // 1 Jan 2028 is a Saturday
    const leap = allDays.find((x) => x.key === "2028-02-29");
    expect(leap.events.map((e) => e.title)).toEqual(["Karkauspäivä"]);
    expect(allDays.find((x) => x.key === "2028-07-05").events.map((e) => e.kind)).toEqual(["closure"]);
  });
  it("counts days under the configured rule, with the reason a day does not count", () => {
    expect(allDays).toHaveLength(366);
    const holidays = new Set(holidaysInYear(2028).map((h) => dayKey(h.date)));
    const expected = allDays.filter((x) => ![0, 6].includes(x.date.getDay()) && !holidays.has(x.key)).length;
    expect(model.stats.counted).toBe(expected);
    expect(model.stats.days).toBe(366);
    expect(model.stats.counted + model.stats.notCounted).toBe(366);
    expect(allDays.find((x) => x.key === "2028-01-06")).toMatchObject({ counts: false, reason: "Loppiainen" });
    expect(allDays.find((x) => x.key === "2028-01-08")).toMatchObject({ counts: false, reason: "Lauantai" });
    expect(allDays.find((x) => x.key === "2028-01-10")).toMatchObject({ counts: true, reason: null });
  });
  it("lets the day rule change what counts without changing the events", () => {
    const leave = buildCalendarModel(createCalendarConfig({ year: 2028, dayRuleMode: "FINLAND_STATUTORY_LEAVE" }));
    const saturday = leave.months[0].rows[0].days[5]; // 1 Jan 2028 is a Saturday and a holiday
    expect(saturday.reason).toBe("Uudenvuodenpäivä");
    expect(leave.stats.counted).toBeGreaterThan(model.stats.counted); // Saturdays count as leave days
    expect(leave.stats.eventsByKind.holiday).toBe(model.stats.eventsByKind.holiday);
  });
  it("accepts a custom event list", () => {
    const custom = buildCalendarModel(config, []);
    expect(custom.events).toEqual([]);
    expect(custom.months[1].rows.flatMap((r) => r.days).filter(Boolean).every((x) => x.events.length === 0)).toBe(true);
  });
});

describe("school holidays by city", () => {
  it("lists the cities the school-holiday data names for a year, and none for a year without data", () => {
    expect(schoolHolidayCities(2026)).toContain("Helsinki");
    expect(schoolHolidayCities(2026)).toContain("Oulu");
    expect(schoolHolidayCities(2028).sort()).toEqual(["Helsinki", "Joensuu", "Oulu", "Tampere", "Turku"]);
    expect(schoolHolidayCities(2029)).toEqual([]);
    expect(schoolHolidayCities(2026)).toEqual([...schoolHolidayCities(2026)].sort((a, b) => a.localeCompare(b, "fi")));
  });
  it("turns a city's winter and autumn holidays into events, from the existing data", () => {
    const events = schoolHolidayCalendarEvents(2026, "Helsinki");
    expect(events.map((e) => [e.title, dayKey(e.date), dayKey(e.endDate)])).toEqual([
      ["Hiihtoloma (viikko 8)", "2026-02-16", "2026-02-20"],
      ["Syysloma (viikko 42)", "2026-10-12", "2026-10-16"],
    ]);
    expect(events[0]).toMatchObject({ kind: "school", source: "viikkonro:school-holidays" });
    expect(events[0].description).toMatch(/Tarkista oman koulusi päivät/);
    // Oulu's autumn break in 2026 is week 43, ending on Sunday.
    expect(schoolHolidayCalendarEvents(2026, "Oulu").map((e) => dayKey(e.endDate))).toEqual(["2026-03-06", "2026-10-25"]);
  });
  it("leaves out a holiday the data does not have instead of guessing", () => {
    expect(schoolHolidayCoverage(2027, "Helsinki")).toEqual({ winter: true, autumn: true });
    expect(schoolHolidayCoverage(2027, "Tampere")).toEqual({ winter: true, autumn: false });
    expect(schoolHolidayCalendarEvents(2027, "Tampere").map((e) => e.title)).toEqual(["Hiihtoloma (viikko 9)"]);
    expect(schoolHolidayCalendarEvents(2027, "Atlantis")).toEqual([]);
    expect(schoolHolidayCalendarEvents(2029, "Helsinki")).toEqual([]);
    expect(schoolHolidayCoverage(2029, "Helsinki")).toEqual({ winter: false, autumn: false });
  });
  it("is part of a configuration only for a city the year has data for", () => {
    const c = createCalendarConfig({ year: 2027, include: { schoolHolidays: { city: "Helsinki" } } });
    expect(finnishCalendarEvents(c).filter((e) => e.kind === "school")).toHaveLength(2);
    expect(createCalendarConfig({ year: 2027, include: { schoolHolidays: "Helsinki" } }).include.schoolHolidays).toEqual({ city: "Helsinki" });
    expect(validateCalendarConfig({ year: 2027, include: { schoolHolidays: { city: "Atlantis" } } }).issues.join()).toMatch(/"Atlantis" is not available for 2027/);
    expect(validateCalendarConfig({ year: 2029, include: { schoolHolidays: { city: "Helsinki" } } }).issues.join()).toMatch(/not available for 2029/);
  });
});

describe("individual payday dates", () => {
  it("become payday events, and a date the rule already covers is not repeated", () => {
    const c = createCalendarConfig({ year: 2027, include: { paydays: { day: 15 } }, paydayDates: ["2027-01-15", "2027-01-20", "2027-01-20"] });
    expect(c.paydayDates).toEqual(["2027-01-15", "2027-01-20"]); // sorted and de-duplicated
    const paydays = finnishCalendarEvents(c).filter((e) => e.kind === "payday").map((e) => dayKey(e.date));
    expect(paydays.filter((d) => d === "2027-01-15")).toHaveLength(1);
    expect(paydays).toContain("2027-01-20");
    expect(paydays).toHaveLength(13);
    expect(paydayDateEvents(["2027-03-01"], new Set(["2027-03-01"]))).toEqual([]);
  });
  it("must lie in the calendar's year and are limited in number", () => {
    expect(validateCalendarConfig({ year: 2027, paydayDates: ["2026-12-31"] }).issues.join()).toMatch(/paydayDates\[0\] must be a date in 2027/);
    expect(validateCalendarConfig({ year: 2027, paydayDates: ["nope"] }).issues.join()).toMatch(/paydayDates\[0\]/);
    const many = Array.from({ length: 61 }, (_, i) => `2027-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`);
    expect(validateCalendarConfig({ year: 2027, paydayDates: many }).issues.join()).toMatch(/At most 60/);
  });
  it("survive a round trip together with school holidays", () => {
    const c = createCalendarConfig({ year: 2027, include: { schoolHolidays: { city: "Helsinki" } }, paydayDates: ["2027-06-15"] });
    const json = JSON.parse(JSON.stringify(configToJson(c)));
    expect(json.paydayDates).toEqual(["2027-06-15"]);
    expect(json.include.schoolHolidays).toEqual({ city: "Helsinki" });
    expect(configToJson(configFromJson(json))).toEqual(configToJson(c));
  });
});
