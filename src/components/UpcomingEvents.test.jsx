import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import UpcomingEvents from "./UpcomingEvents.jsx";

afterEach(() => {
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
});

const render = () => renderToStaticMarkup(<MemoryRouter><UpcomingEvents /></MemoryRouter>);

describe("UpcomingEvents", () => {
  it("links the next events as plain crawlable anchors", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-11-21";
    const html = render();
    expect(html).toContain("Tulevat juhlapäivät ja pyhät");
    expect(html).toContain('href="/adventti-2026"');
    expect(html).toContain('href="/itsenaisyyspaiva-2026"');
    expect(html).toContain("sunnuntai 29.11.2026, viikko 48");
    expect(html.match(/<li>/g)).toHaveLength(8);
  });
  it("moves on with the render day", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-12-27";
    const html = render();
    expect(html).not.toContain('href="/joulu-2026"');
    expect(html).toContain('href="/uusi-vuosi-2027"');
  });
});
