import { describe, expect, it } from "vitest";
import { needsHeadSync, prerenderedPath } from "./seoDom.js";

// src/components/SEO.jsx decides, once per render, whether the robots meta and
// the JSON-LD graph in <head> still have to be written from the browser. The
// skip is what keeps data/pageJsonLd (109 KB) off the critical path of every
// page, so the conditions it depends on are covered here rather than left to
// the component.

function documentWithCanonical(href) {
  return {
    querySelector: (selector) => {
      if (selector !== 'link[rel="canonical"]') return null;
      if (href === null) return null;
      return { getAttribute: () => href };
    },
  };
}

describe("prerenderedPath", () => {
  it("reads the path the static document was built for", () => {
    expect(prerenderedPath(documentWithCanonical("https://viikkonro.fi/adventti-2026")))
      .toBe("/adventti-2026");
  });

  it("accepts a root-relative canonical", () => {
    expect(prerenderedPath(documentWithCanonical("/viikko-42-2026"))).toBe("/viikko-42-2026");
  });

  it("returns null when there is no canonical to read", () => {
    expect(prerenderedPath(documentWithCanonical(null))).toBeNull();
  });

  it("returns null rather than throwing on an unparseable canonical", () => {
    expect(prerenderedPath(documentWithCanonical("http://"))).toBeNull();
  });

  it("returns null outside a browser", () => {
    expect(prerenderedPath(undefined)).toBeNull();
  });
});

describe("needsHeadSync", () => {
  const base = {
    path: "/adventti-2026",
    prerendered: "/adventti-2026",
    isInitialRender: true,
    hasExplicitJsonLd: false,
  };

  it("skips the first render of a page prerendered for this path", () => {
    expect(needsHeadSync(base)).toBe(false);
  });

  it("synchronizes a client-side navigation", () => {
    expect(needsHeadSync({ ...base, path: "/viikko-42-2026" })).toBe(true);
  });

  it("synchronizes a route served from another page's document", () => {
    expect(needsHeadSync({ ...base, path: "/viikko-42-2026", prerendered: "/" })).toBe(true);
  });

  it("synchronizes when the prerendered path cannot be established", () => {
    expect(needsHeadSync({ ...base, prerendered: null })).toBe(true);
  });

  // Landing on /adventti-2026, leaving for a week page and coming back must
  // not leave the week page's graph in the head.
  it("synchronizes a later return to the initial path", () => {
    expect(needsHeadSync({ ...base, isInitialRender: false })).toBe(true);
  });

  it("synchronizes a page that supplies its own graph", () => {
    expect(needsHeadSync({ ...base, hasExplicitJsonLd: true })).toBe(true);
  });
});
