// Post-build prerendering: renders every route in sitemapEntries() (not just
// static pages, but every /viikko-*, /kuukausi-*, /vuosi-*, /kalenteri-* etc.
// across the rolling 2020..currentYear+9 horizon) to real HTML and writes it
// into dist/<route>.html. This makes full page text (headings, FAQ, article
// copy, per-week/month/year facts) crawlable by search + AI/generative engines
// even when they don't run JavaScript — while the client still hydrates into
// the normal SPA. Vercel has no rewrites configured (see vercel.json), so any
// path outside this prerendered horizon isn't a client-rendered SPA guess —
// it's a real 404 (Vercel's static-output convention of serving dist/404.html,
// written near the bottom of this file).
//
// No headless browser is used, so the build stays fast and small.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import React from "react";
import { ImageResponse } from "@vercel/og";
import PDFDocument from "pdfkit";
import {
  metaFor,
  canonicalFor,
  SITE_URL,
  sitemapEntries,
  breadcrumbTrail,
  calendarFaqs,
  calendarMeta,
  calendarPdfPath,
  CONTENT_UPDATED,
  FEED_SCHEMA_VERSION,
  mondayOf,
  monthFaqs,
  monthlyWorkingDayFaqs,
  monthPdfPath,
  monthStats,
  quarterFaqs,
  quarterStats,
  weekPdfPath,
  workingDaysFaqs,
  yearFaqs,
  yearStats,
} from "./src/data/seo.js";
import { openDataFaqs, DATA_FEED_FAMILIES } from "./src/data/openDataContent.js";
import {
  CHROME_EXTENSION_PATH,
  EXTENSION_FACTS,
  EXTENSION_FEATURES,
  INSTALL_STEPS,
  chromeExtensionFaqs,
} from "./src/data/chromeExtensionContent.js";
import { dataSourcesFaqs, methodologyFaqs, editorialPolicyFaqs } from "./src/data/trustPages.js";
import { datasetPageFaqs } from "./src/data/datasetPages.js";
import { faqs, faqCategories, featuredFaqs } from "./src/data/faqs.js";
import {
  fmtShortFi,
  getWeekdayName,
  isoWeek,
  isoWeekDateLabel,
  isoYear,
  quarterOf,
  seasonIndexOf,
  SEASON_KEYS_EN,
  SEASON_NOMINATIVE_FI,
  weeksInIsoYear,
  M_FULL,
  M_INESSIVE,
  M_SLUG,
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
} from "./src/components/dateUtils.js";
import { holidaysInYear, HOLIDAY_LEGAL_BASIS } from "./src/data/holidays.js";
import { flagDayFaqs, flagDaysInYear } from "./src/data/flagDayPages.js";
import {
  holidayFaqs,
  holidayLinkPath,
  holidayPageFor,
  holidayPageMeta,
  holidayWeekLinks,
  HOLIDAY_DEFINITIONS,
} from "./src/data/holidayPages.js";
import {
  nameDayDateMeta,
  nameDayDatePage,
  nameDayFaqs,
  nameDayNameMeta,
  nameDayNamePage,
  todayNameDayMeta,
  todayNameDayPage,
} from "./src/data/nameDayPages.js";
import { nameDayDateKeys, nameDayNames } from "./src/data/nameDays.js";
import { weeksInYearFaqs } from "./src/data/weeksInYearContent.js";
import {
  whatWeekFaqs,
  weekStartsMondayFaqs,
} from "./src/data/isoWeekContent.js";
import { finlandVsUsaFaqs } from "./src/data/finlandVsUsaContent.js";
import {
  printableCalendarFaqs,
  printListFaqs,
} from "./src/data/printCalendarContent.js";
import {
  CONFIDENCE,
  confidenceLabel,
  pageConfidenceTier,
  SCHOOL_HOLIDAY_SOURCES,
  schoolHolidayFaqs,
  schoolHolidayPage,
} from "./src/data/schoolHolidayPages.js";
import {
  currentMonthFaqs,
  currentMonthMeta,
  currentYearFaqs,
  currentYearMeta,
  weekdayFaqs,
  weekdayMeta,
} from "./src/data/currentDateContent.js";
import { englishFaqs } from "./src/data/englishContent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist");
const serverDir = path.resolve(__dirname, "dist-server");

// Prerender EVERY URL in the sitemap, not just the static pages. The
// week/month/year pages are content-rich (holidays, name days, sun times,
// per-day details) — they just weren't prerendered, so crawlers saw the SPA
// home shell and treated ~200 URLs as duplicates of the homepage. Rendering
// them gives each unique, indexable HTML that matches its sitemap entry.
const currentYear = new Date().getFullYear();
// The actual build date, YYYY-MM-DD — distinct from CONTENT_UPDATED (a
// hand-bumped editorial constant in seo.js, deliberately NOT build-time, so
// a content page's visible "Päivitetty" line and its schema dateModified
// never disagree). FEED_BUILD_DATE is for the machine-readable /data/ layer
// instead: those files regenerate on every build (avoin-data's own FAQ says
// so), so their dateModified should reflect that, not lag behind whenever
// someone last hand-edited unrelated page copy.
const FEED_BUILD_DATE_RAW = new Date();
const FEED_BUILD_DATE = `${FEED_BUILD_DATE_RAW.getFullYear()}-${String(FEED_BUILD_DATE_RAW.getMonth() + 1).padStart(2, "0")}-${String(FEED_BUILD_DATE_RAW.getDate()).padStart(2, "0")}`;
const sitemapRoutes = sitemapEntries(currentYear).map((e) => e.path);
// Keep the honest noindex fallback available even while today's date is not
// covered by the partial seed. It joins the sitemap automatically once the
// authorized full dataset supplies names for the current date.
const routeCandidates = [...sitemapRoutes, "/nimipaivat/tanaan"];
const duplicateRoutes = [
  ...new Set(routeCandidates.filter((route, index) => routeCandidates.indexOf(route) !== index)),
];
if (duplicateRoutes.length) {
  throw new Error(`duplicate prerender route(s): ${duplicateRoutes.join(", ")}`);
}
const forbiddenGeneratedRoutes = routeCandidates.filter(
  (route) =>
    /^\/(?:year|week|month)\//.test(route) ||
    /^\/kalenteri-\d+-(?:1|2)$/.test(route),
);
if (forbiddenGeneratedRoutes.length) {
  throw new Error(
    `legacy or numbered calendar route entered prerender output: ${forbiddenGeneratedRoutes.join(", ")}`,
  );
}
const routes = routeCandidates;

// Indexable window: keep the high-intent recent + near-future years in Google's
// index and noindex the long tail, so ~1,100 near-identical template pages
// across 16 years don't become the site's dominant "content at scale" signal
// (which caps a thin calculator site's ranking). Rolling currentYear-2 ..
// currentYear+4 = 2024..2030 today. Out-of-window pages are still prerendered
// (so they stay navigable) but carry noindex and are dropped from the sitemap.
const INDEX_MIN_YEAR = currentYear - 2;
const INDEX_MAX_YEAR = currentYear + 4;
const isIndexable = (p) => {
  // Named-holiday pages are the deliberately expanded content cluster: all
  // 15 holidays across the complete 2020..current+9 publishing horizon are
  // indexable and included in the sitemap.
  if (/^\/pyhat-\d{4}\/[a-z0-9-]+$/.test(p)) return true;
  const m = p.match(/-(\d{4})(?:-(?:alkuvuosi|loppuvuosi))?$/);
  if (!m) return true; // static pages have no year → always indexable
  const y = Number(m[1]);
  return y >= INDEX_MIN_YEAR && y <= INDEX_MAX_YEAR;
};

let template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

// The three site-wide entities are authored in index.html, but every
// prerendered page needs them in the same graph as its page entity. Extracting
// them avoids maintaining a second copy while leaving one JSON-LD block per
// generated document.
const globalJsonLdMatch = template.match(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
);
if (!globalJsonLdMatch) throw new Error("global JSON-LD graph missing from index.html");
const globalJsonLd = JSON.parse(globalJsonLdMatch[1]);
const globalJsonLdNodes = globalJsonLd["@graph"];
template = template.replace(globalJsonLdMatch[0], "");

// Inline the render-blocking stylesheet into <head> so the first paint doesn't
// wait on a separate CSS request — every prerendered page ships its styles
// inline. The client SPA doesn't re-fetch CSS on route changes, so the tradeoff
// (styles not shared-cached across pages) only costs the first page load.
template = template.replace(
  /<link\b[^>]*\bhref="(\/assets\/[^"]+\.css)"[^>]*>/g,
  (_m, href) => {
    const css = fs.readFileSync(path.join(distDir, href.slice(1)), "utf-8");
    return `<style>${css}</style>`;
  },
);

// pathToFileURL is required on Windows: a bare "C:\..." path passed to
// import() is misparsed as a URL with scheme "c", not a filesystem path.
const { render } = await import(
  pathToFileURL(path.join(serverDir, "entry-server.js")).href
);

const escapeAttr = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Give a page its own title, description, canonical and Open Graph/Twitter tags.
// Whitespace-tolerant so it works whether Vite keeps the tags multi-line or not.
function applyMeta(html, { title, description, url }) {
  const t = escapeAttr(title);
  const d = escapeAttr(description);
  const u = escapeAttr(url);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*>/,
      `<meta name="description" content="${d}" />`,
    )
    .replace(
      /<link\s+rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${u}" />`,
    )
    .replace(
      /<meta\s+property="og:title"[^>]*>/,
      `<meta property="og:title" content="${t}" />`,
    )
    .replace(
      /<meta\s+property="og:description"[^>]*>/,
      `<meta property="og:description" content="${d}" />`,
    )
    .replace(
      /<meta\s+property="og:url"[^>]*>/,
      `<meta property="og:url" content="${u}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"[^>]*>/,
      `<meta name="twitter:title" content="${t}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${d}" />`,
    );
}

// Every page node points back to the shared site and publisher entities, so a
// parser can traverse the document graph without guessing entity identity.
function pageNode(url, type = "WebPage", extra = {}) {
  const canonical = canonicalFor(url);
  const trail = breadcrumbTrail(url);
  return {
    "@type": type,
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: metaFor(url).title.replace(/\s*\|\s*Viikko Nro$/, ""),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "fi-FI",
    ...(trail && trail.length >= 2 ? { breadcrumb: { "@id": `${canonical}#breadcrumb` } } : {}),
    ...extra,
  };
}

// Speakable targets ONLY the single rendered sentence that states the page's
// direct answer, via the ".answer-sentence" class added around that exact
// text in the matching JSX (WeekDays.jsx, WorkingDays.jsx; named-holiday
// pages are handled inline in namedHolidayNodes, which builds its own
// WebPage node above). Scoped to just these two URL shapes rather than the
// generic fallback pageNode() every page gets, because month/year/calendar
// pages don't have one unambiguous single-sentence answer the way these do.
function speakableExtra(url) {
  if (
    /^\/viikko-\d+-\d+$/.test(url) ||
    /^\/tyopaivat-\d+$/.test(url) ||
    /^\/pyhapaivat-\d+$/.test(url)
  ) {
    return {
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
    };
  }
  return {};
}

// Week -> Holiday structured-data links (the other half of the bidirectional
// linking system — namedHolidayNodes() above handles Holiday -> Week/Month).
// Reuses holidaysInWeekForPrerender() (already computed for weekFaqNodes())
// and holidayLinkPath() (already used by WeekDays.jsx's visible holiday
// mentions), so this can't reference a holiday page that isn't also linked
// in the rendered HTML, or vice versa.
function weekHolidayMentionsExtra(url) {
  const m = url.match(/^\/viikko-(\d+)-(\d+)$/);
  if (!m) return {};
  const officialHolidays = holidaysInWeekForPrerender(+m[2], +m[1]).filter((h) => h.official);
  const mentions = officialHolidays
    .map((h) => holidayLinkPath(h.name, h.date))
    .filter(Boolean)
    .map((path) => ({ "@id": `${canonicalFor(path)}#webpage` }));
  return mentions.length > 0 ? { mentions } : {};
}

// Single source of truth for "does this URL have its own, page-specific OG
// image, and if so what's its filename" — used by the og:image/twitter:image
// head override below, the ImageObject schema (ogImageExtra()), and the
// sitemap's <image:image> extension, so the three can't disagree about which
// pages have a dedicated image or where it lives. Returns null for anything
// without one (the sitewide /og.png stays the fallback for those).
function ogImageUrlFor(url) {
  let m;
  if (url === "/") {
    return `${SITE_URL}/og.png`;
  }
  if ((m = url.match(/^\/(?:tulostettava-)?kalenteri-(\d+)/))) {
    return `${SITE_URL}/og/kalenteri-${m[1]}.png`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `${SITE_URL}/og/vuosi-${m[1]}.png`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/og/kuukausi-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/og/viikko-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    return `${SITE_URL}/og/pyhat-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    return `${SITE_URL}/og/pyhapaivat-${m[1]}.png`;
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    return `${SITE_URL}/og/liputuspaivat-${m[1]}.png`;
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    return `${SITE_URL}/og/tyopaivat-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    return `${SITE_URL}/og/tyopaivat-${m[1]}.png`;
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    return `${SITE_URL}/og/q${m[1]}-${m[2]}.png`;
  }
  return null;
}

// Descriptive og:image:alt text to go with ogImageUrlFor()'s image — same
// regex branches, same match groups, so the two can't fall out of sync (a
// page whose image changes but whose alt text doesn't is worse than no alt
// text: it actively misdescribes the image). The template's default
// ("Viikko Nro – kuluva viikkonumero", i.e. "current week") is only accurate
// for "/" itself, which is why every other branch here overrides it and "/"
// doesn't need a case — the template value stands unmodified for it.
function ogImageAltFor(url) {
  let m;
  if ((m = url.match(/^\/(?:tulostettava-)?kalenteri-(\d+)/))) {
    return `Vuoden ${m[1]} kalenteri – Viikko Nro`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `Viikkonumerot ${m[1]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `${M_FULL[Number(m[1]) - 1]} ${m[2]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `Viikko ${m[1]}/${m[2]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    const page = holidayPageFor(m[1], m[2]);
    return page ? `${page.displayName} ${m[1]} – Viikko Nro` : null;
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    return `Suomen pyhäpäivät ${m[1]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    return `Suomen liputuspäivät ${m[1]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    return mi === -1 ? null : `Työpäivät ${M_FULL[mi]} ${m[2]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    return `Työpäivät ${m[1]} – Viikko Nro`;
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    return `Q${m[1]} ${m[2]} – Viikko Nro`;
  }
  return null;
}

// schema.org/ImageObject for pageNode()'s `image` property — spread into
// every builder that produces a page's WebPage/CollectionPage node (the
// generic fallback below, weekCollectionNodes(), namedHolidayNodes(),
// calendarPageNodes()), the same way speakableExtra()/weekHolidayMentionsExtra()
// already are. Nested inline (not a separate @id'd node referenced from
// elsewhere) since, unlike the PDF's associatedMedia, nothing else in the
// graph needs to point at the same image.
function ogImageExtra(url) {
  const img = ogImageUrlFor(url);
  if (!img) return {};
  return {
    image: {
      "@type": "ImageObject",
      url: img,
      contentUrl: img,
      width: 1200,
      height: 630,
    },
  };
}

// Downloadable-PDF twin of a /viikko-<w>-<y> page: an associatedMedia/
// MediaObject (exact same shape calendarPageNodes() already uses for the
// calendar PDF) plus a DownloadAction naming that same MediaObject as its
// object — the standard schema.org pairing for "this page has a real,
// downloadable file", not a new convention invented for this one case.
function weekPdfExtra(url) {
  const m = url.match(/^\/viikko-(\d+)-(\d+)$/);
  if (!m) return {};
  const pdfUrl = `${SITE_URL}${weekPdfPath(m[1], m[2])}`;
  return {
    associatedMedia: {
      "@type": "MediaObject",
      "@id": `${pdfUrl}#media`,
      name: `Viikko ${m[1]}/${m[2]} (PDF)`,
      contentUrl: pdfUrl,
      encodingFormat: "application/pdf",
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
    },
    potentialAction: {
      "@type": "DownloadAction",
      target: pdfUrl,
      object: { "@id": `${pdfUrl}#media` },
    },
  };
}

// Same pairing as weekPdfExtra() above, for /kuukausi-<m>-<y>. Returns {}
// for any other URL (including /vuosi-<y>, which shares weekCollectionNodes()
// with this route but has no month PDF of its own), so it's safe to spread
// unconditionally into that one shared pageNode() call.
function monthPdfExtra(url) {
  const m = url.match(/^\/kuukausi-(\d+)-(\d+)$/);
  if (!m) return {};
  const pdfUrl = `${SITE_URL}${monthPdfPath(m[1], m[2])}`;
  return {
    associatedMedia: {
      "@type": "MediaObject",
      "@id": `${pdfUrl}#media`,
      name: `${M_FULL[Number(m[1]) - 1]} ${m[2]} (PDF)`,
      contentUrl: pdfUrl,
      encodingFormat: "application/pdf",
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
    },
    potentialAction: {
      "@type": "DownloadAction",
      target: pdfUrl,
      object: { "@id": `${pdfUrl}#media` },
    },
  };
}

// Knowledge-graph edges: connects every Week/Month/Quarter/Year/Holiday/
// FlagDay/WorkingDay page's #webpage node to its natural container(s) via
// isPartOf, and (for the three hub pages that list many children) to those
// children via hasPart. Every @id referenced here is another page's own
// #webpage node built by pageNode() elsewhere — no new nodes are created,
// only edges between nodes that already exist, using the same cross-document
// @id-reference convention every page already uses for isPartOf/publisher
// pointing at the homepage's #website/#organization nodes. Spread into every
// pageNode() call site across the entity pages (see call sites) plus the
// generic fallback, so this is the one place the site's containment
// hierarchy (Week->Year, Month->Quarter->Year, Holiday->Holiday-hub, etc.)
// is declared. Returns {} for any URL outside that hierarchy.
function entityParentExtra(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    // The {year} in /viikko-{week}-{year} is already the ISO week-year (the
    // route's own definition), so the containing Year needs no recomputation.
    const year = m[2];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    const month = Number(m[1]);
    const year = m[2];
    const quarter = quarterOf(new Date(Number(year), month - 1, 1));
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/q${quarter}-${year}`)}#webpage` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    const year = m[2];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
      hasPart: HOLIDAY_DEFINITIONS.map((h) => ({
        "@id": `${canonicalFor(`/pyhat-${year}/${h.slug}`)}#webpage`,
      })),
    };
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/[a-z0-9-]+$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/pyhapaivat-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
      hasPart: M_SLUG.map((slug) => ({
        "@id": `${canonicalFor(`/tyopaivat-${slug}-${year}`)}#webpage`,
      })),
    };
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    if (mi === -1) return {};
    const year = m[2];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/kuukausi-${mi + 1}-${year}`)}#webpage` },
      ],
    };
  }
  if (
    (m = url.match(/^\/kalenteri-(\d+)(?:-(?:alkuvuosi|loppuvuosi))?$/)) ||
    (m = url.match(/^\/tulostettava-kalenteri-(\d+)$/))
  ) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  return {};
}

// Shared visual template for every per-page OG image below (week/month/year/
// holiday) — same brand gradient/kicker/accent-color/divider-bar language as
// the homepage's and kalenteri's existing (hand-written, structurally
// different) cards, but factored out once here rather than a fifth copy of
// the same ~20 style props. `big`/`accent` are two stacked lines (accent in
// the site's amber); `tagline` is optional.
function ogCard(h, { big, accent, tagline }) {
  return h(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "90px 96px",
        background:
          "linear-gradient(135deg, #15211f 0%, #0f2a21 55%, #16130f 100%)",
        color: "#ffffff",
      },
    },
    h(
      "div",
      { style: { display: "flex", fontSize: 34, letterSpacing: 6, color: "#bbf7d0" } },
      "VIIKKONRO.FI",
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", marginTop: 26 } },
      h(
        "span",
        { style: { display: "flex", fontSize: 88, fontWeight: 800, lineHeight: 1.08 } },
        big,
      ),
      h(
        "span",
        {
          style: {
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.08,
            color: "#e0a23b",
          },
        },
        accent,
      ),
    ),
    h("div", {
      style: { display: "flex", width: 240, height: 12, marginTop: 36, background: "#8900ff", borderRadius: 8 },
    }),
    ...(tagline
      ? [h(
          "div",
          { style: { display: "flex", marginTop: 42, fontSize: 36, color: "#8aa39b" } },
          tagline,
        )]
      : []),
  );
}

// ============================================================================
// Discover image system — a SECOND, independent image family for Google
// Discover eligibility, built entirely alongside the OG system above without
// calling or altering a single one of its functions (ogCard/ogImageUrlFor/
// ogImageAltFor/ogImageExtra all remain exactly as they were). Google's own
// Discover documentation (checked directly against developers.google.com,
// not secondary summaries) recommends 16:9, high resolution, and explicitly
// says to avoid text-heavy images and generic/logo-only images — three things
// the OG cards above are deliberately built around (big stylized title text,
// a prominent wordmark), because that's what makes a *good* og:image/Twitter
// card. The two goals don't fully overlap, hence a second, real image family
// rather than a compromise redesign of the first. This one is graphic-first:
// an actual small calendar grid (the same Monday-first week-row shape as
// pdfMonthRows() in the PDF system, but a fresh, independent implementation
// — "parallel system" means not sharing code with either sibling system
// either) with the relevant week/day highlighted by color, not labeled by
// text. Directory is a completely separate top-level path (/discover/, not
// /og/), so there is zero chance of a filename colliding with the OG family.
// ============================================================================

// Light blue / white — deliberately not the OG family's green/amber (see the
// file-header note: two independent palettes on purpose). Two blue tiers do
// the job amber/accentSoft did before: `accentSoft` (pale wash) marks "this
// row/period", `accent` (bold) marks "this exact day" — same visual-hierarchy
// role, no non-blue color needed anywhere in this image family now.
const DISCOVER_COLORS = {
  ink: "#10233d",
  inkSoft: "#5b7089",
  paper: "#ffffff",
  line: "#dbe7f3",
  accent: "#2f6fed",
  accentSoft: "#e3edfc",
};

// Monday-first week rows for one calendar month — independent from (not
// shared with) the PDF system's pdfMonthRows(), by design, even though the
// two happen to compute the same shape. Pure date logic, no rendering.
function discoverMonthRows(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const rows = [];
  let current = null;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, monthIndex, d);
    const col = (date.getDay() + 6) % 7; // 0=Mon..6=Sun
    if (col === 0 || !current) {
      current = new Array(7).fill(null);
      rows.push(current);
    }
    current[col] = { day: d, date };
  }
  return rows;
}

// One month as a flexbox grid of day-cells — the one visual building block
// every Discover image is made of (week/month/holiday images use it once,
// large; the year image uses it 12 times, small). `highlightWeek` tints an
// entire week-row's background (week pages); `highlightDay` draws a filled
// circle behind one specific date (holiday pages) — color communicates what
// text would otherwise have to say, per Google's "avoid text-heavy" guidance.
function discoverMonthGrid(h, { year, monthIndex, cellSize, highlightWeek, highlightDay, showMonthLabel }) {
  const rows = discoverMonthRows(year, monthIndex);
  const fontSize = Math.round(cellSize * 0.34);
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column" } },
    ...(showMonthLabel
      ? [h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: Math.round(cellSize * 0.28),
              fontWeight: 700,
              color: DISCOVER_COLORS.ink,
              marginBottom: Math.round(cellSize * 0.15),
            },
          },
          M_FULL[monthIndex],
        )]
      : []),
    ...rows.map((row, rowIndex) => {
      const anchor = row.find((c) => c);
      const isHighlightRow =
        highlightWeek &&
        isoWeek(anchor.date) === highlightWeek.week &&
        isoYear(anchor.date) === highlightWeek.weekYear;
      return h(
        "div",
        {
          key: String(rowIndex),
          style: {
            display: "flex",
            flexDirection: "row",
            background: isHighlightRow ? DISCOVER_COLORS.accentSoft : "transparent",
            borderRadius: Math.round(cellSize * 0.18),
          },
        },
        ...row.map((cell, colIndex) => {
          const isSunday = colIndex === 6;
          const isHighlightDay = highlightDay && cell && cell.date.getTime() === highlightDay.getTime();
          return h(
            "div",
            {
              key: String(colIndex),
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: cellSize,
                height: cellSize,
              },
            },
            cell
              ? h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: Math.round(cellSize * 0.78),
                      height: Math.round(cellSize * 0.78),
                      borderRadius: "50%",
                      background: isHighlightDay ? DISCOVER_COLORS.accent : "transparent",
                      color: isHighlightDay
                        ? "#ffffff"
                        : isSunday
                          ? DISCOVER_COLORS.inkSoft
                          : DISCOVER_COLORS.ink,
                      fontSize: isHighlightRow || isHighlightDay ? fontSize * 1.05 : fontSize,
                      fontWeight: isHighlightRow || isHighlightDay ? 700 : 400,
                    },
                  },
                  String(cell.day),
                )
              : "",
          );
        }),
      );
    }),
  );
}

// A single week's 7 days as one row — the supporting-context element for
// the week image's redesign (see the generation loop below): the WEEK
// NUMBER itself is now the dominant visual (a large numeral), so this only
// needs to show which 7 dates that number covers, not a whole month.
// Independent from discoverMonthGrid() by design (same "parallel system,
// no shared code" discipline as the rest of this file), even though both
// render date cells.
function discoverWeekStrip(h, { monday, cellSize }) {
  const WD_LETTER = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        background: DISCOVER_COLORS.accentSoft,
        borderRadius: Math.round(cellSize * 0.22),
        padding: Math.round(cellSize * 0.14),
      },
    },
    ...days.map((d, i) =>
      h(
        "div",
        {
          key: String(i),
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: cellSize,
            margin: Math.round(cellSize * 0.05),
          },
        },
        h(
          "span",
          {
            style: {
              display: "flex",
              fontSize: Math.round(cellSize * 0.2),
              color: DISCOVER_COLORS.inkSoft,
              marginBottom: Math.round(cellSize * 0.08),
            },
          },
          WD_LETTER[i],
        ),
        h(
          "span",
          {
            style: {
              display: "flex",
              fontSize: Math.round(cellSize * 0.36),
              fontWeight: 700,
              color: DISCOVER_COLORS.ink,
            },
          },
          String(d.getDate()),
        ),
      ),
    ),
  );
}

