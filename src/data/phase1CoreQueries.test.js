import { describe, expect, it } from "vitest";
import { routeMeta, sitemapEntries, metaFor } from "./seo.js";
import {
  monthDaysCount,
  monthWeekStats,
  allMonthsWeekRows,
  weeksInMonthFaqs,
  weeksInMonthMeta,
} from "./weeksInMonthContent.js";
import {
  fiftyThreeWeekYears,
  fiftyThreeWeeksFaqs,
  fiftyThreeWeeksMeta,
} from "./fiftyThreeWeeksContent.js";
import {
  yearDaysStats,
  currentYearProgress,
  daysInYearFaqs,
  daysInYearMeta,
} from "./daysInYearContent.js";
import {
  weeksInMonthNodes,
  fiftyThreeWeeksNodes,
  daysInYearNodes,
  getPageJsonLd,
  getPageJsonLdNodes,
} from "./pageJsonLd.js";

describe("Phase 1: Core Calendar Units - Data & Calculations", () => {
  describe("WeeksInMonth content", () => {
    it("calculates exact days for standard and leap February", () => {
      expect(monthDaysCount(2, 2026)).toBe(28);
      expect(monthDaysCount(2, 2028)).toBe(29);
      expect(monthDaysCount(4, 2026)).toBe(30);
      expect(monthDaysCount(1, 2026)).toBe(31);
    });

    it("calculates week stats with decimal precision", () => {
      const feb2026 = monthWeekStats(2, 2026);
      expect(feb2026.fullWeeks).toBe(4);
      expect(feb2026.extraDays).toBe(0);
      expect(feb2026.decimalWeeks).toBe("4.00");

      const jan = monthWeekStats(1, 2026);
      expect(jan.fullWeeks).toBe(4);
      expect(jan.extraDays).toBe(3);
      expect(jan.decimalWeeks).toBe("4.43");
    });

    it("builds all 12 months with correct localized names", () => {
      const rows = allMonthsWeekRows(2026);
      expect(rows).toHaveLength(12);
      expect(rows[0].name).toBe("Tammikuu");
      expect(rows[11].name).toBe("Joulukuu");
    });

    it("provides comprehensive FAQs and valid snippet lengths", () => {
      const faqs = weeksInMonthFaqs(2026);
      expect(faqs.length).toBeGreaterThanOrEqual(5);

      const meta = weeksInMonthMeta(new Date(2026, 0, 1));
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeLessThanOrEqual(158);
      expect(meta.title).not.toMatch(/[–—]/);
      expect(meta.description).not.toMatch(/[–—]/);
    });
  });

  describe("FiftyThreeWeeks content", () => {
    it("identifies known 53-week years and reasons", () => {
      const years = fiftyThreeWeekYears(2020, 2035);
      const yearNumbers = years.map((y) => y.year);
      expect(yearNumbers).toContain(2020);
      expect(yearNumbers).toContain(2026);
      expect(yearNumbers).toContain(2032);
      expect(yearNumbers).not.toContain(2025);
      expect(yearNumbers).not.toContain(2027);

      const y2026 = years.find((y) => y.year === 2026);
      expect(y2026.startsOn).toBe("Torstai");
      expect(y2026.reason).toBe("Vuosi alkaa torstaina");
    });

    it("provides ISO 8601 rule explanation in FAQs", () => {
      const faqs = fiftyThreeWeeksFaqs(2026);
      expect(faqs.length).toBeGreaterThanOrEqual(5);
      expect(faqs.some((f) => f.q.includes("torstaisääntö"))).toBe(true);

      const meta = fiftyThreeWeeksMeta(new Date(2026, 0, 1));
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeLessThanOrEqual(158);
      expect(meta.title).not.toMatch(/[–—]/);
      expect(meta.description).not.toMatch(/[–—]/);
    });
  });

  describe("DaysInYear content", () => {
    it("computes stats for normal vs leap years", () => {
      const stats2026 = yearDaysStats(2026);
      expect(stats2026.days).toBe(365);
      expect(stats2026.hours).toBe(8760);
      expect(stats2026.minutes).toBe(525600);
      expect(stats2026.leap).toBe(false);

      const stats2028 = yearDaysStats(2028);
      expect(stats2028.days).toBe(366);
      expect(stats2028.hours).toBe(8784);
      expect(stats2028.minutes).toBe(527040);
      expect(stats2028.leap).toBe(true);
    });

    it("calculates realistic year progress", () => {
      const midYear = new Date(2026, 6, 2); // July 2nd
      const progress = currentYearProgress(midYear);
      expect(progress.year).toBe(2026);
      expect(progress.totalDays).toBe(365);
      expect(progress.daysPassed).toBeGreaterThan(180);
      expect(progress.daysRemaining).toBeLessThan(185);
      expect(Number(progress.percentage)).toBeGreaterThan(45);
      expect(Number(progress.percentage)).toBeLessThan(55);
    });

    it("provides valid metadata and FAQs within SEO guidelines", () => {
      const faqs = daysInYearFaqs(2026);
      expect(faqs.length).toBeGreaterThanOrEqual(5);

      const meta = daysInYearMeta(new Date(2026, 0, 1));
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeLessThanOrEqual(158);
      expect(meta.title).not.toMatch(/[–—]/);
      expect(meta.description).not.toMatch(/[–—]/);
    });
  });

  describe("SEO & Schema integration for Phase 1", () => {
    const phase1Paths = [
      "/kuinka-monta-viikkoa-kuukaudessa",
      "/miksi-vuodessa-on-53-viikkoa",
      "/kuinka-monta-paivaa-vuodessa",
    ];

    it("registers all 3 routes in routeMeta and metaFor", () => {
      for (const p of phase1Paths) {
        expect(routeMeta[p]).toBeDefined();
        const resolved = metaFor(p);
        expect(resolved).toBeDefined();
        expect(resolved.title.length).toBeLessThanOrEqual(60);
        expect(resolved.description.length).toBeLessThanOrEqual(158);
      }
    });

    it("registers all 3 routes in sitemapEntries", () => {
      const entries = sitemapEntries(2026).map((e) => e.path);
      for (const p of phase1Paths) {
        expect(entries).toContain(p);
      }
    });

    it("generates WebPage and FAQPage structured data nodes", () => {
      const wimNodes = weeksInMonthNodes(2026);
      expect(wimNodes.some((n) => n["@type"] === "Article")).toBe(true);
      expect(wimNodes.some((n) => n["@type"] === "WebPage")).toBe(true);
      expect(wimNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

      const ftwNodes = fiftyThreeWeeksNodes(2026);
      expect(ftwNodes.some((n) => n["@type"] === "Article")).toBe(true);
      expect(ftwNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

      const diyNodes = daysInYearNodes(2026);
      expect(diyNodes.some((n) => n["@type"] === "Article")).toBe(true);
      expect(diyNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);
    });

    it("includes nodes when querying getPageJsonLd", () => {
      for (const p of phase1Paths) {
        const doc = getPageJsonLd(p, { today: new Date(2026, 5, 1) });
        expect(doc["@graph"]).toBeDefined();
        const types = doc["@graph"].map((n) => n["@type"]);
        expect(types).toContain("FAQPage");
        expect(types).toContain("Article");

        const nodes = getPageJsonLdNodes(p, { today: new Date(2026, 5, 1) });
        expect(nodes.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
