import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WeekDays from "./WeekDays.jsx";

function renderWeek(week, year) {
  return renderToStaticMarkup(
    <HelmetProvider><MemoryRouter><WeekDays week={week} year={year} /></MemoryRouter></HelmetProvider>,
  );
}

describe("week-page growth links", () => {
  it("renders a seven-link same-week block and parity badge", () => {
    const html = renderWeek(42, 2028);
    const block = html.match(/<h2>Viikko 42 muina vuosina<\/h2>[\s\S]*?<\/section>/)?.[0] || "";
    expect((block.match(/href="\/viikko-42-/g) || [])).toHaveLength(7);
    expect(block).not.toContain('href="/viikko-42-2028"');
    expect(html).toContain('href="/parillinen-pariton-viikko"');
    expect(html).toContain('href="/koululomat-2028"');
  });

  it("does not generate invalid week-53 links", () => {
    const html = renderWeek(53, 2026);
    for (const match of html.matchAll(/href="\/viikko-53-(\d{4})"/g)) {
      expect([2020, 2026, 2032]).toContain(Number(match[1]));
    }
    expect(html).not.toMatch(/NaN|undefined|viikko-54/);
  });
});
