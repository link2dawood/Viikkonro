# Supabase activation record

Project `rbruwqaxafzekqknwxew`, activated 2026-10-11 with the user's authorized
Supabase CLI login. The browser uses the existing publishable credentials;
administrative credentials are never embedded in client bundles.

## Completed

- Linked the intended project, checked remote state and ran a migration dry run.
- Applied all five existing migrations in order, without resetting the database:
  team leave, shift planning, business API, firm/client platform and billing.
  Local and remote migration history now match.
- Verified RLS on all 25 application tables and zero browser-writable tables.
- Set the Auth site/allowlisted URL to
  `https://viikkonro.fi/tiimin-lomat/suunnittelu`, required email confirmation,
  disabled anonymous sign-in and set a 12-character password minimum.
- Retained the project's eight-digit OTP setting. Fixed the recovery form to
  accept eight digits alongside existing six-digit configurations, rather than
  weakening the backend OTP setting.
- Passed 20 real remote Auth/PostgREST checks with four synthetic confirmed
  accounts and two synthetic organizations. Checks cover JWT authentication,
  RLS, cross-organization denial, employee/manager permissions, manual invitation
  acceptance, cross-year closures, shift snapshots, sibling client isolation,
  firm-template privacy, denial of browser access to API/billing administration,
  immediate revocation and real OTP verification.
- Removed all synthetic accounts and organizations; remote count queries confirm
  zero remaining activation fixtures. No test emails were sent.
- Supabase security-advisor warnings were reviewed: authenticated SECURITY
  DEFINER RPCs are intentional and have explicit authorization/search-path checks.
  The provider-created `rls_auto_enable()` event-trigger helper is also flagged
  for its default execute ACL. It is not an application RPC and cannot run outside
  an event-trigger context. The provider-managed helper was not rewritten.
  This is not a claim of zero advisor warnings.

## Mailjet SMTP configured

The user manually configured Mailjet in Supabase. On 2026-10-11, the Auth
configuration readback confirmed host `in-v3.mailjet.com`, port 587, sender
`hi@viikkonro.fi`, sender name Viikkonro and configured SMTP credentials.
Credentials are never logged or embedded in browser code.

Updated the Finnish recovery email to contain `{{ .Token }}`, matching the
app's code-entry flow, and verified the exact template by reading it back.
Eight-digit OTPs and required email confirmation remain enabled.

The user subsequently authorized a real sign-up delivery test to their own
inbox. Supabase returned HTTP 500, "Error sending confirmation email". A
STARTTLS probe using the saved Supabase SMTP credentials returned authentication
error 535. Mailjet's API still reported the selected sender as inactive and no
verified sending domains. No successful delivery has been verified; password
recovery delivery remains untested until SMTP credentials and sender activation
are corrected. The recovery form now checks returned email-send errors.

`scripts/configure-supabase-mailjet.mjs` remains available for future setup.
It checks Mailjet sender status before changing SMTP settings and sends no mail.

The setup fields follow the official
[Supabase Auth configuration API](https://supabase.com/docs/reference/api/v1-update-auth-service-config)
and [Mailjet SMTP configuration](https://dev.mailjet.com/docs/smtp-relay/configuration).

## Verification and release boundaries

- `npm run test:predeploy`: lint, 908 tests across 81 files, production build,
  prerender, 22 artifact tests and a crawl of 2,283 URLs passed. Zero broken links
  or render errors; all 1,043 generated PDFs remain linked.
- Production-preview browser: eight-digit/six-digit recovery input accepted,
  seven digits rejected, no JavaScript errors and no private Auth/tracking state
  in localStorage or sessionStorage.
- The generated client artifacts contain no Mailjet or CLI credentials.
  `.env.local` and Supabase CLI `.temp` are ignored by Git.
- `scripts/supabase-live.cases.mjs` is an explicit live administrative test, not
  part of automatic local/CI tests. It requires matching linked/client project
  configuration, creates only synthetic records and removes them in `finally`.
  Run it only against an authorized project. It does not test inbox delivery.
- Frontend commit `b4b5c58` was subsequently deployed to Vercel with the
  browser-safe `VITE_TEAM_*` values. Real login and private leave/shift/firm
  workspace checks passed on `viikkonro.fi`; synthetic records were removed.
  See [frontend deployment](frontend-deployment.md) for live checks, Cloudflare
  CSP behavior and the remaining remote-main release boundary.
- API keys/paid products/payment providers were not launched. Applying their
  database migrations does not configure the server runtime or enable charging.

Changed files: `.gitignore`, `.env.example`, the ignored `.env.local`,
`src/components/team/TeamRecovery.jsx`, its regression test,
`scripts/supabase-live.cases.mjs`, `scripts/configure-supabase-mailjet.mjs`, this
record and the team-leave deployment guide. Existing migrations were applied
without editing their recorded contents.
