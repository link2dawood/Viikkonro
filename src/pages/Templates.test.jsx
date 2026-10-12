import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import AppRoutes from "../AppRoutes";
import { TEMPLATES, templatePath } from "../platform/templates/catalog";
import { pageTypeOf } from "../analytics";

afterEach(() => { delete globalThis.__VIIKKONRO_RENDER_DAY__; });
const render = (path) => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-10";
  return renderToStaticMarkup(<HelmetProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
};
describe("static template pages", () => {
  it("renders the full catalogue and crawlable links before JavaScript runs", () => {
    const html = render("/kalenteripohjat");
    expect(html).toContain("<h1>Kalenteri- ja suunnittelupohjat</h1>");
    for (const template of TEMPLATES) expect(html).toContain(`href="${templatePath(template)}"`);
    expect(html).toContain("Ei tiliä");
    expect(pageTypeOf("/kalenteripohjat")).toBe("kalenteripohjat");
  });
  it.each(TEMPLATES)("renders unique $id content, preview and real download links", (template) => {
    const html = render(templatePath(template));
    expect(html).toContain(`<h1>${template.finnishName}</h1>`);
    expect(html).toContain(template.description);
    expect(html).toContain(template.limitation);
    expect(html).toContain("ISO-viikko");
    for (const format of ["pdf", "xlsx", "csv"]) expect(html).toContain(`href="/pohjat/${template.slug}/2027.${format}"`);
    expect(html).toContain("<table>");
    expect(html).not.toContain("Avaa lataukset (testi)");
    expect(pageTypeOf(templatePath(template))).toBe("kalenteripohjat");
  });
  it("unknown templates render the existing not-found page", () => {
    expect(render("/kalenteripohjat/tuntematon")).toContain("404");
  });
});
