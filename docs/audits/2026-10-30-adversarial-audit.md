# Viikkonro.fi adversarial audit - 2026-10-30

## Scope and method

Audit target: live `https://viikkonro.fi` at deployed commit `f57b848e04b870796a05d8182126ae4cdb597f6e` (PR #96), plus a clean checkout of that commit for deterministic static and browser checks. The developer workspace had unrelated uncommitted work; it was left untouched.

Scope covered public navigation, SEO and structured data, ISO date/week calculators, week pages, public data feeds and downloads, narrow-screen layouts, HTTP headers and anonymous access boundaries. No authenticated tenant flows, payment paths, or production writes were exercised. Live requests were GETs and browser-only calculator interaction. No forms were submitted.

Coverage: 88 public routes at 320, 390 and 1280 CSS px (264 route/viewport checks); 34 live HTTP boundary probes; 1,925 generated HTML files and 1,496 sitemap URLs; 367,069 independently checked date/timezone cases; 175 solar-time cases; 83 CSV, 66 XML, 18 XLSX files, 1,061 PDF boundary checks and 835 week JSON records. ISO week/date checks and download structural checks passed. PDF checks validate signature/EOF and not visual rendering.

## Findings

### P1 - Oversized calculator values can blank or freeze the page

On live `/paivamaaralaskuri`, enter `1e308` in the day amount. The main page becomes blank after the calculation. In the isolated browser, `100000000` working days kept the renderer unresponsive for over five seconds until the browser watchdog stopped it. The working-day calculator loops once per day and has no bound; numeric validation checks finiteness but not a safe amount or resulting date range. A blank page/frozen tab blocks recovery and normal use.

Relevant code: `src/data/dateCalculator.js` (working-day loop and `calculate`), `src/pages/DateCalculator.jsx` (amount input and result rendering), `src/main.jsx` (root hydration). Fix by validating bounded integer amounts and representable dates before calculation, bounding the loop, and displaying a recoverable validation/error state.

### P1 - Client-side navigation leaves robots and JSON-LD from the previous page

Live reproduction: load `/kuukausi-10-2020` directly (noindex, no page schema), then use the header to go home. The homepage title, canonical and H1 update, but its robots meta remains `noindex,follow` and homepage schema is absent. A fresh direct load of `/` is indexable and has its schema. Separately, navigating from `/viikko-42-2026` to the calculators page leaves the week page's `#webpage` JSON-LD in the document.

This is a client-side navigation lifecycle defect; direct HTML responses tested correctly. It can expose wrong indexing directives or stale structured data to crawlers and browser consumers that inspect the post-navigation DOM. Relevant code: `src/components/SEO.jsx` and static JSON-LD generation in `prerender.js`. Update robots and page-level JSON-LD on every route transition, removing absent values, and verify both directions across indexable/noindex pages.

### P2 - Solar data uses the previous civil day for Finnish and other positive-offset visitors

Live `/viikko-13-2026`, first day 23 March 2026: UTC displays Helsinki sunrise/sunset `06.13–18.41`; Europe/Helsinki and Asia/Karachi display `06.16–18.39`. The latter values correspond to the prior civil date for Helsinki. In controlled tests, this mismatch appeared for every sampled date in Helsinki, Karachi and Kiritimati (105 of 175 cases) and not in UTC or New York. The code creates local midnight and passes that instant to SunCalc; the instant falls on the previous UTC date in positive-offset zones.

Relevant code: `src/data/sunTimes.js` (date construction and `getTimes`); `src/pages/WeekDays.jsx`. Calculate each intended location's date independently of the visitor timezone and test across SSR/hydration and daylight-saving changes.

### P2 - Missing static assets receive a one-year immutable browser cache

A live GET for a deliberately nonexistent fingerprint-like `/assets/...js` returned 404 with `Cache-Control: public, max-age=31536000, immutable` and equivalent CDN caching. Chrome DevTools Protocol showed the same 404 served from disk cache on the second and third request. A transient missing chunk can therefore remain broken in a user's browser for a year. This verifies negative caching for a missing asset; it does not indicate that a current production asset is missing.

Relevant code: `vercel.json` asset cache headers. Apply immutable caching only to successful fingerprinted assets and give error responses short/no-store caching. Regression check with a browser cache enabled, without request interception.

### P2 - Week calculator accepts fractional weeks and builds a dead URL

On `/viikko-paivamaaraksi`, enter week `1.5`, year `2026`. The input reports invalid, but the page still renders “Viikko 1.5/2026”, calculates a date range, and links to `/viikko-1.5-2026`, which returns 404. Form validity is not gating the calculation.

Relevant code: `src/pages/WeekToDate.jsx`. Require integer week/year values within the selected year's ISO-week range before showing results or links.

### P2 - Valid calculator answers link beyond the published page horizon

The current published week pages stop at 2035. On live calculators, a valid 2036 week or date is calculated but the resulting week link points to a 404. Reproductions: `/viikko-paivamaaraksi` with week 1/year 2036; `/paivamaara-viikoksi` with 1 June 2036. The date calculator also returns 1 January 2036 for 31 December 2035 plus one day and links to the missing page.

Relevant code: `src/pages/WeekToDate.jsx`, `src/pages/DateToWeek.jsx`, and `src/pages/DateCalculator.jsx`. Keep the computed answer, but only render an internal week-page link when that page exists within the published horizon (or expand the generated horizon).

### P2 - Two pages overflow horizontally at 320 px

The 320 px viewport has document `scrollWidth` 376 px on `/viikko-53-2026` and `/avoin-data`; both fit at 390 px. This clips/side-scrolls content on narrow phones. For the week page, the `.day` row and nonwrapping day heading are the protruding layout. The open-data page contains long inline API path examples that need wrapping or a contained code treatment.

Evidence: `mobile-week-overflow.png`, `live-mobile-week-overflow.png`; route/viewport details in `wide-ui.json`. Relevant CSS starts at `src/App.css:460`; the open-data path examples are in `src/pages/OpenData.jsx`.

### P2 - “Current year” changes early in UTC+14

At `2026-12-31T08:00:00Z`, Helsinki is still on 31 December 2026, but `/mika-vuosi-nyt` displays 2027 in `Pacific/Kiritimati`. Its year, week and quarter outputs shift early because the hook derives local calendar fields from a fixed instant. This affects the date boundary for the UTC+14 population and can produce inconsistent “today” values across users.

Relevant code: `src/components/dateUtils.js` and `src/hooks/useToday.js`. Define the intended reference timezone for “today” (likely Helsinki for this Finnish service) and derive all current-date facts from the same civil date.

### P3 - Years 0001-0099 silently become 1901-1999 in date conversion

On `/paivamaara-viikoksi`, entering `0099-01-04` displays 4 January 1999 and week 1/1999. JavaScript's multi-argument `Date` constructor remaps years 0-99 into 1900-1999. This is a rare boundary but a silent century-scale result. Reject years outside the supported range or construct/validate the requested year without the 1900 offset.

Relevant code: `src/pages/DateToWeek.jsx` and date constructors in `src/components/dateUtils.js`.

### P3 - 414 generated JSON-LD references point to omitted page nodes

Static artifact scan found 414 `#webpage` references across 153 distinct target IDs where the target HTML exists but, because it is noindex, has no matching page-level JSON-LD node. Samples include holiday pages pointing to a noindex year-holiday hub and archive-year nodes referring to month/quarter pages without those page nodes. The JSON is parseable; this is a graph-integrity/schema reference issue, not evidence of a Google indexing failure.

Relevant code: `prerender.js` `entityParentExtra`, `weekCollectionNodes`, and the schema emission guard. Preserve the intended noindex policy while either emitting the referenced entity nodes on archive pages or removing links to undeclared nodes. Add a generated graph check that every local `#webpage` target resolves.

## Passed checks and exclusions

- Independent ISO week/year/Monday oracle: zero mismatches over 367,069 representable date/timezone cases from 1900 through 2100.
- Generated data exports passed the stated structural and date-range checks.
- All 34 HTTP probes matched expected status/header boundaries, including noindex manifests, private no-store responses, anonymous API rejection, and GET rejection for newsletter submission.
- Static client assets referenced by generated HTML were present in the scanned build. The missing-asset test above deliberately used a nonexistent URL.
- The contact page's unlabelled text field is an `aria-hidden`, `tabIndex=-1` bot honeypot and was excluded as a scanner false positive.
- Correct canonical behavior after SPA navigation was explicitly checked and is not a finding. A prior network-idle timeout on the Company Calendar page was a harness artifact and is not reported.

## Evidence bundle

The companion ZIP contains raw JSON results, screenshots, and the browser/oracle/download audit scripts. Some scripts use the isolated audit environment paths and are preserved as run; the report records the target commit and measured results. Production code and deployment were not changed during this audit.