# Team Leave Planner (Phase 8)

Public product guide: `/tiimin-lomat`. Private application: `/tiimin-lomat/suunnittelu`.

## Smallest reliable backend

One Supabase project supplies Auth, PostgreSQL and the existing PostgREST API. No separate Vercel API, service-role proxy, realtime subscription infrastructure, file storage or job queue. The client uses the official `@supabase/supabase-js` SDK only in a separate private entry bundle. The public React/Vite/prerender architecture and free planners remain intact.

Database migration: `supabase/migrations/202610100001_team_leave.sql`. Tables cover organizations, memberships, members, departments, absence types, leave, closures and invitations. Organization IDs and composite foreign keys enforce ownership of related records. RLS protects direct reads; direct application-role writes are revoked. Mutations pass through explicitly checked transactions with a pinned empty search path and optimistic organization versions. Auth user metadata cannot confer a role.

Owner: settings, member/department/type management, invitations, access roles, leave and organization deletion. Manager: organization leave and closure management. Employee: own pending requests only; shared availability has coworkers' absence types redacted. Approved/rejected requests require a manager or owner to change. Owner cannot be demoted or removed through this API. Roles apply to the whole organization, not a department.

Invitations are email-bound, expire after seven days and are single-use. Only a SHA-256 hash is stored; the code is shown once to the owner and shared manually. Acceptance checks the authenticated, verified email from `auth.users`, not client input. Revocation immediately affects database access even with an existing JWT.

## Deployment configuration (required before live use)

The project's [activation record](supabase-activation.md) records the applied
migrations, live authorization checks and remaining Mailjet sender verification.

1. Create a dedicated Supabase project, selecting an appropriate region for the organization's data. Apply the migration using Supabase CLI migrations or the SQL editor. The `pgcrypto` extension is expected in the standard `extensions` schema; no existing application database is reset.
2. Enable email/password Auth, require email confirmation and a password minimum of 12 characters. Configure production SMTP and provider rate limits. Anonymous sign-in is not used. Set site/confirmation redirect URL to `https://viikkonro.fi/tiimin-lomat/suunnittelu`; allow only intended deployment origins.
3. The password-reset email template must include the `{{ .Token }}` recovery code. The private app accepts six- and eight-digit codes, verifies them with `verifyOtp({type: 'recovery'})` and updates the password. Keep the project's eight-digit default when activating a new project. URL-based bearer-token recovery is deliberately disabled. Test real confirmation and recovery delivery with staging accounts.
4. Configure `VITE_TEAM_SUPABASE_URL=https://YOUR_PROJECT.supabase.co` and `VITE_TEAM_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY` in the build environment. A legacy JWT anon key is accepted; secret and service-role keys are rejected. Never place server credentials in `VITE_*`. Rebuild after configuration.
5. Configure Cloudflare to bypass caching for the private app and never proxy/cache Supabase responses. `vercel.json` adds no-store, noindex, no-referrer and an enforced private CSP. Custom Supabase domains require an explicit reviewed CSP/client-host change; default project hosts work without another deployment service.
6. Verify owner/manager/employee flows against the configured project and run database authorization tests before making the feature available. Remote migrations and real JWT authorization were verified during activation; see the activation record for deployment and email-delivery limits. Missing/invalid configuration fails closed with an honest unavailable message.

