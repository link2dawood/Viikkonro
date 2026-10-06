import fs from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

describe("PDF canonical response headers", () => {
  it("maps each generated PDF family to its HTML page", () => {
    const canonicalRules = config.headers
      .filter((rule) => rule.source.startsWith("/pdf/") && rule.headers.some((header) => header.key === "Link"))
      .map((rule) => [rule.source, rule.headers.find((header) => header.key === "Link").value]);

    expect(canonicalRules).toEqual([
      ["/pdf/kalenteri-:year(\\d{4}).pdf", '<https://viikkonro.fi/kalenteri-:year>; rel="canonical"'],
      ["/pdf/viikko-:week(\\d{1,2})-:year(\\d{4}).pdf", '<https://viikkonro.fi/viikko-:week-:year>; rel="canonical"'],
      ["/pdf/kuukausi-:month(\\d{1,2})-:year(\\d{4}).pdf", '<https://viikkonro.fi/kuukausi-:month-:year>; rel="canonical"'],
    ]);
  });

  it("keeps PDFs crawlable and served as PDF files", () => {
    const pdfRule = config.headers.find((rule) => rule.source === "/pdf/(.*)");
    expect(pdfRule.headers).toContainEqual({ key: "Content-Type", value: "application/pdf" });
    expect(JSON.stringify(pdfRule)).not.toContain("X-Robots-Tag");
  });
});
