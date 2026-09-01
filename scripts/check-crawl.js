// D-06 crawl-reachability check: BFS from "/" using the app's real SSR
// render (dist-server/entry-server.js) to extract the actual client-side
// link graph — this is what a JS-executing crawler (Googlebot) or a real
// browser sees, and is exactly the same React render output the client
// hydrates into (React is isomorphic: SSR and client render the identical
// component tree/links for a given URL).
//
// Not a live-browser crawl — no Puppeteer/Playwright involved. Deliberately
// so: react-dom/server's render() IS the real component tree for a route,
// so re-deriving the same links via an actual headless browser would only
// add a heavy new dependency without finding anything this doesn't.
//
// Requires a built dist/ + dist-server/ (run `npm run build`, then rebuild
// dist-server since prerender.js deletes it: `npx vite build --ssr
// src/entry-server.jsx --outDir dist-server`) before running this.
//
// Checks (per the handoff's D-06):
//   - every sitemap URL reachable from "/" within 3 clicks
//   - zero internal links to a redirect-only page or the 404 page
//   - zero printable-calendar pages linking to themselves
//   - zero obsolete meta keywords tags in generated HTML
//   - zero legacy migration paths or numbered calendar slugs in the sitemap
//     or generated HTML
//   - every generated week page uses the concise title template and retains
//     vk/vko abbreviation coverage in visible body copy
//   - week, month, and year meta descriptions do not advertise incomplete
//     name-day coverage
//   - /en keeps English document/head signals, reciprocal hreflang, English
//     shared chrome, and an indexable sitemap entry
//   - every submitted PDF exists and is directly linked from rendered HTML;
//     every generated PDF remains reachable as a user download

import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { navigationYearTargets } from "../src/components/dateUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const { render } = await import(
  pathToFileURL(path.join(root, "dist-server/entry-server.js")).href
);

// Asset hints (<link rel="preload" href="...svg">, favicons, etc.) also use
// href= but aren't page links — exclude by extension so they don't pollute
// the crawl or the redirect-only heuristic below.
const ASSET_EXT = /\.(svg|png|jpg|jpeg|ico|xml|txt|css|js|pdf|json|csv)$/i;

function extractLinks(html) {
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  return [
    ...new Set(
      hrefs.filter(
        (h) => h.startsWith("/") && !h.startsWith("//") && !ASSET_EXT.test(h),
      ),
    ),
  ];
}

function extractPdfAnchors(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"?#]+\.pdf)(?:[?#][^"]*)?"[^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/pdf/"));
}

// Detects the <Navigate> short-circuit case (e.g. an invalid week 53
// redirecting): those routes render almost nothing besides Navbar/Footer,
// distinctly shorter than a real page.
function looksLikeRedirectOnly(html) {
  return html.length < 3500;
}

const MAX_DEPTH = 3;
const { currentYear: navigationCurrentYear, promotedYear: navigationPromotedYear } =
  navigationYearTargets(new Date());
const navigationHtml = render("/");
const missingNavigationTargets = [
  `id="navYear" href="/vuosi-${navigationCurrentYear}"`,
  `id="navPrint" href="/tulosta-${navigationPromotedYear}"`,
  `id="navCalendar" href="/kalenteri-${navigationPromotedYear}"`,
].filter((expected) => !navigationHtml.includes(expected));
const visited = new Map(); // url -> depth
const queue = [["/", 0]];
visited.set("/", 0);

const errors = [];
const redirects = [];
const notFounds = [];
const printableCalendarSelfLinks = [];
const discoveredPdfAnchors = new Set();

while (queue.length) {
  const [url, depth] = queue.shift();

  let html;
  try {
    html = render(url);
  } catch (e) {
    errors.push({ url, error: e.message });
    continue;
  }

  if (url !== "/" && looksLikeRedirectOnly(html)) redirects.push(url);
  if (html.includes("Sivua ei löytynyt")) notFounds.push(url);
  for (const pdfHref of extractPdfAnchors(html)) discoveredPdfAnchors.add(pdfHref);

  if (
    /^\/tulostettava-kalenteri-\d+$/.test(url) &&
    extractLinks(html).includes(url)
  ) {
    printableCalendarSelfLinks.push(url);
  }

  if (depth >= MAX_DEPTH) continue;

  for (const link of extractLinks(html)) {
    if (!visited.has(link)) {
      visited.set(link, depth + 1);
      queue.push([link, depth + 1]);
    }
  }
}

const sitemap = fs.readFileSync(path.join(root, "dist/sitemap.xml"), "utf-8");
const allSitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  const u = new URL(m[1]);
  return u.pathname === "/" ? "/" : u.pathname;
});
const forbiddenGeneratedPath = (pathname) =>
  /^\/(?:year|week|month)\//.test(pathname) ||
  /^\/kalenteri-\d+-(?:1|2)$/.test(pathname);
