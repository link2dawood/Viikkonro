import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WhatWeek from "./WhatWeek.jsx";

describe("viikkonumero explainer targeting", () => {
  it("renders the current-year and Finnish-use headings with the feature table", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-06";
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><WhatWeek /></MemoryRouter></HelmetProvider>,
    );
    expect(html).toContain("<h2>Viikkonumero 2026</h2>");
    expect(html).toContain("<h2>Viikkonumerot Suomessa</h2>");
    expect(html).toContain("Mitä Viikkonro.fi näyttää?");
    expect(html).toContain('href="/parillinen-pariton-viikko"');
    expect((html.match(/<h1/g) || [])).toHaveLength(1);
    delete globalThis.__VIIKKONRO_RENDER_DAY__;
  });
});