// Subtle corner brand mark — small, muted, never the dominant element (the
// opposite emphasis from ogCard()'s large colored "VIIKKONRO.FI" kicker),
// matching requirement 5 ("keep branding subtle"). The icon is the same
// 5-bar silhouette as the real logo (public/logo-horizontal-cropped.svg),
// redrawn as native SVG (satori renders <svg>/<rect> directly — no <img>/
// data-URI needed) and recoloured into this family's blue palette. Text is
// "Viikko Nro" — the site's real current brand name — not the "Viikko nyt"
// wordmark literally baked into that SVG file's <text> glyphs, which is a
// stale pre-rebrand artifact in that one static asset, not the actual brand.
function discoverBrandMark(h) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        position: "absolute",
        bottom: 36,
        right: 44,
        gap: 10,
      },
    },
    h(
      "svg",
      { width: 26, height: 26, viewBox: "0 0 100 100" },
      h("rect", { x: 4, y: 46, width: 14, height: 50, rx: 7, fill: DISCOVER_COLORS.accent }),
      h("rect", { x: 24, y: 30, width: 14, height: 66, rx: 7, fill: DISCOVER_COLORS.ink }),
      h("rect", { x: 44, y: 8, width: 14, height: 88, rx: 7, fill: DISCOVER_COLORS.accent }),
      h("rect", { x: 64, y: 40, width: 14, height: 56, rx: 7, fill: DISCOVER_COLORS.inkSoft }),
      h("rect", { x: 84, y: 50, width: 14, height: 46, rx: 7, fill: DISCOVER_COLORS.line }),
    ),
    h(
      "span",
      { style: { display: "flex", fontSize: 22, color: DISCOVER_COLORS.inkSoft, letterSpacing: 0.5 } },
      "Viikko Nro",
    ),
  );
}

function discoverCanvas(h, children) {
  return h(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: DISCOVER_COLORS.paper,
        padding: "56px 64px",
      },
    },
    ...children,
  );
}

// Single source of truth for which pages get a Discover image and its
// filename — same role ogImageUrlFor() plays for the OG family, deliberately
// not reused by it (see the file-header note above). Scoped to exactly the
// four families the brief's examples name: week/month/year/named-holiday.
function discoverImageUrlFor(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/discover/viikko-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/discover/kuukausi-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `${SITE_URL}/discover/vuosi-${m[1]}.png`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    return `${SITE_URL}/discover/pyhat-${m[1]}-${m[2]}.png`;
  }
  return null;
}

// Descriptive alt/caption text — deliberately phrased around what the image
// literally shows (a calendar view), not the page's marketing title, since
// this text is what has to carry the meaning the image no longer spells out
// in big type.
function discoverImageAltFor(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `Kalenterinäkymä: viikko ${m[1]} korostettuna, ${M_FULL[mondayOf(+m[1], +m[2]).getMonth()]} ${m[2]}`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `Kalenterinäkymä: ${M_FULL[Number(m[1]) - 1]} ${m[2]} viikkonumeroineen`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `Koko vuoden ${m[1]} kalenterinäkymä, kaikki 12 kuukautta`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    const page = holidayPageFor(m[1], m[2]);
    return page
      ? `Kalenterinäkymä: ${page.displayName} ${m[1]} korostettuna, ${M_FULL[page.date.getMonth()]}`
      : null;
  }
  return null;
}

// Standalone schema.org/ImageObject node(s) for the Discover image — pushed
// directly into the page's @graph as its own entity (like associatedMedia/
// Dataset/Event nodes elsewhere in this file), NOT merged into the OG
// system's `image` property on the WebPage node. That's a deliberate schema
// choice, not just a naming one: cramming a second image into the same
// `image` key as ogImageExtra() would require overwriting or editing that
// function's output, which is exactly what "keep the OG system untouched"
// rules out. A second, independently-referenceable ImageObject in the same
// graph is valid schema.org, costs zero changes to ogImageExtra(), and
// Google already reads the whole @graph per page, not just one node's
// properties.
function discoverImageNodes(url) {
  const img = discoverImageUrlFor(url);
  if (!img) return [];
  return [{
    "@type": "ImageObject",
    "@id": `${img}#discover`,
    url: img,
    contentUrl: img,
    width: 1200,
    height: 675,
    caption: discoverImageAltFor(url),
    representativeOfPage: true,
  }];
}

// Reusable schema.org/Dataset builder — every dataset below (one per page
// type that has a real /data/* feed backing it) is one call to this instead
// of a hand-repeated object literal, so creator/publisher/license/language
// can't drift between them and adding a 7th (or 8th) family is a single
// call, not a copy-pasted block. `distributionUrl` accepts either one URL
// or an array, since one dataset (workingDay) legitimately has no feed
// family of its own and distributes via two existing ones instead of
// inventing a URL that isn't real.
function datasetSchema({
  id,
  name,
  description,
  distributionUrl,
  extraDistribution = [],
  temporalCoverage,
  license,
  dateModified,
}) {
  const urls = Array.isArray(distributionUrl) ? distributionUrl : [distributionUrl];
  return {
    "@type": "Dataset",
    "@id": `${SITE_URL}/#dataset-${id}`,
    name,
    description,
    creator: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    license,
    dateModified,
    version: FEED_SCHEMA_VERSION,
    inLanguage: "fi-FI",
    temporalCoverage,
    // Google's Dataset structured-data validator flags "@type": "Country"
    // as an invalid spatialCoverage object type (Search Console report,
    // 9/9 dataset items, Aug 2026) even though Country is a valid Place
    // subtype in the raw schema.org ontology — Google's own Dataset docs
    // examples use "Place" literally, so matching that is the targeted fix
    // rather than arguing the stricter-than-spec validator is wrong.
    spatialCoverage: { "@type": "Place", name: "Suomi" },
    distribution: [
      ...urls.map((contentUrl) => ({
        "@type": "DataDownload",
        contentUrl,
        encodingFormat: "application/json",
      })),
      // CSV/XML bulk exports (docs/downloadable-datasets.md) — a distinct
      // encodingFormat per entry, unlike the JSON urls above which are all
      // application/json; extraDistribution lets a caller pass the real
      // format per URL instead of this function guessing one.
      ...extraDistribution.map(({ contentUrl, encodingFormat }) => ({
        "@type": "DataDownload",
        contentUrl,
        encodingFormat,
      })),
    ],
  };
}

