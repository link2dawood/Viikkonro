import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { DATA_FEED_FAMILIES } from "../src/data/openDataContent.js";
import { weeksInIsoYear } from "../src/components/dateUtils.js";
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

test("week pages only index the current and next year while preserving the wider non-week window", () => {
  const sitemap = read("dist/sitemap.xml");
  const robotsFor = (html) => html.match(/<meta\s+name="robots"\s+content="([^"]+)"/)?.[1];
  // The build renders the homepage with Finland's current calendar year.
  const year = Number(read("dist/index.html").match(/name="viikkonro-render-day" content="(\d{4})-/)?.[1]);
  assert.ok(Number.isInteger(year) && year > 2000, "build year comes from the rendered day");
  const weekPaths = [...sitemap.matchAll(/<loc>https:\/\/viikkonro\.fi(\/viikko-\d+-(\d{4}))<\/loc>/g)];
  assert.equal(weekPaths.length, weeksInIsoYear(year) + weeksInIsoYear(year + 1));
  for (const [, pathname, pageYear] of weekPaths) {
    assert.ok(Number(pageYear) >= year && Number(pageYear) <= year + 1, pathname);
  }
  for (const pageYear of [year - 2, year - 1, year, year + 1, year + 2, year + 4]) {
    const pathname = `/viikko-42-${pageYear}`;
    const html = read(`dist${pathname}.html`);
    const indexable = pageYear === year || pageYear === year + 1;
    assert.match(robotsFor(html), new RegExp(`^${indexable ? "index" : "noindex"}, follow`), pathname);
    assert.equal(sitemap.includes(`https://viikkonro.fi${pathname}</loc>`), indexable, pathname);
    // PDFs are generated for the whole horizon regardless of the HTML page's
    // index status. They are noindex downloads (constitution rule 5), so an
    // out-of-window year keeps its file instead of losing the download button.
    assert.ok(fs.existsSync(new URL(`../dist/pdf/viikko-42-${pageYear}.pdf`, import.meta.url)), "PDF still downloadable");
    assert.ok(
      read(`dist${pathname}.html`).includes(`href="/pdf/viikko-42-${pageYear}.pdf"`),
      `${pathname} keeps its visible PDF download link`,
    );
    const month = `/kuukausi-10-${pageYear}`;
    assert.match(robotsFor(read(`dist${month}.html`)), /^index, follow/);
    assert.ok(sitemap.includes(`https://viikkonro.fi${month}</loc>`), "non-week window is unchanged");
  }
  for (const pageYear of [year - 3, year + 5]) {
    assert.match(robotsFor(read(`dist/kuukausi-10-${pageYear}.html`)), /^noindex, follow/);
    assert.ok(!sitemap.includes(`https://viikkonro.fi/kuukausi-10-${pageYear}</loc>`));
  }
  assert.ok(!/<loc>[^<]*\/pdf\//.test(sitemap), "all PDFs remain outside the sitemap");
  const reference = read("dist/llms-full.txt");
  assert.ok(reference.includes(`${year}-${year + 1} indexing window`));
  assert.ok(reference.includes(`${year - 2}-${year + 4} window`));
});
