# Commercial billing layer

This is a server-side commercial foundation, not a payment launch. It reuses
the product IDs in `src/platform/business/products.js` for company calendars,
templates, ICS, vacation/project/construction/HR planners, team leave, shifts,
the API, white-label widget and accounting-firm platform. Existing free tools,
preview exports, development unlocks and free API keys remain unchanged.

No processor is configured, no checkout route is published, no prices are
invented and no product is commercially launched by the migration. There is no
card form or card-data storage. A real adapter and explicitly approved catalog
are required before collecting money.

## Modules

- `catalog.js`: canonical product IDs from the existing registry; validated,
  versioned operator JSON for plans, EUR prices, features, trials and limits.
- `domain.js`: purchases/subscriptions, verified events, exclusive UTC expiry,
  trial status, cancellation, refunds, documents and derived entitlements.
- `provider.js`: payment provider contract and an unavailable default.
- `service.js`: server authorization, idempotent checkout requests, verified
  settlement, changes, refunds, receipt access and usage metering.
- `supabaseRepository.js`: server-only persistence adapter using scoped RPCs.
- `202610110005_billing.sql`: private catalog, accounts, state, event deduplication
  and atomic usage counters. No browser reads or writes are granted.
- `scripts/billing-catalog.mjs`: local catalog validation; prints normalized JSON
  and never writes a database or contacts a provider.

An account belongs to exactly one confirmed user or existing organization.
Organization owners manage purchases, cancellation, changes and refund requests.
Managers may read billing summaries/documents, but cannot charge or refund.
Organization employees and explicitly assigned clients may verify entitlements,
but cannot read firm invoices. A commercial entitlement never grants a tenant
role or permission to another client's calendar: both checks are required.

The repository's authorization RPC requires a server credential. Future HTTP
handlers must derive `actorId` from a verified Supabase Auth session, not from
a request body, JWT metadata, local storage or a caller-supplied role. The service
is not an HTTP authentication system. Do not expose its methods without verified
identity, request validation, CSRF protection where applicable and rate limits.

## Prices and gradual launches

Production prices are data in `private.billing_catalog`, loaded on the server.
The old public registry's price hypotheses are never used for checkout.
Generate a disabled starting catalog with:

```sh
node scripts/billing-catalog.mjs > /secure/operator/billing-catalog.json
node scripts/billing-catalog.mjs /secure/operator/billing-catalog.json
```

Add only approved plans to that JSON. A plan contains `id`, `productId`, `active`,
`priceId`, `currency: "EUR"`, integer `amountCents`, `kind` (`one-time` or
`subscription`), `rank`, `trialDays`, grants and limits. Subscriptions specify
`interval: "month"` or `"year"`; purchases specify `durationDays`. Prices are
strict positive cents, never floating-point euros. VAT/tax/invoice handling is
a provider/operator responsibility, not a Finnish tax rule invented here.
The settled EUR total must match the agreed snapshot; adapters must not silently
add charges the customer did not approve.

Each grant is `{ productId, features: [featureId, ...] }`. Each limit is
`{ productId, key, period: "minute"|"month", max }`, with zero meaning no usage,
not unlimited. Bundle grants require every covered product to be explicitly
launched. A product's technical `live` status does not launch paid access.

Publish validated JSON through a parameterized administrative database operation.
Increment catalog version and use a new immutable `priceId` for changed terms.
Existing contracts keep their purchased prices, features and limits. Updating
prices does not rewrite historical purchases or automatically change an existing
subscription. Repricing an existing subscription needs an explicit agreed plan
change. Price editing therefore does not require an application code rewrite.

Checkout quotes last 30 minutes and are persisted before provider checkout.
Reusing a request key retries the same provider-idempotent contract and frozen
price. A delayed webhook may confirm a payment made before quote expiry; a new
payment after quote expiry is rejected. Retry using a new request key for a new
quote. Turning off a launch flag stops new purchases; it does not revoke already
paid entitlements or prevent legitimate renewals of saved contracts.

## Provider abstraction

Inject a trusted server adapter into `createBillingService`. A configured adapter
must implement:

| Method | Responsibility |
| --- | --- |
| `startCheckout(request)` | Hosted HTTPS checkout; contract-ID idempotency; no card data reaches Viikkonro |
| `verifyWebhook(rawBody, headers)` | Verify signature and replay timestamp, reconcile provider data, return a canonical event |
| `cancel(request)` | Provider-idempotent immediate/period-end cancellation request |
| `changePlan(request)` | Agree to the persisted target price and timing |
| `refund(request)` | Provider-idempotent EUR refund; enforce actual remaining refundable funds |
| `document(request)` | Authorized, short-lived HTTPS invoice/receipt link |

The adapter has a stable `id` and `configured` boolean. Multiple providers can
be serviced by separate service instances sharing the repository. Contracts and
events retain their provider identity; one provider cannot settle or refund
another provider's contract. No provider-specific SDK is imported into business
logic or the browser bundle. The unavailable adapter grants and charges nothing.

Checkout/receipt results are reduced to HTTPS redirects. Cancellation, change
and refund requests return `requested`, not an invented completed transaction.
Only verified provider events change entitlement-bearing state. A checkout
success page, browser license or boolean `paid` flag cannot grant server access.

Canonical events contain provider/event/account/contract IDs, monotonic contract
`revision`, UTC `occurredAt`, and a kind:

