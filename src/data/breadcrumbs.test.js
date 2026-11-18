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
      "Tulostettava viikkokalenteri 2027",
    );
    expect(breadcrumbTrail("/tulostettava-kalenteri-2027").at(-1).name).toBe(
      "Tulostettava kalenteri 2027",
    );
  });
});

describe("week, year and holiday breadcrumbs", () => {
  it("formats week breadcrumb trail as Etusivu > [year] > Viikko N", () => {
    expect(breadcrumbTrail("/viikko-1-2027")).toEqual([
      { name: "Etusivu", path: "/" },
      { name: "2027", path: "/vuosi-2027" },
      { name: "Viikko 1", path: "/viikko-1-2027" },
    ]);
  });

  it("formats year breadcrumb trail as Etusivu > [year]", () => {
    expect(breadcrumbTrail("/vuosi-2027")).toEqual([
      { name: "Etusivu", path: "/" },
      { name: "2027", path: "/vuosi-2027" },
    ]);
  });

  it("formats holiday breadcrumbs with matching BreadcrumbList hierarchy", () => {
    expect(breadcrumbTrail("/pyhapaivat-2027")).toEqual([
      { name: "Etusivu", path: "/" },
      { name: "2027", path: "/vuosi-2027" },
      { name: "Pyhäpäivät 2027", path: "/pyhapaivat-2027" },
    ]);
    expect(breadcrumbTrail("/pyhat-2027/loppiainen")).toEqual([
      { name: "Etusivu", path: "/" },
      { name: "Pyhäpäivät 2027", path: "/pyhapaivat-2027" },
      { name: "Loppiainen", path: "/pyhat-2027/loppiainen" },
    ]);
  });
});
