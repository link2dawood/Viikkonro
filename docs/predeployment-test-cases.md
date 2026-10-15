# Predeployment test cases

Run the complete release gate with:

```sh
npm run test:predeploy
```

The command stops on the first failure. It runs lint and unit tests, creates the
production build, executes the generated-artifact cases below, rebuilds the SSR
bundle removed by prerendering, and completes the internal crawl check.

| ID | Test case | Required result |
| --- | --- | --- |
| PD-01 | Render critical Finnish and English landing pages | Each page has a targeted title, description, self-canonical, indexable robots state, and one visible H1. |
| PD-02 | Inspect the production sitemap | URLs are unique and use the production origin; required pages are present and PDFs are absent. |
| PD-03 | Parse generated JSON-LD | Parity, school-holiday, and workday pages contain their required WebPage, Article, FAQPage, and breadcrumb types. |
| PD-04 | Inspect cross-year week links | A normal week has seven valid alternatives; week 53 never links to a year without ISO week 53. |
| PD-05 | Inspect the 2028 school-holiday page | All five official city sources, the unknown-coverage notice, and the review date remain visible. |
| PD-06 | Inspect PDF output and Vercel headers | At least 1,000 PDFs remain generated and each PDF family maps to its matching HTML canonical. |
| PD-07 | Inspect the English surface | `/en` retains English document signals and reciprocal hreflang, and the Finnish site links to it. |
| PD-08 | Scan deployable text artifacts | No unresolved merge marker reaches generated HTML, XML, text, or JSON. |
| PD-09 | Inspect `/yrityskalenteri` | One H1, a self-canonical, indexable, WebPage, FAQPage, HowTo and breadcrumb schema, the watermarked free preview, a sitemap entry, links from the calendar and print pages, and its own styles (no other page carries them). |
| PD-19 | Inspect AdSense wiring | Every content page carries the loader and the ownership meta; `404.html`, the meta-refresh redirect, the private app and the widget carry no ad code; no prerendered ad unit; `dist/ads.txt` matches `public/ads.txt` and names the publisher; the reported CSP allows the ad origins; printed pages hide ad containers. |
| PD-10 | Scan production scripts | No script contains the development unlock or its text; the PDF library is a separate chunk that the entry script neither embeds nor preloads. |

The crawl phase separately requires every sitemap page within three clicks,
zero linked redirects or 404 pages, correct week metadata, valid English
signals, zero PDF sitemap entries, and a direct HTML download link for every
generated PDF.

The GitHub Actions workflow `Predeployment tests` runs this gate for every pull
request to `main`. It has read-only repository permission and performs no
deployment, sitemap submission, indexing request, or external write.

## Complete release checklist

Updated 2026-10-11. A passing unit suite is not proof that browser controls are
styled, that payment works, or that invoices reach an inbox. Record the commit,
environment, browsers, viewport, test outcome and evidence for each relevant case.
Do not mark an unrun check as passed. Product-specific cases are required when
that product or its shared dependencies change. The general UI, build, privacy,
navigation and SEO checks apply to every release.

### Commands and environments

```sh
npm run test:predeploy
npm run test:team:database
```

The database command creates and removes a disposable PostgreSQL cluster. It
does not migrate or clear a production database. Set `TEAM_POSTGRES_BIN` when
PostgreSQL binaries are not in `/usr/lib/postgresql/16/bin`.

Browser tests are separate from `npm run test:predeploy`; CI also runs the targeted UI regression harness and database authorization checks. Install Playwright in
an isolated test environment and set `PLAYWRIGHT_MODULE` to its importable module
path and `CHROMIUM_PATH` to its browser executable. Serve the production build
with the actual deployment rewrites. Vite preview alone does not implement flat
HTML rewrites; the audit harness compensates for this on localhost.

```sh
UI_TEST_URL=http://localhost:4173 node scripts/ui-regressions.browser.mjs
UI_AUDIT_URL=http://localhost:4173 node scripts/ui-audit.browser.mjs
```

