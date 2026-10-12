# Phase 6: Construction Weekly Planner

`/rakennuskalenteri` is a Finnish construction schedule generator for site
management, construction companies, subcontractors and project coordination.
It adds a consumer of the existing planning engine, not a project-management
backend. The existing free tools keep their routes and calculations.

## Architecture and outputs

`src/platform/construction/config.js` owns a plain version-1 configuration:
project/site names, inclusive project period, layout, manual subcontractor and
weather notes, and stable-ID records. Six record types cover phases, weekly
tasks, milestones, deliveries, inspections and shutdowns. Point records require
one date; all records must fall inside the entered project period. Limits are
250 records, 1,096 calendar days, 100-character names and 1,000-character notes.
Unknown fields, including person fields, are not retained in normalized config.

`model.js` consumes `planning/dates.js` ISO grouping, `planningDates.js`,
`dateUtils.js`, `dayRules.js`, `holidaysInYear` and the existing closure Period
primitive. The rule is explicitly `FINLAND_PROJECT`. Project endpoints remain
exact, including weekends. Shutdowns subtract the union of affected working
days; weekends and public holidays are not subtracted twice. They never move
entered dates. Overlap notices are scoped to the selected week or whole project.
No Finnish holiday or ISO-week calculation is duplicated.

`exports.js` consumes existing XLSX, CSV, ICS and table-PDF renderers:

- Weekly PDF and browser print follow the selected ISO week.
- Overview PDF and browser print show the project and all its weeks/records.
- Both PDF layouts include full manual notes in a paginated report; table cells
  abbreviate long values. Finnish characters render with existing PDF fonts.
- Excel always includes the whole project in four sheets: project, ISO weeks,
  native-date records and holidays.
- CSV always includes the whole project, using UTF-8 BOM, semicolons, CRLF and
  formula-safe user text. Multi-week records repeat on every touched week.
- ICS always includes all records, holidays and ISO-week markers. Stable row
  UIDs use a random per-session namespace. DATE events have exclusive ends,
  UTF-8 text, UTC stamps and Europe/Helsinki calendar metadata. Files have no
  private/public subscription URL and no refresh directive.

`ConstructionCalendar.jsx` provides structured forms and immediate preview.
`ConstructionPreview.jsx` handles weekly/overview presentation. Print styles
use a named A4 landscape page and hide form controls and landing-page prose.
Names, notes and previews are masked for Clarity. Three requested analytics
events send fixed source, format, layout and year only.

There is no weather API, employee data model, account, database, remote save,
collaboration, auto scheduling or inference of legal inspections/obligations.
The tool is free and its existing product catalogue entry is now live.

## Files changed

New:

- `src/platform/construction/{config.js,model.js,exports.js,construction.test.js}`
- `src/components/construction/{ConstructionPreview.jsx,construction.css}`
- `src/pages/{ConstructionCalendar.jsx,ConstructionCalendar.test.jsx}`
- `src/data/constructionCalendar.js`
- `scripts/construction-calendar.browser.cases.mjs`
- `docs/construction-planner.md`

Extended:

- `src/AppRoutes.jsx`, `src/analytics.js`
- `src/data/{seo.js,sitemapMetadata.js}`
- `src/pages/{Calculators.jsx,ProjectTimeline.jsx}`
- `src/platform/{index.js,planners.js,analytics.js,platform.test.js}`
- `src/platform/business/products.js`
- `src/platform/templates/{catalog.js,pdf.js}`
- `prerender.js`, `public/{ai.txt,llms.txt}`
- `scripts/predeploy-build.cases.mjs`, `docs/planning-platform.md`

The PDF renderer's optional table groups preserve existing defaults. The new
route has canonical metadata, matched FAQ/schema, HowTo, breadcrumbs, sitemap
freshness, static HTML and inbound links from the calculator hub, project
planner and existing construction template. AI indexes/knowledge graph point
to the real page; private plans are not published as datasets.

## Verification and limits

The unit suite includes 22 construction engine/export tests and four SSR/SEO/
privacy cases. They cover 2026-2028, leap day, ISO week 53, year boundaries,
overlapping shutdowns, holidays/weekends, invalid/out-of-period input, many
tasks, stable ICS identities, formula-safe CSV and Finnish paginated PDFs.
The engine tests also pass with `TZ=Europe/Helsinki`.

`scripts/construction-calendar.browser.cases.mjs` checks development and
production hydration, all six input types, layout/week changes, real PDF/XLSX/
CSV/ICS downloads in both layouts for 2026-2028, private analytics, invalid
input, 320/390-pixel layouts, a one-page short weekly printout, default exports,
reload behavior and no-JavaScript production content. Exported ZIP/XML and ICS
are additionally checked with independent readers outside the runtime project.
The full release command is `npm run test:predeploy`.

Final release result: lint and all 748 tests in 70 files passed, production
build/prerender passed, all 16 generated-artifact checks passed, and the crawl
checked 2,280 URLs with zero errors and no pages beyond three clicks. The sitemap
contains 1,024 indexable HTML pages; all 1,043 existing generated PDFs retain
direct links. Both browser modes passed 24 export combinations plus a default
ICS export and print checks. Independent Python readers validated seven ICS,
six XLSX and six CSV files, including cross-layout identities and native dates.

Plans remain in memory and reset on reload. Download files before leaving.
ICS identities are stable only for the current editor session. Files can be
shared manually; they do not create a live collaboration space or subscription.
PDF fonts cover Finnish, but not arbitrary emoji. Working-day counts estimate
date availability, not labour/resource capacity. Existing missing licensed
name-day data is unrelated and remains unchanged.

Recommended next step: add private versioned plan import/export that preserves
record and calendar identifiers, then evaluate explicit phase dependencies and
capacity overrides using the shared planning engine. Keep weather integrations
and collaboration outside this phase.
