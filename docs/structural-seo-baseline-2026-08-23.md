# Structural SEO baseline — 2026-08-23

This is the local baseline for the remediation plan derived from the
structural SEO audit. It records only facts reproducible from the repository
and a clean production build. Search Console observations are deliberately
kept separate because no Google credentials were available in the local
environment.

## Verification performed

- `npm run build` — passed; 1,705 routes prerendered.
- `npm test` — passed; 216 tests across 20 test files.
- `npm run lint` — passed.
- `npx vite build --ssr src/entry-server.jsx --outDir dist-server && npm run check:crawl`
  — passed; 1,928 internal URLs crawled from `/`, with zero unreachable URLs,
  zero pages beyond three clicks, zero redirect-only pages linked internally,
  zero links to the 404 page, and zero render errors.
- `vercel.json` parses as JSON and contains 23 redirect rules.

The standalone crawl command must be preceded by the SSR-only build because
the normal production build intentionally deletes `dist-server` after
prerendering.

## Generated index surface

The generated sitemap contains 1,357 `<loc>` entries:

- 901 indexable HTML URLs.
- 456 indexable PDF URLs: 7 calendars, 365 weeks, and 84 months.

The production build generates 1,043 PDF files across the full 2020–2035
horizon (16 calendars, 835 weeks, and 192 months), but only the 456 PDFs whose
HTML counterparts fall inside the rolling index window are listed in the
sitemap. The audit's estimate of approximately 850 PDFs omitted the month-PDF
family and incorrectly treated generated, crawlable, and sitemap-listed URLs
as the same population.

The production output also contains 805 noindexed HTML documents outside the
rolling indexable window. Dated HTML pages are indexable for 2024–2030; older
and farther-future pages remain available and crawlable but are excluded from
the sitemap.

### Indexable HTML families

| Family | Count |
| --- | ---: |
| Week | 365 |
| Named holiday | 240 |
| Month | 84 |
| Monthly working days | 84 |
| Quarter | 28 |
| Static/other | 29 |
| Half-year calendar | 14 |
| Year | 7 |
| Browsable calendar | 7 |
| Printable calendar | 7 |
| Printable week list | 7 |
| Holiday hub | 7 |
| Flag days | 7 |
| Working days | 7 |
| School holidays | 2 |
| Name page | 3 |
| Name-date page | 2 |

## Corrected findings index

This table replaces the severity-only index in section 2 of the PDF. A finding
is not treated as confirmed merely because it appeared in a search-result
sample. Redirect, canonical, title-template, PDF-indexing, and URL-removal
changes remain gated where the evidence needed to preserve rankings is absent.

| Finding | Verified status | Evidence gate / next action |
| --- | --- | --- |
| F-01 URL cannibalisation | Unproven; not CRITICAL on current evidence | Export Search Console query-by-page data before consolidating distinct calendar and print artifacts. Redirects and PDFs cannot be counted as nine independently indexable HTML competitors. |
| F-02 legacy index entries | Redirects configured; index state unknown | Inspect representative legacy URLs in Search Console. Do not add redirect sources to the canonical sitemap. |
| F-03 `-2` duplicates | Disproven | `/kalenteri-YYYY-2` is an explicit single-hop 301 to `/kalenteri-YYYY-loppuvuosi`; it is not generated as an indexable duplicate. |
| F-04 rewritten week titles | Template fixed locally; Google outcome requires post-deploy monitoring | The title now aligns with the H1, leads with the week/year answer and dates, and keeps `vk`/`vko` in visible body copy. Recheck a query-controlled sample after recrawl. |
| F-05 hardcoded year navigation | Hardcoding disproven; seasonal rollover strengthened locally | Shared navigation has no literal year. It now keeps current-year weeks visible while promoting next-year calendar/print pages from 1 October, then completes rollover automatically on 1 January in Europe/Helsinki time. |
| F-06 description/content mismatch | Fixed locally | Week, month, and year descriptions now promise only consistently rendered date, working-day, holiday, and download content. Incomplete name-day coverage is no longer advertised. |
| F-07 English island | Single-page constraint retained; mixed chrome fixed locally | `/en` remains the only English route, keeps reciprocal `fi`, `en`, and `x-default` alternates with `/`, and now renders English navigation and footer chrome. Every Finnish destination is labeled. |
| F-08 PDF duplication | No public index evidence found; monitor pending Search Console | The full build generates 1,043 user-download PDFs, while the rolling sitemap submits 456. Do not change headers, sitemap membership, or robots rules until PDF indexing/query evidence establishes a real conflict. |
| F-09 breadcrumb collision | Fixed locally | Both print artifacts now have distinct leaf labels, a same-year calendar parent, and matching visible and JSON-LD trails. |
| F-10 self-link | Fixed locally | The printable A4 page is excluded from its own related-links list. |
| F-11 meta keywords | Fixed locally | The obsolete global tag and its prerender rewrite have been removed. |
| F-12 scaled-content exposure | Controlled risk, not a violation | The rolling index window is active. Review repetitive FAQs based on information gain, not an invented word-ratio threshold. |