The audit checks every generated site HTML route at 390px and 1280px, stores JSON
outside `dist`, and flags potential issues for review. It intentionally does not
submit forms, enter private records, initiate purchases or send emails. Flags
are not all defects: inspect intentional small text controls, scrollable tables,
redirects and private-entry exceptions. It does not replace visual inspection,
keyboard testing, functional exports, Firefox/WebKit or authenticated tests.

Existing feature harnesses:

| Area | Harness | Required setup / caution |
| --- | --- | --- |
| Company calendar | `scripts/company-calendar.browser.cases.mjs` | `CALENDAR_TEST_URL`, `CALENDAR_TEST_MODE=production`; Production assertions expect the active purchase flow; tests do not submit a purchase. |
| Company ICS | `scripts/company-ics.browser.cases.mjs` | Same production setup; verifies locked exports and active purchase instructions. |
| Templates | `scripts/templates.browser.cases.mjs` | Production URL and browser/PDF tools as documented in `docs/templates.md`. |
| Vacation Pro | `scripts/vacation-pro.browser.cases.mjs` | Production must remain locked; development unlock is local-only. |
| Project and sprint | `scripts/planning-suite.browser.cases.mjs` | Production URL, browser and PDF text tools. |
| Construction | `scripts/construction-calendar.browser.cases.mjs` | Production URL and PDF text tools. |
| HR | `scripts/hr-calendar.browser.cases.mjs` | Production URL and PDF text tools. |
| Team leave / shifts | `scripts/team-leave.browser.cases.mjs` | Test-only Supabase HTTP fixtures; `TEAM_TEST_URL` points to the private entry build. SQL authorization tests are additionally required. |
| Multi-company workspace | `scripts/business-platform.browser.cases.mjs` | Self-contained temporary build/server with synthetic role fixtures. |
| Widget | `scripts/business-widget.browser.cases.mjs` | Uses temporary embed hosts; `WIDGET_PLAYWRIGHT_MODULE` and `WIDGET_CHROMIUM` are supported. |
| Growth / performance | `scripts/growth.browser.cases.mjs` | Production URL; includes lab observations, not real-user Core Web Vitals proof. |
| Live Supabase | `scripts/supabase-live.cases.mjs` | Administrative credentials, explicitly isolated temporary accounts/organizations and cleanup; no emails. Run on staging before production verification. |

### UI, accessibility and navigation

| ID | Test case | Required result |
| --- | --- | --- |
| UI-01 | Visit every generated HTML route with JavaScript enabled | No broken route, uncaught JavaScript error or hydration mismatch. |
| UI-02 | Check 320, 390, 768, 1280 and 1440px widths | No body overflow, clipped headings, overlapping controls or inaccessible actions. Tables may scroll inside their wrappers. |
| UI-03 | Check public header, footer and main | Exactly one shared header/footer/main; widgets are deliberately chrome-free and private entry uses its isolated shell. |
| UI-04 | Compare all planner fields, buttons and selects | Existing fonts, colors, spacing, borders and reusable components; no unintended native gray buttons or thin native selects. |
| UI-05 | Inspect free vacation comparison tables | Both year tables occupy the full container; explanatory text may keep a reading-width limit. |
| UI-06 | Test mobile menu open, close, link and keyboard behavior | Links reachable, expanded state correct, no trapped focus or content obstruction. |
| UI-07 | Activate private-to-public navigation | Full document navigation leaves the private entry; no private session data appears on public pages. |
| UI-08 | Tab through forms and controls | Logical order, visible focus, no keyboard trap; Enter/Space operate native buttons. |
| UI-09 | Inspect form names with screen-reader tools | Every input/select/textarea has an associated accessible label; each action has an accessible name. |
| UI-10 | Inspect heading order, landmarks and duplicate IDs | One page H1, sensible section hierarchy, valid unique IDs and working label targets. |
| UI-11 | Inspect contrast and target sizes | WCAG AA contrast where applicable; controls meet the 24px minimum or valid spacing exception, with 44px preferred for major touch actions. |
| UI-12 | Zoom to 200% and test reflow at 400% | Content and controls remain usable without losing information; data tables may use local scrolling. |
| UI-13 | Test empty, invalid, loading, busy and error states | Clear Finnish guidance; errors associated with inputs; disabled/busy actions prevent duplicate submissions. |
| UI-14 | Add, edit and remove rows in every planner | Correct row changes, focus remains usable, dependent rows protected, no stale preview. |
| UI-15 | Use long Finnish names, labels and notes | Wrapping preserves controls and table structure; no clipped essential information. |
| UI-16 | Test PNG, SVG, no logo and invalid logo | Valid logos render; invalid files rejected; no script execution; missing logo keeps a useful layout. |
| UI-17 | Check consent banner and its saved choices | Banner usable on mobile, choice persists, tracking stays disabled until consent; private app has no public consent/tracking initialization. |
| UI-18 | Inspect print preview | Site chrome, forms and download actions hidden; selected schedule shown without truncation or unexpected empty pages. |
| UI-19 | Inspect Finnish and English routes | Finnish default remains; `/en` keeps English navigation and metadata. Browser automatic translation is not a source-language defect. |
| UI-20 | Check homepage directory and related tools | Every existing tool has a real link; links resolve, exclude self links, use appropriate year and intent, and never reveal private company records. |
| UI-21 | Test Chromium, Firefox and WebKit | Equivalent core functionality; note browser-specific native date controls rather than treating locale rendering as incorrect data. |
| UI-22 | Check images, icons, font load failures and reduced motion | Useful alt text, no essential information only in color, fallback fonts usable and animations respect preferences. |

