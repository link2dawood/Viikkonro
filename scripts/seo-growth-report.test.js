import { describe, expect, it } from "vitest";
import { comparisonWindows, fetchRows, growthRequest, summarizeRows } from "./seo-growth-report.js";

describe("SEO growth measurement", () => {
  it("uses adjacent inclusive 28-day windows across a year boundary", () => {
    expect(comparisonWindows("2027-01-10")).toEqual({
      current: { startDate: "2026-12-14", endDate: "2027-01-10" },
      previous: { startDate: "2026-11-16", endDate: "2026-12-13" },
    });
    expect(() => comparisonWindows("2026-02-30")).toThrow("Invalid");
  });

  it("filters Finnish searches and keeps landing pages and devices separate", () => {
    const request = growthRequest(comparisonWindows("2026-10-02").current);
    expect(request.dimensions).toEqual(["query", "page", "device"]);
    expect(request.dataState).toBe("final");
    expect(request.dimensionFilterGroups[0].filters[0]).toEqual({ dimension: "country", operator: "equals", expression: "fin" });
  });

  it("weights CTR and position by impressions rather than averaging row rates", () => {
    const rows = [
      { keys: ["kalenteri", "https://viikkonro.fi/kalenteri-2026", "MOBILE"], clicks: 10, impressions: 100, position: 2 },
      { keys: ["kalenteri", "https://viikkonro.fi/kalenteri-2027", "MOBILE"], clicks: 0, impressions: 10, position: 12 },
      { keys: ["kalenteri", "https://viikkonro.fi/pdf/kalenteri-2027.pdf", "MOBILE"], clicks: 4, impressions: 20, position: 3 },
    ];
    const summary = summarizeRows(rows);
    expect(summary).toHaveLength(2);
    expect(summary[0].ctr).toBeCloseTo(10 / 110);
    expect(summary[0].position).toBeCloseTo(320 / 110);
    expect(summary[1].format).toBe("pdf");
  });

  it("paginates instead of silently truncating the first 25,000 rows", async () => {
    const offsets = [];
    const result = await fetchRows(async ({ startRow }) => {
      offsets.push(startRow);
      return { rows: startRow === 0 ? Array(25000).fill({}) : [{ last: true }] };
    }, comparisonWindows("2026-10-02").current);
    expect(offsets).toEqual([0, 25000]);
    expect(result.rows).toHaveLength(25001);
    expect(result.paginationLimitReached).toBe(false);
  });
});
