import { describe, expect, it } from "vitest";
import { fmtFullFi } from "../components/dateUtils.js";
import { routeMeta } from "./seo.js";
import {
  currentYearWeekSummary,
  weeksInYearFaqs,
  weeksInYearMeta,
  yearWeekFact,
  yearWeekRows,
} from "./weeksInYearContent.js";

describe("weeks-in-a-year content", () => {
  it("identifies known 53-week years", () => {
    expect(yearWeekFact(2026)).toMatchObject({ weeks: 53, startsOn: "Torstai" });
    expect(yearWeekFact(2032)).toMatchObject({
      weeks: 53,
      startsOn: "Torstai",
      leap: true,
    });
  });

  it("identifies ordinary 52-week years", () => {
    expect(yearWeekFact(2025).weeks).toBe(52);
    expect(yearWeekFact(2027).weeks).toBe(52);
  });

  it("builds an inclusive, ordered comparison range", () => {
    const rows = yearWeekRows(2024, 2035);
    expect(rows).toHaveLength(12);
    expect(rows[0].year).toBe(2024);
    expect(rows.at(-1).year).toBe(2035);
  });

  it("provides seven concrete FAQs including the requested 2026 answer", () => {
    const faqs = weeksInYearFaqs(2026);
    expect(faqs).toHaveLength(7);
    expect(faqs.some((item) => item.a.includes("Vuonna 2026 on 53"))).toBe(true);
  });

  it("computes the visible current-year answer for a 53-week year", () => {
    const summary = currentYearWeekSummary(2026);
    expect(summary.weeks).toBe(53);
    expect(summary.cause).toBe(
      "Vuosi alkaa torstaina, joten vuoden loppuun mahtuu kokonainen viikko 53.",
    );
    // Week 53 of 2026 runs Mon 28.12.2026 to Sun 3.1.2027.
    expect(fmtFullFi(summary.lastWeekMonday)).toBe("28. joulukuuta 2026");
    expect(fmtFullFi(summary.lastWeekSunday)).toBe("3. tammikuuta 2027");
  });

  it("rolls the answer over to 52 weeks without an edit", () => {
    const summary = currentYearWeekSummary(2027);
    expect(summary.weeks).toBe(52);
    expect(summary.cause).toBe("Vuosi alkaa perjantaina, joten viikkoja on 52.");
    expect(summary.cause).not.toContain("53");
  });

  it("names the leap-year cause rather than implying any Wednesday start", () => {
    // 2032 is a leap year, but it starts on a Thursday, so the plain cause
    // applies. Guards against reporting the leap rule for the wrong reason.
    expect(currentYearWeekSummary(2032).cause).toBe(
      "Vuosi alkaa torstaina, joten vuoden loppuun mahtuu kokonainen viikko 53.",
    );
  });

  it("keeps the current-year count out of hardcoded metadata", () => {
    expect(weeksInYearMeta(new Date(2026, 5, 15)).description).toContain(
      "Vuonna 2026 on 53 viikkoa",
    );
    expect(weeksInYearMeta(new Date(2027, 5, 15)).description).toContain(
      "Vuonna 2027 on 52 viikkoa",
    );
  });

  it("keeps page metadata inside snippet limits", () => {
    const meta = routeMeta["/kuinka-monta-viikkoa-vuodessa"];
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(158);
  });
});
