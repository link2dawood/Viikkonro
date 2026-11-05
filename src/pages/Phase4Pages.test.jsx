import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WeeksInQuarter from "./WeeksInQuarter.jsx";
import WeeksRemaining from "./WeeksRemaining.jsx";
import WeekendsInYear from "./WeekendsInYear.jsx";

describe("Phase 4: Page Components Rendering", () => {
  it("renders WeeksInQuarter correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WeeksInQuarter />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikkoa kvartaalissa on?</h1>");
    expect(html).toContain("Kvartaalissa (vuosineljänneksessä) on keskimäärin tasan 13 viikkoa");
    expect(html).toContain("Kvartaalit pähkinänkuoressa");
    expect(html).toContain("wiq-year-select");
    expect(html).toContain("Mikä on taloushallinnon 4-4-5-viikkomalli?");
    expect(html).toContain("Usein kysyttyä kvartaalin viikoista");
  });

  it("renders WeeksRemaining correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WeeksRemaining />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikkoa vuodesta on jäljellä?</h1>");
    expect(html).toContain("on jäljellä tällä hetkellä");
    expect(html).toContain("viikkoa jäljellä");
    expect(html).toContain("päivää jäljellä");
    expect(html).toContain("kuluva viikko");
    expect(html).toContain("wr-custom-date");
    expect(html).toContain("Miten jäljellä olevat viikot lasketaan?");
    expect(html).toContain("Usein kysyttyä jäljellä olevista viikoista");
  });

  it("renders WeekendsInYear correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WeekendsInYear />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikonloppua vuodessa on?</h1>");
    expect(html).toContain("Vuodessa on aina vähintään 52 täyttä viikonloppua");
    expect(html).toContain("viikonloput pähkinänkuoressa");
    expect(html).toContain("wiy-year-select");
    expect(html).toContain("Miksi viikonloppupäivien määrä vaihtelee (104, 105 vai 106)?");
    expect(html).toContain("Usein kysyttyä viikonlopuista vuodessa");
  });
});
