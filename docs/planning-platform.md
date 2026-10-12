# Viikkonro Planning Platform

The shared foundation under every calendar and planning product on
viikkonro.fi: the free tools that exist today and the paid products planned on
top of them. It is plain JavaScript (ES modules, JSDoc types) in
`src/platform/`, with no new dependencies, no backend, no accounts and no
database. It runs in the browser, in `prerender.js` and in any future
serverless function unchanged.

Status: foundation only. No new product, page, route or URL is part of it.

Company calendar Phase 1 is documented separately in
[`company-calendar.md`](company-calendar.md). Its existing route consumes the
foundation; the catalogue marks it `preview` while production payment remains
unavailable. Future planned products still have no routes.

The repository already includes `/yrityskalenteri`, its editor and preview,
browser PDF rendering, and a development-only export unlock. These predate
this foundation maintenance. Production payment remains unavailable. Future
products should reuse these modules without adding checkout, accounts or a
database as part of a foundation change.

## Layers

```
 Finnish calendar data        src/data/holidays.js, flagDayPages.js, paydayPages.js
        |                     (existing, owns every date rule)
 Day rules                    src/data/dayRules.js: which days count, per mode
        |
 Platform                     src/platform/
   calendar/   config -> events + periods -> sources -> model
   design/     branding, themes, layouts
   export/     ics, csv, xlsx, download, calendar (model -> files)
   business/   products, licensing
   planners.js analytics.js
        |
 Products (existing + future)  /lomasuunnittelija, /projektiaikataulu,
                               /sprinttisuunnittelija, company calendar, ...
```

A product is a thin layer: it builds a **configuration**, asks the platform for
a **model**, and renders or **exports** it. Nothing else computes a date.

## Day rules: one definition of "which days count"

`src/data/dayRules.js` has no universal working day on purpose. Each tool names
its mode, and the page shows the rule (`DayRuleNote`).

| Mode | Counts | Used by |
| --- | --- | --- |
| `FINLAND_STATUTORY_LEAVE` | Leave days under the Annual Holidays Act: Saturdays count | `/vuosilomalaskuri` |
| `FINLAND_PLANNER` | Monday to Friday; both eves and all holidays are off | `/lomasuunnittelija`, calendar default |
| `FINLAND_BANKING` | Banking days (same set as the planner, its own reason) | paydays (`nonBankingReason`) |
| `FINLAND_WORKDAY` | Monday to Friday except statutory holidays; eves work | `/tyopaivalaskuri` |
| `FINLAND_PROJECT` | As workday, project scheduling | `/projektiaikataulu` |
| `FINLAND_SPRINT` | As workday, sprint planning | `/sprinttisuunnittelija` |

`src/platform/planners.js` is the registry that ties a planner to its URL and
mode. The data modules read both from it. A new planner is one registry entry.

`summarizeDayRange(mode, from, to)` in `dayRules.js` counts an inclusive
range and returns `{ counted, days, weekdayExclusions }`. Vacation planning,
sprint capacity and calendar leave periods consume it. It advances calendar
dates rather than elapsed milliseconds, so DST does not alter the number of
days. Callers validate dates; reversed ranges are empty. It does not add
company closures to a Finnish day rule: closures are events, and future
capacity products must explicitly decide how those affect scheduling.

## Modules

