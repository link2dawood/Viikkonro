import { describe, expect, it } from "vitest";
import { breadcrumbTrail } from "./seo.js";

describe("calendar and print breadcrumbs", () => {
  it("keeps every dated child under the matching year calendar", () => {
    for (const path of [
      "/kalenteri-2027-alkuvuosi",
      "/kalenteri-2027-loppuvuosi",
      "/tulostettava-kalenteri-2027",
      "/tulosta-2027",
    ]) {
      expect(breadcrumbTrail(path)[1]).toEqual({
        name: "Kalenteri 2027",
        path: "/kalenteri-2027",
      });
    }
  });

  it("does not create a self-referential parent for a full-year calendar", () => {
    expect(breadcrumbTrail("/kalenteri-2027")).toEqual([
      { name: "Etusivu", path: "/" },
      { name: "Kalenteri 2027", path: "/kalenteri-2027" },
    ]);
  });

  it("gives the two print artifacts distinct leaf labels", () => {
    expect(breadcrumbTrail("/tulosta-2027").at(-1).name).toBe(
      "Tulostettava viikkolista 2027",
    );
    expect(breadcrumbTrail("/tulostettava-kalenteri-2027").at(-1).name).toBe(
      "Tulostettava A4-kuukausikalenteri 2027",
    );
  });
});
