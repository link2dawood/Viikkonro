# Polar checkout for Yrityskalenteri

The first commercial product is Viikkonro Yrityskalenteri: EUR 10, one selected
calendar year, one-time payment. Downloads expire at the end of that year in
Europe/Helsinki. It includes PDF, XLSX, CSV, ICS, branding and company events.
Other products remain unlaunched. Price comes from the configured Polar catalog
price, not a frontend constant. Changing a price requires selecting its new
immutable price ID; existing purchases retain their original price ID.
Unpaid checkouts at a previous price restart at the current price when the buyer
uses Viikkonro's purchase button. Verified historical purchases remain valid.

## Payment and privacy boundary

Preview and draft storage remain local, without an account. The browser calls
`/api/billing/catalog`, `checkout`, `status`, `restore`, and `export`.
Polar hosts payment and receipts; Viikkonro never handles card data.
Checkout metadata contains a random contract ID, product enum and year, plus
the versioned promotional-consent choice and server timestamp when selected.
Company names, events and logos are never checkout metadata or analytics tags.

A signed Secure/HttpOnly/SameSite=Lax host cookie proves ownership of a checkout,
not payment. Each status, restore and export operation queries Polar's actual
order. Paid status, organization, product, price, currency, contract metadata,
year and refunds are checked before the common entitlement engine is called.
Redirects and webhook payloads never grant access. Full refunds and expiration
revoke access; partial refunds retain access, matching the existing billing
policy. Positive tax-exempt totals below the inclusive price are permitted only
for the exact purchased price ID; discounts and zero payments are rejected.

Buyers can save a private signed purchase code after payment and restore it in
another browser. Treat it as a bearer credential. Never put it in a URL, analytics
or support screenshots. Browser cookies may expire before a future-year licence;
the saved code remains valid until its licence expires. If both cookie and saved
code are lost, recovery requires support and proof of the Polar order. There is
no automatic email-based recovery or hosted company-calendar subscription.

Paid exports send the calendar and raster logo over HTTPS to the function,
reuse the existing calendar engine/exporters, then return a private file. No
calendar payload is persisted. SVG logos are sanitized by the existing upload
flow and rasterized on the client. The server accepts only size- and
dimension- and decompression-bounded PNGs, never URLs or SVG markup. Request bodies are capped at
1 MiB. No-company-data logging is essential for future monitoring changes.

## Operations

Server-only environment settings are listed in `.env.example`; none use a
`VITE_` prefix. Protect the access token, webhook secret, purchase signing secret
and Supabase service role. Preserve the purchase signing secret across deploys;
rotating it invalidates existing cookies and purchase codes. A key-rotation
scheme is future work. Never commit `.env.local`.

The provider adapter pins `Polar-Version: 2026-10`. Raw webhook signatures use
the raw UTF-8 secret, matching the official Polar SDK. Register
`https://viikkonro.fi/api/billing/webhook` for `order.paid` and `order.refunded`
with the raw format. The endpoint also subscribes to `order.updated` for invoice
readiness. Verified notifications re-fetch authoritative provider data and store
allowlisted billing records; raw customer payloads are not retained. A private
outbox sends official invoices with an owner BCC. See `purchase-invoices.md` for
consent, delivery prerequisites, duplicate protection and operator retries.
Payment is still reconciled from the authoritative order on every request.

Migration `202610110006_commerce_limits.sql` provides atomic shared limits:
6 checkouts, 60 status checks, 20 exports, 10 restores and 60 catalog requests
per minute per daily HMAC bucket. The trusted Vercel IP header is never logged
or persisted as plaintext. Old windows are purged on subsequent traffic after
one day. The RPC is service-role-only; browser roles cannot read/reset windows.
Missing limiter/provider credentials fail closed. Invalid origins are rejected
before provider calls; responses are private/no-store/noindex without CORS.

`POLAR_ENABLED=false` disables new sales. Existing purchases can still be
verified/exported. Do not replace authoritative verification with cached browser
licenses. Refunds/receipts are administered in Polar; the pre-existing account
billing abstraction remains independent of this guest checkout adapter.

The product is private in Polar and sold through Viikkonro's year-aware checkout,
rather than a generic storefront link that has no selected year.
Production was configured using an organization token. That token must omit
`organization_id` on product creation. The organization default was changed to
EUR with explicit approval; Premium Access gained an approved EUR 2 price while
its existing USD 2 price was retained. No purchase or refund was made on behalf
of the user. A real buyer payment is still needed to verify settlement end to end.

## Production release, 2026-10-11

Product `6fc1aedf-aac5-4e50-9dc0-d29a3d56308e` exists in the production
organization with an inclusive EUR 29 catalog price and private visibility.
Migration 006 is applied; server credentials and launch switch are configured
in Vercel. Source commit `4c6a7e4` was deployed as
`https://weekdays-rnwdjo4n9-link2dawoods-projects.vercel.app` and promoted to
`https://viikkonro.fi` (`dpl_B2c4EXweZgBniZwKGA3Mm9FiWqV8`).

Release checks passed: 952 unit tests in 82 files, 178 database authorization
assertions, 22 generated-artifact tests, lint, production build/prerender and
2283-URL crawl without unreachable URLs or render errors. Built assets were
scanned against actual local secret values: no credentials found.
Browser fixtures cover paid UI/export and refund denial. Real production tests
verify the EUR 29 catalog, checkout cookie, no unpaid access, CSRF rejection,
purchase-code tampering and signed webhook acknowledgments that cannot grant
access. The actual live purchase button opens Polar's hosted checkout; no card
details were entered and no charge was made. A completed buyer payment and its
receipt/refund still need end-to-end verification.

Seven public routes have one H1 and no JavaScript errors; anonymous Business API
requests remain unauthorized and missing assets remain noncached 404s. The free
2027 PDF still returns a downloadable PDF. Real Supabase login, private leave,
shift and accounting workspaces, ICS export and logout also passed on the final
protected deployment; temporary accounts/organizations were removed, no emails
were sent. Production-domain checks use direct browser/API requests; protected
deployment browser checks proxy the billing API through the authenticated test
client because the allowed billing Origin intentionally remains viikkonro.fi.

Commits remain on `review/planning-platform-20261011`, without a push/merge to
main. As documented in `frontend-deployment.md`, main-based scheduled rebuilds
can revert a CLI-only deployment until this tested source is merged.

## Verification

Run `npm run test:predeploy` and `npm run test:team:database`.
Commerce tests exercise signatures, CSRF, refunds, selected-year boundaries,
restore, shared engine artifacts for 2026/2027/2028, server verification on every
export, body limits and unsafe logo/checkout URLs. Existing logo/calendar/export
tests cover SVG/PNG, all PDF layouts, Finnish text and large event lists.
Before promotion, check real catalog and unpaid checkout, blocked unpaid
exports, invalid webhooks, no secret in built assets and unchanged free tools.

Primary implementation references:
- https://github.com/polarsource/polar/blob/main/server/polar/checkout/schemas.py
- https://github.com/polarsource/polar/blob/main/server/polar/kit/versioning.py
- https://github.com/polarsource/polar-js/blob/main/src/webhooks.ts
- https://polar.sh/docs/features/tax-inclusive-pricing
