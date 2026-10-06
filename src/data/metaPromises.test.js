import { describe, expect, it } from "vitest";
import { calendarFaqs, monthMeta, workingDaysMeta, yearMeta } from "./seo.js";

describe("generated metadata promises", () => {
  it("explains the calendar-year and ISO-year boundary with computed facts", () => {
    const faq = calendarFaqs(2027).find(({ q }) => q.includes("ensimmäinen ja viimeinen"));
    expect(faq.a).toContain("1.1.2027 kuuluu viikkoon 53/2026");
    expect(faq.a).toContain("31.12.2027 viikkoon 52/2027");
  });
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

  it("keeps working-day metadata focused on both calculation modes", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      const meta = workingDaysMeta(year);
      expect(meta.title).toContain(`Työpäivät ${year}`);
      expect(meta.description).toContain("Kelan arkipäivät");
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(140);
      expect(meta.description.length).toBeLessThanOrEqual(160);
    }
  });
});