### Calendar and Finnish date rules

| ID | Test case | Required result |
| --- | --- | --- |
| DATE-01 | Run 2026, 2027 and 2028 through each engine consumer | Same underlying holidays, dates and ISO weeks across tools and exports. |
| DATE-02 | Plan across 29.2.2028 and reject 29.2.2026/2027 | Leap day included exactly once in 2028; invalid dates rejected. |
| DATE-03 | Cross December/January and ISO week-year boundaries | Dates and week-year labels correct; no missing or duplicate days. |
| DATE-04 | Compare Finnish public holidays, Easter and movable holidays | Existing authoritative day engine reused without duplicated calculations. |
| DATE-05 | Toggle holidays and flag days independently | Only selected event types included; no duplicate event labels/IDs. |
| DATE-06 | Toggle school holidays and region | Only sourced/applicable coverage appears; unknown or estimated dates remain clearly identified. |
| DATE-07 | Select statutory vacation versus planner workday rules | Saturdays, Christmas Eve and Midsummer Eve follow the explicitly selected rule; statutory, project and sprint rules remain distinct. |
| DATE-08 | Enter weekend/public-holiday paydays | Shift only under an explicitly selected supported rule; HR custom dates do not silently move. |
| DATE-09 | Use date ranges, overlapping events and closures | Inclusive ranges correct, intersections retained without accidental duplication, invalid reversed ranges rejected. |
| DATE-10 | Test Helsinki midnight and DST transitions from other timezones | Correct Finnish calendar date with no drift; all-day dates never become a neighboring day. |
| DATE-11 | Leave tab open at Helsinki midnight and revisit stale prerender | Date/week update without hydration mismatch. |
| DATE-12 | Test year limits, empty values and invalid numeric inputs | Validation consistent and no impossible or unsupported route/output generated. |

### Products, planners and outputs

