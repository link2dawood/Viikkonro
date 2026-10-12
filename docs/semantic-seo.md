# Semantic content and topic relationships

The October 11 audit inspected 1,925 generated HTML documents. Among public
indexable documents, 750 lacked a WebPage topic (`about`), all lacked
`relatedLink`, and Elmer/Elmeri shared a description because their Finnish
genitive is identical. The `/liputuspaivat` redirect document has no page body;
it is deliberately excluded from the content-page audit. Existing canonicals,
page titles and page-specific calendar facts were generally consistent.

`src/data/pageTopics.js` maps registered public pages to 18 existing topic
guides. It supplies visible Finnish guidance, descriptive next-step links and
source references where applicable. Week ranges, calendar years, month lengths
and leap years come from the existing engine. Weeks crossing a year boundary
link to both relevant calendar months. Workday disclosures reuse `DAY_RULES`;
statutory leave, vacation planning, project/sprint and HR rules remain separate.

`TopicGuide` renders through the existing public route shell. Private app,
widgets, API endpoints and unknown routes receive no topic content. The sole
English page uses English copy and marks links to Finnish pages. Guides are
excluded from print outputs and do not gate tools or downloads.

Prerendering adds `about` and `relatedLink` to each existing WebPage node,
preserving original topics, hierarchy, application entities, FAQ, Event,
CollectionPage and media relationships. Topic identifiers and existing guide
URLs are documented in `data/knowledge-graph.json`. Visible links and schema
share the same data. No keyword-only pages, fake authors, fabricated legal
deadlines, unsupported ratings, invented prices or new indexable URLs are added.

The substantive new guide content has an explicit editorial change date.
Sitemap lastmod retains later reviews and daily content dates, does not advance
unchanged content on every build, and does not invent dates for assets.

Verification includes all registered-route coverage, invalid/private route
exclusion, Helsinki year boundaries, 2026-2028/leap-year facts, preserved
relationships, immutable modification dates, the existing full suite and
generated sitemap-page checks. Browser checks cover readable cards, keyboard
links, mobile overflow, print exclusion and unchanged company pricing.

The browser audit also found a pre-existing `/en` hydration mismatch when the
build machine and visitor were in different local calendar days. English text
now uses the shared Helsinki render-day store, and English metadata uses the
same date. A regression test covers Sunday in UTC becoming Monday in Helsinki
and hydration retaining the stored build day before switching to the live day.

The build continues to report missing licensed name-day data for 363 of 366
dates. Those rows remain hidden; the new guidance explains that missing data
does not imply there is no name day. Acquiring complete licensed data would
improve this topic more than publishing additional name-day pages.

Run `npm run test:predeploy` for the required release gate. Browser verification
uses `node scripts/semantic-seo.browser.mjs` against the existing preview server
on port 4173. Set `SEMANTIC_TEST_URL` for another origin, `PLAYWRIGHT_MODULE` to
an installed Playwright module and `CHROMIUM_PATH` to the browser executable.
The script checks 24 representative routes at two viewport widths and blocks
third-party tracking. Chromium checks do not establish Safari/Firefox coverage
or field Core Web Vitals.

Release checks: lint passed; 1,013 unit tests passed with nine existing skips;
production build and prerender passed; all 29 generated-artifact tests passed;
crawl validation reported zero render errors. All 1,026 public sitemap pages
have matching visible links and semantic topics, unique titles/descriptions
and one canonical. A comparison with the prior build preserved every existing
schema node identifier and type across those pages. All 48 representative
Chromium layout/navigation checks passed without JavaScript errors.

This improves content connections and machine-readable meaning. It does not
guarantee rankings, rich results or topical authority. Authority also depends
on useful original content, maintained sources, reputation and reader trust.
Search Console changes require subsequent measurement; no sitemap submission
or indexing request is made by these changes.

References checked 2026-10-11:

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://www.iso.org/iso-8601-date-and-time-format.html
- https://almanakka.helsinki.fi/fi/liputus-ja-juhlapaivat/
- https://www.finlex.fi/fi/lainsaadanto/2005/162
