import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { DATA_FEED_FAMILIES } from "../src/data/openDataContent.js";
import { PRERENDER_MIN_YEAR, PRERENDER_MAX_YEAR, weeksInIsoYear } from "../src/components/dateUtils.js";
import { holidayFaqs, holidayPageFor, VAPPU_UPDATED } from "../src/data/holidayPages.js";
import { readSitemapSet } from "./sitemap-set.mjs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const readSitemap = readSitemapSet;
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
  const sitemap = readSitemap(), docs = read("dist/avoin-data.html");
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
  const sitemap = readSitemap();
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

test("every valid published week is indexable with canonical, schema and sitemap coverage", () => {
  const sitemap = readSitemap();
  const weekLocations = [...sitemap.matchAll(/<loc>(https:\/\/viikkonro\.fi\/viikko-\d+-\d{4})<\/loc>/g)].map((match) => match[1]);
  let expectedWeeks = 0;
  for (let year = PRERENDER_MIN_YEAR; year <= PRERENDER_MAX_YEAR; year += 1) {
    expectedWeeks += weeksInIsoYear(year);
    const yearCanonical = `https://viikkonro.fi/vuosi-${year}`;
    const yearNodes = nodesFor(read(`dist/vuosi-${year}.html`));
    const yearPages = yearNodes.filter((node) => node["@id"] === `${yearCanonical}#webpage`);
    assert.equal(yearPages.length, 1, `${year}: week parent exists even on noindex year hubs`);
    assert.equal(yearPages[0]["@type"], "CollectionPage", `${year}: preserve year collection schema`);
    for (let week = 1; week <= weeksInIsoYear(year); week += 1) {
      const pathname = `/viikko-${week}-${year}`;
      const canonical = `https://viikkonro.fi${pathname}`;
      const html = read(`dist${pathname}.html`);
      const robots = [...html.matchAll(/<meta\s+name="robots"\s+content="([^"]+)"/g)];
      assert.equal(robots.length, 1, `${pathname}: one robots directive`);
      assert.match(robots[0][1], /^index, follow/, pathname);
      assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), pathname);
      assert.ok(weekLocations.includes(canonical), `${pathname}: sitemap entry`);
      const nodes = nodesFor(html);
      assert.equal(nodes.filter((node) => node["@id"] === `${canonical}#webpage`).length, 1, `${pathname}: page schema`);
      assert.ok(nodes.some((node) => node["@type"] === "FAQPage"), `${pathname}: FAQ schema`);
      const page = nodes.find((node) => node["@id"] === `${canonical}#webpage`);
      assert.ok(page.isPartOf.some((parent) => parent["@id"] === `${yearCanonical}#webpage`), `${pathname}: year relationship`);
      assert.ok(html.includes(`href="/pdf${pathname}.pdf"`), `${pathname}: visible PDF download`);
    }
  }
  assert.equal(weekLocations.length, expectedWeeks, "all valid weeks, no extra week URLs");
  assert.equal(new Set(weekLocations).size, expectedWeeks, "no duplicate week URLs");
  assert.ok(!/<loc>[^<]*\/pdf\//.test(sitemap), "PDF downloads stay outside the sitemap");
  assert.ok(read("dist/llms-full.txt").includes(`full ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR} indexing window`));
});

