import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ConstructionCalendar from "./ConstructionCalendar.jsx";
import { constructionMeta, constructionFaqs, CONSTRUCTION_PATH, CONSTRUCTION_UPDATED } from "../data/constructionCalendar.js";
import { canonicalFor, sitemapEntries, routeMeta } from "../data/seo.js";
import { sitemapLastmod } from "../data/sitemapMetadata.js";
import { TOPIC_CONTENT_UPDATED } from "../data/pageTopics.js";
import { platformEventCommands } from "../platform/analytics.js";
import { pageTypeOf } from "../analytics.js";
afterEach(() => { delete globalThis.__VIIKKONRO_RENDER_DAY__; });
const render = () => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-10";
  return renderToStaticMarkup(<HelmetProvider><MemoryRouter><ConstructionCalendar /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
};
describe("construction planner landing page", () => {
  it("renders Finnish structured inputs, a real default preview and all exports in SSR", () => {
    const html = render();
    expect(html).toContain("<h1>Rakennuskalenteri ja työmaan viikkoaikataulu</h1>");
    for (const marker of ['id="c-project"', 'id="c-site"', 'id="c-start"', 'id="c-end"', "Lisää työvaihe", "Lisää viikkotehtävä", "Lisää toimitus", "Lisää tarkastus", "Lisää välitavoite", "Lisää työmaan tauko", "ISO-viikko 42/2026", "Tulosta aikataulu", "Lataa PDF", "Lataa Excel", "Lataa CSV", "Lataa ICS"]) expect(html).toContain(marker);
    expect(html).not.toMatch(/Kirjaudu|FINLAND_STATUTORY_LEAVE/);
  });
  it("publishes substantive matching FAQs and one canonical sitemap entry", () => {
    const html = render();
    for (const faq of constructionFaqs()) { expect(html).toContain(faq.q); expect(html).toContain(faq.a); }
    expect(canonicalFor(CONSTRUCTION_PATH)).toBe("https://viikkonro.fi/rakennuskalenteri");
    expect(sitemapEntries().filter((entry) => entry.path === CONSTRUCTION_PATH)).toHaveLength(1);
    expect(sitemapLastmod(CONSTRUCTION_PATH, "2026-10-10")).toBe(CONSTRUCTION_UPDATED);
    expect(sitemapLastmod(CONSTRUCTION_PATH, "2099-01-01")).toBe(TOPIC_CONTENT_UPDATED);
    expect(routeMeta[CONSTRUCTION_PATH]).toMatchObject(constructionMeta);
    expect(constructionMeta.title.length).toBeLessThanOrEqual(60);
    expect(constructionMeta.description.length).toBeLessThanOrEqual(160);
    for (const item of constructionFaqs()) expect(item.q + item.a).not.toMatch(/–|\.\./);
  });
  it("masks private content and keeps manual weather fields free of employee inputs", () => {
    const html = render();
    expect((html.match(/data-clarity-mask="True"/g) ?? []).length).toBe(2);
    expect(html).toContain("Sääriskit (omat huomiot)");
    expect(html).not.toMatch(/id=".*employee|type="email"|type="password"/);
  });
  it("sends requested analytics without private data", () => {
    expect(pageTypeOf(CONSTRUCTION_PATH)).toBe("rakennuskalenteri");
    for (const event of ["construction_planner_started", "construction_planner_created", "construction_planner_export"]) {
      const commands = platformEventCommands(event, { source: "editor", year: 2027, export_type: "xlsx", siteName: "Private", projectName: "Secret", weatherNotes: "Internal" });
      expect(JSON.stringify(commands)).not.toMatch(/Private|Secret|Internal/);
      expect(commands).toContainEqual(["event", event]);
    }
  });
});
