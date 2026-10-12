import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PurchaseSteps from "./PurchaseSteps.jsx";

describe("buyer instructions", () => {
  it.each([2026, 2027, 2028])("explains the selected year %s without promising a subscription or draft recovery", year => {
    const html = renderToStaticMarkup(<PurchaseSteps year={year} />);
    expect(html.match(/<li>/g)).toHaveLength(4);
    expect(html).toContain(`vuoden ${year} loppuun`);
    expect(html).toContain("ei jatkuva tilaus");
    expect(html).toContain("ei kalenterin sisältöä");
    expect(html).toContain("Tarkista maksu");
    expect(html).toContain("PDF-, Excel-, CSV- ja ICS");
  });
});