test("the six Search Console noindex examples are eligible for indexing", () => {
  const sitemap = readSitemap();
  for (const pathname of [
    "/viikko-25-2030", "/viikko-51-2023", "/viikko-17-2029",
    "/viikko-50-2025", "/viikko-30-2033", "/viikko-28-2030",
  ]) {
    assert.match(read(`dist${pathname}.html`), /<meta\s+name="robots"\s+content="index, follow/);
    assert.ok(sitemap.includes(`https://viikkonro.fi${pathname}</loc>`), pathname);
    assert.ok(fs.existsSync(new URL(`../dist/pdf${pathname}.pdf`, import.meta.url)), `${pathname}: PDF exists`);
  }
});

// Narrowed on 2026-11-21 from currentYear-2..currentYear+4 to
// currentYear-1..currentYear+2 (user-approved thin-URL pruning). The years
// just outside each edge are asserted as noindex here, so a silent widening
// back to the old window fails. Weeks and named holidays are deliberately
// exempt and keep their own full-horizon coverage, asserted above.
test("non-week dated pages keep the narrowed indexing window", () => {
  const sitemap = readSitemap();
  const year = Number(read("dist/index.html").match(/name="viikkonro-render-day" content="(\d{4})-/)?.[1]);
  assert.ok(Number.isInteger(year) && year > 2000, "build year comes from the rendered day");
  for (const pageYear of [year - 1, year, year + 1, year + 2]) {
    const pathname = `/kuukausi-10-${pageYear}`;
    assert.match(read(`dist${pathname}.html`), /<meta\s+name="robots"\s+content="index, follow/);
    assert.ok(sitemap.includes(`https://viikkonro.fi${pathname}</loc>`), pathname);
  }
  for (const pageYear of [year - 3, year - 2, year + 3, year + 5]) {
    const pathname = `/kuukausi-10-${pageYear}`;
    assert.match(read(`dist${pathname}.html`), /<meta\s+name="robots"\s+content="noindex, follow/);
    assert.ok(!sitemap.includes(`https://viikkonro.fi${pathname}</loc>`), pathname);
    const yearPath = `/vuosi-${pageYear}`;
    assert.match(read(`dist${yearPath}.html`), /<meta\s+name="robots"\s+content="noindex, follow/);
    assert.ok(!sitemap.includes(`https://viikkonro.fi${yearPath}</loc>`), yearPath);
    // Pruned years stay live and crawlable, and keep their one entry point.
    assert.ok(read("dist/kaikki-vuodet.html").includes(`href="${yearPath}"`), `${yearPath}: linked from the year index`);
  }
  assert.ok(read("dist/llms-full.txt").includes(`${year - 1}-${year + 2} window`));
});

// The year index is the single crawl path to every pruned year, so it has to
// stay indexable, reachable and complete.
test("the year index links every published year and stays indexable", () => {
  const html = read("dist/kaikki-vuodet.html");
  const sitemap = readSitemap();
  assert.match(html, /<meta\s+name="robots"\s+content="index, follow/);
  assert.ok(html.includes('rel="canonical" href="https://viikkonro.fi/kaikki-vuodet"'));
  assert.ok(sitemap.includes("https://viikkonro.fi/kaikki-vuodet</loc>"));
  for (let year = PRERENDER_MIN_YEAR; year <= PRERENDER_MAX_YEAR; year += 1) {
    assert.ok(html.includes(`href="/vuosi-${year}"`), `/vuosi-${year}: visible link`);
  }
  // CollectionPage + an ItemList covering the full horizon (invariant 11).
  const nodes = nodesFor(html);
  const page = nodes.find((node) => node["@id"] === "https://viikkonro.fi/kaikki-vuodet#webpage");
  assert.equal(page["@type"], "CollectionPage");
  const list = nodes.find((node) => node["@id"] === "https://viikkonro.fi/kaikki-vuodet#years");
  assert.equal(list.itemListElement.length, PRERENDER_MAX_YEAR - PRERENDER_MIN_YEAR + 1);
  // The homepage keeps the hub one click away.
  assert.ok(read("dist/index.html").includes('href="/kaikki-vuodet"'));
});

// The split is a packaging change: the union of the children must still be
// every indexable page, each page in exactly one child, and the index must
// reference only children that exist.
test("sitemap.xml is an index whose children partition the indexable set", () => {
  const index = read("dist/sitemap.xml");
  assert.match(index, /<sitemapindex/);
  const files = [...index.matchAll(/<loc>[^<]*\/(sitemap-[^/<]+\.xml)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(files, ["sitemap-weeks.xml", "sitemap-holidays.xml", "sitemap-calendars.xml", "sitemap-pages.xml"]);
  const seen = new Map();
  for (const file of files) {
    const child = read(`dist/${file}`);
    assert.match(child, /<urlset/);
    const locs = [...child.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.ok(locs.length > 0, `${file}: not empty`);
    for (const loc of locs) {
      assert.ok(!seen.has(loc), `${loc} appears in both ${seen.get(loc)} and ${file}`);
      seen.set(loc, file);
    }
  }
  // Every week page in the sitemap set lands in the weeks child, and nothing else does.
  for (const [loc, file] of seen) {
    const isWeek = /\/viikko-\d+-\d{4}$/.test(new URL(loc).pathname);
    assert.equal(isWeek, file === "sitemap-weeks.xml", `${loc} -> ${file}`);
  }
  assert.equal(seen.size, [...readSitemap().matchAll(/<loc>/g)].length);
});

test("dataset landing pages reuse the shared Dataset and link real download formats", () => {
  const shared = JSON.parse(read("dist/data/dataset.json"))["@graph"];
  const home = nodesFor(read("dist/index.html"));
  const openData = nodesFor(read("dist/avoin-data.html"));
  const sitemap = readSitemap();
  const families = {
    week: "week", month: "month", year: "year",
    holiday: "holidays", "working-days": "monthly-workingdays",
  };
  for (const [family, id] of Object.entries(families)) {
    const pathname = `/data/${family}`;
    const canonical = `https://viikkonro.fi${pathname}`;
    const html = read(`dist${pathname}.html`);
    const nodes = nodesFor(html);
    const datasets = nodes.filter((node) => node["@type"] === "Dataset");
    assert.equal(datasets.length, 1, pathname);
    const dataset = datasets[0];
    assert.equal(dataset["@id"], `https://viikkonro.fi/#dataset-${id}`, "preserve dataset identity, including aliases");
    for (const graph of [shared, home, openData]) {
      assert.deepEqual(dataset, graph.find((node) => node["@id"] === dataset["@id"]), "one shared dataset definition");
    }
    assert.equal(dataset.url, canonical);
    assert.equal(dataset.mainEntityOfPage["@id"], `${canonical}#webpage`);
    const page = nodes.find((node) => node["@id"] === `${canonical}#webpage`);
    assert.equal(page.mainEntity["@id"], dataset["@id"]);
    assert.match(html, /<meta\s+name="robots"\s+content="index, follow/);
    assert.ok(sitemap.includes(`${canonical}</loc>`));
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`));
    assert.ok(nodes.some((node) => node["@type"] === "FAQPage"), "keep existing FAQ schema");
    for (const format of ["application/json", "text/csv", "application/xml"]) {
      const download = dataset.distribution.find((item) => item.encodingFormat === format);
      assert.equal(download?.["@type"], "DataDownload", `${family}: ${format}`);
      const path = new URL(download.contentUrl).pathname;
      assert.ok(fs.existsSync(new URL(`../dist${path}`, import.meta.url)), `${family}: download exists`);
      if (format !== "application/json") {
        assert.ok(html.includes(`/data/${family}`) && html.includes(format === "text/csv" ? ".csv" : ".xml"), "visible page documents the advertised formats");
      }
    }
  }
});