| ID | Test case | Required result |
| --- | --- | --- |
| TOOL-01 | Build company calendar with minimal inputs | Sensible defaults, live preview and prominent ISO weeks; no account needed. |
| TOOL-02 | Build all three company layouts | Year overview, month-per-page and week list reflect the same events and branding. |
| TOOL-03 | Free company preview versus purchased export | Preview watermarked/limited; purchased selected-year output carries branding and has no watermark. |
| TOOL-04 | Template catalog and every template page | Substantive unique content, correct preview, category and format, real downloadable assets. |
| TOOL-05 | Template year and format combinations | Every advertised asset exists and opens; 2026-2028 supported as advertised. |
| TOOL-06 | Vacation periods, absences, people and closures | Correct totals/overlaps and shared view; free tool still works; Pro remains accurately marked as not on sale until launched. |
| TOOL-07 | Project phases, milestones and dependencies | Dates recompute correctly; dependency cycles and unsafe removal blocked. |
| TOOL-08 | Multiple sprints and sprint lengths | Sequential start/end, workday counts and ISO weeks correct, including holidays and year boundaries. |
| TOOL-09 | Construction tasks, deliveries, inspections and shutdowns | Weekly/overview switch matches export; manual weather notes remain manual with no weather API. |
| TOOL-10 | HR event origins and legal reminders | Generic, company, verified statutory and TES-specific events remain separate; provenance and warnings retained. |
| TOOL-11 | Reload, restore and clear local drafts | Only documented local retention occurs; restore code restores purchase entitlement, not draft contents. |
| TOOL-12 | Run large inputs and maximum rows | Useful validation or output; no browser crash, duplicate rows or hidden essential content. |
| EXP-01 | Download every advertised format using actual UI | Correct extension, MIME type and nonempty valid file; buttons return from busy state. |
| EXP-02 | Open PDFs and extract Finnish text | ä, ö and å and long labels readable; fonts embedded and no missing glyphs. |
| EXP-03 | Inspect A4 portrait/landscape PDF layouts | Correct orientation, margins, page breaks and ISO weeks; no text collision or cut-off rows. |
| EXP-04 | Open XLSX in Excel and LibreOffice | Valid workbook, useful sheets/headers, dates and Finnish characters correct; no repair warning. |
| EXP-05 | Open CSV in Excel/Sheets | UTF-8, quoting/newlines and delimiters preserved; no formula injection from user text. |
| EXP-06 | Validate/import ICS in Google, Outlook and Apple | RFC 5545 escaping, CRLF/folding, UTF-8, stable UID, exclusive all-day DTEND and correct timezone semantics. |
| EXP-07 | Re-export modified ICS and overlapping events | Stable event identity, appropriate update metadata, no accidental duplicates. |
| EXP-08 | Export a year-boundary leave/closure/project | Correct date coverage and no truncated end date. |
| EXP-09 | Print from browser versus downloaded PDF | Both preserve the chosen layout and hide editor/site controls. |
| EXP-10 | Inspect every free PDF/template link | Direct HTML discovery, correct canonical response headers and no obstruction by a paid CTA. |
| EXP-11 | Simulate failed export/network response | No corrupt download, clear retry guidance and busy state released. |
| EXP-12 | Export private/employee views | Output contains only authorized organization/client/member data, including notes and sensitive absence statuses. |

### Billing, invoices and promotional consent

Use provider sandbox and deterministic fixtures for purchases/refunds. Do not
make real charges, refunds or test emails part of an unattended build. A real
purchase/inbox acceptance test is a separately authorized operational check.

| ID | Test case | Required result |
| --- | --- | --- |
| BILL-01 | Read launched product catalog | EUR, authoritative price and selected-year one-time contract; unpublished products cannot be bought. |
| BILL-02 | Open hosted checkout | Correct product/year/price, billing details requested, no card data stored by Viikkonro. |
| BILL-03 | Cancel checkout or return unpaid | No entitlement granted; draft retained and retry remains possible. |
| BILL-04 | Return from successful sandbox checkout | Server verifies authoritative order; redirect parameters cannot grant access. |
| BILL-05 | Forge return, restore cookie/code, price or year | Request rejected; no export entitlement gained. |
| BILL-06 | Send unsigned/invalid/stale webhook | Rejected without data or entitlement changes. |
| BILL-07 | Replay a valid webhook concurrently | Exactly one purchase record/job; no duplicate entitlement or invoice. |
| BILL-08 | Restore purchase in another browser | Private restore code works for the purchased year; code never sent to analytics or owner BCC. |
| BILL-09 | Purchase-year expiration | Access ends at the documented Helsinki year boundary; other years remain locked. |
| BILL-10 | Full and partial refund | Full refund revokes exports; partial refund follows the existing explicit policy; invoice/outbox state updates safely. |
| BILL-11 | Subscription trial, expiration and cancellation in engine fixtures | Correct effective status/dates; cancellation does not automatically erase already-paid access. No unlaunched subscription is advertised. |
| BILL-12 | Upgrade/downgrade and usage limits in engine fixtures | Entitlements and effective periods change predictably; no privilege escalation or reset abuse. |
| BILL-13 | Inspect purchase database privacy | Allowlisted billing fields only; no raw card/provider payload, logos, company-calendar events or restore bearer codes exposed. |
| BILL-14 | Inspect optional promotional checkbox | Unchecked by default; purchase possible without consent. |
| BILL-15 | Change consent while reusing checkout | Consent/version/server timestamp match the selected checkout; stale consent not reused. |
| BILL-16 | Withdraw marketing consent and replay webhook | Withdrawal persists; later retries never resubscribe the recipient. |
| BILL-17 | Verify Mailjet production credentials and active sender | API authenticates and sending address active in the same connected account; secrets remain server-only. |
| BILL-18 | Verify actual invoice email after authorized completed purchase | Official Polar PDF reaches buyer; owner receives BCC at configured address; no CC or open/click tracking. API acceptance alone is not inbox delivery. |
| BILL-19 | Fail invoice generation/email and retry | Durable outbox releases failed claims; bounded retries/replay supported; no invented invoice or duplicate email. |
| BILL-20 | Crash after email acceptance but before recording completion | Deduplication prevents repeated recipient email on replay. |
| BILL-21 | Full refund with pending invoice job | Unsent job safely cancelled; billing record updated. |
| BILL-22 | Submit cross-origin, malformed, oversized or repeated commerce requests | CSRF/body checks and rate limits enforced; response contains no internal credentials or stack trace. |

