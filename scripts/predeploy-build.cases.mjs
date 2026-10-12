import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { weeksInIsoYear } from "../src/components/dateUtils.js";
import { TEMPLATE_PATH, TEMPLATES, templatePath } from "../src/platform/templates/catalog.js";
import { COMPANY_ICS_PATH, companyIcsFaqs } from "../src/data/companyIcs.js";
import { PLANNER_PATH, PLANNER_UPDATED, plannerFaqs } from "../src/data/vacationPlanner.js";
import { projectFaqs, PROJECT_UPDATED } from "../src/data/projectTimeline.js";
import { sprintFaqs } from "../src/data/sprintPlanner.js";
import { CONSTRUCTION_PATH, CONSTRUCTION_UPDATED, constructionFaqs } from "../src/data/constructionCalendar.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const siteOrigin = "https://viikkonro.fi";

test("dataset MIME rules distinguish documentation HTML from downloadable data", () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const rules = config.headers.filter(rule => rule.source.startsWith("/data/"));
  const mimeRules = rules.filter(rule => rule.headers.some(header => header.key.toLowerCase() === "content-type"));
  assert.deepEqual(mimeRules.map(rule => rule.source).sort(), ["/data/(.*).csv", "/data/(.*).json", "/data/(.*).xml"]);
  for (const family of ["week", "month", "year", "holiday", "working-days"]) {
    const html = fs.readFileSync(path.join(dist, `data/${family}.html`), "utf8");
    assert.match(html, /<main/);
    assert.match(html, /<h1/);
  }
});

test("every prerendered site page retains the shared header, main and footer", () => {
  const pages = fs.readdirSync(dist, { recursive: true }).filter((file) =>
    file.endsWith(".html") && !file.startsWith("widget/") && file !== "tiimin-lomat/suunnittelu.html");
  assert.ok(pages.length > 1000, "check the full generated site, not only sample routes");
  for (const file of pages) {
    const html = fs.readFileSync(path.join(dist, file), "utf8");
    if (html.includes('http-equiv="refresh"')) continue; // Redirect documents have no page content.
    assert.match(html, /<header class="nav"/, `${file}: site header`);
    assert.match(html, /<main id="main"/, `${file}: main landmark`);
    assert.match(html, /<footer class="site-footer"/, `${file}: site footer`);
  }
  const css = fs.readdirSync(path.join(dist, "assets"))
    .filter((file) => file.endsWith(".css"))
    .map((file) => fs.readFileSync(path.join(dist, "assets", file), "utf8")).join("\n");
  assert.doesNotMatch(css, /body:has\(\.cal-print\)\s+(?:header|footer)/,
    "printable calendar pages must keep site navigation visible on screen");
});

