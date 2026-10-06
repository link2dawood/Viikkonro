import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import EnglishHome from "./EnglishHome.jsx";

describe("English landing page links", () => {
  it("remains indexed and links into the useful Finnish site structure", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-06";
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
    delete globalThis.__VIIKKONRO_RENDER_DAY__;
  });
});
