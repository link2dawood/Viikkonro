# Planning platform release review

Reviewed on 2026-10-11 before committing the accumulated planning-platform work.
The current Vite/React prerendered architecture and the separate private entry
remain intact. The shared engine supplies dates and Finnish day rules to the
calendar, template, vacation, project/sprint, construction and HR tools.

## Scope and checks

- Commit includes substantive changes and their dependencies, documentation,
  exports, tests and five additive Supabase migrations. The migrations were
  already applied and their historical contents were not changed by this review.
- Excludes 232 files showing only line-ending conversion and the unfinished
  `src/data/hrToolkit.js`, `src/platform/hr/toolkit.js` and
  `src/platform/hr/toolkitExports.js`. These drafts are not routed or released.
  Working copies of excluded files are preserved.
- The index uses LF endings to avoid unrelated CRLF diffs. Explicit paths were
  staged; credentials, generated output and local service linkage are excluded.
- Known Mailjet, Supabase administrative and Vercel tokens were scanned against
  staged contents with zero matches. Only the browser-safe Supabase URL and
  publishable key belong in the frontend build.
- Review fixed recovery error handling: a returned Supabase email-send error
  now produces the failure message. The browser regression simulates HTTP 500;
  it sends no email. Split the 300-event PDF stress test by layout, retaining all
  assertions and the default timeout instead of grouping three exports together.

## Verification

- `npm run test:predeploy`: lint, 910 unit tests in 81 files, production build,
  prerendering, 22 generated-artifact checks and crawl passed.
- Crawl: 2,283 internal URLs, 1,026 sitemap URLs, zero unreachable pages or render
  errors. All 1,043 generated PDFs have direct HTML download links.
- `npm run test:team:database`: 170 authorization, tenant isolation and concurrency
  assertions passed in a disposable PostgreSQL cluster.
- Private-app fixture browser checks: recovery email failure, roles, tenant
  switching, revocation/logout races, shifts, availability, privacy, responsive
  UI and 21 exports passed with zero JavaScript errors. No real user data used.
- Growth fixture browser checks: 22 responsive/print cases, free PDF/CSV/print,
  company funnel and two planner exports passed with zero JavaScript errors.

## Release boundaries

These checks do not certify email delivery or legal compliance. Mailjet delivery
is blocked by SMTP authentication and inactive sender status; see
[Supabase activation](supabase-activation.md). Billing launches remain disabled
and no payment provider is configured. The Business API requires separate
server-secret/runtime provisioning before authenticated API usage is enabled.

Existing debt remains: incomplete licensed name-day data, large PDF export
chunks/ineffective dynamic import warnings and provider security-advisor warnings
documented in the activation record. Browser performance results are local lab
measurements, not production Core Web Vitals.

The registry advisory endpoint was checked during deployment. It reported
advisories for seven installed package names: `@vitest/mocker`,
`baseline-browser-mapping`, `brace-expansion`, `browserslist`, `sharp`,
`source-map-js` and `vitest`. Dependency paths are the lint/test/Vite toolchain
and `@vercel/og`'s build-time image generator. No automated dependency changes
were made in this review. The ordinary `npm audit --json` request failed in this
environment; the successful direct registry advisory query is the evidence for
these findings. Follow up with compatible dependency updates and another release
gate. This is not a clean dependency-security audit.

This review creates a local commit on a review branch. It does not push or merge
`main`; the repository's normal reviewed PR workflow remains applicable.
Frontend production deployment, if performed under the separate deployment
authorization, is recorded independently after live checks.
