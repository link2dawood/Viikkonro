# Adversarial audit remediation status

Updated: 2026-10-30

## Active change

- First of 10 audit findings: bound date calculator inputs so extreme values cannot blank or freeze the page.
- Change: reject blank, fractional, unsafe, negative, and over-10,000 amounts; reject invalid start dates and unrepresentable results; display an accessible Finnish validation message.
- Branch: `fix/bounded-date-calculations-20261030`
- Worktree: `/tmp/viikkonro-adversarial-audit-20261030`
- Commit: `4b8da0f1c9f45aa33a3dd18d416633d48a05fe0d`
- PR: https://github.com/link2dawood/Viikkonro/pull/99
- Status: pushed; open; GitHub requires an approving review before merge. Do not bypass protection. Vercel preview succeeded. Production is not yet deployed.

## Verification

`npm run test:predeploy` passed locally: ESLint, Vitest, production build/prerender, 44 artifact checks, and crawl check (2,285 internal URLs crawled; zero unreachable, 404 links, or render errors). PR verify and GitGuardian checks passed; Vercel preview passed. `git diff --check` passed.

## Resume sequence

1. Wait for PR #99 to receive its required approval and merge. Then confirm the Vercel production deployment and live behavior for oversized and ordinary inputs.
2. Continue fixing the remaining audit findings one at a time, in report order:
   - SPA navigation retains stale robots directives and JSON-LD.
   - Sunrise/sunset shifts to the previous day in positive-offset zones.
   - Missing asset 404s get a one-year immutable cache.
   - Week calculator accepts fractional weeks.
   - Valid calculator answers link beyond the published week horizon.
   - 320 px overflow on `/viikko-53-2026` and `/avoin-data`.
   - “Current year” flips early in UTC+14.
   - Years 0001-0099 silently map to 1901-1999.
   - 414 local JSON-LD `#webpage` references target omitted noindex page nodes.
3. Keep each fix isolated, run required checks for the release path, push a PR, and wait for protected-branch approval before production deployment.

## Audit artifacts

- Full report: `docs/audits/2026-10-30-adversarial-audit.md`
- Evidence ZIP: `docs/audits/2026-10-30-adversarial-evidence.zip`
- Target audited: production commit `f57b848e04b870796a05d8182126ae4cdb597f6e`.

The original project checkout contains unrelated pre-existing untracked work (`src/data/longWeekends.js`, `src/data/longWeekends.test.js`, `src/pages/CalendarWave2027.test.jsx`). Leave it untouched. The audit worktree also has untracked audit reproduction scripts; only the two calculator source files were committed to PR #99.

## SEO keyword execution notes

User supplied the following intent priorities, based on their Search Console report. Keep related wording and spelling variants on one authoritative page; do not create a URL per keyword variant.

1. Week number intent: homepage and `/viikko-{week}-{year}` pages are the main answers. The featured FAQ now uses the exact wording “Monesko viikko nyt on?”.
2. Finnish public holidays: year hubs and dedicated holiday pages already exist. Yearly flag-day snippets now feature the computed Isänpäivä and Suomen lipun päivä dates.
3. Clock changes: `/kesaaika-{year}` already serves both seasonal events. Metadata keeps the autumn focus until 30 days after the autumn change and switches to date-appropriate past/future tense.
4. Calendars and school holidays: yearly calendar, school-holiday, workday, public-holiday, and clock-change pages already exist. The 2027 school-holiday snippet now explicitly answers Helsinki's confirmed ski-break week.

### Phase 2 route mapping

The proposed structures are intent suggestions, not required slugs. Use the existing canonical pages below; do not add duplicate aliases:

| Suggested intent | Existing page |
| --- | --- |
| `/viikkonumero/` | `/` and `/mika-on-viikkonumero` |
| `/pyhapaivat/` | `/pyhapaivat-{year}` |
| `/kalenteri/2027/` | `/kalenteri-2027` |
| `/hiihtoloma/2027/` | `/koululomat-2027` |
| `/tyopaivat/2027/` | `/tyopaivat-2027` |
| `/kesaaika-talviaika/` | `/kesaaika-{year}` |

These SEO edits are local and unpushed. `git diff --check` passed; the test suite has not been rerun since these edits.

### Phase 3 topical-authority focus

Expand and interlink the existing editorial clusters around:

- Finnish ISO week numbers and week/date interpretation.
- Finnish calendars, annual dates, and year-specific views.
- Public holidays and flag days, with clear distinctions between official holidays, flag days, and workplace days off.
- Working-day calculations and holiday planning.
- Printable weekly and yearly calendars and their downloads.

`src/data/pageTopics.js` already supplies contextual topic links for these hubs and their year-specific pages. Build authority by improving those existing pages and their sourced explanations instead of multiplying near-duplicate URLs. Deprioritize new benefit-payment keyword work (including “takuueläke 2027” and “lapsilisä maksupäivät 2026”) while retaining the current pages and functionality.

## Viikkonro.fi SEO growth and traffic plan

Saved from the user-provided plan. This is context only; targets are planning targets, not guarantees.

- Project: Viikkonro.fi.
- Reporting period: 2026-07-29 to 2026-10-28.
- Execution period: 6 weeks.
- Primary objective: increase organic traffic from Google Finland by improving existing search visibility, keyword targeting, CTR, and relevant calendar content.
- Baseline: 6,100 organic clicks; 1,320,608 impressions; 0.46% overall CTR; average position 7.3; Finnish organic clicks 6,041; mobile impressions 912,953; desktop impressions 396,107.
- Growth milestones: 6,000 monthly organic clicks (initial target), 8,000 (next milestone), and 12,000 (stretch target).
- Goals: grow Finnish week-number searches, calendar visibility, seasonal holiday/date traffic, and mobile search performance; improve existing landing pages without unnecessary duplicates; build topical authority around Finnish calendars and planning.
