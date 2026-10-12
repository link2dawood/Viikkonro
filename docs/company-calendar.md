# Viikkonro Yrityskalenteri: Phase 1

The existing `/yrityskalenteri` route is the only product page. It has the
shared title, description and canonical in `src/data/companyCalendar.js` and
`seo.js`; `prerender.js` emits WebPage, FAQPage, HowTo and BreadcrumbList
schema. Existing calendar and print pages already link to it. This phase adds
no routes or dated product landing pages and leaves consumer tools unchanged.

## Product flow

Four numbered editor sections collect company details, closures/events and an
optional leave season, paydays, and Finnish holiday choices. The year selector
offers the current year and two following years. From October the site's
existing year policy starts with next year. The headline follows the selected
year; ISO week numbers are always enabled.

The free live preview shows the company name and entered dates with the
default palette, a watermark, and a logo placeholder. Each layout also has an
expandable list of all events, so compact previews cannot hide entries. PNG
and self-contained SVG logos are accepted up to 512 KB; company names allow
80 characters and event titles 120. Drafts stay in browser local storage and
can be cleared. Storage being blocked does not prevent editing.

Incomplete or out-of-year rows are excluded from the live preview with a
Finnish warning, but **block exports** until corrected or removed. Enabled
school holidays require a city with available data. An enabled leave season
requires a valid range. Recurring paydays require an integer 1-31 or the last
banking day; individual paydays remain on the exact dates entered. Closures
can overlap and cross year boundaries.

## Exports and reused engine

- `formModel.js` maps editor data onto the existing calendar configuration.
- `calendar/sources.js` wraps existing Finnish holiday, flag-day, school and
  payday modules; there is no new Finnish date calculation.
- `calendar/model.js` supplies Monday-first months, ISO weeks, day rules and
  event collections for every output.
- `render/pdf.js` renders the three layouts with injected PDFKit. It preserves
  Finnish characters and paginates full event titles into an appendix when
  compact month/week cells omit or shorten entries. Year-at-a-glance also
  includes an event appendix. Page counts therefore depend on the data.
- `render/browserPdf.js` loads standalone PDFKit only on export and rasterises
  SVG logos on the visitor's device.
- `export/calendar.js` produces XLSX (days, events and weeks), Finnish Excel
  CSV, and all-day ICS using the existing shared serializers. User text stays
  literal in XLSX and is protected against formula interpretation in CSV.
- `logoUpload.js` is the browser FileReader adapter. Uploads and restored drafts
  both use shared branding validation, including external-resource rejection.

Closures remain calendar annotations. Working-day totals describe the selected
Finnish day rule; they do not subtract company closures or calculate payroll,
staff availability or employee leave entitlement.

## Payment boundary

There is no payment service. Production uses `unavailableProvider`, restores
no licence from browser storage, and never produces a final export from the
page. The page states that payment is not yet available. No charge, receipt,
purchase or successful-payment event is simulated.

`PaymentProvider` in `platform/business/payment.js` describes checkout and
licence restoration for a future verified provider. The current development
provider works only in a development build on `localhost`, `127.0.0.1` or an
IPv6 loopback host. Click an export button, then **Avaa lataukset (testi)** to
test the branded preview and PDF/XLSX/CSV/ICS downloads. **Lukitse uudelleen**
clears that development licence. Production build checks ensure the testing
provider and UI text are absent from the deployed JavaScript.

Client licence objects are forgeable. This interface is a future integration
boundary, not payment enforcement; paid sales need provider-side verification.
No accounts, database or new backend is part of Phase 1.

## Analytics and company data

The page uses the registered view, started, preview, export-attempt,
PDF/XLSX/CSV/ICS-export and CTA events. Tags contain only layout, year, source
and export type. Company names, logos, date lists and free text are never
custom-event properties. Editor and preview content are explicitly masked
for session recordings with `data-clarity-mask="True"`, following
[Microsoft's masking documentation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking).
SVG logos must contain their own resources rather than fetch external images
or styles when drawn.

## Verification

Run the existing release gate:

```sh
npm run test:predeploy
```

Install `pdftotext` in the test environment to run the PDF text checks as well
as structural checks. They cover Finnish text, leap years, long names,
missing/PNG/SVG logo handling, many events, overlapping ranges, year boundaries
and all layouts for 2026, 2027 and 2028.

Optional Chromium checks are in `scripts/company-calendar.browser.cases.mjs`.
Playwright can be installed outside the repository; it is not an application
dependency. For example on Linux:

```sh
npm install --prefix /tmp/viikkonro-browser-check --no-package-lock --no-save playwright
node /tmp/viikkonro-browser-check/node_modules/playwright/cli.js install chromium
# Start npm run dev in another terminal, then:
PLAYWRIGHT_MODULE=/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs node scripts/company-calendar.browser.cases.mjs
# After the production build, start npm run preview in another terminal, then:
PLAYWRIGHT_MODULE=/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs CALENDAR_TEST_URL=http://127.0.0.1:4173 CALENDAR_TEST_MODE=production node scripts/company-calendar.browser.cases.mjs
```

The script tests actual uploads, local unlock, relocking, all download formats,
leap-day data, a closure crossing New Year, all PDF layouts, privacy-safe
event commands, mobile widths and watermarked print preview. Production mode
checks locked exports, rejected forged stored licences and hydration without
errors. Screenshots and development downloads are kept in a temporary folder
printed by the script. `CHROMIUM_PATH` can select an existing browser binary.

Known existing development debt: the shared hydration entry runs against
Vite's empty root and reports one recoverable hydration mismatch. The browser
check tolerates that specific development error; production permits none.

## Files changed in Phase 1

- `src/pages/CompanyCalendar.jsx`, `src/pages/CompanyCalendar.test.jsx`
- `src/components/companyCalendar/Editor.jsx`, `Exports.jsx`, `Preview.jsx`,
  `companyCalendar.css`, `formModel.js`, `formModel.test.js`, `logoUpload.js`,
  `logoUpload.test.js`
- `src/data/companyCalendar.js`
- `src/platform/business/payment.js`, `payment.test.js`, `products.js`
- `src/platform/design/branding.js`, `src/platform/platform.test.js`
- `src/platform/render/pdf.js`, `src/platform/render/render.test.js`
- `scripts/company-calendar.browser.cases.mjs`, `scripts/predeploy-build.cases.mjs`
- `docs/company-calendar.md`, `docs/planning-platform.md`

Earlier uncommitted foundation changes remain in the workspace and are covered
by the same full suite; Phase 1 does not discard or replace them.

Validation on 10 October 2026: all 614 unit/component tests passed with PDF
text extraction enabled; lint, production client/SSR/prerender build, all 11
artifact checks and the crawl check passed. The crawl reached 2,271 internal
URLs, found no broken links or render errors, and verified links to all 1,043
generated consumer PDFs. The Chromium development and production checks also
passed. Existing warnings about the PDFKit chunk, homepage description length
and limited licensed name-day coverage are unrelated to this product.

## Next phase

Choose and implement a real hosted payment provider with verified export
entitlement, then test the purchase, return, cancellation and expiry flows.
Confirm pricing before displaying it. Broader school-holiday coverage and
employee/team scheduling are separate product work and are not implemented.
