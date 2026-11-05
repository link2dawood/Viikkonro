import { describe, expect, it } from "vitest";
import { routeMeta, sitemapEntries, metaFor } from "./seo.js";
import {
  monthWeekdayStats,
  allMonthsWeekdayRows,
  vacationWeeksStats,
  schoolWeeksStats,
  weekdaysInMonthMeta,
  vacationWeeksMeta,
  schoolWeeksMeta,
  weekdaysInMonthFaqs,
  vacationWeeksFaqs,
  schoolWeeksFaqs,
} from "./vacationSchoolContent.js";
import {
  weekdaysInMonthNodes,
  vacationWeeksNodes,
  schoolWeeksNodes,
  getPageJsonLd,
  getPageJsonLdNodes,
} from "./pageJsonLd.js";

describe("Phase 3: Finnish Vacation, Law & School Schedules - Data & Calculations", () => {
  describe("vacationSchoolContent calculations", () => {
    it("differentiates 6-day arkipäivät from 5-day työpäivät accurately", () => {
      const jan = monthWeekdayStats(1, 2026);
      expect(jan.arkipaivat6).toBeGreaterThan(jan.tyopaivat5);
      expect(jan.lauantait).toBeGreaterThanOrEqual(4);
      expect(jan.sunnuntait).toBeGreaterThanOrEqual(4);

      const rows = allMonthsWeekdayRows(2026);
      expect(rows).toHaveLength(12);
      const totalDays = rows.reduce((sum, r) => sum + r.daysInMonth, 0);
      expect(totalDays).toBe(365);
    });

    it("evaluates statutory vacation week and day rules", () => {
      const v = vacationWeeksStats();
      expect(v.fullLeaveWeeks).toBe(5);
      expect(v.fullLeaveDays).toBe(30);
      expect(v.partialLeaveWeeks).toBe(4);
      expect(v.partialLeaveDays).toBe(24);
      expect(v.summerHolidayWeeks).toBe(4);
      expect(v.winterHolidayWeeks).toBe(1);
    });

    it("evaluates school schedule stats and vacations", () => {
      const s = schoolWeeksStats(2026);
      expect(s.statutoryDays).toBe(190);
      expect(s.totalSchoolWeeks).toContain("38–39");
      expect(s.vacations.length).toBeGreaterThanOrEqual(4);
      expect(s.vacations.some((v) => v.name.includes("Kesäloma"))).toBe(true);
      expect(s.vacations.some((v) => v.name.includes("Talviloma"))).toBe(true);
    });
  });

  describe("Metadata snippet limits & formatting", () => {
    it("satisfies strict SEO snippet length caps with no en-dashes", () => {
      const date = new Date(2026, 0, 1);

      const m1 = weekdaysInMonthMeta(date);
      expect(m1.title.length).toBeLessThanOrEqual(60);
      expect(m1.description.length).toBeLessThanOrEqual(158);
      expect(m1.title).not.toMatch(/[–—]/);
      expect(m1.description).not.toMatch(/[–—]/);

      const m2 = vacationWeeksMeta();
      expect(m2.title.length).toBeLessThanOrEqual(60);
      expect(m2.description.length).toBeLessThanOrEqual(158);
      expect(m2.title).not.toMatch(/[–—]/);
      expect(m2.description).not.toMatch(/[–—]/);

      const m3 = schoolWeeksMeta(date);
      expect(m3.title.length).toBeLessThanOrEqual(60);
      expect(m3.description.length).toBeLessThanOrEqual(158);
      expect(m3.title).not.toMatch(/[–—]/);
      expect(m3.description).not.toMatch(/[–—]/);
    });
  });

  describe("FAQ contents", () => {
    it("provides comprehensive and detailed answers for each topic", () => {
      expect(weekdaysInMonthFaqs().length).toBeGreaterThanOrEqual(4);
      expect(vacationWeeksFaqs().length).toBeGreaterThanOrEqual(4);
      expect(schoolWeeksFaqs(2026).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Route registration & Schema integration", () => {
    const phase3Paths = [
      "/kuinka-monta-arkipaivaa-kuukaudessa",
      "/kuinka-monta-viikkoa-vuosiloma-on",
      "/kuinka-monta-viikkoa-lukuvuodessa",
    ];

    it("registers all 3 routes in routeMeta and metaFor", () => {
      for (const p of phase3Paths) {
        expect(routeMeta[p]).toBeDefined();
        const resolved = metaFor(p);
        expect(resolved).toBeDefined();
        expect(resolved.title.length).toBeLessThanOrEqual(60);
        expect(resolved.description.length).toBeLessThanOrEqual(158);
      }
    });

    it("registers all 3 routes in sitemapEntries", () => {
      const sitemapPaths = sitemapEntries(2026).map((e) => e.path);
      for (const p of phase3Paths) {
        expect(sitemapPaths).toContain(p);
      }
    });

    it("generates valid Article, WebPage, and FAQPage nodes", () => {
      const wimNodes = weekdaysInMonthNodes(2026);
      expect(wimNodes.some((n) => n["@type"] === "Article")).toBe(true);
      expect(wimNodes.some((n) => n["@type"] === "WebPage")).toBe(true);
      expect(wimNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

      const vwNodes = vacationWeeksNodes();
      expect(vwNodes.some((n) => n["@type"] === "Article")).toBe(true);
      expect(vwNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);

      const swNodes = schoolWeeksNodes(2026);
      expect(swNodes.some((n) => n["@type"] === "Article")).toBe(true);
      expect(swNodes.some((n) => n["@type"] === "FAQPage")).toBe(true);
    });

    it("returns schema nodes in getPageJsonLd", () => {
      for (const p of phase3Paths) {
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
