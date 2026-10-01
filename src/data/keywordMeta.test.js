import { describe, expect, it } from "vitest";
import { calendarMeta, homeMeta, weekMeta, yearMeta } from "./seo.js";
import { holidayFaqs, holidayPageFor, holidayPageMeta } from "./holidayPages.js";
import { schoolHolidayMeta } from "./schoolHolidayPages.js";

// Search Console queries these pages are tuned for (checked 2026-10-01):
// "mikä viikko on nyt", "viikot 2026", "viikkokalenteri 2026/2027",
// "syysloma 2026", "pääsiäinen 2027", "viikko 42".
describe("keyword-targeted metadata", () => {
  it("opens the homepage description with the alternate head-query order", () => {
    expect(homeMeta(new Date(2026, 9, 1)).description).toMatch(/^Mikä viikko on nyt\? Nyt on viikko 40 /);
  });

  it("leads year and calendar titles with the literal queries", () => {
    expect(yearMeta(2026).title).toMatch(/^Viikot 2026: viikkonumerot/);
    expect(calendarMeta(2027).title).toMatch(/^Viikkokalenteri 2027: /);
  });

  it("states real syysloma weeks and dates on the school-holiday page", () => {
    const meta = schoolHolidayMeta(2026);
    expect(meta.title).toMatch(/^Syysloma 2026 /);
    expect(meta.description).toContain("viikolla 42 (12.-16.10.) tai 43 (19.-25.10.)");
    expect(schoolHolidayMeta(2027).description).toContain("Helsinki viikolla 42 (18.-22.10.)");
  });

  it("names syysloma on week pages only where it is confirmed", () => {
    expect(weekMeta(42, 2026).description).toContain("syyslomaviikko monessa kunnassa");
    expect(weekMeta(42, 2027).description).toContain("syyslomaviikko (vahvistettu: Helsinki)");
    expect(weekMeta(40, 2026).description).not.toContain("loma");
  });

  it("covers the whole Easter weekend on the pääsiäinen page", () => {
    const meta = holidayPageMeta(2027, "paasiaispaiva");
    expect(meta.title).toBe("Pääsiäinen 2027: 26.-29.3., viikot 12-13 | Viikko Nro");
    expect(meta.description).toContain("pitkäperjantai 26.3., pääsiäispäivä 28.3. ja toinen pääsiäispäivä 29.3.2027");
    const faq = holidayFaqs(holidayPageFor(2027, "paasiaispaiva"));
    expect(faq.at(-1).q).toBe("Milloin pääsiäinen 2027 on?");
    expect(holidayFaqs(holidayPageFor(2027, "vappu"))).toHaveLength(5);
  });

  it("keeps new copy free of en dashes", () => {
    const EN_DASH = String.fromCharCode(0x2013);
    for (const meta of [yearMeta(2026), calendarMeta(2027), schoolHolidayMeta(2026), holidayPageMeta(2027, "paasiaispaiva")]) {
      expect(meta.title + meta.description).not.toContain(EN_DASH);
    }
    // Week titles keep their established format (weekMeta.test.js); only the
    // new school-holiday description is checked.
    expect(weekMeta(42, 2026).description).not.toContain(EN_DASH);
  });
});
