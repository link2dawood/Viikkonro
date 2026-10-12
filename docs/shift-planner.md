# Viikkonro Shift Planner (Phase 9)

Open `/tiimin-lomat/suunnittelu`, sign in, select an organization and choose **Työvuorosuunnittelu**. This is a second workspace in the existing private app, not another public calendar or a workforce-management SaaS. No new route, public data feed, subscription URL, analytics, database service or dependency was added. Free/public tools and SEO remain unchanged.

## Architecture and files

- `src/platform/shifts/time.js`: Helsinki local-time inputs to explicit UTC instants, independent of host/browser timezone; overnight and DST handling.
- `src/platform/shifts/model.js`: validated tenant snapshot, shared calendar/holidays/ISO weeks, team filters, half-open intervals, conflict detection and daily coverage. Per-person overlap detection uses a sorted sweep; leave/closure instants are prepared once.
- `src/platform/shifts/exports.js`: shared XLSX, PDF and ICS writers. Excel contains roster, daily coverage, unavailable periods and instructions. PDF groups shifts by ISO week and includes coverage and full notes. ICS contains timed roster events only, stable organization/shift IDs and exclusive UTC ends. No payroll or statutory leave arithmetic.
- `src/platform/export/ics.js`: additive timed VEVENT support. Existing all-day event output is unchanged and fingerprint tests still apply.
- `src/platform/business/products.js`: shift product is a free private preview, with no public URL or pretend subscription checkout.
- `src/components/team/ShiftPlanner.jsx`: structured shift/template/availability forms, weekly/monthly roster and exports. No drag/drop dependency. Morning, evening, night and custom presets are editable examples, not legally recommended schedules.
- `src/components/team/TeamLeaveApp.jsx` and `team.css`: workspace selector, shared identity/settings/teams, responsive and print styles. Returning to leave planning resets its draft to the current version.
- `supabase/migrations/202610100002_shift_planner.sql`: additive tables/RLS and `shift_snapshot`/`shift_command` RPCs. Apply after Phase 8. The old migration is not rewritten.
- `src/platform/shifts/shifts.test.js`, `scripts/shift-db.cases.sql`, `scripts/team-db.cases.mjs`, `scripts/team-leave.browser.cases.mjs`: model/export, real SQL and CSP-enforced browser coverage. Existing database CI now applies both migrations.

## Permissions and privacy

Reuse Phase 8 verified-email membership and organization boundaries. Owners and managers manage shifts, templates and availability. Employees can read the shared roster and edit only their own unavailable periods. They cannot create, update, delete or reassign a shift/template. Employee direct table reads expose only their own shift/availability notes; shared RPCs redact coworker notes. Client models also redact before rendering and exporting as defense in depth. Coworker absence reasons retain Phase 8 redaction.

