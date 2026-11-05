import { describe, it, expect } from "vitest";
import {
  quarterWeekStats,
  yearWeeksRemainingStats,
  yearWeekendStats,
  weeksInQuarterMeta,
  weeksRemainingMeta,
  weekendsInYearMeta,
  weeksInQuarterFaqs,
  weeksRemainingFaqs,
  weekendsInYearFaqs,
} from "./businessProgressContent.js";
import {
  weeksInQuarterNodes,
  weeksRemainingNodes,
  weekendsInYearNodes,
  getPageJsonLdNodes,
} from "./pageJsonLd.js";

describe("Phase 4: Business, Financial & Time Progress Data", () => {
  it("quarterWeekStats returns 4 quarters with 13 weeks (14 weeks in Q4 for 53-week year 2026)", () => {
    const q2026 = quarterWeekStats(2026);
    expect(q2026).toHaveLength(4);
    expect(q2026[0].quarter).toBe("Q1");
    expect(q2026[0].weeksIso).toBe(13);
    expect(q2026[3].quarter).toBe("Q4");
    expect(q2026[3].weeksIso).toBe(14); // 2026 is 53-week year

    const q2025 = quarterWeekStats(2025);
    expect(q2025[3].weeksIso).toBe(13);
  });

  it("yearWeeksRemainingStats returns valid progression metrics", () => {
    const testDate = new Date(2026, 5, 15); // June 15, 2026
    const stats = yearWeeksRemainingStats(testDate);
    expect(stats.year).toBe(2026);
    expect(stats.currentWeek).toBeGreaterThan(20);
    expect(stats.totalWeeks).toBe(53);
    expect(stats.weeksRemaining).toBe(53 - stats.currentWeek);
    expect(stats.daysRemaining).toBeGreaterThan(180);
    expect(Number(stats.percentElapsed)).toBeGreaterThan(40);
    expect(Number(stats.percentRemaining)).toBeLessThan(60);
  });

  it("yearWeekendStats correctly counts Saturdays, Sundays and total weekend days", () => {
    const s2026 = yearWeekendStats(2026);
    expect(s2026.year).toBe(2026);
    expect(s2026.saturdays).toBe(52);
    expect(s2026.sundays).toBe(52);
    expect(s2026.fullWeekends).toBe(52);
    expect(s2026.totalWeekendDays).toBe(104);

    // 2028 is a leap year starting on Saturday Jan 1
    const s2028 = yearWeekendStats(2028);
    expect(s2028.totalWeekendDays).toBe(106);
    expect(s2028.saturdays).toBe(53);
    expect(s2028.sundays).toBe(53);
  });

  it("SEO metadata stays within character limits and contains no en-dashes", () => {
    const wiq = weeksInQuarterMeta();
    expect(wiq.title.length).toBeLessThanOrEqual(60);
    expect(wiq.description.length).toBeLessThanOrEqual(158);
    expect(wiq.title).not.toMatch(/[–—]/);
    expect(wiq.description).not.toMatch(/[–—]/);

    const wr = weeksRemainingMeta(new Date(2026, 0, 1));
    expect(wr.title.length).toBeLessThanOrEqual(60);
    expect(wr.description.length).toBeLessThanOrEqual(158);
    expect(wr.title).not.toMatch(/[–—]/);
    expect(wr.description).not.toMatch(/[–—]/);

    const wiy = weekendsInYearMeta(new Date(2026, 0, 1));
    expect(wiy.title.length).toBeLessThanOrEqual(60);
    expect(wiy.description.length).toBeLessThanOrEqual(158);
    expect(wiy.title).not.toMatch(/[–—]/);
    expect(wiy.description).not.toMatch(/[–—]/);
  });

  it("FAQs are populated with questions and answers", () => {
    expect(weeksInQuarterFaqs().length).toBeGreaterThanOrEqual(3);
    expect(weeksRemainingFaqs().length).toBeGreaterThanOrEqual(3);
    expect(weekendsInYearFaqs().length).toBeGreaterThanOrEqual(3);
  });

  it("JSON-LD node generators produce valid Article, WebPage, and FAQPage nodes", () => {
    const wiqNodes = weeksInQuarterNodes();
    expect(wiqNodes.some((n) => n["@type"] === "Article")).toBe(true);
    expect(wiqNodes.some((n) => n["@type"] === "WebPage")).toBe(true);
    expect(wiqNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

    const wrNodes = weeksRemainingNodes();
    expect(wrNodes.some((n) => n["@type"] === "Article")).toBe(true);
    expect(wrNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

    const wiyNodes = weekendsInYearNodes(2026);
    expect(wiyNodes.some((n) => n["@type"] === "Article")).toBe(true);
    expect(wiyNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

    const dispatched = getPageJsonLdNodes("/kuinka-monta-viikkoa-kvartaalissa", 2026);
    expect(dispatched.some((n) => n["@type"] === "Article")).toBe(true);
  });
});
