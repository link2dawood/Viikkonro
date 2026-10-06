import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import CompanyCalendar from "./CompanyCalendar.jsx";
import AppRoutes from "../AppRoutes.jsx";
import {
  COMPANY_CALENDAR_PATH,
  COMPANY_CALENDAR_STEPS,
  COMPANY_CALENDAR_UPDATED,
  companyCalendarFaqs,
  companyCalendarMeta,
  companyCalendarYears,
} from "../data/companyCalendar.js";
import { canonicalFor, routeMeta, sitemapEntries } from "../data/seo.js";
import { sitemapLastmod } from "../data/sitemapMetadata.js";
import { PLATFORM_EVENTS, platformEventCommands } from "../platform/analytics.js";
import { createLicense, hasFeature } from "../platform/business/licensing.js";
import { pageTypeOf } from "../analytics.js";

afterEach(() => {
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
});

const renderAt = (path, day = "2026-10-07") => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = day;
  return renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </HelmetProvider>,
  );
};
// React may put "<!-- -->" between adjacent text nodes; tests compare the text.
const plain = (html) => html.replace(/<!-- -->/g, "");
const renderPage = (day = "2026-10-07") => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = day;
  return plain(
    renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <CompanyCalendar />
        </MemoryRouter>
      </HelmetProvider>,
    ),
  );
};

