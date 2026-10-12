# Growth and SEO, Phase 15

Reviewed 2026-10-11. This phase connects existing public tools to existing
planning products. It adds no routes, keyword landing pages, popups, prices,
payment providers or tracking dependencies. Product launch flags and free
downloads are unchanged.

## Audit before edits

The audit covered the route dispatcher, shared shell, SEO constitution,
prerender and sitemap generators, redirects, static data, calendar and export
consumers, analytics/consent, public product editors, private entry boundaries,
and every generated HTML page. Existing earlier-phase changes were preserved.

- 1,925 generated HTML files, 1,026 sitemap URLs and 2,283 crawl targets.
- No missing indexable titles/canonicals, duplicate titles or invalid JSON-LD.
- `/liputuspaivat` deliberately redirects to the current year's canonical page.
  Its shared canonical and absence of a WebPage node are intentional.
- Crawl: no broken links, unreachable sitemap URLs, redirect-only internal
  links, render errors, language/schema mismatches or pages beyond three clicks.
- All 1,043 generated PDFs have internal links and stay outside the HTML sitemap.
- Robots and private/widget noindex boundaries are intact. No public private
  company URLs are introduced.
- Short contact and countdown/tool pages serve real purposes. Word counts alone
  do not establish thin content. The missing licensed name-day data remain an
  existing limitation: 363 of 366 dates lack licensed names; no names are invented.
- Existing planning links were sparse, and analytics used separate product events
  without a shared attribution contract.
- Baseline browser audit: 16 representative pages at desktop and mobile widths,
  no JavaScript errors. The printable calendar overflowed at 375px. The fix uses
  screen-only responsive grid rules; the six-column printed layout remains.

The local baseline observed LCP up to 760ms and CLS up to 0.0032, with third-party
requests blocked and no network/CPU throttling. These are laboratory observations,
not production Core Web Vitals, INP or a field performance verdict. Measure real
production traffic in Search Console/CrUX and check ads/Clarity before drawing a
field conclusion. See [Core Web Vitals](https://web.dev/articles/vitals).

## Intent and destinations

| Public surface | Destination |
| --- | --- |
| Calendar, year and ISO week pages | Company Calendar preview |
| Printable calendar and print pages | Company Calendar logo/own-day preview |
| Working-day year pages | Existing Project Planner |
| Public holiday and payday year pages | Existing HR Calendar |
| Vacation planner | Public Team Leave guide |
| Project and sprint planners | Their existing structured editor and downloads |

`src/platform/growth.js` is the small shared intent and funnel model.
`GrowthCTA` prerenders accessible links, uses Finnish copy and is hidden when
printing. Planner links are native same-page anchors, placed after the free
calculator and before the existing editor. Other cards follow the public page
content. Existing inline company-calendar links keep their legacy events.
Invalid year/week routes, English/health pages, private workspaces and widgets
receive no cards. Dates still use the existing validation/ISO engine.

## Funnel contract

Existing product events are bridged to:

1. `growth_landing`: a supported public acquisition page was visited. This does
   not by itself claim the visitor came from organic search.
2. `growth_cta`: a contextual product link was clicked.
3. `growth_start`: the product's existing first-edit/start event, or a template CTA.
4. `growth_preview`: an existing valid-preview event. Project/sprint editors now
   send `planning_suite_preview` after a valid edited preview settles for 600ms.
5. `growth_export`: successful export/download, never an attempt.
6. Purchase: deliberately inactive. Redirects, development unlocks and the legacy
   unverified `purchase` event are excluded. A future provider adapter must verify
   the server-side purchase before its authorized public receipt confirmation can
   add this stage. Do not emit a purchase on checkout navigation.
7. `growth_repeat`: another product start after a completed export in the same
   loaded public application. This is not cross-session retention.

Each active stage also has a product-specific event, such as
`growth_export_company-calendar`. Use those events for product-specific funnels
so visits to different products cannot falsely complete the same funnel.

Only catalogue product IDs and enumerated page families are sent as
`growth_product`, `growth_source`, and their combined `growth_path`. No year,
query string, company name, logo, label, note, employee information or form field
is read by this model. Sources and completion flags live in session memory,
with no new cookie/localStorage/sessionStorage identifiers. Full reloads and new
tabs reset attribution; exports in the same loaded app can establish repeat use.
Legacy analytics remain available, but are not evidence of paid conversion.

Configure [Clarity funnels](https://learn.microsoft.com/en-us/clarity/setup-and-installation/funnels)
using the active events. Break reports down by the enumerated source/path tags
and Clarity's existing
[device and country/region filters](https://learn.microsoft.com/en-ca/clarity/filters/clarity-filters).
No geolocation API, IP storage, inferred country or additional personal identifier
is added. Filter existing referral/search information to analyze SEO acquisition.
Clarity tags are session filters, not an event-level revenue warehouse; do not
interpret a global session containing multiple products as product conversion.
Third-party dashboard configuration requires access to the site's Clarity project.

Public Team Leave CTAs stop at the informational guide. Authentication, team
planning, client calendars, API calls and private exports remain analytics-free.
There is no private product-start, purchase attribution or repeat-user metric.
Country/device segmentation is unavailable for these private workflows by design.

## Verification and files

- `src/platform/growth.test.jsx`: route, SSR, catalogue-ID, attribution, dedup,
  export/attempt, repeat, privacy and private-boundary tests.
- `scripts/growth-build.cases.mjs`: prerendered links/canonicals/free PDFs for
  2026-2028, inline editor anchors and excluded private/health/widget pages.
  Included in the existing predeployment artifact gate.
- `scripts/growth.browser.cases.mjs`: desktop/mobile cards, actual print styles,
  free PDF availability, company CTA/start/preview, project/sprint Excel downloads,
  no private query/form data in analytics and no JavaScript errors.
- Existing complete unit suite, lint, production build/prerender, generated
  artifact tests and full crawl remain required.

Run the browser checks against a production preview:

```sh
CALENDAR_TEST_URL=http://127.0.0.1:4173 \
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
CHROMIUM_PATH=/path/to/chrome node scripts/growth.browser.cases.mjs
```

Final verification: 907 unit tests in 80 files, 22 generated-artifact tests,
lint and production build/prerender passed. All 170 isolated database
authorization/tenant assertions passed. Production browser checks passed all
22 desktop/mobile and print cases, the free PDF/CSV/print controls, company
CTA/start/preview attribution and both planner Excel exports, with zero
JavaScript errors. Local observations: LCP up to 676ms, CLS up to 0.0074;
the field-performance limitations above still apply.
Final crawl: 2,283 URLs, zero broken links or render errors, 1,026 sitemap
URLs and all 1,043 generated PDFs linked.

Changed integration files: `src/AppRoutes.jsx`, `src/analytics.js`,
`src/platform/analytics.js`, `src/components/CompanyCalendarLink.jsx`,
`src/components/planning/PlannerEditor.jsx`, the existing vacation/project/sprint
pages, `src/App.css`, `package.json`, this document and the platform guide.
Added shared files: `src/platform/growth.js`, `src/platform/growth.test.jsx`,
`src/components/GrowthCTA.jsx`, `src/components/growth.css` and the two checks above.

Next: review this phase, configure product-specific Clarity funnels, and establish
production field metrics. Activate one verified payment integration and one
product before adding revenue conversion. Resolve the existing licensed-data and
large export-bundle limitations separately. No other phase is started here.
