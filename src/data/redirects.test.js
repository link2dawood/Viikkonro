import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { sitemapEntries } from "./seo.js";

const vercel = JSON.parse(
  fs.readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"),
);
const redirects = new Map(
  vercel.redirects.map((rule) => [rule.source, rule]),
);

const requiredRedirects = [
  ["/week/:week/:year", "/viikko-:week-:year"],
  ["/month/:month/:year", "/kuukausi-:month-:year"],
  ["/year/:year", "/vuosi-:year"],
  ["/print/:year", "/tulosta-:year"],
  ["/pdfs/:file", "/pdf/:file"],
  ["/kalenteri-:y(\\d+)-1", "/kalenteri-:y-alkuvuosi"],
  ["/kalenteri-:y(\\d+)-2", "/kalenteri-:y-loppuvuosi"],
];

describe("legacy URL consolidation", () => {
  it.each(requiredRedirects)("keeps %s as a permanent single-hop redirect", (source, destination) => {
    expect(redirects.get(source)).toMatchObject({
      destination,
      statusCode: 301,
    });
    expect(redirects.has(destination)).toBe(false);
  });

  it("publishes only canonical route families in the generated inventory", () => {
    const paths = sitemapEntries(2026).map((entry) => entry.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(
      paths.filter(
        (path) =>
          /^\/(?:year|week|month)\//.test(path) ||
          /^\/kalenteri-\d+-(?:1|2)$/.test(path),
      ),
    ).toEqual([]);
  });
});
