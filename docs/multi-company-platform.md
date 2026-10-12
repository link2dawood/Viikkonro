# Multi-company business platform

Phase 13 extends the existing private `/tiimin-lomat/suunnittelu` application.
Open **Tilitoimiston asiakasyritykset** after signing in. An organization owner
can enable their organization as an accounting firm or HR service provider,
create client companies and grant access to verified users. External client
users can open their assigned companies without joining the firm's organization.
No new public pages, analytics, accounts system or calendar engine were added.

## Architecture and permissions

An existing `team_organizations` record is the firm. `business_firms` enables
the product; `business_clients` are its isolated children. Calendars belong to
a client and year, with one versioned configuration per year. Firm templates
are independent of client calendars. Existing leave and shift permissions are
unchanged. Client membership never grants access to firm leave or shift data.

| Role | Calendar read/export | Calendar edit | Client access | Firm clients/templates |
| --- | --- | --- | --- | --- |
| Firm owner | All own clients | All own clients | All own clients | Create clients, manage templates, delete clients |
| Firm manager | All own clients | All own clients | None | Create clients, create/apply templates |
| Client administrator | Assigned client | Assigned client | Editors/viewers only | None |
| Client editor | Assigned client | Assigned client | None | None |
| Client viewer | Assigned client | None | None | None |

Only the firm owner can grant a client administrator, delete a client or remove
a template. A client administrator cannot alter their own role, another
administrator or a firm role. An ordinary organization employee has no client
access unless explicitly assigned. Membership requires an existing confirmed
Supabase user; email invitations and onboarding continue through existing Auth.

Migration `supabase/migrations/202610110004_business_platform.sql` adds seven
RLS-protected tables, scoped read policies and these authenticated RPCs:

- `business_list`: authorized firms and clients, never a public directory.
- `business_firm_command`: enable, create client, save/remove template.
- `business_templates_list`: firm owner/manager only.
- `business_snapshot`: authorized client/year, configuration, scoped access and history.
- `business_client_command`: save calendar, grant/revoke access, record export, delete client.

Authorization uses confirmed Auth users and database membership, never browser
role flags or JWT metadata. Composite foreign keys keep histories attached to
the correct firm/client/calendar. Mutations lock the firm organization before
the client and recheck permissions after locking. This serializes revocation
against writes. Direct table writes and audit sequence access are revoked,
including Supabase's permissive default grants. Privileged database operators
remain trusted administrators.

Calendar edits use optimistic versions. Reads carry client and firm versions;
the browser rejects delayed replies from an earlier permission state. Switching
clients, changing roles and signing out discard drafts and pending exports.
Focus refresh and 30-second polling discover remote revocation. Previously
downloaded files cannot be recalled, and an already displayed authorized page
cannot be retroactively erased before the next authorization refresh.

## Shared configurations and exports

`src/platform/businessWorkspace/model.js` consumes the existing calendar config,
day rules and model. Statutory leave, planner, project and sprint rules remain
distinct selectable modes. Templates preserve layout, colors and rules, but
strip company names, logos, events, closures and payday dates on both the client
and server. A template name is visible only within its firm and should describe
reusable settings rather than confidential client information.

`exports.js` reuses the existing PDF, XLSX, CSV and ICS exporters. The editor
supports PNG/SVG logos, company branding, events, closures, paydays, Finnish
holidays, optional flag days and three established PDF layouts. ISO weeks are
preserved. Each client/calendar has a separate stable ICS identifier namespace.
ICS exports are private downloads; no subscription URL or public sharing exists.

Exports fetch the authorized saved version, generate locally, calculate SHA-256
locally and record authorization/version-checked preparation before download.
History records format, calendar version, actor, timestamp and hash, not file
contents. `prepared` means prepared, not delivered or received. Sign-out can
cancel download after preparation, leaving a truthful preparation record.

Audit logs record identifiers/actions, including organization role changes,
without calendar event titles or email addresses. Firm history is restricted to
firm owner/manager; client history never reveals sibling clients. Deleting a
client removes its data and history while preserving a firm-level deletion
entry. No uploaded logo, company name or personal data is sent to analytics.

## Billing and operational limits

