# Frontend production deployment

Deployed on 2026-10-11 under the user's explicit deployment authorization.

The later Polar commerce release supersedes the initial deployment below:
source `4c6a7e4`, deployment `dpl_B2c4EXweZgBniZwKGA3Mm9FiWqV8`,
https://weekdays-rnwdjo4n9-link2dawoods-projects.vercel.app, promoted to
https://viikkonro.fi. See [Polar commerce](polar-commerce.md) for the current
server environment, payment boundary and release checks. Administrative secrets
are server-only; the browser configuration remains publishable-only.

- Source commit: `b4b5c58`, branch `review/planning-platform-20261011`.
- Vercel project: `link2dawoods-projects/weekdays`.
- Deployment: `dpl_8RXY6eMxntt98VQyw8hqBfDKwUVE`.
- Deployment URL: https://weekdays-hxpgerw7t-link2dawoods-projects.vercel.app
- Production domain: https://viikkonro.fi

Uploaded a clean `git archive` of the source commit. Local credentials, generated
output, line-ending-only working changes and the unfinished HR Toolkit files were
not uploaded. Vercel's build/prerender pipeline completed successfully. Production
environment now has `VITE_TEAM_SUPABASE_URL` and
`VITE_TEAM_SUPABASE_PUBLISHABLE_KEY`; the existing site-origin and contact-form
variables were preserved. No Mailjet or administrative Supabase secrets were
added to frontend environment variables.

The production deployment was initially created with `--skip-domain`. Its private
entry and seven JavaScript assets were checked through authenticated Vercel CLI
access; the assets contained the expected browser-safe Supabase configuration.
Real browser checks passed before promotion, then again on the custom domain.
No deployment-protection setting was disabled. Vercel CLI established its normal
automation access to the protected deployment URL; the token is not in source.

## Live checks

- Anonymous private entry loads the login form, hides private planner data and
  returns `private, no-store`, `noindex, nofollow, noarchive`, and a restrictive
  Content Security Policy with `frame-ancestors 'none'`.
- Real Supabase password login passed using a synthetic, administratively
  confirmed account. The tenant-scoped leave calendar, shift planner and
  accounting-firm workspace loaded; private ICS export and logout passed.
- No application JavaScript errors or persisted localStorage/sessionStorage
  tokens. Temporary accounts and organizations were removed after each test.
  Two accounts and two organizations were created and removed across the two
  deployment/domain runs. No emails were sent by these login tests.
- Cloudflare injects its analytics script into the custom-domain HTML. The
  private page's enforced CSP blocked it with a `csp` request failure, before
  loading or execution. No successful third-party traffic occurred in the
  private session. Prefer disabling this injection for the private path in
  Cloudflare as a separate operational cleanup; keep the restrictive CSP.
- Home, calendar 2027, company calendar, company ICS, template catalog,
  construction and HR pages returned HTTP 200 with one H1 and no JavaScript
  errors in Chromium. Public analytics were blocked by the test harness.
- Free calendar PDF returned HTTP 200, a valid `%PDF-` signature and the expected
  HTML canonical response header.
- A nonexistent asset returned 404 twice, with Cloudflare `MISS` then
  `REVALIDATED`, never `HIT`. Anonymous versioned API access returned 401 with
  `invalid_api_key`.

## Boundaries and follow-up

The technical login tests use confirmed synthetic identities and do not verify
sign-up or recovery inbox delivery. Mailjet SMTP authentication/sender activation
remain blocked as documented in [Supabase activation](supabase-activation.md).
No payment provider or billing launches were enabled. Business API server-secret
provisioning and key issuance remain separate from this frontend deployment.
Dependency advisories are recorded in the
[release review](planning-platform-release-review.md); this is not a clean
dependency-security audit.

The code commit is local and was not pushed or merged. The existing Vercel Git
integration and daily rebuild hook still follow remote `main`, so a future
main-based deployment can replace this CLI deployment. Publish the review branch
and follow the repository's reviewed PR process before treating this release as
the durable main-line production source. These deployment notes are a separate
documentation-only follow-up commit, not a new frontend build.
