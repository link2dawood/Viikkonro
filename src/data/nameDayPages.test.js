import { describe, expect, it } from "vitest";
import { nameDayDateKeys, nameDayNames } from "./nameDays.js";
import {
  nameDayDateMeta,
  nameDayDatePage,
  nameDayFaqs,
  nameDayNameMeta,
  nameDayNamePage,
  todayNameDayMeta,
  todayNameDayPage,
} from "./nameDayPages.js";

describe("name-day SEO pages", () => {
  it("distinguishes names with the same Finnish genitive", () => {
    expect(nameDayNameMeta("elmer").description).not.toBe(nameDayNameMeta("elmeri").description);
  });
  it("resolves every seeded name and date landing page", () => {
    for (const item of nameDayNames()) {
      expect(nameDayNamePage(item.slug)).not.toBeNull();
    }
    for (const dateKey of nameDayDateKeys()) {
      expect(nameDayDatePage(dateKey)).not.toBeNull();
    }
  });

  it("keeps indexable metadata within snippet budgets", () => {
    const metas = [
      ...nameDayNames().map((item) => nameDayNameMeta(item.slug)),
      ...nameDayDateKeys().map((dateKey) => nameDayDateMeta(dateKey)),
    ];
    for (const meta of metas) {
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(140);
      expect(meta.description.length).toBeLessThanOrEqual(158);
    }
  });

  it("uses Finland's date for the today route and noindexes missing seed data", () => {
    const now = new Date("2026-08-03T22:30:00Z");
    const page = todayNameDayPage(now);
    const meta = todayNameDayMeta(now);
    expect(page.date.getFullYear()).toBe(2026);
    expect(page.date.getMonth()).toBe(7);
    expect(page.date.getDate()).toBe(4);
    expect(page.available).toBe(false);
    expect(meta.robots).toBe("noindex, follow");
  });

  it("provides four matching FAQs for every page type", () => {
    expect(nameDayFaqs(nameDayNamePage("aapeli"), "name")).toHaveLength(4);
    expect(nameDayFaqs(nameDayDatePage("01-02"), "date")).toHaveLength(4);
    expect(nameDayFaqs(todayNameDayPage(), "today")).toHaveLength(4);
  });

  it("rejects unknown names and unpopulated dates", () => {
    expect(nameDayNamePage("elina")).toBeNull();
    expect(nameDayDatePage("08-04")).toBeNull();
  });
});
