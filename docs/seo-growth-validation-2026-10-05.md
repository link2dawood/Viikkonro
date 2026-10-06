# SEO growth audit: validation and implemented changes

Checked 2026-10-05 against the repository, live HTTP responses, parsed HTML,
the XML sitemap, robots.txt, and limited web searches. No Search Console data
was used. Changes are local and have not been deployed.

The audit identifies a useful parity-content opportunity, but several claimed
technical defects are absent. The available evidence cannot establish that
competitive positioning is the only growth constraint or that the competitor's
exact-match domain causes its rankings.

## Findings verified against the live site

| Claim | Evidence and decision |
| --- | --- |
| 1,465 sitemap URLs | Confirmed as the starting state: **1,009 HTML URLs and 456 PDFs**. After the approved consolidation and two new HTML pages, the generated sitemap contains 1,011 HTML URLs and no PDFs. |
| Duplicate H1s | False positive. Parsing `/`, `/en`, and the sample week pages finds one H1 each. A raw text search also matches `<h1>` inside an HTML comment about font loading. No heading change needed. |
| No same-week links across years | Incorrect. Live `/viikko-42-2026` links to `/viikko-42-2025` and `/viikko-42-2027`. Source already guards week 53 and the prerendered year boundaries. |
| English page is a one-link dead end | Incorrect. `/en` links to the current detailed week, year, calendar, Finnish homepage, open data, and other destinations through its navigation and footer. |
| Deep pages need hreflang | No equivalent English deep pages exist. The `/` and `/en` pairing is appropriate; pointing unrelated Finnish pages to `/en` would misrepresent translations. [Google's guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). |
| 456 PDFs cause harmful cannibalization | Harm remains unproven, but the user's later section 6 instruction explicitly approved consolidation. All files, downloads, alternate links, crawlability, and schema remain; sitemap entries are removed and each PDF family has an HTML canonical response header. |
| 414 old lastmods weaken crawling | The dates are confirmed, but age itself is not a defect. The actual problem is that code inferred December 31 from the year in a URL and stamped other pages with every build date. Neither proves a content modification. |
| `/koululomat-2028` returns 404 | Confirmed. This does not justify publishing an unverified full-year holiday page. Existing school-holiday coverage and confidence rules should govern expansion. |
| No parity content | Confirmed in the checked source. Current/next odd-even answers fit the homepage, individual week pages, and existing year lists. |
| Calculator pages are universally thin | Too broad. The workday calculator already has Christmas guidance and three FAQs. Improve specific missing explanations; avoid padding every calculator or adding unreviewed medical guidance. |
| AI-bot allows establish GEO readiness | They permit crawler access; they do not demonstrate citations, rankings, or answer-engine visibility. |

The original homepage title began with “Mikä viikko nyt on?” and already
contained “Viikkonumero”. The follow-up implementation now leads with
“Viikkonumero”, retaining the question, live week and compact start date. This
is an authorized targeting experiment, not a demonstrated ranking fix.

Limited searches surfaced existing parity-focused competitor content, including
[Calendar Center](https://calendar.center/fi/parilliset-tai-parittomat-viikon-numero/).
That supports treating parity as a real intent, but does not establish search
volume, low competition, or Finnish Google positions. The original ranking
claims and PDF's reported #2 position remain unverified.

## Keyword and SERP evidence: section 3 follow-up

The supplied observations are useful research leads, but they do not establish
Finnish Google rankings, indexed-page counts, impression volume, or CTR. Fresh
search probes on 2026-10-05 returned a different competitor mix and did not
reproduce the PDF's reported #2 position. This backend is not a controlled,
Finland-localized Google rank tracker; its result ordering must not be reported
as Google positions. Absence from its returned sample is not proof of absence
from Google's first page.

| Query | Supplied observation | Validated interpretation |
| --- | --- | --- |
| `viikkonumero 2027 viikkonumerot` | Calendar PDF at #2 | Retain as a reported observation, not an independently reproduced rank. No CTR or engagement conclusion follows. |
| `viikkonumero` | Site absent; mixed calendar/Excel intent | Candidate homepage query. Fresh probes surfaced [Viikkonumero.fi](https://viikkonumero.fi/) and other week tools, but do not establish the site's position. |
| `viikko 42 viikkonumero 2026` | Site absent; competitors #1 and #4 | Candidate for `/viikko-42-2026`. Fresh probes surfaced calendar/week pages, including [Onlinelaskimet](https://onlinelaskimet.net/viikon-numero); exact competitor ranks remain unverified. |
| `kalenteri 2026 viikkonumeroilla` | Site absent | Candidate for `/kalenteri-2026`. Relevant results included [Viikkotieto](https://viikkotieto.fi/kalenteri/2026/) and [Viikkonumerot.com](https://viikkonumerot.com/kalenteri/2026); no controlled rank established. |
| `työpäivälaskuri` | Site absent | Candidate for the improved workday calculator. Follow-up results did not provide usable independent rank evidence. |
| `raskauslaskuri viikot` | Site absent | Candidate calculator intent. Fresh results included [Terveyskylä](https://www.terveyskyla.fi/naistalo/raskaus/raskauslaskuri) and [Vau.fi](https://www.vau.fi/raskaus/laskettuaika-raskauslaskuri/). This identifies competing resources, not a diagnosis of why this site ranks where it does. |
| `auringonlasku helsinki tänään` | Site absent | Candidate for `/auringonlasku-helsinki`; follow-up results did not supply usable independent rank evidence. |
| `mikä viikko nyt on`, `nimipäivä tänään` | Unusable original results | No conclusion. Do not classify these as ranking gaps from that evidence. |

Use **candidate query opportunities** rather than “striking-distance” keywords:
no near-page-one position has been demonstrated. Similarly, sitemap breadth is
not indexed breadth. The 1,465 submitted URLs include PDFs, and a crawlable page
with a unique title is not necessarily indexed. Some school-holiday pages also
have confidence-dependent noindex rules. Google explicitly states that a sitemap
does not guarantee crawling or indexing. [Sitemap overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).

### CTR and title hypotheses, not measured patterns

“High-impression / low-CTR” cannot be inferred from these probes. CTR requires
click and impression counts; a PDF result does not show either. A visitor seeking
a printable calendar may prefer the PDF, and PDF usage is not established by
the HTML site's interaction metrics. Use the Search Console query/page breakdown
to compare PDF and HTML performance. [Performance report documentation](https://support.google.com/webmasters/answer/7576553?hl=en).

A keyword-first homepage title is a reasonable **candidate experiment**, but
neither the current question-first title nor competitor word order proves a
ranking disadvantage. Before changing it:

1. Capture Finnish-country query/page performance for both `viikkonumero` and
   `mikä viikko nyt on`, split by device and comparable date periods.
2. Record the title actually displayed in search, the existing title, and a
   proposed variant that retains the current week and both query intents.
3. Change only the title for that experiment, annotate the deployment, and
   evaluate clicks and CTR alongside impressions, position, query mix, and
   seasonality. A before/after observation is not a randomized causal test.

Following the user's request to implement the remaining supported changes,
title and editorial changes below were added. The later explicit section 6
instruction superseded the earlier keep-in-sitemap choice for PDFs.

## Competitor content gaps: section 4 follow-up

| Reported gap | Implementation and limit |
| --- | --- |
| Even or odd week | Added `/parillinen-pariton-viikko` as a distinct evergreen explainer with a live answer, current and next-year week links, use cases, the week 53 to week 1 exception, and matching FAQ schema. Week pages expose linked parity badges. |
| Kelan arkipäivät | `/tyopaivalaskuri` now lets the user select ordinary workdays (Monday-Friday) or Kela weekdays (Monday-Saturday). Both modes include the boundary dates and exclude official holidays. The definition and a direct source link were checked against [Kela's guidance](https://www.kela.fi/raskausaikana) on 2026-10-05. The page tells users to check the specific benefit decision and conditions. |
| Editorial statistics and TES | `/tyopaivat-YYYY` now gives computed yearly totals, Kela weekdays, weekday holidays, weekend days, and the months with the most and fewest workdays. Both workday surfaces distinguish the calendar calculation from work schedules and collective-agreement terms. |
| Freshness signal | Workday pages show the fixed date on which their content and rules were reviewed. No relative or automatically refreshed “hours ago” claim was added because a build timestamp would not prove editorial review. |
| Exact-match competitor domain | This is a competitive observation, not an implementable site change. The response is stronger intent coverage, computed answers and internal links. Its effect must be measured in Search Console after deployment. |

## Implemented

1. Added a prerendered current/next parity answer on the homepage, with links
   to the corresponding weeks and year list. Calculations use ISO week-years,
   including consecutive odd weeks 53 and 1 at New Year.
2. Added parity to week-page facts and interactive date-search results. Year
   pages now contain computed odd/even totals and grouped links. Added the
   distinct evergreen `/parillinen-pariton-viikko` guide for the broader
   definition, vuoroviikko use cases, current answer and year lists.
3. Added a shared parity FAQ to the homepage and `/ukk`. Their generated
   FAQPage nodes and `llms-full.txt` consume that same source.
4. Expanded `/tyopaivalaskuri` with its counting method, inclusive-boundary and
   personal-schedule limitations, four computed examples, related links, and
   nine FAQs. Added a workday/Kela-weekday selector backed by one tested date
   calculation. Visible FAQs and schema now share one source.
5. Replaced inferred sitemap dates with a conservative policy: daily-answer
   pages use the render day, content changed here uses its recorded review
   date, and unknown modification dates are omitted. PDFs no longer receive
   sitemap entries or inherit an HTML date. The follow-up adds tracked dates
   for full-year calendars and the pregnancy calculator. Future edits must update the corresponding
   review date or extend the tracked-date policy.
6. Applied a keyword-first homepage title while preserving both query intents,
   week number and start date. Full-year calendar titles now explicitly target
   `Kalenteri YYYY viikkonumeroilla`. Their content and shared FAQs explain the
   first/last day's ISO week-year using computed dates, with parity links.
7. City sunrise/sunset pages now have city-specific “tänään” titles and a
   prerendered seven-day table, including polar-day/night handling. Added the
   time-zone FAQ through the shared visible/schema source and a SunCalc source
   link. Replaced the unsupported universal one-minute precision claim with
   an estimate explanation. Solar models and observed conditions can differ;
   [NOAA's calculation notes](https://gml.noaa.gov/grad/solcalc/calcdetails.html)
   support avoiding a blanket precision promise.
8. Added a worked pregnancy-calculator example from the existing arithmetic,
   distinguished pregnancy duration from ISO calendar weeks, and made the week
   table's `+0` to `+6` intervals explicit. Linked the public hospital service's
   [calculation overview](https://www.terveyskyla.fi/naistalo/raskaus/raskauslaskuri),
   checked 2026-10-05. No individual medical assessment or clinical-review
   credential is implied.
9. Added `npm run report:seo-growth`: a read-only Search Console JSON export
   for adjacent 28-day windows, Finnish web searches, finalized data, query,
   page and device breakdowns, and PDF/HTML summaries. It paginates, computes
   impression-weighted averages, records limitations, and protects existing
   baseline files from overwrite. It neither emails nor submits sitemaps.
10. Expanded every `/tyopaivat-YYYY` page with computed yearly statistics,
    Kelan weekday totals, a TES limitation, an official Kela source and an
    honest rule-review date. The visible five-question FAQ and FAQPage JSON-LD
    consume the same generated answers.
11. Added `/koululomat-2028` using city-specific official decisions from
    Helsinki, Turku, Tampere, Joensuu and Oulu. Unknown autumn dates remain an
    explicit undated city list. Added a yearly source-review and rollover
    runbook in `docs/school-holiday-rollover.md`.
12. Optimized `/mika-on-viikkonumero` around `Viikkonumero` as the primary
    title term. Added current-year and Finnish-use headings, an observable
    feature table, and a parity-guide link without creating a second explainer.
13. Replaced adjacent-year week links with a seven-link `Viikko N muina
    vuosina` block. The helper fills both year-boundary edges and omits years
    where week 53 does not exist.
14. Week pages 8-10 and 42-43 link to the verified school-holiday hub for that
    year, even when the page has no city row for that exact week. Other weeks
    do not receive the forced link.
15. Removed all calendar, week and month PDFs from `sitemap.xml`. The 1,043
    files remain generated, crawlable, visibly downloadable, alternate-linked
    and represented by MediaObject/DownloadAction schema. Three Vercel header
    rules canonicalize each PDF family to its exact HTML counterpart.
16. Kept `/en` indexable after verifying that it already has useful outgoing
    links. Added a small Finnish-footer inbound link so the sitemap entry is
    reachable in the internal crawl graph.
17. Added WebPage, Article, FAQPage, BreadcrumbList and Speakable schema to the
    parity route. No Recipe or unrelated HowTo markup was added. Existing FAQ,
    featured-answer and Dataset coverage was preserved.

Google recommends dates reflecting significant content changes, rather than
unchanged rebuilds. `lastmod` is optional; this change improves accuracy and
does not promise more crawling. [Sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Verification

- Baseline: 318 tests passed. Final result: **357 tests in 45 files passed**.
- `npm run lint`, `node --check prerender.js`, JSON parsing, and Vercel routing
  compilation passed. The compiler resolved named header captures to the
  expected calendar, week and month HTML canonical paths.
- Full `npm run build` passed: **1,905 routes**, **1,011 sitemap URLs**, **0 PDF
  sitemap URLs**, **1,556 image entries**, and **1,043 generated PDFs**.
- Generated-output checks covered the new pages, school-week links, seven-link
  cross-year block, week 53 validity, canonical tags, visible PDF links,
  alternate PDF links, MediaObject schema, parity schema types, and the absence
  of unrelated HowTo or Recipe nodes on the parity page.
- The SSR crawl visited **2,267 internal URLs**. Every sitemap page was reachable
  within three clicks, with zero redirect-only links, 404 links, render errors,
  unlinked PDFs, invalid English signals, or unexpected PDF sitemap entries.
- Homepage, `/ukk`, and workday FAQ text matches generated JSON-LD after HTML
  text normalization. The generated calculator has nine matching visible/schema
  FAQs; `/tyopaivat-2026` has five. The parity FAQ appears in generated
  `llms-full.txt`.
- Tests cover week 53 to week 1, week 52 to week 1, server-rendered parity
  links, ordinary/Kela workday examples, invalid date modes, yearly workday
  editorial output, FAQ consistency, sitemap date behavior, calendar year
  boundaries, seven-day solar tables, pregnancy example arithmetic, and Search
  Console filtering, date windows, weighted metrics and pagination. Adversarial
  cases also cover malformed week inputs, prerender boundaries, unsupported
  2036 week links, PDF response-header mappings, and source-limited 2028 dates.

The report CLI help was checked, and a baseline export was attempted. This
environment could not obtain Search Console credentials, so **no baseline
performance data was generated**. Configure the existing service-account
credential mechanism with property read access, then run:

```sh
npm run report:seo-growth -- --end-date 2026-10-02 --output seo-growth-report-baseline-2026-10-02.json
```

Choose a new output filename for later measurements. Record the actual deploy
date separately; none has occurred in this session. Since content changes ship
alongside the titles, any before/after comparison is observational and cannot
isolate a title-only effect.

## Measurement and next decisions

After deployment, record its date and compare 28-day Search Console windows,
using prior-year comparisons where seasonal traffic makes that useful. Group
queries for parity, current-week terms, workday calculations, and printable
calendars. Compare impressions, clicks, CTR, and landing pages; do not attribute
a position change alone to this patch.

Before consolidating PDFs, compare PDF and HTML query clusters, inspect Google's
chosen canonicals, and check whether losing direct print/download results would
reduce useful visits. If equivalent documents warrant consolidation, HTTP
`Link: rel="canonical"` is supported for PDFs; it is not automatically justified
for every printable companion. [Canonicalization documentation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

Consider a dedicated parity landing page only if query data supports separating
that intent from the homepage. Expand school-holiday years when source coverage
supports them. Prioritize other calculator improvements by demonstrated demand
and source quality, with medical content receiving appropriate review.
