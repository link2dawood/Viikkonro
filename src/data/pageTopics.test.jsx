import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { pageTopic, topicSchema, PAGE_TOPICS, TOPIC_CONTENT_UPDATED } from "./pageTopics.js";
import { canonicalFor, sitemapEntries } from "./seo.js";
import { sitemapLastmod } from "./sitemapMetadata.js";
import { DAY_RULES } from "./dayRules.js";
import TopicGuide from "../components/TopicGuide.jsx";

const today = new Date("2026-10-11T12:00:00Z");
describe("visible semantic topics use existing tools and calendar rules", () => {
  it("covers all registered public routes with useful, unique, public guide links", () => {
    const paths = new Set(sitemapEntries(2026).map(entry=>entry.path));
    // Collected into one assertion rather than ~15 expect() calls per route.
    // With 1,900+ sitemap paths that was ~29,000 assertions, and the per-call
    // overhead, not pageTopic() itself, is what pushed this test against the
    // 5s timeout under parallel load. The checks are unchanged, and a failure
    // now names every offending route instead of stopping at the first.
    const problems = [];
    for (const path of paths) {
      const context = pageTopic(path, today);
      if (!context) { problems.push(`${path}: no topic context`); continue; }
      if (!Object.hasOwn(PAGE_TOPICS, context.id)) problems.push(`${path}: unknown topic id ${context.id}`);
      if (context.text.length <= 60) problems.push(`${path}: topic text too short (${context.text.length})`);
      if (context.links.length === 0) problems.push(`${path}: no guide links`);
      if (new Set(context.links.map(l=>l.to)).size !== context.links.length) problems.push(`${path}: duplicate guide links`);
      for (const l of context.links) {
        if (!paths.has(l.to)) problems.push(`${path}: links to ${l.to}, which is not a sitemap path`);
        if (l.to === path) problems.push(`${path}: links to itself`);
        if (l.purpose.length <= 10) problems.push(`${path}: link ${l.to} has no useful purpose text`);
      }
    }
    expect(problems.slice(0,10), `${problems.length} routes have unusable guide links`).toEqual([]);
    // Walks every sitemap route on purpose, so its runtime scales with the
    // site: 1,919 routes at ~0.25ms per pageTopic() call, measured, plus the
    // sitemap build. Vitest's 5s default is a generic value, not a budget for
    // that, and under parallel load this test was timing out at 5.1-6.1s while
    // taking well under a second alone. The limit below is headroom for real
    // iteration cost as the horizon grows, not cover for a slow regression:
    // if this test ever approaches it, profile pageTopic() rather than raising
    // the number again.
  }, 20000);
  it.each([null,123,"/missing","/viikko-999999-2027","/kuukausi-13-2027","/viikko-1-9999","/api/billing/status","/tiimin-lomat/suunnittelu","/widget/calendar/v1","/yrityskalenteri?company=private"])("excludes invalid, private and nonpage input %s",path => expect(pageTopic(path,today)).toBeNull());
  it("rejects invalid clocks", () => { expect(pageTopic("/",new Date(NaN))).toBeNull();expect(pageTopic("/",null)).toBeNull(); });
  it.each([2026,2027,2028])("keeps contextual links in the selected year %i",year => {
    for (const path of [`/kalenteri-${year}`,`/pyhapaivat-${year}`,`/palkkapaivat-${year}`,`/tyopaivat-${year}`]) {
      const context=pageTopic(path,today);
      expect(context.year).toBe(year);
      expect(context.links.some(l=>l.to.endsWith(`-${year}`))).toBe(true);
      expect(context.links.some(l=>/-20\d{2}$/.test(l.to) && !l.to.endsWith(`-${year}`))).toBe(false);
    }
  });
  it("computes leap-year facts and week links across the calendar-year boundary", () => {
    expect(pageTopic("/kuukausi-2-2028",today).detail).toContain("29 päivää");
    expect(pageTopic("/kuukausi-2-2027",today).detail).toContain("28 päivää");
    const context=pageTopic("/viikko-53-2026",today);
    expect(context.detail).toContain("28.12.2026");expect(context.detail).toContain("3.1.2027");
    expect(context.links.map(l=>l.to)).toContain("/kuukausi-12-2026");
    expect(context.links.map(l=>l.to)).toContain("/kuukausi-1-2027");
    expect(pageTopic("/viikko-53-2027",today)).toBeNull();
  });
  it("uses Helsinki's calendar year rather than the visitor's UTC year", () => {
    expect(pageTopic("/hr-kalenteri",new Date("2026-12-31T22:30:00Z")).year).toBe(2027);
  });
  it("reuses workday disclosures without mixing leave, planner and sprint modes", () => {
    expect(pageTopic("/tyopaivalaskuri",today).text).toBe(DAY_RULES.FINLAND_WORKDAY.disclosure);
    expect(pageTopic("/lomasuunnittelija",today).id).toBe("leave");
    expect(pageTopic("/sprinttisuunnittelija",today).id).toBe("project");
    expect(pageTopic("/hr-kalenteri",today).text).toContain("erillään");
  });
  it("extends existing semantic relationships without mutating or dropping them", () => {
    const node={url:canonicalFor("/android-sovellus"),about:{"@id":"application-id"},relatedLink:[canonicalFor("/menetelma")],mainEntity:{"@id":"application-id"}};
    const original=structuredClone(node);
    const updated=topicSchema(node,pageTopic("/android-sovellus",today));
    expect(node).toEqual(original);expect(updated.about[0]).toEqual(node.about);expect(updated.mainEntity).toEqual(node.mainEntity);
    expect(updated.relatedLink).toContain(canonicalFor("/menetelma"));
    expect(updated.description).toBeTruthy();
    expect(topicSchema(updated,pageTopic("/android-sovellus",today))).toEqual(updated);
  });
  it("dates the new visible guidance while preserving later revisions and historical renders", () => {
    const node={url:canonicalFor("/"),dateModified:"2026-10-05"};
    expect(topicSchema(node,pageTopic("/",today)).dateModified).toBe(TOPIC_CONTENT_UPDATED);
    expect(topicSchema({...node,dateModified:"2026-10-20"},pageTopic("/",today)).dateModified).toBe("2026-10-20");
    expect(topicSchema(node,pageTopic("/",new Date("2026-10-06T12:00:00Z"))).dateModified).toBe("2026-10-05");
  });
  it("records the actual editorial change once without advancing unchanged dates", () => {
    expect(sitemapLastmod("/kalenteri-2027","2026-10-12")).toBe(TOPIC_CONTENT_UPDATED);
    expect(sitemapLastmod("/kalenteri-2027","2026-11-12")).toBe(TOPIC_CONTENT_UPDATED);
    expect(sitemapLastmod("/","2026-11-12")).toBe("2026-11-12");
    expect(sitemapLastmod("/kalenteri-2027","2026-10-06")).toBe("2026-10-05");
    expect(sitemapLastmod("/pdf/kalenteri-2027.pdf","2026-11-12")).toBeNull();
  });
  it("renders crawlable Finnish guidance (English page removed 2026-10-15)", () => {
    const fi=renderToStaticMarkup(<MemoryRouter initialEntries={["/hr-kalenteri"]}><TopicGuide /></MemoryRouter>);
    expect(fi).toContain('data-topic-id="hr"');expect(fi).toContain('href="/vuosilomalaskuri"');expect(fi).toContain("noprint");
    expect(fi).toContain("Kalenterin käyttö ja aiheeseen liittyvät oppaat");
    expect(renderToStaticMarkup(<MemoryRouter initialEntries={["/tiimin-lomat/suunnittelu"]}><TopicGuide /></MemoryRouter>)).toBe("");
  });
});
