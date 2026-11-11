import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import WeekdayCalculator from "./WeekdayCalculator.jsx";
import { WEEKDAY_VERIFIED_DATE, weekdayFaqs } from "../data/currentDateContent.js";

describe("WeekdayCalculator", () => {
  it("renders status and verification trust indicator card", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/viikonpaiva"]}>
        <WeekdayCalculator />
      </MemoryRouter>,
    );

    expect(html).toContain("calculator-status-card");
    expect(html).toContain("Laskurin tila");
    expect(html).toContain("Toiminnassa");
    expect(html).toContain("status-dot-pulse");
    expect(html).toContain("Laskentamenetelmä");
    expect(html).toContain("ISO 8601");
    expect(html).toContain("Kalenterijärjestelmä");
    expect(html).toContain("Gregoriaaninen");
    expect(html).toContain("Viimeksi tarkistettu");
    expect(html).toContain(WEEKDAY_VERIFIED_DATE);
  });

  it("shields dynamic today text with data-nosnippet to prevent stale snippet indexing", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/viikonpaiva"]}>
        <WeekdayCalculator />
      </MemoryRouter>,
    );

    expect(html).toContain("data-nosnippet");
    expect(html).toMatch(/<span data-nosnippet(?:="true")?><strong>Tänään [^<]+ on [^<]+<\/strong>\s*<\/span>/);
  });

  it("renders calculation reliability section, leap year explanations, and authority links", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/viikonpaiva"]}>
        <WeekdayCalculator />
      </MemoryRouter>,
    );

    expect(html).toContain("Laskennan luotettavuus (Calculation reliability)");
    expect(html).toContain("ISO 8601");
    expect(html).toContain("Gregoriaaninen kalenteri (Gregorian calendar)");
    expect(html).toContain("Karkausvuodet (Leap years)");
    expect(html).toContain("Karkauspäivä 29. helmikuuta (February 29)");
    expect(html).toContain("Vuodenvaihteet ja ISO-viikkovuoden ero");
    expect(html).toContain("Historialliset ja tulevat päivämäärät");
    expect(html).toContain("Tietoa palvelusta ja toimituksellisesta ylläpidosta");
    expect(html).toContain("Dawood Zafar");
    expect(html).toContain("/tietoa-meista");
    expect(html).toContain("/toimitusperiaatteet");
    expect(html).toContain("/menetelma");
    expect(html).toContain("/tietolahteet");
    expect(html).toContain("/ota-yhteytta");
    expect(html).toContain("hi@viikkonro.fi");
    expect(html).toContain("Yli 1 300 automaattista");
  });

  it("renders expanded expert FAQ section", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/viikonpaiva"]}>
        <WeekdayCalculator />
      </MemoryRouter>,
    );

    expect(html).toContain("Miten viikonpäivä lasketaan?");
    expect(html).toContain("Miksi viikonpäivä vaihtuu joka vuosi?");
    expect(html).toContain("Mitä kalenterijärjestelmää Suomessa käytetään?");
    for (const faq of weekdayFaqs) {
      expect(html).toContain(faq.q);
    }
  });
});
