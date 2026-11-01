import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import DateToWeek from "./DateToWeek.jsx";
import { computeDateToWeek } from "../data/dateToWeek.js";

describe("DateToWeek component", () => {
  it("renders week number and links week page within the published horizon", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <DateToWeek initialDate="2026-06-01" />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(html).toContain("1. kesäkuuta 2026");
    expect(html).toContain("viikolla 23");
    expect(html).toContain('href="/viikko-23-2026"');
  });

  it("does not render a dead week-page link beyond the published horizon", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <DateToWeek initialDate="2036-06-01" />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(html).toContain("1. kesäkuuta 2036");
    expect(html).toContain("viikolla 22");
    expect(html).toContain("Viikko 22/2036");
    expect(html).not.toContain('href="/viikko-22-2036"');
  });

  it("rejects two-digit years (0001-0099) without mapping them into 1900s", () => {
    expect(computeDateToWeek("0099-01-04")).toBeNull();
    expect(computeDateToWeek("0001-01-01")).toBeNull();

    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <DateToWeek initialDate="0099-01-04" />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(html).not.toContain("1999");
    expect(html).not.toContain("viikolla");
  });
});
