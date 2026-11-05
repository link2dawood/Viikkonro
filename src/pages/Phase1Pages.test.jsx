import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WeeksInMonth from "./WeeksInMonth.jsx";
import FiftyThreeWeeks from "./FiftyThreeWeeks.jsx";
import DaysInYear from "./DaysInYear.jsx";

describe("Phase 1: Page Components Rendering", () => {
  it("renders WeeksInMonth page correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WeeksInMonth />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikkoa kuukaudessa on?</h1>");
    expect(html).toContain("keskimäärin noin 4,33 viikkoa");
    expect(html).toContain("Tammikuu");
    expect(html).toContain("Joulukuu");
    expect(html).toContain("Muunna viikot ja kuukaudet");
    expect(html).toContain("wim-calc-weeks");
    expect(html).toContain("Usein kysyttyä viikoista kuukaudessa");
  });

  it("renders FiftyThreeWeeks page correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <FiftyThreeWeeks />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Miksi vuodessa on 53 viikkoa?</h1>");
    expect(html).toContain("Vuodessa on 53 ISO-viikkoa");
    expect(html).toContain("ISO 8601 -torstaisääntö");
    expect(html).toContain("Tarkista minkä tahansa vuoden viikkomäärä");
    expect(html).toContain("year-53-checker");
    expect(html).toContain("Kaikki 53 viikon vuodet");
    expect(html).toContain("Usein kysyttyä 53 viikon vuosista");
  });

  it("renders DaysInYear page correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <DaysInYear />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta päivää vuodessa on?</h1>");
    expect(html).toContain("Tavallisessa vuodessa on 365 päivää ja karkausvuodessa 366 päivää");
    expect(html).toContain("Tarkista minkä tahansa vuoden päivät");
    expect(html).toContain("diy-input-year");
    expect(html).toContain("Miksi vuodessa on 365 päivää?");
    expect(html).toContain("Miksi karkausvuosi tarvitaan?");
    expect(html).toContain("Usein kysyttyä vuoden päivistä");
  });
});
