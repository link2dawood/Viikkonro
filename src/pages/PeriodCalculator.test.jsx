import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { PeriodDetails } from "./PeriodCalculator.jsx";
import { cycleFrom, periodFaqs, periodReport } from "../data/periodCalculator.js";

const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const today = new Date(2026, 8, 29);

describe("period calculator", () => {
  it("estimates the next period, ovulation and fertile days of a cycle", () => {
    const c = cycleFrom(new Date(2027, 2, 1), 28, 5);
    expect(ymd(c.next)).toBe("2027-3-29");
    expect(ymd(c.bleedingTo)).toBe("2027-3-5");
    // Ovulation 12-14 days before the next period: cycle days 15-17.
    expect(ymd(c.ovulationFrom)).toBe("2027-3-15");
    expect(ymd(c.ovulationTo)).toBe("2027-3-17");
    // Fertile: 5 days before the ovulation range, through its end.
    expect(ymd(c.fertileFrom)).toBe("2027-3-10");
    expect(ymd(c.fertileTo)).toBe("2027-3-17");
  });

  it("rolls an older start date forward to the cycle containing today", () => {
    const r = periodReport({ lastStart: new Date(2026, 7, 1), cycle: 28, bleeding: 5 }, today);
    // 1.8. + 2 x 28 = 26.9. (current cycle start), next 24.10.
    expect(ymd(r.current.start)).toBe("2026-9-26");
    expect(ymd(r.next)).toBe("2026-10-24");
    expect(r.cycleDay).toBe(4);
    expect(r.daysToNext).toBe(25);
    expect(r.upcoming).toHaveLength(6);
  });

  it("flags cycles outside 21-35 days and rejects future start dates", () => {
    expect(periodReport({ lastStart: new Date(2026, 8, 1), cycle: 40, bleeding: 5 }, today).normal).toBe(false);
    expect(periodReport({ lastStart: new Date(2026, 8, 1), cycle: 30, bleeding: 5 }, today).normal).toBe(true);
    expect(periodReport({ lastStart: new Date(2026, 9, 5), cycle: 28, bleeding: 5 }, today).future).toBe(true);
    expect(periodReport({ lastStart: null, cycle: 28, bleeding: 5 }, today)).toBeNull();
  });

  it("renders the cycle table only for a usable report", () => {
    const ok = periodReport({ lastStart: new Date(2026, 8, 1), cycle: 28, bleeding: 5 }, today);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PeriodDetails r={ok} />
      </MemoryRouter>,
    );
    expect(html).toContain("Seuraavat kuusi kiertoa");
    const future = periodReport({ lastStart: new Date(2026, 9, 5), cycle: 28, bleeding: 5 }, today);
    expect(renderToStaticMarkup(<PeriodDetails r={future} />)).toBe("");
    expect(renderToStaticMarkup(<PeriodDetails r={null} />)).toBe("");
  });

  it("writes FAQ answers without en dashes", () => {
    for (const { q, a } of periodFaqs()) expect(q + a).not.toMatch(/–|\.\./);
  });
});
