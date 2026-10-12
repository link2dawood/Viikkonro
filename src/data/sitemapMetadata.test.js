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
    expect(sitemapLastmod("/tietosuoja", "2026-10-08")).toBe("2026-10-07");
    expect(sitemapLastmod("/tietosuoja", "2026-10-12")).toBe("2026-10-12");
    expect(sitemapLastmod("/palautusehdot", "2026-10-12")).toBe("2026-10-12");
  });

  it("does not invent year-end or build dates for untracked resources", () => {
    for (const path of [
      "/pyhat-2020/joulu", "/kuukausi-1-2024", "/kalenteri-2027-alkuvuosi",
      "/pdf/kalenteri-2027.pdf", "/pdf/viikko-42-2026.pdf",
      "/pdf/kuukausi-10-2026.pdf",
    ]) expect(sitemapLastmod(path, "2026-10-06")).toBeNull();
  });

  it("records the Vappu editorial update without making it a daily or future date", () => {
    expect(sitemapLastmod("/pyhat-2027/vappu", "2026-10-11")).toBe("2026-10-11");
    expect(sitemapLastmod("/pyhat-2027/vappu", "2026-10-12")).toBe("2026-10-12");
    expect(sitemapLastmod("/pyhat-2027/vappu", "2026-10-20")).toBe("2026-10-12");
    expect(sitemapLastmod("/pyhat-2027/loppiainen", "2026-10-20")).toBe("2026-10-11");
  });
});
