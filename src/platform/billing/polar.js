import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, identifier } from "./catalog.js";
import { purchaseRecord, PURCHASE_MARKETING_VERSION } from "./purchaseRecord.js";

const hosts = { production: "https://api.polar.sh", sandbox: "https://sandbox-api.polar.sh" };
const checkoutHosts = { production: "polar.sh", sandbox: "sandbox.polar.sh" };
export const POLAR_API_VERSION = "2026-10";
export function polarConfig(env = process.env) {
  const environment = env.POLAR_ENVIRONMENT ?? "production";
  if (!Object.hasOwn(hosts, environment)) fail("invalid_polar_environment");
  return { environment, accessToken: env.POLAR_ACCESS_TOKEN, organizationId: env.POLAR_ORGANIZATION_ID, productId: env.POLAR_PRODUCT_ID, priceId: env.POLAR_PRICE_ID, webhookSecret: env.POLAR_WEBHOOK_SECRET, enabled: env.POLAR_ENABLED === "true" };
}
export function validatePolarCheckoutUrl(value, environment) {
  const url = new URL(value);
  const hasCredentials = Boolean(url.username) || Boolean(url.password);
  if (url.protocol !== "https:" || url.hostname !== checkoutHosts[environment] || hasCredentials || url.port || !url.pathname.startsWith("/checkout/")) fail("invalid_checkout_url");
  return url.toString();
}
export function createPolarProvider(config, { fetchImpl = fetch } = {}) {
  if (typeof window !== "undefined") fail("server_only");
  if (!Object.hasOwn(hosts, config.environment)) fail("invalid_polar_environment");
  const configured = Boolean(config.accessToken && identifier(config.organizationId));
  const api = async (path, method = "GET", body) => {
    if (!configured) fail("payment_not_configured");
    const response = await fetchImpl(`${hosts[config.environment]}/v1${path}`, { method, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json", "Polar-Version": POLAR_API_VERSION }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (!response.ok) fail("polar_unavailable");
    return response.status === 202 || response.status === 204 ? null : response.json();
  };
  return {
    id: "polar", configured, environment: config.environment,
    async catalog() {
      if (!config.enabled || !configured || !identifier(config.productId) || !identifier(config.priceId)) return { enabled: false };
      const product = await api(`/products/${config.productId}`);
      const price = product.prices?.find(row => row.id === config.priceId && !row.is_archived);
      if (product.organization_id !== config.organizationId || product.is_archived || product.is_recurring || product.visibility === "draft" || product.prices.filter(row => !row.is_archived && row.price_currency === "eur").length !== 1 || !price || price.amount_type !== "fixed" || price.price_currency !== "eur" || !Number.isSafeInteger(price.price_amount) || price.price_amount < 1 || price.tax_behavior !== "inclusive") fail("invalid_polar_product");
      return { enabled: true, productId: "company-calendar", providerProductId: product.id, priceId: price.id, organizationId: config.organizationId, amountCents: price.price_amount, currency: "EUR", term: "calendar-year" };
    },
    async startCheckout({ year, contractId, successUrl, returnUrl, catalog, marketingConsent = false, consentAt }) {
      const checkout = await api("/checkouts/", "POST", { products: [catalog.providerProductId], currency: "eur", allow_discount_codes: false, allow_trial: false, require_billing_address: true, is_business_customer: true, metadata: { viikkonro_product: "company-calendar", viikkonro_contract: contractId, calendar_year: year, ...(marketingConsent ? { marketing_consent: true, marketing_consent_version: PURCHASE_MARKETING_VERSION, marketing_consent_at: consentAt } : {}) }, success_url: successUrl, return_url: returnUrl, locale: "fi" });
      if (!identifier(checkout.id) || checkout.organization_id !== catalog.organizationId || checkout.product_id !== catalog.providerProductId || checkout.currency !== "eur") fail("invalid_checkout");
      return { checkoutId: checkout.id, url: validatePolarCheckoutUrl(checkout.url, config.environment) };
    },
    async payment(session) {
      if (session.environment !== config.environment || session.organizationId !== config.organizationId) fail("purchase_environment_mismatch");
      const result = await api(`/orders/?checkout_id=${encodeURIComponent(session.checkoutId)}&organization_id=${encodeURIComponent(session.organizationId)}&limit=2`);
      if (!Array.isArray(result.items) || result.items.length > 1 || (result.pagination?.total_count ?? result.items.length) > 1) fail("ambiguous_payment");
      const order = result.items[0];
      if (!order) return null;
      return reconcilePolarOrder(order, session);
    },
    async purchase(orderId) {
      if (!identifier(orderId)) fail("invalid_order");
      const order = await api(`/orders/${encodeURIComponent(orderId)}`);
      if (order.id !== orderId) fail("payment_mismatch");
      if (order.product_id !== config.productId || order.paid !== true) return null;
      const product = await api(`/products/${config.productId}`);
      const checkout = await api(`/checkouts/${encodeURIComponent(order.checkout_id)}`);
      if (product.organization_id !== config.organizationId || checkout.organization_id !== config.organizationId || checkout.product_id !== config.productId || order.customer?.organization_id !== config.organizationId) fail("payment_mismatch");
      const priceId = order.items?.[0]?.product_price_id;
      // Product responses omit archived prices. An older checkout retains its
      // authoritative selected price, so invoices survive catalog changes.
      const price = product.prices?.find(row => row.id === priceId) ??
        (checkout.product_price?.id === priceId && checkout.product_price.product_id === config.productId ? checkout.product_price : null);
      if (!price || price.amount_type !== "fixed" || price.price_currency !== "eur" || price.tax_behavior !== "inclusive" || !Number.isSafeInteger(price.price_amount) || price.price_amount < 1) fail("payment_mismatch");
      const year = Number(order.metadata?.calendar_year), contractId = order.metadata?.viikkonro_contract;
      if (!Number.isInteger(year) || year < 2020 || year > 2100 || !identifier(contractId) || checkout.metadata?.viikkonro_contract !== contractId || Number(checkout.metadata?.calendar_year) !== year) fail("payment_mismatch");
      const session = { environment: config.environment, organizationId: config.organizationId, checkoutId: order.checkout_id, providerProductId: config.productId, priceId, productId: "company-calendar", year, contractId, amountCents: price.price_amount };
      reconcilePolarOrder(order, session);
      // Consent comes from server-created checkout metadata, never a webhook body.
      const record = purchaseRecord({ ...order, metadata: checkout.metadata }, session);
      return { record, invoiceGenerated: order.is_invoice_generated === true };
    },
    async invoicePdf(purchase) {
      const id = purchase.record.order_id;
      if (!purchase.invoiceGenerated) {
        await api(`/orders/${encodeURIComponent(id)}/invoice`, "POST");
        fail("receipt_pending"); // order.updated and webhook retries resume later.
      }
      const invoice = await api(`/orders/${encodeURIComponent(id)}/invoice`);
      const url = new URL(invoice.url);
      const trusted = url.hostname === "polar.sh" || url.hostname.endsWith(".polar.sh") || url.hostname.endsWith(".amazonaws.com") || url.hostname.endsWith(".r2.cloudflarestorage.com");
      const hasCredentials = Boolean(url.username) || Boolean(url.password);
      if (!trusted || url.protocol !== "https:" || hasCredentials || url.port) fail("invalid_invoice_url");
      const response = await fetchImpl(url.href, { redirect: "error", signal: AbortSignal.timeout(15000) });
      if (!response.ok || Number(response.headers.get("content-length")) > 5242880) fail("invalid_invoice_pdf");
      const reader = response.body?.getReader();
      if (!reader) fail("invalid_invoice_pdf");
      const chunks = []; let length = 0;
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 5242880) { await reader.cancel(); fail("invalid_invoice_pdf"); }
        chunks.push(Buffer.from(value));
      }
      const pdf = Buffer.concat(chunks);
      if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") fail("invalid_invoice_pdf");
      return pdf;
    },
    async resumeCheckout(session, { marketingConsent = false,successUrl,returnUrl } = {}) {
      const checkout = await api(`/checkouts/${encodeURIComponent(session.checkoutId)}`);
      if (checkout.organization_id !== session.organizationId || checkout.product_id !== session.providerProductId || checkout.metadata?.viikkonro_contract !== session.contractId) fail("payment_mismatch");
      if (["confirmed","succeeded"].includes(checkout.status)) fail("payment_pending");
      if ((checkout.metadata?.marketing_consent === true) !== marketingConsent) return null;
      if (checkout.require_billing_address !== true) return null;
      // An older session may point at another tool/year. Do not reuse it until
      // its server-verified return URLs match the current request.
      if ((successUrl && checkout.success_url !== successUrl) || (returnUrl && checkout.return_url !== returnUrl)) return null;
      if (checkout.status === "open" && Date.parse(checkout.expires_at) > Date.now()) return validatePolarCheckoutUrl(checkout.url,config.environment);
      return null;
    },
    async createProduct({ name, description, amountCents }) {
      if (!Number.isSafeInteger(amountCents) || amountCents < 1) fail("invalid_amount");
      return api("/products/", "POST", { name, description, visibility: "draft", prices: [{ amount_type: "fixed", price_currency: "eur", price_amount: amountCents, tax_behavior: "inclusive" }], metadata: { viikkonro_product: "company-calendar", license_term: "calendar-year" } });
    },
  };
}

