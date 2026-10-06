import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import FAQPage from "./FAQPage.jsx";
import { routeMeta } from "../data/seo.js";

function renderPage() {
  return renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/ukk"]}>
        <FAQPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("FAQPage", () => {
  it("focuses the page heading and metadata on viikkonumero", () => {
    const html = renderPage();
    const meta = routeMeta["/ukk"];

    expect(html).toContain("<h1>Viikkonumero: usein kysytyt kysymykset</h1>");
    expect((html.match(/<h1>/g) || [])).toHaveLength(1);
    expect(meta.title.startsWith("Viikkonumero:")).toBe(true);
    expect(meta.description.toLowerCase()).toContain("viikkonumero");
  });

  it("answers the main intent first and links to the next useful actions", () => {
    const html = renderPage();

    expect(html.indexOf("Mikä on viikkonumero?")).toBeLessThan(
      html.indexOf("Mikä viikko nyt on?"),
    );
    expect(html).toContain('href="/mika-on-viikkonumero"');
    expect(html).toContain('href="/paivamaara-viikoksi"');
    expect(html).toContain("Sisältö päivitetty 6. lokakuuta 2026.");
  });
});