// schema.org/Dataset description of the static JSON feeds generated under
// /data/* below (STEP 2). Each dataset's distribution points at that family's
// manifest file (a real, complete list of every generated URL — see the feed
// generation block near the end of this file), not a single example file, so
// the contentUrl is an honest description of "the whole dataset" rather than
// one arbitrary row of it. "Update frequency" has no dedicated schema.org
// Dataset property (checked against Google's supported Dataset fields before
// writing this — there isn't one), so it's stated in plain language inside
// `description` instead of invented as a non-standard JSON-LD key.
function datasetNodes() {
  const temporalCoverage = `2020-01-01/${currentYear + 9}-12-31`;
  const license = `${SITE_URL}/kayttoehdot`;
  const common = { temporalCoverage, license, dateModified: FEED_BUILD_DATE };

  const weekDataset = datasetSchema({
    ...common,
    id: "week",
    name: "Suomen ISO 8601 -viikkonumerodata",
    description:
      "Koneluettava JSON-data jokaiselle ISO 8601 -viikolle Suomessa: alkamis- ja päättymispäivä, työpäivien määrä, juhlapyhät, vuosineljännes ja vuodenaika. Saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/week/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/week`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/week/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/week/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });
  const monthDataset = datasetSchema({
    ...common,
    id: "month",
    name: "Suomen kuukausittainen viikkodata",
    description:
      "Koneluettava JSON-data jokaiselle kalenterikuukaudelle Suomessa: kuukauden sisältämät ISO-viikot, työpäivien ja viikonloppupäivien määrä sekä arkipyhät. Saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/month/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/month`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/month/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/month/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });
  const yearDataset = datasetSchema({
    ...common,
    id: "year",
    name: "Suomen vuosittainen viikko- ja työpäivädata",
    description:
      "Koneluettava JSON-data jokaiselle vuodelle Suomessa: viikkojen määrä (52 tai 53), työpäivien ja viikonloppupäivien määrä, arkipyhät sekä vuoden ensimmäinen ja viimeinen ISO-viikko. Saatavilla myös CSV- ja XML-muodossa (kaikki vuodet yhdessä tiedostossa). Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/year/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/year`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/year.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/year.xml`, encodingFormat: "application/xml" },
    ],
  });
  const quarterDataset = datasetSchema({
    ...common,
    id: "quarter",
    name: "Suomen vuosineljännesdata",
    description:
      "Koneluettava JSON-data jokaiselle vuosineljännekselle (Q1-Q4): alkamis- ja päättymispäivä, kuukaudet, viikkoväli, työpäivien ja viikonloppupäivien määrä sekä arkipyhät. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/quarter/index.json`,
  });
  const holidayDataset = datasetSchema({
    ...common,
    id: "holidays",
    name: "Suomen pyhäpäivädata",
    description:
      "Koneluettava JSON-data Suomen virallisista pyhäpäivistä ja laajasti vietetyistä vapaapäivistä: nimi, päivämäärä, viikonpäivä, ISO-viikko ja virallinen asema jokaiselle vuodelle. Saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/holidays/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/holiday`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/holiday/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/holiday/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });
  const holidayDetailDataset = datasetSchema({
    ...common,
    id: "holiday",
    name: "Suomen pyhäpäiväkohtainen data",
    description:
      "Koneluettava JSON-data yhdelle nimetylle pyhäpäivälle kerrallaan: päivämäärä, viikonpäivä, ISO-viikko, vuosineljännes, virallinen asema, määräytymissääntö ja lainsäädäntöperuste (kun se on erikseen vahvistettu). Yksi tiedosto per pyhäpäivä per vuosi. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/holiday/index.json`,
  });
  const flagDaysDataset = datasetSchema({
    ...common,
    id: "flag-days",
    name: "Suomen liputuspäivädata",
    description:
      "Koneluettava JSON-data Suomen liputuspäivistä: nimi, päivämäärä, viikonpäivä, ISO-viikko, tyyppi (virallinen, vakiintunut tai kansainvälinen) ja mahdollinen päällekkäisyys pyhäpäivän kanssa jokaiselle vuodelle. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/flag-days/index.json`,
  });
  // No feed family of its own — workingDays/weekendDays already live inside
  // the week and year feeds, so this distributes via both rather than
  // inventing a fifth endpoint. The month-level granularity is covered
  // separately by monthlyWorkingDaysDataset below, which does have its own
  // feed family.
  const workingDayDataset = datasetSchema({
    ...common,
    id: "workingdays",
    name: "Suomen työpäivädata",
    description:
      "Koneluettava JSON-data työpäivien, viikonloppupäivien ja arkipyhien määristä viikko- ja vuositasolla Suomessa, arkipyhien vaikutus työpäivien määrään huomioiden. Päivittyy kerran vuorokaudessa.",
    distributionUrl: [`${SITE_URL}/data/week/index.json`, `${SITE_URL}/data/year/index.json`],
  });
  const monthlyWorkingDaysDataset = datasetSchema({
    ...common,
    id: "monthly-workingdays",
    name: "Suomen kuukausittainen työpäivädata",
    description:
      "Koneluettava JSON-data työpäivien ja viikonloppupäivien määrästä kuukausitasolla Suomessa, arkipyhät huomioiden. Julkinen nimi /data/working-days; saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/monthly-working-days/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/working-days`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/working-days/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/working-days/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });

  return [
    weekDataset,
    monthDataset,
    yearDataset,
    quarterDataset,
    holidayDataset,
    holidayDetailDataset,
    flagDaysDataset,
    workingDayDataset,
    monthlyWorkingDaysDataset,
  ];
}

function jsonLdBlock(nodes) {
  const data = {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
  // Escape "<" so a string value containing "</script>" can never terminate
  // this tag early — JSON.stringify only escapes quotes/backslashes/control
  // chars, not "<". < is valid inside a JSON string and decodes back to
  // "<" for every consumer (browsers, schema validators), so this is lossless.
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n    </script>\n  `;
}

function breadcrumbNode(url) {
  const trail = breadcrumbTrail(url);
  if (!trail || trail.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalFor(url)}#breadcrumb`,
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: canonicalFor(t.path),
    })),
  };
}

// FAQPage structured data generated from src/data/faqs.js. Injected only on
// /ukk, whose visible list matches it exactly (Google requires the two agree).
function faqNodes() {
  return [{
    "@type": "FAQPage",
    "@id": `${SITE_URL}/ukk#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }];
}

// FAQPage for /avoin-data. The FAQ entries come from openDataFaqs()
// (openDataContent.js), the same function OpenData.jsx renders as its
// visible <details> list — same discipline as every other FAQ set here.
function openDataFaqNodes() {
  return [{
    "@type": "FAQPage",
    "@id": `${SITE_URL}/avoin-data#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: openDataFaqs().map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// FAQPage structured data for the 3 authority/trust pages
// (/tietolahteet, /menetelma, /toimitusperiaatteet) — same discipline as
// openDataFaqNodes() above: sourced from src/data/trustPages.js, the same
// functions the visible <details> lists on those pages render from, so
// neither can drift from the other.
function dataSourcesFaqNodes() {
  return [{
    "@type": "FAQPage",
    "@id": `${SITE_URL}/tietolahteet#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: dataSourcesFaqs().map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// Methodology also gets a HowTo node (the ISO week rule genuinely is a
// step-by-step procedure) — same shape as CALCULATOR_SCHEMA's HowTo nodes
// elsewhere in this file, applied here since this page states the same
// kind of ordered, followable rule.
function methodologyFaqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/menetelma#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: methodologyFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "HowTo",
      "@id": `${SITE_URL}/menetelma#howto`,
      name: "Näin viikkonumero lasketaan",
      step: [
        { "@type": "HowToStep", text: "Aloita viikko aina maanantaista." },
        { "@type": "HowToStep", text: "Etsi vuoden ensimmäinen torstai — se kertoo, mikä viikko on viikko 1." },
        { "@type": "HowToStep", text: "Viikko, joka sisältää 4. tammikuuta, on aina viikko 1." },
        { "@type": "HowToStep", text: "Jos 1. tammikuuta on torstai (tai karkausvuonna keskiviikko), vuodessa on 53 viikkoa 52:n sijaan." },
      ],
    },
  ];
}

function editorialPolicyFaqNodes() {
  return [{
    "@type": "FAQPage",
    "@id": `${SITE_URL}/toimitusperiaatteet#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: editorialPolicyFaqs().map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// /api-playground: WebAPI (schema.org's actual type for describing an API,
// unused elsewhere on the site) — one node per real endpoint from
// docs/api.md — plus the page's own TechArticle node with mainEntity
// pointing at all four, and a small FAQ. English (inLanguage "en"), same
// deliberate exception as englishPageNodes() below.
function apiPlaygroundNodes() {
  const path = "/api-playground";
  const url = canonicalFor(path);
  const apiNode = (id, name, description, endpointUrl) => ({
    "@type": "WebAPI",
    "@id": `${url}#api-${id}`,
    name,
    description,
    documentation: `${SITE_URL}/avoin-data`,
    termsOfService: `${SITE_URL}/kayttoehdot`,
    endpointUrl,
  });
  const apis = [
    apiNode(
      "week",
      "Viikko Nro Week API",
      "Free ISO 8601 week-number data for any week/year, 2020-2035. No auth, no rate limit.",
      `${SITE_URL}/api/week/{week}/{year}.json`,
    ),
    apiNode(
      "month",
      "Viikko Nro Month API",
      "Free calendar-month data (ISO weeks, working days) for any month/year, 2020-2035. No auth, no rate limit.",
      `${SITE_URL}/api/month/{month}/{year}.json`,
    ),
    apiNode(
      "year",
      "Viikko Nro Year API",
      "Free full-year data (week count, holidays, flag days) for any year, 2020-2035. No auth, no rate limit.",
      `${SITE_URL}/api/year/{year}.json`,
    ),
    apiNode(
      "holiday",
      "Viikko Nro Holiday API",
      "Free per-holiday data (date, weekday, legal basis where confirmed) for any of Finland's 15 named holidays, 2020-2035. No auth, no rate limit.",
      `${SITE_URL}/api/holiday/{slug}/{year}.json`,
    ),
  ];
  return [
    pageNode(path, "TechArticle", {
      description: metaFor(path).description,
      inLanguage: "en",
      dateModified: FEED_BUILD_DATE,
      mainEntity: apis.map((a) => ({ "@id": a["@id"] })),
    }),
    ...apis,
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "en",
      dateModified: FEED_BUILD_DATE,
      mainEntity: [
        {
          "@type": "Question",
          name: "Is there a rate limit?",
          acceptedAnswer: { "@type": "Answer", text: "No — these are static files served from a CDN, not a rate-limited API." },
        },
        {
          "@type": "Question",
          name: "Do I need an API key?",
          acceptedAnswer: { "@type": "Answer", text: "No authentication is required for any endpoint." },
        },
      ],
    },
  ];
}

// /chrome-extension: the extension itself as a SoftwareApplication (the
// page's mainEntity), a HowTo for the install steps and a FAQPage — all
// three read chromeExtensionContent.js, the same module ChromeExtension.jsx
// renders from, so the visible feature list, <ol> steps and <details> FAQ
// can't drift from the schema (invariant #9). No aggregateRating: the store
// listing has no ratings yet, and a made-up one would be invented data.
function chromeExtensionNodes() {
  const path = CHROME_EXTENSION_PATH;
  const url = canonicalFor(path);
  const f = EXTENSION_FACTS;
  const appId = `${url}#software`;
  return [
    pageNode(path, "WebPage", {
      description: metaFor(path).description,
      dateModified: f.updated,
      mainEntity: { "@id": appId },
      about: { "@id": appId },
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-sentence"] },
    }),
    {
      "@type": "SoftwareApplication",
      "@id": appId,
      name: f.name,
      alternateName: "Viikko Nro Chrome-laajennus",
      description:
        "Ilmainen Chrome-laajennus, joka näyttää kuluvan ISO 8601 -viikon numeron selaimen työkalupalkissa sekä viikon päivämäärät, liputuspäivät ja koululomat. Viikkohaku osoiteriviltä komennolla vk.",
      url,
      sameAs: f.storeUrl,
      installUrl: f.storeUrl,
      downloadUrl: f.storeUrl,
      image: `${SITE_URL}/favicon-viikkonro-20260915.svg`,
      applicationCategory: "BrowserApplication",
      applicationSubCategory: f.category,
      operatingSystem: "Windows, macOS, Linux, ChromeOS",
      browserRequirements: "Requires Google Chrome",
      softwareVersion: f.version,
      fileSize: f.size,
      dateModified: f.updated,
      inLanguage: f.languageCodes,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: EXTENSION_FEATURES.map((x) => `${x.name}: ${x.desc}`),
      permissions: "Tallennus (asetukset), ajastin (keskiyön päivitys)",
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    },
    {
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: "Näin asennat Viikko Nro -Chrome-laajennuksen",
      inLanguage: "fi-FI",
      totalTime: "PT1M",
      tool: { "@type": "HowToTool", name: "Google Chrome" },
      step: INSTALL_STEPS.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.name,
        text: step.text,
        url: `${url}#asennus`,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: f.updated,
      mainEntity: chromeExtensionFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

// The 5 dataset landing pages (/data/week, /data/month, /data/year,
// /data/holiday, /data/working-days) — FAQPage only, sourced from
// datasetPageFaqs() (src/data/datasetPages.js), the same function the
// visible <details> list renders from. WebPage node comes from the
// generic fallback, same as every other unadorned static page.
function datasetPageNodes(family) {
  const url = `${SITE_URL}/data/${family}`;
  return [{
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    inLanguage: "fi-FI",
    dateModified: FEED_BUILD_DATE,
    mainEntity: datasetPageFaqs(family).map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// The homepage renders only the curated featured questions. Keep this as a
// separate FAQPage entity so its structured data matches exactly what users
// can expand on that page instead of claiming all /ukk answers are present.
function homepageFaqNodes() {
  return [{
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: featuredFaqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

function englishPageNodes() {
  const url = canonicalFor("/en");
  const meta = metaFor("/en");
  return [
      pageNode("/en", "WebPage", {
        name: "What is the current week number?",
        description: meta.description,
        inLanguage: "en",
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
      }),
      {
        "@type": "FAQPage",
        "@id": url + "#faq",
        inLanguage: "en",
        dateModified: CONTENT_UPDATED,
        mainEntity: englishFaqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

function languageAlternateLinks(url) {
  if (["/", "/en"].includes(url)) {
    return (
      '<link rel="alternate" hreflang="fi" href="' + canonicalFor("/") + '" />' +
      '<link rel="alternate" hreflang="en" href="' + canonicalFor("/en") + '" />' +
      '<link rel="alternate" hreflang="x-default" href="' + canonicalFor("/") + '" />'
    );
  }
  return "";
}

// Declares each week/year/holidays page's JSON twin the same way an RSS feed
// is declared — a standard <link rel="alternate"> pointer, not a new
// discovery mechanism — so an agent that has already fetched the HTML page
// can find its machine-readable equivalent without guessing the /data/ URL
// pattern. Deliberately scoped to exactly the three route families STEP 2
// generates feeds for.
function jsonFeedAlternateLink(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/week/${m[2]}/${m[1]}.json" />`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/year/${m[1]}.json" />`;
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/holidays/${m[1]}.json" />`;
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/flag-days/${m[1]}.json" />`;
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/quarter/${m[2]}/${m[1]}.json" />`;
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    if (mi === -1) return "";
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/monthly-working-days/${m[2]}/${mi + 1}.json" />`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `<link rel="alternate" type="application/json" href="${SITE_URL}/data/month/${m[2]}/${m[1]}.json" />`;
  }
  return "";
}

// Declares each year's downloadable PDF the same way jsonFeedAlternateLink()
// declares a page's JSON twin. All four /kalenteri-<year>[-alkuvuosi|
// -loppuvuosi]/tulostettava-kalenteri-<year> variants share one full-year PDF
// — same route family the per-year OG image (calOg, below) already reuses
// across — so this uses the identical regex rather than re-deriving the
// grouping logic a second time.
function pdfAlternateLink(url) {
  let m;
  if ((m = url.match(/^\/(?:tulostettava-)?kalenteri-(\d+)/))) {
    return `<link rel="alternate" type="application/pdf" href="${SITE_URL}${calendarPdfPath(m[1])}" />`;
  }
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `<link rel="alternate" type="application/pdf" href="${SITE_URL}${weekPdfPath(m[1], m[2])}" />`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `<link rel="alternate" type="application/pdf" href="${SITE_URL}${monthPdfPath(m[1], m[2])}" />`;
  }
  return "";
}

function currentDateIntentNodes(url) {
  const now = new Date();
  const configs = {
    "/mika-kuukausi-nyt": {
      headline: "Mikä kuukausi nyt on?",
      meta: currentMonthMeta(now),
      faq: currentMonthFaqs(now),
    },
    "/mika-vuosi-nyt": {
      headline: "Mikä vuosi nyt on?",
      meta: currentYearMeta(now),
      faq: currentYearFaqs(now),
    },
    "/viikonpaiva": {
      headline: "Mikä viikonpäivä oli?",
      meta: weekdayMeta,
      faq: weekdayFaqs,
      steps: [
        "Valitse päivämäärä kentästä.",
        "Lue tuloksesta viikonpäivä suomeksi.",
        "Tarkista samalla päivän ISO-viikkonumero ja viikkovuosi.",
      ],
    },
  };
  const config = configs[url];
  if (!config) return [];
  const canonical = canonicalFor(url);
  const graph = [
    pageNode(url, "WebPage", {
      name: config.headline,
      description: config.meta.description,
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
    }),
    {
      "@type": "Article",
      "@id": canonical + "#article",
      headline: config.headline,
      description: config.meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      author: { "@id": SITE_URL + "/#organization" },
      publisher: { "@id": SITE_URL + "/#organization" },
      mainEntityOfPage: { "@id": canonical + "#webpage" },
    },
    {
      "@type": "FAQPage",
      "@id": canonical + "#faq",
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: config.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
  if (config.steps) {
    graph.push({
      "@type": "HowTo",
      "@id": canonical + "#howto",
      name: "Näin selvität päivämäärän viikonpäivän",
      dateModified: CONTENT_UPDATED,
      step: config.steps.map((item, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        text: item,
      })),
    });
  }
  return graph;
}

// Article + FAQPage structured data for the /mika-on-viikkonumero explainer.
// BreadcrumbList is added separately, so it is not repeated
// here. The FAQ entries mirror the page's visible <details> list exactly.
function mikaOnViikkonumeroNodes() {
  const faq = whatWeekFaqs;
  const url = canonicalFor("/mika-on-viikkonumero");
  const meta = metaFor("/mika-on-viikkonumero");
  return [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: "Mikä on viikkonumero? ISO 8601 -viikkolaskenta selitettynä",
        description: meta.description,
        inLanguage: "fi-FI",
        datePublished: "2026-01-01",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        about: [
          { "@type": "Thing", name: "ISO 8601" },
          { "@type": "Thing", name: "Viikkonumero" },
          { "@type": "Thing", name: "Kalenteri" },
        ],
      },
      pageNode("/mika-on-viikkonumero", "WebPage", {
        description: meta.description,
        datePublished: "2026-01-01",
        dateModified: CONTENT_UPDATED,
        mainEntity: { "@id": `${url}#article` },
      }),
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/mika-on-viikkonumero#faq`,
        inLanguage: "fi-FI",
        dateModified: CONTENT_UPDATED,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "HowTo",
        "@id": `${url}#howto`,
        name: "Näin lasket viikkonumeron käsin",
        description:
          "Kolmen vaiheen menetelmä päivämäärän ISO 8601 -viikkonumeron laskemiseen.",
        inLanguage: "fi-FI",
        mainEntityOfPage: { "@id": `${url}#webpage` },
        step: [
          "Etsi tarkasteltavan päivän sisältävän viikon torstai.",
          "Katso, mihin vuoteen torstai kuuluu – se on ISO-viikkovuosi.",
          "Laske, kuinka mones torstai se on kyseisenä vuonna – se on viikkonumero.",
        ].map((text, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          text,
        })),
      },
    ];
}

function weekStartsMondayNodes() {
  const path = "/viikko-alkaa-maanantaista";
  const url = canonicalFor(path);
  const meta = metaFor(path);
  return [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: "Miksi viikko alkaa maanantaista?",
        description: meta.description,
        inLanguage: "fi-FI",
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        about: [
          { "@type": "Thing", name: "ISO 8601" },
          { "@type": "Thing", name: "Viikon ensimmäinen päivä" },
          { "@type": "Thing", name: "ISO-viikkovuosi" },
        ],
      },
      pageNode(path, "WebPage", {
        description: meta.description,
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        mainEntity: { "@id": `${url}#article` },
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: "fi-FI",
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        mainEntity: weekStartsMondayFaqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

// Article + WebPage + FAQPage for /suomi-vs-usa-viikkonumerot — same shape as
// weekStartsMondayNodes() above, including its own explicit pageNode() (not
// the generic fallback) so the Article <-> WebPage reference is reciprocal.
// Speakable is set directly here, same as namedHolidayNodes()'s own pageNode.
function finlandVsUsaNodes() {
  const path = "/suomi-vs-usa-viikkonumerot";
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const faq = finlandVsUsaFaqs();
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Suomi vs. USA: miksi viikkonumero eroaa?",
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-08-05",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      about: [
        { "@type": "Thing", name: "ISO 8601" },
        { "@type": "Thing", name: "Viikkonumero" },
        { "@type": "Thing", name: "Yhdysvaltain viikkonumerointi" },
      ],
    },
    pageNode(path, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-05",
      dateModified: CONTENT_UPDATED,
      mainEntity: { "@id": `${url}#article` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-05",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

function printIntentNodes(pathname) {
  const listMatch = pathname.match(/^\/tulosta-(\d+)$/);
  const calendarMatch = pathname.match(/^\/tulostettava-kalenteri-(\d+)$/);
  if (!listMatch && !calendarMatch) return [];

  const year = Number((listMatch || calendarMatch)[1]);
  const faqsForPage = listMatch
    ? printListFaqs(year)
    : printableCalendarFaqs(year);
  const url = canonicalFor(pathname);
  const meta = metaFor(pathname);
  return [
      pageNode(pathname, "WebPage", {
        description: meta.description,
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        mainEntity: { "@id": `${url}#faq` },
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: "fi-FI",
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        mainEntity: faqsForPage.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

function schoolHolidayNodes(year) {
  const pathname = `/koululomat-${year}`;
  const url = canonicalFor(pathname);
  const meta = metaFor(pathname);
  const page = schoolHolidayPage(year);
  if (!meta || !page) return [];
  const faq = schoolHolidayFaqs(year);
  const citations = page.sourceKeys.map(
    (key) => SCHOOL_HOLIDAY_SOURCES[key].url,
  );
  return [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: `Koululomat ${year} – hiihto- ja syyslomat`,
        description: meta.description,
        inLanguage: "fi-FI",
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        citation: citations,
        about: [
          { "@type": "Thing", name: `Koululomat ${year}` },
          { "@type": "Thing", name: "Hiihtoloma" },
          { "@type": "Thing", name: "Syysloma" },
        ],
      },
      pageNode(pathname, "WebPage", {
        description: meta.description,
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        mainEntity: { "@id": `${url}#article` },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".answer-sentence"],
        },
      }),
      // STEP 7 safeguard: even though a non-CONFIRMED page never reaches this
      // function (schoolHolidayMeta() sets robots:"noindex" for it, which
      // the dispatch loop's isIndexable/meta.robots check already skips this
      // whole function for), don't ALSO rely on that being the only gate —
      // schoolHolidayFaqs() itself returns [] for anything but Tier A, so
      // skip emitting an empty FAQPage rather than trust a single check.
      ...(faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              inLanguage: "fi-FI",
              datePublished: "2026-08-04",
              dateModified: CONTENT_UPDATED,
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ]
        : []),
    ];
}

// Article + FAQPage data for the expanded weeks-per-year explainer. FAQs are
// shared with the visible page so schema and rendered answers stay identical.
function weeksInYearNodes() {
  const url = canonicalFor("/kuinka-monta-viikkoa-vuodessa");
  const meta = metaFor("/kuinka-monta-viikkoa-vuodessa");
  const faq = weeksInYearFaqs(currentYear);
  return [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: "Kuinka monta viikkoa vuodessa on?",
        description: meta.description,
        inLanguage: "fi-FI",
        datePublished: "2026-01-01",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        about: [
          { "@type": "Thing", name: "ISO 8601" },
          { "@type": "Thing", name: "Viikkovuosi" },
          { "@type": "Thing", name: "Viikko 53" },
        ],
      },
      pageNode("/kuinka-monta-viikkoa-vuodessa", "WebPage", {
        description: meta.description,
        datePublished: "2026-01-01",
        dateModified: CONTENT_UPDATED,
        mainEntity: { "@id": `${url}#article` },
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: "fi-FI",
        datePublished: "2026-01-01",
        dateModified: CONTENT_UPDATED,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ISO date-only string ("2026-08-03") — shared by holidaysEventNodes()'s
// Event dates and the /data/* JSON feeds below, so both formats can never
// drift apart on the same date.
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ItemList of a year's public holidays, injected only on /pyhapaivat-<year>,
// whose visible table lists these same holidays. Each entry links to that
// holiday's own /pyhat-<year>/<slug> page — same flat {position, name, url}
// ListItem shape calendarPageNodes()'s month ItemList already uses, not a
// nested "item" sub-object, so this doesn't introduce a second convention.
//
// NOT schema.org/Event: a public holiday is a calendar-date designation, not
// a thing-at-a-place you attend. Google's own Event structured-data guidance
// explicitly lists "non-event dates, such as national holidays" among what
// NOT to mark up as Event — the previous version here forced eventStatus/
// eventAttendanceMode/location onto a value that never had a status, mode,
// or venue (location was a whole country, standing in for "no real venue").
// holidayLinkPath() can return null for an unmapped holiday (defensive
// fallback, not currently hit for any of the 15 named holidays); such an
// entry keeps its name but drops url rather than link a 404.
function holidaysEventNodes(year) {
  return [{
    "@type": "ItemList",
    "@id": `${SITE_URL}/pyhapaivat-${year}#events`,
    name: `Suomen pyhäpäivät ${year}`,
    itemListElement: holidaysInYear(year).map((h, i) => {
      const path = holidayLinkPath(h.name, h.date);
      return {
        "@type": "ListItem",
        position: i + 1,
        name: h.name,
        ...(path ? { url: canonicalFor(path) } : {}),
      };
    }),
  }];
}

// CollectionPage (STEP 6/7) + FAQPage + Speakable for /liputuspaivat-<year>.
// Bundled into one function like calendarPageNodes()/quarterNodes() above.
// Reuses flagDaysInYear()/flagDayFaqs() (flagDayPages.js), so this can't
// disagree with FlagDays.jsx's visible table.
//
// Each flag day links to its own row on that page (FlagDays.jsx gives every
// row id={d.slug}) rather than being wrapped as schema.org/Event: a flag day
// is a calendar-date designation with no venue or attendance, the same
// reason holidaysEventNodes() above no longer uses Event either. Flat
// {position, name, url} ListItem, matching that same fix.
function flagDayNodes(year) {
  const path = `/liputuspaivat-${year}`;
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const days = flagDaysInYear(year);
  const faq = flagDayFaqs(year);

  const itemListElement = days.map((d, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: d.name,
    url: `${url}#${d.slug}`,
  }));

  return [
    pageNode(path, "CollectionPage", {
      name: `Suomen liputuspäivät ${year}`,
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      ...ogImageExtra(path),
      ...entityParentExtra(path),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

// Holidays landing within ISO week `week` of ISO year `isoYearNum`.
function holidaysInWeekForPrerender(isoYearNum, week) {
  const monday = mondayOf(week, isoYearNum);
  const sunday = addDays(monday, 6);
  const years = new Set([monday.getFullYear(), sunday.getFullYear()]);
  const candidates = [...years].flatMap((y) => holidaysInYear(y));
  return candidates
    .filter((h) => h.date >= monday && h.date <= sunday)
    .sort((x, y) => x.date - y.date);
}

// Flag days landing within ISO week `week` of ISO year `isoYearNum` — same
// both-calendar-year check as holidaysInWeekForPrerender() above, for the
// same boundary-week reason (used by the week PDF below).
function flagDaysInWeekForPrerender(isoYearNum, week) {
  const monday = mondayOf(week, isoYearNum);
  const sunday = addDays(monday, 6);
  const years = new Set([monday.getFullYear(), sunday.getFullYear()]);
  const candidates = [...years].flatMap((y) => flagDaysInYear(y));
  return candidates
    .filter((f) => f.date >= monday && f.date <= sunday)
    .sort((x, y) => x.date - y.date);
}

// Per-week FAQPage structured data for the ~835 /viikko-<w>-<y> pages — real,
// genuinely page-specific Q&As (this week's actual dates and holidays), not a
// copy-pasted template. Google has narrowed FAQ rich results to mostly
// authoritative/health/gov sites, so this is a GEO/AI-citation play (answer
// engines citing the exact page for "what week is 3.8.2026") rather than a
// rich-snippet bet — consistent with the llms.txt/ai.txt investment already
// in this repo. Mirrors the visible <details> list added to WeekDays.jsx.
function weekFaqNodes(w, y) {
  const mo = mondayOf(w, y);
  const su = addDays(mo, 6);
  const moStr = fmtShortFi(mo);
  const suStr = fmtShortFi(su);
  const officialHolidays = holidaysInWeekForPrerender(y, w).filter((h) => h.official);

  const faq = [
    [`Mikä viikko on ${moStr}?`, `${moStr} kuuluu viikkoon ${w} vuonna ${y}.`],
    [
      `Milloin viikko ${w} vuonna ${y} alkaa ja päättyy?`,
      `Viikko ${w} vuonna ${y} alkaa maanantaina ${moStr} ja päättyy sunnuntaina ${suStr}.`,
    ],
  ];
  if (officialHolidays.length > 0) {
    faq.push([
      `Mitä juhlapäiviä viikolla ${w} vuonna ${y} on?`,
      `Viikolla ${w} vuonna ${y} vietetään: ${officialHolidays.map((h) => h.name).join(", ")}.`,
    ]);
  }

  return [{
    "@type": "FAQPage",
    "@id": `${canonicalFor(`/viikko-${w}-${y}`)}#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }];
}

// FAQPage structured data for the /tyopaivat-<year> hub. The FAQ entries come
// from workingDaysFaqs() in seo.js — the same function WorkingDays.jsx will
// use to render its visible <details> list, so the two can't drift (same
// discipline as calendarFaqs()).
function workingDaysFaqNodes(year) {
  const faq = workingDaysFaqs(year);
  return [{
    "@type": "FAQPage",
    "@id": `${canonicalFor(`/tyopaivat-${year}`)}#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// FAQPage structured data for /kuukausi-<month>-<year>. Deliberately separate
// from weekCollectionNodes() below, which already supplies this same URL's
// CollectionPage node (the month's week grid, as an ItemList) — the dispatch
// loop pushes both onto the same page's @graph rather than one function
// doing both jobs, since the two were built at different times against
// different, already-shipped patterns and neither needed touching to add the
// other. The FAQ entries come from monthFaqs() in seo.js, the same function
// WeeksInEachMonth.jsx uses to render its visible <details> list.
function monthFaqNodes(month, year) {
  const faq = monthFaqs(month, year);
  return [{
    "@type": "FAQPage",
    "@id": `${canonicalFor(`/kuukausi-${month}-${year}`)}#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// FAQPage structured data for /vuosi-<year>. Deliberately separate from
// weekCollectionNodes() below, which already supplies this same URL's
// CollectionPage node (the year's week grid, as an ItemList) — same
// dispatch-loop split as monthFaqNodes()/weekCollectionNodes() above. The FAQ
// entries come from yearFaqs() in seo.js, the same function YearCalendar.jsx
// uses to render its visible <details> list.
function yearFaqNodes(year) {
  const faq = yearFaqs(year);
  return [{
    "@type": "FAQPage",
    "@id": `${canonicalFor(`/vuosi-${year}`)}#faq`,
    inLanguage: "fi-FI",
    dateModified: CONTENT_UPDATED,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }];
}

// CollectionPage (daily entries, STEP 6) + FAQPage + Speakable for a single
// month's working-day page (/tyopaivat-<slug>-<year>). Bundled into one
// function (like calendarPageNodes() above) rather than split across two
// dispatch-loop pushes, since — unlike weekCollectionNodes()/monthFaqNodes()
// — nothing else on the site shares this CollectionPage with another route.
// The FAQ entries come from monthlyWorkingDayFaqs() in seo.js, the same
// function MonthlyWorkingDays.jsx renders as its visible <details> list.
function monthlyWorkingDaysNodes(month, year) {
  const path = `/tyopaivat-${M_SLUG[month - 1]}-${year}`;
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const faq = monthlyWorkingDayFaqs(month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const officialHolidayByDay = new Map(
    holidaysInYear(year)
      .filter((h) => h.official && h.date.getMonth() === month - 1)
      .map((h) => [h.date.getDate(), h.name]),
  );
  const itemListElement = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dow = new Date(year, month - 1, day).getDay();
    const holidayName = officialHolidayByDay.get(day);
    const status = holidayName
      ? "Arkipyhä"
      : dow === 0 || dow === 6
        ? "Viikonloppu"
        : "Työpäivä";
    return {
      "@type": "ListItem",
      position: day,
      item: {
        "@type": "Thing",
        name: `${day}.${month}.${year}`,
        description: holidayName ? `${status}: ${holidayName}` : status,
      },
    };
  });

  return [
    pageNode(path, "CollectionPage", {
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      ...ogImageExtra(path),
      ...entityParentExtra(path),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

// CollectionPage (STEP 6: months as hasPart, weeks as the ItemList) + FAQPage
// + Speakable for a fiscal-quarter page (/q<1-4>-<year>). Bundled into one
// function like calendarPageNodes()/monthlyWorkingDaysNodes() above, since
// nothing else on the site shares a quarter's CollectionPage. Reuses
// quarterStats() (itself built from monthStats()) for both the week ItemList
// and the FAQ, so this can't disagree with QuarterPage.jsx's visible content.
function quarterNodes(quarter, year) {
  const path = `/q${quarter}-${year}`;
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const stats = quarterStats(year, quarter);
  const faq = quarterFaqs(quarter, year);

  // @id references to each month's own #webpage node (not inline WebPage
  // stubs) — the same cross-document node-reference convention every page
  // already uses for isPartOf/publisher, so a consumer can follow the edge
  // to the real, fuller node rather than a disconnected duplicate.
  const hasPart = stats.months.map((m) => ({
    "@id": `${canonicalFor(`/kuukausi-${m}-${year}`)}#webpage`,
  }));
  const itemListElement = stats.weeks.map((w, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: canonicalFor(`/viikko-${w.week}-${w.year}`),
  }));

  return [
    pageNode(path, "CollectionPage", {
      name: `Q${quarter} ${year}`,
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      hasPart,
      ...ogImageExtra(path),
      ...entityParentExtra(path),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

// CollectionPage + FAQPage data for the full /kalenteri-<year> landing pages.
// The FAQ entries come from the same source as the visible <details> list.
function calendarPageNodes(year) {
  const url = canonicalFor(`/kalenteri-${year}`);
  const meta = calendarMeta(year, null, false);
  const faq = calendarFaqs(year);
  return [
      pageNode(`/kalenteri-${year}`, "CollectionPage", {
        description: meta.description,
        datePublished: "2026-08-03",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        // Downloadable twin of this page (STEP: PDF calendars) — same
        // associatedMedia/MediaObject shape schema.org uses for a
        // CreativeWork's attached file, not the DataDownload/Dataset shape
        // datasetNodes() uses below (this is one printable document, not a
        // machine-readable data feed).
        associatedMedia: {
          "@type": "MediaObject",
          "@id": `${SITE_URL}${calendarPdfPath(year)}#media`,
          name: `A4-kuukausikalenteri ${year} (PDF)`,
          contentUrl: `${SITE_URL}${calendarPdfPath(year)}`,
          encodingFormat: "application/pdf",
          inLanguage: "fi-FI",
          dateModified: CONTENT_UPDATED,
        },
        ...ogImageExtra(`/kalenteri-${year}`),
        ...entityParentExtra(`/kalenteri-${year}`),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: 12,
          itemListElement: Array.from({ length: 12 }, (_, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: canonicalFor(`/kuukausi-${index + 1}-${year}`),
          })),
        },
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: "fi-FI",
        datePublished: "2026-08-03",
        dateModified: CONTENT_UPDATED,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

// Year and month pages are directories of week pages, so CollectionPage with
// an ItemList describes their visible linked grids more accurately than a
// generic WebPage. Full calendar pages have their own richer function above.
function weekCollectionNodes(pathname) {
  let match = pathname.match(/^\/vuosi-(\d+)$/);
  let urls;
  let collectionName;
  let hasPart;
  let speakable;
  let mentions;

  if (match) {
    const year = Number(match[1]);
    collectionName = `Viikkonumerot ${year}`;
    urls = Array.from(
      { length: weeksInIsoYear(year) },
      (_, index) => canonicalFor(`/viikko-${index + 1}-${year}`),
    );
    // The year page also links out to its 12 month pages and 4 quarter pages
    // (see YearCalendar.jsx's month pill row) — surfaced here as hasPart @id
    // references to each page's own #webpage node, alongside the week
    // ItemList, rather than folding them into one mixed ItemList, so the
    // existing week-only mainEntity contract stays unchanged for any consumer.
    hasPart = [
      ...M_FULL.map((_, index) => ({
        "@id": `${canonicalFor(`/kuukausi-${index + 1}-${year}`)}#webpage`,
      })),
      ...[1, 2, 3, 4].map((q) => ({
        "@id": `${canonicalFor(`/q${q}-${year}`)}#webpage`,
      })),
    ];
    speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: [".answer-sentence"],
    };
  } else {
    match = pathname.match(/^\/kuukausi-(\d+)-(\d+)$/);
    if (!match) return [];
    const month = Number(match[1]);
    const year = Number(match[2]);
    const seen = new Set();
    urls = [];
    const days = new Date(year, month, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(year, month - 1, day);
      const weekYear = isoYear(date);
      const week = isoWeek(date);
      const key = `${weekYear}-${week}`;
      if (
        seen.has(key) ||
        weekYear < PRERENDER_MIN_YEAR ||
        weekYear > PRERENDER_MAX_YEAR
      ) {
        continue;
      }
      seen.add(key);
      urls.push(canonicalFor(`/viikko-${week}-${weekYear}`));
    }
    collectionName = metaFor(pathname).title;
    // Month pages carry a short factual summary sentence (WeeksInEachMonth.jsx's
    // .answer-sentence — "Kesäkuu 2026 sisältää N viikkoa: viikot X-Y.").
    speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: [".answer-sentence"],
    };
    // Month -> Holiday: every holiday in this month, official or not — the
    // same unfiltered set WeeksInEachMonth.jsx's monthHolidays links
    // visibly (the "Pyhäpäivät <kuukausi>" note-soft block), so schema and
    // rendered HTML can't disagree. The other half of namedHolidayNodes()'s
    // Holiday -> Month mention above.
    const monthHolidayMentions = holidaysInYear(year)
      .filter((h) => h.date.getMonth() === month - 1)
      .map((h) => holidayLinkPath(h.name, h.date))
      .filter(Boolean)
      .map((path) => ({ "@id": `${canonicalFor(path)}#webpage` }));
    if (monthHolidayMentions.length > 0) mentions = monthHolidayMentions;
  }

  const meta = metaFor(pathname);
  return [pageNode(pathname, "CollectionPage", {
    name: collectionName,
    description: meta.description,
    dateModified: CONTENT_UPDATED,
    author: { "@id": `${SITE_URL}/#organization` },
    ...(hasPart ? { hasPart } : {}),
    ...(speakable ? { speakable } : {}),
    ...(mentions ? { mentions } : {}),
    ...ogImageExtra(pathname),
    ...monthPdfExtra(pathname),
    ...entityParentExtra(pathname),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: urls.length,
      itemListElement: urls.map((url, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url,
      })),
    },
  })];
}

// WebPage + FAQPage data for each named-holiday landing page. The visible
// content, metadata and schema all use holidayPages.js, so dates and answers
// cannot drift between the three representations.
//
// No Event node: a named holiday is a calendar-date designation, not a
// thing-at-a-place you attend — the same reason holidaysEventNodes() and
// flagDayNodes() above no longer use Event either. The removed node forced
// eventStatus/eventAttendanceMode/a country-as-venue location onto a page
// that has none of those. Its one genuine, correctly-typed replacement is
// `about`: a plain schema.org/Thing naming what the page is about, which
// makes no attendability claim.
function namedHolidayNodes(year, slug) {
  const page = holidayPageFor(year, slug);
  if (!page) return [];
  const meta = holidayPageMeta(year, slug);
  const faq = holidayFaqs(page);
  const url = canonicalFor(page.path);
  // Holiday -> Week/Month structured-data links (bidirectional linking
  // system), built from the exact same helper NamedHoliday.jsx's visible
  // links use, so the schema and the page content can't disagree.
  const links = holidayWeekLinks(page);
  return [
      pageNode(page.path, "WebPage", {
        description: meta.description,
        datePublished: "2026-08-03",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
        about: { "@type": "Thing", name: `${page.displayName} ${page.year}` },
        // Holiday -> Week/Month/Year: mirrors NamedHoliday.jsx's visible
        // links.week/links.month/links.year (Quick Facts panel + "Katso
        // myös") exactly — links.year was visibly linked but missing here
        // until this fix.
        mentions: [
          { "@id": `${canonicalFor(links.week.path)}#webpage` },
          { "@id": `${canonicalFor(links.month.path)}#webpage` },
          { "@id": `${canonicalFor(links.year.path)}#webpage` },
        ],
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".answer-sentence"],
        },
        ...ogImageExtra(page.path),
        ...entityParentExtra(page.path),
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: "fi-FI",
        datePublished: "2026-08-03",
        dateModified: CONTENT_UPDATED,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

function nameDayPageNodes(url) {
  let page;
  let meta;
  let type;
  let match;
  if (url === "/nimipaivat/tanaan") {
    page = todayNameDayPage();
    meta = todayNameDayMeta();
    type = "today";
  } else if ((match = url.match(/^\/nimipaiva\/([a-z0-9-]+)$/))) {
    page = nameDayNamePage(match[1]);
    meta = nameDayNameMeta(match[1]);
    type = "name";
  } else if ((match = url.match(/^\/nimipaivat\/(\d{2}-\d{2})$/))) {
    page = nameDayDatePage(match[1]);
    meta = nameDayDateMeta(match[1]);
    type = "date";
  }
  if (!page || !meta) return [];
  const faq = nameDayFaqs(page, type);
  const canonical = canonicalFor(url);
  return [
      pageNode(url, "WebPage", {
        description: meta.description,
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        author: { "@id": `${SITE_URL}/#organization` },
      }),
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        inLanguage: "fi-FI",
        datePublished: "2026-08-04",
        dateModified: CONTENT_UPDATED,
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ];
}

// HowTo + FAQ structured data for the four calculator pages. Each FAQ entry
// mirrors that page's visible <details> list exactly (same convention as
// mikaOnViikkonumeroNodes above and faqNodes for /ukk) — edit the page's
// JSX and this object together.
const CALCULATOR_SCHEMA = {
  "/paivamaara-viikoksi": {
    howToName: "Näin selvität päivämäärän viikkonumeron",
    steps: [
      "Valitse tai kirjoita päivämäärä yläkentässä.",
      "Työkalu näyttää heti viikkonumeron, viikonpäivän ja koko viikon päivämäärät.",
      'Avaa "avaa viikko" -linkki nähdäksesi viikon juhlapäivät, nimipäivät ja muut tiedot.',
    ],
    faq: [
      [
        "Miksi 29.–31. joulukuuta voi kuulua ensi vuoden viikkoon 1?",
        "ISO 8601 -standardin mukaan vuoden ensimmäinen viikko on se, johon vuoden ensimmäinen torstai osuu. Jos esimerkiksi 1. tammikuuta on torstai, myös sitä edeltävä maanantai (29. joulukuuta) kuuluu jo uuden vuoden viikkoon 1.",
      ],
      [
        "Toimiiko laskuri myös menneille päivämäärille?",
        'Kyllä, laskuri laskee viikkonumeron mille tahansa päivämäärälle. "Avaa viikko" -linkki vie tarkempiin tietoihin vuosilta 2020–2035; tätä väliä vanhemmat tai uudemmat päivämäärät saavat silti oikean viikkonumeron, mutta ilman omaa tietosivua.',
      ],
      [
        "Mistä standardista viikkonumero lasketaan?",
        "ISO 8601 -standardista, jota käytetään Suomessa ja koko Euroopassa. Katso tarkempi selitys sivulta Mikä on viikkonumero.",
      ],
    ],
  },
  "/viikko-paivamaaraksi": {
    howToName: "Näin selvität viikon alkamis- ja päättymispäivän",
    steps: [
      "Syötä viikkonumero (1–53).",
      "Syötä vuosi.",
      "Näet heti viikon alkamis- ja päättymispäivän sekä kaikki seitsemän viikonpäivää.",
    ],
    faq: [
      [
        "Miksi viikko 1 voi alkaa jo edellisenä joulukuuna?",
        "Koska vuoden ensimmäinen viikko määräytyy vuoden ensimmäisen torstain mukaan, sen maanantai voi olla vielä edellisen kalenterivuoden puolella. Esimerkiksi viikko 1/2026 alkaa maanantaina 29.12.2025.",
      ],
      [
        "Onko joka vuodessa viikko 53?",
        "Ei. Useimmissa vuosissa on 52 viikkoa; viikko 53 esiintyy vain noin joka viidennessä tai kuudennessa vuodessa. Katso, mitkä vuodet ovat 53 viikon vuosia.",
      ],
      [
        "Mitä tapahtuu, jos syötän viikon, jota kyseisessä vuodessa ei ole?",
        "Laskuri ei näytä tulosta, koska sellaista viikkoa ei ole olemassa kyseiselle vuodelle. Tarkista ensin, onko vuodessa 52 vai 53 viikkoa.",
      ],
    ],
  },
  "/tyopaivalaskuri": {
    howToName: "Näin lasket työpäivät kahden päivämäärän välillä",
    steps: [
      "Valitse alkupäivä.",
      "Valitse loppupäivä.",
      "Näet heti työpäivien, viikonlopun päivien ja arkipyhien määrän sekä päivien kokonaismäärän.",
    ],
    faq: [
      [
        "Lasketaanko jouluaatto ja juhannusaatto työpäiviksi?",
        "Kyllä. Kumpikaan ei ole Suomen lain mukaan virallinen arkipyhä, vaikka suurin osa työpaikoista on kiinni tai lyhentää työaikaa niinä päivinä. Tämä laskuri noudattaa lain mukaista listaa virallisista arkipyhistä.",
      ],
      [
        "Lasketaanko alku- ja loppupäivä mukaan?",
        "Kyllä, molemmat syöttämäsi päivämäärät sisältyvät laskentaan.",
      ],
      [
        "Mistä arkipyhät haetaan?",
        "Suomen 13 virallisesta arkipyhästä, mukaan lukien liikkuvat pyhät kuten pääsiäinen, helatorstai, helluntai ja juhannuspäivä. Koko lista löytyy vuoden pyhäpäivät-sivulta.",
      ],
    ],
  },
  "/paivien-erotus": {
    howToName: "Näin lasket päivien erotuksen kahden päivämäärän välillä",
    steps: [
      "Valitse ensimmäinen päivämäärä.",
      "Valitse toinen päivämäärä.",
      "Näet heti päivien ja viikkojen erotuksen.",
    ],
    faq: [
      [
        "Lasketaanko molemmat päivämäärät mukaan erotukseen?",
        "Erotus on päivämäärien välinen etäisyys, ei niiden välissä olevien kalenteripäivien lukumäärä molemmat reunat mukaan lukien. Esimerkiksi 1.1. ja 2.1. välissä on 1 päivä.",
      ],
      [
        "Mitä eroa tällä ja työpäivälaskurilla on?",
        "Tämä laskuri laskee kaikki päivät, myös viikonloput ja arkipyhät. Jos tarvitset vain arkipäivien määrän, käytä työpäivälaskuria.",
      ],
      [
        "Miksi koko kalenterivuoden erotus on 364 eikä 365 päivää?",
        "Koska erotus lasketaan päivämäärien välisenä etäisyytenä. Esimerkiksi 1.1. ja 31.12. saman vuoden välissä on 364 päivää, vaikka vuodessa on 365 (tai karkausvuonna 366) päivää.",
      ],
    ],
  },
};

function calculatorNodes(url) {
  const entry = CALCULATOR_SCHEMA[url];
  if (!entry) return [];
  return [
      {
        "@type": "HowTo",
        name: entry.howToName,
        dateModified: CONTENT_UPDATED,
        step: entry.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text: s,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalFor(url)}#faq`,
        inLanguage: "fi-FI",
        dateModified: CONTENT_UPDATED,
        mainEntity: entry.faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ];
}

// The <SEO> component renders <title>/<meta> via Helmet, and React emits those
// inline in the SSR output — which would leave a duplicate <title> inside
// <body>. The authoritative tags are written into <head> by applyMeta() above,
// and the client re-hoists them into <head> itself on render, so drop the
// inline copies from the static markup. (Image <link rel="preload"> tags are
// valid in <body> and genuinely help LCP, so they stay.)
function stripInlineMeta(appHtml) {
  return appHtml
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(/<meta\s+name="(?:description|robots)"[^>]*>/g, "")
    // <SEO> also renders a <link rel="canonical"> via Helmet, which lands
    // inline in the SSR body; the authoritative one is written into <head> by
    // applyMeta(), so drop the body copy to avoid two canonicals per page.
    .replace(/<link\s+rel="canonical"[^>]*>/g, "")
    // Language alternates are injected into <head> for the Finnish and English
    // landing pages below; remove Helmet's SSR body copies.
    .replace(/<link\b[^>]*\brel="alternate"[^>]*>/g, "");
}

// Google's SERP snippet truncates titles around ~60 chars and descriptions
// around ~158 — past these, the visible snippet gets cut mid-word. A
// truncated title is close to as bad as a wrong one (same failure severity as
// a duplicate title below); a truncated description still shows a coherent,
// if shorter, snippet, so that's a warning only.
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 158;

let failures = 0;
const titleSeen = new Map();

for (const url of routes) {
  try {
    // Keep stripInlineMeta: the <SEO>/Helmet component emits <title>/<meta>
    // inline in the SSR output, which would otherwise duplicate the tags
    // applyMeta() writes into <head>.
    const appHtml = stripInlineMeta(render(url));
    // Static pages come from routeMeta; the homepage carries the live current
    // week; week/month/year/print pages are generated — all via metaFor().
    const meta = metaFor(url);
    if (!meta) {
      failures += 1;
      console.error(`no meta for ${url} — skipping`);
      continue;
    }
    const canonical = canonicalFor(url);
    const description = meta.description;

    const dupeOf = titleSeen.get(meta.title);
    if (dupeOf) {
      failures += 1;
      console.error(`duplicate <title> "${meta.title}" on both ${dupeOf} and ${url}`);
    }
    titleSeen.set(meta.title, url);

    if (meta.title.length > MAX_TITLE_LENGTH) {
      failures += 1;
      console.error(
        `<title> too long (${meta.title.length} > ${MAX_TITLE_LENGTH} chars) on ${url}: "${meta.title}"`,
      );
    }
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      console.warn(
        `<meta description> long (${description.length} > ${MAX_DESCRIPTION_LENGTH} chars) on ${url}: "${description}"`,
      );
    }

    let html = applyMeta(template, {
      title: meta.title,
      description,
      url: canonical,
    });

    const languageLinks = languageAlternateLinks(url);
    if (languageLinks) {
      html = html.replace("</head>", languageLinks + "</head>");
    }
    const feedLink = jsonFeedAlternateLink(url);
    if (feedLink) {
      html = html.replace("</head>", feedLink + "</head>");
    }
    const pdfLink = pdfAlternateLink(url);
    if (pdfLink) {
      html = html.replace("</head>", pdfLink + "</head>");
    }
    if (url === "/en" || url === "/api-playground") {
      // The base template (index.html) is Finnish-first: <html lang> and
      // og:locale are baked in as Finnish defaults with no per-page override
      // mechanism elsewhere, so any deliberately-English page ships them
      // unpatched otherwise — a real bug, not a styling nit: og:locale: fi_FI
      // on an English page actively misdescribes it to anything reading Open
      // Graph tags. The
      // <SEO lang="en"> prop these pages set doesn't reach this prerendered
      // HTML at all (react-helmet-async's output is stripped and replaced
      // by this file — see stripInlineMeta), so the fix has to live here,
      // not just in the component (the exact gap found and fixed for /en
      // earlier — api-playground is the same deliberate-English exception,
      // so it needs the same patch, not a second one).
      html = html
        .replace('<html lang="fi">', '<html lang="en">')
        .replace('<meta property="og:locale" content="fi_FI" />', '<meta property="og:locale" content="en_US" />');
    }

    // Prune the index to the high-intent window: out-of-window year pages stay
    // prerendered (navigable) but are noindexed (flip the template's default
    // index,follow) and dropped from the sitemap below.
    if (!isIndexable(url) || meta.robots?.startsWith("noindex")) {
      html = html.replace(
        'content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"',
        'content="noindex, follow"',
      );
    }

    // Per-page OG image (week/month/year/calendar/holiday) — every other
    // page keeps the site's default /og.png. ogImageUrlFor() is the same
    // function the ImageObject schema and the sitemap's <image:image>
    // extension read, so the visible preview and both machine-readable
    // signals can't point at three different images.
    const pageOg = ogImageUrlFor(url);
    if (pageOg) {
      html = html
        .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${pageOg}$2`)
        .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${pageOg}$2`);
      // The alt text describing pageOg — without this, every non-homepage
      // page kept the template's "Viikko Nro – kuluva viikkonumero" ("current
      // week") alt text even though the image itself had changed to show
      // that page's own week/month/year/holiday, actively misdescribing it.
      const pageOgAlt = ogImageAltFor(url);
      if (pageOgAlt) {
        html = html.replace(
          /(<meta property="og:image:alt" content=")[^"]*(")/,
          `$1${pageOgAlt}$2`,
        );
      }
    }

    // Noindexed archive pages keep their crawlable HTML but omit page-level
    // schema, avoiding hundreds of repeated graph payloads that parsers should
    // not index anyway.
    if (isIndexable(url) && !meta.robots?.startsWith("noindex")) {
      const nodes = [];
      const crumb = breadcrumbNode(url);
      if (crumb) nodes.push(crumb);
      // Discover image, when this URL has one — a standalone node, applies
      // uniformly across every page family without touching any of their
      // individual node-builder functions (see discoverImageNodes()'s own
      // comment for why this isn't merged into ogImageExtra()'s `image`).
      nodes.push(...discoverImageNodes(url));

      if (url === "/ukk") nodes.push(...faqNodes());
      if (url === "/") nodes.push(...homepageFaqNodes(), ...datasetNodes());
      // Dataset schema also lives on /avoin-data itself — the page that
      // documents these feeds is a better home for the full graph than
      // only the homepage, and this task's brief explicitly asked for
      // Dataset schema on the new documentation page.
      if (url === "/avoin-data") nodes.push(...openDataFaqNodes(), ...datasetNodes());
      if (url === "/tietolahteet") nodes.push(...dataSourcesFaqNodes());
      if (url === "/menetelma") nodes.push(...methodologyFaqNodes());
      if (url === "/toimitusperiaatteet") nodes.push(...editorialPolicyFaqNodes());
      if (url === "/api-playground") nodes.push(...apiPlaygroundNodes());
      if (url === CHROME_EXTENSION_PATH) nodes.push(...chromeExtensionNodes());
      const datasetPageMatch = url.match(/^\/data\/(week|month|year|holiday|working-days)$/);
      if (datasetPageMatch) nodes.push(...datasetPageNodes(datasetPageMatch[1]));
      if (url === "/en") nodes.push(...englishPageNodes());

      if (["/mika-kuukausi-nyt", "/mika-vuosi-nyt", "/viikonpaiva"].includes(url)) {
        nodes.push(...currentDateIntentNodes(url));
      }
      if (url === "/mika-on-viikkonumero") {
        nodes.push(...mikaOnViikkonumeroNodes());
      }
      if (url === "/viikko-alkaa-maanantaista") {
        nodes.push(...weekStartsMondayNodes());
      }
      if (url === "/suomi-vs-usa-viikkonumerot") {
        nodes.push(...finlandVsUsaNodes());
      }
      if (/^\/(?:tulosta-|tulostettava-kalenteri-)\d+$/.test(url)) {
        nodes.push(...printIntentNodes(url));
      }

      const schoolHolidayMatch = url.match(/^\/koululomat-(\d+)$/);
      if (schoolHolidayMatch) {
        nodes.push(...schoolHolidayNodes(Number(schoolHolidayMatch[1])));
      }
      if (url === "/kuinka-monta-viikkoa-vuodessa") {
        nodes.push(...weeksInYearNodes());
      }

      const holidaysMatch = url.match(/^\/pyhapaivat-(\d+)$/);
      if (holidaysMatch) nodes.push(...holidaysEventNodes(+holidaysMatch[1]));

      const flagDaysMatch = url.match(/^\/liputuspaivat-(\d+)$/);
      if (flagDaysMatch) nodes.push(...flagDayNodes(+flagDaysMatch[1]));

      const workingDaysMatch = url.match(/^\/tyopaivat-(\d+)$/);
      if (workingDaysMatch) nodes.push(...workingDaysFaqNodes(+workingDaysMatch[1]));

      const monthlyWorkingDaysMatch = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/);
      if (monthlyWorkingDaysMatch) {
        const mi = M_SLUG.indexOf(monthlyWorkingDaysMatch[1]);
        if (mi !== -1) {
          nodes.push(...monthlyWorkingDaysNodes(mi + 1, +monthlyWorkingDaysMatch[2]));
        }
      }

      const namedHolidayMatch = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/);
      if (namedHolidayMatch) {
        nodes.push(...namedHolidayNodes(+namedHolidayMatch[1], namedHolidayMatch[2]));
      }
      if (/^\/nimipaiva(?:t)?\//.test(url)) nodes.push(...nameDayPageNodes(url));

      const weekMatch = url.match(/^\/viikko-(\d+)-(\d+)$/);
      if (weekMatch) nodes.push(...weekFaqNodes(+weekMatch[1], +weekMatch[2]));

      const calendarMatch = url.match(/^\/kalenteri-(\d+)$/);
      if (calendarMatch) nodes.push(...calendarPageNodes(+calendarMatch[1]));

      const monthMatch = url.match(/^\/kuukausi-(\d+)-(\d+)$/);
      if (monthMatch) nodes.push(...monthFaqNodes(+monthMatch[1], +monthMatch[2]));

      const quarterMatch = url.match(/^\/q([1-4])-(\d+)$/);
      if (quarterMatch) nodes.push(...quarterNodes(+quarterMatch[1], +quarterMatch[2]));

      const yearMatch = url.match(/^\/vuosi-(\d+)$/);
      if (yearMatch) nodes.push(...yearFaqNodes(+yearMatch[1]));

      if (/^\/(?:vuosi-\d+|kuukausi-\d+-\d+)$/.test(url)) {
        nodes.push(...weekCollectionNodes(url));
      }
      if (CALCULATOR_SCHEMA[url]) nodes.push(...calculatorNodes(url));

      const pageId = `${canonical}#webpage`;
      if (!nodes.some((node) => node["@id"] === pageId)) {
        nodes.unshift(
          pageNode(url, "WebPage", {
            description,
            ...speakableExtra(url),
            ...weekHolidayMentionsExtra(url),
            ...ogImageExtra(url),
            ...weekPdfExtra(url),
            ...entityParentExtra(url),
          }),
        );
      }
      html = html.replace(
        "</head>",
        `${jsonLdBlock([...globalJsonLdNodes, ...nodes])}</head>`,
      );
    }

    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`,
    );

    // Flat files (dist/ukk.html), not dist/ukk/index.html: a real directory
    // on disk invites static hosts to auto-redirect the slash-less URL to a
    // trailing-slash one (a common directory-index convention), which fights
    // the opposite (no-trailing-slash) convention canonicalFor() declares and
    // vercel.json's "trailingSlash": false.
    const outPath =
      url === "/" ? path.join(distDir, "index.html") : path.join(distDir, `${url}.html`);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`prerendered ${url} -> ${path.relative(__dirname, outPath)}`);
  } catch (err) {
    failures += 1;
    console.error(`failed to prerender ${url}:`, err);
  }
}

// 404 page: a static dist/404.html so Vercel serves it (with a real 404 status,
// not 200) for any path that doesn't match a prerendered file. Rendered from the
// NotFound route; meta is set manually (metaFor has no 404 entry) and forced to
// noindex since the same page answers many unmatched URLs.
try {
  const nf = stripInlineMeta(render("/404"));
  let html404 = applyMeta(template, {
    title: "Sivua ei löytynyt (404) | Viikko Nro",
    description:
      "Etsimääsi sivua ei löytynyt. Palaa etusivulle ja jatka viikkonumeroiden selaamista.",
    url: `${SITE_URL}/404`,
  });
  // Flip the template's default index,follow to noindex (don't append a second
  // robots meta — the same 404 page answers many unmatched URLs).
  html404 = html404.replace(
    'content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"',
    'content="noindex, follow"',
  );
  html404 = html404.replace(
    '<div id="root"></div>',
    `<div id="root">${nf}</div>`,
  );
  fs.writeFileSync(path.join(distDir, "404.html"), html404);
  console.log("prerendered 404 -> dist/404.html");
} catch (err) {
  console.error("failed to prerender 404.html:", err);
}

// /liputuspaivat (no year) has no precedent elsewhere on this site — every
// other family (/pyhapaivat, /tyopaivat, /kalenteri, /vuosi) requires an
// explicit year — so rather than inventing a second, year-less content type
// this is a soft redirect to the current year's real page. Deliberately NOT
// routed through render()/AppRoutes's <Navigate> here: a 0-delay meta refresh
// plus a canonical pointing at the target is what Google documents as
// equivalent to a real redirect, and it needs no client JS to work, unlike
// <Navigate> (which still exists in AppRoutes.jsx for in-app SPA navigation,
// but never runs for a crawler or a fresh, pre-hydration page load). The
// target year is CURRENT_YEAR at build time, not hand-maintained — the
// nightly rebuild cron (vercel-rebuild.yml) keeps it from ever going stale,
// same freshness guarantee the homepage's current-week title already relies on.
try {
  const flagDaysTargetPath = `/liputuspaivat-${currentYear}`;
  const flagDaysTargetUrl = canonicalFor(flagDaysTargetPath);
  let htmlFlagDaysRedirect = applyMeta(template, {
    title: `Suomen liputuspäivät ${currentYear} | Viikko Nro`,
    description: `Siirry Suomen liputuspäivät ${currentYear} -sivulle: päivämäärät, viikkonumerot ja tyyppi.`,
    url: flagDaysTargetUrl,
  });
  htmlFlagDaysRedirect = htmlFlagDaysRedirect.replace(
    "</head>",
    `<meta http-equiv="refresh" content="0; url=${flagDaysTargetUrl}" /></head>`,
  );
  htmlFlagDaysRedirect = htmlFlagDaysRedirect.replace(
    '<div id="root"></div>',
    `<div id="root"><section class="app"><p>Siirrytään sivulle <a href="${flagDaysTargetPath}">Suomen liputuspäivät ${currentYear}</a>…</p></section></div>`,
  );
  fs.writeFileSync(path.join(distDir, "liputuspaivat.html"), htmlFlagDaysRedirect);
  console.log(`prerendered /liputuspaivat -> dist/liputuspaivat.html (redirects to ${flagDaysTargetPath})`);
} catch (err) {
  console.error("failed to prerender liputuspaivat.html:", err);
}

// Static machine-readable JSON feeds (STEP 2 of the GEO/AI-consumption data
// layer): one file per week/year/holiday-year, written straight to dist/ so
// Vercel serves them as plain static assets — no API route, no server, no
// auth, fully CDN-cacheable, same publishing mechanism as every prerendered
// HTML page. Every value below is read from a function this file already
// imports for the HTML pages (yearStats, holidaysInYear, the week-page date
// math) — no new day-counting logic, so a feed value and its HTML/schema
// equivalent can never disagree (STEP 6).
function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

// CSV/XML writers for the bulk (one-file-per-year, not one-per-record)
// exports — see docs/downloadable-datasets.md for why bulk: CSV/XML are
// consumed as whole datasets, not one row at a time, unlike the JSON API.
function writeCsv(filePath, header, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(","), ...rows.map((r) => r.map(esc).join(","))];
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}
function xmlEscape(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function writeXml(filePath, xmlBody) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}\n`);
}
// Semicolon-joined name list for a CSV cell (holidays/flagDays columns) —
// matches the shape already documented in downloadable-datasets.md.
function nameList(items) {
  return items.map((i) => i.name).join("; ");
}

// Working days in a single ISO week (Mon–Fri minus official holidays) — the
// one genuinely new calculation this feature needs, since nothing before now
// exposed a per-week count as a plain function (WeekDays.jsx computes its own
// copy inline for its Quick Facts block, but that file has JSX prerender.js
// can't import directly — see holidaysInWeekForPrerender() above for the
// same constraint on the holiday list itself).
function weekWorkingDaysCount(monday, officialHolidays) {
  const officialDates = new Set(officialHolidays.map((h) => h.date.toDateString()));
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(monday, i);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !officialDates.has(d.toDateString())) count += 1;
  }
  return count;
}

const dataDir = path.join(distDir, "data");
const weekManifest = []; // { year, weekCount, indexUrl }
const yearManifest = []; // { year, url }
const holidaysManifest = []; // { year, url }
const flagDaysManifest = []; // { year, url }
const holidayDetailManifest = []; // { year, indexUrl }
const quarterManifest = []; // { year, quarter, url }
const monthlyWorkingDaysManifest = []; // { year, month, url }
const monthManifest = []; // { year, month, url }
const allYearsRows = []; // accumulated across every iteration, for the single bulk /data/year.csv|.xml (see below the loop)
let feedFileCount = 0;

for (let y = 2020; y <= currentYear + 9; y += 1) {
  // /data/year/<year>.json — reuses yearStats() (seo.js), the same function
  // powering YearCalendar.jsx's Quick Facts and yearFaqs().
  const yStats = yearStats(y);
  const yearHolidaysOut = holidaysInYear(y).map((h) => ({
    name: h.name,
    date: ymd(h.date),
    official: h.official,
  }));
  const yearFlagDaysOut = flagDaysInYear(y).map((f) => ({
    name: f.name,
    date: ymd(f.date),
  }));
  writeJson(path.join(dataDir, "year", `${y}.json`), {
    schemaVersion: FEED_SCHEMA_VERSION,
    year: y,
    weekCount: yStats.weekCount,
    workingDays: yStats.working,
    weekendDays: yStats.weekend,
    holidays: yearHolidaysOut,
    flagDays: yearFlagDaysOut,
    firstWeek: { week: yStats.firstWeek, year: yStats.firstWeekYear },
    lastWeek: { week: yStats.lastWeek, year: yStats.lastWeekYear },
    url: canonicalFor(`/vuosi-${y}`),
  });
  yearManifest.push({ year: y, url: `${SITE_URL}/data/year/${y}.json` });
  feedFileCount += 1;
  // Accumulated for the single bulk /data/year.csv|.xml written after the
  // loop closes — reuses the exact same yStats already computed above,
  // not a second pass.
  allYearsRows.push({
    year: y,
    weekCount: yStats.weekCount,
    workingDays: yStats.working,
    weekendDays: yStats.weekend,
    firstWeek: yStats.firstWeek,
    firstWeekYear: yStats.firstWeekYear,
    lastWeek: yStats.lastWeek,
    lastWeekYear: yStats.lastWeekYear,
  });

  // /data/holidays/<year>.json — reuses holidaysInYear() (data/holidays.js),
  // the same source PublicHolidays.jsx renders as its data table.
  const yearHolidayRecords = holidaysInYear(y).map((h) => ({
    name: h.name,
    date: ymd(h.date),
    weekday: getWeekdayName(h.date),
    week: isoWeek(h.date),
    official: h.official,
  }));
  writeJson(path.join(dataDir, "holidays", `${y}.json`), {
    schemaVersion: FEED_SCHEMA_VERSION,
    year: y,
    holidays: yearHolidayRecords,
    url: canonicalFor(`/pyhapaivat-${y}`),
  });
  holidaysManifest.push({ year: y, url: `${SITE_URL}/data/holidays/${y}.json` });
  feedFileCount += 1;

  // Bulk /data/holiday/<year>.csv|.xml — the per-year-list shape (15 rows),
  // reusing yearHolidayRecords computed immediately above, not recomputed.
  writeCsv(
    path.join(dataDir, "holiday", `${y}.csv`),
    ["name", "date", "weekday", "week", "official"],
    yearHolidayRecords.map((h) => [h.name, h.date, h.weekday, h.week, h.official]),
  );
  writeXml(
    path.join(dataDir, "holiday", `${y}.xml`),
    `<holidays year="${y}" schemaVersion="${FEED_SCHEMA_VERSION}">\n` +
      yearHolidayRecords
        .map(
          (h) =>
            `  <holiday official="${h.official}">\n` +
            `    <name>${xmlEscape(h.name)}</name>\n` +
            `    <date>${h.date}</date>\n` +
            `    <weekday>${xmlEscape(h.weekday)}</weekday>\n` +
            `    <week>${h.week}</week>\n` +
            `  </holiday>`,
        )
        .join("\n") +
      `\n</holidays>`,
  );
  feedFileCount += 2;

  // /data/flag-days/<year>.json — reuses flagDaysInYear() (data/flagDayPages.js),
  // the same source FlagDays.jsx renders as its data table, so this can't
  // disagree with either the visible table or the holiday-overlap column.
  writeJson(path.join(dataDir, "flag-days", `${y}.json`), {
    schemaVersion: FEED_SCHEMA_VERSION,
    year: y,
    flagDays: flagDaysInYear(y).map((d) => ({
      name: d.name,
      altName: d.altName,
      date: ymd(d.date),
      weekday: d.weekday,
      week: d.week,
      weekYear: d.weekYear,
      category: d.category,
      holidayOverlap: d.holidayOverlap,
    })),
    url: canonicalFor(`/liputuspaivat-${y}`),
  });
  flagDaysManifest.push({ year: y, url: `${SITE_URL}/data/flag-days/${y}.json` });
  feedFileCount += 1;

  // /data/holiday/<year>/<slug>.json — one file per named holiday per year
  // (distinct from /data/holidays/<year>.json above, which lists all 15
  // holidays in one file; this is the per-slug detail feed backing the new
  // /api/holiday/{slug}/{year} alias). Reuses holidayPageFor() — the same
  // function NamedHoliday.jsx renders from — so this can't drift from the
  // visible /pyhat-<year>/<slug> page. legalBasis is null except for the 2
  // holidays with an independently confirmed Finlex citation (see
  // HOLIDAY_LEGAL_BASIS's own comment) rather than guessed for the rest.
  const yearHolidaySlugManifest = [];
  for (const def of HOLIDAY_DEFINITIONS) {
    const page = holidayPageFor(y, def.slug);
    if (!page) continue;
    const legalBasis = HOLIDAY_LEGAL_BASIS[page.displayName] ?? null;
    writeJson(path.join(dataDir, "holiday", String(y), `${def.slug}.json`), {
      schemaVersion: FEED_SCHEMA_VERSION,
      slug: page.slug,
      name: page.displayName,
      year: page.year,
      date: ymd(page.date),
      weekday: page.weekday,
      week: page.week,
      weekYear: page.weekYear,
      month: page.month,
      quarter: quarterOf(page.date),
      official: page.official,
      kind: page.kind,
      rule: page.rule,
      legalBasis,
      url: canonicalFor(page.path),
    });
    yearHolidaySlugManifest.push({
      slug: def.slug,
      url: `${SITE_URL}/data/holiday/${y}/${def.slug}.json`,
    });
    feedFileCount += 1;
  }
  writeJson(path.join(dataDir, "holiday", String(y), "index.json"), {
    year: y,
    holidays: yearHolidaySlugManifest,
  });
  holidayDetailManifest.push({
    year: y,
    indexUrl: `${SITE_URL}/data/holiday/${y}/index.json`,
  });
  feedFileCount += 1;

  // /data/week/<year>/<week>.json — reuses holidaysInWeekForPrerender() (this
  // file, already used by weekFaqNodes) and mondayOf/quarterOf/seasonIndexOf.
  const totalWeeks = weeksInIsoYear(y);
  const yearWeekManifest = [];
  const yearWeekRows = []; // for the bulk /data/week/<year>.csv|.xml below
  for (let w = 1; w <= totalWeeks; w += 1) {
    const monday = mondayOf(w, y);
    const sunday = addDays(monday, 6);
    const thursday = addDays(monday, 3);
    const weekHolidays = holidaysInWeekForPrerender(y, w);
    const officialWeekHolidays = weekHolidays.filter((h) => h.official);
    const weekFlagDays = flagDaysInWeekForPrerender(y, w);
    const workingDays = weekWorkingDaysCount(monday, officialWeekHolidays);
    const quarter = quarterOf(monday);
    const season = SEASON_KEYS_EN[seasonIndexOf(thursday.getMonth())];
    writeJson(path.join(dataDir, "week", String(y), `${w}.json`), {
      schemaVersion: FEED_SCHEMA_VERSION,
      week: w,
      year: y,
      startDate: ymd(monday),
      endDate: ymd(sunday),
      workingDays,
      holidays: weekHolidays.map((h) => ({
        name: h.name,
        date: ymd(h.date),
        official: h.official,
      })),
      flagDays: weekFlagDays.map((f) => ({ name: f.name, date: ymd(f.date) })),
      quarter,
      season,
      url: canonicalFor(`/viikko-${w}-${y}`),
    });
    yearWeekManifest.push({ week: w, url: `${SITE_URL}/data/week/${y}/${w}.json` });
    yearWeekRows.push({
      week: w,
      startDate: ymd(monday),
      endDate: ymd(sunday),
      workingDays,
      quarter,
      season,
      holidays: weekHolidays,
      flagDays: weekFlagDays,
    });
    feedFileCount += 1;
  }
  writeJson(path.join(dataDir, "week", String(y), "index.json"), {
    year: y,
    weeks: yearWeekManifest,
  });
  weekManifest.push({
    year: y,
    weekCount: totalWeeks,
    indexUrl: `${SITE_URL}/data/week/${y}/index.json`,
  });
  feedFileCount += 1; // the per-year week index itself

  // Bulk /data/week/<year>.csv|.xml — one row per week, reusing yearWeekRows
  // accumulated in the loop just above (same computed data, not a second pass).
  writeCsv(
    path.join(dataDir, "week", `${y}.csv`),
    ["week", "startDate", "endDate", "workingDays", "quarter", "season", "holidays", "flagDays"],
    yearWeekRows.map((r) => [r.week, r.startDate, r.endDate, r.workingDays, r.quarter, r.season, nameList(r.holidays), nameList(r.flagDays)]),
  );
  writeXml(
    path.join(dataDir, "week", `${y}.xml`),
    `<weeks year="${y}" schemaVersion="${FEED_SCHEMA_VERSION}">\n` +
      yearWeekRows
        .map(
          (r) =>
            `  <week number="${r.week}">\n` +
            `    <startDate>${r.startDate}</startDate>\n` +
            `    <endDate>${r.endDate}</endDate>\n` +
            `    <workingDays>${r.workingDays}</workingDays>\n` +
            `    <quarter>${r.quarter}</quarter>\n` +
            `    <season>${r.season}</season>\n` +
            (r.holidays.length
              ? `    <holidays>\n${r.holidays.map((h) => `      <holiday>${xmlEscape(h.name)}</holiday>`).join("\n")}\n    </holidays>\n`
              : `    <holidays/>\n`) +
            (r.flagDays.length
              ? `    <flagDays>\n${r.flagDays.map((f) => `      <flagDay>${xmlEscape(f.name)}</flagDay>`).join("\n")}\n    </flagDays>\n`
              : `    <flagDays/>\n`) +
            `  </week>`,
        )
        .join("\n") +
      `\n</weeks>`,
  );
  feedFileCount += 2;

  // /data/quarter/<year>/<quarter>.json — reuses quarterStats() (seo.js,
  // itself built from monthStats()), the same function QuarterPage.jsx and
  // quarterFaqs() use. Added after the fiscal-quarter route family shipped;
  // slots into the same year loop and manifest pattern as week/year/holidays
  // without any URL-architecture change — exactly the extensibility STEP 9
  // of the original data-layer design called for.
  for (let q = 1; q <= 4; q += 1) {
    const qStats = quarterStats(y, q);
    const qHolidaysOut = qStats.holidays.map((h) => ({
      name: h.name,
      date: ymd(h.date),
      official: h.official,
    }));
    writeJson(path.join(dataDir, "quarter", String(y), `${q}.json`), {
      schemaVersion: FEED_SCHEMA_VERSION,
      quarter: q,
      year: y,
      startDate: ymd(qStats.firstDay),
      endDate: ymd(qStats.lastDay),
      months: qStats.months,
      weekRange: {
        firstWeek: qStats.weeks[0].week,
        firstYear: qStats.weeks[0].year,
        lastWeek: qStats.weeks[qStats.weeks.length - 1].week,
        lastYear: qStats.weeks[qStats.weeks.length - 1].year,
      },
      workingDays: qStats.working,
      weekendDays: qStats.weekend,
      totalDays: qStats.totalDays,
      holidays: qHolidaysOut,
      url: canonicalFor(`/q${q}-${y}`),
    });
    quarterManifest.push({
      year: y,
      quarter: q,
      url: `${SITE_URL}/data/quarter/${y}/${q}.json`,
    });
    feedFileCount += 1;
  }

  // /data/monthly-working-days/<year>/<month>.json — reuses monthStats()
  // (seo.js), the same function MonthlyWorkingDays.jsx and
  // monthlyWorkingDayFaqs() use. Feed paths use the plain month number, not
  // the page route's Finnish slug (M_SLUG), matching quarter's convention
  // above (page /q1-<year>, feed /data/quarter/<year>/1.json) — feed URLs
  // stay slug-free throughout /data/.
  const yearWorkingDaysRows = []; // for the bulk /data/working-days/<year>.csv|.xml below
  for (let mm = 1; mm <= 12; mm += 1) {
    const mStats = monthStats(y, mm);
    const officialHolidays = mStats.holidays.filter((h) => h.official);
    writeJson(path.join(dataDir, "monthly-working-days", String(y), `${mm}.json`), {
      schemaVersion: FEED_SCHEMA_VERSION,
      month: mm,
      year: y,
      startDate: ymd(mStats.firstDay),
      endDate: ymd(mStats.lastDay),
      workingDays: mStats.working,
      weekendDays: mStats.weekend,
      holidays: officialHolidays.map((h) => ({
        name: h.name,
        date: ymd(h.date),
        official: h.official,
      })),
      url: canonicalFor(`/tyopaivat-${M_SLUG[mm - 1]}-${y}`),
    });
    monthlyWorkingDaysManifest.push({
      year: y,
      month: mm,
      url: `${SITE_URL}/data/monthly-working-days/${y}/${mm}.json`,
    });
    yearWorkingDaysRows.push({
      month: mm,
      monthName: M_FULL[mm - 1],
      workingDays: mStats.working,
      weekendDays: mStats.weekend,
      officialHolidaysInMonth: officialHolidays.length,
    });
    feedFileCount += 1;
  }

  // Bulk /data/working-days/<year>.csv|.xml — the new public name for the
  // monthly-working-days family (see docs/downloadable-datasets.md decision
  // #2: JSON URLs above are unchanged, this is additive). 12 monthly rows +
  // one TOTAL row using yStats (already computed earlier this iteration),
  // so the whole-year figure and the monthly breakdown can't disagree.
  writeCsv(
    path.join(dataDir, "working-days", `${y}.csv`),
    ["month", "monthName", "workingDays", "weekendDays", "officialHolidaysInMonth"],
    [
      ...yearWorkingDaysRows.map((r) => [r.month, r.monthName, r.workingDays, r.weekendDays, r.officialHolidaysInMonth]),
      ["TOTAL", "", yStats.working, yStats.weekend, yearHolidayRecords.filter((h) => h.official).length],
    ],
  );
  writeXml(
    path.join(dataDir, "working-days", `${y}.xml`),
    `<workingDays year="${y}" schemaVersion="${FEED_SCHEMA_VERSION}">\n` +
      yearWorkingDaysRows
        .map(
          (r) =>
            `  <month number="${r.month}">\n` +
            `    <name>${xmlEscape(r.monthName)}</name>\n` +
            `    <workingDays>${r.workingDays}</workingDays>\n` +
            `    <weekendDays>${r.weekendDays}</weekendDays>\n` +
            `    <officialHolidaysInMonth>${r.officialHolidaysInMonth}</officialHolidaysInMonth>\n` +
            `  </month>`,
        )
        .join("\n") +
      `\n  <total>\n` +
      `    <workingDays>${yStats.working}</workingDays>\n` +
      `    <weekendDays>${yStats.weekend}</weekendDays>\n` +
      `  </total>\n</workingDays>`,
  );
  feedFileCount += 2;

  // /data/month/<year>/<month>.json — the Month dataset (audit finding: no
  // feed or Dataset schema existed for /kuukausi-<m>-<y> before this pass,
  // unlike every other page type). Distinct from monthly-working-days above:
  // this describes which ISO weeks fall in the month, not its working-day
  // count. Reuses the same monthStats() call already made for the
  // monthly-working-days feed two lines up — no second day-counting pass.
  const yearMonthRows = []; // for the bulk /data/month/<year>.csv|.xml below
  for (let mm = 1; mm <= 12; mm += 1) {
    const mStats = monthStats(y, mm);
    const monthFlagDays = flagDaysInYear(y).filter((f) => f.month === mm);
    const monthOfficialHolidays = mStats.holidays.filter((h) => h.official);
    writeJson(path.join(dataDir, "month", String(y), `${mm}.json`), {
      schemaVersion: FEED_SCHEMA_VERSION,
      month: mm,
      year: y,
      startDate: ymd(mStats.firstDay),
      endDate: ymd(mStats.lastDay),
      weekCount: mStats.weekCount,
      weeks: mStats.weeks,
      workingDays: mStats.working,
      weekendDays: mStats.weekend,
      holidays: monthOfficialHolidays.map((h) => ({ name: h.name, date: ymd(h.date), official: h.official })),
      flagDays: monthFlagDays.map((f) => ({ name: f.name, date: ymd(f.date) })),
      quarter: Math.ceil(mm / 3),
      url: canonicalFor(`/kuukausi-${mm}-${y}`),
    });
    monthManifest.push({
      year: y,
      month: mm,
      url: `${SITE_URL}/data/month/${y}/${mm}.json`,
    });
    yearMonthRows.push({
      month: mm,
      monthName: M_FULL[mm - 1],
      startDate: ymd(mStats.firstDay),
      endDate: ymd(mStats.lastDay),
      weekCount: mStats.weekCount,
      workingDays: mStats.working,
      weekendDays: mStats.weekend,
      quarter: Math.ceil(mm / 3),
      holidays: monthOfficialHolidays,
      flagDays: monthFlagDays,
    });
    feedFileCount += 1;
  }

  // Bulk /data/month/<year>.csv|.xml — one row per calendar month.
  writeCsv(
    path.join(dataDir, "month", `${y}.csv`),
    ["month", "monthName", "startDate", "endDate", "weekCount", "workingDays", "weekendDays", "quarter", "holidays", "flagDays"],
    yearMonthRows.map((r) => [r.month, r.monthName, r.startDate, r.endDate, r.weekCount, r.workingDays, r.weekendDays, r.quarter, nameList(r.holidays), nameList(r.flagDays)]),
  );
  writeXml(
    path.join(dataDir, "month", `${y}.xml`),
    `<months year="${y}" schemaVersion="${FEED_SCHEMA_VERSION}">\n` +
      yearMonthRows
        .map(
          (r) =>
            `  <month number="${r.month}">\n` +
            `    <name>${xmlEscape(r.monthName)}</name>\n` +
            `    <startDate>${r.startDate}</startDate>\n` +
            `    <endDate>${r.endDate}</endDate>\n` +
            `    <weekCount>${r.weekCount}</weekCount>\n` +
            `    <workingDays>${r.workingDays}</workingDays>\n` +
            `    <weekendDays>${r.weekendDays}</weekendDays>\n` +
            `    <quarter>${r.quarter}</quarter>\n` +
            (r.holidays.length
              ? `    <holidays>\n${r.holidays.map((h) => `      <holiday>${xmlEscape(h.name)}</holiday>`).join("\n")}\n    </holidays>\n`
              : `    <holidays/>\n`) +
            (r.flagDays.length
              ? `    <flagDays>\n${r.flagDays.map((f) => `      <flagDay>${xmlEscape(f.name)}</flagDay>`).join("\n")}\n    </flagDays>\n`
              : `    <flagDays/>\n`) +
            `  </month>`,
        )
        .join("\n") +
      `\n</months>`,
  );
  feedFileCount += 2;
}

// Bulk /data/year.csv|.xml — ALL years in one file (unlike the other
// families, the JSON here is already one record per year, so "bulk" means
// every year, not per-year — see docs/downloadable-datasets.md decision).
writeCsv(
  path.join(dataDir, "year.csv"),
  ["year", "weekCount", "workingDays", "weekendDays", "firstWeek", "firstWeekYear", "lastWeek", "lastWeekYear"],
  allYearsRows.map((r) => [r.year, r.weekCount, r.workingDays, r.weekendDays, r.firstWeek, r.firstWeekYear, r.lastWeek, r.lastWeekYear]),
);
writeXml(
  path.join(dataDir, "year.xml"),
  `<years schemaVersion="${FEED_SCHEMA_VERSION}">\n` +
    allYearsRows
      .map(
        (r) =>
          `  <year number="${r.year}">\n` +
          `    <weekCount>${r.weekCount}</weekCount>\n` +
          `    <workingDays>${r.workingDays}</workingDays>\n` +
          `    <weekendDays>${r.weekendDays}</weekendDays>\n` +
          `    <firstWeek week="${r.firstWeek}" year="${r.firstWeekYear}"/>\n` +
          `    <lastWeek week="${r.lastWeek}" year="${r.lastWeekYear}"/>\n` +
          `  </year>`,
      )
      .join("\n") +
    `\n</years>`,
);
feedFileCount += 2;

// Per-family manifests — the actual contentUrl each Dataset node's
// distribution points at (STEP 4), and the one URL an agent needs to
// discover every week/year/holiday feed without guessing the pattern.
writeJson(path.join(dataDir, "year", "index.json"), { years: yearManifest });
writeJson(path.join(dataDir, "holidays", "index.json"), { years: holidaysManifest });
writeJson(path.join(dataDir, "holiday", "index.json"), { years: holidayDetailManifest });
writeJson(path.join(dataDir, "flag-days", "index.json"), { years: flagDaysManifest });
writeJson(path.join(dataDir, "week", "index.json"), { years: weekManifest });
writeJson(path.join(dataDir, "quarter", "index.json"), { quarters: quarterManifest });
writeJson(path.join(dataDir, "monthly-working-days", "index.json"), {
  months: monthlyWorkingDaysManifest,
});
writeJson(path.join(dataDir, "month", "index.json"), { months: monthManifest });
feedFileCount += 8;

// Top-level manifest (STEP 9): describes the whole /data/ surface by dataset
// family rather than by URL pattern, so a fifth family (school holidays, name
// days, monthly working days, another country) can be added later as one more
// entry here without changing anything about the URLs already published.
writeJson(path.join(dataDir, "index.json"), {
  name: "Viikko Nro machine-readable data feeds",
  schemaVersion: FEED_SCHEMA_VERSION,
  license: `${SITE_URL}/kayttoehdot`,
  dateModified: FEED_BUILD_DATE,
  // These two are single static files, not per-year families like the
  // `datasets` array below, but llms.txt/ai.txt both advertise them — they
  // belong here too, so a consumer that only fetches this one index file
  // can still discover them (previously they couldn't: a real gap).
  datasetSchemaUrl: `${SITE_URL}/data/dataset.json`,
  knowledgeGraphUrl: `${SITE_URL}/data/knowledge-graph.json`,
  datasets: [
    {
      name: "week",
      description: "One JSON file per ISO 8601 week.",
      indexUrl: `${SITE_URL}/data/week/index.json`,
      urlPattern: `${SITE_URL}/data/week/{year}/{week}.json`,
    },
    {
      name: "year",
      description: "One JSON file per calendar year.",
      indexUrl: `${SITE_URL}/data/year/index.json`,
      urlPattern: `${SITE_URL}/data/year/{year}.json`,
    },
    {
      name: "holidays",
      description: "One JSON file per calendar year's public holidays.",
      indexUrl: `${SITE_URL}/data/holidays/index.json`,
      urlPattern: `${SITE_URL}/data/holidays/{year}.json`,
    },
    {
      name: "holiday",
      description: "One JSON file per named holiday per year (detail feed backing /api/holiday/{slug}/{year}).",
      indexUrl: `${SITE_URL}/data/holiday/index.json`,
      urlPattern: `${SITE_URL}/data/holiday/{year}/{slug}.json`,
    },
    {
      name: "flag-days",
      description: "One JSON file per calendar year's Finnish flag days (liputuspäivät).",
      indexUrl: `${SITE_URL}/data/flag-days/index.json`,
      urlPattern: `${SITE_URL}/data/flag-days/{year}.json`,
    },
    {
      name: "quarter",
      description: "One JSON file per fiscal quarter (Q1-Q4).",
      indexUrl: `${SITE_URL}/data/quarter/index.json`,
      urlPattern: `${SITE_URL}/data/quarter/{year}/{quarter}.json`,
    },
    {
      name: "monthly-working-days",
      description: "One JSON file per calendar month's working-day count.",
      indexUrl: `${SITE_URL}/data/monthly-working-days/index.json`,
      urlPattern: `${SITE_URL}/data/monthly-working-days/{year}/{month}.json`,
    },
    {
      name: "month",
      description: "One JSON file per calendar month's ISO weeks.",
      indexUrl: `${SITE_URL}/data/month/index.json`,
      urlPattern: `${SITE_URL}/data/month/{year}/{month}.json`,
    },
  ],
});
feedFileCount += 1;

// Standalone Dataset JSON-LD (STEP 3/4), fetchable on its own without parsing
// any HTML — the same 4 nodes also embedded in the homepage's <head> above,
// built from the one datasetNodes() function so the two can't drift.
writeJson(path.join(dataDir, "dataset.json"), {
  "@context": "https://schema.org",
  "@graph": datasetNodes(),
});
feedFileCount += 1;

// Knowledge graph (STEP: entity map / relationship map / internal linking map
// / graph structure), fetchable on its own without parsing HTML or crawling
// every page. Every @id/urlPattern/count below is read from the same
// single-source-of-truth modules the live pages and their JSON-LD are built
// from (HOLIDAY_DEFINITIONS, M_SLUG, DATA_FEED_FAMILIES, entityParentExtra's
// own regex targets) rather than restated by hand, and every edge listed in
// relationshipMap is one entityParentExtra() (or a pre-existing xExtra())
// actually emits into a real page's <head> — this file documents the graph
// that ships, not an aspirational one.
const kgYear = currentYear;
writeJson(path.join(dataDir, "knowledge-graph.json"), {
  "@context": "https://schema.org",
  name: "Viikko Nro knowledge graph",
  description:
    "Entity map, relationship map, internal linking map and graph structure for viikkonro.fi, for AI retrieval and knowledge-graph systems. Every entity is a real page or resource on the site; every relationship listed is actually present in that page's schema.org JSON-LD.",
  dateModified: FEED_BUILD_DATE,
  schemaVersion: FEED_SCHEMA_VERSION,

  namingConventions: {
    pageEntityId: "{canonicalUrl}#webpage — every page's own node id",
    subResourceId:
      "{canonicalUrl}#{fragment} — fragment in {faq, breadcrumb, media, discover, howto, article, events}",
    globalSingletons: [`${SITE_URL}/#website`, `${SITE_URL}/#organization`],
    datasetFamilyId: `${SITE_URL}/#dataset-{id} — one per /data/ family (see datasets below)`,
    pdfMediaId: "{pdfUrl}#media",
  },

  // 1. Entity map — one entry per requested entity type: canonical id
  // pattern, the schema.org @type actually used for its #webpage node,
  // a real example, and (for finite families) the exact count.
  entityMap: [
    {
      entity: "Week",
      schemaType: "WebPage",
      urlPattern: "/viikko-{week}-{year}",
      idPattern: `${SITE_URL}/viikko-{week}-{year}#webpage`,
      example: `${SITE_URL}/viikko-32-${kgYear}`,
      count: "52 or 53 per year (weeksInIsoYear)",
    },
    {
      entity: "Month",
      schemaType: "CollectionPage",
      urlPattern: "/kuukausi-{month}-{year}",
      idPattern: `${SITE_URL}/kuukausi-{month}-{year}#webpage`,
      example: `${SITE_URL}/kuukausi-8-${kgYear}`,
      count: "12 per year",
    },
    {
      entity: "Quarter",
      schemaType: "CollectionPage",
      urlPattern: "/q{1-4}-{year}",
      idPattern: `${SITE_URL}/q{quarter}-{year}#webpage`,
      example: `${SITE_URL}/q3-${kgYear}`,
      count: "4 per year",
    },
    {
      entity: "Year",
      schemaType: "CollectionPage",
      urlPattern: "/vuosi-{year}",
      idPattern: `${SITE_URL}/vuosi-{year}#webpage`,
      example: `${SITE_URL}/vuosi-${kgYear}`,
      count: `1 per year, ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR}`,
    },
    {
      entity: "Holiday",
      schemaType: "WebPage (individual) / WebPage (yearly hub)",
      urlPattern: "/pyhapaivat-{year} (hub), /pyhat-{year}/{slug} (individual)",
      idPattern: `${SITE_URL}/pyhat-{year}/{slug}#webpage`,
      example: `${SITE_URL}/pyhat-${kgYear}/itsenaisyyspaiva`,
      count: `${HOLIDAY_DEFINITIONS.length} named holidays per year (13 statutory + 2 unofficial eve days)`,
      slugs: HOLIDAY_DEFINITIONS.map((h) => h.slug),
    },
    {
      entity: "Flag Day",
      schemaType: "CollectionPage (yearly hub only, no individual pages)",
      urlPattern: "/liputuspaivat-{year}",
      idPattern: `${SITE_URL}/liputuspaivat-{year}#webpage`,
      example: `${SITE_URL}/liputuspaivat-${kgYear}`,
      count: "14 named flag days per year, listed as anchors on the one hub page",
    },
    {
      entity: "Working Day",
      schemaType: "WebPage (yearly) / CollectionPage (monthly)",
      urlPattern: "/tyopaivat-{year} (yearly), /tyopaivat-{monthSlug}-{year} (monthly)",
      idPattern: `${SITE_URL}/tyopaivat-{monthSlug}-{year}#webpage`,
      example: `${SITE_URL}/tyopaivat-elokuu-${kgYear}`,
      count: "1 yearly page + 12 monthly pages per year",
      monthSlugs: M_SLUG,
    },
    {
      entity: "Calendar",
      schemaType: "CollectionPage",
      urlPattern:
        "/kalenteri-{year}, /kalenteri-{year}-alkuvuosi, /kalenteri-{year}-loppuvuosi, /tulostettava-kalenteri-{year}",
      idPattern: `${SITE_URL}/kalenteri-{year}#webpage`,
      example: `${SITE_URL}/kalenteri-${kgYear}`,
      count: "4 calendar-view variants per year",
    },
    {
      entity: "PDF",
      schemaType: "MediaObject",
      urlPattern: "/pdf/kalenteri-{year}.pdf, /pdf/viikko-{week}-{year}.pdf, /pdf/kuukausi-{month}-{year}.pdf",
      idPattern: `${SITE_URL}/pdf/{file}.pdf#media`,
      example: `${SITE_URL}${weekPdfPath(32, kgYear)}`,
      count: "1 per calendar year + 1 per week + 1 per month",
    },
    {
      entity: "Dataset",
      schemaType: "Dataset",
      urlPattern: "/data/{family}/{year}.json or /data/{family}/{year}/{n}.json",
      idPattern: `${SITE_URL}/#dataset-{id}`,
      example: `${SITE_URL}/data/week/${kgYear}/32.json`,
      count: `${DATA_FEED_FAMILIES.length} dataset families`,
      families: DATA_FEED_FAMILIES.map((f) => f.id),
    },
    {
      entity: "API Endpoint",
      schemaType: "EntryPoint (redirect alias, no independent page)",
      urlPattern: "/api/week/{week}/{year}.json, /api/month/{month}/{year}.json, /api/year/{year}.json, /api/holiday/{slug}/{year}.json",
      idPattern: `${SITE_URL}/api/{family}/... — 301 redirect to the aliased Dataset's own URL`,
      example: `${SITE_URL}/api/week/32/${kgYear}.json`,
      count: "4 aliased families (week, month, year, holiday)",
    },
  ],

  // 2. Relationship map — every isPartOf/hasPart/mentions/associatedMedia
  // edge actually present in the live JSON-LD, described as (from, relation,
  // to, cardinality). "to"/"from" are entity types from entityMap above.
  relationshipMap: [
    { from: "Week", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Month", relation: "isPartOf", to: "Quarter", cardinality: "many-to-one" },
    { from: "Month", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Quarter", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Quarter", relation: "hasPart", to: "Month", cardinality: "one-to-three" },
    { from: "Year", relation: "hasPart", to: "Month", cardinality: "one-to-twelve" },
    { from: "Year", relation: "hasPart", to: "Quarter", cardinality: "one-to-four" },
    { from: "Year", relation: "mainEntity (ItemList)", to: "Week", cardinality: "one-to-52-or-53" },
    { from: "Month", relation: "mainEntity (ItemList)", to: "Week", cardinality: "one-to-4-or-6" },
    { from: "Month", relation: "mentions", to: "Holiday", cardinality: "one-to-many (holidays that month)" },
    { from: "Holiday (hub)", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Holiday (hub)", relation: "hasPart", to: "Holiday (individual)", cardinality: `one-to-${HOLIDAY_DEFINITIONS.length}` },
    { from: "Holiday (individual)", relation: "isPartOf", to: "Holiday (hub)", cardinality: "many-to-one" },
    { from: "Holiday (individual)", relation: "mentions", to: "Week", cardinality: "many-to-one" },
    { from: "Holiday (individual)", relation: "mentions", to: "Month", cardinality: "many-to-one" },
    { from: "Holiday (individual)", relation: "mentions", to: "Year", cardinality: "many-to-one" },
    { from: "Flag Day (hub)", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Working Day (yearly)", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Working Day (yearly)", relation: "hasPart", to: "Working Day (monthly)", cardinality: "one-to-twelve" },
    { from: "Working Day (monthly)", relation: "isPartOf", to: "Month", cardinality: "many-to-one" },
    { from: "Calendar", relation: "isPartOf", to: "Year", cardinality: "many-to-one" },
    { from: "Calendar", relation: "mainEntity (ItemList)", to: "Month", cardinality: "one-to-twelve" },
    { from: "Calendar", relation: "associatedMedia", to: "PDF", cardinality: "one-to-one" },
    { from: "Week", relation: "associatedMedia", to: "PDF", cardinality: "one-to-one" },
    { from: "Month", relation: "associatedMedia", to: "PDF", cardinality: "one-to-one" },
    { from: "PDF", relation: "potentialAction (DownloadAction)", to: "PDF", cardinality: "self (download target)" },
    { from: "API Endpoint", relation: "redirects to (301)", to: "Dataset", cardinality: "many-to-one" },
    { from: "Dataset", relation: "creator / publisher", to: "Organization", cardinality: "many-to-one" },
    { from: "*", relation: "isPartOf", to: "Website", cardinality: "many-to-one (every page)" },
    { from: "*", relation: "publisher", to: "Organization", cardinality: "many-to-one (every page)" },
  ],

  // 3. Internal linking map — same edges as relationshipMap, regrouped by
  // entity so a consumer can look up "what does a Week page link to / get
  // linked from" in one place instead of scanning the whole edge list.
  internalLinkingMap: {
    Week: { linksTo: ["Year"], linkedFrom: ["Year (ItemList)", "Month (ItemList)", "Holiday (mentions)"] },
    Month: { linksTo: ["Quarter", "Year", "Holiday (mentions)", "PDF"], linkedFrom: ["Quarter (hasPart)", "Year (hasPart)", "Working Day monthly", "Holiday (mentions)"] },
    Quarter: { linksTo: ["Year", "Month (hasPart)"], linkedFrom: ["Month", "Year (hasPart)"] },
    Year: { linksTo: ["Month (hasPart)", "Quarter (hasPart)", "Week (ItemList)"], linkedFrom: ["Week", "Month", "Quarter", "Holiday hub", "Flag Day hub", "Working Day yearly", "Calendar"] },
    "Holiday (hub)": { linksTo: ["Year", "Holiday individual (hasPart)"], linkedFrom: ["Holiday individual"] },
    "Holiday (individual)": { linksTo: ["Holiday hub", "Week", "Month", "Year"], linkedFrom: ["Holiday hub (hasPart)"] },
    "Flag Day (hub)": { linksTo: ["Year"], linkedFrom: [] },
    "Working Day (yearly)": { linksTo: ["Year", "Working Day monthly (hasPart)"], linkedFrom: [] },
    "Working Day (monthly)": { linksTo: ["Month", "Working Day yearly (hasPart)"], linkedFrom: ["Working Day yearly (hasPart)"] },
    Calendar: { linksTo: ["Year", "Month (ItemList)", "PDF"], linkedFrom: [] },
    PDF: { linksTo: [], linkedFrom: ["Week", "Month", "Calendar (associatedMedia)"] },
    Dataset: { linksTo: ["Organization"], linkedFrom: ["API Endpoint (redirect)"] },
    "API Endpoint": { linksTo: ["Dataset (301 redirect)"], linkedFrom: [] },
  },

  // 4. Knowledge graph structure — node/edge type summary plus a few
  // multi-hop traversal paths useful for RAG-style context expansion
  // (e.g. grounding a Week's answer with its Year and any Holiday in it).
  graphStructure: {
    nodeTypes: [
      "Week", "Month", "Quarter", "Year", "Holiday", "Flag Day", "Working Day",
      "Calendar", "PDF", "Dataset", "API Endpoint", "Website", "Organization",
    ],
    edgeTypes: ["isPartOf", "hasPart", "mentions", "mainEntity", "associatedMedia", "potentialAction", "redirects to", "creator/publisher"],
    hierarchyRoot: "Year",
    exampleTraversals: [
      {
        name: "Week context expansion",
        path: ["Week", "isPartOf", "Year"],
        use: "Ground a week-number answer with its containing year (e.g. '53-week year').",
      },
      {
        name: "Month to quarter to year",
        path: ["Month", "isPartOf", "Quarter", "isPartOf", "Year"],
        use: "Resolve a month's fiscal quarter and year in two hops.",
      },
      {
        name: "Holiday temporal grounding",
        path: ["Holiday (individual)", "mentions", "Week/Month/Year"],
        use: "Answer 'which week is Itsenäisyyspäivä in <year>' directly from the holiday page's own graph.",
      },
      {
        name: "Year to full holiday list",
        path: ["Year", "isPartOf (reverse)", "Holiday (hub)", "hasPart", "Holiday (individual) x15"],
        use: "Enumerate every named holiday page for a given year.",
      },
      {
        name: "Dataset to developer alias",
        path: ["Dataset", "redirects to (reverse)", "API Endpoint"],
        use: "Find the /api/ alias for a given /data/ family.",
      },
    ],
  },
});
feedFileCount += 1;

console.log(`generated ${feedFileCount} JSON feed files under dist/data/ (2020-${currentYear + 9})`);

// Generate sitemap.xml with a fresh <lastmod> and current-year page entries.
// (currentYear is defined above, alongside the prerender route list.)
const sitemapDate = todayNameDayPage().date;
const today = `${sitemapDate.getFullYear()}-${String(sitemapDate.getMonth() + 1).padStart(2, "0")}-${String(sitemapDate.getDate()).padStart(2, "0")}`;
// Per-URL <lastmod>: a page describing a finalized past year (its week/date
// content can never change again) is frozen to that year's end — an honest
// "stable, old" signal that keeps crawl budget off the deep archive. The
// homepage, current/future-year pages, and editable static pages use the build
// date. Self-maintaining: the boundary moves automatically as currentYear rolls.
const lastmodFor = (p) => {
  const m = p.match(/-(\d{4})(?:-[12])?(?:\/[a-z0-9-]+)?$/);
  if (m && Number(m[1]) < currentYear) return `${m[1]}-12-31`;
  return today;
};
// isIndexable(e.path) alone matched the year-window gate but not a
// per-route meta.robots noindex override — the actual noindex-flip logic
// below (search "!isIndexable(url) || meta.robots") checks both. No route
// sets meta.robots to noindex today (audited), so this was previously a
// latent gap, not an active leak — closing it here so it can't become one
// silently if a future route ever does.
const indexableEntries = sitemapEntries(currentYear).filter(
  (e) => isIndexable(e.path) && !metaFor(e.path)?.robots?.startsWith("noindex"),
);
const urlset = indexableEntries
  .map((e) => {
    const loc = e.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${e.path}`;
    // Same ogImageUrlFor() the og:image override and ImageObject schema use
    // — an indexable page with a dedicated image gets an <image:image> entry
    // here too, the sitemap's own image-discovery extension. The sitemap
    // image extension explicitly allows more than one <image:image> per
    // <url>, so the Discover image (when this page has one) is a second,
    // additive entry — not a replacement of the OG one.
    const img = ogImageUrlFor(e.path);
    const discoverImg = discoverImageUrlFor(e.path);
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmodFor(e.path)}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      ...(img ? [`    <image:image><image:loc>${img}</image:loc></image:image>`] : []),
      ...(discoverImg ? [`    <image:image><image:loc>${discoverImg}</image:loc></image:image>`] : []),
      "  </url>",
    ].join("\n");
  })
  .join("\n");
// The PDF twin of each indexable full-year /kalenteri-<year> page gets its
// own <url> entry — a PDF is a real, independently indexable document (Google
// crawls and ranks PDFs directly), not a sub-resource of the HTML page the
// way the <image:image> extension above treats OG images. Tied to the same
// isIndexable() gate as the HTML page itself: a PDF for a noindexed archive
// year isn't worth a sitemap entry any more than that year's HTML page is.
const pdfUrlset = indexableEntries
  .filter((e) => /^\/kalenteri-\d+$/.test(e.path))
  .map((e) => {
    const year = e.path.match(/\d+/)[0];
    const loc = `${SITE_URL}${calendarPdfPath(year)}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmodFor(e.path)}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");
// Same reasoning as pdfUrlset above, one level down: the PDF twin of each
// indexable /viikko-<w>-<y> page.
const weekPdfUrlset = indexableEntries
  .filter((e) => /^\/viikko-\d+-\d+$/.test(e.path))
  .map((e) => {
    const [, week, year] = e.path.match(/^\/viikko-(\d+)-(\d+)$/);
    const loc = `${SITE_URL}${weekPdfPath(week, year)}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmodFor(e.path)}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");
// Same reasoning again, for /kuukausi-<m>-<y>.
const monthPdfUrlset = indexableEntries
  .filter((e) => /^\/kuukausi-\d+-\d+$/.test(e.path))
  .map((e) => {
    const [, month, year] = e.path.match(/^\/kuukausi-(\d+)-(\d+)$/);
    const loc = `${SITE_URL}${monthPdfPath(month, year)}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmodFor(e.path)}</lastmod>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlset}\n${pdfUrlset}\n${weekPdfUrlset}\n${monthPdfUrlset}\n</urlset>\n`;
fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);
console.log(
  `generated sitemap.xml (${indexableEntries.length} indexable urls + ${indexableEntries.filter((e) => /^\/kalenteri-\d+$/.test(e.path)).length} calendar PDFs + ${indexableEntries.filter((e) => /^\/viikko-\d+-\d+$/.test(e.path)).length} week PDFs + ${indexableEntries.filter((e) => /^\/kuukausi-\d+-\d+$/.test(e.path)).length} month PDFs, of ${sitemapEntries(currentYear).length} prerendered, lastmod ${today})`,
);

// Generate llms-full.txt: a comprehensive English-language reference for AI
// answer engines, crawlers and RAG systems (site structure, URL patterns,
// data feeds, PDFs), followed by the full Finnish FAQ dump. The FAQ section
// stays sourced from faqCategories/faqs so it can never drift from the
// visible /ukk page and its FAQPage JSON-LD. Every fact and URL pattern
// below is derived from the same single-source-of-truth modules the live
// site itself renders from (HOLIDAY_DEFINITIONS, flagDaysInYear,
// DATA_FEED_FAMILIES, seo.js path builders) rather than restated by hand.
const llY = currentYear;
const llWeek = 32;
const llMonth = 8;
const llQuarter = 3;

const llHolidayLines = HOLIDAY_DEFINITIONS.map(
  (h) =>
    `  - ${h.displayName} — /pyhat-${llY}/${h.slug} — ${h.kind}. ${h.rule}`,
).join("\n");

const llFlagDays = [
  ...new Map(flagDaysInYear(llY).map((f) => [f.name, f])).values(),
];
const llFlagDayLines = llFlagDays
  .map(
    (f) =>
      `  - ${f.name}${f.altName ? ` (also known as: ${f.altName})` : ""} — ${f.categoryLabel}`,
  )
  .join("\n");

const llDatasetLines = DATA_FEED_FAMILIES.map(
  (f) =>
    `  - ${f.name} (id: ${f.id}) — pattern: ${f.urlPattern} — index: ${SITE_URL}${f.indexUrl} — example: ${SITE_URL}${f.example}\n    ${f.description}`,
).join("\n");

// Split into 4 files (was one large llms-full.txt): llms-full.txt is now a
// short index + the FAQ dump; llms-api.txt/llms-data.txt/llms-glossary.txt
// carry the API, dataset and definitional content that used to live inside
// it, each independently fetchable and citable. This is a restructuring,
// not an addition — content moved, it wasn't duplicated on top of what
// already existed (see the file-count discussion this was built from).
const aiFileIntro = (name, purpose) =>
  `> This is ${name}, part of Viikko Nro's (viikkonro.fi) machine-readable ` +
  `reference set. ${purpose} For the full index, see ${SITE_URL}/llms-full.txt. ` +
  `Written for AI answer engines, crawlers and RAG systems (ChatGPT, Claude, ` +
  `Gemini, Perplexity, Copilot and others). Attribute "Viikko Nro" and link ` +
  `https://viikkonro.fi/ when citing.`;

const llmsFull =
  [
    "# Viikko Nro — Reference Index for AI Systems",
    "",
    `> Viikko Nro (viikkonro.fi) is a free Finnish ISO 8601 week-number calculator and calendar reference site. It shows the current ISO week number, calculates the week number for any date, and publishes Finnish public holidays, flag days, name days, school holidays, quarters, printable calendars, PDFs and open JSON data for the years ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR}. All user-facing page content is in Finnish; this document is in English to serve AI answer engines, crawlers and RAG systems (ChatGPT, Claude, Gemini, Perplexity, Copilot and others) that need a structural overview of the site. When citing or summarising this content, please attribute "Viikko Nro" and link https://viikkonro.fi/.`,
    "",
    "This file is the index. Three companion files carry the detail that used",
    "to live here — fetch whichever is relevant to your query instead of",
    "parsing this whole document for it:",
    `  ${SITE_URL}/llms-api.txt       — API endpoints, PDF resources, images: how to fetch things`,
    `  ${SITE_URL}/llms-data.txt      — the 8 /data/ JSON dataset families: what's in them`,
    `  ${SITE_URL}/llms-glossary.txt  — ISO 8601 rules, Finnish holiday/flag-day definitions, entity relationships: what terms mean`,
    "",
    "## 1. What Viikko Nro is",
    "",
    "- Purpose: instant ISO 8601 week-number lookup (\"what week is it today / on this date\") plus a full Finnish calendar reference: public holidays, flag days, name days, school holidays, quarters, months, printable calendars and PDF/CSV downloads.",
    "- No login, no paywall, no backend at request time — a prerendered React single-page app. Every meaningful URL is rendered to static HTML at build time (not just the homepage), so crawlers and AI agents see full content without executing JavaScript.",
    `- Date horizon: every dated resource (week, month, year, quarter pages; PDFs; JSON feeds) exists for years ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR} (current year plus the next 9). Pages outside the ${currentYear - 2}-${currentYear + 4} window stay online and prerendered but are marked noindex and excluded from the sitemap, to avoid a long tail of near-duplicate future-year pages diluting search ranking. All years remain reachable by direct URL regardless of index status.`,
    "- The contact form is the only feature that talks to a third party (Web3Forms, client-side only); everything else — week/date math, holiday and flag-day dates, name-day lookups — is computed locally from deterministic rules, not fetched from an external API.",
    "- For ISO 8601 rules, Finnish holiday/flag-day definitions and how entities relate to each other, see llms-glossary.txt rather than this file.",
    "",
    "## 2. Page types and URL patterns",
    "",
    "All dynamic pages use single-segment, keyword-rich Finnish URL slugs (no query strings, no nested path parameters). {year}, {month}, {week}, {quarter} are always plain integers unless noted.",
    "",
    "Week pages",
    "  /viikko-{week}-{year}  — e.g. /viikko-32-2026",
    "  One ISO week: start/end date, weekday-by-weekday dates, working-day count, holidays/flag days falling in that week, quarter and season context, downloadable PDF.",
    "",
    "Month pages",
    "  /kuukausi-{month}-{year}  — e.g. /kuukausi-8-2026",
    "  One calendar month: which ISO weeks fall in it, working/weekend-day counts, holidays/flag days, quarter context, downloadable PDF.",
    "",
    "Year pages",
    "  /vuosi-{year}  — e.g. /vuosi-2026",
    "  Full-year overview: total ISO weeks (52 or 53), first/last ISO week, working-day and weekend-day totals, full holiday and flag-day lists.",
    "",
    "Quarter pages",
    "  /q{1-4}-{year}  — e.g. /q3-2026",
    "  One calendar quarter: month and week range, working-day count, holidays falling in it.",
    "",
    "Calendar pages",
    "  /kalenteri-{year}  — full-year calendar grid",
    "  /kalenteri-{year}-alkuvuosi | /kalenteri-{year}-loppuvuosi  — first-half / second-half-year calendar grid (H1/H2)",
    "  /tulostettava-kalenteri-{year}  — print-optimised full A4 calendar grid, with PDF and Excel-compatible CSV export",
    "  /tulosta-{year}  — printable plain week-number list (all weeks of the year) with CSV export (a simpler, list-form alternative to the calendar grid)",
    "",
    "Holiday pages",
    `  /pyhapaivat-{year}  — yearly hub listing all 15 public holidays`,
    "  /pyhat-{year}/{slug}  — one landing page per named holiday (15 slugs, see llms-glossary.txt)",
    "",
    "Flag day page",
    `  /liputuspaivat-{year}  — yearly hub listing all 14 flag days (no individual flag-day landing pages at present)`,
    "",
    "Working-day pages",
    "  /tyopaivat-{year}  — working-day count and breakdown for the whole year",
    "  /tyopaivat-{monthSlug}-{year}  — working-day count for one month, e.g. /tyopaivat-elokuu-2026 (monthSlug is the Finnish month name: tammikuu, helmikuu, maaliskuu, huhtikuu, toukokuu, kesäkuu, heinäkuu, elokuu, syyskuu, lokakuu, marraskuu, joulukuu)",
    "",
    "School holiday page",
    "  /koululomat-{year}",
    "",
    "Name day pages",
    "  /nimipaivat/tanaan",
    "  /nimipaiva/{name}",
    "  /nimipaivat/{month}-{day}",
    "",
    "Calculators (interactive tools, also usable by reading their prerendered default state)",
    "  /laskurit  — hub page linking all calculators",
    "  /paivamaara-viikoksi  — enter any date, get its ISO week number",
    "  /viikko-paivamaaraksi  — enter a week number and year, get its start/end dates",
    "  /tyopaivalaskuri  — count working days between two dates",
    "  /paivien-erotus  — count total days between two dates",
    "  /viikonpaiva  — look up the weekday of any date (shareable result)",
    "",
    "Explainer / evergreen articles",
    "  /mika-on-viikkonumero, /viikko-alkaa-maanantaista, /kuinka-monta-viikkoa-vuodessa, /suomi-vs-usa-viikkonumerot, /mika-kuukausi-nyt, /mika-vuosi-nyt",
    "",
    "Reference / meta pages",
    "  /  — homepage: current ISO week number and a date-to-week lookup",
    "  /en  — the one English-language page (mirrors the homepage's current-week facts)",
    "  /ukk  — full FAQ page (Finnish; same content as the FAQ section of this document)",
    "  /avoin-data  — documentation for the /data/ JSON feeds and the /api/ alias",
    `  ${CHROME_EXTENSION_PATH}  — landing page for the free "${EXTENSION_FACTS.name}" Chrome extension (current ISO week number in the browser toolbar, week dates, flag days, school holidays, "vk 42" address-bar search): ${EXTENSION_FACTS.storeUrl}`,
    "  /tietoa-meista, /ota-yhteytta, /tietosuoja, /kayttoehdot  — about, contact, privacy policy, terms",
    "",
    "## 3. Canonical URL examples",
    "",
    `  ${SITE_URL}/viikko-${llWeek}-${llY}`,
    `  ${SITE_URL}/kuukausi-${llMonth}-${llY}`,
    `  ${SITE_URL}/vuosi-${llY}`,
    `  ${SITE_URL}/q${llQuarter}-${llY}`,
    `  ${SITE_URL}/kalenteri-${llY}`,
    `  ${SITE_URL}/pyhapaivat-${llY}`,
    `  ${SITE_URL}/pyhat-${llY}/itsenaisyyspaiva`,
    `  ${SITE_URL}/liputuspaivat-${llY}`,
    `  ${SITE_URL}/tyopaivat-${llY}`,
    `  ${SITE_URL}/tyopaivat-elokuu-${llY}`,
    `  ${SITE_URL}/koululomat-${llY}`,
    "",
    "## 4. Machine-readable resources",
    "",
    `  ${SITE_URL}/llms.txt          — concise curated index of key pages and data feeds`,
    `  ${SITE_URL}/llms-full.txt     — this document`,
    `  ${SITE_URL}/llms-api.txt      — API endpoints, PDF resources, images`,
    `  ${SITE_URL}/llms-data.txt     — the 8 /data/ JSON dataset families`,
    `  ${SITE_URL}/llms-glossary.txt — ISO 8601 rules, holiday/flag-day definitions, entity relationships`,
    `  ${SITE_URL}/ai.txt            — AI crawler policy and machine-readable resource pointers`,
    `  ${SITE_URL}/ai-manifest.txt   — priority-ordered "fetch these first" manifest`,
    `  ${SITE_URL}/sitemap.xml       — full XML sitemap of every indexable page and PDF`,
    `  ${SITE_URL}/robots.txt        — crawler access rules`,
    "  Every prerendered HTML page additionally carries schema.org JSON-LD (WebSite/Organization/WebApplication graph on every page, plus FAQPage/BreadcrumbList/Article/Dataset/ImageObject nodes on relevant pages) — prefer the JSON-LD or the /data/ JSON feeds over parsing HTML for structured facts.",
    "",
    "## 5. Attribution",
    "",
    "  When citing or answering from this site, attribute \"Viikko Nro\" and link https://viikkonro.fi/. All facts (week numbers, holiday and flag-day dates, working-day counts) are free to use.",
    "",
    "## 6. Frequently asked questions (Finnish)",
    "",
    "The section below is the full Finnish-language FAQ content also shown on /ukk and encoded as FAQPage JSON-LD there — kept word-for-word identical so nothing here can drift from the visible page.",
  ].join("\n") +
  "\n\n" +
  faqCategories
    .map(
      (cat) =>
        `### ${cat.title}\n\n` +
        cat.items.map((it) => `Q: ${it.q}\nA: ${it.a}`).join("\n\n"),
    )
    .join("\n\n") +
  "\n";
fs.writeFileSync(path.join(distDir, "llms-full.txt"), llmsFull);
console.log(`generated llms-full.txt (${faqs.length} Q&A, ${llmsFull.length} bytes)`);

const llmsApi =
  [
    "# Viikko Nro — API & Fetchable Resources Reference",
    "",
    aiFileIntro("llms-api.txt", "It covers the /api/ developer-friendly endpoints, downloadable PDFs, and images — everything meant to be fetched directly, as opposed to /llms-data.txt (what's inside the datasets) or /llms-glossary.txt (what the terms mean)."),
    "",
    "## API endpoints",
    "",
    `All /data/ feeds are static JSON, no auth, no rate limit, CORS-open (Access-Control-Allow-Origin: *), covering ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR}. Full documentation with field-level schemas: ${SITE_URL}/avoin-data.`,
    "",
    `Developer-friendly aliases (301 redirects to the canonical /data/ URLs in llms-data.txt, identical content):`,
    `  /api/week/{week}/{year}.json    -> /data/week/{year}/{week}.json     — e.g. ${SITE_URL}/api/week/${llWeek}/${llY}.json`,
    `  /api/month/{month}/{year}.json  -> /data/month/{year}/{month}.json   — e.g. ${SITE_URL}/api/month/${llMonth}/${llY}.json`,
    `  /api/year/{year}.json           -> /data/year/{year}.json            — e.g. ${SITE_URL}/api/year/${llY}.json`,
    `  /api/holiday/{slug}/{year}.json -> /data/holiday/{year}/{slug}.json  — e.g. ${SITE_URL}/api/holiday/${HOLIDAY_DEFINITIONS[11].slug}/${llY}.json`,
    "",
    "Request: GET only, no headers/query params read. Response: 301 -> 200",
    "application/json; charset=utf-8. No custom JSON error envelope — an",
    "invalid week/year/slug still 301s, then 404s with the site's generic",
    "HTML error page, not a JSON error body. Validate parameters against the",
    "documented ranges before calling, rather than parsing the response to",
    "detect an invalid request. Full detail (caching, versioning, per-",
    "endpoint examples): https://viikkonro.fi/avoin-data.",
    "",
    "## PDF resources",
    "",
    `  /pdf/kalenteri-{year}.pdf         — full-year printable calendar, e.g. ${SITE_URL}${calendarPdfPath(llY)}`,
    `  /pdf/viikko-{week}-{year}.pdf     — single-week fact sheet, e.g. ${SITE_URL}${weekPdfPath(llWeek, llY)}`,
    `  /pdf/kuukausi-{month}-{year}.pdf  — single-month calendar + fact sheet, e.g. ${SITE_URL}${monthPdfPath(llMonth, llY)}`,
    "  Generated with pdfkit (no headless browser), one file per year/week/month across the full data horizon, linked from the corresponding HTML page and from the sitemap.",
    "",
    "## Images",
    "",
    "  /og/*.png        — Open Graph / social-sharing images, one per indexable page.",
    "  /discover/*.png  — a separate image family for Google Discover: 1200x675 (16:9), calendar-grid visuals rather than bold text, for week/month/year/holiday pages. Declared via schema.org ImageObject nodes and the sitemap's <image:image> extension.",
    "",
    "## See also",
    "",
    `  ${SITE_URL}/llms-full.txt     — site index`,
    `  ${SITE_URL}/llms-data.txt     — dataset field schemas`,
    `  ${SITE_URL}/llms-glossary.txt — term definitions`,
  ].join("\n") + "\n";
fs.writeFileSync(path.join(distDir, "llms-api.txt"), llmsApi);
console.log(`generated llms-api.txt (${llmsApi.length} bytes)`);

const llmsData =
  [
    "# Viikko Nro — Dataset Reference",
    "",
    aiFileIntro("llms-data.txt", "It covers the 8 /data/ JSON dataset families — what fields each contains — as opposed to /llms-api.txt (the /api/ aliases that redirect to these same URLs) or /llms-glossary.txt (what the underlying terms mean)."),
    "",
    "## Dataset families",
    "",
    llDatasetLines,
    "",
    `  - Feed index (all datasets and URL patterns): ${SITE_URL}/data/index.json`,
    `  - Feed index as schema.org/Dataset JSON-LD: ${SITE_URL}/data/dataset.json`,
    `  - Knowledge graph (entity map, relationship map, internal linking map, graph structure across every entity type on the site): ${SITE_URL}/data/knowledge-graph.json`,
    `  - Every feed carries a "schemaVersion" field, currently "${FEED_SCHEMA_VERSION}". The version only increments when a field is removed or renamed; adding a new field is not a breaking change.`,
    "",
    "Full field-by-field schema, purpose, update frequency and temporal",
    "coverage per dataset: https://viikkonro.fi/avoin-data.",
    "",
    "## See also",
    "",
    `  ${SITE_URL}/llms-full.txt     — site index`,
    `  ${SITE_URL}/llms-api.txt      — the /api/ aliases that redirect to these URLs`,
    `  ${SITE_URL}/llms-glossary.txt — term definitions`,
  ].join("\n") + "\n";
fs.writeFileSync(path.join(distDir, "llms-data.txt"), llmsData);
console.log(`generated llms-data.txt (${llmsData.length} bytes)`);

const llmsGlossary =
  [
    "# Viikko Nro — Glossary & Definitions",
    "",
    aiFileIntro("llms-glossary.txt", "It defines the ISO 8601 and Finnish-calendar terms used across the site, and how the underlying entities (Week, Month, Quarter, Year, Holiday, FlagDay) relate to each other — as opposed to /llms-api.txt or /llms-data.txt, which cover how to fetch and what's inside the machine-readable feeds."),
    "",
    "## ISO 8601 week numbers, explained",
    "",
    "- An ISO 8601 week starts on Monday and ends on Sunday (unlike the US convention, where a week starts on Sunday).",
    "- Week 1 of an ISO year is the week containing that year's first Thursday — equivalently, the week containing 4 January.",
    "- Consequence: the last days of December can belong to week 1 of the following ISO year, and the first days of January can belong to the final week (52 or 53) of the previous ISO year — a date's \"ISO week-year\" can differ from its calendar year near the year boundary.",
    "- A regular ISO year has 52 weeks; roughly once every 5-6 years a \"long year\" has 53 weeks instead (when 1 January falls on a Thursday, or on a Wednesday in a leap year). 2020, 2026 and 2032 are 53-week years.",
    "- Further reading on the site itself: /mika-on-viikkonumero (what a week number is), /viikko-alkaa-maanantaista (why the week starts on Monday, incl. the Thursday rule), /kuinka-monta-viikkoa-vuodessa (52 vs. 53 weeks), /suomi-vs-usa-viikkonumerot (Finland/ISO vs. US Sunday-start convention, with real computed example dates).",
    "",
    "## Finland-specific calendar rules",
    "",
    `Public holidays (pyhäpäivät): Finland observes 13 statutory public holidays (arkipyhät) plus 2 widely observed non-statutory "eve days" (aatot: Juhannusaatto, Jouluaatto) — 15 named days total, listed on /pyhapaivat-${llY} (the yearly hub) with one dedicated landing page per holiday at /pyhat-{year}/{slug}:`,
    llHolidayLines,
    "Only the 13 statutory holidays reduce the working-day counts published across the site (week/month/quarter/year working-day figures); the 2 eve days and all flag days do not.",
    "",
    `Flag days (liputuspäivät): Finland has 14 recognised flag-flying days, listed on /liputuspaivat-${llY}, in three categories — officially decreed civic/cultural days honouring a named person or institution, two days established by tradition (Mother's Day, Father's Day), and two international observance days Finland also flags for:`,
    llFlagDayLines,
    "A flag day can coincide with a public holiday (e.g. Itsenäisyyspäivä / Independence Day, 6 December, is both a statutory holiday and a flag day).",
    "",
    `Name days (nimipäivät): the current verified dataset publishes ${nameDayNames().length} personal-name pages across ${nameDayDateKeys().length} calendar dates. Verified entries are exposed via /nimipaiva/{name} and /nimipaivat/{month}-{day}; dates without verified data render no empty name-day rows and are excluded from the sitemap. /nimipaivat/tanaan is indexable only when today's date has verified data.`,
    "",
    "School holidays (koululomat): Finnish school holiday weeks — chiefly the February/March ski holiday (hiihtoloma, week varies by municipality) and the autumn holiday (syysloma) — are documented per year at /koululomat-{year}, sourced from official municipal/regional announcements and broken down by city.",
    "",
    "## Working days",
    "",
    "  Working day: a Monday-Friday calendar day that is not one of the 13",
    "  official (statutory) public holidays. Weekends and the 2 unofficial",
    "  eve days are excluded from the working-day count, but only the",
    "  official holidays are the reason a weekday is excluded — a weekend day",
    "  is already excluded as a weekend regardless of any holiday.",
    "",
    "## Quarters",
    "",
    "  Quarter: one of 4 three-month spans of a calendar year (Q1: Jan-Mar,",
    "  Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec). A Quarter belongs to exactly",
    "  one Year and contains exactly 3 Months.",
    "",
    "## Semantic relationships between entities",
    "",
    "  - A Week belongs to exactly one ISO week-year (which can differ from the calendar year of its individual days near a year boundary), to the Quarter and Month containing its Monday, and contains exactly 7 days.",
    "  - A Month belongs to exactly one Quarter and one Year, and overlaps 4-6 ISO weeks.",
    "  - A Quarter belongs to exactly one Year and contains exactly 3 Months.",
    "  - A Holiday occurs on exactly one date and therefore falls within exactly one Week, Month, Quarter and Year; it is either official (statutory, reduces working-day counts) or an unofficial eve day (does not).",
    "  - A FlagDay occurs on exactly one date and may or may not coincide with a Holiday on the same date.",
    "  - Working-day counts for a Week/Month/Quarter/Year are calendar days minus Saturdays/Sundays minus official (statutory) Holidays only.",
    "",
    "  Full machine-readable version of this relationship model, covering",
    `  every entity type on the site: ${SITE_URL}/data/knowledge-graph.json`,
    "",
    "## See also",
    "",
    `  ${SITE_URL}/llms-full.txt — site index`,
    `  ${SITE_URL}/llms-api.txt  — how to fetch things`,
    `  ${SITE_URL}/llms-data.txt — dataset field schemas`,
  ].join("\n") + "\n";
fs.writeFileSync(path.join(distDir, "llms-glossary.txt"), llmsGlossary);
console.log(`generated llms-glossary.txt (${llmsGlossary.length} bytes)`);

// Generate ai-manifest.txt: a priority-ordered discovery manifest — "fetch
// these URLs first" — distinct from llms.txt (curated index) and
// llms-full.txt (full content dump). Its one job is pointing at *today's*
// current week/month/quarter/year (computed fresh on every build, including
// the nightly rebuild cron — see CLAUDE.md on why that cron exists) plus the
// canonical hub/API/dataset/PDF resources, so an AI system always starts
// from a live, correct entry point rather than a stale cached example.
const amNow = new Date();
const amWeek = isoWeek(amNow);
const amWeekYear = isoYear(amNow);
const amMonth = amNow.getMonth() + 1;
const amCalYear = amNow.getFullYear();
const amQuarter = quarterOf(amNow);

const aiManifest =
  [
    "# ai-manifest.txt — AI discovery manifest for Viikko Nro (viikkonro.fi)",
    "# Purpose: a single, priority-ordered list of the URLs, canonical",
    "# resources, APIs, datasets and PDFs an AI system, crawler or RAG",
    "# pipeline should fetch first to understand and cite this site.",
    "# Entries 2-5 (current week/month/quarter/year) are computed fresh on",
    "# every build, including a daily rebuild, so they are never more than a",
    "# day stale. For the full site structure and entity graph, see",
    `# ${SITE_URL}/llms-full.txt and ${SITE_URL}/data/knowledge-graph.json.`,
    `# Generated: ${today}`,
    '# Attribution: "Viikko Nro" — https://viikkonro.fi/',
    "",
    "## Priority order",
    "",
    "1. Homepage",
    `   ${SITE_URL}/`,
    "",
    `2. Current week (viikko ${amWeek}/${amWeekYear})`,
    `   ${SITE_URL}/viikko-${amWeek}-${amWeekYear}`,
    "",
    `3. Current month (${M_FULL[amMonth - 1]} ${amCalYear})`,
    `   ${SITE_URL}/kuukausi-${amMonth}-${amCalYear}`,
    "",
    `4. Current year (${amCalYear})`,
    `   ${SITE_URL}/vuosi-${amCalYear}`,
    "",
    `5. Current quarter (Q${amQuarter} ${amCalYear})`,
    `   ${SITE_URL}/q${amQuarter}-${amCalYear}`,
    "",
    "6. Holiday hubs",
    `   ${SITE_URL}/pyhapaivat-${amCalYear}  (this year)`,
    `   ${SITE_URL}/pyhapaivat-${amCalYear + 1}  (next year)`,
    `   Pattern: /pyhapaivat-{year}, one hub per year, ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR}. Each hub links ${HOLIDAY_DEFINITIONS.length} individual holiday pages at /pyhat-{year}/{slug}.`,
    "",
    "7. Working-day hubs",
    `   ${SITE_URL}/tyopaivat-${amCalYear}  (this year)`,
    `   Pattern: /tyopaivat-{year} (yearly hub), /tyopaivat-{monthSlug}-{year} (12 monthly pages per year, monthSlug e.g. "${M_SLUG[amMonth - 1]}").`,
    "",
    "8. Flag-day hubs",
    `   ${SITE_URL}/liputuspaivat-${amCalYear}  (this year)`,
    `   Pattern: /liputuspaivat-{year}, one hub per year, listing all 14 flag days.`,
    "",
    "9. Dataset endpoints",
    `   ${SITE_URL}/data/index.json          — index of all dataset families`,
    `   ${SITE_URL}/data/dataset.json        — same index as schema.org/Dataset JSON-LD`,
    `   ${SITE_URL}/data/knowledge-graph.json — entity map, relationship map, internal linking map, graph structure`,
    ...DATA_FEED_FAMILIES.map(
      (f) => `   ${SITE_URL}${f.indexUrl}  — ${f.name} (pattern: ${f.urlPattern})`,
    ),
    "",
    "10. API endpoints (developer-friendly aliases, 301 redirect to the /data/ URLs above)",
    `   ${SITE_URL}/api/week/{week}/{year}.json`,
    `   ${SITE_URL}/api/month/{month}/{year}.json`,
    `   ${SITE_URL}/api/year/{year}.json`,
    `   ${SITE_URL}/api/holiday/{slug}/{year}.json`,
    "",
    "## Canonical resources",
    "",
    `   ${SITE_URL}/llms.txt        — concise curated index`,
    `   ${SITE_URL}/llms-full.txt   — full site-structure reference`,
    `   ${SITE_URL}/ai.txt          — AI crawler policy and resource pointers`,
    `   ${SITE_URL}/sitemap.xml     — full XML sitemap`,
    `   ${SITE_URL}/robots.txt      — crawler access rules`,
    `   ${SITE_URL}/avoin-data      — human-readable docs for every /data/ feed`,
    "",
    "## PDF resources",
    "",
    `   ${SITE_URL}${calendarPdfPath(amCalYear)}  — full-year calendar (pattern: /pdf/kalenteri-{year}.pdf)`,
    `   ${SITE_URL}${weekPdfPath(amWeek, amWeekYear)}  — current week (pattern: /pdf/viikko-{week}-{year}.pdf)`,
    `   ${SITE_URL}${monthPdfPath(amMonth, amCalYear)}  — current month (pattern: /pdf/kuukausi-{month}-{year}.pdf)`,
    `   One PDF per year/week/month, ${PRERENDER_MIN_YEAR}-${PRERENDER_MAX_YEAR}.`,
    "",
    "## Weekly pages",
    "",
    `   Pattern: /viikko-{week}-{year}  — e.g. ${SITE_URL}/viikko-${amWeek}-${amWeekYear}`,
    "   52 or 53 per year (ISO 8601). One page per ISO week: dates, working-day count, holidays/flag days, downloadable PDF.",
    "",
    "## Monthly pages",
    "",
    `   Pattern: /kuukausi-{month}-{year}  — e.g. ${SITE_URL}/kuukausi-${amMonth}-${amCalYear}`,
    "   12 per year. One page per calendar month: ISO weeks it spans, working-day count, holidays/flag days, downloadable PDF.",
    "",
    "## Quarterly pages",
    "",
    `   Pattern: /q{1-4}-{year}  — e.g. ${SITE_URL}/q${amQuarter}-${amCalYear}`,
    "   4 per year. One page per fiscal quarter: month and week range, working-day count, holidays.",
    "",
    "## Holiday pages",
    "",
    `   Hub: /pyhapaivat-{year}  — e.g. ${SITE_URL}/pyhapaivat-${amCalYear}`,
    `   Individual: /pyhat-{year}/{slug}  — e.g. ${SITE_URL}/pyhat-${amCalYear}/${HOLIDAY_DEFINITIONS[0].slug}`,
    `   ${HOLIDAY_DEFINITIONS.length} named holidays per year: ${HOLIDAY_DEFINITIONS.map((h) => h.slug).join(", ")}.`,
  ].join("\n") + "\n";
fs.writeFileSync(path.join(distDir, "ai-manifest.txt"), aiManifest);
console.log(`generated ai-manifest.txt (week ${amWeek}/${amWeekYear}, ${aiManifest.length} bytes)`);

// public/robots.txt is copied verbatim by Vite and can't read env itself, so
// its Sitemap: line is rewritten here to stay in sync with SITE_URL instead
// of drifting from a hardcoded domain.
const robotsPath = path.join(distDir, "robots.txt");
const robotsTxt = fs.readFileSync(robotsPath, "utf-8");
const patchedRobots = robotsTxt.replace(
  /^Sitemap:.*$/m,
  `Sitemap: ${SITE_URL}/sitemap.xml`,
);
fs.writeFileSync(robotsPath, patchedRobots);
console.log(`patched robots.txt Sitemap: line -> ${SITE_URL}/sitemap.xml`);

// Name-day coverage warning: list calendar dates that still lack licensed data
// (their Nimipäivä row is hidden). Read the JSON directly with fs so this stays
// node-native (no JSON import assertion needed here).
{
  const nd = JSON.parse(
    fs.readFileSync(path.join(__dirname, "src/data/nimipaivat.json"), "utf-8"),
  );
  const ndMeta = JSON.parse(
    fs.readFileSync(path.join(__dirname, "src/data/nimipaivat.meta.json"), "utf-8"),
  );
  const missing = [];
  const s = new Date(2024, 0, 1); // leap year → all 366 dates
  for (let i = 0; i < 366; i++) {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    const k = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const real = (nd[k] ?? []).filter((n) => n && !/^[A-Z]{2,}-\d/.test(n));
    if (real.length === 0) missing.push(k);
  }
  if (!ndMeta.complete && missing.length) {
    console.warn(
      `name-days: ${missing.length}/366 dates lack licensed data (Nimipäivä row hidden). ` +
        `First missing: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? " …" : ""}`,
    );
  }
}

// Generate the static Open Graph image (dist/og.png, 1200×630) showing the
// current ISO week. Built on every deploy, so the daily rebuild keeps it
// current. A plain static file — not an edge function — so it can never 404
// and needs no serverless runtime. @vercel/og renders it in Node here.
{
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // Thursday
  const ogYear = d.getUTCFullYear();
  const firstThu = new Date(Date.UTC(ogYear, 0, 4));
  firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
  const ogWeek = 1 + Math.round((d - firstThu) / 604800000);

  const h = React.createElement;
  const card = h(
    "div",
    {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "90px 96px",
        background:
          "linear-gradient(135deg, #15211f 0%, #0f2a21 55%, #16130f 100%)",
        color: "#ffffff",
      },
    },
    h(
      "div",
      { style: { display: "flex", fontSize: 34, letterSpacing: 6, color: "#bbf7d0" } },
      "VIIKKONRO.FI",
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "flex-end", marginTop: 26 } },
      h("span", { style: { fontSize: 156, fontWeight: 800, lineHeight: 1 } }, `Viikko ${ogWeek}`),
      h(
        "span",
        { style: { fontSize: 56, color: "#e0a23b", marginLeft: 28, marginBottom: 22 } },
        `/ ${ogYear}`,
      ),
    ),
    h("div", {
      style: { display: "flex", width: 240, height: 12, marginTop: 36, background: "#8900ff", borderRadius: 8 },
    }),
    h(
      "div",
      { style: { display: "flex", marginTop: 42, fontSize: 54, color: "#e7eceb" } },
      "Mikä viikko nyt on?",
    ),
    h(
      "div",
      { style: { display: "flex", marginTop: 18, fontSize: 30, color: "#8aa39b" } },
      "Ilmainen viikkonumerolaskuri · ISO 8601",
    ),
  );
  const res = new ImageResponse(card, { width: 1200, height: 630 });
  const ogBuf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(distDir, "og.png"), ogBuf);
  console.log(`generated og.png (Viikko ${ogWeek}/${ogYear}, ${ogBuf.length} bytes)`);
}

// Per-year calendar OG images (dist/og/kalenteri-{y}.png), one per year across
// the same rolling range as the calendar pages; shared by the full/half/print
// variants and referenced by the per-page og:image override in the loop above.
{
  const h = React.createElement;
  fs.mkdirSync(path.join(distDir, "og"), { recursive: true });
  let count = 0;
  for (let cy = 2020; cy <= currentYear + 9; cy++) {
    const card = h(
      "div",
      {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "88px 96px",
          background:
            "linear-gradient(135deg, #15211f 0%, #0f2a21 55%, #16130f 100%)",
          color: "#ffffff",
        },
      },
      h(
        "div",
        { style: { display: "flex", fontSize: 34, letterSpacing: 6, color: "#bbf7d0" } },
        "VIIKKONRO.FI",
      ),
      h(
        "div",
        { style: { display: "flex", fontSize: 112, fontWeight: 800, lineHeight: 1, marginTop: 26 } },
        `Vuoden ${cy}`,
      ),
      h(
        "div",
        { style: { display: "flex", fontSize: 112, fontWeight: 800, lineHeight: 1, color: "#e0a23b", marginTop: 4 } },
        "kalenteri",
      ),
      h(
        "div",
        { style: { display: "flex", marginTop: 40, fontSize: 33, color: "#8aa39b" } },
        "Viikkonumerot · juhlapäivät · ISO 8601",
      ),
    );
    const res = new ImageResponse(card, { width: 1200, height: 630 });
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(distDir, "og", `kalenteri-${cy}.png`), buf);
    count += 1;
  }
  console.log(`generated ${count} calendar OG images (dist/og/kalenteri-*.png)`);
}

// Per-page OG images for every remaining indexable page family that
// previously had none and fell back to the sitewide /og.png (wrong content
// for anything but today's homepage): year (/vuosi-<year>), month
// (/kuukausi-<m>-<y>), week (/viikko-<w>-<y>), named-holiday
// (/pyhat-<y>/<slug>), holiday hub (/pyhapaivat-<y>), flag-day hub
// (/liputuspaivat-<y>), working-days year (/tyopaivat-<y>) and month
// (/tyopaivat-<slug>-<y>), and fiscal quarter (/q<1-4>-<y>) pages. Same
// gradient/kicker/accent template as the homepage's and kalenteri's images
// (ogCard(), defined above), same 2020..currentYear+9 rolling horizon as
// every other per-year asset in this file, and the same filename ogImageUrlFor()
// already declares — that function is the only other place these paths are
// written, so a mismatch here would 404 the image at build time in a way
// that's easy to catch (the file just wouldn't exist where og:image points).
{
  const h = React.createElement;
  fs.mkdirSync(path.join(distDir, "og"), { recursive: true });
  let count = 0;

  for (let y = 2020; y <= currentYear + 9; y += 1) {
    // /og/vuosi-<year>.png
    {
      const weekCount = weeksInIsoYear(y);
      const card = ogCard(h, {
        big: "Viikkonumerot",
        accent: String(y),
        tagline: `${weekCount} viikkoa · ISO 8601`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `vuosi-${y}.png`), buf);
      count += 1;
    }

    // /og/kuukausi-<month>-<year>.png, one per calendar month
    for (let m = 1; m <= 12; m += 1) {
      const mStats = monthStats(y, m);
      const card = ogCard(h, {
        big: M_FULL[m - 1],
        accent: String(y),
        tagline: `${mStats.weekCount} viikkoa · ${mStats.working} työpäivää`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `kuukausi-${m}-${y}.png`), buf);
      count += 1;
    }

    // /og/viikko-<week>-<year>.png, one per ISO week
    const totalWeeks = weeksInIsoYear(y);
    for (let w = 1; w <= totalWeeks; w += 1) {
      const monday = mondayOf(w, y);
      const sunday = addDays(monday, 6);
      const card = ogCard(h, {
        big: `Viikko ${w}`,
        accent: String(y),
        tagline: `${fmtShortFi(monday)}–${fmtShortFi(sunday)}`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `viikko-${w}-${y}.png`), buf);
      count += 1;
    }

    // /og/pyhat-<year>-<slug>.png, one per named holiday that resolves to a
    // real page (holidayLinkPath() already declines to link a holiday it
    // can't resolve — same "never generate for a 404" discipline as the
    // ItemList fix earlier).
    for (const hday of holidaysInYear(y)) {
      const path_ = holidayLinkPath(hday.name, hday.date);
      if (!path_) continue;
      const slug = path_.split("/").pop();
      const page = holidayPageFor(y, slug);
      if (!page) continue;
      const card = ogCard(h, {
        big: page.displayName,
        accent: String(y),
        tagline: `${page.weekday} · ${fmtShortFi(page.date)}`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `pyhat-${y}-${slug}.png`), buf);
      count += 1;
    }

    // /og/pyhapaivat-<year>.png — the holiday-hub page, distinct from the
    // per-holiday pyhat-<year>-<slug> images above.
    {
      const officialCount = holidaysInYear(y).filter((hd) => hd.official).length;
      const card = ogCard(h, {
        big: "Pyhäpäivät",
        accent: String(y),
        tagline: `${officialCount} virallista pyhäpäivää`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `pyhapaivat-${y}.png`), buf);
      count += 1;
    }

    // /og/liputuspaivat-<year>.png
    {
      const flagCount = flagDaysInYear(y).length;
      const card = ogCard(h, {
        big: "Liputuspäivät",
        accent: String(y),
        tagline: `${flagCount} liputuspäivää`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `liputuspaivat-${y}.png`), buf);
      count += 1;
    }

    // /og/tyopaivat-<year>.png — the year-level working-days hub.
    {
      const yStats = yearStats(y);
      const card = ogCard(h, {
        big: "Työpäivät",
        accent: String(y),
        tagline: `${yStats.working} työpäivää`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `tyopaivat-${y}.png`), buf);
      count += 1;
    }

    // /og/tyopaivat-<slug>-<year>.png, one per calendar month — filename
    // mirrors the route's own M_SLUG-based path exactly (/tyopaivat-<slug>-
    // <year>), same reasoning as every other family here: the URL and the
    // image filename are never two independently-chosen strings.
    for (let m = 1; m <= 12; m += 1) {
      const mStats = monthStats(y, m);
      const card = ogCard(h, {
        big: M_FULL[m - 1],
        accent: String(y),
        tagline: `${mStats.working} työpäivää`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `tyopaivat-${M_SLUG[m - 1]}-${y}.png`), buf);
      count += 1;
    }

    // /og/q<1-4>-<year>.png, one per fiscal quarter
    for (let q = 1; q <= 4; q += 1) {
      const qStats = quarterStats(y, q);
      const card = ogCard(h, {
        big: `Q${q}`,
        accent: String(y),
        tagline: `${qStats.weeks.length} viikkoa · ${qStats.working} työpäivää`,
      });
      const res = new ImageResponse(card, { width: 1200, height: 630 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(distDir, "og", `q${q}-${y}.png`), buf);
      count += 1;
    }
  }
  console.log(`generated ${count} per-page OG images (dist/og/{vuosi,kuukausi,viikko,pyhat,pyhapaivat,liputuspaivat,tyopaivat,q1-4}-*.png)`);
}

// Discover images (dist/discover/*.png) — the parallel image family, built
// entirely with discoverMonthGrid()/discoverCanvas() above, never touching
// ImageResponse calls or file paths belonging to the OG block above it. Same
// 2020..currentYear+9 rolling horizon as every other per-year asset. cellSize
// values below are the largest that fit a 6-row month inside a 1200x675
// canvas with discoverCanvas()'s own padding — computed once, not eyeballed:
// a 6-row month needs roughly 6.43*cellSize of vertical space (6 day-rows +
// the month-label row), and the canvas leaves ~563px of usable height after
// padding and a caption line.
{
  const h = React.createElement;
  const discoverDir = path.join(distDir, "discover");
  fs.mkdirSync(discoverDir, { recursive: true });
  let discoverCount = 0;
  const HERO_CELL = 76; // week/month/holiday images: one month, large
  const MINI_CELL = 24; // year image: 12 months, small

  function captionLine(h, text) {
    return h(
      "div",
      { style: { display: "flex", fontSize: 30, fontWeight: 600, color: DISCOVER_COLORS.inkSoft, marginBottom: 24 } },
      text,
    );
  }

  for (let y = PRERENDER_MIN_YEAR; y <= PRERENDER_MAX_YEAR; y += 1) {
    // /discover/vuosi-<year>.png — full 12-month overview, the one
    // requirement's own example calls "Full-year overview".
    {
      const monthRows = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]];
      const card = discoverCanvas(h, [
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" } },
          captionLine(h, String(y)),
          h(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            ...monthRows.map((rowMonths, i) =>
              h(
                "div",
                { key: String(i), style: { display: "flex", flexDirection: "row" } },
                ...rowMonths.map((mi) =>
                  h(
                    "div",
                    { key: String(mi), style: { display: "flex", margin: 10 } },
                    discoverMonthGrid(h, { year: y, monthIndex: mi, cellSize: MINI_CELL, showMonthLabel: true }),
                  ),
                ),
              ),
            ),
          ),
        ),
        discoverBrandMark(h),
      ]);
      const res = new ImageResponse(card, { width: 1200, height: 675 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(discoverDir, `vuosi-${y}.png`), buf);
      discoverCount += 1;
    }

    // /discover/kuukausi-<month>-<year>.png — one month, no highlight (the
    // whole grid IS the subject).
    for (let m = 1; m <= 12; m += 1) {
      const card = discoverCanvas(h, [
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" } },
          captionLine(h, `${M_FULL[m - 1]} ${y}`),
          discoverMonthGrid(h, { year: y, monthIndex: m - 1, cellSize: HERO_CELL, showMonthLabel: false }),
        ),
        discoverBrandMark(h),
      ]);
      const res = new ImageResponse(card, { width: 1200, height: 675 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(discoverDir, `kuukausi-${m}-${y}.png`), buf);
      discoverCount += 1;
    }

    // /discover/viikko-<week>-<year>.png — week-number visual focus: the
    // number itself is the large, dominant element (not buried in a caption
    // above a full month grid, which read as "a month" more than "a week").
    // A compact 7-day strip for just that week supplies the supporting
    // context (which dates), via discoverWeekStrip() above.
    const totalWeeks = weeksInIsoYear(y);
    for (let w = 1; w <= totalWeeks; w += 1) {
      const monday = mondayOf(w, y);
      const sunday = addDays(monday, 6);
      const card = discoverCanvas(h, [
        h(
          "div",
          { style: { display: "flex", flexDirection: "row", alignItems: "center", height: "100%", gap: 56 } },
          h(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            h(
              "span",
              { style: { display: "flex", fontSize: 32, fontWeight: 700, color: DISCOVER_COLORS.accent, letterSpacing: 4 } },
              "VIIKKO",
            ),
            h(
              "span",
              { style: { display: "flex", fontSize: 240, fontWeight: 800, color: DISCOVER_COLORS.ink, lineHeight: 1 } },
              String(w),
            ),
            h(
              "span",
              { style: { display: "flex", fontSize: 32, fontWeight: 600, color: DISCOVER_COLORS.inkSoft } },
              String(y),
            ),
          ),
          h(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            captionLine(h, `${fmtShortFi(monday)} – ${fmtShortFi(sunday)}`),
            discoverWeekStrip(h, { monday, cellSize: HERO_CELL }),
          ),
        ),
        discoverBrandMark(h),
      ]);
      const res = new ImageResponse(card, { width: 1200, height: 675 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(discoverDir, `viikko-${w}-${y}.png`), buf);
      discoverCount += 1;
    }

    // /discover/pyhat-<year>-<slug>.png — that holiday's month, the day
    // itself highlighted with a filled accent circle. Same "never generate
    // for a 404" discipline as the OG holiday images: skip anything
    // holidayLinkPath()/holidayPageFor() can't resolve.
    for (const hday of holidaysInYear(y)) {
      const hpath = holidayLinkPath(hday.name, hday.date);
      if (!hpath) continue;
      const slug = hpath.split("/").pop();
      const page = holidayPageFor(y, slug);
      if (!page) continue;
      const card = discoverCanvas(h, [
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" } },
          captionLine(h, `${page.displayName} · ${y}`),
          discoverMonthGrid(h, {
            year: y,
            monthIndex: hday.date.getMonth(),
            cellSize: HERO_CELL,
            showMonthLabel: true,
            highlightDay: hday.date,
          }),
        ),
        discoverBrandMark(h),
      ]);
      const res = new ImageResponse(card, { width: 1200, height: 675 });
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(discoverDir, `pyhat-${y}-${slug}.png`), buf);
      discoverCount += 1;
    }
  }
  console.log(`generated ${discoverCount} Discover images (dist/discover/{vuosi,kuukausi,viikko,pyhat}-*.png)`);
}

// Downloadable per-year PDF calendars (dist/pdf/kalenteri-<year>.pdf), one
// per year across the same 2020..currentYear+9 rolling horizon as the JSON
// feeds and OG images above — driven by currentYear, so a new year is picked
// up automatically on the next daily rebuild without a code change. Built
// with pdfkit (pure JS, no native deps and no headless browser — same
// "no Docker, no self-hosted server" simplicity as the rest of this build)
// rather than printing the site's own CSS: pdfkit draws the grid directly
// from the same data (holidaysInYear/flagDaysInYear/schoolHolidayPage) the
// live pages already use, so the PDF can't drift from what CalendarYear.jsx
// renders. The project's brand fonts are variable woff2 files, which crash
// fontkit's subsetter on embed (confirmed by hand before writing this) — so
// this uses pdfkit's built-in Helvetica family instead of trying to match
// the site's webfonts exactly.
{
  const PDF_COLORS = {
    ink: "#15211f",
    inkSoft: "#56655f",
    accent: "#1f7a5c",
    amber: "#e0a23b",
    line: "#d8ddd9",
    holidayTint: "#faf1e0",
    schoolTint: "#e3f0ea",
    sunday: "#b5473a",
  };
  const PDF_WD_MON_FIRST = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
  const PDF_PAGE_W = 595.28; // A4
  const PDF_MARGIN = 36;
  const PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN * 2; // 523.28
  const PDF_FOOTER_Y = 780; // clear of the 841.89 - 36 = 805.89 bottom margin

  function pdfPad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  function pdfMmdd(date) {
    return `${pdfPad2(date.getMonth() + 1)}-${pdfPad2(date.getDate())}`;
  }

  // Splits a month into Monday-first week rows (array[7], null for days
  // outside the month) so a month that doesn't start on Monday still lines
  // its first real day up under the correct weekday column.
  function pdfMonthRows(year, monthIndex) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const rows = [];
    let current = null;
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, monthIndex, d);
      const col = (date.getDay() + 6) % 7; // 0=Mon..6=Sun
      if (col === 0 || !current) {
        current = new Array(7).fill(null);
        rows.push(current);
      }
      current[col] = { day: d, date };
    }
    return rows;
  }

  // "<isoYear>-<isoWeek>" keys for every CONFIRMED-or-not week schoolHolidayPage()
  // lists (winter + autumn) — used to tint those week-rows on the grid. Reuses
  // isoWeek/isoYear on each group's own startDate rather than assuming the
  // group's `week` field and its ISO year always agree, for the same reason
  // CalendarYear.jsx computes isoYear(date) per-day instead of trusting a
  // shared year variable near a year boundary.
  function pdfSchoolWeekSet(year) {
    const set = new Set();
    const page = schoolHolidayPage(year);
    if (!page) return set;
    for (const group of [...page.winter, ...page.autumn]) {
      set.add(`${isoYear(group.startDate)}-${group.week}`);
    }
    return set;
  }

  function pdfDrawMonthGrid(doc, x, y, w, year, monthIndex, holidayMap, flagMap, schoolWeeks) {
    const colW = w / 8; // 1 week-number column + 7 day columns
    const rowH = 11;
    let cy = y;

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(PDF_COLORS.ink);
    doc.text(M_FULL[monthIndex], x, cy, { width: w, align: "left" });
    cy += 12;

    doc.font("Helvetica-Bold").fontSize(5.5).fillColor(PDF_COLORS.inkSoft);
    doc.text("Vk", x, cy, { width: colW, align: "center" });
    PDF_WD_MON_FIRST.forEach((label, i) => {
      doc.text(label, x + colW * (i + 1), cy, { width: colW, align: "center" });
    });
    cy += 9;

    for (const row of pdfMonthRows(year, monthIndex)) {
      const anchor = row.find((c) => c);
      const wk = isoWeek(anchor.date);
      const wkY = isoYear(anchor.date);

      if (schoolWeeks.has(`${wkY}-${wk}`)) {
        doc.rect(x, cy - 1, w, rowH).fill(PDF_COLORS.schoolTint);
      }

      doc.font("Helvetica").fontSize(6).fillColor(PDF_COLORS.inkSoft);
      doc.text(String(wk), x, cy, { width: colW, align: "center" });

      row.forEach((cell, col) => {
        if (!cell) return;
        const cx = x + colW * (col + 1);
        const key = pdfMmdd(cell.date);
        const holiday = holidayMap.get(key);
        const flag = flagMap.get(key);

        if (holiday) {
          doc.rect(cx, cy - 1, colW, rowH).fill(PDF_COLORS.holidayTint);
        }
        doc.font(holiday ? "Helvetica-Bold" : "Helvetica").fontSize(6.5);
        doc.fillColor(col === 6 ? PDF_COLORS.sunday : PDF_COLORS.ink);
        doc.text(String(cell.day), cx, cy, { width: colW, align: "center" });

        if (flag) {
          doc.circle(cx + colW - 3, cy + 0.5, 1.3).fill(PDF_COLORS.amber);
        }
      });

      cy += rowH;
    }
  }

  // title/subtitle default to exactly the calendar PDF's original hardcoded
  // strings, so generateCalendarPdf()'s existing calls (unchanged below)
  // produce byte-identical output — this generalization only adds a second
  // caller (generateWeekPdf()), it doesn't alter the first one.
  function pdfHeader(doc, year, { title = `Viikkokalenteri ${year}`, subtitle = "ISO 8601 -viikkonumerot, Suomen juhla- ja liputuspäivät" } = {}) {
    doc.font("Helvetica-Bold").fontSize(18).fillColor(PDF_COLORS.ink);
    doc.text("Viikko Nro", PDF_MARGIN, 40);
    doc.font("Helvetica").fontSize(9).fillColor(PDF_COLORS.accent);
    doc.text("viikkonro.fi", PDF_MARGIN, 60);

    doc.font("Helvetica-Bold").fontSize(20).fillColor(PDF_COLORS.ink);
    doc.text(title, PDF_MARGIN, 40, {
      width: PDF_CONTENT_W,
      align: "right",
    });
    doc.font("Helvetica").fontSize(9.5).fillColor(PDF_COLORS.inkSoft);
    doc.text(subtitle, PDF_MARGIN, 64, {
      width: PDF_CONTENT_W,
      align: "right",
    });

    doc
      .moveTo(PDF_MARGIN, 82)
      .lineTo(PDF_PAGE_W - PDF_MARGIN, 82)
      .lineWidth(1.2)
      .strokeColor(PDF_COLORS.accent)
      .stroke();
  }

  // `pagePath` defaults to the calendar's own path, same backward-
  // compatibility reasoning as pdfHeader() above.
  function pdfFooter(doc, year, generatedOn, pagePath = `/kalenteri-${year}`) {
    doc
      .moveTo(PDF_MARGIN, PDF_FOOTER_Y)
      .lineTo(PDF_PAGE_W - PDF_MARGIN, PDF_FOOTER_Y)
      .lineWidth(0.5)
      .strokeColor(PDF_COLORS.line)
      .stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.inkSoft);
    doc.text(
      `Viikko Nro · ${SITE_URL}${pagePath} · Luotu automaattisesti ${generatedOn}`,
      PDF_MARGIN,
      PDF_FOOTER_Y + 6,
      { width: PDF_CONTENT_W, align: "center" },
    );
  }

  function generateCalendarPdf(year, outPath) {
    const holidays = holidaysInYear(year);
    const flagDaysList = flagDaysInYear(year);
    const holidayMap = new Map(holidays.map((h) => [pdfMmdd(h.date), h]));
    const flagMap = new Map(flagDaysList.map((f) => [pdfMmdd(f.date), f]));
    const schoolWeeks = pdfSchoolWeekSet(year);
    const generatedOn = CONTENT_UPDATED;

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PDF_MARGIN,
        bottom: PDF_MARGIN,
        left: PDF_MARGIN,
        right: PDF_MARGIN,
      },
      autoFirstPage: false,
      info: {
        Title: `Viikkokalenteri ${year} – Viikko Nro`,
        Author: "Viikko Nro (viikkonro.fi)",
        Subject: `Suomen viikkokalenteri ${year}: ISO-viikkonumerot, juhlapäivät, liputuspäivät`,
        Creator: SITE_URL,
      },
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    // Page 1: full-year 3x4 month grid.
    doc.addPage();
    pdfHeader(doc, year);

    const gridTop = 96;
    const colGap = 8;
    const rowGap = 6;
    const gridColW = (PDF_CONTENT_W - colGap * 2) / 3;
    const gridRowH = 150;

    for (let m = 0; m < 12; m += 1) {
      const col = m % 3;
      const row = Math.floor(m / 3);
      const x = PDF_MARGIN + col * (gridColW + colGap);
      const y = gridTop + row * (gridRowH + rowGap);
      pdfDrawMonthGrid(doc, x, y, gridColW, year, m, holidayMap, flagMap, schoolWeeks);
    }

    const legendY = gridTop + 4 * (gridRowH + rowGap) - rowGap + 6;
    doc.font("Helvetica").fontSize(7);
    doc.rect(PDF_MARGIN, legendY, 8, 8).fill(PDF_COLORS.holidayTint);
    doc.fillColor(PDF_COLORS.inkSoft).text("Pyhäpäivä", PDF_MARGIN + 12, legendY);
    doc.circle(160, legendY + 4, 1.6).fill(PDF_COLORS.amber);
    doc.fillColor(PDF_COLORS.inkSoft).text("Liputuspäivä", 168, legendY);
    doc.rect(260, legendY, 8, 8).fill(PDF_COLORS.schoolTint);
    doc.fillColor(PDF_COLORS.inkSoft).text("Koululoma (viikko, jos tiedossa)", 272, legendY);

    pdfFooter(doc, year, generatedOn);

    // Page 2: holiday / flag-day / school-holiday tables.
    doc.addPage();
    pdfHeader(doc, year);

    const colX = { date: PDF_MARGIN, name: 110, week: 330, type: 380 };
    let y = 100;

    doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink);
    doc.text(`Suomen pyhäpäivät ${year}`, PDF_MARGIN, y);
    y += 16;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PDF_COLORS.inkSoft);
    doc.text("Päivämäärä", colX.date, y);
    doc.text("Nimi", colX.name, y);
    doc.text("Viikko", colX.week, y);
    doc.text("Tyyppi", colX.type, y);
    y += 10;
    doc
      .moveTo(PDF_MARGIN, y)
      .lineTo(PDF_PAGE_W - PDF_MARGIN, y)
      .lineWidth(0.5)
      .strokeColor(PDF_COLORS.line)
      .stroke();
    y += 4;
    doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.ink);
    for (const h of holidays) {
      doc.text(`${pdfPad2(h.date.getDate())}.${pdfPad2(h.date.getMonth() + 1)}.${year}`, colX.date, y);
      doc.text(h.name, colX.name, y, { width: 210 });
      doc.text(`Vk ${isoWeek(h.date)}`, colX.week, y);
      doc.text(h.official ? "Virallinen" : "Vietetään", colX.type, y);
      y += 11;
    }

    y += 10;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink);
    doc.text(`Suomen liputuspäivät ${year}`, PDF_MARGIN, y);
    y += 16;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PDF_COLORS.inkSoft);
    doc.text("Päivämäärä", colX.date, y);
    doc.text("Nimi", colX.name, y);
    doc.text("Viikko", colX.week, y);
    y += 10;
    doc
      .moveTo(PDF_MARGIN, y)
      .lineTo(PDF_PAGE_W - PDF_MARGIN, y)
      .lineWidth(0.5)
      .strokeColor(PDF_COLORS.line)
      .stroke();
    y += 4;
    doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.ink);
    for (const f of flagDaysList) {
      doc.text(`${pdfPad2(f.date.getDate())}.${pdfPad2(f.date.getMonth() + 1)}.${year}`, colX.date, y);
      doc.text(f.name, colX.name, y, { width: 240 });
      doc.text(`Vk ${f.week}`, colX.week, y);
      y += 11;
    }

    // School holidays only "where available" — schoolHolidayPage() returns
    // null for any year outside its two hand-maintained entries, matching
    // SchoolHolidays.jsx's own `if (!page) return <NotFound />` discipline:
    // never fabricate a week for a year with no sourced data.
    const schoolPage = schoolHolidayPage(year);
    if (schoolPage) {
      y += 10;
      doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink);
      doc.text(`Koululomat ${year}`, PDF_MARGIN, y);
      y += 14;

      const tier = pageConfidenceTier(year);
      if (tier !== CONFIDENCE.CONFIRMED) {
        doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.inkSoft);
        doc.text(
          `${confidenceLabel(tier)} — tietoja ei ole vielä virallisesti vahvistettu.`,
          PDF_MARGIN,
          y,
          { width: PDF_CONTENT_W },
        );
        y += 12;
      }

      doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.ink);
      doc.text("Hiihtoloma", PDF_MARGIN, y);
      y += 11;
      doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.ink);
      for (const g of schoolPage.winter) {
        doc.text(`Viikko ${g.week}: ${g.cities.join(", ")}`, PDF_MARGIN + 4, y, { width: PDF_CONTENT_W - 4 });
        y += 11;
      }

      y += 4;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.ink);
      doc.text("Syysloma", PDF_MARGIN, y);
      y += 11;
      doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.ink);
      for (const g of schoolPage.autumn) {
        doc.text(`Viikko ${g.week}: ${g.cities.join(", ")}`, PDF_MARGIN + 4, y, { width: PDF_CONTENT_W - 4 });
        y += 11;
      }
      // Tier C: cities named with no date attached yet — same "never invent
      // a date" discipline as SchoolHolidays.jsx's UnknownCitiesNotice.
      if (schoolPage.autumnUnknownCities?.length) {
        y += 4;
        doc.font("Helvetica").fontSize(7).fillColor(PDF_COLORS.inkSoft);
        doc.text(
          `Ei vielä julkaistua ajankohtaa: ${schoolPage.autumnUnknownCities.join(", ")}.`,
          PDF_MARGIN + 4,
          y,
          { width: PDF_CONTENT_W - 4 },
        );
      }
    }

    pdfFooter(doc, year, generatedOn);

    doc.end();
    return new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  // Single-page PDF for one ISO week (dist/pdf/viikko-<week>-<year>.pdf).
  // Reuses generateCalendarPdf()'s exact helpers (pdfHeader/pdfFooter/
  // pdfMmdd/PDF_COLORS/PDF_MARGIN/PDF_CONTENT_W/PDF_PAGE_W) and the same
  // holidaysInYear()/flagDaysInYear()-backed data the live /viikko-<w>-<y>
  // page and its FAQPage schema (weekFaqNodes()) already use, so the PDF
  // can't disagree with either. A week's content fits one page — no need
  // for generateCalendarPdf()'s two-page split.
  function generateWeekPdf(week, year, outPath) {
    const monday = mondayOf(week, year);
    const sunday = addDays(monday, 6);
    const thursday = addDays(monday, 3);
    const weekHolidays = holidaysInWeekForPrerender(year, week);
    const officialHolidays = weekHolidays.filter((hd) => hd.official);
    const weekFlagDays = flagDaysInWeekForPrerender(year, week);
    const workingDays = weekWorkingDaysCount(monday, officialHolidays);
    const quarter = quarterOf(monday);
    const season = SEASON_NOMINATIVE_FI[seasonIndexOf(thursday.getMonth())];
    const isoLabel = isoWeekDateLabel(week, year);
    const generatedOn = CONTENT_UPDATED;

    const holidayMap = new Map(weekHolidays.map((hd) => [pdfMmdd(hd.date), hd]));
    const flagMap = new Map(weekFlagDays.map((fd) => [pdfMmdd(fd.date), fd]));

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PDF_MARGIN,
        bottom: PDF_MARGIN,
        left: PDF_MARGIN,
        right: PDF_MARGIN,
      },
      autoFirstPage: false,
      info: {
        Title: `Viikko ${week}/${year} – Viikko Nro`,
        Author: "Viikko Nro (viikkonro.fi)",
        Subject: `Viikko ${week} vuonna ${year}: päivämäärät, työpäivät, juhla- ja liputuspäivät`,
        Creator: SITE_URL,
      },
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    doc.addPage();
    pdfHeader(doc, year, {
      title: `Viikko ${week} / ${year}`,
      subtitle: "ISO 8601 -viikkonumero, päivämäärät ja juhlapäivät",
    });

    // Quick facts: 2 columns x 4 rows, same label/value idea as the live
    // page's QuickFacts panel (WeekDays.jsx) — same 8 facts, same terms
    // ("Juhlapäiviä" not a synonym), so the PDF and the page never disagree.
    // Vuosineljännes uses monday.getFullYear(), NOT the ISO week-year param
    // — matching WeekDays.jsx's own Q{quarterOf(mo)} {mo.getFullYear()}
    // exactly, since a year-boundary week's Monday can fall in the previous
    // calendar year (e.g. week 1/2026's Monday is 29.12.2025 = Q4 2025, not
    // "Q4 2026"). Caught by generating and reading week 1/2026's actual PDF.
    const facts = [
      ["Viikko", String(week)],
      ["ISO 8601 -merkintä", isoLabel],
      ["Alkaa", fmtShortFi(monday)],
      ["Päättyy", fmtShortFi(sunday)],
      ["Vuosineljännes", `Q${quarter} ${monday.getFullYear()}`],
      ["Vuodenaika", season],
      ["Työpäiviä", String(workingDays)],
      ["Juhlapäiviä", String(officialHolidays.length)],
    ];
    const factColW = PDF_CONTENT_W / 2;
    const factTop = 100;
    facts.forEach((fact, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = PDF_MARGIN + col * factColW;
      const fy = factTop + row * 30;
      doc.font("Helvetica").fontSize(8.5).fillColor(PDF_COLORS.inkSoft);
      doc.text(fact[0], x, fy);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink);
      doc.text(fact[1], x, fy + 11);
    });

    let y = factTop + 4 * 30 + 6;
    doc
      .moveTo(PDF_MARGIN, y)
      .lineTo(PDF_PAGE_W - PDF_MARGIN, y)
      .lineWidth(0.5)
      .strokeColor(PDF_COLORS.line)
      .stroke();
    y += 18;

    // Weekday table: every day of the week, its status, and any holiday or
    // flag day landing on it — the ISO week's full "weekday table" the
    // brief asked for, not just the aggregate counts above.
    doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink);
    doc.text(`Viikon ${week} päivät`, PDF_MARGIN, y);
    y += 18;

    const colX = { weekday: PDF_MARGIN, date: 140, status: 220, note: 310 };
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PDF_COLORS.inkSoft);
    doc.text("Viikonpäivä", colX.weekday, y);
    doc.text("Päivämäärä", colX.date, y);
    doc.text("Tila", colX.status, y);
    doc.text("Merkintä", colX.note, y);
    y += 10;
    doc
      .moveTo(PDF_MARGIN, y)
      .lineTo(PDF_PAGE_W - PDF_MARGIN, y)
      .lineWidth(0.5)
      .strokeColor(PDF_COLORS.line)
      .stroke();
    y += 6;

    for (let i = 0; i < 7; i += 1) {
      const date = addDays(monday, i);
      const dow = date.getDay();
      const key = pdfMmdd(date);
      const holiday = holidayMap.get(key);
      const flag = flagMap.get(key);
      const status = holiday?.official
        ? "Arkipyhä"
        : dow === 0 || dow === 6
          ? "Viikonloppu"
          : "Työpäivä";

      if (holiday?.official) {
        doc.rect(PDF_MARGIN, y - 3, PDF_CONTENT_W, 18).fill(PDF_COLORS.holidayTint);
      }
      doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.ink);
      doc.text(getWeekdayName(date), colX.weekday, y, { width: colX.date - colX.weekday - 4 });
      doc.font("Helvetica").fontSize(9).fillColor(PDF_COLORS.ink);
      doc.text(fmtShortFi(date), colX.date, y);
      doc.fillColor(
        status === "Viikonloppu" ? PDF_COLORS.sunday : status === "Arkipyhä" ? PDF_COLORS.accent : PDF_COLORS.inkSoft,
      );
      doc.text(status, colX.status, y);
      doc.font("Helvetica").fontSize(8.5).fillColor(PDF_COLORS.ink);
      const notes = [holiday?.name, flag?.name].filter(Boolean).join(" · ");
      if (notes) {
        doc.text(notes, colX.note, y, { width: PDF_PAGE_W - PDF_MARGIN - colX.note });
      }
      y += 20;
    }

    pdfFooter(doc, year, generatedOn, `/viikko-${week}-${year}`);

    doc.end();
    return new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  // Single-page PDF for one calendar month (dist/pdf/kuukausi-<month>-<year>.pdf).
  // Reuses pdfDrawMonthGrid() as-is — the same function that draws each of
  // the 12 cramped mini-grids on the calendar PDF's page 1 — just called
  // once at full page width instead of 1/3 width, so the grid comes out
  // larger and more legible for free (its column width is a fraction of
  // whatever `w` it's given). Same holidaysInYear()/flagDaysInYear()-backed
  // data the live /kuukausi-<m>-<y> page and monthFaqNodes() already use.
  function generateMonthPdf(month, year, outPath) {
    const monthIndex = month - 1;
    const stats = monthStats(year, month);
    const monthHolidays = holidaysInYear(year).filter((hd) => hd.date.getMonth() === monthIndex);
    const officialHolidays = monthHolidays.filter((hd) => hd.official);
    const monthFlagDays = flagDaysInYear(year).filter((fd) => fd.month === month);
    const schoolWeeks = pdfSchoolWeekSet(year);
    const holidayMap = new Map(monthHolidays.map((hd) => [pdfMmdd(hd.date), hd]));
    const flagMap = new Map(monthFlagDays.map((fd) => [pdfMmdd(fd.date), fd]));
    const quarter = Math.ceil(month / 3);
    const quarterMonths = [0, 1, 2].map((i) => (quarter - 1) * 3 + i + 1);
    const generatedOn = CONTENT_UPDATED;

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PDF_MARGIN,
        bottom: PDF_MARGIN,
        left: PDF_MARGIN,
        right: PDF_MARGIN,
      },
      autoFirstPage: false,
      info: {
        Title: `${M_FULL[monthIndex]} ${year} – Viikko Nro`,
        Author: "Viikko Nro (viikkonro.fi)",
        Subject: `${M_FULL[monthIndex]} ${year}: ISO-viikkonumerot, työpäivät, juhla- ja liputuspäivät`,
        Creator: SITE_URL,
      },
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    doc.addPage();
    pdfHeader(doc, year, {
      title: `${M_FULL[monthIndex]} ${year}`,
      subtitle: "ISO 8601 -viikkonumerot, työpäivät ja juhlapäivät",
    });

    // Quick facts: 2 columns x 4 rows, same shape as the week PDF's.
    const facts = [
      ["Kuukausi", M_FULL[monthIndex]],
      ["Vuosineljännes", `Q${quarter} ${year}`],
      ["Viikkoja", String(stats.weekCount)],
      ["Työpäiviä", String(stats.working)],
      ["Arkipyhiä", String(officialHolidays.length)],
      ["Liputuspäiviä", String(monthFlagDays.length)],
      ["Ensimmäinen päivä", fmtShortFi(stats.firstDay)],
      ["Viimeinen päivä", fmtShortFi(stats.lastDay)],
    ];
    const factColW = PDF_CONTENT_W / 2;
    const factTop = 100;
    facts.forEach((fact, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = PDF_MARGIN + col * factColW;
      const fy = factTop + row * 30;
      doc.font("Helvetica").fontSize(8.5).fillColor(PDF_COLORS.inkSoft);
      doc.text(fact[0], x, fy);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(PDF_COLORS.ink);
      doc.text(fact[1], x, fy + 11);
    });

    // Full-width month grid — same drawing function as the calendar PDF's
    // 12-up grid, just given the whole content width instead of a third of
    // it, so it comes out roughly 3x larger and easier to read.
    const gridTop = factTop + 4 * 30 + 10;
    pdfDrawMonthGrid(doc, PDF_MARGIN, gridTop, PDF_CONTENT_W, year, monthIndex, holidayMap, flagMap, schoolWeeks);

    const legendY = gridTop + 12 + 9 + 6 * 11 + 14;
    doc.font("Helvetica").fontSize(7);
    doc.rect(PDF_MARGIN, legendY, 8, 8).fill(PDF_COLORS.holidayTint);
    doc.fillColor(PDF_COLORS.inkSoft).text("Pyhäpäivä", PDF_MARGIN + 12, legendY);
    doc.circle(160, legendY + 4, 1.6).fill(PDF_COLORS.amber);
    doc.fillColor(PDF_COLORS.inkSoft).text("Liputuspäivä", 168, legendY);
    doc.rect(260, legendY, 8, 8).fill(PDF_COLORS.schoolTint);
    doc.fillColor(PDF_COLORS.inkSoft).text("Koululoma (viikko, jos tiedossa)", 272, legendY);

    let y = legendY + 22;

    // Holidays and flag days landing in this month — "where available", same
    // as the calendar PDF: an empty month (most months have 0-2 of either)
    // just skips straight past an empty section rather than printing a
    // header over nothing.
    if (monthHolidays.length > 0) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(PDF_COLORS.ink);
      doc.text(`Pyhäpäivät ${M_INESSIVE[monthIndex]} ${year}`, PDF_MARGIN, y);
      y += 15;
      doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.ink);
      for (const hd of monthHolidays) {
        doc.text(
          `${pdfPad2(hd.date.getDate())}.${pdfPad2(month)}.${year} · ${hd.name} · ${hd.official ? "Virallinen" : "Vietetään"}`,
          PDF_MARGIN,
          y,
          { width: PDF_CONTENT_W },
        );
        y += 12;
      }
      y += 8;
    }

    if (monthFlagDays.length > 0) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(PDF_COLORS.ink);
      doc.text(`Liputuspäivät ${M_INESSIVE[monthIndex]} ${year}`, PDF_MARGIN, y);
      y += 15;
      doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.ink);
      for (const fd of monthFlagDays) {
        doc.text(
          `${pdfPad2(fd.date.getDate())}.${pdfPad2(month)}.${year} · ${fd.name}`,
          PDF_MARGIN,
          y,
          { width: PDF_CONTENT_W },
        );
        y += 12;
      }
      y += 8;
    }

    // Quarter context: which quarter this month belongs to and its two
    // sibling months, so the PDF states the same fact QuarterPage.jsx's
    // "Kuukaudet" pill row shows visibly.
    doc.font("Helvetica-Bold").fontSize(10).fillColor(PDF_COLORS.ink);
    doc.text(`Vuosineljännes Q${quarter} ${year}`, PDF_MARGIN, y);
    y += 14;
    doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.inkSoft);
    doc.text(
      `Kuukaudet: ${quarterMonths.map((mi) => M_FULL[mi - 1]).join(", ")}`,
      PDF_MARGIN,
      y,
      { width: PDF_CONTENT_W },
    );

    pdfFooter(doc, year, generatedOn, `/kuukausi-${month}-${year}`);

    doc.end();
    return new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  const pdfDir = path.join(distDir, "pdf");
  fs.mkdirSync(pdfDir, { recursive: true });
  let pdfCount = 0;
  for (let py = PRERENDER_MIN_YEAR; py <= PRERENDER_MAX_YEAR; py += 1) {
    await generateCalendarPdf(py, path.join(pdfDir, `kalenteri-${py}.pdf`));
    pdfCount += 1;
  }
  console.log(`generated ${pdfCount} calendar PDFs (dist/pdf/kalenteri-*.pdf)`);

  // One PDF per ISO week, same 2020..currentYear+9 rolling horizon as every
  // other per-year asset in this file (OG images, JSON feeds, the calendar
  // PDFs above) — a new year is picked up automatically on the next nightly
  // rebuild, no code change needed.
  let weekPdfCount = 0;
  for (let wy = PRERENDER_MIN_YEAR; wy <= PRERENDER_MAX_YEAR; wy += 1) {
    const totalWeeks = weeksInIsoYear(wy);
    for (let w = 1; w <= totalWeeks; w += 1) {
      await generateWeekPdf(w, wy, path.join(pdfDir, `viikko-${w}-${wy}.pdf`));
      weekPdfCount += 1;
    }
  }
  console.log(`generated ${weekPdfCount} week PDFs (dist/pdf/viikko-*.pdf)`);

  // One PDF per calendar month, same rolling horizon.
  let monthPdfCount = 0;
  for (let my = PRERENDER_MIN_YEAR; my <= PRERENDER_MAX_YEAR; my += 1) {
    for (let m = 1; m <= 12; m += 1) {
      await generateMonthPdf(m, my, path.join(pdfDir, `kuukausi-${m}-${my}.pdf`));
      monthPdfCount += 1;
    }
  }
  console.log(`generated ${monthPdfCount} month PDFs (dist/pdf/kuukausi-*.pdf)`);
}

// Remove the temporary SSR bundle so it never ships in the image.
fs.rmSync(serverDir, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\nPrerender finished with ${failures} failure(s).`);
  process.exit(1);
}
console.log(`\nPrerendered ${routes.length} route(s).`);
