import { describe, expect, it } from "vitest";
import { upcomingEventPages, upcomingEvents } from "./upcomingEvents.js";
import { isIndexable, sitemapEntries } from "./seo.js";
import { CONFIDENCE, pageConfidenceTier } from "./schoolHolidayPages.js";

const keys = (d, n) => upcomingEvents(d, n).map((e) => e.path);

// Helsinki-local noon, so the Helsinki day key never lands on the day before.
const at = (iso) => new Date(`${iso}T10:00:00Z`);
const fi = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
const paths = (d, n = 5) => upcomingEventPages(at(d), n).map((e) => e.path);

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
    const eventPaths = events.map((e) => e.path);
    expect(new Set(eventPaths).size).toBe(eventPaths.length);
    for (const p of eventPaths) expect(isIndexable(p, 2030)).toBe(true);
  });
});

describe("upcomingEventPages", () => {
  it("orders the December 2026 run by real event dates", () => {
    const events = upcomingEventPages(at("2026-11-21"), 5);
    expect(events.map((e) => [e.path, fi(e.date)])).toEqual([
      ["/adventti-2026", "29.11.2026"],
      ["/itsenaisyyspaiva-2026", "6.12.2026"],
      ["/joululoma-2026", "23.12.2026"],
      ["/joulu-2026", "24.12.2026"],
      ["/uusi-vuosi-2027", "31.12.2026"],
    ]);
  });

  it("keeps an event listed on its own day and drops it the day after", () => {
    expect(paths("2026-12-06")[0]).toBe("/itsenaisyyspaiva-2026");
    expect(paths("2026-12-07")).not.toContain("/itsenaisyyspaiva-2026");
    expect(paths("2026-12-24")[0]).toBe("/joulu-2026");
    expect(paths("2026-12-25")).not.toContain("/joulu-2026");
  });

  it("crosses the year boundary instead of running empty", () => {
    const list = paths("2026-12-28");
    expect(list.length).toBe(5);
    expect(list).toContain("/loppiainen-2027");
    expect(list.every((p) => /-20\d\d$/.test(p))).toBe(true);
  });

  it("returns no duplicate paths and honours the count", () => {
    for (const day of ["2026-11-21", "2026-12-28", "2027-03-01", "2027-07-15"]) {
      const list = paths(day, 4);
      expect(list.length).toBeLessThanOrEqual(4);
      expect(new Set(list).size).toBe(list.length);
    }
  });

  // The whole point of the block is to spend internal links on pages that can
  // rank. A noindex or unpublished destination would waste them, and a 404
  // would be worse than the original orphan.
  it("only ever links to indexable, published pages", () => {
    for (const year of [2026, 2027, 2028]) {
      const published = new Set(
        sitemapEntries(year)
          .map((e) => e.path)
          .filter((p) => isIndexable(p, year)),
      );
      for (const day of [`${year}-01-15`, `${year}-06-01`, `${year}-11-21`, `${year}-12-28`]) {
        for (const path of paths(day, 6)) {
          expect(published.has(path), `${path} (today ${day}) must be an indexable sitemap entry`).toBe(true);
        }
      }
    }
  });

  it("omits /joululoma- for years whose school holidays are not confirmed", () => {
    const unconfirmed = [2029, 2030, 2031].find(
      (y) => pageConfidenceTier(y) !== CONFIDENCE.CONFIRMED,
    );
    expect(unconfirmed).toBeDefined();
    const list = upcomingEventPages(at(`${unconfirmed - 1}-12-01`), 8).map((e) => e.path);
    expect(list).not.toContain(`/joululoma-${unconfirmed}`);
  });

  it("carries a name and a description for every entry", () => {
    for (const event of upcomingEventPages(at("2026-11-21"), 5)) {
      expect(event.name).toMatch(/\S/);
      expect(event.desc).toMatch(/\S/);
      expect(event.name).not.toMatch(/–/); // no en dash in page copy
      expect(event.desc).not.toMatch(/–/);
    }
  });
});
