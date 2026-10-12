# Search Console URL review, 2026-10-12

The operator reported four URLs as "Crawled - currently not indexed".
All four were checked directly on production and returned HTTP 200 at their
original addresses. None was missing or required a replacement route.

| URL | Finding | Change |
| --- | --- | --- |
| `/pyhat-2027/vappu` | Prerendered Finnish HTML, self-canonical, index/follow, real inbound links and sitemap inclusion already present. | Add useful Vappu eve, five-day work-calendar implications, sourced flag-day information and a nearby-year comparison. Keep the URL and existing schema types. |
| `/data/flag-days/index.json` | Valid JSON manifest with `years`; absent from sitemap. | Add a scoped noindex response header for data-family manifests. |
| `/data/monthly-working-days/index.json` | Valid JSON manifest with `months`; absent from sitemap. | Same manifest rule; preserve JSON payload and downloads. |
| `/data/quarter/index.json` | Valid JSON manifest with `quarters`; absent from sitemap. | Same manifest rule; preserve JSON payload and downloads. |

The shared Vercel rule `/data/(.*)/index.json` sets
`X-Robots-Tag: noindex, follow` on family file lists, including nested year
lists. It does not redirect
them to HTML or hide them in robots.txt. Redirecting a working machine API
would break clients expecting JSON. The human-readable search destinations
remain `/avoin-data` and the existing dataset documentation pages. Per-year
feeds, CORS, Dataset schema, AI resources and download URLs are preserved.

The Vappu content uses the existing holiday, flag-day, ISO-week and workday
engine. In 2026 it is Friday, week 18; in 2027 Saturday, week 17; in 2028 Monday,
week 18. The April 30 eve and comparison dates are derived from those values.
Weekend Vappu does not remove an additional Monday-Friday day in the site's
five-day calendar. This is explicitly a calendar calculation, not a claim
about pay, substitute days off, working-time obligations or a collective
agreement. Existing statutory-leave, project and sprint rules are unchanged.
The visible update date, WebPage/FAQPage dateModified and sitemap lastmod use
the actual Vappu review date, not each future build date.

Official references checked on 2026-10-12:

- [Google Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en): crawled/not-indexed is not evidence of a missing route and indexing is not guaranteed.
- [Google robots response-header documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag): non-HTML noindex uses X-Robots-Tag and must remain crawlable.
- [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): redirects consolidate retired/equivalent URLs, not an automatic fix for an otherwise useful crawled page.
- [Finlex flag-day decree 383/1978](https://finlex.fi/fi/lainsaadanto/1978/383): Vappu is the Finnish work flag day. Classification and alternative name are consumed from `flagDaysInYear()`, not duplicated calculations.

Regression coverage includes 2026-2028 weekday/week/eve facts, unchanged
non-Vappu pages, generated-horizon link bounds, snippet budgets, factual
modification dates, all manifest targets, MIME/CORS/noindex scope, unchanged
Dataset discovery, schema/visible FAQ equality, sitemap eligibility and actual
inbound links. The full release gate is required before deployment.

After deployment, check live response headers and HTML again. Search Console
can retain old statuses until recrawling. The manifests should eventually be
reported as deliberately excluded by noindex; do not request their indexing.
The Vappu page remains eligible for URL Inspection/live testing and a manual
indexing request. Resubmitting an unchanged sitemap cannot force indexing.
This task does not claim that Google has already indexed the page.

Local verification completed on 2026-10-12:

- Lint, 1,068 unit tests in 91 files, production build, 35 generated-artifact
  checks, SSR rebuild and crawl passed. Nine pre-existing tests requiring
  licensed name-day data remain skipped.
- Six Vappu desktop/mobile checks on the built site passed, including actual
  navigation to the monthly workday page, with zero JavaScript errors.
- Existing schema IDs/types remained present across 1,026 baseline pages.
- All 1,043 generated PDFs retained direct HTML download links and stayed
  outside the sitemap. No missing seasonal links or crawl render errors.

Browser check command (also usable against the live domain after promotion):

```sh
INDEXING_TEST_URL=http://127.0.0.1:4173 node scripts/indexing.browser.mjs
```
