import { describe, expect, it } from "vitest";
import { dstMeta } from "./dstPages.js";

describe("clock-change metadata", () => {
  it("leads with the autumn change for the current year once summer time is in effect", () => {
    const meta = dstMeta(2026, new Date(2026, 9, 15));

    expect(meta.title).toBe("Kelloja siirretään 25.10.2026: talviaika alkaa | Viikko Nro");
    expect(meta.title.length).toBeLessThan(60);
    // Leads with the dominant Search Console phrasing ("milloin kelloja
    // siirretään") rather than the noun "kellojen siirto" the page used before.
    expect(meta.description).toMatch(/^Milloin kelloja siirretään\?/);
    expect(meta.description).toContain("sunnuntaina");
    expect(meta.description).toContain("4.00");
    expect(meta.description).toContain("3.00");
    expect(meta.description).toContain("tunti taaksepäin");
    expect(meta.description).toContain("kesäaika");
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });

  it("keeps spring-first wording before the spring change in the current year", () => {
    const meta = dstMeta(2026, new Date(2026, 2, 10));

    expect(meta.title).toMatch(/^Kellojen siirto 2026/);
    expect(meta.title).toContain("kesäaika");
    expect(meta.title).toContain("2026");
    expect(meta.description).toContain("Kellojen siirto 2026");
  });
});

describe("clock-change metadata boundaries", () => {
  it.each([
    [new Date(2026, 2, 29, 23, 59), false],
    [new Date(2026, 2, 30), true],
    [new Date(2026, 9, 25, 23, 59), true],
    [new Date(2026, 9, 26), false],
  ])("selects the season for build date %s", (now, autumnFirst) => {
    expect(dstMeta(2026, now).title.includes("talviaika")).toBe(autumnFirst);
  });

  it.each([2025, 2027])("keeps spring first for a different page year (%i)", (year) => {
    expect(dstMeta(year, new Date(2026, 9, 15)).title).toBe(
      `Kellojen siirto ${year}: kesäaika alkaa | Viikko Nro`,
    );
  });

  it("keeps both dates, clock directions and snippet lengths in both seasons", () => {
    for (let year = 2020; year <= 2035; year += 1) {
      for (const now of [new Date(year, 0, 1), new Date(year, 9, 15)]) {
        const meta = dstMeta(year, now);
        expect(meta.title.length).toBeLessThan(60);
        expect(meta.description.length).toBeGreaterThanOrEqual(140);
        expect(meta.description.length).toBeLessThanOrEqual(160);
        expect(meta.description).toContain("tunti taaksepäin");
        expect(meta.description).toContain("3.00");
        expect(meta.description).toContain("4.00");
        expect(meta.description).toMatch(/\d{1,2}\.3\.\d{4}/);
        expect(meta.description).toMatch(/\d{1,2}\.10\.\d{4}/);
      }
    }
  });
});
