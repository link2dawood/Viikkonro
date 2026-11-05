import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import HundredDaysWeeks from "./HundredDaysWeeks.jsx";
import HoursInYear from "./HoursInYear.jsx";

describe("Phase 5: Page Components Rendering", () => {
  it("renders HundredDaysWeeks correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <HundredDaysWeeks />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikkoa on 100 päivää?</h1>");
    expect(html).toContain("100 päivää on tasan 14 viikkoa ja 2 päivää");
    expect(html).toContain("100 päivää pähkinänkuoressa");
    expect(html).toContain("Muunna päivät viikoiksi -laskuri");
    expect(html).toContain("hdw-input");
    expect(html).toContain("Yleisimpien päivämäärien muuntotaulukko viikoiksi");
    expect(html).toContain("Mihin 100 päivän aikajaksoa käytetään?");
    expect(html).toContain("Usein kysyttyä 100 päivästä viikkoina");
  });

  it("renders HoursInYear correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <HoursInYear />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta tuntia vuodessa on?</h1>");
    expect(html).toContain("Tavallisessa vuodessa on tasan 8 760 tuntia");
    expect(html).toContain("Karkausvuonna vuodessa on 8 784 tuntia");
    expect(html).toContain("hiy-year-select");
    expect(html).toContain("Miten vuoden 8 760 tuntia jakautuvat ihmisen elämässä?");
    expect(html).toContain("Usein kysyttyä tunneista vuodessa");
  });
});
