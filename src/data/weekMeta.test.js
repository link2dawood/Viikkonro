import { describe, expect, it } from "vitest";
import { weeksInIsoYear } from "../components/dateUtils.js";
import { weekMeta } from "./seo.js";

const EN_DASH = String.fromCharCode(0x2013);

describe("week metadata", () => {
  it("promises only content available on every week page", () => {
    const meta = weekMeta(43, 2026);

    expect(meta.description).toContain("päivämäärät");
    expect(meta.description).toContain("juhlapäivät");
    expect(meta.description).toContain("työpäivät");
    expect(meta.description).toContain("tulostettava kalenteri");
    expect(meta.description).not.toContain("nimipäivät");
  });

  it("keeps representative descriptions inside snippet limits", () => {
    for (const [week, year] of [
      [1, 2026],
      [43, 2026],
      [53, 2026],
    ]) {
      const { description } = weekMeta(week, year);
      expect(description.length).toBeGreaterThanOrEqual(140);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });

  it("leads the title with the exact query phrase", () => {
    // Week 41 2026 contains Aleksis Kiven päivä, deliberately left out of
    // TITLE_HOOKS, so this also proves the hook whitelist: the week falls
    // through to the generic hook instead of naming a low-volume flag day.
    const { title } = weekMeta(41, 2026);

    expect(title).toBe("Viikko 41 2026 (5.-11.10.): päivät ja PDF | Viikko Nro");
    expect(title).not.toContain("vuonna");
    expect(title).not.toContain("(vk");
    expect(title).not.toContain("vko");
  });

  it("names the reason to click when the week has one", () => {
    expect(weekMeta(42, 2026).title).toContain("syyslomaviikko");
    expect(weekMeta(8, 2026).title).toContain("hiihtolomaviikko");
    expect(weekMeta(45, 2026).title).toContain("isänpäivä");
    expect(weekMeta(14, 2026).title).toContain("pääsiäinen");
    expect(weekMeta(49, 2026).title).toContain("itsenäisyyspäivä");
    // Jouluaatto, joulupäivä and tapaninpäivä collapse into one hook word.
    expect(weekMeta(52, 2026).title.match(/joulu/g)).toHaveLength(1);
  });

  it("keeps every generated week title unique and within 60 characters", () => {
    const titles = [];
    for (let year = 2020; year <= 2035; year += 1) {
      for (let week = 1; week <= weeksInIsoYear(year); week += 1) {
        const { title } = weekMeta(week, year);
        expect(title.startsWith(`Viikko ${week} ${year} (`)).toBe(true);
        expect(title.endsWith(" | Viikko Nro")).toBe(true);
        expect(title).not.toContain("vuonna");
        expect(title).not.toContain(EN_DASH);
        // Long official flag-day names must never reach a title.
        expect(title).not.toContain("Agricolan");
        expect(title.length).toBeLessThanOrEqual(60);
        titles.push(title);
      }
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps both calendar years visible when an ISO week crosses New Year", () => {
    expect(weekMeta(1, 2026).title).toContain("29.12.2025-4.1.2026");
    expect(weekMeta(53, 2026).title).toContain("28.12.2026-3.1.2027");
  });
});
