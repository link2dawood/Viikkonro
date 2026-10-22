import fs from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

const pdfRules = config.headers.filter((rule) => rule.source.startsWith("/pdf/"));

describe("PDF indexing response headers", () => {
  // Superseded the per-family rel="canonical" Link headers. PDFs are generated
  // across the full 2020..currentYear+9 horizon, but isIndexable() in
  // prerender.js narrows week pages to currentYear..currentYear+1 and other
  // dated pages to currentYear-2..currentYear+4. A canonical to an
  // out-of-window page therefore pointed at a noindex document for ~81% of
  // generated PDFs, which is a conflicting signal Google reports forever as
  // "Alternate page with proper canonical tag" and never resolves on
  // revalidation. A single noindex expresses the same intent (the HTML page
  // ranks, never the PDF) for every PDF, with no rolling-year logic to drift.
  it("declares noindex and no canonical for every PDF", () => {
    const canonicalRules = pdfRules.filter((rule) =>
      rule.headers.some((header) => header.key === "Link" && header.value.includes('rel="canonical"')),
    );
    expect(canonicalRules).toEqual([]);

    const pdfRule = pdfRules.find((rule) => rule.source === "/pdf/(.*)");
    expect(pdfRule.headers).toContainEqual({ key: "Content-Type", value: "application/pdf" });
    expect(pdfRule.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex" });
  });

  // Rule 5 of the SEO constitution still requires PDFs to be reachable: the
  // visible download link, the associatedMedia/DownloadAction schema and the
  // <link rel="alternate"> pointer are unchanged, so noindex must stay bare.
  // "noindex, nofollow" or a 404 would break that discoverability contract.
  it("keeps PDFs crawlable and directly downloadable", () => {
    const pdfRule = pdfRules.find((rule) => rule.source === "/pdf/(.*)");
    const robots = pdfRule.headers.find((header) => header.key === "X-Robots-Tag").value;
    expect(robots).not.toContain("nofollow");
    expect(robots).not.toContain("noarchive");
    expect(config.redirects.some((redirect) => redirect.source.startsWith("/pdf/"))).toBe(false);
  });

  // Every downloadable asset family follows the same policy: crawlable, bare
  // noindex, no canonical. Search Console was reporting the ICS feeds and the
  // /pohjat/ template exports under "Crawled - currently not indexed" because
  // they were indexable assets competing for index slots they can never win.
  // /pohjat/ replaced a per-PDF canonical to /kalenteripohjat/:slug; that
  // target is always indexable so it was never the out-of-window conflict, but
  // noindex plus canonical on one response is a conflict of its own.
  it.each(["/pdf/(.*)", "/ics/(.*)", "/pohjat/(.*)"])(
    "serves %s as a crawlable noindex download",
    (source) => {
      const rule = config.headers.find((candidate) => candidate.source === source);
      expect(rule, `${source} header rule is missing`).toBeTruthy();
      expect(rule.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex" });
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

  // The machine-readable directory listings are noindex, but the data feeds
  // themselves stay indexable on purpose: they are the open-data product and
  // /avoin-data documents them. "/data/(.*)/index.json" does not match the
  // top-level listing, which is why it needs its own rule.
  it("noindexes every data directory listing including the top level", () => {
    for (const source of ["/data/(.*)/index.json", "/data/index.json"]) {
      const rule = config.headers.find((candidate) => candidate.source === source);
      expect(rule, `${source} header rule is missing`).toBeTruthy();
      expect(rule.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, follow" });
    }
  });
});
