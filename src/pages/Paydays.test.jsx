import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import Paydays from "./Paydays.jsx";

describe("payday week links at the prerender horizon", () => {
  it("renders an out-of-range ISO week as text instead of a 404 link", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider><MemoryRouter><Paydays year={2035} /></MemoryRouter></HelmetProvider>,
    );
    expect(html).not.toContain('href="/viikko-1-2036"');
    expect(html).toContain("31.12.2035");
    expect(html).not.toMatch(/NaN|Invalid Date|undefined/);
  });
});
