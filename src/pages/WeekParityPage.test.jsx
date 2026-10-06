import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WeekParityPage from "./WeekParityPage.jsx";
import { parityMeta, parityPageFaqs, parityWeeks } from "../data/weekParity.js";

afterEach(() => {
  vi.useRealTimers();
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
});

function renderPage(day) {
  globalThis.__VIIKKONRO_RENDER_DAY__ = day;
  return renderToStaticMarkup(
    <HelmetProvider><MemoryRouter><WeekParityPage /></MemoryRouter></HelmetProvider>,
  );
}

describe("parity landing page", () => {
  it("prerenders one direct answer, both year lists and the rollover caveat", () => {
    const html = renderPage("2027-01-01");
    expect((html.match(/<h1/g) || [])).toHaveLength(1);
    expect(html).toContain("Nyt on <strong>pariton viikko</strong>");
    expect(html).toContain('href="/viikko-53-2026"');
    expect(html).toContain('href="/viikko-1-2027"');
    expect(html).toContain("viikot 53 ja 1 voivat olla peräkkäin parittomia");
    expect(html).not.toMatch(/NaN|undefined|viikko-54/);
  });

  it("renders every visible FAQ from the shared schema source", () => {
    const day = new Date(2026, 9, 6);
    const html = renderPage("2026-10-06");
    for (const item of parityPageFaqs(day)) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
  });

  it("keeps year totals and metadata within their budgets", () => {
    expect(parityWeeks(2026)).toMatchObject({ even: { length: 26 }, odd: { length: 27 } });
    expect(parityWeeks(2027)).toMatchObject({ even: { length: 26 }, odd: { length: 26 } });
    const meta = parityMeta(new Date(2026, 9, 6));
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });
});