test("business widget v1 is small, isolated, embeddable and absent from sitemap", () => {
  const html = read("dist/widget/calendar/v1.html"), script = read("dist/widget/calendar/v1.js");
  assert.match(html, /noindex, follow/);
  assert.match(html, /\/widget\/calendar\/v1.js/);
  assert.ok(Buffer.byteLength(script) < 25000, "widget must stay below 25 KB raw");
  assert.doesNotMatch(script, /supabase|clarity|gtag|localStorage|sessionStorage|XMLHttpRequest/);
  assert.doesNotMatch(read("dist/sitemap.xml"), /\/widget\//);
  assert.match(pageHtml("/upota-viikkonumero"), /yrityskalenteri-widget/);
  const headers = JSON.parse(read("vercel.json")).headers.find((rule) => rule.source === "/widget/calendar/(.*)").headers;
  assert.ok(headers.some((header) => header.key === "Content-Security-Policy" && header.value.includes("connect-src 'none'") && header.value.includes("frame-ancestors *")));
  for (const file of ["ai.txt","llms.txt","llms-full.txt","llms-api.txt","llms-data.txt","llms-glossary.txt","ai-manifest.txt","data/knowledge-graph.json"]) assert.match(read(`dist/${file}`), /\/widget\/calendar\/v1/);
});

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

test("PD-16 publishes a substantive construction planner without private project assets", () => {
  const html = withoutComments(pageHtml(CONSTRUCTION_PATH));
  assert.ok(html.includes('<link rel="canonical" href="https://viikkonro.fi/rakennuskalenteri" />'));
  assert.ok(!/noindex/i.test(html));
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  for (const marker of ['id="c-project"', 'id="c-site"', "Viikkoaikataulu", "Projektin yleiskuva", "Tulosta aikataulu", "Lataa PDF", "Lataa Excel", "Lataa CSV", "Lataa ICS"]) assert.ok(html.includes(marker));
  const documents = structuredData(html), nodes = documents.flatMap((document) => document["@graph"] || [document]);
  const types = schemaTypes(documents);
  for (const type of ["WebPage", "FAQPage", "HowTo", "BreadcrumbList"]) assert.ok(types.has(type));
  const faq = nodes.find((node) => node["@type"] === "FAQPage");
  assert.deepEqual(faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]), constructionFaqs().map((item) => [item.q, item.a]));
  assert.equal(faq.dateModified, CONSTRUCTION_UPDATED);
  assert.equal(sitemapLocations().filter((location) => location === `${siteOrigin}${CONSTRUCTION_PATH}`).length, 1);
  for (const source of ["/laskurit", "/projektiaikataulu", "/kalenteripohjat/rakennustyomaan-viikkoaikataulu"]) assert.ok(pageHtml(source).includes('href="/rakennuskalenteri"'));
  for (const file of ["ai.txt", "llms.txt", "llms-full.txt", "llms-api.txt", "llms-data.txt", "llms-glossary.txt", "ai-manifest.txt", "data/knowledge-graph.json"]) assert.ok(read(`dist/${file}`).includes("/rakennuskalenteri"));
  assert.deepEqual(fs.readdirSync(path.join(dist, "ics")).sort(), ["liputuspaivat.ics", "pyhapaivat.ics", "viikkonumerot.ics"]);
});

test("PD-15 keeps the planning suite on existing SEO routes with matching FAQs", () => {
  for (const [route, faqs] of [["/projektiaikataulu", projectFaqs], ["/sprinttisuunnittelija", sprintFaqs]]) {
    const html = withoutComments(pageHtml(route));
    for (const label of ["Suunnitelma ja lataukset", "Lataa PDF", "Lataa Excel", "Lataa ICS"]) assert.ok(html.includes(label));
    assert.ok(html.includes(`href="${siteOrigin}${route}"`));
    const nodes = structuredData(html).flatMap((document) => document["@graph"] || [document]);
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    assert.deepEqual(faq.mainEntity.map((item) => item.name), faqs().map((item) => item.q));
    assert.equal(faq.dateModified, PROJECT_UPDATED);
    assert.equal(sitemapLocations().filter((location) => location === `${siteOrigin}${route}`).length, 1);
  }
  for (const route of ["/kalenteri-2027", "/viikko-24-2027", "/tyopaivalaskuri"]) {
    for (const target of ["/projektiaikataulu", "/sprinttisuunnittelija"]) assert.ok(pageHtml(route).includes(`href="${target}"`), `${route} -> ${target}`);
  }
});

test("PD-14 upgrades the free vacation page without a duplicate route or private assets", () => {
  const html = withoutComments(pageHtml(PLANNER_PATH));
  for (const marker of ['id="v-year"', 'id="v-leave"', 'id="vuosisuunnitelma"', "Yhteinen kalenterinäkymä", "Lataa PDF", "Lataa Excel", "Lataa ICS"]) assert.ok(html.includes(marker), marker);
  assert.ok(html.includes(`href="${siteOrigin}${PLANNER_PATH}"`));
  const nodes = structuredData(html).flatMap((document) => document["@graph"] || [document]);
  const faq = nodes.find((node) => node["@type"] === "FAQPage");
  assert.deepEqual(faq.mainEntity.map((item) => item.name), plannerFaqs().map((item) => item.q));
  assert.equal(faq.dateModified, PLANNER_UPDATED);
  assert.equal(sitemapLocations().filter((location) => location === `${siteOrigin}${PLANNER_PATH}`).length, 1);
  assert.ok(!sitemapLocations().some((location) => location.includes("lomasuunnittelija-pro")));
  assert.ok(read("dist/ai-manifest.txt").includes("Vacation Planner Pro"));
  assert.deepEqual(fs.readdirSync(path.join(dist, "ics")).sort(), ["liputuspaivat.ics", "pyhapaivat.ics", "viikkonumerot.ics"]);
});

