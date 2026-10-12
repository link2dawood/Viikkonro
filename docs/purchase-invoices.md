# Purchase records and invoice notifications

Only the launched Company Calendar product is handled. Successful purchases do
not automatically subscribe customers to promotional emails or launch any other
products. No campaign sending or marketing list export is implemented here.

## Flow

### Buyer journey

The shared checkout panel on `/yrityskalenteri` and `/yrityskalenteri/ics`
explains these steps in Finnish:

1. Select a year, create a local calendar draft and check the free preview.
2. Choose the one-time purchase for that calendar year. Promotional consent is
   optional and unchecked. Enter billing details and pay in Polar's hosted checkout.
3. Return to the builder. The server verifies payment with Polar before enabling
   PDF, XLSX, CSV and ICS downloads. A redirect alone never grants access.
4. Save the private restore code and the calendar draft separately. The code
   restores export entitlement, not the draft, until the selected year's end.
5. Obtain the official invoice through Polar's purchase confirmation. The
   additional Mailjet buyer/BCC email requires an active sender; see operations below.

No account or recurring subscription is required for this product. Other planning
products are not automatically unlocked by a Company Calendar purchase.

### Server processing

1. Checkout requests billing details from Polar. The optional Finnish promotional
   checkbox defaults to unchecked. Its boolean, version and server timestamp
   become checkout metadata only when selected. Changing the selection creates
   a fresh checkout rather than reusing a session with different consent.
2. Signed `order.paid`, `order.updated` and `order.refunded` notifications forward
   only an order ID. The server retrieves the order, checkout and product from
   Polar and verifies organization, product, price, contract, year, EUR amounts
   and payment. Neither webhook fields nor the redirect prove payment.
3. An explicit allowlist is stored in `private.commerce_purchases`: purchaser
   email, billing name/address, optional tax ID, provider/customer/order/checkout
   identifiers, selected year, original payment/tax amounts, refund amount,
   invoice number and recorded consent. Raw provider payloads, arbitrary custom
   fields, card details, calendars and logos are excluded.
4. A durable outbox claims one invoice job at a time. If necessary, request the
   official Polar invoice; generation is asynchronous. `order.updated` or Polar
   retries resume processing. Downloads are bounded to 5 MiB and restricted to
   HTTPS provider/storage hosts, without forwarding authorization or following
   redirects.
5. Mailjet sends the official PDF to the purchaser and BCCs `BILLING_OWNER_EMAIL`.
   The owner address is not a CC recipient. No restore code or other entitlement
   bearer credential is shared in the message. Open/click tracking is disabled.
   An order-specific campaign with `DeduplicateCampaign` prevents recipient
   duplicates after a successful send followed by a database/network failure.
6. API acceptance is recorded as `submitted_at`; it is not proof of inbox
   delivery. Failed jobs remain pending and the webhook returns 503 for retries.
   Refunds update the billing record. Full refunds cancel unsent invoice jobs;
   exports continue using the existing authoritative entitlement checks.

## Configuration and operations

Apply `202610110007_purchase_records.sql` and `202610110008_purchase_consent_constraint.sql`. Configure server-only
`MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_FROM_EMAIL` and
`BILLING_OWNER_EMAIL`. An active Mailjet sender/domain is required. Never prefix
these variables with `VITE_`. Purchase records and outbox tables use RLS with no
browser grants; RPCs are service-role-only, including for organization owners.

Supabase migrations 007–008 and encrypted Vercel production variables were configured
on 2026-10-11. Polar's existing endpoint now includes `order.updated`. At the time
of setup, Mailjet reported `hi@viikkonro.fi` as **Inactive** and had no verified
domain. Do not report customer/BCC delivery as operational until activation and
a completed real buyer order have been checked. No payment or fabricated invoice
was created for release testing.

Inspect pending jobs from the restricted Supabase SQL editor:

```sql
select order_id,status,attempts,last_error_code,updated_at
from private.commerce_invoice_outbox
where status in ('pending','processing') order by updated_at;
```

After repairing a sender/network issue, replay the failed order webhook in
Polar's dashboard. Retries are provided by Polar, not an infinite background
queue. Once Polar exhausts retries, operator replay is required. `sent` means
Mailjet accepted the message, not that the inbox received it. Investigate actual
delivery/bounces in Mailjet without adding customer payloads to application logs.

Billing records are not a marketing list. Future campaigns must use only the
minimum recipient data and require `marketing_consent=true`, the expected
consent version, a recorded consent timestamp and `marketing_revoked_at is null`.
Deduplicate email addresses and exclude an address if any matching record has a
withdrawal. Handle withdrawal requests sent to `hi@viikkonro.fi` using the
restricted SQL editor or service-role RPC:

```sql
select public.commerce_revoke_marketing('customer@example.com');
```

Webhook replay cannot restore withdrawn consent. No automatic promotional
messages are sent. Before launching campaigns, add a secure unsubscribe link,
define a documented retention schedule and review the customer-data handling
policy. Keep required billing records separate from removable marketing data.

## Verification

Run `npm run test:predeploy` and `npm run test:team:database`. Tests cover signed
webhook boundaries, live-provider reconciliation, 2026–2028, omitted consent,
invoice generation, unsafe download URLs, allowlisted data, BCC behavior,
tracking disablement, duplicate/failure/refund handling, consent withdrawal and
concurrent database claims. Adapter tests use fixtures, never real charges.

Official references:
- https://polar.sh/docs/features/orders
- https://polar.sh/docs/api-reference/orders/post-invoice
- https://polar.sh/docs/api-reference/orders/get-invoice
- https://dev.mailjet.com/docs/email-api/send-api-v31/send-basic-email
- https://dev.mailjet.com/docs/email-api/send-api-v31/group-campaign