const forbiddenSitemapUrls = allSitemapPaths.filter(forbiddenGeneratedPath);
const sitemapPdfUrls = allSitemapPaths.filter((pathname) => /\.pdf$/i.test(pathname));
const sitemapUrls = allSitemapPaths
  // The sitemap deliberately includes downloadable PDFs alongside HTML
  // pages. Reachability for those assets is covered by the page-level link
  // checks; this BFS compares only routes the React application can render.
  .filter((pathname) => !ASSET_EXT.test(pathname));

const unreachable = sitemapUrls.filter((u) => !visited.has(u));
const tooDeep = sitemapUrls.filter((u) => visited.has(u) && visited.get(u) > MAX_DEPTH);
const generatedHtmlFiles = fs
  .readdirSync(path.join(root, "dist"), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"));
const metaKeywordFiles = generatedHtmlFiles
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((file) => /<meta\s+name=["']keywords["']/i.test(fs.readFileSync(file, "utf-8")));
const forbiddenGeneratedFiles = generatedHtmlFiles
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((file) => {
    const relative = `/${path.relative(path.join(root, "dist"), file).replace(/\.html$/, "")}`;
    return forbiddenGeneratedPath(relative);
  });
const invalidWeekMetadataFiles = generatedHtmlFiles
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((file) => /^viikko-\d+-\d+\.html$/.test(path.basename(file)))
  .filter((file) => {
    const html = fs.readFileSync(file, "utf-8");
    const match = path.basename(file).match(/^viikko-(\d+)-(\d+)\.html$/);
    const [, week, year] = match;
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "";
    const vkBodyPattern = new RegExp(`<strong>vk (?:<!-- -->)?${week}</strong>`);
    const vkoBodyPattern = new RegExp(`<strong>vko (?:<!-- -->)?${week}</strong>`);
    return (
      !title.startsWith(`Viikko ${week} vuonna ${year} – `) ||
      title.includes("(vk") ||
      !vkBodyPattern.test(html) ||
      !vkoBodyPattern.test(html)
    );
  });
const unsupportedNameDayDescriptionFiles = generatedHtmlFiles
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((file) => /^(?:viikko-\d+-\d+|kuukausi-\d+-\d+|vuosi-\d+)\.html$/.test(path.basename(file)))
  .filter((file) => {
    const html = fs.readFileSync(file, "utf-8");
    const description = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
    )?.[1] ?? "";
    return !description || /nimipäiv/i.test(description);
  });
const englishGeneratedHtml = fs.readFileSync(path.join(root, "dist/en.html"), "utf-8");
const invalidEnglishSurfaceSignals = [
  ['<html lang="en">', englishGeneratedHtml.includes('<html lang="en">')],
  ['og:locale en_US', englishGeneratedHtml.includes('<meta property="og:locale" content="en_US" />')],
  ['self canonical', englishGeneratedHtml.includes('<link rel="canonical" href="https://viikkonro.fi/en" />')],
  ['hreflang fi', englishGeneratedHtml.includes('<link rel="alternate" hreflang="fi" href="https://viikkonro.fi/" />')],
  ['hreflang en', englishGeneratedHtml.includes('<link rel="alternate" hreflang="en" href="https://viikkonro.fi/en" />')],
  ['hreflang x-default', englishGeneratedHtml.includes('<link rel="alternate" hreflang="x-default" href="https://viikkonro.fi/" />')],
  ['English navigation', englishGeneratedHtml.includes("Open navigation menu")],
  ['English footer', englishGeneratedHtml.includes("All rights reserved.")],
  ['Finnish destinations labeled', englishGeneratedHtml.includes("(Finnish)")],
  ['no Finnish navigation label', !englishGeneratedHtml.includes("Avaa navigointivalikko")],
  ['no Finnish footer heading', !englishGeneratedHtml.includes(">Palvelu<")],
  ['indexable robots', !englishGeneratedHtml.includes('content="noindex, follow"')],
  ['sitemap entry', allSitemapPaths.includes("/en")],
].filter(([, valid]) => !valid).map(([signal]) => signal);
const generatedPdfPaths = fs
  .readdirSync(path.join(root, "dist/pdf"), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".pdf"))
  .map((entry) => `/pdf/${entry.name}`);
const missingSitemapPdfFiles = sitemapPdfUrls.filter(
  (pathname) => !fs.existsSync(path.join(root, "dist", pathname.slice(1))),
);
const unlinkedSitemapPdfs = sitemapPdfUrls.filter(
  (pathname) => !discoveredPdfAnchors.has(pathname),
);
const unlinkedGeneratedPdfs = generatedPdfPaths.filter(
  (pathname) => !discoveredPdfAnchors.has(pathname),
);

console.log(`Crawled ${visited.size} distinct internal URLs from "/".`);
console.log(`Sitemap has ${sitemapUrls.length} URLs.`);
console.log(`Unreachable: ${unreachable.length}, beyond ${MAX_DEPTH} clicks: ${tooDeep.length}`);
console.log(`Redirect-only pages linked internally: ${redirects.length}`);
console.log(`Internal links to the 404 page: ${notFounds.length}`);
console.log(`Printable-calendar self-links: ${printableCalendarSelfLinks.length}`);
console.log(`Generated pages with meta keywords: ${metaKeywordFiles.length}`);
console.log(`Legacy/numbered URLs in sitemap: ${forbiddenSitemapUrls.length}`);
console.log(`Legacy/numbered generated pages: ${forbiddenGeneratedFiles.length}`);
console.log(`Week pages with invalid title/body abbreviation coverage: ${invalidWeekMetadataFiles.length}`);
console.log(`Week/month/year pages with unsupported name-day descriptions: ${unsupportedNameDayDescriptionFiles.length}`);
console.log(`Invalid English-surface signals: ${invalidEnglishSurfaceSignals.length}`);
console.log(`Generated/submitted/directly linked PDFs: ${generatedPdfPaths.length}/${sitemapPdfUrls.length}/${discoveredPdfAnchors.size}`);
console.log(`Missing submitted PDF files: ${missingSitemapPdfFiles.length}`);
console.log(`Submitted PDFs without a direct HTML download link: ${unlinkedSitemapPdfs.length}`);
console.log(`Generated PDFs without a direct HTML download link: ${unlinkedGeneratedPdfs.length}`);
console.log(`Missing seasonal navigation targets: ${missingNavigationTargets.length}`);
console.log(`Render errors: ${errors.length}`);

for (const u of unreachable) console.log(`  UNREACHABLE: ${u}`);
for (const u of tooDeep) console.log(`  TOO DEEP (${visited.get(u)}): ${u}`);
for (const u of redirects) console.log(`  REDIRECT-ONLY: ${u}`);
for (const u of notFounds) console.log(`  404: ${u}`);
for (const u of printableCalendarSelfLinks) console.log(`  SELF-LINK: ${u}`);
for (const file of metaKeywordFiles) console.log(`  META KEYWORDS: ${path.relative(root, file)}`);
for (const u of forbiddenSitemapUrls) console.log(`  FORBIDDEN SITEMAP URL: ${u}`);
for (const file of forbiddenGeneratedFiles) {
  console.log(`  FORBIDDEN GENERATED PAGE: ${path.relative(root, file)}`);
}
for (const file of invalidWeekMetadataFiles) {
  console.log(`  INVALID WEEK METADATA: ${path.relative(root, file)}`);
}
for (const file of unsupportedNameDayDescriptionFiles) {
  console.log(`  UNSUPPORTED NAME-DAY DESCRIPTION: ${path.relative(root, file)}`);
}
for (const signal of invalidEnglishSurfaceSignals) {
  console.log(`  INVALID ENGLISH SURFACE: ${signal}`);
}
for (const pathname of missingSitemapPdfFiles) {
  console.log(`  MISSING SUBMITTED PDF: ${pathname}`);
}
for (const pathname of unlinkedSitemapPdfs) {
  console.log(`  UNLINKED SUBMITTED PDF: ${pathname}`);
}
for (const pathname of unlinkedGeneratedPdfs) {
  console.log(`  UNLINKED GENERATED PDF: ${pathname}`);
}
for (const expected of missingNavigationTargets) {
  console.log(`  MISSING NAVIGATION TARGET: ${expected}`);
}
for (const e of errors) console.log(`  ERROR: ${e.url}: ${e.error}`);

const failed =
  unreachable.length > 0 ||
  tooDeep.length > 0 ||
  redirects.length > 0 ||
  notFounds.length > 0 ||
  printableCalendarSelfLinks.length > 0 ||
  metaKeywordFiles.length > 0 ||
  forbiddenSitemapUrls.length > 0 ||
  forbiddenGeneratedFiles.length > 0 ||
  invalidWeekMetadataFiles.length > 0 ||
  unsupportedNameDayDescriptionFiles.length > 0 ||
  invalidEnglishSurfaceSignals.length > 0 ||
  missingSitemapPdfFiles.length > 0 ||
  unlinkedSitemapPdfs.length > 0 ||
  unlinkedGeneratedPdfs.length > 0 ||
  missingNavigationTargets.length > 0 ||
  errors.length > 0;

if (failed) {
  console.error("\nFAIL");
  process.exit(1);
}
console.log("\nOK");
