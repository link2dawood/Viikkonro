import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import SunCity from "./SunCity.jsx";
import { SUN_CITIES, sunCityMeta } from "../data/sunCities.js";

afterEach(() => vi.useRealTimers());

function upcomingTable(slug, day) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${day}T12:00:00Z`));
  const html = renderToStaticMarkup(<HelmetProvider><MemoryRouter><SunCity slug={slug} /></MemoryRouter></HelmetProvider>);
  return html.match(/<table[\s\S]*?<\/table>/)[0];
}

describe("crawlable seven-day solar times", () => {
  it("includes seven consecutive dates across New Year", () => {
    const html = upcomingTable("helsinki", "2026-12-29");
    expect((html.match(/<tr>/g) || [])).toHaveLength(8);
    expect(html).toContain("29. joulukuuta 2026");
    expect(html).toContain("4. tammikuuta 2027");
    expect(html).not.toMatch(/Invalid Date|NaN/);
  });

  it("handles polar night without printing invalid clock times", () => {
    const html = upcomingTable("utsjoki", "2026-12-20");
    expect(html).toContain("ei nouse");
    expect(html).not.toMatch(/Invalid Date|NaN/);
  });

  it("keeps every city title within the existing title budget", () => {
    for (const city of SUN_CITIES) {
      const meta = sunCityMeta(city.slug, new Date(2026, 9, 5));
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.title).toContain("tänään");
    }
  });
});