// Standard Webhooks signature verification over the ORIGINAL raw bytes.
// This endpoint never grants access; every export rereads the authoritative order.
export function verifyPolarWebhook(raw, headers, secret, now = Date.now()) {
  raw = Buffer.from(raw);
  if (!secret || raw.length > 262144) fail("invalid_webhook");
  const id = headers.get("webhook-id"), timestamp = headers.get("webhook-timestamp"), signatures = headers.get("webhook-signature");
  if (!identifier(id) || !/^\d+$/.test(timestamp ?? "") || Math.abs(now / 1000 - Number(timestamp)) > 300 || !signatures) fail("invalid_webhook");
  const key = Buffer.from(secret, "utf8");
  if (key.length < 16) fail("invalid_webhook_secret");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.`).update(raw).digest();
  if (!signatures.split(" ").some(row => { const [version, value] = row.split(","); const actual = Buffer.from(value ?? "", "base64"); return version === "v1" && actual.length === expected.length && timingSafeEqual(actual, expected); })) fail("invalid_webhook");
  const payload = JSON.parse(raw.toString("utf8"));
  if (!["order.paid", "order.refunded", "order.updated"].includes(payload.type)) return { type: "ignored" };
  return { type: payload.type, ...(identifier(payload.data?.id) ? { orderId: payload.data.id } : {}) }; // Only the ID is forwarded; re-fetch authoritative data.
}

function reconcilePolarOrder(order, session) {
  const totalRefund = (order.refunded_amount ?? 0) + (order.refunded_tax_amount ?? 0);
  // The product's inclusive price is fixed; tax is calculated by Polar.
  // No promotions, subscriptions, seats or zero-payment orders are allowed.
  if (order.checkout_id !== session.checkoutId || order.product_id !== session.providerProductId || order.subscription_id || order.currency !== "eur" || order.discount_amount !== 0 || !Number.isSafeInteger(order.total_amount) || order.total_amount < 1 || order.total_amount > session.amountCents || !Array.isArray(order.items) || order.items.length !== 1 || order.items[0].product_price_id !== session.priceId || order.metadata?.viikkonro_contract !== session.contractId || Number(order.metadata?.calendar_year) !== session.year || order.metadata?.viikkonro_product !== session.productId || !Number.isSafeInteger(totalRefund)) fail("payment_mismatch");
  return { paid: order.paid === true, checkoutId: order.checkout_id, productId: order.product_id, priceId: session.priceId, organizationId: session.organizationId, contractId: session.contractId, year: session.year, currency: "EUR", amountCents: order.total_amount, refundedCents: totalRefund, paidAt: new Date(order.created_at).toISOString() };
}
