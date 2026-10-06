import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import SchoolHolidays from "./SchoolHolidays.jsx";
import { schoolHolidayFaqs } from "../data/schoolHolidayPages.js";

describe("2028 school-holiday page", () => {
  it("renders only sourced city dates and labels the unknown coverage", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><SchoolHolidays year={2028} /></MemoryRouter></HelmetProvider>,
    );
    expect((html.match(/<h1/g) || [])).toHaveLength(1);
    expect(html).toContain("Koululomat 2028");
    expect(html).toContain("Helsingin kaupunki");
    expect(html).toContain("Turun kaupunki");
    expect(html).toContain("Joensuun kaupunki");
    expect(html).toContain("Ei vielä julkaistua ajankohtaa");
    expect(html).not.toMatch(/NaN|Invalid Date|undefined/);
  });

  it("renders every FAQ from the shared schema source exactly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><SchoolHolidays year={2028} /></MemoryRouter></HelmetProvider>,
    );
    for (const item of schoolHolidayFaqs(2028)) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
  });
});