`billing.js` supplies an inactive billing interface and future plan definitions.
The only database plan is `free_preview`; there is no checkout, charging or
browser-controlled paid entitlement. Operators control the client limit,
bounded at 1,000; templates are limited to 100 per firm, assignments to 1,000
per client, configurations to 1 MB, and displayed history to 100 records.
The UI limits uploaded logos to 512 KB. No storage bucket is needed.

## Deployment and security review

Apply migration 004 after the existing team and shift migrations using an
administrative Supabase migration connection. Migration 003 is the separate
Business API infrastructure; the disposable regression database applies all
four migrations. A publishable browser key cannot apply migrations. This work
does not provision, migrate or release the supplied live Supabase project.

Retain the existing private entry's CSP, no-cache/noindex headers and memory-only
Auth. Configure confirmed email, SMTP delivery, password recovery, Auth rate
limits, backups and operational retention before admitting real client data.
Never put a service-role credential in a `VITE_*` variable.

Local security review covers RLS, direct grants, definer search paths, verified
identity, forged roles, sibling/other-firm access, audit visibility, cross-client
export references, optimistic writes, deletion boundaries, anonymous/unconfirmed
users and concurrent firm/client revocation. The disposable PostgreSQL suite
includes Supabase-like permissive default grants. Browser tests use the actual
private build and SDK with intercepted Auth/RPC fixtures. They exercise five
roles, delayed replies, role downgrades, sign-out during export, all formats,
mobile sizing, CSP and absence of analytics/token storage. Unit tests exercise
2026-2028, leap years, year boundaries, templates, stable identities and versions.

These tests do not substitute for live Supabase JWT, SMTP or hosting checks.
Before release, run the same role/tenant matrix with separate confirmed staging
accounts on the migrated Supabase project, verify headers and Auth configuration,
and review operator access, backups and retention. No live release is asserted.

Commands: `npm run test:team:database`,
`node scripts/business-platform.browser.cases.mjs`, and
`npm run test:predeploy`. Browser checks require external Playwright/Chromium;
the database check requires local PostgreSQL. Existing PDF artifact checks use
Poppler. No new production dependency is introduced.

Local verification on 2026-10-11 passed: full lint and 852 unit tests across
78 files; production build, prerender and generated-artifact checks; a crawl
of 2,283 URLs with zero unreachable sitemap pages, 404 links or render errors.
All 1,043 existing calendar PDFs remain linked. PostgreSQL passed 144
authorization/isolation assertions, including concurrent revocation and firm
deletion preserving another firm's clients. The five-role business browser
suite passed with SVG/PNG PDF exports, and the existing leave/shift browser
suite passed with 21 downloads and no browser errors. Independent checks parsed
ICS, verified XLSX ZIP/XML and CSV, and extracted Finnish PDF text with Poppler.

Existing build debt remains: missing licensed name-day data, an ineffective
shared export dynamic import and the large lazy PDFKit chunk. Those existing
warnings do not represent a new failure or a clean dependency audit claim.

## Known limitations and next step

Phase 13 files: `src/platform/businessWorkspace/{model,billing,exports,business.test}.js`,
`src/components/team/BusinessWorkspace.jsx`, migration 004,
`scripts/business-platform-db.cases.sql`,
`scripts/business-platform.browser.cases.mjs`, and this document. Integration
changes are in `TeamLeaveApp.jsx`, `scripts/team-db.cases.mjs`, the business
product registry and its test, `CLAUDE.md`, `SECURITY.md`,
`docs/planning-platform.md` and `docs/team-leave-planner.md`.

Database configuration validation enforces object shape, size, version and year;
full date/logo/layout validation uses the shared JavaScript engine when editing,
reading and exporting. An authorized caller bypassing the UI can store an
invalid configuration in their own client, which then fails closed on rendering.
A future server validation boundary should use that same engine. No arbitrary
configuration content is executed or exposed through public URLs.

There is no client renaming, ownership transfer, public sharing, subscriptions,
payment collection or calendar collaboration. Template removal is available by
authorized RPC but has no editor control yet. Audit retention and MFA policy
require operator decisions. The next implementation step is migration and
staging authorization verification, followed by firm onboarding and an explicit
retention policy, rather than additional accounting features.
