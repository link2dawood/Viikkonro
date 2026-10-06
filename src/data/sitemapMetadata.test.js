import { describe, expect, it } from "vitest";
import { sitemapLastmod } from "./sitemapMetadata.js";

describe("sitemap content modification dates", () => {
  it("refreshes daily answers but preserves reviewed content dates", () => {
    expect(sitemapLastmod("/", "2026-10-06")).toBe("2026-10-06");
    expect(sitemapLastmod("/auringonlasku-helsinki", "2026-10-06")).toBe("2026-10-06");
    expect(sitemapLastmod("/tyopaivalaskuri", "2026-10-06")).toBe("2026-10-05");
    expect(sitemapLastmod("/viikko-42-2024", "2026-10-06")).toBe("2026-10-05");
    expect(sitemapLastmod("/ukk", "2026-10-06")).toBe("2026-10-06");
    expect(sitemapLastmod("/parillinen-pariton-viikko", "2026-10-06")).toBe("2026-10-06");
    expect(sitemapLastmod("/koululomat-2028", "2026-10-06")).toBe("2026-10-05");
  });

  it("does not invent year-end or build dates for untracked resources", () => {
    for (const path of [
      "/pyhat-2020/joulu", "/kuukausi-1-2024", "/kalenteri-2027-alkuvuosi",
      "/pdf/kalenteri-2027.pdf", "/pdf/viikko-42-2026.pdf",
      "/pdf/kuukausi-10-2026.pdf", "/tietosuoja",
    ]) expect(sitemapLastmod(path, "2026-10-06")).toBeNull();
  });
});
