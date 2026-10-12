import { describe, it, expect, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import HrCalendar from "./HrCalendar";
import { hrFaqs, hrMeta, HR_PATH } from "../data/hrCalendar";
import { sitemapEntries, routeMeta } from "../data/seo";
afterEach(() => { delete globalThis.__VIIKKONRO_RENDER_DAY__; });
describe("HR landing page", () => {
  it("renders useful Finnish content, distinct origins and masked preview before hydration", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-10";
    const html = renderToStaticMarkup(<HelmetProvider><MemoryRouter><HrCalendar /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
    for (const { q, a } of hrFaqs()) { expect(html).toContain(q); expect(html).toContain(a); }
    for (const text of ["Lataa PDF", "Lataa Excel", "Lataa ICS", "Yrityksen oma päivä", "TES-kohtainen oma merkintä", "Finlex", "Lakimuistutusten lähde"]) expect(html).toContain(text);
    expect((html.match(/data-clarity-mask="True"/g) ?? []).length).toBe(2);
    expect(html).toContain('data-ready="false"');
    expect(hrMeta.title.length).toBeLessThanOrEqual(60); expect(hrMeta.description.length).toBeLessThanOrEqual(160);
    expect(routeMeta[HR_PATH]).toMatchObject(hrMeta);
    expect(sitemapEntries().filter((r) => r.path === HR_PATH)).toHaveLength(1);
  });
});
