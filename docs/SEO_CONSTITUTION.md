# SEO Constitution — Viikkonro.fi

**Read this before every development task on this repository.** It
governs any change that touches routing, page content, structured data,
the build (`prerender.js`), `vercel.json`, or anything under `/data/`,
`/pdf/`, `/og/`, `/discover/`, or the AI-facing text files in `public/`.

This document is not a description of good SEO practice in general. It is
a specific, enforceable contract for *this* site, naming the exact files
and functions that implement each invariant, so a violation can be
checked mechanically rather than argued about. Where this document says
"preserve," it means: a future change is only acceptable if the named
mechanism still produces equivalent or better output for every URL that
currently has it — not if the mechanism is deleted, silently narrowed, or
"replaced" by something that covers fewer pages.

---

## How to use this document

Before starting any task:

1. Read the invariant(s) relevant to what you're touching.
2. Identify the exact function(s)/file(s) that currently implement it.
3. After your change, verify the invariant still holds for a real
   sample — not "the code looks right," but an actual computed or
   rendered check (this repo's established discipline: extract the
   changed function into an isolated Node harness against real data, or
   run the build and inspect real output; see `CLAUDE.md`'s `npm run
   build` note).

If a task requires *breaking* an invariant, that is a decision for the
user to make explicitly — surface the tradeoff and ask, don't decide
silently. See [Amendments](#amendments).

---

## The 15 invariants

### 1. Preserve existing URL structure

**Rule**: every URL pattern currently live must keep resolving to the
same content shape. Routes are single-segment Finnish keyword slugs
(`/viikko-{week}-{year}`, `/kuukausi-{month}-{year}`, `/vuosi-{year}`,
`/q{1-4}-{year}`, `/kalenteri-{year}[-alkuvuosi|-loppuvuosi]`,
`/tulosta-{year}`, `/tulostettava-kalenteri-{year}`, `/pyhapaivat-{year}`,
`/pyhat-{year}/{slug}`, `/liputuspaivat-{year}`, `/tyopaivat-{year}`,
`/tyopaivat-{monthSlug}-{year}`, `/koululomat-{year}`,
`/nimipaivat/tanaan`, `/nimipaiva/{name}`, `/nimipaivat/{month}-{day}`,
`/palkkapaivat-{year}`, `/kesaaika-{year}`, the four
`/kuinka-monta-paivaa-{target}` countdowns, plus static pages).
Non-HTML resources outside the route table: `/ics/*.ics` calendar feeds
(generated from `src/data/icsFeeds.js`) and the `/widget/viikko` iframe
document (`src/data/weekWidget.js`) — the widget is deliberately
`noindex` and absent from `sitemapEntries()`, and it is the only path
exempt from `X-Frame-Options` in `vercel.json`.

**Lives in**: `src/AppRoutes.jsx`'s `DynamicSlug` regex dispatcher (the
single source of truth for which slug shapes are valid) and
`canonicalFor()`/`routeMeta` in `src/data/seo.js`.

**Never**:
- Add a second URL pattern for content that already has one (the
  `/liputuspaivat` no-year redirect exists specifically to avoid a
  duplicate, year-less content type — see its comment in
  `AppRoutes.jsx` — follow that precedent, don't reverse it).
- Change an existing slug's meaning or add a trailing slash (`vercel.json`
  declares `"trailingSlash": false`; `prerender.js` writes flat files like
  `dist/ukk.html`, not `dist/ukk/index.html`, specifically to avoid a
  directory-index redirect fighting that convention).
- Retire an old URL without a 301 in `vercel.json`'s `redirects` array
  (see the `/week/:week/:year` → `/viikko-:week-:year` and retired `/sv/*`
  examples already there).

### 2. Preserve schema coverage

**Rule**: every page type that currently emits JSON-LD must keep emitting
at least the same node types after any change.

**Lives in**: the per-URL dispatch block in `prerender.js` (search
`isIndexable(url) && !meta.robots?.startsWith("noindex")`), which calls
one or more `*Nodes()` functions per page family (`weekFaqNodes`,
`monthFaqNodes`, `quarterNodes`, `yearFaqNodes`, `calendarPageNodes`,
`holidaysEventNodes`, `namedHolidayNodes`, `flagDayNodes`,
`workingDaysFaqNodes`, `monthlyWorkingDaysNodes`, `weekCollectionNodes`,
`calculatorNodes`, `nameDayPageNodes`, `schoolHolidayNodes`, plus the
generic fallback `pageNode()` call for anything not otherwise matched).

**Never**: add a new page family without adding its node-builder to this
dispatch — a page that renders but emits no JSON-LD is a silent
regression versus every sibling page type.

### 3. Preserve internal linking

**Rule**: the `isPartOf`/`hasPart`/`mentions` edges connecting
Week↔Month↔Quarter↔Year↔Holiday↔FlagDay↔WorkingDay↔Calendar pages must
keep resolving to real, live `#webpage` node `@id`s.

**Lives in**: `entityParentExtra(url)` in `prerender.js` (the single
function computing `isPartOf`/`hasPart` for that hierarchy — spread into
7 call sites: the generic fallback, `weekCollectionNodes`, `quarterNodes`,
`calendarPageNodes`, `monthlyWorkingDaysNodes`, `namedHolidayNodes`,
`flagDayNodes`), plus the pre-existing `mentions` edges in
`namedHolidayNodes()` (holiday → week/month/year) and
`weekCollectionNodes()` (month → holidays in that month). The full,
current picture of this graph is documented in
`/data/knowledge-graph.json` and must be kept in sync with it — that file
is generated from the same `HOLIDAY_DEFINITIONS`/`M_SLUG`/
`DATA_FEED_FAMILIES` sources, not hand-maintained separately.

**Never**: introduce a new entity-hierarchy relationship (e.g. a new page
type that's "part of" a Year) without (a) adding it to
`entityParentExtra()` using an `@id` reference to the real target node,
never an inline stub object, and (b) updating the `relationshipMap`/
`internalLinkingMap` in the `knowledge-graph.json` generator to match.

### 4. Preserve sitemap generation

**Rule**: `sitemap.xml` must keep listing every indexable HTML page, plus
the calendar/week/month PDF URLs, plus one `<image:image>` entry per page
that has an OG or Discover image.

**Lives in**: `sitemapEntries()` in `src/data/seo.js` (the page list) and
the `urlset`/`pdfUrlset`/`weekPdfUrlset`/`monthPdfUrlset` template
assembly plus the `<image:image>` block in `prerender.js`'s sitemap
section. Indexability is governed by `isIndexable()` against the
`currentYear-2`..`currentYear+4` window — pages outside it are correctly
*excluded* from the sitemap (this is intentional, not a bug — don't "fix"
it by including them).

**Never**: add a new page family to `AppRoutes.jsx`/`prerender.js`
without adding it to `sitemapEntries()` — an unlisted-but-prerendered page
is reachable but undiscoverable, the worst of both outcomes.

### 5. Preserve PDF discoverability

**Rule**: every calendar/week/month PDF must remain linked from (a) its
HTML page as a visible download link, (b) an `associatedMedia`/
`MediaObject` + `potentialAction`/`DownloadAction` schema pair, (c) a
`<link rel="alternate">` pointer, and (d) the sitemap.

**Lives in**: `calendarPdfPath()`/`weekPdfPath()`/`monthPdfPath()` in
`seo.js` (the single-source-of-truth path builders — every consumer reads
these, never reconstructs the path by hand), `weekPdfExtra()`/
`monthPdfExtra()`/the inline calendar `associatedMedia` block in
`prerender.js`, `pdfAlternateLink(url)`, and the sitemap PDF URLsets named
above.

**Never**: add a new PDF-generating page type using a hand-built path
string instead of a new `*PdfPath()` function in `seo.js` — this is the
exact pattern that has kept the download link, the schema, and the
sitemap entry from drifting apart three times already (calendar, week,
month).

### 6. Preserve image sitemap entries

**Rule**: the sitemap's `<image:image>` extension must keep including
*both* the OG image and the Discover image for every page that has them
— these are two independent, deliberately parallel systems (see #7), and
Google's sitemap image extension explicitly allows more than one
`<image:image>` per `<url>`.

**Lives in**: `ogImageUrlFor()` and `discoverImageUrlFor()` in
`prerender.js`, both consumed by the same sitemap-building loop.

**Never**: merge the two image systems, or let a sitemap "cleanup" drop
the second `<image:image>` entry thinking it's a duplicate.

### 7. Preserve ImageObject schema

**Rule**: two independent `ImageObject` families must both keep working:
OG images (`ogImageExtra()` — embeds into the page's own `image`
property) and Discover images (`discoverImageNodes()` — a **standalone**
graph node, deliberately not merged into `ogImageExtra`'s `image` key, so
neither system can collide with or overwrite the other).

**Lives in**: `ogImageExtra(url)` and `discoverImageNodes(url)` in
`prerender.js`. Discover images specifically require ≥1200×675px, 16:9,
>300,000 total pixels, and should avoid text-heavy/logo-only compositions
(verified against Google's own Discover documentation this session — not
a file-size threshold, a pixel-count one).

**Never**: modify `ogImageExtra()`'s four core functions
(`ogImageUrlFor`/`ogImageAltFor`/`ogImageExtra`/`ogCard`) to accommodate a
Discover-system change, or vice versa — if a change to one seems to
require touching the other, that's a sign that the two-family boundary is
being violated; find the standalone-node alternative instead (see how
`discoverImageNodes()` solved this).

### 8. Preserve Dataset schema

**Rule**: every `/data/` feed family must have a corresponding
`schema.org/Dataset` node, discoverable both embedded (homepage,
`/avoin-data`) and standalone (`/data/dataset.json`).

**Lives in**: `datasetSchema()` + `datasetNodes()` in `prerender.js`
(currently 8 families: week, month, year, quarter, holidays, holiday
[per-slug detail], flag-days, workingdays, monthly-workingdays — the
list is intentionally 1:1 with `DATA_FEED_FAMILIES` in
`src/data/openDataContent.js`, which also drives the `/avoin-data` table
and the `llms-full.txt`/`ai-manifest.txt` dataset sections).

**Never**: add a new `/data/*.json` feed without (a) a matching
`datasetNodes()` entry, (b) a matching `DATA_FEED_FAMILIES` entry, and
(c) an entry in `/data/index.json`'s `datasets` array — three
registrations, not one; skipping any of them is how a feed becomes
real-but-undiscoverable.

### 9. Preserve FAQ schema

**Rule**: every page with a visible FAQ `<details>` list must have a
matching `FAQPage` JSON-LD node with **identical** questions and answers
— never a subset, superset, or paraphrase.

**Lives in**: the `*Faqs()` functions in `seo.js`/page-specific data
modules (`monthFaqs`, `yearFaqs`, `quarterFaqs`, `workingDaysFaqs`,
`monthlyWorkingDayFaqs`, `holidayFaqs`, `flagDayFaqs`, `openDataFaqs`,
`faqs`/`faqCategories` for `/ukk`, etc.) — each one is the **single
source** consumed by both the visible JSX and the corresponding
`*Nodes()` function in `prerender.js`. This "can't drift" pattern is the
single most-repeated discipline in this codebase.

**Never**: hand-write FAQ content directly inside a `*Nodes()` function in
`prerender.js` without a matching visible `<details>` list sourced from
the same function — and never hand-write it in JSX without the schema
counterpart.

### 10. Preserve WebPage schema

**Rule**: every indexable page must have exactly one `#webpage`-`@id`
node (type `WebPage` or a more specific subtype), carrying `isPartOf`
(website + relevant parent entity), `publisher`, `breadcrumb` (where
applicable), and a description.

**Lives in**: `pageNode(url, type, extra)` in `prerender.js` — the one
function that mints this node, called either directly by a page-family's
own `*Nodes()` function or, for page types with no bespoke node builder,
by the generic fallback at the end of the per-URL dispatch loop (guarded
by `!nodes.some((node) => node["@id"] === pageId)` so it only fires once).

**Never**: construct a `#webpage` node by hand instead of calling
`pageNode()` — every property it sets (especially `isPartOf`'s website
edge) needs to stay consistent across every single page on the site, and
a hand-built duplicate is exactly how that consistency breaks.

### 11. Preserve CollectionPage schema

**Rule**: page types that are fundamentally "a collection of other pages"
(year, month, quarter, calendar-year, flag-day hub, monthly-working-days)
must keep using `CollectionPage` (via `pageNode(url, "CollectionPage",
...)`), not plain `WebPage` — this is the schema signal that tells a
crawler/AI system the page's `mainEntity` is itself a structured list.

**Lives in**: `quarterNodes()`, `calendarPageNodes()`, `flagDayNodes()`,
`monthlyWorkingDaysNodes()`, `weekCollectionNodes()` (covers both
`/vuosi-{year}` and `/kuukausi-{month}-{year}`).

**Never**: downgrade one of these to plain `WebPage` for simplicity, or
add a new "hub" page type as `WebPage` instead of `CollectionPage`.

### 12. Preserve hreflang strategy

**Rule** (documenting exactly what exists — do not silently expand or
shrink this): `hreflang` alternates are declared **only** between `/` and
`/en`, via `languageAlternateLinks(url)` in `prerender.js`:
`hreflang="fi"` → `/`, `hreflang="en"` → `/en`, `hreflang="x-default"` →
`/`. No other page on the site declares `hreflang` — every
`/viikko-*`/`/kuukausi-*`/etc. page is implicitly Finnish-only
(`inLanguage: "fi-FI"` in its schema) with no English counterpart, which
is accurate: they don't have one.

**English-route constraint**: `/en` is the only English page and route. Do
not add `/en/*` subpages, English equivalents of Finnish page families, or
any additional English URLs to `AppRoutes.jsx`, `sitemapEntries()`, the
prerender route list, hreflang output, or internal navigation. Improvements
to `/en` must remain edits to that single existing page. The shared navbar
and footer must render their English variants on `/en`; links that lead into
the Finnish-only site must be visibly labeled as Finnish and use
`hrefLang="fi"`. The Finnish chrome must remain unchanged on every other
route.

**Never**: add `hreflang` tags to a page that has no real translated
counterpart (this is how hreflang errors happen — a tag pointing at a
URL that doesn't serve equivalent content in that language). Do not add a
new translated page or expand `languageAlternateLinks()` beyond `/` and
`/en`. Do not revive the retired `/sv/*` pattern — its routes were removed
by design; `vercel.json` still 301s them for link equity, which is sufficient
on its own and must stay in place.

### 13. Preserve AI optimization files

**Rule**: `public/ai.txt`, `public/llms.txt`, and the generated
`llms-full.txt`/`llms-api.txt`/`llms-data.txt`/`llms-glossary.txt`/
`ai-manifest.txt`/`data/knowledge-graph.json` must all keep pointing at
each other and at every resource family they currently reference, and
must stay updated whenever a new resource family is added (dataset, PDF
type, page type).

**Lives in**: `public/ai.txt` and `public/llms.txt` (static, hand-edited)
plus the generators in `prerender.js` for the six dynamic files. See also
#14 and #15.

**Never**: add a new discoverable resource (a dataset, an API alias, a
PDF family, a page type) without a corresponding line in **every relevant
file of the eight** (`ai.txt`, `llms.txt`, `llms-full.txt`, `llms-api.txt`,
`llms-data.txt`, `llms-glossary.txt`, `ai-manifest.txt`,
`knowledge-graph.json`) — this repo's established habit (see how the
`/api/holiday/` alias was added everywhere at once) is the bar to match,
not the exception. **Never grow this set casually** either — it grew from
4 files to 8 in one deliberate restructuring (splitting `llms-full.txt`'s
content into topic-focused companions, not adding files on top of it),
specifically to avoid the drift risk an unchecked file count creates (see
the `/en` stale-content bug this constitution's own principle #4 exists
to prevent — hand-typed content escaping a generator, not too few files).
Any future addition should be sized the same way: does this genuinely not
fit an existing file, or is it scope creep with a new filename.

### 14. Preserve `llms-full.txt` and its 3 companion files

**Rule**: `/llms-full.txt` is a short **index** (what the site is, page
types/URL patterns, canonical examples, pointers to every other
machine-readable file, attribution, and the full Finnish FAQ dump) —
**not** the comprehensive reference by itself. Three companion files
carry the detail that used to live inside it, and must stay in sync with
what they document:

- `/llms-api.txt` — API endpoints (`/api/` aliases), PDF resources,
  OG/Discover images: everything meant to be *fetched*.
- `/llms-data.txt` — the (currently 8) `/data/` JSON dataset families:
  what's *inside* them.
- `/llms-glossary.txt` — ISO 8601 rules, the full Finnish holiday/flag-day
  definitions, working-day/quarter definitions, and the entity
  relationship model: what the *terms mean*.

All four must keep being generated fresh on every build from real,
computed data (current week/month/quarter/year, real holiday/flag-day
lists, real dataset family list), never from hardcoded example values
that can go stale.

**Lives in**: the `llmsFull`/`llmsApi`/`llmsData`/`llmsGlossary`
template-literal generators in `prerender.js` (search `Split into 4
files`), which share their computed inputs (`llHolidayLines`,
`llFlagDayLines`, `llDatasetLines`, `HOLIDAY_DEFINITIONS`,
`DATA_FEED_FAMILIES`, `faqCategories`/`faqs`, the `seo.js` path builders)
so the same fact is never independently recomputed — and can't drift —
across the four files.

**Never**: hand-edit generated content directly into any of the four
files (regenerated on every build — a manual edit is silently lost); put
API/dataset/definitional detail back into `llms-full.txt` "for
convenience" (that's exactly the un-split state this section replaced);
or let a fact (e.g. the holiday list, the API alias patterns) be
hand-typed into more than one of the four files instead of computed once
and shared.

*(Note on naming: files are `llms-*.txt`, plural "llms" — matching
`llms.txt` and the llmstxt.org convention. If a future request says
"llm-full.txt"/"llm-api.txt" etc. singular, that almost always means
these same files.)*

### 15. Preserve `ai-manifest.txt`

**Rule**: the priority-ordered "fetch these first" manifest at
`/ai-manifest.txt` must keep leading with the *current* (build-time-fresh)
week/month/quarter/year, using the ISO week-year (not calendar year) for
the week entry, followed in order by holiday/working-day/flag-day hubs,
dataset endpoints, API endpoints — exactly the 10-item priority order it
was designed around.

**Lives in**: the `aiManifest` generator in `prerender.js` (search
`Generate ai-manifest.txt`), computing `amWeek`/`amWeekYear`/`amMonth`/
`amCalYear`/`amQuarter` fresh via `isoWeek(now)`/`isoYear(now)`/
`quarterOf(now)` on every build (including the nightly rebuild cron —
this is *why* that cron exists, per `CLAUDE.md`).

**Never**: hardcode a specific week/year into this file, or let its
dataset/API sections drift from `DATA_FEED_FAMILIES` (they're generated
from it, not maintained separately — see #13).

---

## Every future feature must satisfy all four of these

1. **Improve SEO** — concretely: add or strengthen a `routeMeta`
   entry, a canonical URL, a `dateModified`, or reduce thin/duplicate
   content. "No effect" is acceptable only for pure infrastructure
   changes (build tooling, refactors); a change touching a page's content
   or URL should have a stated, specific SEO rationale.
2. **Improve crawlability** — concretely: the new content must be
   prerendered to static HTML (never client-only rendering for anything
   that should be indexed), added to `sitemapEntries()`, and reachable
   within 3 clicks of the homepage or another already-indexed page.
3. **Improve AI discoverability** — concretely: covered by real
   structured data (see invariants 2, 8, 9, 10, 11), and — if it's a new
   *kind* of resource (dataset, page family, API) — referenced from the
   AI-facing files (invariant 13).
4. **Preserve existing rankings** — concretely: any URL change ships
   with a 301 in `vercel.json`; any content narrowing (fewer words, fewer
   facts, removed FAQ items) on an already-indexed page requires an
   explicit reason, not just refactor convenience; `noindex`/sitemap
   removal only ever follows the existing `isIndexable()` year-window
   logic, never an ad hoc decision on a single page.

## Pre-merge checklist

Before considering an SEO/routing/schema-touching task done:

- [ ] `node --check prerender.js` (or the relevant file) passes.
- [ ] The specific new/changed logic was verified against **real
      computed output**, not just "the code looks right" — this repo's
      standing discipline is an isolated Node harness reusing the real
      functions, or a full `npm run build` + inspecting real
      `dist/` output.
- [ ] Every new resource type is registered everywhere invariant #13
      requires (all four AI files, if applicable).
- [ ] `vercel.json` is still valid JSON (`node -e
      "JSON.parse(require('fs').readFileSync('vercel.json'))"`).
- [ ] No existing URL now 404s or content-shifts without a 301.
- [ ] No fact, count, date, or example was invented — every number in
      this codebase's SEO/AI-facing content is computed or independently
      verified (see `HOLIDAY_LEGAL_BASIS`'s own comment for the model:
      state exactly what's confirmed, state nothing for what isn't).

## Amendments

This document describes the system as it actually exists, verified
against the code at time of writing — it is not aspirational. When the
codebase changes in a way that makes an invariant's "Lives in" reference
stale (a function renamed, a file moved), update this document in the
same change. When a task genuinely requires *relaxing* an invariant
(not just extending it to a new page type, which every invariant above
already anticipates), that is a product decision, not an engineering
one — surface it explicitly and get it confirmed before proceeding,
rather than treating this document as silently overridable.