| Module | What it owns |
| --- | --- |
| `calendar/events.js` | The `CalendarEvent` model, validation, multi-day expansion, ordering, grouping, ICS mapping |
| `calendar/periods.js` | Closures, leave and seasons; counting a period's days under a day rule; overlaps |
| `calendar/sources.js` | Holidays, flag days, paydays and week numbers as events, wrapping the existing data |
| `calendar/config.js` | The validated, immutable, JSON-serialisable calendar configuration |
| `calendar/model.js` | `monthRows()` and `buildCalendarModel()`: months, ISO weeks, days, events |
| `design/branding.js` | Company name, logo (PNG/JPEG/SVG data URI, size and SVG safety checks), colours, contrast |
| `design/themes.js` | Named colour sets; `classic` equals the existing PDF palette |
| `design/layouts.js` | Paper sizes and page geometry; A4 `year-glance` equals the existing PDF grid |
| `export/ics.js` | RFC 5545 serialiser (moved out of `icsFeeds.js`, output unchanged) |
| `export/csv.js` | One CSV writer with the site's two dialects as options, and formula-injection protection |
| `export/xlsx.js` | Dependency-free `.xlsx` writer (several sheets, bold frozen header, widths, dates) |
| `export/download.js` | Browser file download for any export |
| `export/calendar.js` | A calendar model out as CSV, XLSX or ICS |
| `render/pdf.js` | Existing model-based PDF renderer with an injected PDFDocument constructor; exported by the platform barrel |
| `render/browserPdf.js` | Browser adapter that loads standalone PDFKit on demand and prepares logos |
| `business/products.js` | The catalogue of 13 platform products with hypothesised, unvalidated prices |
| `business/licensing.js` | Licence shape and "is it active / does it unlock this feature" |
| `business/payment.js` | Existing unavailable production provider and development-only testing provider |
| `analytics.js` | Platform and existing planner event builders; browser delivery stays in `src/analytics.js` |

Import everything from `src/platform/index.js`, or from the specific module.

## Dependency rules

- `platform/**` may import from `src/data/` and `src/components/dateUtils.js`.
- Keep imports narrow. Existing data adapters also use
  `calendar/sources.js` (company calendar) and `calendar/model.js` (print
  calendar). Check the dependency direction before adding an import; never
  import the platform barrel from a module on which the platform depends.
- Nothing in `platform/` imports React. `export/download.js` and SVG
  rasterisation in `render/logo.js` use browser APIs; the PDF browser adapter
  loads PDFKit dynamically. Pure model and serialization code needs no DOM.
- Every date rule lives in `src/data/` or `dayRules.js`. The platform wraps it.

## Saved configuration without a database

`configToJson()` and `configFromJson()` round-trip a calendar configuration
through plain JSON (dates as `YYYY-MM-DD`, versioned). That is enough for a
shareable link or a downloaded file until accounts exist.

## Adding a product

1. Add it to `business/products.js` (status `planned`, prices unvalidated).
2. If it counts days, add a mode to `dayRules.js` only if no existing mode fits,
   and register the planner in `planners.js`.
3. Build a configuration (`createCalendarConfig` or a planner module), render
   from the model, export through `export/`.
4. If it becomes an indexable page, follow `docs/SEO_CONSTITUTION.md` in full:
   route, metadata, schema, sitemap, internal links and AI files. The platform
   adds no URLs.
5. Send analytics only through `platformEventCommands` (never a company name,
   free text or a full date).

## Deliberately not built

Accounts, organisations, a database, production payment, server-side licence verification
(a licence object is client data and can be forged, so licensing may only
decide what to *show*), and any AI. Each
needs a decision that the first product should force.

## Verification of the extraction

The refactors that touched existing behaviour were checked against output
captured before the change: the ICS serialiser, the calendar CSV and the
banking-day rule are pinned by SHA-256 fingerprints in
`src/platform/export/export.test.js`; the dataset CSVs, ICS feeds, HTML pages
and PDF text were compared file by file between builds.

## Technical debt found

1. **PDF generators still live in `prerender.js`** (calendar, week and month),
   with their own palette and geometry. `design/themes.js` and
   `design/layouts.js` are pinned to those numbers by tests; the generators
   should move onto the platform once a company-calendar PDF needs them, with a
   text-comparison check.
2. **`CalendarYear.jsx` has its own calendar presentation** (`buildMonth`),
   while model-based exports use `monthRows()`. The existing UI is a day list,
   so replacing it with a week grid would require a deliberate UI decision.
