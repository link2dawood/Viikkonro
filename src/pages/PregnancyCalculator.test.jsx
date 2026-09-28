import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PregnancyDetails } from "./PregnancyCalculator.jsx";
import { pregnancyReport } from "../data/pregnancyCalculator.js";

const today = new Date(2026, 8, 29);

describe("PregnancyDetails", () => {
  it("lists the key dates and the week calendar within a pregnancy", () => {
    const html = renderToStaticMarkup(<PregnancyDetails r={pregnancyReport({ lmp: new Date(2026, 6, 1) }, today)} />);
    expect(html).toContain("Raskausrahaa voi hakea");
    expect(html).toContain("rv 42");
  });

  // Regression: an out-of-range report has no milestones, and rendering them
  // threw and blanked the whole page (found by a browser test on the live site).
  it("renders nothing, without throwing, for a date outside the pregnancy", () => {
    const pastDue = pregnancyReport({ due: new Date(2026, 5, 1) }, today);
    const futureLmp = pregnancyReport({ lmp: new Date(2026, 11, 1) }, today);
    expect(pastDue.outOfRange).toBe(true);
    expect(futureLmp.outOfRange).toBe(true);
    expect(renderToStaticMarkup(<PregnancyDetails r={pastDue} />)).toBe("");
    expect(renderToStaticMarkup(<PregnancyDetails r={futureLmp} />)).toBe("");
    expect(renderToStaticMarkup(<PregnancyDetails r={null} />)).toBe("");
  });
});
