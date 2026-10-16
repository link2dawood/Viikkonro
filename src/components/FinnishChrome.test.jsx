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

describe("Finnish page chrome", () => {
  it("preserves Finnish chrome outside /en", () => {
    const html = renderChrome("/");

    expect(html).toContain("Avaa navigointivalikko");
    expect(html).toContain(">Palvelu<");
    expect(html).toContain(">Yritys<");
    expect(html).toContain("Kaikki oikeudet pidätetään");
    expect(html).not.toContain("All rights reserved.");
  });

  it("puts the app links under the social links (English removed 2026-10-15)", () => {
    const html = renderChrome("/");
    const brand = html.slice(html.indexOf("footer-brand-col"), html.indexOf(">Palvelu<"));

    expect(brand).toContain("footer-apps-sep");
    expect(brand).toContain('href="/android-sovellus"');
    expect(brand).toContain('href="/chrome-extension"');
    expect(html).not.toContain('href="/en"');
  });
});
