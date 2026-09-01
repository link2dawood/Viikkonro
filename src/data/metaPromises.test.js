import { describe, expect, it } from "vitest";
import { calendarFaqs, monthMeta, yearMeta } from "./seo.js";

describe("generated metadata promises", () => {
  it("keeps month descriptions limited to consistently rendered content", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const { description } = monthMeta(month, year);

        expect(description).toContain("päivämäärät");
        expect(description).toContain("työpäivät");
        expect(description).toContain("arkipyhät");
        expect(description).toContain("PDF-muodossa");
        expect(description).not.toContain("nimipäivät");
        expect(description.length).toBeGreaterThanOrEqual(140);
        expect(description.length).toBeLessThanOrEqual(160);
      }
    }
  });

  it("keeps year descriptions limited to consistently rendered content", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      const { description } = yearMeta(year);

      expect(description).toContain("päivämäärineen");
      expect(description).toContain("työpäiviä");
      expect(description).toContain("arkipyhiä");
      expect(description).toContain("PDF-muodossa");
      expect(description).not.toContain("nimipäiviä");
      expect(description.length).toBeGreaterThanOrEqual(140);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });

  it("does not imply complete name-day coverage from calendar week links", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      const answers = calendarFaqs(year).map((item) => item.a).join(" ");
      expect(answers).not.toContain("nimipäivät");
      expect(answers).toContain("päivänvalotiedot");
    }
  });
});
