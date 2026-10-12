import { fail } from "./catalog.js";

export const PURCHASE_MARKETING_VERSION = "planning-offers-fi-v1";
export const PURCHASE_MARKETING_TEXT = "Haluan sähköpostitse Viikkonron suunnittelutuotteiden uutisia ja tarjouksia. Voin perua suostumuksen milloin tahansa.";

const text = (value, max = 300) => typeof value === "string" ? value.slice(0, max) : null;
export const validEmail = value => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value) && !value.includes(String.fromCharCode(0));

// Explicit allowlist: never retain raw provider payloads, card details, calendar
// content, arbitrary metadata or company uploads.
export function purchaseRecord(order, session) {
  if (!validEmail(order.customer?.email)) fail("invalid_customer_email");
  const address = Object.fromEntries(["line1", "line2", "postal_code", "city", "state", "country"]
    .map(key => [key, text(order.billing_address?.[key])]).filter(([, value]) => value !== null));
  const consent = order.metadata?.marketing_consent === true &&
    order.metadata?.marketing_consent_version === PURCHASE_MARKETING_VERSION &&
    Number.isFinite(Date.parse(order.metadata?.marketing_consent_at));
  return {
    provider: "polar", environment: session.environment, order_id: order.id,
    customer_id: order.customer_id, checkout_id: order.checkout_id,
    product_id: session.productId, provider_product_id: order.product_id,
    price_id: session.priceId, contract_id: session.contractId, calendar_year: session.year,
    email: order.customer.email.trim().toLowerCase(), billing_name: text(order.billing_name),
    billing_address: address,
    tax_id: Array.isArray(order.customer.tax_id) ? order.customer.tax_id.map(v => text(v, 80)) : null,
    currency: "EUR", subtotal_cents: order.subtotal_amount, tax_cents: order.tax_amount,
    total_cents: order.total_amount,
    refunded_cents: (order.refunded_amount ?? 0) + (order.refunded_tax_amount ?? 0),
    invoice_number: text(order.invoice_number, 100),
    purchased_at: new Date(order.created_at).toISOString(),
    provider_updated_at: new Date(order.modified_at ?? order.created_at).toISOString(),
    marketing_consent: consent,
    marketing_consent_version: consent ? PURCHASE_MARKETING_VERSION : null,
    marketing_consent_at: consent ? new Date(order.metadata.marketing_consent_at).toISOString() : null,
  };
}

export async function processPurchaseNotification(event, { provider, store, mailer }) {
  if (!event.orderId) return;
  const purchase = await provider.purchase(event.orderId);
  if (!purchase) return; // Other products and unpaid orders are not launched here.
  await store.record(purchase.record);
  if (purchase.record.refunded_cents >= purchase.record.total_cents) return;
  const claim = await store.claim(purchase.record.order_id);
  if (claim.status === "sent" || claim.status === "cancelled") return;
  if (claim.status !== "claimed") fail("receipt_pending");
  try {
    const pdf = await provider.invoicePdf(purchase);
    const delivery = await mailer.sendInvoice(purchase.record, pdf);
    await store.complete(purchase.record.order_id, claim.token, delivery.id);
  } catch {
    await store.release(purchase.record.order_id, claim.token);
    // Make Polar retry. The DB record survives provider/network/email failures.
    fail("receipt_pending");
  }
}