The PDF's single-sentence conclusion is therefore not supported as written.
The site has several deliberately distinct year artifacts; competition between
them has not been demonstrated, and one observed Google title rewrite does not
establish rejection across the entire week family.

### F-01 detailed disposition

The report's headline "nine indexable URLs" is factually incorrect. Direct
requests and the route configuration produce this 2027 sample:

| URL | Actual state and intent |
| --- | --- |
| `/vuosi-2027` | 200, self-canonical directory of 52 week-detail pages. |
| `/kalenteri-2027` | 200, self-canonical browsable 12-month grid. |
| `/tulostettava-kalenteri-2027` | 200, self-canonical print-optimised A4 month grid with a ready-made PDF and CSV. |
| `/tulosta-2027` | 200, self-canonical row-based ISO-week list with browser print/PDF and CSV; it does not expose the calendar PDF as an alternate. |
| `/kalenteri-2027-alkuvuosi` | 200, self-canonical January–June grid. |
| `/kalenteri-2027-loppuvuosi` | 200, self-canonical July–December grid. |
| `/kalenteri-2027-2` | 301 to `/kalenteri-2027-loppuvuosi`; not an indexable duplicate page. |
| `/pdf/kalenteri-2027.pdf` | PDF asset, not a competing HTML landing-page template; actual Google index/performance state is unknown. |
| `/year/2027` | 301 to `/vuosi-2027`; not a live self-canonical page. |

At most six self-canonical HTML pages exist in the list, and their rendered
artifacts are not interchangeable. Self-canonical status also does not prove
that Google indexed a URL or that two URLs compete for the same queries.

No URL was removed or redirected for F-01. Instead, the three broadest title
and anchor patterns were made explicitly intent-specific:

- `/kalenteri-YYYY`: browsable 12-month viikkokalenteri.
- `/tulostettava-kalenteri-YYYY`: printable A4 month grid with a ready PDF.
- `/tulosta-YYYY`: row-based printable ISO-week list.

