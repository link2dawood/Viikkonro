import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import ChristmasHoliday from "./ChristmasHoliday.jsx";

const render = (year) =>
  renderToStaticMarkup(<MemoryRouter><ChristmasHoliday year={year} /></MemoryRouter>);

describe("ChristmasHoliday related links", () => {
  it("links the school Christmas break only where that page exists", () => {
    expect(render(2026)).toContain('href="/joululoma-2026"');
    for (const year of [2024, 2029, 2030]) {
      expect(render(year)).not.toContain(`/joululoma-${year}`);
    }
  });
});
