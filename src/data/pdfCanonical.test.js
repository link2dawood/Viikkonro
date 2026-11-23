import fs from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

const pdfRules = config.headers.filter((rule) => rule.source.startsWith("/pdf/"));

// Site-wide no-noindex policy (user-approved 2026-11-23, see docs/noindex.md):
// no page, document or downloadable asset family carries a robots directive
// any more. These cases now guard the inverse of the earlier contract, so a
// reintroduced X-Robots-Tag fails here instead of landing silently. The
// canonical-free rule is unchanged: asset responses still declare no
// rel="canonical" Link header, so the HTML page remains the citable source
// through its visible download link, schema and rel="alternate" pointer.
describe("PDF indexing response headers", () => {
  it("declares no robots directive and no canonical for every PDF", () => {
    const canonicalRules = pdfRules.filter((rule) =>
      rule.headers.some((header) => header.key === "Link" && header.value.includes('rel="canonical"')),
    );
    expect(canonicalRules).toEqual([]);

    const pdfRule = pdfRules.find((rule) => rule.source === "/pdf/(.*)");
    expect(pdfRule.headers).toContainEqual({ key: "Content-Type", value: "application/pdf" });
    expect(pdfRule.headers.some((header) => header.key === "X-Robots-Tag")).toBe(false);
  });

  it("keeps PDFs crawlable and directly downloadable", () => {
    const pdfRule = pdfRules.find((rule) => rule.source === "/pdf/(.*)");
    expect(JSON.stringify(pdfRule.headers)).not.toContain("nofollow");
    expect(JSON.stringify(pdfRule.headers)).not.toContain("noarchive");
    expect(config.redirects.some((redirect) => redirect.source.startsWith("/pdf/"))).toBe(false);
  });

  it.each(["/pdf/(.*)", "/ics/(.*)"])(
    "serves %s as a crawlable, indexable download",
    (source) => {
      const rule = config.headers.find((candidate) => candidate.source === source);
      expect(rule, `${source} header rule is missing`).toBeTruthy();
      expect(rule.headers.some((header) => header.key === "X-Robots-Tag")).toBe(false);
      expect(JSON.stringify(rule.headers)).not.toContain("canonical");
      expect(JSON.stringify(rule.headers)).not.toContain("nofollow");
    },
  );

  it("declares no canonical for any asset family", () => {
    const assetCanonicals = config.headers
      .filter((rule) => /^\/(pdf|ics|pohjat)\//.test(rule.source))
      .filter((rule) =>
        rule.headers.some((header) => header.key === "Link" && header.value.includes('rel="canonical"')),
      )
      .map((rule) => rule.source);
    expect(assetCanonicals).toEqual([]);
  });

  it("leaves no robots directive outside the two approved exceptions", () => {
    // Approved exceptions (2026-11-23, see docs/noindex.md): the auth-gated
    // private app, whose shell has nothing to index, and the JSON API
    // endpoints, which are POST responses rather than pages. Any other
    // source appearing here means a noindex was reintroduced without a
    // registry row.
    const allowed = ["/api/newsletter", "/api/asset-404", "/tiimin-lomat/suunnittelu"];
    const withRobots = config.headers
      .filter((rule) => rule.headers.some((header) => header.key === "X-Robots-Tag"))
      .map((rule) => rule.source)
      .filter((source) => !allowed.includes(source));
    expect(withRobots).toEqual([]);

    const privateRule = config.headers.find((rule) => rule.source === "/tiimin-lomat/suunnittelu");
    expect(privateRule.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" });
  });
});