The H1, title, description, breadcrumb, internal anchor text, visible FAQ, and
FAQ schema now use those same distinctions. Consolidation remains gated on
Search Console query-by-page evidence showing that two of these artifacts
receive impressions for the same queries without serving meaningfully
different user needs. If consolidation becomes justified, use a single-hop
301 and list only the destination in the sitemap, consistent with Google's
[canonicalisation guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
and [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### F-02 legacy index entries

The report conflates the redirect response with the destination response.
`/year/2026` itself returns HTTP 301; a client that follows it then receives
HTTP 200 from `/vuosi-2026`. The same single-hop behavior is configured for
the complete `/year/:year`, `/week/:week/:year`, and
`/month/:month/:year` families. Live samples covering 2020, 2025, 2026, and
2035 all returned the expected 301 and then a 200 canonical destination.

The repository and generated output currently have:

- 301 rules for every legacy family named in F-02.
- No redirect destination that is another redirect source.
- No legacy URL in the sitemap, internal links, canonicals, hreflang, or
  structured data.
- `robots.txt` access allowed, so Google can retrieve the redirects.

The report's search-result samples can indicate stale processing, but they do
not enumerate the affected URLs or prove their current Search Console index
state. That state remains an external evidence gate. No temporary legacy
sitemap was created: Google's sitemap documentation says to list the canonical
URLs that should appear in search results, not redirect sources. The Removals
tool is also not a consolidation mechanism; it should only be considered for
an urgent temporary hide, not routine redirect processing.

Regression coverage now parses `vercel.json` and requires every migration rule
to remain a permanent, single-hop redirect. The generated-route inventory and
crawl check reject `/year/`, `/week/`, `/month/`, and numbered calendar URLs
if they ever leak into prerendered HTML or `sitemap.xml`.

### F-03 numbered calendar suffix

F-03 is disproven. `/kalenteri-YYYY-2` was the old, deliberate name for the
second half of a year, paired with `/kalenteri-YYYY-1` for the first half. The
two legacy forms are explicit 301 rules:

- `/kalenteri-YYYY-1` → `/kalenteri-YYYY-alkuvuosi`
- `/kalenteri-YYYY-2` → `/kalenteri-YYYY-loppuvuosi`

They are not emitted by `sitemapEntries()`, prerendering, canonicals, internal
links, or schema. Live samples for 2020, 2027, and 2035 confirmed that `-2`
returns a single 301 hop to the corresponding `-loppuvuosi` page.

The build previously wrapped route candidates in `new Set()`, which would have
silently hidden a future duplicate route. It now fails before prerendering if
any route candidate is duplicated or if a legacy/numbered calendar path enters
the generated inventory. This supplies the build-time collision assertion the
report requested, without misdiagnosing the intentional legacy suffix as its
cause.

### F-04 week title rewrites

The report supplies one valid example of a Google-generated title link, but a
single search-result observation does not prove that Google rejects the title
on every week URL: title links can vary by query and recrawl state. Its scale
is also overstated for the active index surface. The build generates 835 week
pages across 2020–2035, while the rolling 2024–2030 index window currently
places 365 week HTML URLs in the sitemap. Older and farther-future week pages
are noindexed.

The underlying title quality issue was still worth correcting. The old title:

`Viikko 43 (vk 43, vko 43) · 19.–25.10.2026 | Viikko Nro`

is now:

`Viikko 43 vuonna 2026 – 19.–25.10.2026 | Viikko Nro`

This leads with the same week/year answer as the H1 and retains the unique date
range without presenting three variants of "viikko" as a keyword list. Each
week page now carries a natural visible sentence explaining that week 43 can
also be written `vk 43` or `vko 43`, together with its ISO 8601 notation.

Regression tests enumerate every valid ISO week from 2020 through 2035 and
require all 835 titles to be unique, correctly prefixed, and no longer than 60
characters. Boundary tests preserve both calendar years in ranges such as
`29.12.2025–4.1.2026`. The generated crawl check also rejects any week page
that restores the abbreviation list to its title or loses the visible `vk` and
`vko` explanation.

Post-deployment verification remains necessary because only Google controls
the displayed title link. Record a fixed set of at least ten week URLs and
queries at deployment, then compare the supplied and displayed titles after
four weeks and again after eight weeks. Follow Google's
[title-link guidance](https://developers.google.com/search/docs/appearance/title-link)
when interpreting rewrites; a changed title link is not itself a ranking
penalty.

### F-05 navigation rollover

The report mistook expected August output for hardcoding. In August 2026, a
dynamic current-year navbar should point to 2026. The original component
already computed `isoYear(new Date())` during render, so it would not have
remained frozen after New Year and contained no literal `2026`.

The original implementation did not, however, define the report's useful
autumn planning behavior. A centralized Europe/Helsinki policy now controls
the shared navbar and homepage quick links:

| Helsinki date | Week-hub link | Calendar and printable-list links |
| --- | --- | --- |
| 1 January–30 September | Current year | Current year |
| 1 October–31 December | Current year remains visible | Upcoming year is promoted |
| Following 1 January | New current year | New current year |

For example, on 1 October 2026 the navbar exposes `/vuosi-2026` alongside
`/kalenteri-2027` and `/tulosta-2027`. At midnight on 1 January 2027 it moves
the week hub to `/vuosi-2027` without a deployment or manual edit. The weekly
badge continues to link to the actual ISO week-year, which can differ from the
calendar year around New Year.

The same helper now supplies the footer copyright year using the Helsinki
calendar year. This fixes the subtle case where using the ISO week-year could
show the following copyright year during the final days of December.
Breadcrumb parents remain tied to the year of the page being viewed, rather
than to either promotional year.

Pure policy tests cover the exact Helsinki instants before and after 1 October
and New Year. Rendered-navbar tests assert the actual `href` targets in all
three states, and the generated crawl check verifies that the live build uses
the policy's expected current/promoted targets. The existing nightly rebuild
keeps prerendered navigation current; client rendering applies the same helper.
No recurring annual owner task is required.

### F-06 description/content mismatch

The reported week-template mismatch was valid. The visible week page can show
verified name days when data exists, but the licensed local dataset is not
complete enough to support a blanket promise across every week. Adding
unverified or copied entries would turn a snippet problem into a data-quality
and licensing problem, so the remediation does not invent missing content.

The week description now advertises dates, holidays, computed working days,
and the downloadable calendar, all of which are present on every valid week
page. The description audit also found the same aspirational name-day wording
in the month and year families. Those descriptions now refer to their rendered
working-day and holiday information and their real PDF downloads instead.

One calendar FAQ also claimed that every linked week supplies name days. It now
accurately promises the seven dates, working-day count, and Helsinki daylight
information. Dedicated name-day pages retain name-day metadata because those
pages disclose unavailable dates explicitly and do not claim complete data.

Unit tests cover all 192 month descriptions and all 16 year descriptions,
including snippet-length bounds and absence of the unsupported claim. The
generated crawl check independently inspects every week, month, and year HTML
description and fails if name-day wording returns.

### F-07 English courtesy page

The site owner has confirmed that `/en` must remain the only English route, so
the report's full `/en/` cluster option is outside product scope. The page is
also deliberately indexable, self-canonical, present in the sitemap, and a
real current-week counterpart to `/`. Applying an isolated `noindex` and
removing its language selector would contradict that established policy and
discard an existing URL without performance evidence.

The mixed-language chrome defect was valid. The shared navbar and footer now
detect `/en` and render English labels, menu accessibility text, descriptions,
section headings, copyright text, and social-link labeling. Links into the
Finnish-only service are visibly marked “(Finnish)” and carry `hrefLang="fi"`;
the English page body already discloses the same limitation. No English route
or translated content family was added.

The existing head implementation was verified rather than inferred: `/en`
keeps `<html lang="en">`, `og:locale="en_US"`, a self-canonical, and reciprocal
`fi`, `en`, and `x-default` alternates with `/`. A generated-output crawl check
now fails if any of these signals disappears, if Finnish navigation/footer
labels return, if `/en` becomes noindexed, or if it leaves the sitemap.

### F-08 downloadable PDF surface

The report correctly states that PDFs are indexable by default, but it does
not establish that any Viikko Nro PDF is indexed or competing with HTML.
Targeted public searches for the `/pdf/` directory and both cited files did
not surface a PDF result on 31 August 2026. Site-search results are not a
complete index export, so this is absence of public evidence rather than proof
of exclusion; the Page Indexing and Performance reports in Search Console
remain the decision source.

The scale estimate also omitted the newer monthly PDF family. The complete
2020–2035 build contains 1,043 files: 16 yearly calendars, 835 week fact
sheets, and 192 month calendars. The rolling index window submits only 456 of
them in the current sitemap: 7 yearly, 365 weekly, and 84 monthly PDFs. Every
file is a purpose-built printable/download artifact, not an HTML render.

Live checks of `/pdf/viikko-43-2026.pdf` and
`/pdf/kalenteri-2027.pdf` returned `200 application/pdf`, remained allowed by
robots.txt, and carried no `X-Robots-Tag`. That is consistent with the current
intentional discoverability policy. No `noindex`, sitemap removal, canonical
header, or robots disallow has been applied without the missing index/query
evidence.

The crawl regression now inventories the PDF layer independently. It requires
every sitemap PDF to exist, every submitted PDF to have a direct HTML download
link, and every generated PDF—including archive files outside the sitemap—to
remain reachable from HTML. Current result: 1,043 generated, 456 submitted,
1,043 directly linked; zero missing or orphaned files.

If Search Console later confirms that PDFs receive impressions for queries
where the corresponding HTML should rank, deploy `X-Robots-Tag: noindex` on
`/pdf/(.*)` and remove PDF URLs from the sitemap in the same release. Keep the
files linked and accessible, and do not disallow `/pdf/` in robots.txt while
Google still needs to crawl the response header. Verify the header through the
live Cloudflare endpoint after deployment, then monitor deindexing before any
later crawl-blocking decision.

## Search Console data still required

Phase 1 is locally complete, but the evidence required for URL consolidation,
PDF index policy, and title-rewrite measurement cannot be generated locally.
The next evidence import should include:

1. Six to twelve months of page/query performance data.
2. Page indexing and canonical status grouped by URL family.
3. URL Inspection results for representative current, legacy, print, PDF,
   English, and week URLs.
4. Queries for which more than one calendar/print URL receives impressions.
5. PDF clicks and impressions separated from their corresponding HTML pages.

No redirect, canonical, sitemap, PDF-indexing, or broad title-template changes
should ship until the relevant evidence gate above is satisfied.

## Remediation log

### Phase 2 — safe fixes completed locally; verified 2026-08-31

- Removed the obsolete meta keywords tag from the base template and removed
  the now-unnecessary English-keywords rewrite from the prerenderer.
- Preserved the English `<html lang>` and Open Graph locale corrections.
- Removed the printable calendar's self-link while preserving the same link on
  browsable and half-year calendar pages, where it points to a different page.
- Replaced unsupported name-day promises in week, month, and year descriptions
  with consistently rendered working-day, holiday, and download coverage; also
  corrected the related calendar FAQ.
- Added focused metadata-promise tests and extended the crawl checker to reject
  printable-calendar self-links, generated meta keywords, and unsupported
  name-day claims across generated week, month, and year descriptions.
- Replaced `/en`'s inherited Finnish navbar and footer with route-aware English
  chrome, visibly labeled every Finnish destination, and added component plus
  generated-head regression checks without creating another English route.
- Audited F-08 without making an evidence-free indexation change: corrected
  the PDF inventory to 1,043 generated/456 submitted and added crawl assertions
  for missing or orphaned downloadable files.
- Gave the printable A4 month grid and printable week list distinct breadcrumb
  labels, placed both under the matching year's calendar, and removed the
  full-year calendar's self-referential parent crumb. The visible and JSON-LD
  trails use the same `breadcrumbTrail()` source and have regression tests.
- Differentiated the F-01 page intents in titles, descriptions, H1s, FAQs, and
  internal anchor text without removing established URLs: browsable month
  grid, printable A4 month grid, and printable ISO-week list.
- Added build, unit-test, and crawl assertions for F-02/F-03: required
  single-hop 301 rules, unique route candidates, canonical-only sitemap paths,
  and zero generated legacy or numbered-calendar pages.
- Replaced the repetitive F-04 week title template with an H1-aligned
  week/year/date title, moved `vk`/`vko` coverage into natural visible copy,
  and added exhaustive title and generated-output regression checks.
- Centralized F-05 navigation year selection in a Helsinki-time policy with an
  October planning transition, automatic New Year rollover, rendered-navbar
  boundary tests, and generated crawl verification.

Post-change verification:

- Production build: passed; 1,705 routes prerendered.
- Crawl: 1,928 internal URLs, 901 sitemap HTML URLs, zero reachability,
  depth, redirect-only, 404, self-link, meta-keywords, unsupported
  name-day-description, invalid-English-surface, missing-PDF,
  orphaned-PDF, or render errors.
- Tests: 221 passed across 22 test files.
- Lint and syntax checks: passed.

Phase 3 must begin with a Google-rendered-title/Search Console sample. The
local environment has no Google application credentials, so a sitewide week
title change is intentionally not included in Phase 2.

### English-route constraint — confirmed by the site owner

`/en` must remain the only English page and route. The remediation must not
add `/en/*` pages, translate Finnish page families into English routes, or add
new English URLs to routing, prerendering, the sitemap, hreflang, or internal
navigation. Any future English UX work is limited to the existing `/en` page.
