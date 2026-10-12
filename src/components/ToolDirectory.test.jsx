import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import ToolDirectory from "./ToolDirectory.jsx";
import RelatedTools from "./RelatedTools.jsx";
import { toolGroups, relatedTools } from "../data/toolDirectory.js";
import { COUNTDOWNS } from "../data/countdownPages.js";
import { OFFSETS, offsetPath } from "../data/dateCalculator.js";
import { SUN_CITIES, sunCityPath } from "../data/sunCities.js";

const today = new Date(2026, 9, 11);
const tools = toolGroups(today).flatMap(group => group.tools);
const paths = tools.map(tool => tool.to);
describe("shared homepage tool directory", () => {
  it("separates Pro previews from free tools without changing free planner availability", () => {
    const groups = toolGroups(today);
    const pro = groups.find(group => group.id === "pro");
    const free = groups.find(group => group.id === "suunnittelu");
    expect(pro.tools.map(tool => tool.to)).toEqual(["/yrityskalenteri", "/yrityskalenteri/ics", "/lomasuunnittelija#vuosisuunnitelma"]);
    expect(free.tools.map(tool => tool.to)).toContain("/lomasuunnittelija");
    expect(free.tools.map(tool => tool.to)).not.toContain("/yrityskalenteri");
    expect(pro.tools.find(tool => tool.name === "Lomasuunnittelija Pro").badge).toContain("ei vielä myynnissä");
    const html = renderToStaticMarkup(<MemoryRouter><ToolDirectory /></MemoryRouter>);
    expect(html).toContain('id="tools-pro"');
    expect(html).toContain('href="#tools-pro"');
    expect(html).toContain("Pro-työkalut");
  });
  it("covers every existing standalone calculator and planning tool", () => {
    for (const path of ["/viikonpaiva", "/paivamaara-viikoksi", "/viikko-paivamaaraksi", "/tyopaivalaskuri", "/paivamaaralaskuri", "/paivien-erotus", "/ikalaskuri", "/tuntilaskuri", "/raskauslaskuri", "/kuukautislaskuri", "/vuosilomalaskuri", "/lomasuunnittelija", "/projektiaikataulu", "/sprinttisuunnittelija", "/rakennuskalenteri", "/hr-kalenteri", "/yrityskalenteri", "/yrityskalenteri/ics", "/kalenteripohjat", "/tiimin-lomat", "/tiimin-lomat/suunnittelu", "/api-playground", "/avoin-data", "/kalenteritilaus", "/upota-viikkonumero", "/auringonlasku", "/nimipaivat/tanaan"]) expect(paths, path).toContain(path);
    for (const path of [...COUNTDOWNS.map(c => c.path), ...OFFSETS.map(offsetPath), ...SUN_CITIES.map(c => sunCityPath(c.slug))]) expect(paths, path).toContain(path);
    expect(new Set(paths).size).toBe(paths.length);
  });
  it("renders all links in server HTML and preserves private document navigation", () => {
    const html = renderToStaticMarkup(<MemoryRouter><ToolDirectory /></MemoryRouter>);
    for (const tool of toolGroups(new Date()).flatMap(group => group.tools)) expect(html).toContain(`href="${tool.to}"`);
    expect(html).toContain('href="/tiimin-lomat/suunnittelu"');
    expect(readFileSync("src/pages/Home.jsx", "utf8")).toContain("<ToolDirectory />");
    expect(readFileSync("src/pages/Calculators.jsx", "utf8")).toContain("<ToolDirectory />");
  });
  it.each([2026,2027,2028])("keeps related calendar and payroll links in year %s", year => {
    expect(relatedTools(`/kalenteri-${year}`,today).map(t => t.to)).toContain(`/pyhapaivat-${year}`);
    expect(relatedTools(`/palkkapaivat-${year}`,today).map(t => t.to)).toContain(`/pyhapaivat-${year}`);
  });
  it("uses unique contextual links without self links or private workspace promotion", () => {
    for (const path of [...paths, "/kalenteripohjat/yrityskalenteri", "/viikko-1-2028"]) {
      const links=relatedTools(path,today).map(t=>t.to);
      expect(links).not.toContain(path);
      expect(links).not.toContain("/tiimin-lomat/suunnittelu");
      expect(new Set(links).size).toBe(links.length);
      expect(links.length).toBeLessThanOrEqual(4);
    }
    for (const path of ["/", "/en", "/laskurit", "/tietosuoja", "/missing-page"]) expect(relatedTools(path,today)).toEqual([]);
  });
  it("provides crawlable related links with a return to the full directory", () => {
    const html=renderToStaticMarkup(<MemoryRouter initialEntries={["/projektiaikataulu"]}><RelatedTools /></MemoryRouter>);
    expect(html).toContain('href="/sprinttisuunnittelija"');
    expect(html).toContain('href="/laskurit"');
    expect(html).toContain("noprint");
  });
});
