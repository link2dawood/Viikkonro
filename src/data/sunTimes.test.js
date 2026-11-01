import { describe, it, expect } from "vitest";
import {
  HELSINKI,
  UTSJOKI,
  sunTimesForDate,
  sunTimesForWeek,
  formatHelsinkiTime,
} from "./sunTimes";

describe("ordinary location/date (Helsinki)", () => {
  it("returns valid sunrise/sunset and a sane daylight duration", () => {
    const r = sunTimesForDate(new Date(2026, 8, 23), HELSINKI); // ~equinox
    expect(r.polarDay).toBe(false);
    expect(r.polarNight).toBe(false);
    expect(r.sunrise instanceof Date).toBe(true);
    expect(r.sunset instanceof Date).toBe(true);
    expect(isNaN(r.sunrise.getTime())).toBe(false);
    expect(isNaN(r.sunset.getTime())).toBe(false);
    // Near an equinox, daylight should be roughly half the day.
    expect(r.daylightMinutes).toBeGreaterThan(11 * 60);
    expect(r.daylightMinutes).toBeLessThan(13 * 60);
  });

  // Sanity bound against a real, independently sourced fact (checked
  // 2026-07-23: Helsinki's summer-solstice sunset in 2026 is ~22:50 local),
  // specifically to catch a lat/lon-swap-style bug — not to re-validate
  // suncalc's own astronomical precision, which is out of scope per the
  // handoff's "use an established library" guidance.
  it("June 21 sunset in Helsinki falls in the expected local-time window", () => {
    const r = sunTimesForDate(new Date(2026, 5, 21), HELSINKI);
    const [hh, mm] = formatHelsinkiTime(r.sunset).split(".").map(Number);
    const minutesSinceMidnight = hh * 60 + mm;
    expect(minutesSinceMidnight).toBeGreaterThan(22 * 60);
    expect(minutesSinceMidnight).toBeLessThan(23 * 60 + 30);
  });
});

describe("Utsjoki polar day / polar night", () => {
  // Windows verified against independent sources (checked 2026-07-23):
  // midnight sun 17 May–28 Jul, kaamos (polar night) 26 Nov–15 Jan. Dates
  // below are picked comfortably inside each window, not at the edges.
  it("June: polar day (midnight sun) — no sunrise/sunset, 1440 daylight minutes", () => {
    const r = sunTimesForDate(new Date(2026, 5, 21), UTSJOKI);
    expect(r.polarDay).toBe(true);
    expect(r.polarNight).toBe(false);
    expect(r.sunrise).toBeNull();
    expect(r.sunset).toBeNull();
    expect(r.daylightMinutes).toBe(24 * 60);
  });

  it("December: polar night (kaamos) — no sunrise/sunset, 0 daylight minutes", () => {
    const r = sunTimesForDate(new Date(2026, 11, 15), UTSJOKI);
    expect(r.polarNight).toBe(true);
    expect(r.polarDay).toBe(false);
    expect(r.sunrise).toBeNull();
    expect(r.sunset).toBeNull();
    expect(r.daylightMinutes).toBe(0);
  });

  it("never produces an Invalid Date for sunrise/sunset during polar day or night", () => {
    for (const d of [new Date(2026, 5, 21), new Date(2026, 11, 15)]) {
      const r = sunTimesForDate(d, UTSJOKI);
      expect(r.sunrise).toBeNull();
      expect(r.sunset).toBeNull();
    }
  });

  it("outside the polar windows, Utsjoki has ordinary sunrise/sunset (e.g. an equinox)", () => {
    const r = sunTimesForDate(new Date(2026, 8, 23), UTSJOKI);
    expect(r.polarDay).toBe(false);
    expect(r.polarNight).toBe(false);
    expect(r.sunrise instanceof Date).toBe(true);
    expect(r.sunset instanceof Date).toBe(true);
  });
});

describe("sunTimesForWeek", () => {
  it("returns 7 consecutive days, Monday through Sunday", () => {
    const days = sunTimesForWeek(2026, 39, HELSINKI); // late September
    expect(days.length).toBe(7);
    expect(days[0].date.getDay()).toBe(1);
    expect(days[6].date.getDay()).toBe(0);
    for (let i = 1; i < 7; i++) {
      expect(days[i].date - days[i - 1].date).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("daylight shortens day over day through an autumn week in Helsinki", () => {
    const days = sunTimesForWeek(2026, 41, HELSINKI); // early-mid October
    for (const day of days) {
      expect(day.deltaMinutesFromPreviousDay).toBeLessThan(0);
    }
  });

  it("stays flat (delta 0) across a week fully inside polar night at Utsjoki", () => {
    // Week comfortably inside 26 Nov–15 Jan kaamos, away from either edge.
    const days = sunTimesForWeek(2026, 51, UTSJOKI); // mid-December
    for (const day of days) {
      expect(day.polarNight).toBe(true);
      expect(day.daylightMinutes).toBe(0);
      expect(day.deltaMinutesFromPreviousDay).toBe(0);
    }
  });
});

describe("Finding 3: Solar data consistency across positive-offset timezones", () => {
  it("computes the correct civil-day solar times for 23 March 2026 (week 13)", () => {
    // 23 March 2026 in Helsinki: sunrise is ~06.13 and sunset is ~18.41
    // Prior bug shifted positive-offset visitors to 22 March (06.16 / 18.39)
    const week13 = sunTimesForWeek(2026, 13, HELSINKI);
    const monday = week13[0];
    expect(formatHelsinkiTime(monday.sunrise)).toBe("06.13");
    expect(formatHelsinkiTime(monday.sunset)).toBe("18.41");
    expect(monday.daylightMinutes).toBe(749);
    expect(monday.deltaMinutesFromPreviousDay).toBe(6);
  });

  it("handles daylight saving transition correctly on Sunday 29 March 2026", () => {
    // Sunday 29 March 2026: clocks spring forward from UTC+2 to UTC+3 at 03:00
    const week13 = sunTimesForWeek(2026, 13, HELSINKI);
    const sunday = week13[6];
    expect(formatHelsinkiTime(sunday.sunrise)).toBe("06.54");
    expect(formatHelsinkiTime(sunday.sunset)).toBe("19.56");
  });

  it("accepts ISO date string format YYYY-MM-DD", () => {
    const r = sunTimesForDate("2026-03-23", HELSINKI);
    expect(formatHelsinkiTime(r.sunrise)).toBe("06.13");
    expect(formatHelsinkiTime(r.sunset)).toBe("18.41");
  });
});

describe("formatHelsinkiTime", () => {
  it("returns null for a null input instead of throwing or formatting garbage", () => {
    expect(formatHelsinkiTime(null)).toBeNull();
  });
  it("formats as HH.MM (fi-FI convention uses a period, not a colon)", () => {
    const formatted = formatHelsinkiTime(new Date(2026, 5, 21, 19, 50));
    expect(formatted).toMatch(/^\d{2}\.\d{2}$/);
  });
});