Official design references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), [Auth sessions](https://supabase.com/docs/guides/auth/sessions), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp). Reviewed 2026-10-10.

## Privacy and planning semantics

Only login email, a member label, optional department/job role, absence category/status/dates and organization settings are needed. No diagnosis, health-note, payroll, national ID or private explanation fields. Sickness is not a default type in this release: sensitive reasons are unnecessary for coverage planning. Custom labels must not contain health details. The owner can delete a member and their leave, revoke access, or delete the organization. Account deletion and backup retention remain backend-operator responsibilities; organization deletion does not delete Auth accounts.

Private app HTML is a separate Vite input with no Clarity, advertising, WebMCP, public navigation hydration or remote fonts. Auth tokens live in memory, not localStorage/sessionStorage. Reload requires sign-in. URL fragments/query strings are cleared; bearer-token callback detection is disabled. RPC errors are sanitized. Switching organizations or signing out clears private state and invalidates in-flight results. Exports reload an authorized snapshot, honor redaction and discard a result if the user/org changes during generation. A previously downloaded file cannot be revoked.

The shared calendar and `FINLAND_PROJECT` rule supply Finnish dates/holidays/ISO weeks. Coverage uses active members, the union of their selected approved/pending periods and company closures. It never calculates statutory vacation entitlement, payroll or shifts. Department filtering does not apply a misleading organization-wide minimum to a smaller team. Public holidays are excluded from planning workdays even when their display is disabled. Month selection affects the preview; exports contain the selected department or whole team for the full organization calendar year. Cross-year periods retain full inclusive ranges in ICS, with RFC-exclusive ends.

Shared data refreshes every 30 seconds and on focus; no realtime backend is needed. Concurrent mutations are serialized per organization and reject stale versions. An open leave edit retains its original version even after a background refresh. Limits: 500 members, 50 absence types, 1,000 closures and 10,000 stored leave records per organization; 400 days per period, 10 owned organizations per account.

Snapshot versions are monotonic within an organization session: a delayed older manager response cannot replace a newer redacted employee view. Organization-list responses are also discarded after user/session changes. Exports cancel if a newer snapshot arrives during rendering.

## Tests

`npm run test:team:database` starts a dedicated temporary PostgreSQL cluster with a Unix socket and no TCP listener. It applies the real migration and tests real SQL privileges, RLS, roles and RPCs. Minimal synthetic `auth.users`/`auth.uid()` fixtures emulate the trusted identity supplied by Supabase; these tests do not replace staging tests of Supabase's JWT validation or email delivery. Set `TEAM_POSTGRES_BIN` if PostgreSQL binaries are elsewhere. Existing databases are never accessed. CI runs the same command.

Unit tests cover 2026-2028, leap days, ISO year boundaries, overlapping periods, coverage, closures, inactive people, tenant reference validation, redaction across exports, safe keys and sanitized failures. Production artifact tests check the separate private entry, headers, lack of analytics/preloads, and exclusion of private routes from the sitemap.

`scripts/team-leave.browser.cases.mjs` uses a separate temporary Vite build with a test-only Supabase URL/publishable key and HTTP fixtures intercepted by Playwright. It exercises the real SDK, enforced production CSP, all three UI roles, member/department/type/closure setup, employee requests and manager approval, 15 downloads, private reason redaction, organization switching, sign-out during export and a delayed-response permission downgrade. It also checks mobile width, no analytics requests, no stored Auth tokens and sign-in after reload. The fixtures do not provide a production authentication fallback and are not included in deployable app bundles.

Independent Python `icalendar` and ZIP/XML parsing verified five ICS and five XLSX files: unique stable identifiers, all-day exclusive ends, native date cells, 365/366 annual rows, formula safety and employee reason redaction. Finnish PDF text was checked with `pdftotext`.

The PostgreSQL suite currently has 36 assertions, including expected SQLSTATE codes, another tenant's valid foreign-key targets, expired/email-bound/single-use invitations, concurrent revocation after an organization lock and organization deletion preserving a different tenant.

Release validation on 2026-10-10: the full `npm run test:predeploy` command passed with 771 tests across 74 files, production build/prerendering of 1,920 public routes, 18 generated-artifact cases and a crawl of 2,283 internal URLs. There were zero unreachable sitemap pages, links to 404 pages or render errors. All 1,043 existing calendar PDFs remained linked. The separate private Vite entry is emitted in addition to the public prerender routes. The unconfigured production private app was also checked in a browser: no login simulation, analytics or backend requests.

Existing build debt remains: missing licensed name-day data, the shared calendar export dynamic-import warning and the large lazy PDFKit chunk. Dependency auditing reports an existing transitive `sharp` advisory in the build/image toolchain; no Supabase dependency advisory was reported by the production dependency audit. This implementation does not claim a clean dependency audit or a completed live Supabase security review.

## Files added and integration changes

Added: `supabase/migrations/202610100001_team_leave.sql`; `src/platform/team/{client,model,exports,team.test}.js`; `src/components/team/{TeamLeaveApp,TeamCalendar,TeamSettings,TeamRecovery}.jsx` and `team.css`; `src/team-main.jsx`; `tiimin-lomat/suunnittelu.html`; `src/data/teamLeave.js`; `src/pages/TeamLeaveLanding.jsx` and its test; `scripts/team-db.cases.{mjs,sql}`; `scripts/team-leave.browser.cases.mjs`; this document.

Integration: SDK/package lock, `.env.example`, Vite multi-entry/chunking, private Vercel headers, AppRoutes/SEO/sitemap metadata, calculators hub, product/planner registries and registry test, prerender schema/AI discovery, public AI indexes, generated-artifact/crawl checks, predeployment CI, `CLAUDE.md` and `docs/planning-platform.md`.

## Next implementation step

Phase 13 adds firm/client boundaries, calendar audit history and private exports
without widening the original leave or shift roles. See
[multi-company-platform.md](multi-company-platform.md) for its separate client
permissions and migration/staging requirements.

Connect and validate the real Supabase staging project using the setup above. Before wider release, establish account deletion, retention/backup policy and operator access controls appropriate to participating organizations. Department-scoped managers, ownership transfer, audit history, notifications and MFA are future enhancements. Phase 9 adds a private shift workspace through a second additive migration; see [shift-planner.md](shift-planner.md). Payroll remains outside this application.