- `paid`: payment ID, price ID, EUR cents, start/end; optional persisted change ID.
- `trial`: start/end within configured trial duration, once per account/product.
- `canceled`: immediate or period-end timing.
- `refunded`: payment ID and provider-confirmed cumulative EUR refunded cents.

The adapter must reconcile reordered webhook deliveries against authoritative
provider data. Do not invent revisions from arrival order. Older revisions cannot
resurrect refunded or canceled access. Event IDs are transactionally deduplicated;
account state uses compare-and-swap with bounded retries. Future-dated events,
wrong amounts/currency/prices, unknown contracts and incompatible periods fail
closed. Unknown informational/failed-payment events should be filtered or handled
by the adapter; no grace period or assumed renewal is invented.

## Lifecycle, documents and usage

Access is valid from period start inclusive to end exclusive in UTC. Subscriptions
renew only on a verified paid period. One-time purchases expire according to their
paid term. Period-end cancellation preserves already paid access until expiry;
immediate cancellation stops access at the verified effective time. It cannot
silently renew a canceled period. Trial use is recorded per account/product and
cannot be repeated by creating another contract.

Upgrades use a verified, full-price new period and then replace current benefits.
Downgrades activate at the next verified paid period boundary. No proration engine
is implemented; an adapter must support those terms or reject the request rather
than inventing prorations. A failed change remains a pending intent and can be
retried idempotently. Canceling the subscription clears its pending change after
verification. Partial refunds retain benefits; a full cumulative refund removes
that payment's benefits. Refund policy and approval remain operator/provider
decisions. A refund request alone never revokes access.

Invoice, receipt and credit-note metadata is provider-neutral: document/payment/
contract IDs, kind, EUR cents and issue time. Financial documents themselves stay
with the provider and are fetched through an authorized adapter. The application
does not generate legally certified invoices or store provider payloads, card
fields, addresses or customer names in the billing ledger. Documents cannot be
silently reassigned or rewritten; corrections use distinct credit notes.

`entitlement()` verifies persisted state after account authorization and returns
features, limits, trial status and expiration. Duplicate contracts do not add
quotas; the maximum valid grant applies. Consumers must verify on the server at
the protected operation, not trust a cached browser response. Current local PDF
generation remains a presentation tool, not a tamper-proof commercial boundary;
future protected deliverables need an authorized server delivery boundary.

`consume()` checks the entitlement and atomically consumes minute/month windows
in UTC. Both limits succeed or neither is charged. The account row lock serializes
workers; revision checks reject stale limits after refund, cancellation or plan
changes. Expiration is rechecked after acquiring the lock, including the earliest
active source expiry. Upgrades/downgrades preserve usage already consumed in the
window. Product/account counters remain separate. Integrating paid Business API
keys requires a server-owned key-to-account mapping and this metering interface;
existing free API keys and their limiter are unchanged until that product launches.

## Deployment and limitations

Apply migration 005 after the four existing migrations with an administrative
connection. Provision accounts via server-only `billing_account_create` and
publish a validated catalog administratively. Construct the repository with a
server secret; a publishable key is explicitly rejected. Do not use `VITE_*`
variables for provider signing secrets or Supabase server secrets.

No billing endpoints or real provider are deployed by this change. Before a paid
launch, implement the selected adapter and authenticated HTTP/webhook handlers,
test hosted checkout/signatures/retries/renewals/refunds in its sandbox, configure
monitoring without payloads or personal data, reconcile settlements and establish
operational policies for taxes, receipts, support and retention. Start with one
approved product. Never infer a successful real transaction from fixture tests.

Billing-account foreign keys restrict deleting an organization or Auth user so
financial references cannot disappear through ordinary tenant deletion. Existing
free tenants without billing accounts still delete normally. Billing-aware closure,
subscription shutdown, archived records and financial retention require an explicit
operator workflow before enabling real accounts. The ledger is bounded to 10 MB
per account; growing accounts will need archival/normalized history. Usage/event
retention jobs and subscription ownership transfer are not implemented yet.

## Verification and files

Tests cover purchase, signed-event boundaries, idempotency, expiration, trials,
cancellation, refunds, upgrades/downgrades, price changes, quota changes and
provider/account isolation. `npm run test:team:database` applies all five migrations
to disposable PostgreSQL and tests browser denial, role checks, event deduplication,
state revisions, atomic limits, concurrent workers and protected financial records.
The full release gate remains `npm run test:predeploy`.

Local verification on 2026-10-11 passed: lint, 878 unit tests in 79 files
(26 new billing tests), 170 database authorization/isolation checks, production
build/prerendering, 19 generated-artifact checks and a crawl of 2,283 URLs with
zero render errors or unreachable sitemap pages. All 1,043 existing calendar
PDFs remain linked. Built browser bundles contain no billing persistence RPCs
or server repository. Provider tests use explicit fixtures, not real payments.
Existing name-day data gaps and PDF chunk/import warnings remain unchanged.

Added files: `src/platform/billing/{catalog,domain,provider,service,supabaseRepository,billing.test}.js`,
migration 005, `scripts/billing-catalog.mjs`, `scripts/billing-db.cases.sql`, and
this document. Integration changes: the PostgreSQL runner, existing browser payment
boundary comments, accounting-firm billing product ID, architecture/security docs.
