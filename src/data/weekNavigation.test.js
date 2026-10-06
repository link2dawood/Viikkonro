import { describe, expect, it } from "vitest";
import { weeksInIsoYear } from "../components/dateUtils.js";
import { sameWeekOtherYears } from "./weekNavigation.js";

describe("same-week cross-year navigation", () => {
  it("returns seven valid, unique years without linking the current page", () => {
    const links = sameWeekOtherYears(42, 2026, { minYear: 2020, maxYear: 2035 });
    expect(links).toHaveLength(7);
    expect(new Set(links.map((item) => item.year)).size).toBe(7);
    expect(links).not.toContainEqual({ week: 42, year: 2026 });
    expect(links.map((item) => item.year)).toEqual([...links.map((item) => item.year)].sort());
  });

  it("fills seven links at both prerender boundaries", () => {
    expect(sameWeekOtherYears(8, 2020, { minYear: 2020, maxYear: 2035 })).toHaveLength(7);
    expect(sameWeekOtherYears(8, 2035, { minYear: 2020, maxYear: 2035 })).toHaveLength(7);
  });

  it("never links a nonexistent week 53", () => {
    const links = sameWeekOtherYears(53, 2026, { minYear: 2020, maxYear: 2035 });
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((item) => weeksInIsoYear(item.year) === 53)).toBe(true);
  });

  it("rejects malformed or impossible input", () => {
    expect(sameWeekOtherYears(0, 2026)).toEqual([]);
    expect(sameWeekOtherYears("abc", 2026)).toEqual([]);
    expect(sameWeekOtherYears(54, 2026)).toEqual([]);
    expect(sameWeekOtherYears(42, 2026, { minYear: 2030, maxYear: 2020 })).toEqual([]);
    expect(sameWeekOtherYears(42, 2026, { limit: Number.NaN })).toEqual([]);
  });
});
