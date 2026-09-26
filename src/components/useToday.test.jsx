import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { dateFromDayKey, helsinkiDayKey, isoWeek, isoYear } from "./dateUtils.js";
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
    const hero = renderToStaticMarkup(<Weekcounter lead="" />);
    expect(hero).toContain('<span id="weekNow">49</span>');
    const nav = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />
      </MemoryRouter>,
    );
    expect(nav).toMatch(/Vk (<!-- -->)?49</);
  });
});
