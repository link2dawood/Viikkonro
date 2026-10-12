import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { growthIntent } from "../src/platform/growth.js";
import { toolGroups, relatedTools } from "../src/data/toolDirectory.js";
import { dateFromDayKey } from "../src/components/dateUtils.js";
import { pageTopic, PAGE_TOPICS, TOPIC_CONTENT_UPDATED } from "../src/data/pageTopics.js";

test("every sitemap page has visible topic guides and matching semantic relationships", () => {
  const sitemap=readFileSync("dist/sitemap.xml","utf8");
  const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]));
  for (const url of urls) {
    const path=url.pathname;
    const file=path==="/" ? "dist/index.html" : `dist${path}.html`;
    const html=readFileSync(file,"utf8");
    const day=html.match(/name="viikkonro-render-day" content="([^"]+)"/)?.[1];
    const context=pageTopic(path,dateFromDayKey(day));
    assert.ok(context,path);
    assert.ok(html.includes(`data-topic-id="${context.id}"`),path);
    const nodes=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const json=JSON.parse(m[1]);return json["@graph"] ?? [json];});
    const pages=nodes.filter(n=>n["@id"]===`${url.href}#webpage`);
    assert.equal(pages.length,1,path);
    const page=pages[0];
    assert.ok(page.description,path);
    if (day >= TOPIC_CONTENT_UPDATED) assert.ok(page.dateModified >= TOPIC_CONTENT_UPDATED,path);
    assert.ok(page.about.some(n=>n.name===context.topic.name),path);
    for (const l of context.links) {
      assert.ok(html.includes(`href="${l.to}"`),`${path}: visible ${l.to}`);
      assert.ok(page.relatedLink.includes(`${url.origin}${l.to}`),`${path}: semantic ${l.to}`);
      assert.ok(existsSync(`dist${l.to}.html`),l.to);
    }
    const canonical=[...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(canonical,[url.href],path);
  }
});

test("semantic topic registry points to existing guides and stays out of private and widget entries", () => {
  const graph=JSON.parse(readFileSync("dist/data/knowledge-graph.json","utf8"));
  assert.equal(graph.semanticTopics.length,Object.keys(PAGE_TOPICS).length);
  for (const topic of graph.semanticTopics) assert.ok(existsSync(`dist${new URL(topic.hub).pathname}.html`),topic.hub);
  for (const file of ["dist/tiimin-lomat/suunnittelu.html","dist/widget/calendar/v1.html","dist/404.html"]) {
    assert.ok(!readFileSync(file,"utf8").includes('data-topic-id="'),file);
  }
});

test("indexed page titles and descriptions are distinct, excluding redirect documents", () => {
  const sitemap=readFileSync("dist/sitemap.xml","utf8");
  const titles=new Map(),descriptions=new Map();
  for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path=new URL(match[1]).pathname;
    const html=readFileSync(path==="/" ? "dist/index.html" : `dist${path}.html`,"utf8");
    const title=html.match(/<title>([^<]*)<\/title>/)?.[1];
    const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    assert.ok(title,path);assert.ok(description,path);
    assert.ok(!titles.has(title),`${path}: duplicate title with ${titles.get(title)}`);
    assert.ok(!descriptions.has(description),`${path}: duplicate description with ${descriptions.get(description)}`);
    titles.set(title,path);descriptions.set(description,path);
  }
});

test("homepage and tool hub contain crawlable links to every directory tool", () => {
  for (const file of ["dist/index.html", "dist/laskurit.html"]) {
    const html = readFileSync(file,"utf8");
    const day = html.match(/name="viikkonro-render-day" content="([^"]+)"/)?.[1];
    assert.ok(day, file);
    for (const tool of toolGroups(dateFromDayKey(day)).flatMap(group => group.tools)) {
      assert.ok(html.includes(`href="${tool.to}"`), `${file}: ${tool.to}`);
      const [target, fragment] = tool.to.split("#");
      const targetFile = `dist${target}.html`;
      assert.ok(existsSync(targetFile), tool.to);
      if (fragment) assert.ok(readFileSync(targetFile, "utf8").includes(`id="${fragment}"`), tool.to);
    }
  }
});

test("related tool links are prerendered and preserve each calendar page year", () => {
  for (const year of [2026,2027,2028]) {
    for (const path of [`/kalenteri-${year}`, `/tyopaivat-${year}`, `/palkkapaivat-${year}`]) {
      const html=readFileSync(`dist${path}.html`,"utf8");
      for (const tool of relatedTools(path,new Date(Date.UTC(year,0,1,12)))) {
        assert.ok(html.includes(`href="${tool.to}"`), `${path}: ${tool.to}`);
        assert.ok(existsSync(`dist${tool.to}.html`), tool.to);
      }
      assert.ok(html.includes('href="/laskurit"'), path);
    }
  }
  for (const file of ["dist/en.html", "dist/tiimin-lomat/suunnittelu.html", "dist/widget/calendar/v1.html"]) assert.ok(!readFileSync(file,"utf8").includes('class="app related-tools'), file);
});

test("growth CTAs are prerendered without changing canonical URLs or free PDF links", () => {
  for (const year of [2026, 2027, 2028]) {
    for (const prefix of ["kalenteri", "tulostettava-kalenteri", "tulosta", "vuosi", "tyopaivat", "pyhapaivat", "palkkapaivat", "viikko-1"]) {
      const path = `/${prefix}-${year}`, html = readFileSync(`dist${path}.html`, "utf8");
      const intent = growthIntent(path);
      assert.equal((html.match(/class="growth-cta noprint"/g) || []).length, 1, path);
      assert.ok(html.includes(`href="${intent.href}"`), path);
      assert.ok(existsSync(`dist${intent.href}.html`), intent.href);
      assert.ok(html.includes(`rel="canonical" href="https://viikkonro.fi${path}"`), path);
      if (["kalenteri", "tulostettava-kalenteri"].includes(prefix)) {
        assert.ok(html.includes(`/pdf/kalenteri-${year}.pdf`), path);
        assert.ok(existsSync(`dist/pdf/kalenteri-${year}.pdf`));
      }
      if (prefix === "tulosta") assert.ok(html.includes(`/tulostettava-kalenteri-${year}`));
    }
  }
});

test("planner CTAs preserve existing pages and link to real inline editors", () => {
  for (const [path, id] of [["projektiaikataulu", "project-planner-pro"], ["sprinttisuunnittelija", "sprint-planner-pro"]]) {
    const html = readFileSync(`dist/${path}.html`, "utf8");
    assert.equal((html.match(/class="growth-cta noprint"/g) || []).length, 1);
    assert.ok(html.includes(`href="#${id}"`));
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.match(readFileSync("dist/lomasuunnittelija.html", "utf8"), /Suunnittele koko tiimin lomat/);
});

test("public growth CTAs do not enter private, health, English or widget pages", () => {
  for (const file of ["dist/en.html", "dist/raskauslaskuri.html", "dist/tiimin-lomat/suunnittelu.html", "dist/widget/calendar/v1.html"]) {
    assert.ok(existsSync(file), file);
    assert.ok(!readFileSync(file, "utf8").includes('class="growth-cta'), file);
  }
});
