import { describe, expect, it } from "vitest";
import { homeMeta } from "./seo.js";

describe("homepage short-query metadata", () => {
  it("leads with the current-week query and calendar intent", () => {
    const meta = homeMeta(new Date(2026, 7, 3));
    expect(meta.title).toBe("Viikkonumero 32 (3.8.): Mikä viikko nyt on? | Viikko Nro");
    expect(meta.description).toContain("Nyt on viikko 32 vuonna 2026.");
    expect(meta.description).toContain("parillinen tai pariton viikko");
  });

  it("keeps titles and descriptions inside snippet limits across the year", () => {
    for (const date of [
      new Date(2026, 0, 1),
      new Date(2026, 7, 3),
      new Date(2026, 11, 31),
    ]) {
      const meta = homeMeta(date);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThanOrEqual(140);
      expect(meta.description.length).toBeLessThanOrEqual(160);
      expect(meta.description).not.toContain("..");
    }
  });

  it("keeps the live answer and week dates in the visible lead", () => {
    const meta = homeMeta(new Date(2026, 7, 3));
    expect(meta.lead).toBe(
      "Juuri nyt on viikko 32 (viikkonumero 32) vuonna 2026. Viikko alkaa maanantaina 3.8.2026 ja päättyy sunnuntaina 9.8.2026.",
    );
  });
});
