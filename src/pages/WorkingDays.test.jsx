import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import WorkingDays from "./WorkingDays.jsx";
import { calculateDaysBetween } from "../data/workingDaysContent.js";

describe("yearly working-day editorial summary", () => {
  it("renders computed workday and Kela-day statistics", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><WorkingDays year={2026} /></MemoryRouter></HelmetProvider>,
    );
    const kela = calculateDaysBetween("2026-01-01", "2026-12-31", "kela");
    expect(html).toContain("Työpäivien määrä vuonna 2026");
    expect(html).toContain(`<strong>${kela.working} arkipäivää</strong>`);
    expect(html).toContain("Työpäivä, Kelan arkipäivä ja TES");
    expect(html).toContain('href="/tyopaivalaskuri"');
    expect(html).not.toMatch(/NaN|undefined/);
  });
});
