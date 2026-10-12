import { describe, expect, it } from "vitest";
import {
  HOLIDAY_DEFINITIONS,
  holidayFaqs,
  holidayLinkPath,
  holidayPageFor,
  holidayPageMeta,
  vappuPlanning,
} from "./holidayPages.js";
import {
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
} from "../components/dateUtils.js";

describe("named holiday pages", () => {
  it("defines 15 unique canonical holiday slugs", () => {
    expect(HOLIDAY_DEFINITIONS).toHaveLength(15);
    expect(new Set(HOLIDAY_DEFINITIONS.map((item) => item.slug)).size).toBe(15);
    for (const item of HOLIDAY_DEFINITIONS) {
      expect(item.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("resolves all 240 holiday and year combinations", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      for (const item of HOLIDAY_DEFINITIONS) {
        expect(holidayPageFor(year, item.slug)).not.toBeNull();
      }
    }
  });

  it.each([
    [2027, "juhannuspaiva", "2027-06-26", 25, "Lauantai"],
    [2030, "paasiaispaiva", "2030-04-21", 16, "Sunnuntai"],
    [2024, "loppiainen", "2024-01-06", 1, "Lauantai"],
    [2026, "paasiaispaiva", "2026-04-05", 14, "Sunnuntai"],
    [2026, "itsenaisyyspaiva", "2026-12-06", 49, "Sunnuntai"],
  ])("answers known search intent for %i/%s", (year, slug, date, week, weekday) => {
    const page = holidayPageFor(year, slug);
    const localDate = `${page.date.getFullYear()}-${String(page.date.getMonth() + 1).padStart(2, "0")}-${String(page.date.getDate()).padStart(2, "0")}`;
    expect(localDate).toBe(date);
    expect(page.week).toBe(week);
    expect(page.weekday).toBe(weekday);
  });

  it("keeps every title and description within snippet budgets", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      for (const item of HOLIDAY_DEFINITIONS) {
        const meta = holidayPageMeta(year, item.slug);
        expect(meta.title.length).toBeLessThanOrEqual(60);
        expect(meta.description.length).toBeGreaterThanOrEqual(140);
        expect(meta.description.length).toBeLessThanOrEqual(158);
      }
    }
  });

  it("provides five visible-schema FAQ entries per page", () => {
    const page = holidayPageFor(2026, "juhannuspaiva");
    expect(holidayFaqs(page)).toHaveLength(5);
  });

  it("rejects unknown holiday slugs", () => {
    expect(holidayPageFor(2026, "tuntematon")).toBeNull();
    expect(holidayPageMeta(2026, "tuntematon")).toBeNull();
  });

  it.each([
    [2026, "Perjantai", 18, true],
    [2027, "Lauantai", 17, false],
    [2028, "Maanantai", 18, true],
  ])("explains Vappu planning in %i without shifting a weekend holiday", (year, weekday, week, weekdayExcluded) => {
    const page = holidayPageFor(year, "vappu"), planning = vappuPlanning(page);
    expect(page.weekday).toBe(weekday);
    expect(page.week).toBe(week);
    expect(page.date.getMonth()).toBe(4);
    expect(page.date.getDate()).toBe(1);
    expect(planning.eve.getMonth()).toBe(3);
    expect(planning.eve.getDate()).toBe(30);
    expect(planning.weekdayExcluded).toBe(weekdayExcluded);
    expect(planning.flag.category).toBe("virallinen");
    expect(planning.flag.altName).toBe("suomalaisen työn päivä");
    expect(planning.flag.date.getTime()).toBe(page.date.getTime());
    expect(holidayFaqs(page)).toHaveLength(7);
    expect(holidayFaqs(page).at(-2).a).toContain(planning.workdayExplanation);
    expect(holidayFaqs(page).at(-2).a).toContain("työehtosopimuksen");
  });

  it("keeps nearby Vappu links within the generated horizon and leaves other holidays alone", () => {
    for (const year of [PRERENDER_MIN_YEAR, PRERENDER_MAX_YEAR]) {
      const planning = vappuPlanning(holidayPageFor(year, "vappu"));
      expect(planning.nearbyYears).toHaveLength(2);
      expect(planning.nearbyYears.every((page) => page.year >= PRERENDER_MIN_YEAR && page.year <= PRERENDER_MAX_YEAR)).toBe(true);
    }
    expect(vappuPlanning(null)).toBeNull();
    expect(vappuPlanning(holidayPageFor(2027, "loppiainen"))).toBeNull();
    expect(holidayPageFor(2027, "loppiainen").updated).toBeUndefined();
  });

  describe("holidayLinkPath (week-page → holiday internal links)", () => {
    it("links a fixed-date holiday using the source name from holidays.js", () => {
      expect(holidayLinkPath("Vappu", new Date(2026, 4, 1))).toBe("/pyhat-2026/vappu");
    });

    it("links a movable holiday the same way — no special-casing by kind", () => {
      expect(holidayLinkPath("Juhannuspäivä", new Date(2027, 5, 26))).toBe(
        "/pyhat-2027/juhannuspaiva",
      );
      expect(holidayLinkPath("1. pääsiäispäivä", new Date(2026, 3, 5))).toBe(
        "/pyhat-2026/paasiaispaiva",
      );
    });

    it("uses the holiday's own date year, not any other year a caller might pass around it", () => {
      // The scenario this guards: a week page for ISO year Y can include a
      // Monday–Sunday span whose Uudenvuodenpäivä falls in calendar year Y
      // (not Y-1) even when the week itself starts in December of Y-1 — the
      // link must point at the holiday's real year regardless of which ISO
      // week/year the caller happens to be rendering.
      expect(holidayLinkPath("Uudenvuodenpäivä", new Date(2026, 0, 1))).toBe(
        "/pyhat-2026/uudenvuodenpaiva",
      );
    });

    it("returns null for a name with no matching holiday definition", () => {
      expect(holidayLinkPath("Ei ole pyhäpäivä", new Date(2026, 0, 1))).toBeNull();
    });

    it("returns null outside the prerendered year horizon (never links a 404)", () => {
      expect(
        holidayLinkPath("Vappu", new Date(PRERENDER_MIN_YEAR - 1, 4, 1)),
      ).toBeNull();
      expect(
        holidayLinkPath("Vappu", new Date(PRERENDER_MAX_YEAR + 1, 4, 1)),
      ).toBeNull();
    });

    it("links at both edges of the prerendered horizon", () => {
      expect(holidayLinkPath("Vappu", new Date(PRERENDER_MIN_YEAR, 4, 1))).toBe(
        `/pyhat-${PRERENDER_MIN_YEAR}/vappu`,
      );
      expect(holidayLinkPath("Vappu", new Date(PRERENDER_MAX_YEAR, 4, 1))).toBe(
        `/pyhat-${PRERENDER_MAX_YEAR}/vappu`,
      );
    });
  });
});
