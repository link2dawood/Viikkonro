import { describe, expect, it } from "vitest";
import { weeksInIsoYear } from "../components/dateUtils.js";
import { weekMeta } from "./seo.js";

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

  it("aligns the title with the H1 without keyword-list abbreviations", () => {
    const { title } = weekMeta(43, 2026);

    expect(title).toBe(
      "Viikko 43 vuonna 2026 – 19.–25.10.2026 | Viikko Nro",
    );
    expect(title).not.toContain("(vk");
    expect(title).not.toContain("vko");
  });

  it("keeps every generated week title unique and within 60 characters", () => {
    const titles = [];
    for (let year = 2020; year <= 2035; year += 1) {
      for (let week = 1; week <= weeksInIsoYear(year); week += 1) {
        const { title } = weekMeta(week, year);
        expect(title).toMatch(
          new RegExp(`^Viikko ${week} vuonna ${year} – `),
        );
        expect(title.length).toBeLessThanOrEqual(60);
        titles.push(title);
      }
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps both calendar years visible when an ISO week crosses New Year", () => {
    expect(weekMeta(1, 2026).title).toContain("29.12.2025–4.1.2026");
    expect(weekMeta(53, 2026).title).toContain("28.12.2026–3.1.2027");
  });
});
