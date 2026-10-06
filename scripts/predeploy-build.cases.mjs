import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { weeksInIsoYear } from "../src/components/dateUtils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const siteOrigin = "https://viikkonro.fi";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pageHtml(route) {
  const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
  return read(path.join("dist", file));
}

function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function structuredData(html) {
  const blocks = [...html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )];
  assert.ok(blocks.length > 0, "expected at least one JSON-LD block");
  return blocks.map((match) => JSON.parse(match[1]));
}

function schemaTypes(documents) {
  return new Set(documents.flatMap((document) => {
    const nodes = document["@graph"] || [document];
    return nodes.flatMap((node) => node["@type"] || []);
  }));
}

function sitemapLocations() {
  const xml = read("dist/sitemap.xml");
  return [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g)]
    .map((match) => match[1]);
}

test("PD-01 generates every critical SEO landing page with indexable self-canonicals", () => {
  const cases = [
    ["/", /^Viikkonumero \d+ /],
    ["/parillinen-pariton-viikko", /^Parillinen vai pariton viikko/],
    ["/koululomat-2028", /^Syysloma 2028/],
    ["/mika-on-viikkonumero", /^Viikkonumero:/],
    ["/tyopaivalaskuri", /^Työpäivälaskuri/],
    ["/tyopaivat-2026", /^Työpäivät 2026:/],
    ["/viikko-42-2026", /^Viikko 42 vuonna 2026/],
    ["/en", /^Week Number Today:/],
  ];

  for (const [route, titlePattern] of cases) {
    const html = withoutComments(pageHtml(route));
    const expectedCanonical = route === "/" ? `${siteOrigin}/` : `${siteOrigin}${route}`;
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "";
    assert.match(title, titlePattern, `${route} title`);
    assert.match(html, /<meta name="description" content="[^"]+"\s*\/>/, `${route} description`);
    assert.ok(
      html.includes(`<link rel="canonical" href="${expectedCanonical}" />`),
      `${route} canonical`,
    );
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/i, `${route} must remain indexable`);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${route} should have one visible h1`);
  }
});

test("PD-02 keeps the sitemap HTML-only, unique, and complete for new routes", () => {
  const locations = sitemapLocations();
  assert.ok(locations.length >= 1000, `expected at least 1000 sitemap URLs, got ${locations.length}`);
  assert.equal(new Set(locations).size, locations.length, "sitemap URLs must be unique");
  assert.ok(locations.every((url) => url.startsWith(`${siteOrigin}/`)), "all sitemap URLs use production origin");
  assert.ok(locations.every((url) => !url.toLowerCase().endsWith(".pdf")), "PDFs stay out of sitemap");
  for (const route of [
    "/parillinen-pariton-viikko",
    "/koululomat-2028",
    "/mika-on-viikkonumero",
    "/tyopaivalaskuri",
    "/en",
  ]) {
    assert.ok(locations.includes(`${siteOrigin}${route}`), `${route} must be in sitemap`);
  }
});

test("PD-03 emits parseable required schema on the new landing pages", () => {
  const cases = [
    ["/parillinen-pariton-viikko", ["WebPage", "Article", "FAQPage", "BreadcrumbList"]],
    ["/koululomat-2028", ["WebPage", "Article", "FAQPage", "BreadcrumbList"]],
    ["/tyopaivalaskuri", ["WebPage", "FAQPage", "BreadcrumbList"]],
  ];
  for (const [route, requiredTypes] of cases) {
    const types = schemaTypes(structuredData(pageHtml(route)));
    for (const type of requiredTypes) {
      assert.ok(types.has(type), `${route} is missing ${type} schema`);
    }
  }
});

test("PD-04 renders seven valid same-week links and excludes impossible week 53 pages", () => {
  const regularHtml = pageHtml("/viikko-42-2026");
  const regularYears = [...new Set(
    [...regularHtml.matchAll(/href="\/viikko-42-(\d{4})"/g)].map((match) => Number(match[1])),
  )];
  assert.equal(regularYears.length, 7);
  assert.ok(!regularYears.includes(2026));
  for (const year of regularYears) {
    assert.ok(fs.existsSync(path.join(dist, `viikko-42-${year}.html`)), `missing week 42 page for ${year}`);
  }

  const week53Html = pageHtml("/viikko-53-2026");
  const week53Years = [...new Set(
    [...week53Html.matchAll(/href="\/viikko-53-(\d{4})"/g)].map((match) => Number(match[1])),
  )];
  assert.ok(week53Years.length > 0, "week 53 should have at least one valid cross-year link");
  assert.ok(week53Years.every((year) => weeksInIsoYear(year) === 53));
});

test("PD-05 preserves sourced 2028 school-holiday limits in generated HTML", () => {
  const html = withoutComments(pageHtml("/koululomat-2028"));
  for (const source of ["Helsingin kaupunki", "Turun kaupunki", "Tampereen kaupunki", "Joensuun kaupunki", "Oulun kaupunki"]) {
    assert.ok(html.includes(source), `missing official source: ${source}`);
  }
  assert.ok(html.includes("Ei vielä julkaistua ajankohtaa"));
  assert.ok(html.includes("Sisältö ja lähteet tarkistettu 2026-10-05"));
  assert.doesNotMatch(html, /Tiedot perustuvat aiempien vuosien käytäntöihin/);
});

test("PD-06 keeps every generated PDF downloadable while canonicalizing its family", () => {
  const pdfDirectory = path.join(dist, "pdf");
  const pdfs = fs.readdirSync(pdfDirectory).filter((name) => name.endsWith(".pdf"));
  assert.ok(pdfs.length >= 1000, `expected at least 1000 generated PDFs, got ${pdfs.length}`);
  for (const representative of [
    "kalenteri-2027.pdf",
    "viikko-42-2026.pdf",
    "kuukausi-10-2026.pdf",
  ]) {
    assert.ok(pdfs.includes(representative), `missing ${representative}`);
  }

  const config = JSON.parse(read("vercel.json"));
  const canonicalRules = config.headers
    .filter((rule) => rule.source.startsWith("/pdf/") && rule.headers.some((header) => header.key === "Link"))
    .map((rule) => [rule.source, rule.headers.find((header) => header.key === "Link").value]);
  assert.deepEqual(canonicalRules, [
    ["/pdf/kalenteri-:year(\\d{4}).pdf", '<https://viikkonro.fi/kalenteri-:year>; rel="canonical"'],
    ["/pdf/viikko-:week(\\d{1,2})-:year(\\d{4}).pdf", '<https://viikkonro.fi/viikko-:week-:year>; rel="canonical"'],
    ["/pdf/kuukausi-:month(\\d{1,2})-:year(\\d{4}).pdf", '<https://viikkonro.fi/kuukausi-:month-:year>; rel="canonical"'],
  ]);
});

test("PD-07 preserves English language, reciprocal hreflang, and Finnish inbound discovery", () => {
  const english = pageHtml("/en");
  const home = pageHtml("/");
  assert.ok(english.includes('<html lang="en">'));
  assert.ok(english.includes('<link rel="alternate" hreflang="fi" href="https://viikkonro.fi/" />'));
  assert.ok(english.includes('<link rel="alternate" hreflang="en" href="https://viikkonro.fi/en" />'));
  assert.ok(english.includes('<link rel="alternate" hreflang="x-default" href="https://viikkonro.fi/" />'));
  assert.ok(home.includes('href="/en"'));
});

test("PD-08 rejects unresolved merge markers in deployable text artifacts", () => {
  const extensions = new Set([".html", ".xml", ".txt", ".json"]);
  const files = fs.readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name)))
    .map((entry) => path.join(entry.parentPath, entry.name));
  const marker = /^(?:<<<<<<<|=======|>>>>>>>)(?: |$)/m;
  const affected = files
    .filter((file) => marker.test(fs.readFileSync(file, "utf8")))
    .map((file) => path.relative(dist, file));
  assert.deepEqual(affected, []);
});

test("PD-09 publishes the company calendar page as an indexable, linked, schema-complete landing page", () => {
  const html = withoutComments(pageHtml("/yrityskalenteri"));
  assert.match(html, /<title>[^<]{10,60}<\/title>/);
  assert.ok(html.includes('<link rel="canonical" href="https://viikkonro.fi/yrityskalenteri" />'));
  assert.ok(!/noindex/i.test(html));
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.ok(html.includes("Luo yrityksellesi oma kalenteri"));
  assert.ok(html.includes("cc-watermark"), "the free preview is watermarked");
  const types = schemaTypes(structuredData(html));
  for (const type of ["WebPage", "FAQPage", "HowTo", "BreadcrumbList"]) assert.ok(types.has(type), type);
  assert.ok(sitemapLocations().includes(`${siteOrigin}/yrityskalenteri`));
  // Reachable from the existing calendar and print pages.
  for (const route of ["/kalenteri-2027", "/tulostettava-kalenteri-2027", "/tulosta-2027"]) {
    assert.ok(pageHtml(route).includes('href="/yrityskalenteri"'), route);
  }
});

test("PD-10 keeps the development unlock and the 2 MB PDF library out of every page load", () => {
  const assets = fs.readdirSync(path.join(dist, "assets")).filter((name) => name.endsWith(".js"));
  const sources = Object.fromEntries(assets.map((name) => [name, read(path.join("dist", "assets", name))]));
  // No production script contains the development unlock or its UI text.
  for (const [name, source] of Object.entries(sources)) {
    for (const needle of ["dev-unlock", "Avaa lataukset (testi)", "Kehitystila", "viikkonro:dev-license"]) {
      assert.ok(!source.includes(needle), `${name} contains "${needle}"`);
    }
  }
  // The PDF library is its own chunk, and the entry script does not embed it.
  const pdfChunks = assets.filter((name) => sources[name].includes("StartFontMetrics"));
  assert.deepEqual(pdfChunks.length, 1, "exactly one chunk carries pdfkit");
  assert.ok(pdfChunks[0].startsWith("pdfkit-"), `pdfkit chunk is ${pdfChunks[0]}`);
  const entry = /<script type="module"[^>]*src="\/assets\/([^"]+\.js)"/.exec(pageHtml("/yrityskalenteri"))[1];
  assert.ok(!sources[entry].includes("StartFontMetrics"), "the entry script must not embed pdfkit");
  const preloaded = [...pageHtml("/yrityskalenteri").matchAll(/rel="modulepreload"[^>]*href="\/assets\/([^"]+)"/g)].map((m) => m[1]);
  assert.ok(!preloaded.some((name) => name.startsWith("pdfkit-")), "pdfkit must not be preloaded");
});
