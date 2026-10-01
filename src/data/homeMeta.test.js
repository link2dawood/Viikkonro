import { describe, expect, it } from "vitest";
import { homeMeta } from "./seo.js";

describe("homepage short-query metadata", () => {
  it("keeps the exact head query first and promotes viikkonumero", () => {
    const meta = homeMeta(new Date(2026, 7, 3));
    expect(meta.title).toBe(
      "Mikä viikko nyt on? Viikkonumero 32 (3.8.) | Viikko Nro",
    );
    expect(meta.description.startsWith("Mikä viikko on nyt?")).toBe(true);
    expect(meta.description).toContain("viikon numero");
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

  it("preserves the existing instant-answer lead", () => {
    const meta = homeMeta(new Date(2026, 7, 3));
    expect(meta.lead).toBe(
      "Juuri nyt on viikko 32 (viikkonumero 32) vuonna 2026. Viikko alkaa maanantaina 3.8.2026 ja päättyy sunnuntaina 9.8.2026.",
    );
  });
});