### Private teams, shifts and multi-company authorization

| ID | Test case | Required result |
| --- | --- | --- |
| SEC-01 | Anonymous private access, signup, login and logout | No private records before authentication; authorized login works; logout clears private state. |
| SEC-02 | Password recovery success/error and expired link | Clear status, proper recovery flow, no token leakage and no false success on failed mail send. |
| SEC-03 | Owner, manager and employee operations | Each can perform only documented actions; UI restrictions also enforced by database. |
| SEC-04 | Organization A access to B IDs | Reads/writes/exports/RPCs denied; no count or record leakage. |
| SEC-05 | Firm/client role access across client companies | Client A cannot access B; firm-level permissions do not grant unintended cross-firm access. |
| SEC-06 | Invitation token reuse, expiry and role escalation | Invalid requests rejected; token confidential; intended membership only. |
| SEC-07 | Organization/client switch while requests pending | Old tenant response cannot populate the newly selected tenant. |
| SEC-08 | Logout/role removal while save/export is pending | Stale callback cannot restore private data or privileges. |
| SEC-09 | Concurrent edits and version mismatch | Stale update rejected or explicitly resolved; no silent overwrite. |
| SEC-10 | Leave overlaps, closures and team coverage | Monthly/yearly totals and coverage indicators correct; sensitive absence reasons hidden from unauthorized viewers. |
| SEC-11 | Shift overlap, availability and midnight spans | Conflict detected accurately across dates/ISO weeks; no unsupported working-time compliance claim. |
| SEC-12 | Employee edits and notes | Employee cannot edit others' shifts/leaves or read private coworker notes. |
| SEC-13 | Reusable templates, branding and exports across clients | Correct source/target permissions, no private field copied to the wrong client. |
| SEC-14 | Audit/export history | Server records allowed action and actor; users cannot forge/delete history to bypass rules. |
| SEC-15 | Private headers/caching/indexing | no-store, noindex and intended CSP/frame protections; private records absent from sitemap, prerender, static feeds and widget URLs. |
| SEC-16 | Static assets, logs, analytics and browser storage | No server keys, card data, private event titles, company names or bearer codes; session handling matches documented privacy policy. |
| SEC-17 | Stored/reflected XSS, hostile SVG and formula payloads | Treated as data/rejected; cannot execute in UI, exports or recipient applications. |
| SEC-18 | Test database under real role grants | Tenant isolation holds for direct SQL/RPC access, not just mocked browser restrictions. |

### API, embeds, analytics and release operations

