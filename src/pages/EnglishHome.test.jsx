import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import EnglishHome from "./EnglishHome.jsx";
import { englishWeekFacts, englishMeta } from "../data/englishContent.js";

describe("English landing page links", () => {
  const originalRenderDay = globalThis.__VIIKKONRO_RENDER_DAY__;
  afterEach(() => {
    vi.useRealTimers();
    if (originalRenderDay === undefined) delete globalThis.__VIIKKONRO_RENDER_DAY__;
    else globalThis.__VIIKKONRO_RENDER_DAY__ = originalRenderDay;
  });
  it("remains indexed and links into the useful Finnish site structure", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><EnglishHome /></MemoryRouter></HelmetProvider>,
    );
    const internalLinks = [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
    expect(new Set(internalLinks).size).toBeGreaterThanOrEqual(4);
    expect(internalLinks).toContain("/");
    expect(internalLinks).toContain("/viikko-41-2026");
    expect(internalLinks).toContain("/vuosi-2026");
    expect(internalLinks).toContain("/kalenteri-2026");
    expect(html).not.toContain('name="robots" content="noindex');
  });
  it("keeps prerendered text and metadata on the render day before switching to the live Helsinki week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-11T21:30:00Z")); // Monday in Helsinki, Sunday in UTC.
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-11";
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><EnglishHome /></MemoryRouter></HelmetProvider>,
    );
    expect(html).toContain("The current week number is 41 of 2026");
    expect(html).toContain("5 October 2026");
    expect(englishMeta().title).toContain("Week 41 of 2026");
    delete globalThis.__VIIKKONRO_RENDER_DAY__;
    expect(englishWeekFacts().week).toBe(42);
    expect(englishMeta().title).toContain("Week 42 of 2026");
  });
});