Composite organization foreign keys prevent foreign member/template references. Authenticated direct writes are revoked; RLS protects reads. Commands lock the organization, recheck its authoritative role after acquiring the lock, enforce optimistic versioning, then update its version. Definer functions have empty pinned search paths and explicitly qualified relations; PUBLIC/anon execute is revoked. See [Supabase function guidance](https://supabase.com/docs/guides/database/functions) and [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), reviewed 2026-10-10.

Member deletion cascades shift/availability records; organization deletion cascades all new tables. A referenced template cannot be deleted. Limits per organization: 100 templates, 20,000 shifts and 10,000 unavailable periods. Shift duration is positive and at most 36 elapsed hours; unavailable periods at most 400 elapsed days. These are product bounds, not statements about legal shift lengths.

Auth remains memory-only. No private content enters analytics, public URLs or caches. Switching tools/organizations, logging out and role changes clear private component state. Older snapshots cannot restore a previous role or notes. Exports refresh database authorization, redact notes, cancel after unmount/org change/logout and reject a newer snapshot version arriving during generation. Downloaded files cannot be revoked.

## Scheduling semantics and limits

- Times are **Europe/Helsinki**. The UI rejects nonexistent spring-clock times. For repeated autumn-clock times, start and end each allow first/second occurrence. Stored timestamps require explicit offsets and are UTC instants, including ICS output; no floating local times or incomplete VTIMEZONE definitions. Calendar apps display instants in their chosen timezone. Database timestamp behavior: [PostgreSQL date/time types](https://www.postgresql.org/docs/16/datatype-datetime.html).
- Intervals are `[start,end)`: adjacent shifts do not overlap; a midnight end does not count on the following day. A shift crossing a month/week/year is included in every relevant preview but exported once, preserving its full duration. The annual snapshot includes a two-day margin for boundary conflict checks.
- Weekly previews show the selected ISO week within the configured calendar year. At New Year, change the organization's year to view the other year's days. Monthly previews show that month. Exports use the visible interval and selected team, not the whole year.
- Unavailable periods, approved leave, pending leave (a separate preliminary warning), closures and same-person shift overlaps are flagged. Rejected leave is ignored. Conflicts are advisory and may be saved; the manager must resolve them. No medical-reason field or default sickness label is introduced. Notes are for work arrangements only.
- Holidays use the existing Finnish engine; holidays/weekends do not automatically forbid shift work. Statutory vacation-day rules, project/sprint working-day rules and payroll are not used to judge shifts.
- Daily coverage counts distinct people assigned at any point in the day, not simultaneous staffing. The organization minimum supplies a displayed daily target only for the whole organization and only on dates with planned shifts; no target is applied to a department filter. Missing shifts are displayed explicitly. It does not infer opening hours or staffing demand.
- No recurring shift generation, swaps, approvals, notifications, break deduction, overtime, payroll, legal compliance checks, department-scoped managers or automatic rostering. Template edits change the label but do not reschedule saved instants. Working-time law and collective agreements must be checked outside this planner.

## Activation and verification

Use the same Supabase setup and private headers documented in [team-leave-planner.md](team-leave-planner.md), then apply the Phase 9 migration and rebuild. Missing backend/migration never falls back to simulated production storage. No remote Supabase credentials were provided and no live project was migrated; staging Auth/JWT/email tests remain necessary before launch.

Run `npm run test:predeploy` and `npm run test:team:database`. Browser tests use test-only intercepted Supabase HTTP responses with the real SDK, enforced production CSP and synthetic data; real privileges/tenant isolation are tested separately against an isolated PostgreSQL cluster. Browser execution instructions remain in the Phase 8 document. No existing database is accessed or reset.

Recommended next step: install both migrations in staging, verify real owner/manager/employee sessions and revocation, and trial a week/month roster with a Finnish small business. Validate whether they need simultaneous staffing targets or repeated weekly assignment before adding either. Resolve operator retention/account-deletion responsibilities and existing dependency/build debt before public release.

Final local verification on 2026-10-10: `npm run test:predeploy` exited successfully with 784 tests across 75 files, the complete production build/prerender, 18 generated-artifact cases and a successful crawl with zero render errors or broken PDF links. All 1,043 public PDFs remained directly linked. `npm run test:team:database` passed 65 real PostgreSQL permission/tenant assertions. The CSP-enforced browser suite passed all three roles, four template types, overnight/overlapping shifts, monthly roster, own availability, 21 downloads (six shift exports), role-downgrade/delayed-response note redaction, organization switching/logout, responsive layout, no analytics and no persisted tokens, with zero JavaScript errors. Independent `icalendar` parsing, ZIP/XML/formula validation and `pdftotext` checks passed for the six shift files, including Finnish characters and employee note redaction.

These are local synthetic-data validations. Real Supabase Auth/JWT/email integration and live migration execution still require staging configuration. Existing missing licensed name-day data, lazy PDFKit size, calendar dynamic-import warnings and the previously documented transitive `sharp` advisory remain unchanged.
