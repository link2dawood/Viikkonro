import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import VacationPlanner from "./VacationPlanner.jsx";
import { plannerFaqs, PLANNER_PATH, PLANNER_UPDATED, bestBreaks } from "../data/vacationPlanner.js";
import { routeMeta, canonicalFor, sitemapEntries } from "../data/seo.js";
import { sitemapLastmod } from "../data/sitemapMetadata.js";
import { TOPIC_CONTENT_UPDATED } from "../data/pageTopics.js";
import { platformEventCommands } from "../platform/analytics.js";
import { createLicense, hasFeature } from "../platform/business/licensing.js";

afterEach(() => { delete globalThis.__VIIKKONRO_RENDER_DAY__; });
const render = () => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-10";
  return renderToStaticMarkup(<HelmetProvider><MemoryRouter><VacationPlanner /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
};
describe("existing free vacation page with local annual Pro planner", () => {
  it("preserves the original free calculator and its computed results", () => {
    const html = render();
    expect(html).toContain("<h1>Lomasuunnittelija</h1>");
    expect(html).toContain('id="v-year"');
    expect(html).toContain('id="v-leave"');
    expect(html).toContain(`${bestBreaks(2026, 4, 3)[0].days} päivän tauon`);
    expect(html).toContain("Pisin tauko lomapäivien mukaan 2026 ja 2027");
  });
  it("offers only explicit vacation rule choices and a shared local preview", () => {
    const html = render();
    expect(html).toContain('id="vuosisuunnitelma"');
    expect(html).toContain('value="FINLAND_STATUTORY_LEAVE"');
    expect(html).toContain('value="FINLAND_PLANNER"');
    expect(html).not.toMatch(/value="FINLAND_(PROJECT|SPRINT|BANKING|WORKDAY)"/);
    expect(html).toContain("Yhteinen kalenterinäkymä");
    expect(html).toContain('data-clarity-mask="True"');
    expect(html).toContain("Tallenna luonnos tähän selaimeen");
    expect(html).toContain('class="cc-watermark"');
    for (const label of ["Lataa PDF", "Lataa Excel", "Lataa ICS"]) expect(html).toContain(label);
    expect(html).not.toContain("Lataa CSV");
  });
  it("uses matching visible FAQs and existing canonical/sitemap without duplicate routes", () => {
    const html = render();
    for (const item of plannerFaqs()) { expect(html).toContain(item.q); expect(html).toContain(item.a); }
    expect(canonicalFor(PLANNER_PATH)).toBe("https://viikkonro.fi/lomasuunnittelija");
    expect(sitemapEntries().filter((entry) => entry.path === PLANNER_PATH)).toHaveLength(1);
    expect(sitemapLastmod(PLANNER_PATH, "2026-10-10")).toBe(PLANNER_UPDATED);
    expect(sitemapLastmod(PLANNER_PATH, "2099-01-01")).toBe(TOPIC_CONTENT_UPDATED);
    expect(routeMeta[PLANNER_PATH].title.length).toBeLessThanOrEqual(60);
    expect(routeMeta[PLANNER_PATH].description.length).toBeLessThanOrEqual(160);
  });
  it("separates premium export entitlements from existing free tools and company licences", () => {
    const today = new Date(2026, 9, 10);
    const license = createLicense({ productId: "vacation-planner-pro", tier: "paid", issuedOn: "2026-01-01", expiresOn: "2028-12-31" });
    for (const kind of ["pdf", "xlsx", "ics"]) {
      expect(hasFeature("vacation-planner-pro", `${kind}-export`, license, today)).toBe(true);
      expect(hasFeature("vacation-planner-pro", `${kind}-export`, null, today)).toBe(false);
      expect(hasFeature("company-calendar", `${kind}-export`, license, today)).toBe(false);
    }
  });
  it("sends only coarse analytics without labels, period dates or notes", () => {
    for (const name of ["vacation_planner_started", "vacation_planner_preview", "vacation_planner_export"]) {
      expect(platformEventCommands(name, { year: 2028, personLabel: "Salainen", notes: "Sisäinen", date: "2028-02-29" })).toEqual([["set", "pf_year", "2028"], ["event", name]]);
    }
  });
});
