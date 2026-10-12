import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import TeamLeaveLanding from "./TeamLeaveLanding";
import TeamLeaveApp from "../components/team/TeamLeaveApp";
import { teamFaqs, teamMeta, TEAM_PATH } from "../data/teamLeave";
import { sitemapEntries } from "../data/seo";
describe("team leave public and private entry", () => {
  it("prerenders useful public copy without private data", () => {
    const html = renderToStaticMarkup(<HelmetProvider><MemoryRouter><TeamLeaveLanding /></MemoryRouter></HelmetProvider>).replace(/<!-- -->/g, "");
    for (const { q, a } of teamFaqs()) { expect(html).toContain(q); expect(html).toContain(a); }
    expect(html).toContain('href="/tiimin-lomat/suunnittelu" rel="nofollow"');
    expect(sitemapEntries().filter((r) => r.path === TEAM_PATH)).toHaveLength(1);
    expect(sitemapEntries().some((r) => r.path === "/tiimin-lomat/suunnittelu")).toBe(false);
    expect(teamMeta.title.length).toBeLessThanOrEqual(60);
  });
  it("does not simulate authentication when backend is missing", () => {
    const html = renderToStaticMarkup(<TeamLeaveApp client={null} />);
    expect(html).toContain("Palvelua ei ole vielä kytketty käyttöön"); expect(html).not.toContain('type="password"'); expect(html).toContain("ei simuloida");
  });
});