| ID | Test case | Required result |
| --- | --- | --- |
| API-01 | Every advertised `/api/v1/*` route | Predictable versioned JSON, ISO dates, consistent engine and documented scope. |
| API-02 | Missing/invalid/revoked API key | Rejected without exposing internal structures or sensitive details. |
| API-03 | Free/paid usage limit and concurrent requests | Atomic limit enforcement, appropriate 429/retry response, no charging before launch policy permits it. |
| API-04 | Invalid dates, unsupported years and malformed requests | Consistent 4xx errors; no raw database or stack traces. |
| API-05 | Provider/database outage and monitoring | Safe error response, no false success, privacy-preserving monitoring and operational signal. |
| API-06 | Cache/key boundaries and documentation examples | Authenticated responses not shared across tenants; examples resolve and never include real credentials. |
| WID-01 | Iframe and custom-element embed in an external host | Responsive, accessible week/date/holiday rendering; no site chrome or unnecessary tracking. |
| WID-02 | Widget year boundary, Helsinki date and DST | Correct Finnish date and ISO week despite embedding browser timezone. |
| WID-03 | Theme, branding, multiple widgets and container resize | Independent instances, correct layout, no host-style corruption. |
| WID-04 | Cross-origin messages, malicious event text and premium flags | Origin/source checks; no XSS or client-side entitlement bypass. |
| WID-05 | Private calendar identifiers in embed/API URLs | Private company data never published through public links. |
| ANA-01 | Consent denied versus accepted | No analytics before permission; essential tools still work. |
| ANA-02 | Product view/start/preview/export/purchase events | Correct registered event, no repeated effect events or accidental false purchase. |
| ANA-03 | Inspect event payloads and funnel dimensions | Only allowlisted page family, device, country/year/layout/format; no company/person/event/logo data. |
| ANA-04 | Follow free-tool CTAs | Relevant intent, no intrusive popup and no blocked free download. |
| SEO-01 | Titles, descriptions, canonicals and robots on every page family | Correct self-canonical and indexability; duplicate/redirect/private pages treated deliberately. |
| SEO-02 | Sitemap, hreflang and structured data | Unique valid URLs, correct English reciprocity, visible FAQ matches schema and no private/thin pages added. |
| SEO-03 | Internal links and generated assets | Zero linked 404/redirect defects; current/promoted years supported; every advertised free asset discoverable. |
| SEO-04 | Direct HTTP response MIME types | HTML documentation, including `/data/week`, `/data/month`, `/data/year`, `/data/holiday` and `/data/working-days`, returns `text/html`; JSON/CSV/XML assets retain their own correct types. Test direct visits and hard reloads as well as SPA navigation. |
| PERF-01 | Cold-cache mobile performance and heavy planners | Record lab LCP/CLS and interaction responsiveness; no unexpected PDF-library preload or major bundle/DOM regression. |
| PERF-02 | Real-user Core Web Vitals | Review available field data separately; passing headless lab tests does not prove field LCP/INP/CLS. |
| REL-01 | Build/prerender/artifacts/crawl and lint | All required commands green; no missing files, merge markers or unresolved errors. |
| REL-02 | Production environment and migrations | Correct linked project, browser-safe publishable config, encrypted server keys and applied reviewed migrations. |
| REL-03 | Source/deploy match | Deploy the reviewed commit only; exclude local credentials, drafts and unrelated line-ending changes. |
| REL-04 | Protected deployment smoke tests before promotion | Core routes, checkout availability, private login shell, free downloads and headers work. |
| REL-05 | Actual-domain tests after promotion | Repeat critical UI/navigation/download/auth checks, confirm live commit, and verify CDN/header behavior. |
| REL-06 | Rollback and scheduled rebuild source | Known safe rollback; automatic rebuilds use reviewed source and cannot silently revert CLI-only changes. |

### Additional generated-artifact coverage

The existing suite also contains PD-11 through PD-19 (FAQ landing, templates,
ICS guide, Vacation Pro, planning suite, construction, HR, private app and
AdSense wiring), plus
shared chrome, widget isolation, homepage/tool-directory and contextual-link
checks. Keep the executable expectations in `scripts/predeploy-build.cases.mjs`
and `scripts/growth-build.cases.mjs` aligned with this checklist. Do not silently
remove an invariant to make a build pass.

Accessibility test references checked 2026-10-11:
[W3C target size minimum and exceptions](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
and [W3C reflow and two-dimensional table exceptions](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