test("PD-13 publishes the private ICS guide without company feeds or private URLs", () => {
  const html = withoutComments(pageHtml(COMPANY_ICS_PATH));
  assert.ok(html.includes(`href="${siteOrigin}${COMPANY_ICS_PATH}"`));
  assert.ok(html.includes("Yrityksen ICS-kalenteri"));
  assert.ok(html.includes("Google Kalenteri"));
  assert.ok(html.includes("Outlook verkossa"));
  assert.ok(html.includes("Apple Kalenteri Macissa"));
  assert.ok(html.includes('href="/kalenteritilaus"'));
  assert.ok(html.includes("Yrityksen omille päiville ei julkaista tilausosoitetta"));
  for (const item of companyIcsFaqs()) assert.ok(html.includes(item.q));
  const nodes = structuredData(html).flatMap((document) => document["@graph"] || [document]);
  const types = schemaTypes(structuredData(html));
  for (const type of ["WebPage", "BreadcrumbList", "FAQPage", "HowTo"]) assert.ok(types.has(type), `missing ${type}`);
  const faq = nodes.find((node) => node["@type"] === "FAQPage");
  assert.deepEqual(faq.mainEntity.map((question) => question.name), companyIcsFaqs().map((item) => item.q));
  assert.ok(sitemapLocations().includes(`${siteOrigin}${COMPANY_ICS_PATH}`));
  assert.ok(pageHtml("/yrityskalenteri").includes(`href="${COMPANY_ICS_PATH}"`));
  assert.deepEqual(fs.readdirSync(path.join(dist, "ics")).sort(), ["liputuspaivat.ics", "pyhapaivat.ics", "viikkonumerot.ics"]);
  assert.ok(read("dist/ai-manifest.txt").includes(COMPANY_ICS_PATH));
  assert.ok(read("dist/data/knowledge-graph.json").includes(COMPANY_ICS_PATH));
});

