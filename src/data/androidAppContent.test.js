import { describe, expect, it } from "vitest";
import {
  ANDROID_APP_FACTS,
  ANDROID_APP_FEATURES,
  ANDROID_APP_PATH,
  ANDROID_INSTALL_STEPS,
  ANDROID_WIDGETS,
  androidAppFaqs,
} from "./androidAppContent.js";
import { routeMeta, sitemapEntries } from "./seo.js";

describe("Android app landing content", () => {
  it("publishes the canonical app identity and store URL", () => {
    expect(ANDROID_APP_FACTS.name).toBe("Viikkonro");
    expect(ANDROID_APP_FACTS.packageId).toBe("fi.viikkonro.app");
    expect(ANDROID_APP_FACTS.storeUrl).toBe(
      "https://play.google.com/store/apps/details?id=fi.viikkonro.app",
    );
    expect(ANDROID_APP_FACTS.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(ANDROID_APP_FACTS.languageCodes).toHaveLength(
      ANDROID_APP_FACTS.languageCount,
    );
  });

  it("keeps the visible widget count aligned with the shipped set", () => {
    expect(ANDROID_APP_FACTS.widgetCount).toBe(7);
    expect(ANDROID_WIDGETS).toHaveLength(4);
    expect(ANDROID_WIDGETS.every((widget) => widget.width > 0 && widget.height > 0)).toBe(true);
    expect(androidAppFaqs.find((item) => item.q.includes("widgetejä"))?.a).toContain(
      "seitsemän",
    );
  });

  it("publishes unique metadata and a sitemap entry", () => {
    expect(routeMeta[ANDROID_APP_PATH].title).toContain("Android-sovellus");
    expect(routeMeta[ANDROID_APP_PATH].description).toContain("seitsemän");
    const sitemapMatches = sitemapEntries(2026).filter(
      (entry) => entry.path === ANDROID_APP_PATH,
    );
    expect(sitemapMatches).toEqual([
      { path: ANDROID_APP_PATH, changefreq: "monthly", priority: "0.8" },
    ]);
    expect(ANDROID_APP_FEATURES.length).toBeGreaterThanOrEqual(6);
    expect(ANDROID_INSTALL_STEPS).toHaveLength(4);
  });
});
