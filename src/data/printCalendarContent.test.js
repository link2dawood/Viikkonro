import { describe, expect, it } from "vitest";
import { calendarMeta, printMeta } from "./seo.js";
import {
  calendarCsv,
  printableCalendarFaqs,
  printListFaqs,
} from "./printCalendarContent.js";

describe("print and PDF calendar content", () => {
  it("builds an Excel-compatible Finnish CSV with every day", () => {
    const csv = calendarCsv(2026);
    const rows = csv.split("\r\n");
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(rows).toHaveLength(366);
    expect(rows[0]).toContain("Päivämäärä;Viikonpäivä;Viikko;Viikkovuosi");
    expect(rows[1]).toContain("01.01.2026;Torstai;1;2026;Uudenvuodenpäivä");
    expect(rows.at(-1)).toContain("31.12.2026;Torstai;53;2026");
  });

  it("provides five visible FAQs for each print intent", () => {
    expect(printListFaqs(2026)).toHaveLength(5);
    expect(printableCalendarFaqs(2026)).toHaveLength(5);
  });

  it("keeps distinct metadata inside snippet limits", () => {
    const list = printMeta(2026);
    const calendar = calendarMeta(2026, null, true);
    const browsable = calendarMeta(2026, null, false);
    expect(list.title).not.toBe(calendar.title);
    expect(list.title).toContain("viikkolista");
    expect(list.title).toContain("ISO-viikkoa");
    expect(calendar.title).toContain("A4-kuukausikalenteri");
    expect(browsable.title).toContain("Viikkokalenteri");
    expect(browsable.title).toContain("12 kuukautta");
    expect(browsable.title).not.toContain("PDF");
    for (const meta of [list, calendar, browsable]) {
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(140);
      expect(meta.description.length).toBeLessThanOrEqual(160);
    }
  });
});
