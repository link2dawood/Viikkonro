import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import PrivateSiteLayout from "./PrivateSiteLayout";
import TeamLeaveApp from "./TeamLeaveApp";

describe("private workspace site layout", () => {
  it("shares the Finnish site header/footer without public tracking or consent controls", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/tiimin-lomat/suunnittelu"]}>
        <PrivateSiteLayout><h1>Yksityinen suunnitelma</h1></PrivateSiteLayout>
      </MemoryRouter>,
    );
    expect(html).toContain('<header class="nav">');
    expect(html).toContain('<footer class="site-footer">');
    expect(html).toContain('<main id="main" tabindex="-1"><h1>Yksityinen suunnitelma</h1></main>');
    expect(html).toContain('href="/kalenteripohjat"');
    expect(html).toContain('href="/tietosuoja"');
    expect(html).not.toMatch(/Evästeasetukset|growth-cta|adsbygoogle|newsletter|<script/i);
  });
  it("gives the real private planner exactly one main landmark", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/tiimin-lomat/suunnittelu"]}>
        <PrivateSiteLayout><TeamLeaveApp client={{}} /></PrivateSiteLayout>
      </MemoryRouter>,
    );
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toContain('class="team-app" data-clarity-mask="True"');
    expect(html).toContain('class="team-auth"');
  });
});
