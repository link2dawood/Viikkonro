import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer.jsx";
import Navbar from "./Navbar.jsx";

function renderChrome(pathname) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-31T12:00:00Z"));
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <Navbar />
      <Footer />
    </MemoryRouter>,
  );
}

afterEach(() => vi.useRealTimers());

describe("English page chrome", () => {
  it("renders English navigation and footer on /en", () => {
    const html = renderChrome("/en");

    expect(html).toContain("Open navigation menu");
    expect(html).toContain("English home");
    expect(html).toContain("All weeks 2026 (Finnish)");
    expect(html).toContain("Calendar 2026 (Finnish)");
    expect(html).toContain("Follow us");
    expect(html).toContain("All rights reserved.");
    expect(html).toContain("Based on the international ISO 8601 standard");
    expect(html).toContain('hrefLang="fi"');

    expect(html).not.toContain("Avaa navigointivalikko");
    expect(html).not.toContain(">Palvelu<");
    expect(html).not.toContain(">Yritys<");
    expect(html).not.toContain("Kaikki oikeudet pidätetään");
  });

  it("preserves Finnish chrome outside /en", () => {
    const html = renderChrome("/");

    expect(html).toContain("Avaa navigointivalikko");
    expect(html).toContain(">Palvelu<");
    expect(html).toContain(">Yritys<");
    expect(html).toContain("Kaikki oikeudet pidätetään");
    expect(html).not.toContain("All rights reserved.");
  });
});
