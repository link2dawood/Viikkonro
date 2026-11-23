# noindex removal registry

This file is the only gate for removing a `noindex` directive from any page on
viikkonro.fi. The universal rule lives in
[`CLAUDE.md`](../CLAUDE.md#universal-rule-never-remove-a-noindex).

## How it works

1. A `noindex` stays in place everywhere until the affected page or route
   family appears in the table below, approved by the site owner. This applies
   to reintroducing one as much as to removing one: the table is the record of
   what the site's indexing policy is.
2. Once pages are listed, the removal is carried out for every listed page,
   across the whole site, in one change. No partial pass and no single-page
   exception.
3. A row is added only on an explicit owner decision recorded here. An audit,
   a growth plan, or a prior conversation is not an approval.
4. After a removal ships, keep the row and fill in the removal date, so the
   history stays auditable.

Removing a `noindex` also means the page becomes a real indexable page: it
needs a distinct intent, useful visible content, a self-canonical, appropriate
schema, sitemap eligibility, and crawlable internal links, per
[`docs/SEO_CONSTITUTION.md`](SEO_CONSTITUTION.md).

## Approved for removal

| Page or route family | Source of the noindex | Approved by | Approved on | Removed on |
| --- | --- | --- | --- | --- |
| Out-of-window dated pages (`/kuukausi-*`, `/vuosi-*`, `/tyopaivat-*`, and the other dated families) | noindex flip in `prerender.js`, `robotsFor()` fallback in `src/data/seo.js` | Site owner | 2026-11-23 | 2026-11-23 |
| School-holiday Tier B (estimated) pages | `robots: "noindex, follow"` in `src/data/schoolHolidayPages.js` | Site owner | 2026-11-23 | 2026-11-23 |
| Name-day pages with no seed data | conditional `robots` in `src/data/nameDayPages.js` | Site owner | 2026-11-23 | 2026-11-23 |
| The 404 document (`/404`, `404.html`) | noindex flip in `prerender.js`, `robots` prop in `src/pages/NotFound.jsx` | Site owner | 2026-11-23 | 2026-11-23 |
| Week widget (`/widget/viikko`) | meta robots in `src/data/weekWidget.js`, `/widget/(.*)` header | Site owner | 2026-11-23 | 2026-11-23 |
| Business calendar widget (`/widget/calendar/v1`) | meta robots in `scripts/build-business-widget.mjs`, `/widget/(.*)` header | Site owner | 2026-11-23 | 2026-11-23 |
| Generated PDFs (`/pdf/*`) | `X-Robots-Tag` on `/pdf/(.*)` in `vercel.json` | Site owner | 2026-11-23 | 2026-11-23 |
| Calendar subscriptions (`/ics/*`) | `X-Robots-Tag` on `/ics/(.*)` in `vercel.json` | Site owner | 2026-11-23 | 2026-11-23 |
| Template exports (`/pohjat/*`) | `X-Robots-Tag` on `/pohjat/(.*)` in `vercel.json` | Site owner | 2026-11-23 | 2026-11-23 |
| Data directory listings (`/data/index.json`, `/data/*/index.json`) | `X-Robots-Tag` rules in `vercel.json` | Site owner | 2026-11-23 | 2026-11-23 |

Every row above was removed in one pass on 2026-11-23. No page, prerendered
document, or downloadable asset family on the site is served `noindex` now.

## Still carrying a robots directive

Two sets were deliberately left in place.

The private team planner at `/tiimin-lomat/suunnittelu` keeps
`noindex, nofollow, noarchive` in both its entry document and its
`vercel.json` header. The site owner reviewed this on 2026-11-23 and kept it
as the single mandatory exception: the shell is an empty `<div id="team-root">`
plus one noscript line behind Supabase auth, so there is nothing to index and
an indexed URL would be a thin/soft-404 signal on the domain.

The rest are POST or authenticated JSON responses rather than pages, where the
header sits alongside `Cache-Control: private, no-store` as response hygiene:

- `/api/newsletter` and `/api/asset-404` header rules in `vercel.json`.
- `api/newsletter.js` and `api/asset-404.js` response headers.
- `src/platform/api/handler.js` (Business Calendar API responses).
- `src/platform/billing/http.js` and `src/platform/billing/withdrawal.js`.

Removing these needs its own approval row above.

## Where noindex comes from

Use this list when checking whether a change would touch a `noindex`.

- `NOINDEX_ROBOTS` and per-route `robots` values in `src/data/seo.js`.
- The noindex flips in `prerender.js` for out-of-window dated pages and the
  404 document, plus the `isIndexable()` windows `INDEX_MIN_YEAR`,
  `INDEX_MAX_YEAR`, and the week-page window.
- `X-Robots-Tag` response headers in `vercel.json`, including the bare
  `noindex` on `/pdf/(.*)` and the `/data/` and `/widget/` rules.
- `sitemapEntries()` eligibility in `src/data/seo.js`, which must stay
  consistent with the robots directives.
- The private app entry `tiimin-lomat/suunnittelu.html` and the generated
  business widget, which are excluded from indexing by design.
