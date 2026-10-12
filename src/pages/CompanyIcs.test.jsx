import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import AppRoutes from "../AppRoutes.jsx";
import { COMPANY_ICS_PATH, COMPANY_ICS_UPDATED, companyIcsFaqs, companyIcsMeta, COMPANY_ICS_IMPORTS } from "../data/companyIcs.js";
import { routeMeta, canonicalFor, sitemapEntries } from "../data/seo.js";
import { sitemapLastmod } from "../data/sitemapMetadata.js";
import { pageTypeOf } from "../analytics.js";
import { PLATFORM_EVENTS, platformEventCommands } from "../platform/analytics.js";
import { createForm, parseDraft, serializeDraft } from "../components/companyCalendar/formModel.js";

afterEach(() => { delete globalThis.__VIIKKONRO_RENDER_DAY__; });
const render = (path) => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-10";
  return renderToStaticMarkup(<HelmetProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
};

describe("company ICS page and draft identity", () => {
  it("renders the Finnish ICS editor with one export and no print controls", () => {
    const html = render(COMPANY_ICS_PATH);
    expect(html).toContain("Yrityksen ICS-kalenteri 2027</h1>");
    expect(html).toContain("Lataa ICS");
    expect(html).not.toMatch(/Lataa PDF|Lataa Excel|Lataa CSV|id="cc-logo"|id="cc-color"|id="cc-paper"/);
    expect(html).toContain("ISO-viikkonumerot maanantaisin");
    expect(html).toContain('data-clarity-mask="True"');
    expect(html).toContain("ESIKATSELU");
  });
  it("renders every visible FAQ and official app import instruction", () => {
    const html = render(COMPANY_ICS_PATH);
    for (const item of companyIcsFaqs()) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    for (const group of COMPANY_ICS_IMPORTS) expect(html).toContain(group.url.replaceAll("&", "&amp;"));
    expect(html).toContain('href="/kalenteritilaus"');
    expect(html).toContain("Yrityksen omille päiville ei julkaista tilausosoitetta");
  });
  it("keeps all existing builder formats and links to ICS guidance", () => {
    const html = render("/yrityskalenteri");
    for (const label of ["Lataa PDF", "Lataa Excel", "Lataa CSV", "Lataa ICS"]) expect(html).toContain(label);
    expect(html).toContain(`href="${COMPANY_ICS_PATH}"`);
  });
  it("registers SEO, sitemap freshness, breadcrumbs and page analytics", () => {
    expect(routeMeta[COMPANY_ICS_PATH]).toMatchObject(companyIcsMeta);
    expect(routeMeta[COMPANY_ICS_PATH].breadcrumbParent.path).toBe("/yrityskalenteri");
    expect(canonicalFor(COMPANY_ICS_PATH)).toBe(`https://viikkonro.fi${COMPANY_ICS_PATH}`);
    expect(sitemapEntries().some((entry) => entry.path === COMPANY_ICS_PATH)).toBe(true);
    expect(sitemapLastmod(COMPANY_ICS_PATH)).toBe(COMPANY_ICS_UPDATED);
    expect(pageTypeOf(COMPANY_ICS_PATH)).toBe("yrityskalenteri-ics");
    expect(companyIcsMeta.title.length).toBeLessThanOrEqual(60);
    expect(companyIcsMeta.description.length).toBeLessThanOrEqual(160);
  });
  it("filters company names, titles, uploaded logos and full dates out of ICS analytics", () => {
    for (const name of ["company_ics_view", "company_ics_preview", "company_ics_export_attempt", "company_ics_export", "company_ics_cta", "company_ics_subscription_help"]) {
      expect(PLATFORM_EVENTS).toContain(name);
      expect(platformEventCommands(name, { year: 2027, companyName: "Salainen Oy", title: "Sisäinen", logo: "data:image/png", date: "2027-05-12" })).toEqual([["set", "pf_year", "2027"], ["event", name]]);
    }
  });
  it("keeps calendar and row identities when a draft is loaded", () => {
    const form = { ...createForm(2027), calendarId: "1234567890abcdef1234567890abcdef", events: [{ id: "r1", date: "2027-05-12", title: "Kokous" }], closures: [{ id: "r2", label: "Sulku", start: "2027-12-31", end: "2028-01-02" }], paydayDates: [{ id: "r3", date: "2027-05-14" }] };
    const parsed = parseDraft(serializeDraft(form), { years: [2026, 2027, 2028], fallbackYear: 2027 });
    expect(parsed).toEqual(form);
    expect(parseDraft(serializeDraft(parsed), { years: [2026, 2027, 2028], fallbackYear: 2027 })).toEqual(form);
  });
  it("migrates legacy drafts without dropping rows and repairs invalid duplicate row IDs", () => {
    const form = createForm(2027);
    delete form.calendarId;
    form.events = [{ id: "r1", date: "2027-05-12", title: "One" }, { id: "r1", date: "2027-05-13", title: "Two" }, { id: "bad\rUID:x", date: "2027-05-14", title: "Three" }];
    const parsed = parseDraft(serializeDraft(form), { years: [2026, 2027, 2028], fallbackYear: 2027 });
    expect(parsed.calendarId).toBeNull();
    expect(parsed.events.map((event) => event.title)).toEqual(["One", "Two", "Three"]);
    expect(parsed.events[0].id).toBe("r1");
    expect(new Set(parsed.events.map((event) => event.id)).size).toBe(3);
    for (const event of parsed.events) expect(event.id).toMatch(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/);
    expect(parseDraft(serializeDraft({ ...form, calendarId: "Company name" }), { years: [2027], fallbackYear: 2027 }).calendarId).toBeNull();
  });
});
