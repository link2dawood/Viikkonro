import { describe, it, expect } from "vitest";
import {
  daysToWeeksStats,
  COMMON_DAY_CONVERSIONS,
  hoursInYearStats,
  hundredDaysWeeksMeta,
  hoursInYearMeta,
  hundredDaysWeeksFaqs,
  hoursInYearFaqs,
} from "./unitMathContent.js";
import {
  hundredDaysWeeksNodes,
  hoursInYearNodes,
  getPageJsonLdNodes,
} from "./pageJsonLd.js";

describe("Phase 5: Unit Conversions & Math Data", () => {
  it("daysToWeeksStats accurately calculates weeks and days for 100 days", () => {
    const stats = daysToWeeksStats(100);
    expect(stats.days).toBe(100);
    expect(stats.fullWeeks).toBe(14);
    expect(stats.remainderDays).toBe(2);
    expect(stats.decimalWeeks).toBe("14.29");
    expect(stats.workingDaysEstimate).toBe(71);
    expect(stats.monthsEstimate).toBe("3.3");
  });

  it("daysToWeeksStats handles boundary conditions", () => {
    const zero = daysToWeeksStats(0);
    expect(zero.fullWeeks).toBe(0);
    expect(zero.remainderDays).toBe(0);
    expect(zero.decimalWeeks).toBe("0.00");

    const seven = daysToWeeksStats(7);
    expect(seven.fullWeeks).toBe(1);
    expect(seven.remainderDays).toBe(0);

    expect(COMMON_DAY_CONVERSIONS).toContain(100);
    expect(COMMON_DAY_CONVERSIONS).toContain(365);
  });

  it("hoursInYearStats correctly calculates hours, minutes and seconds for regular and leap years", () => {
    const reg = hoursInYearStats(2026);
    expect(reg.year).toBe(2026);
    expect(reg.isLeapYear).toBe(false);
    expect(reg.days).toBe(365);
    expect(reg.hours).toBe(8760);
    expect(reg.minutes).toBe(525600);
    expect(reg.seconds).toBe(31536000);
    expect(reg.sleepHours).toBe(2920);

    const leap = hoursInYearStats(2028);
    expect(leap.year).toBe(2028);
    expect(leap.isLeapYear).toBe(true);
    expect(leap.days).toBe(366);
    expect(leap.hours).toBe(8784);
    expect(leap.minutes).toBe(527040);
    expect(leap.seconds).toBe(31622400);
    expect(leap.sleepHours).toBe(2928);
  });

  it("SEO metadata stays within character limits and contains no en-dashes", () => {
    const hdw = hundredDaysWeeksMeta();
    expect(hdw.title.length).toBeLessThanOrEqual(60);
    expect(hdw.description.length).toBeLessThanOrEqual(158);
    expect(hdw.title).not.toMatch(/[–—]/);
    expect(hdw.description).not.toMatch(/[–—]/);

    const hiy = hoursInYearMeta();
    expect(hiy.title.length).toBeLessThanOrEqual(60);
    expect(hiy.description.length).toBeLessThanOrEqual(158);
    expect(hiy.title).not.toMatch(/[–—]/);
    expect(hiy.description).not.toMatch(/[–—]/);
  });

  it("FAQs are populated with questions and answers", () => {
    expect(hundredDaysWeeksFaqs().length).toBeGreaterThanOrEqual(3);
    expect(hoursInYearFaqs(2026).length).toBeGreaterThanOrEqual(3);
  });

  it("JSON-LD node generators produce valid Article, WebPage, and FAQPage nodes", () => {
    const hdwNodes = hundredDaysWeeksNodes();
    expect(hdwNodes.some((n) => n["@type"] === "Article")).toBe(true);
    expect(hdwNodes.some((n) => n["@type"] === "WebPage")).toBe(true);
    expect(hdwNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

    const hiyNodes = hoursInYearNodes(2026);
    expect(hiyNodes.some((n) => n["@type"] === "Article")).toBe(true);
    expect(hiyNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

    const dispatched = getPageJsonLdNodes("/kuinka-monta-tuntia-vuodessa", 2026);
    expect(dispatched.some((n) => n["@type"] === "Article")).toBe(true);
  });
});
