import { describe, expect, it } from "vitest";
import {
  CONFIDENCE,
  confidenceLabel,
  pageConfidenceTier,
  schoolHolidayFaqs,
  schoolHolidayMeta,
  schoolHolidayPage,
  schoolHolidayPeriodsInWeek,
  schoolHolidayVerifiedAt,
  schoolHolidayYears,
  shouldLinkSchoolHolidayPage,
  tierFromGroups,
} from "./schoolHolidayPages.js";

describe("school holiday landing-page data", () => {
  it("publishes only years backed by official data", () => {
    expect(schoolHolidayYears).toEqual([2026, 2027, 2028]);
    expect(schoolHolidayPage(2028)).not.toBeNull();
  });

  it("groups winter holidays into weeks 8, 9 and 10", () => {
    for (const year of schoolHolidayYears) {
      expect([...new Set(schoolHolidayPage(year).winter.map((group) => group.week))]).toEqual([8, 9, 10]);
    }
    expect(schoolHolidayPeriodsInWeek(2027, 8)[0].cities).toContain("Helsinki");
    expect(schoolHolidayPeriodsInWeek(2027, 9)[0].cities).toContain("Tampere");
    expect(schoolHolidayPeriodsInWeek(2027, 10)[0].cities).toContain("Oulu");
  });

  it("keeps 2028 claims city-specific and tied to official sources", () => {
    const page = schoolHolidayPage(2028);
    expect(page.winter.flatMap((group) => group.cities).sort()).toEqual(
      ["Helsinki", "Joensuu", "Oulu", "Tampere", "Turku"].sort(),
    );
    expect(page.autumn).toHaveLength(1);
    expect(page.autumn[0]).toMatchObject({ week: 42, cities: ["Joensuu"] });
    expect(page.autumnUnknownCities).not.toContain("Joensuu");
    expect(schoolHolidayVerifiedAt(2028)).toBe("2026-10-05");
  });

  it("links verified holiday hubs only during weeks 8-10 and 42-43", () => {
    for (const week of [8, 9, 10, 42, 43]) {
      expect(shouldLinkSchoolHolidayPage(2028, week)).toBe(true);
    }
    expect(shouldLinkSchoolHolidayPage(2028, 11)).toBe(false);
    expect(shouldLinkSchoolHolidayPage(2099, 8)).toBe(false);
  });

  it("does not generalize Helsinki's autumn 2027 dates nationwide", () => {
    const autumn = schoolHolidayPage(2027).autumn;
    expect(autumn).toHaveLength(1);
    expect(autumn[0]).toMatchObject({
      week: 42,
      cities: ["Helsinki"],
      coverage: "confirmed-city",
    });
  });

  it("provides six FAQs and snippet-length metadata", () => {
    expect(schoolHolidayFaqs(2027)).toHaveLength(6);
    for (const year of schoolHolidayYears) {
      const meta = schoolHolidayMeta(year);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(140);
      expect(meta.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("names cities with no published autumn-2027 date instead of inventing or silently omitting them", () => {
    const page = schoolHolidayPage(2027);
    expect(page.autumn).toHaveLength(1); // only Helsinki is dated
    expect(page.autumnUnknownCities.length).toBeGreaterThan(0);
    expect(page.autumnUnknownCities).not.toContain("Helsinki");
  });
});

describe("confidence-tier architecture", () => {
  it("labels all three tiers with a visible, machine-readable string", () => {
    expect(confidenceLabel(CONFIDENCE.CONFIRMED)).toBe("✓ Vahvistettu");
    expect(confidenceLabel(CONFIDENCE.ESTIMATED)).toBe("⚠ Arvio");
    expect(confidenceLabel(CONFIDENCE.UNKNOWN)).toBe("— Ei vahvistettu");
  });

  it("all currently-published school years are fully CONFIRMED (Tier A)", () => {
    for (const year of schoolHolidayYears) {
      expect(pageConfidenceTier(year)).toBe(CONFIDENCE.CONFIRMED);
    }
  });

  it("treats a year with no page at all as UNKNOWN (Tier C) — no fabricated page", () => {
    expect(schoolHolidayPage(2099)).toBeNull();
    expect(pageConfidenceTier(2099)).toBe(CONFIDENCE.UNKNOWN);
    expect(schoolHolidayMeta(2099)).toBeNull();
    expect(schoolHolidayFaqs(2099)).toEqual([]);
  });

  it("demotes a page to ESTIMATED (Tier B) the moment any one group is estimated — the rollup rule itself", () => {
    const allConfirmed = [
      { confidence: CONFIDENCE.CONFIRMED },
      { confidence: CONFIDENCE.CONFIRMED },
    ];
    const oneEstimated = [
      { confidence: CONFIDENCE.CONFIRMED },
      { confidence: CONFIDENCE.ESTIMATED },
    ];
    expect(tierFromGroups(allConfirmed)).toBe(CONFIDENCE.CONFIRMED);
    expect(tierFromGroups(oneEstimated)).toBe(CONFIDENCE.ESTIMATED);
  });

  it("suppresses FAQ generation entirely for a non-CONFIRMED tier (STEP 7 safeguard)", () => {
    // schoolHolidayFaqs() has no real ESTIMATED year to call today (by
    // design — see the coverage report), so this exercises its other
    // non-CONFIRMED path: a year with no page at all.
    expect(schoolHolidayFaqs(2099)).toEqual([]);
  });
});
