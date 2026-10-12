# Phase 3: Premium Company ICS Calendar

The Finnish-first editor is at `/yrityskalenteri/ics`. It extends
`/yrityskalenteri` with the same draft, calendar engine, export licence and
development-only local unlock. Consumer calendars and public ICS feeds keep
their existing implementation. No authentication, database, company hosting,
new runtime dependency or Phase 4 feature was added.

## Architecture

- `src/platform/export/companyIcs.js` adapts the existing calendar model to the
  shared RFC 5545 serializer. It emits public holidays, closure periods, company
  events, calculated or explicit paydays, selected flag days, available regional
  school holidays, leave seasons and Monday ISO week-number markers.
- A random calendar namespace lives in the existing browser draft. Company row
  IDs survive reload, edits and reordering. A cleared draft starts a new namespace.
  Separate company drafts therefore cannot collide when imported together.
- Monthly payday UIDs use the nominal payroll month, including January payments
  shifted into the previous December. Explicit payday UIDs use their retained
  form row IDs. Monthly rules become individual dated events, preserving the
  existing banking-day adjustments without an inaccurate RRULE.
- Identical same-kind records collapse. Distinct overlapping records remain.
  Conflicting duplicate identifiers fail rather than silently losing an event.
- DATE-valued DTSTART and exclusive DTEND preserve civil dates across Helsinki
  daylight saving. No TZID or VTIMEZONE applies to these all-day values. DTSTAMP
  is UTC. Finnish text uses UTF-8, escaped TEXT and CRLF lines folded at 75 octets.
- `CompanyCalendar` accepts `icsOnly` to reuse its validated editor, entitlement
  checks and local persistence. The ICS view hides logo, colour and print-layout
  controls and shows the same deduplicated events as the downloaded file.
- `IcsInstructions` and `src/data/companyIcs.js` provide Finnish instructions
  linked to official Google, Microsoft and Apple documentation. The same FAQ
  and how-to data feed the visible page and prerendered structured data.

## Subscription boundary and privacy

`COMPANY_SUBSCRIPTION` explicitly reports `available: false`, `mode: private-file`.
This static site cannot serve a changing private company feed without storing
company records and introducing access control. No company URL, token, public
asset or pretend blob subscription is created. Downloaded files omit event URLs
and subscription refresh hints. They are generated in the browser.

The guide links to the existing `/kalenteritilaus` page for genuine subscriptions
to general public holiday, flag-day and week-number feeds. Those feeds never
include company data. Importing a private file into a third-party calendar does
store its contents in that service; the guide explains this distinction.

Clarity masks the editor and preview. The new events are `company_ics_view`,
`company_ics_preview`, `company_ics_export_attempt`, `company_ics_export`,
`company_ics_cta` and `company_ics_subscription_help`. Only coarse year/source
tags are sent, alongside the existing company-calendar export events. No names,
event titles, full dates, logos or draft namespaces are analytics properties.

## Commercial boundary and limitations

ICS uses the existing `company-calendar` paid `ics-export` entitlement.
Production exports remain locked because no real payment provider exists.
Only loopback development can use the existing temporary test unlock; production
does not trust a forged local development licence. There is no fake checkout.

Stable UIDs do not guarantee that every application's file importer updates or
deletes earlier records. Import into a dedicated company calendar and replace
only that calendar's imported contents when needed. The guide warns against
deleting a calendar containing unrelated events. Clearing browser data loses the
calendar identity; blocked storage retains it only for the current session.

School-holiday coverage remains limited to the site's existing regional source
data. Timed appointments and hosted private subscriptions are not implemented.
No third-party calendar account was used to test a live import.

## Files changed in Phase 3

New:

- `src/platform/export/companyIcs.js`
- `src/platform/export/companyIcs.test.js`
- `src/data/companyIcs.js`
- `src/components/companyCalendar/IcsInstructions.jsx`
- `src/components/companyCalendar/IcsPreview.jsx`
- `src/pages/CompanyIcs.test.jsx`
- `scripts/company-ics.browser.cases.mjs`
- `docs/company-ics.md`

Extended:

- `src/pages/CompanyCalendar.jsx`
- `src/components/companyCalendar/Editor.jsx`
- `src/components/companyCalendar/Exports.jsx`
- `src/components/companyCalendar/formModel.js`
- `src/platform/export/ics.js`
- `src/platform/index.js`
- `src/platform/business/products.js`
- `src/platform/analytics.js`
- `src/analytics.js`
- `src/AppRoutes.jsx`
- `src/data/seo.js`
- `src/data/sitemapMetadata.js`
- `prerender.js`
- `scripts/predeploy-build.cases.mjs`
- `scripts/company-calendar.browser.cases.mjs`
- `public/ai.txt`
- `public/llms.txt`

## Verification

Run `npm run test:predeploy` for lint, the complete Vitest suite, client/SSR
production builds, prerendered artifact checks and crawl checks. New unit tests
cover 2026, 2027 and 2028, February 29, year-spanning closures, shifted January
paydays, stable row identities, draft migration, duplicate/overlapping events,
500 events, Finnish escaping/folding, privacy, SEO and Helsinki DST across host
timezones. Existing serializer fingerprints preserve public-feed output.

`scripts/company-ics.browser.cases.mjs` runs against local Vite or the production
preview using Playwright. Set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` if Playwright
is installed outside the repository. Set `CALENDAR_TEST_URL` and
`CALENDAR_TEST_MODE=production` for the built-site lock and no-JavaScript guide.
The check saves generated ICS files and screenshots under the system temporary
directory; external requests are blocked. The existing company-calendar browser
check still verifies its PDF, XLSX, CSV and ICS exports.

An independent Python `icalendar` parser can validate these temporary files
without adding an application dependency. It checks event parsing, unique UIDs,
UTF-8 text, DATE-only values, UTC DTSTAMP and inclusive closure coverage.

The completed checks pass 679 unit tests in 64 files, including 24 new Phase 3
tests, and 13 generated-artifact checks. The production crawl reaches all 1,023
sitemap URLs within three clicks, with zero render or internal-link errors and
all 1,043 existing calendar PDFs directly linked. Both development and
production browser checks cover the new ICS page; development downloads for all
three years also passed independent `icalendar` parsing. The build still reports
the existing lack of licensed name-day data for most dates; this unrelated data
gap was not changed by Phase 3.

The next commercial step is integrating a real payment provider through the
existing interface and issuing verified export entitlements. Hosted private
subscriptions require a separate storage/access-control design before they can
be offered; this phase intentionally leaves that capability unavailable.
