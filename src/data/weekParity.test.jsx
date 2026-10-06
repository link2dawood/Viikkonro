import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import WeekParity from "../components/WeekParity.jsx";
import { currentWeekParity } from "./weekParity.js";

afterEach(() => vi.useRealTimers());

describe("ISO week parity", () => {
  it("keeps consecutive odd weeks at a 53-week year boundary", () => {
    expect(currentWeekParity(new Date(2027, 0, 1))).toEqual({
      week: 53, year: 2026, parity: "pariton",
      nextWeek: 1, nextYear: 2027, nextParity: "pariton",
    });
  });

  it("alternates after week 52 in a 52-week year", () => {
    expect(currentWeekParity(new Date(2025, 11, 28))).toEqual({
      week: 52, year: 2025, parity: "parillinen",
      nextWeek: 1, nextYear: 2026, nextParity: "pariton",
    });
  });

  it("prerenders direct answers and valid week-year links without JavaScript", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
    const html = renderToStaticMarkup(<MemoryRouter><WeekParity /></MemoryRouter>);
    expect(html).toContain("<strong>pariton viikko</strong>");
    expect(html).toContain('href="/viikko-53-2026"');
    expect(html).toContain('href="/viikko-1-2027"');
    expect(html).toContain('href="/vuosi-2026#parilliset-ja-parittomat-viikot"');
    expect(html).not.toContain("viikko-54");
  });
});
