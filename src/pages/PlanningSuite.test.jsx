import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProjectTimeline from "./ProjectTimeline.jsx";
import SprintPlanner from "./SprintPlanner.jsx";
import { projectFaqs, PROJECT_UPDATED } from "../data/projectTimeline.js";
import { sprintFaqs } from "../data/sprintPlanner.js";
import { platformEventCommands } from "../platform/analytics.js";
import { sitemapEntries, routeMeta } from "../data/seo.js";
import { sitemapLastmod } from "../data/sitemapMetadata.js";
import { TOPIC_CONTENT_UPDATED } from "../data/pageTopics.js";
afterEach(() => { delete globalThis.__VIIKKONRO_RENDER_DAY__; });
const render = (Component) => {
  globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-10-10";
  return renderToStaticMarkup(<HelmetProvider><MemoryRouter><Component /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
};
describe("existing planning suite routes", () => {
  it.each([[ProjectTimeline, "/projektiaikataulu", projectFaqs, "p-start"], [SprintPlanner, "/sprinttisuunnittelija", sprintFaqs, "s-start"]])("preserves calculator and SSR discovery for %s", (Component, path, faqs, field) => {
    const html = render(Component);
    expect(html).toContain(`id="${field}"`);
    expect(html).toContain("Suunnitelma ja lataukset");
    expect(html).toContain('data-clarity-mask="True"');
    for (const label of ["Lataa PDF", "Lataa Excel", "Lataa ICS"]) expect(html).toContain(label);
    for (const faq of faqs()) expect(html).toContain(faq.q);
    expect(sitemapEntries().filter((entry) => entry.path === path)).toHaveLength(1);
    expect(sitemapLastmod(path, "2026-10-10")).toBe(PROJECT_UPDATED);
    expect(sitemapLastmod(path, "2099-01-01")).toBe(TOPIC_CONTENT_UPDATED);
    expect(routeMeta[path].description.length).toBeLessThanOrEqual(160);
    expect(html).not.toMatch(/FINLAND_STATUTORY_LEAVE|Kirjaudu/);
  });
  it("adds simple project structure and sprint numbering", () => {
    expect(render(ProjectTimeline)).toContain("Lisää vaihe");
    expect(render(ProjectTimeline)).toContain("Lisää välitavoite");
    expect(render(SprintPlanner)).toContain('id="s-number"');
  });
  it("drops private text from planning analytics", () => {
    for (const event of ["planning_suite_created", "planning_suite_export"]) {
      const commands = platformEventCommands(event, { source: "project", name: "Salainen hanke", note: "Oma tieto", export_type: "pdf", year: 2027 });
      expect(JSON.stringify(commands)).not.toMatch(/Salainen|Oma tieto/);
      expect(commands).toContainEqual(["event", event]);
    }
  });
});
