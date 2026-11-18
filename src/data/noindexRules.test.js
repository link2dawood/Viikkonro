import { describe, expect, it } from "vitest";
import { isIndexable, robotsFor, extractYearFromPath, DEFAULT_ROBOTS, NOINDEX_ROBOTS } from "./seo.js";

describe("Task 2: Noindex rules for programmatic routes with a year in the path", () => {
  // Reference date: 2026-11-30 in Helsinki (currentYear = 2026).
  // Window: 2025 to 2028.
  const refDate = new Date("2026-11-30T12:00:00Z");

  const yearRoutes = [
    (y) => `/viikko-42-${y}`,
    (y) => `/pyhat-${y}/juhannus`,
    (y) => `/pyhapaivat-${y}`,
    (y) => `/tyopaivat-tammikuu-${y}`,
    (y) => `/tyopaivat-${y}`,
    (y) => `/kuukausi-6-${y}`,
    (y) => `/q2-${y}`,
    (y) => `/kalenteri-${y}`,
    (y) => `/kalenteri-${y}-alkuvuosi`,
    (y) => `/kalenteri-${y}-loppuvuosi`,
    (y) => `/vuosi-${y}`,
    (y) => `/tulosta-${y}`,
    (y) => `/tulostettava-kalenteri-${y}`,
    (y) => `/koululomat-${y}`,
    (y) => `/palkkapaivat-${y}`,
    (y) => `/liputuspaivat-${y}`,
  ];

  it("extracts the year correctly from programmatic routes", () => {
    expect(extractYearFromPath("/viikko-10-2027")).toBe(2027);
    expect(extractYearFromPath("/pyhat-2027/vappu")).toBe(2027);
    expect(extractYearFromPath("/pyhapaivat-2027")).toBe(2027);
    expect(extractYearFromPath("/tyopaivat-toukokuu-2027")).toBe(2027);
    expect(extractYearFromPath("/kuukausi-5-2027")).toBe(2027);
    expect(extractYearFromPath("/q1-2027")).toBe(2027);
    expect(extractYearFromPath("/kalenteri-2027")).toBe(2027);
    expect(extractYearFromPath("/kalenteri-2027-alkuvuosi")).toBe(2027);
    expect(extractYearFromPath("/vuosi-2027")).toBe(2027);
    expect(extractYearFromPath("/tulosta-2027")).toBe(2027);
    expect(extractYearFromPath("/tulostettava-kalenteri-2027")).toBe(2027);
  });

  it("marks all programmatic routes inside window (2025-2028) as index,follow", () => {
    for (const year of [2025, 2026, 2027, 2028]) {
      for (const pattern of yearRoutes) {
        const url = pattern(year);
        expect(isIndexable(url, refDate), `Expected ${url} to be indexable`).toBe(true);
        expect(robotsFor(url, null, refDate)).toBe(DEFAULT_ROBOTS);
      }
    }
  });

  it("marks all programmatic routes outside window (< 2025 or > 2028) as noindex,follow", () => {
    for (const year of [2020, 2024, 2029, 2035]) {
      for (const pattern of yearRoutes) {
        const url = pattern(year);
        expect(isIndexable(url, refDate), `Expected ${url} to be noindexed`).toBe(false);
        expect(robotsFor(url, null, refDate)).toBe(NOINDEX_ROBOTS);
      }
    }
  });

  it("always indexes exception routes (homepage and non-year pages)", () => {
    const exceptions = [
      "/",
      "/viikonpaiva",
      "/tuntilaskuri",
      "/ikalaskuri",
      "/vuosilomalaskuri",
      "/kuinka-monta-viikkoa-vuodessa",
      "/mika-vuosi-nyt",
      "/ukk",
      "/mika-on-viikkonumero",
      "/parillinen-pariton-viikko",
      "/laskurit",
      "/avoin-data",
    ];

    for (const url of exceptions) {
      expect(isIndexable(url, refDate), `Expected exception ${url} to be indexable`).toBe(true);
      expect(robotsFor(url, null, refDate)).toBe(DEFAULT_ROBOTS);
    }
  });
});
