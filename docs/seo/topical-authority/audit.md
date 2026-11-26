# Phase 1: website and SEO audit

Scope: a read-only audit of Viikkonro.fi against the 100-keyword gap report
`keywordgap_viikkonro.fi_vs_https%3A%2F%2Fviikkonumero.fi%2F_fi_page_2026-11-23.csv`.
No production code, data module, route, metadata, schema, or build script was
changed to produce this document.

| Field | Value |
| --- | --- |
| Audit date | 2026-11-23 |
| Branch audited | `seo/phase4-pruning-internal-links` |
| Commit audited | `5076b6c` ("add pdf and updated sitemap is reaady") |
| `main` at audit time | `6a3f183` (#127) |
| Competitor | `viikkonumero.fi` |
| Keyword source of truth | the CSV above, 100 rows, read from `~/Downloads` |

## 0. Two things to settle before Phase 2

### 0.1 Another session is working in this checkout

During this audit the working tree moved underneath it. Observed, in order:
the checkout switched from `main` to `seo/phase4-pruning-internal-links`,
`docs/SEO_CONSTITUTION.md` grew from 561 to 608 lines, `docs/noindex.md`
appeared, `scripts/check-crawl.js` showed as modified and then clean again, a
`dist-probe/` directory appeared and vanished, and a concurrent `vite build`
emptied `dist/` twice while this audit's own build and tests were reading it.

Consequence for this document: everything in sections 1 to 6 that comes from
**source code** is pinned to `5076b6c` and is reliable. The generated-artifact
and crawl parts of the release gate could not be completed, because the
concurrent build deleted the files the test cases read (section 8). That is an
environment race, not a defect in the branch.

**Phase 2 should not start until this checkout has a single writer.** Two
agents editing `src/data/seo.js`, `prerender.js`, and `vercel.json` at once
will produce exactly the silent drift the SEO constitution exists to prevent.

### 0.2 The audited branch is unmerged in-flight work

`seo/phase4-pruning-internal-links` is 4 commits ahead of `main` with 68 files
changed (+2,880 / -435). It is not a cosmetic branch: it changes the indexing
policy, the sitemap shape, and the robots policy of the whole site. Sections 2
and 4 describe the branch state. Where `main` differs materially, both are
given.

The three biggest in-flight changes:

| Change | `main` (`6a3f183`) | branch (`5076b6c`) |
| --- | --- | --- |
| Dated hub indexing window | `currentYear-2` to `currentYear+4` | `currentYear-1` to `currentYear+2` |
| `noindex` directives | meta `noindex, follow` on out-of-window pages, `X-Robots-Tag: noindex` on `/pdf/`, `/ics/`, `/pohjat/`, `/data/*/index.json` | none anywhere except `/tiimin-lomat/suunnittelu` and the JSON API responses |
| Sitemap | single `sitemap.xml`, PDFs excluded | sitemap index with 6 children, 1,043 PDFs submitted in `sitemap-pdfs.xml` |

Both the narrowing and the `noindex` removal are recorded as owner-approved
(`docs/noindex.md`, and the 2026-11-21 and 2026-11-23 amendments in
`docs/SEO_CONSTITUTION.md`). This audit treats them as decided, and only flags
the one interaction between them that looks unintended (finding 4.1).

## 1. Current website architecture

### 1.1 Stack and rendering

React 19 and React Router 7 on Vite 8. The site is a hydrated SPA whose
indexable routes are prerendered to static HTML at build time. There is no
runtime SSR server.

- `src/main.jsx` mounts `AppRoutes` in `BrowserRouter` for the browser.
- `src/entry-server.jsx` mounts the same tree in `StaticRouter` for the
  build-time render.
- `prerender.js` (7,125 lines) drives that render and writes every artifact.
- `vite.config.js` splits React, React Router, and vendor code into stable
  chunks. Public pages are dynamically imported through
  `src/routing/clientPage.jsx`; the build and test alias swaps in
  `serverPage.js`, which imports pages eagerly so `renderToString` always
  produces complete content.

Output is flat files (`dist/ukk.html`, not `dist/ukk/index.html`), matching
`cleanUrls: true` and `trailingSlash: false` in `vercel.json`. There is
deliberately no SPA fallback for unknown public paths, so an unsupported path
serves the generated 404 document.

Hosting: Vercel serves the static output from `dist`, Cloudflare fronts the
production domain. `.github/workflows/vercel-rebuild.yml` triggers a daily
rebuild so current-week metadata stays fresh.

### 1.2 Routing

`src/AppRoutes.jsx` declares static routes explicitly and funnels every
single-segment Finnish keyword slug through one `/:slug` route whose
`dynamicElement()` regex dispatcher is the single source of truth for which
slug shapes are valid. React Router cannot parse two params in one segment, so
`/viikko-42-2026` style URLs require this pattern.

Two-segment families have their own routes: `/pyhat-{year}/{slug}`,
`/nimipaiva/{name}`, `/nimipaivat/{mm-dd}`, `/kalenteripohjat/{slug}`,
`/data/{family}`.

### 1.3 Metadata, schema, and sitemap

`src/data/seo.js` (1,845 lines) is the metadata authority:

- `routeMeta` for static pages, plus per-family builders (`weekMeta`,
  `monthMeta`, `yearMeta`, `quarterMeta`, `calendarMeta`, `printMeta`,
  `holidaysMeta`, `workingDaysMeta`, and so on).
- `metaFor(url)` resolves any route to its title, description, and robots.
- `canonicalFor(path)` produces the self-referencing canonical.
- `isIndexable(path)` is the single indexing-window gate.
- `sitemapEntries(year)` is the page list.
- `breadcrumbTrail(url)` powers both the visible breadcrumb and the
  `BreadcrumbList` JSON-LD.
- `calendarPdfPath` / `weekPdfPath` / `monthPdfPath` / `templatePdfPath` are
  the single-source path builders every PDF consumer reads.

`prerender.js` assembles per-route JSON-LD through family node builders
(`weekFaqNodes`, `weekCollectionNodes`, `quarterNodes`, `calendarPageNodes`,
`namedHolidayNodes`, `flagDayNodes`, `monthlyWorkingDaysNodes`,
`nameDayPageNodes`, `schoolHolidayNodes`, `datasetNodes`, and a generic
`pageNode()` fallback), and computes the entity hierarchy once in
`entityParentExtra(url)`.

ISO week and date math lives in `src/components/dateUtils.js`. The publishing
horizon is `PRERENDER_MIN_YEAR = 2020` to `PRERENDER_MAX_YEAR = currentYear + 9`
(2035 today).

### 1.4 Generated output, verified from this session's own build

A complete `npm run build` at `5076b6c` produced:

| Artifact | Count |
| --- | --- |
| Prerendered routes | 2,003 |
| Sitemap-listed HTML URLs | 1,390 |
| Submitted PDFs (`sitemap-pdfs.xml`) | 1,043 |
| Submitted template exports | 54 |
| JSON feed files under `dist/data/` | 1,744 |
| OG images | 1,605 |
| Discover images | 1,283 |
| ICS feeds | 3 (2025 to 2028) |
| AI-facing text files | `llms-full.txt` (87 Q&A), `llms-api.txt`, `llms-data.txt`, `llms-glossary.txt`, `ai-manifest.txt` |

### 1.5 Adjacent systems, out of scope for this work

`src/platform/` holds the calendar and planning foundation (exports, planner
registry, product catalogue, themes). The authenticated Team Leave Planner is a
separate Vite entry at `tiimin-lomat/suunnittelu.html`, excluded from the
sitemap and the only page keeping a robots directive. The Business Calendar API
is a server-only Vercel function. The standalone widget bundle is built by
`scripts/build-business-widget.mjs`. None of these carry keyword-gap work.

## 2. Existing indexed URL patterns

Computed directly from `sitemapEntries()` plus `isIndexable()` at `5076b6c`.
Total entries 2,002; sitemap-eligible 1,390; prerendered but excluded 612.

### 2.1 Submitted (1,390)

| Pattern | Count | Indexing window |
| --- | --- | --- |
| `/viikko-{week}-{year}` | 835 | full horizon 2020 to 2035 |
| `/pyhat-{year}/{slug}` | 240 | full horizon, 15 holidays per year |
| static pages | 65 | always |
| `/kuukausi-{month}-{year}` | 48 | 2025 to 2028 |
| `/tyopaivat-{kuukausi}-{year}` | 48 | 2025 to 2028 |
| `/{observance}-{year}` | 20 | 2025 to 2028 |
| `/{event}-{year}` | 19 | 2025 to 2028 |
| `/auringonlasku[-{city}]` | 16 | always |
| `/q{n}-{year}` | 16 | 2025 to 2028 |
| `/palkkapaivat-`, `/kelan-maksupaivat-`, `/elakkeen-maksupaivat-{year}` | 12 | 2025 to 2028 |
| `/kalenteri-{year}[-alkuvuosi|-loppuvuosi]` | 12 | 2025 to 2028 |
| `/{n}-paivaa-eteenpain` | 8 | always |
| `/kalenteripohjat/{slug}` | 6 | always |
| `/kuinka-monta-paivaa-{target}` | 5 | always |
| `/vuosi-`, `/pyhapaivat-`, `/liputuspaivat-`, `/tyopaivat-`, `/tulosta-`, `/kuun-vaiheet-`, `/kesaaika-`, `/tulostettava-kalenteri-{year}` | 4 each | 2025 to 2028 |
| `/koululomat-{year}` | 3 | CONFIRMED confidence tier only |
| `/nimipaiva/{nimi}` | 3 | seeded names only |
| `/nimipaivat/{mm-dd}` | 2 | seeded dates only |

### 2.2 Prerendered, indexable, not submitted (612)

| Pattern | Count |
| --- | --- |
| `/kuukausi-{month}-{year}` | 144 |
| `/tyopaivat-{kuukausi}-{year}` | 144 |
| `/{observance}-{year}` | 60 |
| `/q{n}-{year}` | 48 |
| `/{event}-{year}` | 48 |
| maksupaiva families | 36 |
| `/kalenteri-{year}[-half]` | 36 |
| 8 further year families at 12 each | 96 |

### 2.3 Non-HTML surfaces

`/pdf/*` (1,043 files, now submitted), `/ics/*.ics` (3 feeds),
`/pohjat/*` (54 template exports, submitted), `/data/**` (1,744 JSON, CSV, and
XML feeds plus `dataset.json` and `knowledge-graph.json`), `/og/*` and
`/discover/*` images, `/widget/viikko` and `/widget/calendar/v1`.

### 2.4 Redirects

34 rules in `vercel.json`, all `statusCode: 301`. They cover the retired
English and Swedish paths, the pre-slug `/week/:week/:year` family, the
`/api/*` to `/data/*` feed aliases, the `/kaupunki/:slug` to
`/auringonlasku-:slug` move, and a family-wide floor that sends every dated URL
with a year at or below 2019 to the same family's 2020 page.
`src/data/redirects.test.js` asserts no `source` shadows a prerendered path and
every destination exists.

## 3. Existing content clusters

The site already has a deliberate cluster structure. Mapping it against the
brief's eight clusters:

| Brief cluster | Existing coverage | Verdict |
| --- | --- | --- |
| A. Week numbers and week-date queries | `/viikko-{w}-{y}` (835 pages, full horizon), `/vuosi-{y}`, `/kuukausi-{m}-{y}`, `/q{n}-{y}`, `/mika-on-viikkonumero`, `/parillinen-pariton-viikko`, `/viikko-alkaa-maanantaista`, `/miksi-vuodessa-on-53-viikkoa`, `/suomi-vs-usa-viikkonumerot` | Mature. Nothing structural missing. |
| B. Annual calendars | `/kalenteri-{y}`, `/kalenteri-{y}-alkuvuosi`, `/kalenteri-{y}-loppuvuosi`, `/tulostettava-kalenteri-{y}`, `/tulosta-{y}`, `/vuosi-{y}`, plus `/kaikki-vuodet` (new on this branch) | Exists, but indexed only for 2025 to 2028. |
| C. Historical calendars and year-based queries | none below 2020 or above 2035 | Genuine structural gap. Needs a product decision. |
| D. Specific dates and month queries | tools only (`/paivamaara-viikoksi`, `/viikonpaiva`, `/paivamaaralaskuri`, `/paivien-erotus`) plus `/nimipaivat/{mm-dd}` at 2 of 366 dates | Genuine gap, with a licensing blocker. |
| E. Finnish holidays and observances | `/pyhapaivat-{y}`, `/pyhat-{y}/{slug}` (15 holidays, full horizon), `/liputuspaivat-{y}`, 5 observance families, 5 event families, `/koululomat-{y}` | Mature. |
| F. Historical events and birth-year queries | none, deliberately | Correctly out of scope. |
| G. Week calculations | `/laskurit` hub, `/paivamaara-viikoksi`, `/viikko-paivamaaraksi`, `/tyopaivalaskuri`, `/ikalaskuri`, `/tuntilaskuri`, and 8 more | Mature. |
| H. Ambiguous numeric queries | none | Correctly out of scope. |

### 3.1 Internal linking, as it already exists

This is stronger than the brief assumes. A single `/viikko-{w}-{y}` page
already links: previous and next week, its month, its quarter, its year hub,
`/kalenteri-{y}`, `/pyhapaivat-{y}`, `/liputuspaivat-{y}`, `/tyopaivat-{y}`,
`/tulosta-{y}`, `/koululomat-{y}`, `/kuun-vaiheet-{y}`,
`/auringonlasku-helsinki`, each named holiday and flag day falling in that
week, each day's `/nimipaivat/{mm-dd}` page, the week-1 page of the following
year where the week straddles a year boundary, `/mika-on-viikkonumero`,
`/miksi-vuodessa-on-53-viikkoa`, `/suomi-vs-usa-viikkonumerot`,
`/parillinen-pariton-viikko`, `/paivamaara-viikoksi`, `/viikko-paivamaaraksi`,
`/projektiaikataulu`, and `/sprinttisuunnittelija`.

Site-wide, `Navbar`, `Footer`, `QuickLinks`, `ToolDirectory`, `TopicGuide`,
`RelatedTools`, `UpcomingEvents`, and `YearsWeek` supply the hub layer, and
`src/data/pageTopics.js` maps registered pages to 18 topic guides that emit
both visible Finnish guidance and `about` / `relatedLink` schema.

**Phase 6 of the brief is therefore largely already built.** It should be
rewritten as a verification and gap-closing pass, not a construction pass.

## 4. Technical SEO problems

Ranked by expected impact.

### 4.1 612 indexable pages are deliberately kept out of the sitemap

Severity: high. This is the one finding that looks like an unintended
interaction rather than a decision.

The 2026-11-21 pruning narrowed the dated-hub window to
`currentYear-1`..`currentYear+2` because archive and far-future years "earned
impressions at position 8-30 and no clicks, so the wide window diluted the
strong years". Two days later the 2026-11-23 decision removed `noindex` from
the whole site. The comment in `src/data/seo.js` states the resulting policy
explicitly: out-of-window years "stay prerendered, live and crawlable with
index, follow; they are excluded from the sitemap".

A sitemap exclusion is a discovery hint, not an indexing directive. Those 612
pages are internally linked (the new `/kaikki-vuodet` hub exists specifically
to keep them crawlable), serve `index, follow`, and carry full schema. Google
can and will index them. The dilution the pruning was meant to stop is
therefore still available, and the site now has no mechanism expressing the
intent at all.

This is a policy question, not a bug to fix silently. `docs/noindex.md` is the
only gate for reintroducing a directive, and `CLAUDE.md`'s universal rule
forbids adding one without an owner row. The decision belongs to the owner:
either accept that the 612 pages are ordinary indexable pages and give them
distinct intent, or record a registry row.

### 4.2 Name-day cluster is blocked by licensing, at 3 of 366 dates

Severity: high for coverage, zero fault. `src/data/nameDays.js` documents it:
the Finnish name-day calendar is compiled by the University of Helsinki
Almanac Office, which holds a statutory exclusive right, and licensing was
never confirmed. Only verified entries are seeded; this session's build logged
"363/366 dates lack licensed data".

Effect: `/nimipaivat/{mm-dd}` publishes 2 pages instead of 366, and
`/nimipaiva/{nimi}` publishes 3 instead of several hundred. Those 5 pages are
also the thinnest indexable pages on the site (139 to 161 words of main
content). The code is ready: drop a licensed calendar into
`src/data/nimipaivat.json` in the same `MM-DD` shape and the rest lights up
with no code change.

This blocker sits directly on top of brief Cluster D. See section 5.4.

### 4.3 En dash in shipped titles and 139 source content lines

Severity: medium. `CLAUDE.md`'s content rules forbid the en dash in page copy,
titles, descriptions, FAQs, schema, AI-facing text, and comments.

Verified at `5076b6c`:

- `monthMeta()` returns `Toukokuun viikot 2026 [U+2013] viikkonumerot | Viikko Nro`,
  where `[U+2013]` is a literal en dash character.
  That en dash ships in the `<title>` of all 192 `/kuukausi-{m}-{y}` pages, 48
  of them sitemap-eligible.
- 374 en dash characters in `src/`, of which 139 sit inside quoted or
  template-literal strings in non-test files. Heaviest: `src/data/faqs.js`
  (15), `src/data/seo.js` (14), `src/data/datasetPages.js` (14),
  `src/data/vacationSchoolContent.js` (12),
  `src/data/businessProgressContent.js` (10),
  `src/components/dateUtils.js` (10).

Most are date ranges of the form `maanantai[U+2013]sunnuntai`,
`28.[U+2013]31. joulukuuta`, and `${fmtShortFi(mo)}[U+2013]${fmtShortFi(su)}`. The
rule says to remove an existing en
dash from any content line you edit, so this is pre-existing debt rather than a
new violation, but the `monthMeta()` title is a live SERP string and should be
fixed in Phase 4 regardless.

### 4.4 Schema typing is inconsistent across sibling collection pages

Severity: low. Measured over the full indexable set of the build present at
session start:

- `/pyhapaivat-{year}` emits `WebPage` plus `ItemList`, while its sibling
  `/liputuspaivat-{year}` emits `CollectionPage`. Both are "a list of days in
  this year".
- `/tyopaivat-{year}` emits `WebPage`, while `/tyopaivat-{kuukausi}-{year}`
  emits `CollectionPage`.
- `/kalenteripohjat/{slug}` emits no `FAQPage`, unlike nearly every other
  family.

Constitution invariant 11 names the families that must use `CollectionPage` and
does not list `/pyhapaivat-` or `/tyopaivat-{year}`, so this is consistency
drift rather than a violation. Worth aligning while touching those pages.

### 4.5 Thin pages at the edges of the holiday horizon

Severity: low. 59 indexable pages fall under 250 words of main content. After
the 5 name-day pages and the `/liputuspaivat` redirect document, the rest are
`/pyhat-{year}/{slug}` pages for the fixed-date holidays in the horizon's
outermost years (`/pyhat-2020/joulupaiva`, `/pyhat-2035/loppiainen`, and
similar) at 245 to 250 words. Median main-content length across the indexable
set is 553 words, so this is an edge effect of the full-horizon holiday
expansion, not a site-wide problem. These pages have no year-specific facts to
state beyond the weekday, which is the honest reason they are short.

### 4.6 Local build is fragile against a non-empty `dist/`

Severity: low, local only. Observed twice: `vite build`'s `prepareOutDir` step
fails with `ENOTEMPTY ... dist/discover` when a previous build left `dist/`
partly written. `rm -rf dist dist-server` clears it. Worth knowing before
Phase 4, because the failure message points at an image directory and reads
like a prerender bug.

### 4.7 Things that are correct and should not be "improved"

Stated explicitly so a later phase does not regress them:

- `/liputuspaivat` is a deliberate meta-refresh redirect document: 0 words, no
  JSON-LD, no own `#webpage` node, canonical pointing at the current year.
  Documented in `AppRoutes.jsx` and `docs/growth-seo-audit.md`.
- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ChatGPT-User,
  PerplexityBot, Google-Extended, ClaudeBot, Claude-Web, Applebot-Extended,
  Bingbot, and the three AdSense crawlers, then `Allow: /` for everything else.
- No hreflang anywhere, by the 2026-10-15 English removal. `/en` 301s to `/`.
  Note that `docs/predeployment-test-cases.md` row PD-07 still describes an
  English surface with reciprocal hreflang; that row is stale against the
  constitution's invariant 12 and should be corrected or removed.
- Metadata integrity, measured across the 1,543 indexable documents of the
  build present at session start: zero duplicate titles, zero duplicate
  descriptions, zero duplicate H1s, exactly one H1 per page, zero missing
  canonicals, zero non-self canonicals, zero missing descriptions, zero
  invalid JSON-LD blocks, and `BreadcrumbList` on every page but one. That is
  an unusually clean baseline and the reason this audit finds so few
  conventional technical issues.

## 5. Keyword coverage gaps

### 5.1 What the report actually contains

| Measure | Value |
| --- | --- |
| Keywords | 100 |
| Search volume | 30 for every single keyword |
| Keyword difficulty | 0 to 53; 77 keywords at 20 or below; 8 with no data (-1) |
| Intent | 87 INFORMATIONAL, 7 INFORMATIONAL;TRANSACTIONAL, 3 INFORMATIONAL;NAVIGATIONAL, 2 COMMERCIAL, 1 NAVIGATIONAL |
| Viikkonro position | 0 on all 100 (not ranking) |
| Competitor position | top 3 on 17, top 10 on 46, 11 to 20 on 17, 21 or worse on 37 |
| Theoretical ceiling | 100 x 30 = 3,000 searches per month, in aggregate |

The grouped workbook `viikkonro_keyword_groups.xlsx` referenced in the brief is
not present in this repository or in `~/Downloads`. This audit therefore works
from the CSV only, which the brief names as the source of truth anyway. If the
workbook matters for Phase 2, it needs to be supplied.

### 5.2 Where the competitor actually ranks

Classifying all 100 competitor URLs by shape:

| Competitor URL shape | Keywords |
| --- | --- |
| `/kalenteri/{n}.pdf` | 57 |
| `/{year}/{week}` | 26 |
| `/kalenteri/{n}` (HTML) | 6 |
| `/{year}/{holiday}` | 4 |
| homepage | 4 |
| `/viikkoa` | 2 |
| `/viikkoa/{year}` | 1 |

**57 of 100 gap keywords are won by a PDF.** The `{n}` in those PDF paths
ranges from 1010 to 5219, and only 5 of the 57 fall inside 2020 to 2035. Two
fetches confirmed the pattern is real and not a report artifact:
`viikkonumero.fi/kalenteri/1442.pdf` and `/kalenteri/2959.pdf` both return
HTTP 200, `application/pdf`, about 205 KB each. The competitor generates a
year-calendar PDF for essentially any integer.

That explains the matches, and it also explains why most of them are worthless:

| Keyword | Competitor URL | Position |
| --- | --- | --- |
| `11 vuotta` | `/kalenteri/3371.pdf` | 1 |
| `15 joulukuuta` | `/kalenteri/1465.pdf` | 20 |
| `15 toukokuuta` | `/kalenteri/1465.pdf` | 23 |
| `19 syyskuuta` | `/kalenteri/5219.pdf` | 11 |
| `12e` | `/kalenteri/1212.pdf` | 18 |
| `058` | `/kalenteri/4158.pdf` | 5 |

A year-3371 calendar is not an answer to "11 vuotta". These are accidental
digit-substring matches against a mass-generated archive. Replicating them
would mean generating thousands of near-identical dated documents with no
unique value, which is the doorway-page pattern the brief's own section 4
forbids and which `docs/SEO_CONSTITUTION.md` and `docs/long-tail-pages.md`
both already rejected for this site.

### 5.3 Cluster-by-cluster gap verdict

Re-classified from the actual keyword strings, not the brief's groupings:

| Shape | Keywords | Existing Viikkonro target | Gap verdict |
| --- | --- | --- | --- |
| Bare numeric, competitor ranks `/{year}/{week}` | 26 | `/viikko-{w}-{y}` already exists for every year and week in 2020 to 2035 | **Not a content gap.** A relevance and formatting gap. See 5.5. |
| Bare numeric, competitor ranks a year-calendar PDF | 36 | mostly none; the implied years are outside 2020 to 2035 | **Do not pursue as written.** A small subset is a real year-coverage question (5.6). |
| Bare numeric, competitor ranks `/viikkoa`, `/kalenteri/{n}`, or the homepage | 8 | `/`, `/vuosi-{y}`, `/kuinka-monta-viikkoa-vuodessa` | Low value. SERP validation required. |
| Date plus Finnish month name (`13 toukokuuta`, `21 marraskuuta`, and 10 more) | 12 | none; only calculators | **Real gap, licensing-blocked.** See 5.4. |
| Annual calendar (`2022 kalenteri`, `1959 kalenteri`, `2015 kalender`, and 3 more) | 6 | `/kalenteri-{y}` exists but is indexed only for 2025 to 2028 | **Real gap, two parts.** See 5.6. |
| Holiday (`2015 pääsiäinen`, `2018 juhannus`, `1 pääsiäispäivä`, `10.10 juhlapäivä`) | 4 | `/pyhat-{y}/{slug}` exists for 2020 to 2035; the 2015 and 2018 queries are outside it | Partly reachable. The year floor 301 already sends `/pyhat-2015/...` to `/pyhat-2020/...`. |
| History and birth year (`1848 meaning`, `1950 tapahtumat`, `1990 luvun`, `1994 syntyneet`, and 2 more) | 6 | none | **Exclude.** Off-topic for a calendar utility, as the brief itself concludes. |
| Ambiguous commercial (`12 eur`, `12e`) | 2 | none | **Exclude.** |

### 5.4 Cluster D is the one genuinely valuable gap, and it is blocked

Twelve keywords are a Finnish date in partitive form: `13 toukokuuta`,
`14 heinäkuuta`, `15 joulukuuta`, `15 kesäkuuta`, `15 toukokuuta`,
`16 kesäkuuta`, `19 joulukuuta`, `19 kesäkuuta`, `19 syyskuuta`,
`20 kesäkuuta`, `21 joulukuuta`, `21 marraskuuta`.

These are the only keywords in the whole report with a clear, answerable, and
on-topic intent: what weekday is this date, what ISO week does it fall in, and
what happens in Finland on it. The site computes all three already and has no
indexable page that states them for a given date.

The natural home is the existing `/nimipaivat/{mm-dd}` family, which is already
a per-calendar-date page with its own route, meta builder, breadcrumb trail,
and schema. It publishes 2 of 366 dates because of the Almanac Office
licensing blocker in 4.2.

So Cluster D needs an owner decision before Phase 3 can design for it:

1. **License the name-day calendar.** Unblocks 366 date pages and several
   hundred name pages at once, and makes the date cluster a natural
   extension rather than a new family.
2. **Build a date page that does not depend on name days.** A
   `/{day}-{kuukausi}` or `/paivamaara/{mm-dd}` family carrying weekday across
   the horizon, ISO week, holiday and flag-day status, and links to the week,
   month, and year pages. This is defensible content, but it is a new URL
   family for 366 pages and needs the constitution's full registration pass
   plus a hard look at whether it duplicates `/nimipaivat/{mm-dd}`.
3. **Do nothing.** 12 keywords at volume 30 is 360 searches per month.

Recommendation: option 1 if licensing is obtainable, otherwise option 3 for
now, and revisit when there is Search Console evidence of real date-query
demand. Option 2 risks building 366 pages for 360 searches a month.

### 5.5 Cluster A is a relevance problem, not a coverage problem

All 26 week-shorthand keywords (`20 51`, `21.26`, `18.33`, `10.26`, `0025`,
`2000 40`, and so on) have a live, indexable, schema-complete Viikkonro page
for the week and year they imply. The site is simply not matched to the
shorthand.

Observable differences from the competitor:

- The competitor's URL is `/{year}/{week}`, so the raw digit pair appears in
  the path. Viikkonro's is `/viikko-{week}-{year}`, with the words between the
  digits. **This is not a reason to change URLs.** Constitution invariant 1
  forbids a second URL pattern for existing content, and the current slugs
  carry the Finnish keyword that real users type.
- Viikkonro titles read `Viikko 21 2026 (18.-24.5.): helluntai | Viikko Nro`.
  The compact forms people type (`vk 21`, `vko 21/2026`, `21/2026`) appear in
  body copy (`check:crawl` asserts vk and vko coverage) but not in titles or
  descriptions.

The honest assessment: these 26 keywords are low-intent numeric fragments with
30 searches each. The leverage is not in chasing them individually but in
making sure every week page states its week-and-year identity in every form a
Finn writes it, which also helps the much larger `viikko {n} {year}` head
terms the site already ranks for. That belongs in Phase 4 as a copy and
metadata pass over one shared function, not as 26 keyword tasks.

### 5.6 Cluster B and C: the year-coverage question

Two separate issues hide behind "annual calendars".

**Issue 1, indexing window.** `/kalenteri-{year}` is prerendered for 2020 to
2035 but sitemap-eligible and promoted only for 2025 to 2028. `2022 kalenteri`
(competitor position 2) has a real, complete, live Viikkonro page at
`/kalenteri-2022` that was deliberately demoted on 2026-11-21. This is the
pruning decision working as designed. If recent archive years turn out to
convert, that is an argument to revisit the window with Search Console
evidence, not a bug.

**Issue 2, horizon.** `1959 kalenteri`, `1978 kalenteri`, `2015 kalenteri`,
`2015 kalender`, and the historical-year keywords (1435, 1442, 1681, 1837,
1845, 1856, 1882, 1909, 2083, 2086) have no Viikkonro page at all and cannot,
because the horizon starts at 2020. `docs/expansion-plan-2100.md` has already
costed widening it: extending to 2100 multiplies week pages 5.06x to 4,227,
and every per-year system multiplies with them (PDFs, OG images, Discover
images, JSON feeds, sitemap). Its headline finding stands: this is "make the
whole site 5x bigger", not "add some pages".

For the gap report specifically, widening the horizon would address at most
about 16 keywords at volume 30, or roughly 480 searches per month, in exchange
for a 5x increase in generated artifacts. That is not a good trade on these
numbers. If historical calendars are wanted, the case has to be built on
something other than this report.

### 5.7 Summary: how much of this gap is worth closing

| Verdict | Keywords | Monthly volume |
| --- | --- | --- |
| Already covered by a live page; relevance and copy work only (Cluster A, the 2022 calendar keyword, 2 holiday keywords) | 29 | 870 |
| Real gap, worth a decision (Cluster D dates) | 12 | 360 |
| Real gap, poor economics (historical years and calendars) | 16 | 480 |
| SERP validation required before any judgement | 8 | 240 |
| Exclude as off-topic or accidental | 35 | 1,050 |

Phase 2 should carry all 100 keywords through the mapping file as the brief
requires, with the last two rows marked "SERP validation required" and "not
relevant / exclude" and a reason per row. But the strategic conclusion should
be stated plainly in `keyword-strategy.md`: **this gap report is not where
Viikkonro's growth is.** For comparison, `docs/seo-2027-growth-plan.md`
records the 2027 query set already drawing 95,842 impressions and 700 clicks in
90 days at an average position near 7, with every target page already built.
That is a 30x larger opportunity on pages that already exist.

## 6. Duplicate-content risks

### 6.1 Four year-level calendar families

`/vuosi-{y}`, `/kalenteri-{y}`, `/tulosta-{y}`, and
`/tulostettava-kalenteri-{y}` all describe one calendar year. The codebase has
already addressed this deliberately, and the comments in `seo.js` record the
reasoning: the four lead with four different nouns, and the token split is
explicit (`/vuosi-` owns "viikkokalenteri {year}", `/kalenteri-` owns
"kalenteri {year}", `/tulostettava-kalenteri-` owns "kalenteri {year}
tulostettava" at a recorded 17.8% CTR, `/tulosta-` owns "viikkolista").

Risk status: managed, not eliminated. Four URLs for one year is still four
chances to split signals, and the two half-year variants
(`-alkuvuosi`, `-loppuvuosi`) add two more at priority 0.3. This should be
monitored with Search Console query-to-page data in Phase 8, not restructured
on suspicion.

### 6.2 PDFs are now submitted while HTML remains the citable surface

Before 2026-11-23, PDFs were `noindex` and excluded from the sitemap. Now
1,043 PDFs are submitted in `sitemap-pdfs.xml` with no robots directive and no
canonical Link header, and `src/data/pdfCanonical.test.js` asserts that
absence. Each PDF restates the content of its HTML page.

This is an owner-approved change, and it is also exactly how the competitor
wins 57 of the 100 gap keywords, so the upside is real. The risk is equally
real: a week PDF and a week HTML page can now compete for the same query, and
the asset family has no canonical signal pointing at the page. Phase 7 and
Phase 8 should treat "PDF outranking its HTML page" as a named metric with a
decision threshold, rather than discovering it later.

### 6.3 Out-of-window pages (finding 4.1 restated as a duplication risk)

612 fully indexable `index, follow` pages sit outside the window and outside
the sitemap. Every one of them is a near-template sibling of an in-window page
(`/kuukausi-3-2031` against `/kuukausi-3-2026`). This is the largest
template-duplication surface on the site and it has no directive expressing
intent.

### 6.4 Month pages against monthly working-day pages

`/kuukausi-{m}-{y}` (month weeks and dates) and `/tyopaivat-{kuukausi}-{y}`
(working days in that month) both cover one month of one year, 48 pages each in
the window. Their titles and descriptions are distinct and the earlier scan
found zero duplicates, so this is a watch item rather than a finding.

### 6.5 Low risk, verified

Zero duplicate titles, descriptions, or H1s across the full indexable set. Self
canonical on every page but the one intentional redirect document.
`/liputuspaivat` shares the current year's canonical by design.

## 7. Recommended improvements

Grouped by what they need. Nothing here has been implemented.

### 7.1 Owner decisions needed before Phase 3 can be designed

| # | Decision | Why it blocks |
| --- | --- | --- |
| D1 | Single writer in this checkout for the duration of this work | Concurrent edits to `seo.js`, `prerender.js`, and `vercel.json` will drift silently (0.1) |
| D2 | What should happen to the 612 out-of-window indexable pages | Determines whether Phase 3 gives them distinct intent or `docs/noindex.md` gets a row (4.1, 6.3) |
| D3 | Whether the name-day calendar can be licensed | Decides the whole shape of Cluster D (4.2, 5.4) |
| D4 | Whether PDF-versus-HTML competition is acceptable, and at what threshold | Needed before Phase 8 can define success (6.2) |
| D5 | Whether historical year coverage is wanted on grounds other than this report | Closes Cluster C either way (5.6) |

### 7.2 Phase 4 work on existing pages, in priority order

1. Remove the en dash from `monthMeta()`'s title template. One function, 192
   pages, a live SERP string, and an explicit `CLAUDE.md` rule. Replace with a
   colon or a plain hyphen, matching how `yearMeta()` and `calendarMeta()`
   already read.
2. Add the compact week-identity forms (`vk`, `vko`, `{week}/{year}`) to the
   shared week metadata and lead paragraph, in the one function that feeds both
   the visible copy and the prerendered head. This serves Cluster A's 26
   keywords and the much larger head terms at the same time (5.5).
3. Align the schema typing drift in 4.4: `CollectionPage` for
   `/pyhapaivat-{year}` and `/tyopaivat-{year}`, and decide whether
   `/kalenteripohjat/{slug}` should carry an `FAQPage`.
4. Clear the en dash from the six heaviest content modules as those files are
   touched, per the "remove on any content line you edit" rule.
5. Correct or remove the stale PD-07 row in
   `docs/predeployment-test-cases.md`, which still describes an English surface
   with reciprocal hreflang that invariant 12 removed on 2026-10-15.

### 7.3 What Phase 5 should and should not build

Do not build: per-date pages before D3 is answered, historical year pages
before D5 is answered, any page whose purpose is a keyword from the 36
PDF-accident group, and any new "ISO 8601 explained" variant. The site already
has `/mika-on-viikkonumero`, `/viikko-alkaa-maanantaista`,
`/miksi-vuodessa-on-53-viikkoa`, `/kuinka-monta-viikkoa-vuodessa`, and 14 more
`kuinka-monta` explainers. The brief's Phase 5 list of nine topics is already
covered by existing pages for eight of them.

The one genuinely uncovered Phase 5 topic is "how to calculate a week number
from a date" as an explainer rather than a tool. `/paivamaara-viikoksi` is the
calculator; there is no page that teaches the rule. `docs/citation-pages.md`
already proposes `/mika-on-viikko-1` and `/mika-on-viikko-53` as the two
missing explainers, and those are better candidates than anything this keyword
report suggests.

### 7.4 Phase 6, reframed

Internal linking is already dense and already validated by
`scripts/check-crawl.js` (three-click reachability from `/`, zero links to
redirect-only or 404 pages, zero self-linking print pages). Phase 6 should
become: re-run that check in an exclusive working tree, confirm
`/kaikki-vuodet` actually gives all 612 out-of-window pages a crawl path, and
verify no page added in Phase 5 is an orphan. Not a construction phase.

### 7.5 Phase 7 and 8 notes

Phase 7's validation list is already mechanised. `npm run test:predeploy`
covers lint, 1,395 unit tests, the full build, the generated-artifact cases in
`docs/predeployment-test-cases.md`, the SSR rebuild, and the crawl check. Phase
7 should extend those cases rather than hand-check the same properties.

Phase 8 should establish its baseline from Search Console **before** any Phase
4 edit ships, and the baseline must be per cluster, not site-wide, or the 2027
seasonal curve will swamp every signal. Two metrics not in the brief's list
belong in it: PDF-versus-HTML impressions for the same query (6.2), and
indexed-URL count against the 1,390 submitted (4.1), which is the only way to
see whether the 612 excluded pages are being indexed anyway.

## 8. Validation results

| Check | Result |
| --- | --- |
| `npm run lint` | Pass, twice, at `5076b6c` |
| `npm test` | Pass, 126 files, 1,395 tests, twice, at `5076b6c` |
| `npm run build` | Pass, 2,003 routes prerendered, all artifact families generated (counts in 1.4) |
| `npm run test:predeploy:artifacts` | **Inconclusive.** 30 pass, 22 fail, every failure an `ENOENT` for a file the completed build had written (`dist/avoin-data.html`, `dist/data/dataset.json`, `dist/data/knowledge-graph.json`, and similar). A concurrent `vite build` from another session emptied `dist/` between prerender finishing at 06:28:26 and the cases reading it. Not attributable to the branch. |
| `npm run check:crawl` | Not reached, blocked by the same race |
| JSON-LD validity | Zero invalid blocks across 1,543 indexable documents (build present at session start) |
| Metadata integrity | Zero duplicate titles, descriptions, or H1s; one H1 per page; self-canonical everywhere but `/liputuspaivat` (same build) |
| Competitor URL shape | Verified live: `viikkonumero.fi/kalenteri/1442.pdf` and `/kalenteri/2959.pdf` both HTTP 200 `application/pdf` |
| Keyword CSV | 100 rows parsed; volume uniformly 30; no row modified |

**The release gate must be re-run in an exclusive working tree before any
Phase 4 change is judged.**

## 9. Phase 1 close-out

### Inspected

`package.json`, `vercel.json`, `index.html`, `public/robots.txt`,
`public/ai.txt`, `public/llms.txt`, `src/AppRoutes.jsx`, `src/data/seo.js`,
`src/components/dateUtils.js`, `src/data/sitemapMetadata.js`,
`src/data/nameDays.js`, `src/data/yearIndexPages.js`,
`src/data/pdfCanonical.test.js`, `src/pages/WeekDays.jsx`, `src/pages/Home.jsx`,
`src/components/Footer.jsx`, `src/components/QuickLinks.jsx`, `prerender.js`
(dispatch, indexing, sitemap, and generator sections),
`scripts/check-crawl.js`, all 135 files in `src/pages/`, all 107 in
`src/data/`, `docs/SEO_CONSTITUTION.md`, `docs/noindex.md`, `CLAUDE.md`,
`docs/predeployment-test-cases.md`, `docs/expansion-plan-2100.md`,
`docs/long-tail-pages.md`, `docs/semantic-seo.md`, `docs/entity-seo-plan.md`,
`docs/citation-pages.md`, `docs/growth-seo-audit.md`,
`docs/seo-2027-growth-plan.md`, `docs/educational-articles.md`, the generated
`dist/` output of two builds, and the 100-row keyword CSV.

### Files created

`docs/seo/topical-authority/audit.md` (this file). Nothing else was created,
modified, or deleted. `dist/` and `dist-server/` were rebuilt; both are
gitignored build artifacts.

### Technical decisions in producing this audit

- Audited the working tree at `5076b6c` rather than `main`, because that is
  the live code state of this checkout. Did not switch branches, because
  another session is working here.
- Computed the URL-pattern tables by importing `sitemapEntries()`,
  `isIndexable()`, and `metaFor()` directly in Node rather than parsing a
  sitemap file, so the counts are exact for the audited commit and do not
  depend on a build surviving the race.
- Verified the competitor's PDF-archive hypothesis with two live HTTP requests
  rather than inferring it from the report, because 57 of 100 keywords depend
  on it.
- Did not report the 22 artifact-case failures as a branch defect after
  tracing every one to a missing file that the build log shows was written.

### Risks carried into Phase 2

1. Concurrent writer in this checkout (D1). Highest risk to everything that
   follows.
2. The release gate has not been seen green end to end on this branch.
3. The grouped workbook named in the brief is absent.
4. Three of the brief's eight clusters (C, F, H) and 35 of the 100 keywords are
   recommended for exclusion. If the owner disagrees, the Phase 2 mapping
   changes shape substantially.

### Next phase

**Phase 2: keyword classification and URL mapping**, producing
`docs/seo/topical-authority/keyword-mapping.csv` (all 100 keywords, every
column the brief lists, one row each, original strings preserved exactly) and
`docs/seo/topical-authority/keyword-strategy.md`.

Phase 2 is blocked on decision D1. It can proceed without D2 to D5 as long as
the affected rows are marked as pending those decisions rather than guessed.
