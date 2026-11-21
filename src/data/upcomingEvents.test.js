import { describe, expect, it } from "vitest";
import { isIndexable } from "./seo.js";
import { upcomingEvents } from "./upcomingEvents.js";

const keys = (d, n) => upcomingEvents(d, n).map((e) => e.path);

describe("upcomingEvents", () => {
  it("lists the next events in date order starting today", () => {
    const events = upcomingEvents(new Date(2026, 10, 21), 8);
    expect(events.map((e) => e.path)).toEqual([
      "/adventti-2026",
      "/itsenaisyyspaiva-2026",
      "/joulu-2026",
      "/pyhat-2026/joulupaiva",
      "/pyhat-2026/tapaninpaiva",
      "/uusi-vuosi-2027",
      "/loppiainen-2027",
      "/laskiainen-2027",
    ]);
    expect(events[0]).toMatchObject({ name: "1. adventti", weekday: "Sunnuntai", week: 48 });
  });
  it("includes today and skips yesterday", () => {
    const first = upcomingEvents(new Date(2026, 11, 6, 15), 1)[0];
    expect(first.path).toBe("/itsenaisyyspaiva-2026");
    expect(keys(new Date(2026, 11, 7), 20)).not.toContain("/itsenaisyyspaiva-2026");
  });
  it("crosses the year boundary", () => {
    expect(keys(new Date(2026, 11, 30), 3)).toContain("/uusi-vuosi-2027");
  });
  it("only returns indexable pages, without duplicates", () => {
    const events = upcomingEvents(new Date(2030, 6, 1), 30);
    const paths = events.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths) expect(isIndexable(p, 2030)).toBe(true);
  });
});