test("PD-12 publishes substantive template pages and all 54 downloadable artifacts", () => {
  const catalog = pageHtml(TEMPLATE_PATH);
  assert.ok(schemaTypes(structuredData(catalog)).has("CollectionPage"));
  const sitemap = sitemapLocations();
  const titles = new Set();
  const descriptions = new Set();
  let assets = 0;
  for (const template of TEMPLATES) {
    const route = templatePath(template);
    const html = pageHtml(route);
    assert.ok(catalog.includes(`href="${route}"`));
    assert.ok(sitemap.includes(siteOrigin + route));
    assert.ok(html.includes(`<link rel="canonical" href="${siteOrigin}${route}" />`));
    assert.ok(html.includes(template.description));
    assert.ok(html.includes(template.limitation));
    titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
    descriptions.add(html.match(/<meta name="description" content="(.*?)"/)[1]);
    const nodes = structuredData(html).flatMap((document) => document["@graph"] || [document]);
    assert.equal(nodes.filter((node) => node["@id"] === `${siteOrigin}${route}#webpage`).length, 1);
    const page = nodes.find((node) => node["@id"] === `${siteOrigin}${route}#webpage`);
    assert.equal(page.associatedMedia.length, 9);
    assert.equal(page.potentialAction.length, 9);
    assert.ok(schemaTypes(structuredData(html)).has("CreativeWork"));
    for (const asset of template.downloadableAssets) {
      assert.ok(html.includes(`href="${asset.path}"`), `visible link: ${asset.path}`);
      const bytes = fs.readFileSync(path.join(dist, asset.path));
      assert.ok(bytes.length > 100);
      assets += 1;
      if (asset.format === "pdf") {
        assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
        assert.ok(bytes.subarray(-10).toString().includes("%%EOF"));
        assert.ok(html.includes(`type="application/pdf" title="${asset.year}" href="${siteOrigin}${asset.path}"`));
      } else if (asset.format === "xlsx") {
        assert.equal(bytes.subarray(0, 2).toString(), "PK");
        assert.ok(bytes.toString().includes("Päivämääräviite"));
        assert.ok(bytes.toString().includes("Suunnitelma"));
      } else {
        assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
        const csv = bytes.toString("utf8");
        assert.ok(csv.includes("ISO-viikkovuosi"));
        assert.ok(csv.includes("Itsenäisyyspäivä"));
        if (template.id === "shifts" || template.id === "company") {
          assert.equal(csv.split("\r\n").length - 1, asset.year === 2028 ? 366 : 365);
          if (asset.year === 2028) assert.ok(csv.includes("2028-02-29"));
        }
      }
    }
  }
  assert.equal(assets, 54); assert.equal(titles.size, 6); assert.equal(descriptions.size, 6);
  const headers = JSON.parse(read("vercel.json")).headers;
  assert.ok(headers.some((rule) => rule.source === "/pohjat/:slug/:year.pdf" && rule.headers.some((header) => header.key === "Link" && header.value === '<https://viikkonro.fi/kalenteripohjat/:slug>; rel="canonical"')));
  for (const file of ["llms.txt", "ai.txt", "llms-full.txt", "llms-api.txt", "llms-glossary.txt", "ai-manifest.txt"]) assert.ok(read(`dist/${file}`).includes(TEMPLATE_PATH), file);
  const graph = JSON.parse(read("dist/data/knowledge-graph.json"));
  assert.ok(graph.entityMap.some((entity) => entity.entity === "Planning template"));
  assert.ok(graph.relationshipMap.some((edge) => edge.from === "Template catalog" && edge.to === "Planning template" && edge.relation === "hasPart"));
});

