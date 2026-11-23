import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import UpcomingCalendarPromo from "./UpcomingCalendarPromo.jsx";
import MoonPhases from "../pages/MoonPhases.jsx";

// The prerendered day travels in globalThis.__VIIKKONRO_RENDER_DAY__, the same
// value prerender.js renders with, so the promoted year is deterministic here.
const renderOn = (day, node) => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = day;
  return renderToStaticMarkup(
    <HelmetProvider><MemoryRouter>{node}</MemoryRouter></HelmetProvider>,
  );
};

afterEach(() => {
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
});

describe("UpcomingCalendarPromo", () => {
  it("promotes the upcoming calendar year from 1 October", () => {
    const html = renderOn("2026-11-21", <UpcomingCalendarPromo />);
    expect(html).toContain('href="/tulostettava-kalenteri-2027"');
    expect(html).toContain('href="/kalenteri-2027"');
    expect(html).toContain("Tulostettava kalenteri 2027 (PDF)");
    expect(html).not.toMatch(/NaN|Invalid Date|undefined/);
  });

  it("stays on the current year before the October rollover", () => {
    const html = renderOn("2026-06-15", <UpcomingCalendarPromo />);
    expect(html).toContain('href="/tulostettava-kalenteri-2026"');
    expect(html).toContain('href="/kalenteri-2026"');
    expect(html).not.toContain("-2027");
  });

  // The block ships on five page families at once. If its anchors claimed
  // "viikkokalenteri <year>" they would compete with /vuosi-{year}, which owns
  // that token, from every one of them: the opposite of what it is for.
  it("never claims the token /vuosi-{year} owns", () => {
    for (const day of ["2026-11-21", "2026-06-15"]) {
      expect(renderOn(day, <UpcomingCalendarPromo />)).not.toContain("viikkokalenteri");
    }
  });

  it("reaches a real host page", () => {
    const html = renderOn("2026-11-21", <MoonPhases year={2026} />);
    expect(html).toContain('href="/tulostettava-kalenteri-2027"');
    expect(html).toContain('href="/kalenteri-2027"');
  });
});
