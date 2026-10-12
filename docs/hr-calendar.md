# Viikkonro HR Calendar

Route: `/hr-kalenteri`. Browser-only, Finnish-first editor; no accounts, storage, payment backend or personal data fields. Refresh clears the draft. Free PDF, Excel and private all-day ICS exports.

## Reusable modules

- `src/platform/hr/eventTypes.js`: seven configurable HR types, four origins and shared warnings.
- `config.js`: versioned serialisable configuration, validated dates, unique row IDs, 250 records, 400-day periods, reference required for agreement-origin rows. User entries cannot become verified statutory dates.
- `statutory.js`: reviewed system-owned source registry, optional annual leave year and leave-season boundary reminders for 2026, 2027 and 2028. Further years require source review.
- `model.js`: composes the existing holiday, calendar, ISO-week and day-rule engine. Official holidays exclude Christmas and midsummer eves; those can be entered as company dates. No payday shifts or leave entitlement calculations.
- `exports.js`: shared XLSX writer, RFC 5545 writer and planning PDF renderer. Origin, applicability warnings, legal references and review dates accompany records. Excel contains every calendar day, including leap day. Full notes appear in PDF instructions; compact tables may abbreviate long cells.

## Legal scope

Verified on 2026-10-10 against [Finlex, Annual Holidays Act 162/2005](https://www.finlex.fi/fi/lainsaadanto/2005/162), section 4 definitions and section 30 agreement exceptions. The reminders describe period boundaries, not reporting/payment deadlines. They do not calculate employee entitlements or determine the employer's applicable agreement. No legal compliance guarantee.

Payroll deadlines, paydays, communication dates and company vacations are supplied by the user. Agreement rules are not generated; their reference and validity must be checked by the user. No recurring legal deadlines, tax filings or employer-specific exceptions are inferred.

## Privacy and integration

Clarity masks all draft/preview DOM. Analytics carry only fixed event names, editor source, year and export format. No free text, company names, references or complete dates. Private ICS uses a random browser-session namespace with stable row IDs and no public URL or subscription endpoint.

SEO uses the existing route metadata, canonical, sitemap, FAQ/HowTo prerendering and AI indexes. The calculators hub and HR template link to the page.

Next: add a separately reviewed rule registry for specific payroll reporting obligations, including scope, exemptions, official source version and holiday adjustment tests before enabling automated reminders.

## Changed files and verification

New: `src/pages/HrCalendar.jsx`, `src/pages/HrCalendar.test.jsx`, `src/components/hr/hr.css`, `src/data/hrCalendar.js`, the five HR modules above plus `hr.test.js`, `scripts/hr-calendar.browser.cases.mjs`, and this document.

Integration: `src/AppRoutes.jsx`, `src/data/seo.js`, `src/data/sitemapMetadata.js`, `src/analytics.js`, `src/platform/analytics.js`, `src/platform/planners.js`, `src/platform/business/products.js`, `src/platform/platform.test.js`, `src/platform/templates/catalog.js`, `src/pages/Calculators.jsx`, `prerender.js`, `public/ai.txt`, `public/llms.txt`, `scripts/predeploy-build.cases.mjs`, and `docs/planning-platform.md`.

Validation on 2026-10-10: ESLint passed; 758 tests in 72 files passed with PDF tooling enabled and four Vitest workers. The initial unrestricted worker run hit an existing PDF stress-test timeout; no test or timeout was changed. Production build prerendered 1,919 routes. All 17 generated-artifact checks passed. Crawl covered 2,281 URLs with zero render errors, unreachable sitemap URLs or links to 404 pages; all 1,043 existing PDFs remained linked.

Browser checks passed in development and production: nine downloads per run across 2026, 2027 and 2028; Finnish PDF text extraction, print output, mobile width, TES reference validation, masked DOM, coarse analytics, hydration and static content without JavaScript. Independent Python icalendar and ZIP/XML parsing verified three ICS files and three XLSX files, unique UIDs, all-day exclusive ends, every annual date and absence of spreadsheet formulas.

Known limits: manual company/TES rules, no automatic statutory payroll deadline calculation, four optional sourced period-boundary reminders only, no persistence or calendar subscription hosting. The pre-existing missing licensed name-day data warning remains unchanged.
