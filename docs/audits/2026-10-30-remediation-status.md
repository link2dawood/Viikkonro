# Adversarial audit remediation status

Updated: 2026-11-01

## Active change

- Finding 10 of 10 audit findings: "414 generated JSON-LD references point to omitted page nodes".
- Change:
  - In `prerender.js` and `src/data/pageJsonLd.js`:
    - In `entityParentExtra(url)`: for `/pyhat-(\d+)/...`, check `isIndexable('/pyhapaivat-' + year)`. If indexable, link to its `#webpage`; otherwise fall back to `${canonicalFor('/vuosi-' + year)}#webpage` (which is indexable across all supported years 2020-2035).
    - In `namedHolidayNodes(year, slug)` and `observanceNodes(url)`: only include `links.month.path#webpage` / `page.monthPath#webpage` in `mentions` if `isIndexable` is true for that month page.
    - In `weekCollectionNodes(pathname)`: filter `monthParts` and `quarterParts` by `isIndexable(p)` so `hasPart` only includes existing `#webpage` nodes, and omit `hasPart` entirely when no child parts are indexable.
  - In `scripts/predeploy-build.cases.mjs`, added predeploy test verifying that all local `#webpage` references in generated JSON-LD resolve to existing page nodes (0 missing references across all 1920 generated HTML routes).
- Branch: `fix/jsonld-unresolved-webpage-nodes-20261101`
- Status: verified locally; all tests, build, artifacts, and crawl checks passing.

## Verification

`npm run lint`, `npx vitest run`, `npm run build`, `npm run test:predeploy:artifacts`, and `npm run check:crawl` all passed:
- ESLint: zero errors, zero warnings.
- Vitest: 101/101 test suites passed, 1196 tests passed.
- Predeploy artifacts: 49/49 test cases passed (including the new local #webpage graph resolution assertion).
- Build & Prerender: 1920 routes prerendered cleanly.
- Crawl check: 2285 distinct internal URLs crawled from `/`, 0 unreachable, 0 beyond 3 clicks, 0 render errors.

## Resume sequence

1. Merge PR for Finding 10 ("414 generated JSON-LD references point to omitted page nodes").
2. All 10 adversarial audit findings from the 2026-10-30 audit are remediated, verified, and merged into `main`.

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
