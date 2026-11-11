import { describe, expect, it } from "vitest";
import {
  currentMonthFaqs,
  currentMonthFacts,
  currentMonthMeta,
  currentYearFaqs,
  currentYearFacts,
  currentYearMeta,
  parseIsoDate,
  weekdayFaqs,
  weekdayMeta,
  weekdayResult,
} from "./currentDateContent.js";

describe("current month and year content", () => {
  it("handles month boundaries and leap years", () => {
    expect(currentMonthFacts(new Date(2026, 0, 10)).previous).toEqual({ month: 12, year: 2025 });
    expect(currentMonthFacts(new Date(2026, 11, 10)).next).toEqual({ month: 1, year: 2027 });
    expect(currentYearFacts(new Date(2028, 1, 29))).toMatchObject({ leap: true, days: 366 });
  });

  it("keeps metadata and FAQ sets inside their contracts", () => {
    const metas = [
      currentMonthMeta(new Date(2026, 7, 4)),
      currentYearMeta(new Date(2026, 7, 4)),
      weekdayMeta,
    ];
    for (const meta of metas) {
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(140);
      expect(meta.description.length).toBeLessThanOrEqual(160);
    }
    expect(currentMonthFaqs(new Date(2026, 7, 4))).toHaveLength(5);
    expect(currentYearFaqs(new Date(2026, 7, 4))).toHaveLength(5);
    expect(weekdayFaqs).toHaveLength(10);
    expect(weekdayFaqs.map((f) => f.q)).toContain("Miten viikonpäivä lasketaan?");
    expect(weekdayFaqs.map((f) => f.q)).toContain("Miksi viikonpäivä vaihtuu joka vuosi?");
    expect(weekdayFaqs.map((f) => f.q)).toContain("Mitä kalenterijärjestelmää Suomessa käytetään?");
  });
});

describe("weekday date parsing", () => {
  it("returns Finnish weekday and ISO week facts", () => {
    expect(weekdayResult("2026-07-20")).toMatchObject({
      weekday: "Maanantai",
      week: 30,
      weekYear: 2026,
    });
  });

  it("rejects impossible and malformed dates", () => {
    expect(parseIsoDate("2026-02-29")).toBeNull();
    expect(parseIsoDate("20.7.2026")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
  });
});
