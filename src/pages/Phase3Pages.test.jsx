import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WeekdaysInMonth from "./WeekdaysInMonth.jsx";
import VacationWeeks from "./VacationWeeks.jsx";
import SchoolWeeks from "./SchoolWeeks.jsx";

describe("Phase 3: Page Components Rendering", () => {
  it("renders WeekdaysInMonth correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <WeekdaysInMonth />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta arkipäivää kuukaudessa on?</h1>");
    expect(html).toContain("Kuukaudessa on keskimäärin noin 25 arkipäivää 6-päiväisessä laskennassa");
    expect(html).toContain("Arkipäivät vs. työpäivät pähkinänkuoressa");
    expect(html).toContain("Kuukausien arkipäivien vertailu vuonna");
    expect(html).toContain("Tarkastele valitun kuukauden päiviä");
    expect(html).toContain("wim-month-selector");
    expect(html).toContain("Miksi lauantai on Suomen laissa arkipäivä?");
    expect(html).toContain("Usein kysyttyä kuukauden arkipäivistä");
  });

  it("renders VacationWeeks correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <VacationWeeks />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikkoa vuosiloma on?</h1>");
    expect(html).toContain("Täysi vuosiloma on tasan 5 viikkoa eli 30 arkipäivää");
    expect(html).toContain("Vuosiloman viikot pähkinänkuoressa");
    expect(html).toContain("Laske kertyvät vuosilomaviikkosi");
    expect(html).toContain("vw-tenure-select");
    expect(html).toContain("vw-months-worked");
    expect(html).toContain("Miksi viiden viikon loma on 30 päivää eikä 25?");
    expect(html).toContain("Usein kysyttyä vuosilomasta");
  });

  it("renders SchoolWeeks correctly", () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <SchoolWeeks />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(html).toContain("<h1>Kuinka monta viikkoa lukuvuodessa on?</h1>");
    expect(html).toContain("Suomen peruskouluissa ja lukioissa lukuvuosi kestää noin 38–39 kouluviikkoa");
    expect(html).toContain("Lukuvuosi ja koulujen lomat pähkinänkuoressa");
    expect(html).toContain("Koulujen lomat lukuvuonna");
    expect(html).toContain("Tarkista talvilomaviikkosi (hiihtoloma)");
    expect(html).toContain("sw-region-select");
    expect(html).toContain("Mihin lukuvuoden pituus perustuu?");
    expect(html).toContain("Usein kysyttyä lukuvuoden viikoista");
  });
});