test("PD-01 generates every critical SEO landing page with indexable self-canonicals", () => {
  const cases = [
    ["/", /^Viikkonumero \d+ /],
    ["/parillinen-pariton-viikko", /^Parillinen vai pariton viikko/],
    ["/koululomat-2028", /^Syysloma 2028/],
    ["/mika-on-viikkonumero", /^Viikkonumero:/],
    ["/ukk", /^Viikkonumero:/],
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
    ["/ukk", ["WebPage", "FAQPage", "BreadcrumbList"]],
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
  assert.ok(html.includes("Viikkonro Yrityskalenteri"), "the product name is visible");
  assert.ok(html.includes('class="cc-layout" data-clarity-mask="True"'), "company input and preview content are masked");
  assert.ok(html.includes("Osto avaa valitun vuoden"), "paid exports are explained without granting access");
  assert.ok(html.includes("Palauta aiempi osto"), "buyers can restore a private purchase");
  assert.ok(!html.includes("Osta kalenterin"), "buy button requires a live enabled server catalog");
  const types = schemaTypes(structuredData(html));
  for (const type of ["WebPage", "FAQPage", "HowTo", "BreadcrumbList"]) assert.ok(types.has(type), type);
  assert.ok(sitemapLocations().includes(`${siteOrigin}/yrityskalenteri`));
  // The builder's styles belong to this page only; every other page inlines the global stylesheet.
  assert.ok(html.includes(".cc-frame"), "the builder page carries its own styles");
  for (const route of ["/", "/kalenteri-2027", "/viikko-24-2026", "/tyopaivalaskuri"]) {
    assert.ok(!pageHtml(route).includes(".cc-frame"), `${route} must not carry the builder's styles`);
  }
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

test("PD-18 keeps the team app separate from public analytics and generated data", () => {
  const landing = pageHtml("/tiimin-lomat"), app = pageHtml("/tiimin-lomat/suunnittelu");
  assert.ok(landing.includes('href="/tiimin-lomat/suunnittelu"'));
  assert.ok(app.includes('content="noindex,nofollow,noarchive"'));
  assert.ok(app.includes('content="no-referrer"'));
  assert.ok(!/clarity|bing\.com|adsbygoogle|analytics/i.test(app));
  assert.ok(!sitemapLocations().includes(`${siteOrigin}/tiimin-lomat/suunnittelu`));
  assert.ok(sitemapLocations().includes(`${siteOrigin}/tiimin-lomat`));
  for (const type of ["WebPage", "FAQPage", "HowTo", "BreadcrumbList"]) assert.ok(schemaTypes(structuredData(landing)).has(type));
  const deployment = JSON.parse(read("vercel.json"));
  const privateHeaders = deployment.headers.find((h) => h.source === "/tiimin-lomat/suunnittelu").headers;
  assert.ok(privateHeaders.some((h) => h.key === "Cache-Control" && h.value.includes("no-store")));
  assert.ok(privateHeaders.some((h) => h.key === "Content-Security-Policy" && h.value.includes("frame-ancestors 'none'")));
  for (const publicRoute of ["/", "/lomasuunnittelija", "/yrityskalenteri", "/hr-kalenteri"]) assert.ok(!pageHtml(publicRoute).includes('href="/assets/team-backend-'), publicRoute);
});

test("PD-17 publishes the HR calendar with legal provenance, private exports and schema", () => {
  const html = withoutComments(pageHtml("/hr-kalenteri"));
  assert.ok(html.includes('href="https://viikkonro.fi/hr-kalenteri"'));
  assert.ok(html.includes("TES-kohtainen oma merkintä"));
  assert.ok(html.includes("Finlex"));
  assert.ok(html.includes("ei takaa lainmukaisuutta"));
  assert.ok(!/noindex/i.test(html));
  for (const type of ["WebPage", "FAQPage", "HowTo", "BreadcrumbList"]) assert.ok(schemaTypes(structuredData(html)).has(type));
  assert.equal(sitemapLocations().filter((url) => url === `${siteOrigin}/hr-kalenteri`).length, 1);
  assert.ok(pageHtml("/laskurit").includes('href="/hr-kalenteri"'));
  assert.ok(pageHtml("/kalenteripohjat/hr-ja-palkkapaivien-vuosikello").includes('href="/hr-kalenteri"'));
  for (const file of ["ai.txt", "llms.txt", "llms-full.txt", "llms-api.txt", "llms-data.txt", "llms-glossary.txt", "ai-manifest.txt", "data/knowledge-graph.json"]) assert.ok(read(`dist/${file}`).includes("/hr-kalenteri"), file);
});

test("PD-11 keeps the FAQ landing page focused on viikkonumero with matching schema", () => {
  const html = withoutComments(pageHtml("/ukk"));
  assert.ok(html.includes("<h1>Viikkonumero: usein kysytyt kysymykset</h1>"));
  assert.ok(html.includes('href="/mika-on-viikkonumero"'));
  assert.ok(html.includes('href="/paivamaara-viikoksi"'));

  const documents = structuredData(html);
  const faqNode = documents
    .flatMap((document) => document["@graph"] || [document])
    .find((node) => node["@type"] === "FAQPage" && node["@id"] === `${siteOrigin}/ukk#faq`);
  assert.ok(faqNode, "expected /ukk FAQPage schema");
  assert.equal(faqNode.dateModified, "2026-10-06");
  assert.equal(faqNode.mainEntity[0].name, "Mikä on viikkonumero?");
  assert.ok(html.indexOf("Mikä on viikkonumero?") < html.indexOf("Mikä viikko nyt on?"));
});
