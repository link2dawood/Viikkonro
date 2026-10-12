import { describe, expect, it } from "vitest";
import { DAY_RULES, summarizeDayRange } from "./dayRules.js";
import { countPeriodDays, createPeriod } from "../platform/calendar/periods.js";
import { leaveDaysNeeded } from "./vacationPlanner.js";
import { sprintPlan } from "./sprintPlanner.js";

describe("shared inclusive day ranges", () => {
  it.each(Object.keys(DAY_RULES))("keeps %s consistent across a leap year and year boundary", (mode) => {
    const from = new Date(2027, 11, 20);
    const to = new Date(2029, 0, 7);
    const expected = { counted: 0, days: 0, weekdayExclusions: [] };
    // Independent enumeration, without millisecond arithmetic across DST.
    const date = new Date(from);
    while (date <= to) {
      expected.days += 1;
      const reason = DAY_RULES[mode].reason(date);
      if (reason === null) expected.counted += 1;
      else if (date.getDay() > 0 && date.getDay() < 6) expected.weekdayExclusions.push({ date: new Date(date), name: reason });
      date.setDate(date.getDate() + 1);
    }
    expect(summarizeDayRange(mode, from, to)).toEqual(expected);
    expect(from).toEqual(new Date(2027, 11, 20));
    expect(to).toEqual(new Date(2029, 0, 7));
  });

  it("preserves the distinction between banking, planning, project and statutory leave days", () => {
    const friday = new Date(2026, 5, 19); // Midsummer eve
    expect(summarizeDayRange("FINLAND_BANKING", friday, friday).counted).toBe(0);
    expect(summarizeDayRange("FINLAND_PLANNER", friday, friday).counted).toBe(0);
    expect(summarizeDayRange("FINLAND_PROJECT", friday, friday).counted).toBe(1);
    const saturday = new Date(2026, 5, 13);
    expect(summarizeDayRange("FINLAND_STATUTORY_LEAVE", saturday, saturday).counted).toBe(1);
    expect(summarizeDayRange("FINLAND_WORKDAY", saturday, saturday).counted).toBe(0);
  });

  it("returns an empty result for a reversed range", () => {
    expect(summarizeDayRange("FINLAND_PLANNER", new Date(2026, 0, 2), new Date(2026, 0, 1)))
      .toEqual({ counted: 0, days: 0, weekdayExclusions: [] });
  });

  it("keeps period, vacation and sprint counts consistent around Easter", () => {
    const from = new Date(2027, 2, 22);
    const to = new Date(2027, 3, 4);
    const period = createPeriod({ label: "Leave", start: from, end: to, kind: "leave" });
    expect(countPeriodDays(period, "FINLAND_PLANNER")).toBe(8);
    expect(leaveDaysNeeded(from, to)).toBe(8);
    const [sprint] = sprintPlan(from, 2, 1);
    expect(sprint.workingDays).toBe(8);
    expect(sprint.capacity).toBe(80);
    expect(sprint.holidays.map((h) => h.date.getDate())).toEqual([26, 29]);
  });

  it.each([[2026, 2, 27], [2026, 9, 24]])("counts seven calendar days across the DST weekend %s/%s/%s", (year, month, day) => {
    const from = new Date(year, month, day);
    const to = new Date(year, month, day + 6);
    expect(summarizeDayRange("FINLAND_PROJECT", from, to).days).toBe(7);
  });
});
