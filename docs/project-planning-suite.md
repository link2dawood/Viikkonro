# Phase 5: Project Planning Suite

The existing `/projektiaikataulu` and `/sprinttisuunnittelija` routes retain
their free calculators. Structured extensions and PDF, XLSX and private ICS
exports run in the browser without accounts or remote plan storage.
No new routes, authentication, database or construction planner are added.

## Reusable architecture

`src/platform/planning/dates.js` owns working-day scheduling and ISO-week/month
grouping. Legacy `projectPlan` and `sprintPlan` remain adapters with their
original defaults and return shapes. All dates and exclusions use existing
`planningDates`, `dateUtils` and `dayRules` functions. Public holidays come from
`holidaysInYear`; there is no second Finnish holiday calculation.

`model.js` defines validated Planner, Phase and Milestone primitives, reuses
Sprint results and the existing Event primitive, and exposes WorkingDayRule.
Project dependencies form a finish-to-start DAG. Parallel phases may start
together; dependent phases start after all predecessors finish. Missing or
cyclic references and phases outside the entered project duration fail visibly.
Milestones can use a date or a phase's completion. Project/sprint rules remain
separate from vacation/statutory modes.

`exports.js` creates Excel summary/week/month/phase/milestone/sprint sheets and
consumes the existing XLSX writer, RFC 5545 serializer and planning-table PDF
renderer. Native Excel dates remain editable. PDF includes complete names and
notes in a paginated report. Private ICS uses random per-session namespaces,
stable row/sprint IDs, UTC stamps and exclusive all-day ends. DATE events do
not shift at DST. No private information appears in public URLs.

`src/components/planning/PlannerEditor.jsx` and `planning.css` provide shared
editor/export controls. The UI permits one predecessor per phase; the engine
accepts multiple predecessors. Limits: 30 phases, 50 custom milestones,
520 project working days, 26 sprints of 1-6 weeks. Sprint numbering is configurable.

Analytics: `planning_suite_created` and `planning_suite_export` send only a
fixed source, export type and year. Existing `planner_created` events remain.
Private editor/preview content is masked for Clarity.

## Files changed in Phase 5

New files:

- `src/platform/planning/{dates.js,model.js,exports.js,planning.test.js}`
- `src/components/planning/{PlannerEditor.jsx,planning.css}`
- `src/pages/PlanningSuite.test.jsx`
- `scripts/planning-suite.browser.cases.mjs`
- `docs/project-planning-suite.md`

Extended files:

- `src/data/{projectTimeline.js,sprintPlanner.js,planningTools.test.jsx,seo.js}`
- `src/pages/{ProjectTimeline.jsx,SprintPlanner.jsx,CalendarYear.jsx,WeekDays.jsx,WorkingDaysBetween.jsx}`
- `src/platform/{index.js,analytics.js,templates/pdf.js}`
- `prerender.js`, `public/{ai.txt,llms.txt}`
- `scripts/predeploy-build.cases.mjs`, `docs/planning-platform.md`

SEO keeps both existing canonicals, sitemap entries and matched visible/schema
FAQs. Calendar, week and working-day pages link to both planners. No thin
product landing pages are introduced.

## Known limits and next work

Verification: full release checks pass 722 unit tests in 68 files, lint,
production build/prerender, 15 artifact checks and a 2,279-URL crawl with zero
errors. All 1,043 generated PDFs retain direct HTML download links. The 18 new
engine tests cover 2026-2028, leap day, ISO week 53, maximum multi-year spans,
dependency errors, milestone anchoring and private export identities. Four SSR
tests cover existing routes, structured forms, SEO and privacy-safe analytics.
The engine and legacy regressions also pass under `TZ=Europe/Helsinki`.

Browser tests exercise both development and production, all three formats for
both planners in 2026-2028, Finnish PDF text, dependency validation, continued
numbering, responsive layout, privacy and production hydration. Independent
Python `icalendar` and ZIP/XML readers validated nine ICS and nine XLSX files
from planning and vacation exports. Finnish report text and PDF layout were
also inspected with Poppler. Existing licensed name-day data remains incomplete
(363 of 366 dates); this pre-existing build warning is unrelated to planning.

No resource allocation, dependency lags, critical path, drag/drop, accounts or
collaboration. Plans stay in memory and reset on reload; ICS identities are
stable within the session. ICS is a snapshot import, not a hosted subscription.
Some calendar applications may duplicate repeated imports instead of updating
matching UIDs. Actual calendar-account imports are not part of automated tests.
PDF table cells abbreviate long values; full phase/milestone names and notes
are included in the report. Finnish fonts do not cover arbitrary emoji.

Next: add versioned private plan import/export, preserving stable identities,
and expose explicit closure/capacity overrides through the shared rule engine.
Evaluate those before any future construction or collaboration product.
