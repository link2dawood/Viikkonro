import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock AdSlot so we can inspect its placement and props deterministically in SSR tests
vi.mock("../components/AdSlot", () => ({
  default: ({ placement, format = "banner" }) => (
    <aside data-testid="mock-ad-slot" data-ad-placement={placement} data-ad-format={format} />
  ),
}));

import SchoolHolidays from "./SchoolHolidays.jsx";
import NamedHoliday from "./NamedHoliday.jsx";
import PublicHolidays from "./PublicHolidays.jsx";
import AnnualLeave from "./AnnualLeave.jsx";

const renderWithRouter = (element) =>
  renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter>{element}</MemoryRouter>
    </HelmetProvider>,
  );

describe("High-dwell planning ad placements", () => {
  it("SchoolHolidays mounts school-holidays-after-summary ad slot", () => {
    const html = renderWithRouter(<SchoolHolidays year={2027} />);
    expect(html).toContain('data-ad-placement="school-holidays-after-summary"');
    expect(html).toContain('data-testid="mock-ad-slot"');
    // Ensure ad slot is placed before the winter holiday section
    const adIndex = html.indexOf('data-ad-placement="school-holidays-after-summary"');
    const winterH2Index = html.indexOf("Milloin hiihtoloma 2027 on?");
    expect(adIndex).toBeGreaterThan(0);
    expect(winterH2Index).toBeGreaterThan(adIndex);
  });

  it("NamedHoliday mounts holiday-after-facts ad slot", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/pyhat-2027/helatorstai"]}>
          <Routes>
            <Route path="/:holidayYear/:holidaySlug" element={<NamedHoliday />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain('data-ad-placement="holiday-after-facts"');
    const adIndex = html.indexOf('data-ad-placement="holiday-after-facts"');
    const h2Index = html.indexOf("Milloin helatorstai on vuonna 2027?");
    expect(adIndex).toBeGreaterThan(0);
    expect(h2Index).toBeGreaterThan(adIndex);
  });

  it("PublicHolidays mounts public-holidays-after-summary ad slot", () => {
    const html = renderWithRouter(<PublicHolidays year={2027} />);
    expect(html).toContain('data-ad-placement="public-holidays-after-summary"');
    const adIndex = html.indexOf('data-ad-placement="public-holidays-after-summary"');
    const tableIndex = html.indexOf("<table");
    expect(adIndex).toBeGreaterThan(0);
    expect(tableIndex).toBeGreaterThan(adIndex);
  });

  it("AnnualLeave mounts annual-leave-after-calc ad slot", () => {
    const html = renderWithRouter(<AnnualLeave />);
    expect(html).toContain('data-ad-placement="annual-leave-after-calc"');
    const adIndex = html.indexOf('data-ad-placement="annual-leave-after-calc"');
    const h2Index = html.indexOf("Näin käytät vuosilomalaskuria");
    expect(adIndex).toBeGreaterThan(0);
    expect(h2Index).toBeGreaterThan(adIndex);
  });
});
