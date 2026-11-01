import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import DateCalculator from "./DateCalculator.jsx";

describe("DateCalculator component", () => {
  it("renders week link when the resulting week is within the published horizon", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <DateCalculator initialStart="2026-10-30" initialAmount="1" initialUnit="paivaa" initialDirection={1} />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(html).toContain('href="/viikko-44-2026"');
  });

  it("renders week as plain text without a dead link beyond the published horizon", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <DateCalculator initialStart="2035-12-31" initialAmount="1" initialUnit="paivaa" initialDirection={1} />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(html).toContain("1. tammikuuta 2036");
    expect(html).toContain("viikko 1");
    expect(html).not.toContain('href="/viikko-1-2036"');
  });
});