3. **Two holiday representations.** The Excel CSV and several pages use
   `juhlapaivat.js`; the platform and ICS use `holidays.js`, with independent
   Easter arithmetic and different labels. Flag-day metadata is already an
   adapter: `flagDayPages.js` reads `getLiputuspaivat()` from `juhlapaivat.js`.
4. **`prerender.js` is over 6,000 lines.** The dataset XML writer and
   `xmlEscape` duplicate what `export/xlsx.js` does, and `weekWorkingDaysCount`
   re-implements the working-day rule (also noted in its own comment).
5. **Analytics tags rely on caller discipline.** Fixed tag keys exclude
   arbitrary properties, but allowed values are not fully validated.
   `plannerCreatedEvents` now lives in `platform/analytics.js` and is
   re-exported from `src/analytics.js`, preserving its dashboard contract.
6. **Planner pages hard-code their `planner_type` strings** instead of reading
   `analyticsType` from the registry.
7. **Configuration immutability is shallow.** Frozen objects contain mutable
   Dates and Maps. Treat models as read-only; persisted/untrusted input also
   needs more defensive shape validation before public API consumption.

## Maintenance verification

`src/data/dayRules.test.js` covers all six modes over leap-year and year
boundaries, eves, Saturdays, Easter, reversed ranges and DST weekends. Existing
planner tests preserve page examples and calculations. Platform analytics
tests pin exact legacy commands and compatibility imports. Existing export
fingerprints and PDF structure tests remain the export regression checks.
An additional comparison against Git HEAD matched 80 vacation plans and 576
sprint plans over 2020-2035. The range tests also passed with
`TZ=Europe/Helsinki` to exercise both DST transitions.

The static/free calendar pipeline remains independent: `AppRoutes.jsx`,
`seo.js`, `prerender.js`, static data feeds and `vercel.json` API redirects
retain their existing ownership. The newsletter function is existing
infrastructure and is unrelated to the planning engine.

Recommended next step: strengthen the versioned configuration's input shape
validation and decide closure/capacity semantics before a future product or
Business Calendar API accepts external configurations. Add the first new
product as a consumer of config, sources, model and exports after those
product requirements are agreed.

## Phase 2 consumer: planning templates

`platform/templates/` owns the static catalogue, planning workbook composition,
print tables, download provider interface and structured data. It consumes the
existing config/model/day rules, XLSX/CSV writers and calendar PDF renderer.
Six templates provide 54 downloadable assets for 2026-2028, with seven static
Finnish pages. See [templates.md](templates.md) for ownership, verification,
entitlement boundaries, usage terms and limitations. Existing planner products
continue to own their routes.

## Later consumers

The [growth and SEO audit](growth-seo-audit.md) documents contextual public CTAs,
privacy-safe funnel events and verification, with private analytics and real
purchase tracking deliberately excluded until their prerequisites exist.

The [commercial billing foundation](commercial-billing.md) uses the existing
product IDs with versioned plans, server-verified entitlements and provider
adapters. Products are not automatically launched and existing free access stays
unchanged.

- [Company ICS](company-ics.md) documents the private calendar export and subscription boundary.
- [Vacation Planner Pro](vacation-pro.md) documents annual planning, explicit rule selection and local personal data.
- [Project Planning Suite](project-planning-suite.md) documents the shared project/sprint engine, dependencies and exports on the existing free routes.
- [Construction Weekly Planner](construction-planner.md) documents the construction editor, shutdown overlays, print layouts and private exports at `/rakennuskalenteri`.

HR calendar consumer: [docs/hr-calendar.md](hr-calendar.md).

Authenticated team consumer: [docs/team-leave-planner.md](team-leave-planner.md).
Private shift workspace: [docs/shift-planner.md](shift-planner.md), sharing the same organization boundaries and export writers.
Multi-company workspace: [docs/multi-company-platform.md](multi-company-platform.md), with separate client roles, scoped templates, audit logs and export history.
The private app uses a separate entry and Supabase organization boundaries;
public calendars and free planners keep their existing static architecture.
