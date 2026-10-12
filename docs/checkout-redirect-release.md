# Checkout and main integration, 2026-10-12

The operator requested merging/deploying the accumulated platform branch and
reported that payment redirects were not working from the Pro directory.
Those cards intentionally open the editor first. Company Calendar and Company
ICS share the existing EUR 10 selected-year purchase. Vacation Planner Pro is
still explicitly unlaunched; this change does not invent pricing or enable it.

Live diagnosis against the previous release reproduced a real failure: when
`Storage.setItem` throws (blocked storage/quota), the pre-checkout draft save
aborts the click handler before any request reaches `/api/billing/checkout`.
Normal Company Calendar and Company ICS clicks reached production Polar.
These probes created unpaid sessions only; no card details or customer data
were entered, no payment/refund was performed and no customer email was sent.

Changes:

- Optional local draft persistence reports failure without blocking checkout.
  The editor warns when storage is unavailable and provides JSON backup/import
  using the existing bounded draft parser. Backup contains the calendar only,
  never the purchase code, cookie or entitlement. It stays on the user's device.
- A visible purchase link goes to the existing purchase section; a separate
  link goes to the free editor. Locked calendar exports also reveal that section.
- Catalog and prior-purchase status requests fail independently. A failed
  status lookup cannot hide a working catalog/purchase button.
- The server accepts only the two known return-target enums and creates its
  own same-site URL with the selected year. Return parameters select a view;
  only the authoritative provider check can unlock exports. Invalid targets,
  including arbitrary URLs, objects, arrays and null, are rejected.
- Existing open sessions with the wrong return URL are not reused. A retry
  creates a correctly configured session; verified older purchases remain valid.
- Sentry from latest main and Supabase from the platform branch are both kept.
  Sentry's public reports retain bundle stack positions while excluding request
  data, breadcrumbs, user context and original exception messages. The private
  app retains its separate entry without Sentry. Privacy copy names Sentry.

GitGuardian reported a Generic Password at the original Polar adapter's URL
validation line (commit 777f769, line 14). That line rejected URL username and
password fields; it contained no credential. Credential rejection is now on
its own boolean line, with no change to the allowlist. The unmerged PR can be
consolidated onto latest main with its original history retained in a local
archive branch. This avoids carrying the false-positive historical expression
into the PR scan. No secret detector is disabled or globally ignored, and real
server secrets remain environment-only.

Verification includes blocked/full storage, draft backup/import and malformed
drafts, independent status failure, Company Calendar/ICS returns for 2026-2028,
no unlock from return parameters, unsafe targets, unchanged price/old purchases,
and privacy-preserving error reports. `scripts/checkout.browser.mjs` intercepts
payment APIs for its fixtures and never creates real charges.

Before merging: run the full predeployment gate, PostgreSQL tenant/authorization
tests, browser regressions and checkout fixtures. After deployment: verify the
real EUR 10 catalog and hosted checkout, selected tool/year URLs, no unpaid
exports, the previous SEO headers, free tools and private application shell.
The existing security-audit findings are not all remediated by this release;
see `security-audit-2026-10-11.md` for their documented scope and repair order.

Local release gate completed: lint, 1,083 unit tests in 92 files (nine existing
licensed name-day skips), production build/prerender, 35 generated-artifact
checks and crawl passed. All 199 disposable-PostgreSQL authorization/isolation
assertions passed. Checkout fixtures covered both tools and 2026-2028 with zero
JavaScript errors; the existing UI regression matrix passed at 320, 390, 768
and 1280px, and six Vappu/internal-link regressions passed. A read-only real
hosted checkout check confirmed the Company Calendar, EUR 10 display and no
test-mode banner. A completed buyer payment/settlement remains untested.
