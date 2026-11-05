import { describe, expect, it } from "vitest";
import { routeMeta, sitemapEntries, metaFor } from "./seo.js";
import {
  yearWorkdayStats,
  monthWorkdayStats,
  allMonthsWorkdayRows,
  yearComparisonWorkdayRows,
  workdaysInYearMeta,
  workdaysInMonthMeta,
  workhoursInYearMeta,
  workhoursInMonthMeta,
  workdaysInYearFaqs,
  workdaysInMonthFaqs,
  workhoursInYearFaqs,
  workhoursInMonthFaqs,
} from "./laborHoursContent.js";
import {
  workdaysInYearNodes,
  workdaysInMonthNodes,
  workhoursInYearNodes,
  workhoursInMonthNodes,
  getPageJsonLd,
  getPageJsonLdNodes,
} from "./pageJsonLd.js";

describe("Phase 2: Labor, Workdays & Hours - Data & Calculations", () => {
  describe("laborHoursContent calculations", () => {
    it("computes accurate annual workday and hour stats", () => {
      const stats2026 = yearWorkdayStats(2026);
      expect(stats2026.workingDays5).toBeGreaterThanOrEqual(250);
      expect(stats2026.workingDays5).toBeLessThanOrEqual(255);
      expect(stats2026.workingDays6).toBeGreaterThan(stats2026.workingDays5);
      expect(stats2026.weekendDays).toBe(104);
      expect(stats2026.hours75).toBe(Math.round(stats2026.workingDays5 * 7.5 * 10) / 10);
      expect(stats2026.hours80).toBe(stats2026.workingDays5 * 8);
    });

    it("computes month-by-month stats with correct sums", () => {
      const rows = allMonthsWorkdayRows(2026);
      expect(rows).toHaveLength(12);

      const totalDays = rows.reduce((acc, r) => acc + r.daysInMonth, 0);
      expect(totalDays).toBe(365);

      const totalWorkdays = rows.reduce((acc, r) => acc + r.workingDays5, 0);
      const yearStats = yearWorkdayStats(2026);
      expect(totalWorkdays).toBe(yearStats.workingDays5);
    });

    it("evaluates specific month workday ranges", () => {
      const jan = monthWorkdayStats(1, 2026);
      expect(jan.daysInMonth).toBe(31);
      expect(jan.workingDays5).toBeGreaterThanOrEqual(20);
      expect(jan.workingDays5).toBeLessThanOrEqual(22);
    });

    it("generates multi-year comparisons", () => {
      const comp = yearComparisonWorkdayRows(2024, 2028);
      expect(comp).toHaveLength(5);
      expect(comp[0].year).toBe(2024);
      expect(comp.at(-1).year).toBe(2028);
    });
  });

  describe("Metadata snippet limits & formatting", () => {
    const metaCheckers = [
      { name: "workdaysInYearMeta", fn: workdaysInYearMeta },
      { name: "workdaysInMonthMeta", fn: workdaysInMonthMeta },
      { name: "workhoursInYearMeta", fn: workhoursInYearMeta },
      { name: "workhoursInMonthMeta", fn: workhoursInMonthMeta },
    ];

    it("satisfies strict SEO snippet length caps with no en-dashes", () => {
      const date = new Date(2026, 0, 1);
      for (const { name, fn } of metaCheckers) {
        const meta = fn(date);
        expect(meta.title.length, `${name} title length`).toBeLessThanOrEqual(60);
        expect(meta.description.length, `${name} desc length`).toBeLessThanOrEqual(158);
        expect(meta.title, `${name} title dashes`).not.toMatch(/[–—]/);
        expect(meta.description, `${name} desc dashes`).not.toMatch(/[–—]/);
      }
    });
  });

  describe("FAQ contents", () => {
    it("provides comprehensive and detailed answers for each topic", () => {
      expect(workdaysInYearFaqs(2026).length).toBeGreaterThanOrEqual(4);
      expect(workdaysInMonthFaqs(2026).length).toBeGreaterThanOrEqual(4);
      expect(workhoursInYearFaqs(2026).length).toBeGreaterThanOrEqual(4);
      expect(workhoursInMonthFaqs(2026).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Route registration & Schema integration", () => {
    const phase2Paths = [
      "/kuinka-monta-tyopaivaa-vuodessa",
      "/kuinka-monta-tyopaivaa-kuukaudessa",
      "/kuinka-monta-tyotuntia-vuodessa",
      "/kuinka-monta-tyotuntia-kuukaudessa",
    ];

    it("registers all 4 routes in routeMeta and metaFor", () => {
      for (const p of phase2Paths) {
        expect(routeMeta[p]).toBeDefined();
        const resolved = metaFor(p);
        expect(resolved).toBeDefined();
        expect(resolved.title.length).toBeLessThanOrEqual(60);
        expect(resolved.description.length).toBeLessThanOrEqual(158);
      }
    });

    it("registers all 4 routes in sitemapEntries", () => {
      const sitemapPaths = sitemapEntries(2026).map((e) => e.path);
      for (const p of phase2Paths) {
        expect(sitemapPaths).toContain(p);
      }
    });

    it("generates valid Article, WebPage, and FAQPage nodes", () => {
      const nodeFns = [
        workdaysInYearNodes,
        workdaysInMonthNodes,
        workhoursInYearNodes,
        workhoursInMonthNodes,
      ];

      for (const fn of nodeFns) {
        const nodes = fn(2026);
        expect(nodes.some((n) => n["@type"] === "Article")).toBe(true);
        expect(nodes.some((n) => n["@type"] === "WebPage")).toBe(true);
        expect(nodes.some((n) => n["@type"] === "FAQPage")).toBe(true);
      }
    });

    it("returns schema nodes in getPageJsonLd", () => {
      for (const p of phase2Paths) {
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
