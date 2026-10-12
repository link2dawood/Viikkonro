# Vacation Planner Pro

The existing `/lomasuunnittelija` free calculator remains available. The annual
editor below it is a consumer of the existing calendar engine, not a new route.
Person labels, periods, notes and closures stay in browser memory. Saving a
draft is an explicit action that writes only to this browser's localStorage.
There is no remote personal storage or team collaboration.

## Ownership and rules

- `src/platform/vacation/config.js`: versioned planner configuration, strict
  row/identity/date validation and local draft serialization.
- `model.js`: annual per-person totals, overlap handling and shared calendar.
- `exports.js`: native-date Excel sheets and private ICS files.
- `pdf.js`: existing calendar PDF plus a paginated report of all periods/notes.
- `vacation.test.js`: configuration, counting, overlap and artifact tests.
- `src/components/vacationPro/VacationPro.jsx` and `vacationPro.css`: structured
  annual editor, masked preview, local draft controls and premium export UI.
- `src/pages/VacationPlanner.test.jsx` and
  `scripts/vacation-pro.browser.cases.mjs`: SSR and browser regressions.

The editor offers `FINLAND_PLANNER` or `FINLAND_STATUTORY_LEAVE` explicitly.
Availability uses `FINLAND_PLANNER`, subtracting closures and the union of
absences/vacations. Statutory vacation consumption is not reduced by company
closures. Annual totals clip to the selected year; exports retain complete
entered periods. Existing holiday calculations are reused unchanged.

Other files changed: `src/pages/VacationPlanner.jsx`,
`src/data/vacationPlanner.js`, `src/data/planningTools.test.jsx`,
`src/data/seo.js`, `src/platform/business/products.js`,
`src/platform/platform.test.js`, `src/platform/analytics.js`,
`src/platform/index.js`, `src/platform/render/pdf.js`,
`src/platform/export/companyIcs.js`,
`src/components/companyCalendar/Exports.jsx`, `prerender.js`, `public/ai.txt`,
`public/llms.txt` and `scripts/predeploy-build.cases.mjs`.

## Verification and limits

The completed vacation release gate passed 700 tests in 66 files, production
build/prerender, 14 artifact checks and a 2,279-URL crawl with zero errors.
Browser checks passed in development and production for 2026, 2027 and 2028:
free-calculator regression, explicit local save/clear, rule distinctions,
responsive preview, Finnish PDF text, Excel/ICS and the production export lock.
Production has no payment provider; premium exports cannot be purchased yet.
Development unlock is available only in a loopback development build.

Limits: 20 people, 100 periods and 50 closure ranges. The shared view is local,
not shared with other devices. Individual employment agreements and collective
agreements are not inferred. Calendar-grid working-day counts use the original
rule; person availability summaries separately subtract company closures.
PDF fonts support Finnish but not arbitrary emoji. No hosted ICS subscription.

Next: connect a real payment provider to the existing entitlement interface,
then add portable private configuration files before considering collaboration.
