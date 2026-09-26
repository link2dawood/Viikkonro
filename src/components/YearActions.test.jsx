import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import YearActions from "./YearActions.jsx";
import { PRERENDER_MAX_YEAR } from "./dateUtils.js";
import { CONFIDENCE, pageConfidenceTier, schoolHolidayYears } from "../data/schoolHolidayPages.js";

const render = (props) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <YearActions {...props} />
    </MemoryRouter>,
  );

describe("YearActions", () => {
  it("links the year's PDF and the related year pages", () => {
    const html = render({ year: 2026, view: "vuosi" });
    expect(html).toContain('href="/pdf/kalenteri-2026.pdf"');
    expect(html).toContain("download");
    expect(html).toContain('href="/kalenteri-2026"');
    expect(html).toContain('href="/tyopaivat-2026"');
    expect(html).toContain('href="/pyhapaivat-2026"');
    expect(html).toContain('href="/vuosi-2027"');
  });

  it("keeps next-year links inside the calendar family on calendar pages", () => {
    const html = render({ year: 2026, view: "kalenteri" });
    expect(html).toContain('href="/kalenteri-2027"');
    expect(html).toContain('href="/vuosi-2026"');
    expect(html).not.toContain('href="/vuosi-2027"');
  });

  it("links school holidays only for confirmed years", () => {
    for (const y of [2025, 2026, 2027, 2028, 2030]) {
      const confirmed = schoolHolidayYears.includes(y) && pageConfidenceTier(y) === CONFIDENCE.CONFIRMED;
      expect(render({ year: y, view: "vuosi" }).includes(`href="/koululomat-${y}"`)).toBe(confirmed);
    }
  });

  it("has no next-year link at the end of the published range", () => {
    const html = render({ year: PRERENDER_MAX_YEAR, view: "vuosi" });
    expect(html).not.toContain(`/vuosi-${PRERENDER_MAX_YEAR + 1}`);
  });

  it("can omit the download button", () => {
    const html = render({ year: 2026, view: "kalenteri", download: false });
    expect(html).not.toContain(".pdf");
    expect(html).toContain('href="/tyopaivat-2026"');
  });
});