describe("/yrityskalenteri page", () => {
  const html = renderPage();
  it("has the agreed Finnish headline and supporting text", () => {
    expect(html).toContain("<h1>Luo yrityksellesi oma kalenteri 2027</h1>");
    expect(html).toContain(
      "Lisää logo, yrityksen vapaapäivät, palkkapäivät ja tärkeät päivät. Saat valmiin yrityskalenterin PDF-, Excel- ja ICS-muodossa.",
    );
  });
  it("follows the site's year rule: next year from October, this year before", () => {
    expect(renderPage("2026-09-30")).toContain("oma kalenteri 2026</h1>");
    expect(renderPage("2026-10-01")).toContain("oma kalenteri 2027</h1>");
    expect(companyCalendarYears(new Date(2027, 11, 31)).defaultYear).toBe(2028);
  });
  it("offers this, next and the following year with the default selected", () => {
    for (const y of [2026, 2027, 2028]) expect(html).toContain(`value="${y}"`);
    expect(html).toMatch(/<option value="2027" selected="">2027<\/option>/);
  });
  it("starts with a working, watermarked free preview that shows ISO week numbers", () => {
    expect(html).toContain("cc-watermark");
    expect(html).toContain("Ilmainen esikatselu");
    expect(html).toContain("Kalenteri 2027, ISO 8601 -viikkonumerot");
    expect(html).toContain("Tammikuu");
    expect(html).toMatch(/<th scope="row" class="cc-wk">53<\/th>/); // 1 Jan 2027 is in ISO week 53 of 2026
    expect(html).toContain("Uudenvuodenpäivä");
    expect(html).not.toMatch(/NaN|undefined|\[object/);
  });
  it("shows locked exports, never a development unlock, in a production-like render", () => {
    for (const label of ["Lataa PDF", "Lataa Excel", "Lataa CSV", "Lataa ICS"]) expect(html).toContain(label);
    expect(html).toContain("🔒");
    expect(html).not.toContain("Avaa lataukset (testi)");
    expect(html).not.toContain("Kehitystila");
  });
  it("offers the three layouts, the toggles and the optional inputs", () => {
    for (const text of ["Koko vuosi yhdellä sivulla", "Yksi kuukausi sivulla", "Viikkonumeroluettelo", "Suomen pyhäpäivät", "Liputuspäivät", "Koululomat", "Lomakausi", "Palkkapäivät", "Sulkupäivät", "Yrityksen tapahtumat", "PNG tai SVG"]) {
      expect(html, text).toContain(text);
    }
    expect(html).toContain('accept="image/png,image/svg+xml"');
    expect(html).toContain("Tyhjennä luonnos");
  });
  it("renders every FAQ visibly, from the same function the schema uses", () => {
    const faqs = companyCalendarFaqs();
    expect(faqs.length).toBeGreaterThanOrEqual(6);
    for (const { q } of faqs) expect(html).toContain(`<summary>${q}</summary>`);
    for (const step of COMPANY_CALENDAR_STEPS) expect(html).toContain(step);
  });
  it("links to the related calendar pages", () => {
    for (const href of ["/kalenteri-2027", "/tulostettava-kalenteri-2027", "/pyhapaivat-2027", "/palkkapaivat-2027", "/koululomat-2027", "/tyopaivat-2027", "/laskurit"]) {
      expect(html).toContain(`href="${href}"`);
    }
  });
});

describe("SEO registration", () => {
  it("has a title and description within the build's limits, and a canonical", () => {
    expect(companyCalendarMeta.title.length).toBeLessThanOrEqual(60);
    expect(companyCalendarMeta.description.length).toBeGreaterThanOrEqual(140);
    expect(companyCalendarMeta.description.length).toBeLessThanOrEqual(158);
    expect(routeMeta[COMPANY_CALENDAR_PATH]).toMatchObject(companyCalendarMeta);
    expect(canonicalFor(COMPANY_CALENDAR_PATH)).toBe("https://viikkonro.fi/yrityskalenteri");
    expect(renderPage()).toContain('rel="canonical" href="https://viikkonro.fi/yrityskalenteri"');
  });
  it("is in the sitemap with a recorded modification date", () => {
    expect(sitemapEntries().some((e) => e.path === COMPANY_CALENDAR_PATH)).toBe(true);
    expect(sitemapLastmod(COMPANY_CALENDAR_PATH, "2099-01-01")).toBe(COMPANY_CALENDAR_UPDATED);
  });
  it("types the page for analytics and keeps en dashes out of its copy", () => {
    expect(pageTypeOf(COMPANY_CALENDAR_PATH)).toBe("yrityskalenteri");
    const copy = [companyCalendarMeta.title, companyCalendarMeta.description, ...companyCalendarFaqs().flatMap((f) => [f.q, f.a]), ...COMPANY_CALENDAR_STEPS].join(" ");
    expect(copy).not.toMatch(/–/);
    expect(copy).not.toMatch(/NaN|undefined/);
  });
  it("registers the page in the AI-facing files", () => {
    expect(readFileSync("public/llms.txt", "utf8")).toContain("https://viikkonro.fi/yrityskalenteri");
    expect(readFileSync("prerender.js", "utf8")).toContain("/yrityskalenteri  - company calendar builder");
  });
});

describe("internal links from the existing calendar and print pages", () => {
  for (const path of ["/kalenteri-2027", "/tulostettava-kalenteri-2027", "/tulosta-2027"]) {
    it(`links ${path} to the builder`, () => {
      expect(renderAt(path)).toContain('href="/yrityskalenteri"');
    });
  }
  it("also lists it in the calculators hub", () => {
    expect(renderAt("/laskurit")).toContain('href="/yrityskalenteri"');
  });
  it("renders the builder through the real router", () => {
    expect(renderAt("/yrityskalenteri")).toContain("Luo yrityksellesi oma kalenteri");
  });
});

describe("analytics", () => {
  const source = readFileSync("src/pages/CompanyCalendar.jsx", "utf8") + readFileSync("src/components/CompanyCalendarLink.jsx", "utf8");
  it("defines every event the product needs", () => {
    for (const name of [
      "company_calendar_view",
      "company_calendar_started",
      "company_calendar_preview",
      "company_calendar_export_attempt",
      "company_calendar_pdf_export",
      "company_calendar_xlsx_export",
      "company_calendar_ics_export",
      "company_calendar_cta_click",
    ]) {
      expect(PLATFORM_EVENTS).toContain(name);
      expect(platformEventCommands(name, { layout: "year-glance", year: 2027 })).toContainEqual(["event", name]);
    }
    expect(PLATFORM_EVENTS).toContain("company_calendar_csv_export");
  });
  it("sends only layout, year, source and file type, never company data", () => {
    const calls = [...source.matchAll(/trackPlatformEvent\(([^;]*?)\);/gs)].map((m) => m[1]);
    expect(calls.length).toBeGreaterThanOrEqual(8);
    for (const call of calls) expect(call, call).not.toMatch(/companyName|branding|logo|title|label|city|\.events|closures|paydayDates/);
    const cmds = platformEventCommands("company_calendar_pdf_export", { layout: "month-page", year: 2027, companyName: "Oy Salainen", logo: "data:image/png;base64,AAAA", title: "Salaisuus" });
    expect(JSON.stringify(cmds)).not.toMatch(/Salainen|AAAA|Salaisuus/);
    expect(cmds).toEqual([["set", "pf_year", "2027"], ["set", "pf_layout", "month-page"], ["event", "company_calendar_pdf_export"]]);
  });
  it("calls every event name it fires one that is registered", () => {
    const used = new Set([...source.matchAll(/"(company_calendar_\w+)"/g)].map((m) => m[1]));
    for (const name of used) expect(PLATFORM_EVENTS, name).toContain(name);
    expect(source).toContain("`company_calendar_${kind}_export`");
  });
});

describe("what a licence unlocks", () => {
  it("locks every export without a licence and unlocks all four with one", () => {
    const license = createLicense({ productId: "company-calendar", tier: "paid", issuedOn: "2026-10-07", expiresOn: "2027-12-31" });
    const today = new Date(2026, 9, 8);
    for (const kind of ["pdf", "xlsx", "csv", "ics"]) {
      expect(hasFeature("company-calendar", `${kind}-export`, null, today), kind).toBe(false);
      expect(hasFeature("company-calendar", `${kind}-export`, license, today), kind).toBe(true);
    }
    for (const feature of ["logo", "branding", "company-days", "no-watermark"]) {
      expect(hasFeature("company-calendar", feature, null, today)).toBe(false);
      expect(hasFeature("company-calendar", feature, license, today)).toBe(true);
    }
    expect(hasFeature("company-calendar", "preview", null, today)).toBe(true); // the free preview is open to everyone
  });
});
