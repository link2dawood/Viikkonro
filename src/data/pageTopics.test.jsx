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
    for (const path of paths) {
      const context=pageTopic(path,today);
      expect(context,path).not.toBeNull();
      expect(Object.hasOwn(PAGE_TOPICS,context.id),path).toBe(true);
      expect(context.text.length,path).toBeGreaterThan(60);
      expect(context.links.length,path).toBeGreaterThan(0);
      expect(new Set(context.links.map(l=>l.to)).size,path).toBe(context.links.length);
      for (const l of context.links) { expect(paths.has(l.to),l.to).toBe(true);expect(l.to,path).not.toBe(path);expect(l.purpose.length).toBeGreaterThan(10); }
    }
  });
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
    const node={url:canonicalFor("/en"),dateModified:"2026-10-05"};
    expect(topicSchema(node,pageTopic("/en",today)).dateModified).toBe(TOPIC_CONTENT_UPDATED);
    expect(topicSchema({...node,dateModified:"2026-10-20"},pageTopic("/en",today)).dateModified).toBe("2026-10-20");
    expect(topicSchema(node,pageTopic("/en",new Date("2026-10-06T12:00:00Z"))).dateModified).toBe("2026-10-05");
  });
  it("records the actual editorial change once without advancing unchanged dates", () => {
    expect(sitemapLastmod("/kalenteri-2027","2026-10-12")).toBe(TOPIC_CONTENT_UPDATED);
    expect(sitemapLastmod("/kalenteri-2027","2026-11-12")).toBe(TOPIC_CONTENT_UPDATED);
    expect(sitemapLastmod("/","2026-11-12")).toBe("2026-11-12");
    expect(sitemapLastmod("/kalenteri-2027","2026-10-06")).toBe("2026-10-05");
    expect(sitemapLastmod("/pdf/kalenteri-2027.pdf","2026-11-12")).toBeNull();
  });
  it("renders crawlable guidance and clearly labels Finnish links on the English page", () => {
    const fi=renderToStaticMarkup(<MemoryRouter initialEntries={["/hr-kalenteri"]}><TopicGuide /></MemoryRouter>);
    expect(fi).toContain('data-topic-id="hr"');expect(fi).toContain('href="/vuosilomalaskuri"');expect(fi).toContain("noprint");
    const en=renderToStaticMarkup(<MemoryRouter initialEntries={["/en"]}><TopicGuide /></MemoryRouter>);
    expect(en).toContain("Explore the Finnish calendar tools");expect(en).toContain('hrefLang="fi"');expect(en).toContain("(Finnish)");
    expect(renderToStaticMarkup(<MemoryRouter initialEntries={["/tiimin-lomat/suunnittelu"]}><TopicGuide /></MemoryRouter>)).toBe("");
  });
});
