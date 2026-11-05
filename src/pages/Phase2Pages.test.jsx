import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WorkdaysInYear from "./WorkdaysInYear.jsx";
import WorkdaysInMonth from "./WorkdaysInMonth.jsx";
import WorkhoursInYear from "./WorkhoursInYear.jsx";
import WorkhoursInMonth from "./WorkhoursInMonth.jsx";

describe("Phase 2: Page Components Rendering", () => {
  it("renders WorkdaysInYear correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WorkdaysInYear />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta työpäivää vuodessa on?</h1>");
    expect(html).toContain("Tavallisessa vuodessa on keskimäärin 251–254 työpäivää");
    expect(html).toContain("Työpäivien vertailu vuosittain");
    expect(html).toContain("Laske omat vuosityötunnit");
    expect(html).toContain("wdy-hours-input");
    expect(html).toContain("5-päiväinen vs. 6-päiväinen työviikko");
    expect(html).toContain("Usein kysyttyä vuoden työpäivistä");
  });

  it("renders WorkdaysInMonth correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WorkdaysInMonth />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta työpäivää kuukaudessa on?</h1>");
    expect(html).toContain("Kuukaudessa on keskimäärin tasan 21 työpäivää");
    expect(html).toContain("Kuukausikohtaiset työpäivät vuonna");
    expect(html).toContain("Laske valitun kuukauden työtunnit ja palkka");
    expect(html).toContain("wdm-select-month");
    expect(html).toContain("wdm-hourly-wage");
    expect(html).toContain("Vaikutus kuukausipalkkaan ja palkanlaskentaan");
    expect(html).toContain("Usein kysyttyä kuukauden työpäivistä");
  });

  it("renders WorkhoursInYear correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WorkhoursInYear />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta työtuntia vuodessa on?</h1>");
    expect(html).toContain("Vuodessa on keskimäärin noin 1 890 työtuntia");
    expect(html).toContain("Työtuntien vertailu eri vuosina");
    expect(html).toContain("Laske omat vuosityötunnit loman kanssa");
    expect(html).toContain("why-daily-hours");
    expect(html).toContain("why-vacation-weeks");
    expect(html).toContain("Miten vuosityöaika määritellään työehtosopimuksissa?");
    expect(html).toContain("Usein kysyttyä vuosityötunneista");
  });

  it("renders WorkhoursInMonth correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WorkhoursInMonth />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta työtuntia kuukaudessa on?</h1>");
    expect(html).toContain("Kuukaudessa on keskimäärin noin 157,5 työtuntia");
    expect(html).toContain("Kuukausikohtaiset työtunnit vuonna");
    expect(html).toContain("Laske valitun kuukauden työtunnit");
    expect(html).toContain("whm-select-month");
    expect(html).toContain("whm-daily-hours");
    expect(html).toContain("Miten kuukausipalkka muunnetaan tuntipalkaksi?");
    expect(html).toContain("Usein kysyttyä kuukauden työtunneista");
  });
});
