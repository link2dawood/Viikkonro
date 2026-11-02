import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdSlot from "./AdSlot.jsx";

describe("AdSlot component", () => {
  it("renders null on SSR without VITE_AD_LAYOUT_PREVIEW to keep static HTML ad-free (PD-19)", () => {
    const html = renderToStaticMarkup(<AdSlot placement="test-slot" />);
    expect(html).toBe("");
    expect(html).not.toContain("adsbygoogle");
    expect(html).not.toContain("<ins");
  });
});
