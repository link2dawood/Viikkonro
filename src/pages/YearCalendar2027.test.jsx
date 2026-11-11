import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import YearCalendar from "./YearCalendar.jsx";

const render = (element) =>
  renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter>{element}</MemoryRouter>
    </HelmetProvider>,
  );

describe("/vuosi-2027 developer guide enhancements", () => {
  const html = render(<YearCalendar year={2027} />);

  it("renders verified annual statistics cards for 2027", () => {
    expect(html).toContain("Vuoden 2027 tärkeimmät tiedot");
    expect(html).toContain("365");
    expect(html).toContain("52");
    expect(html).toContain("261");
    expect(html).toContain("255");
    expect(html).toContain("104");
    expect(html).toContain("6");
    expect(html).toContain("Päiviä yhteensä");
    expect(html).toContain("ISO-viikkoja");
    expect(html).toContain("Arkipäiviä");
    expect(html).toContain("Työpäiviä");
    expect(html).toContain("Viikonloppuja");
    expect(html).toContain("Arkipyhiä");
  });

  it("renders full-year calendar preview and link to full calendar", () => {
    expect(html).toContain("Vuoden 2027 vuosikalenteri");
    expect(html).toContain("cal-preview-grid");
    expect(html).toContain("Tammikuu");
    expect(html).toContain("Joulukuu");
    expect(html).toContain("Katso koko kalenteri 2027");
    expect(html).toContain('href="/kalenteri-2027"');
    expect(html).toContain("cal-preview-legend");
    expect(html).toContain("Viralliset pyhäpäivät ja arkipyhät");
  });

  it("renders ISO week determination explanation with verified 2027 boundary dates", () => {
    expect(html).toContain("Miten vuoden 2027 viikkonumerot määräytyvät?");
    expect(html).toContain("53 / 2026");
    expect(html).toContain("1 / 2027");
    expect(html).toContain("52 / 2027");
    expect(html).toContain("/menetelma");
    expect(html).toContain("/mika-on-viikkonumero");
  });

  it("renders public holidays and working day breakdown with verified 255 count", () => {
    expect(html).toContain("Pyhäpäivät ja työpäivät vuonna 2027");
    expect(html).toContain("261 arkipäivää");
    expect(html).toContain("6 arkipäivälle osuvaa virallista pyhäpäivää");
    expect(html).toContain("työpäiviä jää 255");
    expect(html).toContain("Uudenvuodenpäivä");
    expect(html).toContain("Loppiainen");
    expect(html).toContain("Pitkäperjantai");
    expect(html).toContain("Helatorstai");
    expect(html).toContain("Itsenäisyyspäivä");
    expect(html).toContain('href="/pyhapaivat-2027"');
    expect(html).toContain('href="/tyopaivat-2027"');
  });

  it("renders downloadable resources for PDF calendar and printable week list", () => {
    expect(html).toContain("Lataa vuoden 2027 kalenteri");
    expect(html).toContain("Vuoden 2027 PDF-kalenteri");
    expect(html).toContain("Vuoden 2027 viikkolista");
    expect(html).toContain("/pdf/kalenteri-2027.pdf");
    expect(html).toContain('href="/tulosta-2027"');
  });

  it("renders trust, precision and sources section with official references", () => {
    expect(html).toContain("Laskennan tarkkuus ja tietolähteet");
    expect(html).toContain("ISO 8601 -standardi");
    expect(html).toContain("https://www.iso.org/");
    expect(html).toContain("https://www.finlex.fi/");
    expect(html).toContain("/menetelma");
    expect(html).toContain("/tietolahteet");
  });

  it("renders monthly navigation with January-December links", () => {
    expect(html).toContain("Vuoden 2027 viikot kuukausittain");
    for (let m = 1; m <= 12; m++) {
      expect(html).toContain(`href="/kuukausi-${m}-2027"`);
    }
  });
});

describe("/vuosi-2026 dynamic verification", () => {
  const html2026 = render(<YearCalendar year={2026} />);

  it("renders verified 53 ISO weeks and annual overview for 2026", () => {
    expect(html2026).toContain("Vuoden 2026 tärkeimmät tiedot");
    expect(html2026).toContain("365");
    expect(html2026).toContain("53");
    expect(html2026).toContain("Päiviä yhteensä");
    expect(html2026).toContain("ISO-viikkoja");
    expect(html2026).toContain("Laskennan tarkkuus ja tietolähteet");
    expect(html2026).toContain("ISO 8601 -standardi");
    expect(html2026).toContain('href="/viikko-53-2026"');
  });
});
