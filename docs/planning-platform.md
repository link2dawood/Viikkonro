# Viikkonro Planning Platform

The shared foundation under every calendar and planning product on
viikkonro.fi: the free tools that exist today and the paid products planned on
top of them. It is plain JavaScript (ES modules, JSDoc types) in
`src/platform/`, with no new dependencies, no backend, no accounts and no
database. It runs in the browser, in `prerender.js` and in any future
serverless function unchanged.

Status: foundation only. No new product, page, route or URL is part of it.

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
| `business/products.js` | The catalogue of 13 platform products with hypothesised, unvalidated prices |
| `business/licensing.js` | Licence shape and "is it active / does it unlock this feature" |
| `analytics.js` | Platform event builders with a fixed, privacy-safe tag list |

Import everything from `src/platform/index.js`, or from the specific module.

## Dependency rules

- `platform/**` may import from `src/data/` and `src/components/dateUtils.js`.
- `src/data/` may import only the leaf modules `platform/export/*`,
  `platform/planners.js` and `platform/analytics.js`. Those import nothing that
  imports back, so there are no cycles.
- Nothing in `platform/` imports React or touches the DOM except
  `export/download.js` (browser only, by design).
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

Accounts, organisations, a database, payment, server-side licence verification
(a licence object is client data and can be forged, so licensing may only
decide what to *show*), a PDF renderer for company calendars, and any AI. Each
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
2. **`CalendarYear.jsx` builds its own month grid** (`buildMonth`) instead of
   using `monthRows()`.
3. **Two sources for holidays and flag days.** The Excel CSV and several pages
   use `juhlapaivat.js` (`getJuhlapaivat`, `getLiputuspaivat`); the platform and
   the ICS feeds use `holidays.js` and `flagDayPages.js`. They agree today but
   are not one source.
4. **`prerender.js` is over 6,000 lines.** The dataset XML writer and
   `xmlEscape` duplicate what `export/xlsx.js` does, and `weekWorkingDaysCount`
   re-implements the working-day rule (also noted in its own comment).
5. **`plannerCreatedEvents` in `src/analytics.js`** follows the same pattern as
   `platformEventCommands`. It is left alone because its output is read by
   dashboards and tests.
6. **Planner pages hard-code their `planner_type` strings** instead of reading
   `analyticsType` from the registry.
7. **Pre-existing, not from this work:** Clarity logged 6 sessions with React
   hydration error #418 in the last 30 days.
