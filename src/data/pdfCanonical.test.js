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

  // The template downloads are a separate family under /pohjat/ whose canonical
  // target (/kalenteripohjat/:slug) is a static, always-indexable page, so it
  // never had the out-of-window conflict and keeps its canonical header.
  it("leaves the template PDF canonical mapping intact", () => {
    const templateRule = config.headers.find((rule) => rule.source === "/pohjat/:slug/:year.pdf");
    expect(templateRule.headers).toContainEqual({
      key: "Link",
      value: '<https://viikkonro.fi/kalenteripohjat/:slug>; rel="canonical"',
    });
  });
});
