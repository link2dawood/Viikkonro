import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { DATA_FEED_FAMILIES } from "../src/data/openDataContent.js";
import { holidayFaqs, holidayPageFor, VAPPU_UPDATED } from "../src/data/holidayPages.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const nodesFor = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap((match) => { const data = JSON.parse(match[1]); return data["@graph"] ?? [data]; });

test("data indexes remain JSON downloads with scoped noindex and discoverable datasets", () => {
  const config = JSON.parse(read("vercel.json"));
  const rule = config.headers.find((item) => item.source === "/data/(.*)/index.json");
  assert.deepEqual(rule.headers, [{ key: "X-Robots-Tag", value: "noindex, follow" }]);
  for (const extension of ["json", "csv", "xml"]) {
    const mime = config.headers.find((item) => item.source === `/data/(.*).${extension}`);
    assert.ok(mime.headers.some((header) => header.key === "Content-Type"));
    assert.ok(mime.headers.some((header) => header.key === "Access-Control-Allow-Origin" && header.value === "*"));
    assert.ok(!mime.headers.some((header) => header.key === "X-Robots-Tag"), "do not noindex all data or its HTML documentation");
  }
  const sitemap = read("dist/sitemap.xml"), docs = read("dist/avoin-data.html");
  const datasets = JSON.parse(read("dist/data/dataset.json"));
  const datasetText = JSON.stringify(datasets);
  for (const family of DATA_FEED_FAMILIES) {
    const manifest = JSON.parse(read(`dist${family.indexUrl}`));
    const entries = Object.values(manifest).find(Array.isArray);
    assert.ok(entries.length > 0, family.id);
    assert.ok(docs.includes(family.indexUrl), `human-readable documentation links ${family.id}`);
    assert.ok(datasetText.includes(family.indexUrl), `Dataset distribution remains discoverable: ${family.id}`);
    assert.ok(!sitemap.includes(`https://viikkonro.fi${family.indexUrl}`));
    assert.ok(!config.redirects.some((item) => item.source === family.indexUrl), "working JSON must not redirect to HTML");
    for (const entry of entries) {
      const pathname = new URL(entry.url ?? entry.indexUrl).pathname;
      assert.ok(fs.existsSync(new URL(`../dist${pathname}`, import.meta.url)), `manifest target exists: ${pathname}`);
    }
  }
  for (const path of ["/avoin-data", "/data/week", "/data/month", "/data/year", "/data/holiday", "/data/working-days"]) {
    const html = read(`dist${path}.html`);
    assert.match(html, /content="index, follow/);
    assert.ok(sitemap.includes(`https://viikkonro.fi${path}</loc>`));
  }
});

test("Vappu 2026-2028 remains canonical, indexable and useful before JavaScript", () => {
  const sitemap = read("dist/sitemap.xml");
  for (const year of [2026, 2027, 2028]) {
    const path = `/pyhat-${year}/vappu`, html = read(`dist${path}.html`).replace(/<!--[\s\S]*?-->/g, "");
    const page = holidayPageFor(year, "vappu"), nodes = nodesFor(html);
    assert.ok(html.includes(`<link rel="canonical" href="https://viikkonro.fi${path}"`));
    assert.match(html, /content="index, follow/);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    for (const text of ["Vappuaatto ja vappupäivä", "Vappu lähivuosina", "suomalaisen työn päivä", "työehtosopimuksesta", "30. huhtikuuta"]) assert.ok(html.includes(text), text);
    assert.ok(html.includes(`href="/tyopaivat-toukokuu-${year}"`));
    assert.ok(html.includes(`href="/liputuspaivat-${year}#vappu"`));
    assert.ok(html.includes(`href="/viikko-${page.week}-${page.weekYear}"`));
    assert.ok(html.includes(`href="/pyhat-${year - 1}/vappu"`));
    assert.ok(html.includes(`href="/pyhat-${year + 1}/vappu"`));
    const webpage = nodes.find((node) => node["@id"] === `https://viikkonro.fi${path}#webpage`);
    assert.equal(webpage["@type"], "WebPage");
    assert.equal(webpage.dateModified, VAPPU_UPDATED);
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    assert.equal(faq.dateModified, VAPPU_UPDATED);
    assert.deepEqual(faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]), holidayFaqs(page).map((item) => [item.q, item.a]));
    for (const question of holidayFaqs(page)) assert.ok(html.includes(question.q), "schema question is also visible");
    const entry = sitemap.match(new RegExp(`<url>\\s*<loc>https://viikkonro.fi${path}</loc>([\\s\\S]*?)</url>`));
    assert.ok(entry);
    assert.ok(entry[1].includes(`<lastmod>${VAPPU_UPDATED}</lastmod>`));
    for (const incoming of [`pyhapaivat-${year}`, `kuukausi-5-${year}`, `viikko-${page.week}-${page.weekYear}`]) {
      assert.ok(read(`dist/${incoming}.html`).includes(`href="${path}"`), incoming);
    }
  }
});
