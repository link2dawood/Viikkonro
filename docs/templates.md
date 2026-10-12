# Phase 2: downloadable planning templates

The Finnish catalogue is `/kalenteripohjat`. Six substantive landing pages
at `/kalenteripohjat/{slug}` cover company calendars, vacation cover, project
milestones, shift staffing, construction dependencies and HR/payroll tasks.
Every template is available for 2026, 2027 and 2028 in XLSX, CSV and PDF:
54 static assets generated under `dist/pohjat/{slug}/{year}.{format}`.
The initial collection is free. There is no account, checkout, database or
uploaded planning data. Existing consumer routes, exports and API redirects
continue to use their existing implementations.

## Ownership and reuse

- `src/platform/templates/catalog.js`: JSDoc Template model, six categories,
  Finnish copy, prices, applicability, previews, SEO and download manifests.
- `workbook.js`: composes the Phase 0 calendar config/model and day rules into
  useful daily or weekly planning rows. It adds blank fields, not another
  holiday engine. Dates include both ISO week number and ISO week-year.
- `pdf.js`: uses the Phase 1 calendar PDF for the annual calendar. Planning
  PDFs use a table renderer with shared PDF text handling and injected PDFKit.
  Landscape A4, repeated headings, writable cells, instructions and page numbers.
- Existing `export/xlsx.js` and `export/csv.js` serialize spreadsheets.
  XLSX has instructions, a frozen-header planning sheet and daily reference.
  CSV contains only the planning sheet, with UTF-8 BOM, semicolon delimiters,
  CRLF and formula injection protection. No macro or formula is supplied.
- `access.js`: `TemplateDownloadProvider.resolveDownload` is the entitlement
  seam. The static provider grants only declared free assets. Company calendar
  licences are not template entitlements. Future paid assets must be kept
  private and released by a trusted payment verification service. The build
  skips paid records; browser state never protects valuable public files.
- `schema.js`: catalogue CollectionPage/ItemList; detailed WebPage and
  CreativeWork, MediaObject and DownloadAction. Canonicals, sitemap, breadcrumbs,
  PDF alternates and response canonical Link headers share the asset manifest.
- `scripts/build-templates.mjs`: build-time asset generation called by prerender.
- `src/pages/Templates.jsx`: category/format filters, static table previews,
  year selection and downloadable links that also work without JavaScript.

`template_view`, `template_preview`, `template_cta` and `template_download`
use existing Clarity delivery. Only fixed catalogue ids, year and format are
sent. Preview fires when shown or its year changes. Download fires after a
valid file is received and handed to the browser. Modified clicks use native
navigation and do not claim successful downloads. No user input is collected.

## Content and date semantics

Vacation planning uses `FINLAND_PLANNER`; project, construction and HR weekly
rows use `FINLAND_WORKDAY`. Counts include only dates in the chosen calendar
year even when the ISO week's range includes adjacent-year dates. This is
described in the pages and instructions. Templates do not calculate statutory
leave consumption, validate shifts, issue approvals, set legal deadlines or
calculate payroll. Payroll dates and construction inspection fields are blank.

The PDF is a static original template. Spreadsheet edits are printed from
Excel or Sheets; they do not synchronize into the original PDF. Company
branding and custom company dates remain the Phase 1 builder's responsibility.
Use is allowed for personal and internal organizational planning, including
sharing a completed plan with the team; resale of the original template is
not granted. The terms are visible on every template page and in workbooks.

## Verification

Run `npm run test:predeploy`: lint, all Vitest tests, production client/SSR
build, prerender, artifact assertions and the existing crawl gate.
Template tests cover the model, access denial, filters, schema, all three
years, leap day, ISO boundaries, real XLSX/CSV output, all PDF variants and
Finnish PDF text extraction when `pdftotext` is installed. Artifact assertions
check all 54 files, substantive content, canonical/alternate links, sitemap,
structured data and AI discovery records.

Optional browser verification uses an isolated Playwright installation:

```sh
npm run preview -- --host 127.0.0.1
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/templates.browser.cases.mjs
```

`CHROMIUM_PATH` can point to an installed Chromium and `TEMPLATE_TEST_URL` can
override `http://127.0.0.1:4173`. The script verifies 18 actual downloads, all
54 asset responses, filters, year selection, preview, analytics, mobile width,
print rendering and a download without JavaScript. Screenshots and downloaded
files are retained in a temporary directory. It blocks external requests.

## Limits and next work

Years are explicitly curated through 2028: add/review later years in the
manifest before publishing them. The XLSX writer supports native date cells,
column widths and frozen headings but not formulas or rich per-cell styles.
CSV has no multiple-sheet support. PDF download analytics cannot confirm that
a user saved or opened the OS download. Real paid downloads need provider
verification and private asset delivery; no fake checkout is implemented.

Recommended next step: validate the six templates with Finnish business users,
refine the most-used workflow and test one XLSX with Excel and Google Sheets.
Choose payment, order fulfilment and licensing terms before adding paid records.
No Phase 3 functionality is implemented.

## Phase 2 file inventory

Added:

- `src/platform/templates/catalog.js`, `workbook.js`, `access.js`, `pdf.js`,
  `schema.js` and `templates.test.js`
- `src/pages/Templates.jsx` and `Templates.test.jsx`
- `src/components/templates/templates.css`
- `scripts/build-templates.mjs` and `templates.browser.cases.mjs`
- `docs/templates.md`

Updated:

- `src/AppRoutes.jsx`, `src/components/Footer.jsx`, `src/analytics.js`
- `src/data/seo.js`, `src/data/sitemapMetadata.js`
- `src/platform/analytics.js`, `src/platform/index.js`,
  `src/platform/business/products.js`, `src/platform/platform.test.js`
- `prerender.js`, `vercel.json`, `scripts/check-crawl.js`,
  `scripts/predeploy-build.cases.mjs`, `scripts/company-calendar.browser.cases.mjs`
- `public/ai.txt`, `public/llms.txt`, `docs/planning-platform.md`

Earlier Phase 0 and Phase 1 changes in the workspace are preserved.
The existing company-calendar browser test now waits for draft restoration
after reload before asserting the company input, avoiding a timing race with
the server-rendered watermark.
