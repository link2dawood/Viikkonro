import { describe, expect, it } from "vitest";
import { sitemapCategory, sitemapEntries, isIndexable } from "./seo.js";

describe("sitemapCategory", () => {
  it("categorizes calendar routes under 'calendars'", () => {
    expect(sitemapCategory("/kalenteri-2027")).toBe("calendars");
    expect(sitemapCategory("/vuosi-2026")).toBe("calendars");
    expect(sitemapCategory("/tulostettava-kalenteri-2027")).toBe("calendars");
    expect(sitemapCategory("/tulosta-2026")).toBe("calendars");
    expect(sitemapCategory("/kuukausi-5-2026")).toBe("calendars");
    expect(sitemapCategory("/tyopaivat-2026")).toBe("calendars");
    expect(sitemapCategory("/tyopaivat-tammikuu-2026")).toBe("calendars");
    expect(sitemapCategory("/q1-2026")).toBe("calendars");
  });

  it("categorizes week routes under 'weeks'", () => {
    expect(sitemapCategory("/viikko-1-2026")).toBe("weeks");
    expect(sitemapCategory("/viikko-53-2026")).toBe("weeks");
  });

  it("categorizes holiday and observance routes under 'holidays'", () => {
    expect(sitemapCategory("/pyhat-2026/vappu")).toBe("holidays");
    expect(sitemapCategory("/pyhapaivat-2026")).toBe("holidays");
    expect(sitemapCategory("/liputuspaivat-2026")).toBe("holidays");
    expect(sitemapCategory("/koululomat-2026")).toBe("holidays");
    expect(sitemapCategory("/palkkapaivat-2026")).toBe("holidays");
    expect(sitemapCategory("/kelan-maksupaivat-2026")).toBe("holidays");
    expect(sitemapCategory("/elakkeen-maksupaivat-2026")).toBe("holidays");
    expect(sitemapCategory("/kuun-vaiheet-2026")).toBe("holidays");
    expect(sitemapCategory("/kesaaika-2026")).toBe("holidays");
    expect(sitemapCategory("/itsenaisyyspaiva-2026")).toBe("holidays");
    expect(sitemapCategory("/joulu-2026")).toBe("holidays");
    expect(sitemapCategory("/isanpaiva-2026")).toBe("holidays");
    expect(sitemapCategory("/aitienpaiva-2026")).toBe("holidays");
  });

  it("categorizes tools, calculators, and non-year routes under 'tools'", () => {
    expect(sitemapCategory("/")).toBe("tools");
    expect(sitemapCategory("/tuntilaskuri")).toBe("tools");
    expect(sitemapCategory("/ikalaskuri")).toBe("tools");
    expect(sitemapCategory("/vuosilomalaskuri")).toBe("tools");
    expect(sitemapCategory("/kuinka-monta-viikkoa-vuodessa")).toBe("tools");
    expect(sitemapCategory("/mika-vuosi-nyt")).toBe("tools");
    expect(sitemapCategory("/ukk")).toBe("tools");
    expect(sitemapCategory("/nimipaivat/01-01")).toBe("tools");
    expect(sitemapCategory("/nimipaiva/aino")).toBe("tools");
    expect(sitemapCategory("/yrityskalenteri")).toBe("tools");
    expect(sitemapCategory("/lomasuunnittelija")).toBe("tools");
  });

  it("assigns all indexable sitemap entries to one of the 4 categories without any unclassified entries", () => {
    const entries = sitemapEntries(2026).filter((e) => isIndexable(e.path));
    const validCategories = new Set(["calendars", "weeks", "holidays", "tools"]);
    for (const e of entries) {
      const cat = sitemapCategory(e.path);
      expect(validCategories.has(cat)).toBe(true);
    }
  });
});
