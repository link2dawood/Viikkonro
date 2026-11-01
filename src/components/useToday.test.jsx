/* global process */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { dateFromDayKey, dayOfYear, helsinkiDayKey, isoWeek, isoYear } from "./dateUtils.js";
import { currentYearFacts } from "../data/currentDateContent.js";
import { useToday } from "./useToday.js";
import Weekcounter from "./Weekcounter.jsx";
import Navbar from "./Navbar.jsx";

afterEach(() => {
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
  vi.useRealTimers();
});

describe("helsinkiDayKey", () => {
  it("is already Monday in Helsinki when UTC is still Sunday", () => {
    // The nightly rebuild fires at 22:05 UTC — 00:05 Monday in Helsinki (winter).
    expect(helsinkiDayKey(new Date("2026-11-29T22:05:00Z"))).toBe("2026-11-30");
    // Summer: 21:05 UTC is 00:05 Monday in Helsinki.
    expect(helsinkiDayKey(new Date("2026-06-28T21:05:00Z"))).toBe("2026-06-29");
    expect(helsinkiDayKey(new Date("2026-06-28T20:55:00Z"))).toBe("2026-06-28");
  });
});

describe("dateFromDayKey", () => {
  it("round-trips through local getters and Helsinki conversion", () => {
    const d = dateFromDayKey("2026-11-30");
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 11, 30]);
    expect(helsinkiDayKey(d)).toBe("2026-11-30");
    expect(isoWeek(d)).toBe(49);
    expect(isoYear(d)).toBe(2026);
  });
});

function Probe() {
  const today = useToday();
  return <span>{helsinkiDayKey(today)}</span>;
}

describe("useToday on the server", () => {
  it("renders the build's render day, not the machine clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-01T12:00:00Z"));
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-11-30";
    expect(renderToStaticMarkup(<Probe />)).toBe("<span>2026-11-30</span>");
  });

  it("falls back to today in Helsinki when no render day is set", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-29T22:30:00Z"));
    expect(renderToStaticMarkup(<Probe />)).toBe("<span>2026-11-30</span>");
  });

  it("puts the render day's week in the homepage hero and the navbar badge", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-11-30"; // Monday of week 49
    const hero = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/"]}>
        <Weekcounter lead="" />
      </MemoryRouter>,
    );
    expect(hero).toContain('<span id="weekNow">49</span>');
    expect(hero).toContain('id="weekParityNow"');
    expect(hero).toContain('href="/viikko-48-2026"');
    expect(hero).toContain('href="/viikko-50-2026"');
    const nav = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />
      </MemoryRouter>,
    );
    expect(nav).toMatch(/Vk (<!-- -->)?49</);
  });

  it("preserves Helsinki civil date in UTC+14 (Pacific/Kiritimati) and positive-offset zones", () => {
    const originalTz = process.env.TZ;
    try {
      for (const zone of ["UTC", "Europe/Helsinki", "Asia/Karachi", "Pacific/Kiritimati"]) {
        process.env.TZ = zone;
        const d = dateFromDayKey("2026-12-31");
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth() + 1).toBe(12);
        expect(d.getDate()).toBe(31);
        expect(dayOfYear(d)).toBe(365);
        expect(isoWeek(d)).toBe(53);
        expect(isoYear(d)).toBe(2026);
        expect(helsinkiDayKey(d)).toBe("2026-12-31");

        const facts = currentYearFacts(d);
        expect(facts.year).toBe(2026);
        expect(facts.days).toBe(365);
        expect(facts.weeks).toBe(53);
        expect(facts.quarter).toBe(4);
        expect(facts.dayOfYear).toBe(365);
        expect(facts.daysRemaining).toBe(0);
      }
    } finally {
      process.env.TZ = originalTz;
    }
  });

  it("keeps current year at 2026 when Helsinki is on 31 Dec 2026 even if client clock is 08:00Z in UTC+14", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T08:00:00Z"));
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = "Pacific/Kiritimati";
      const key = helsinkiDayKey();
      expect(key).toBe("2026-12-31");
      const d = dateFromDayKey(key);
      const facts = currentYearFacts(d);
      expect(facts.year).toBe(2026);
      expect(facts.currentWeek).toBe(53);
    } finally {
      process.env.TZ = originalTz;
    }
  });
});
