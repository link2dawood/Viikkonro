import { describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import { createHmac } from "node:crypto";
import { createPolarProvider } from "./polar.js";
import { createInvoiceMailer } from "./invoiceEmail.js";
import { purchaseRecord, processPurchaseNotification, PURCHASE_MARKETING_VERSION } from "./purchaseRecord.js";
import { createPurchaseStore } from "./purchaseStore.js";
import { handleCommerce } from "./http.js";

const at = "2026-10-11T12:00:00Z";
const config = { environment: "production", accessToken: "test-token", organizationId: "org-1", productId: "product-1", priceId: "price-1" };
const session = { ...config, productId: "company-calendar", providerProductId: "product-1", contractId: "contract-1", checkoutId: "checkout-1", year: 2027 };
const metadata = { viikkonro_contract: "contract-1", viikkonro_product: "company-calendar", calendar_year: 2027 };
const order = {
  id: "order-1", paid: true, product_id: "product-1", checkout_id: "checkout-1", customer_id: "customer-1", customer: { organization_id: "org-1", email: "Buyer@example.test", tax_id: ["FI123", "fi_vat"], card: "must-not-persist" },
  currency: "eur", subtotal_amount: 2311, tax_amount: 589, total_amount: 2900,
  refunded_amount: 0, refunded_tax_amount: 0, discount_amount: 0, items: [{ product_price_id: "price-1" }],
  metadata, created_at: at, modified_at: at, invoice_number: "INV-1", is_invoice_generated: true,
  billing_name: "Ääkköset Oy", billing_address: { city: "Jyväskylä", country: "FI", unknown: "must-not-persist" },
};
const pdf = Buffer.from("%PDF-1.7\nOfficial Polar invoice fixture");
function fixtureProvider(overrides = {}, invoiceUrl = "https://polar-files.s3.eu-central-1.amazonaws.com/invoice.pdf") {
  const row = { ...order, ...overrides };
  const fetchImpl = vi.fn(async url => {
    const path = new URL(url).pathname;
    if (path === "/v1/orders/order-1") return Response.json(row);
    if (path === "/v1/products/product-1") return Response.json({ organization_id: "org-1", prices: [{ id: "price-1", amount_type: "fixed", price_currency: "eur", price_amount: 2900, tax_behavior: "inclusive" }] });
    if (path === "/v1/checkouts/checkout-1") return Response.json({ organization_id: "org-1", product_id: "product-1", metadata: row.metadata });
    if (path.endsWith("/invoice")) return row.is_invoice_generated ? Response.json({ url: invoiceUrl }) : new Response(null, { status: 202 });
    return new Response(pdf, { headers: { "Content-Type": "application/pdf" } });
  });
  return { provider: createPolarProvider(config, { fetchImpl }), fetchImpl };
}
function dependencies() {
  let submitted = false;
  return {
    provider: { purchase: vi.fn(async () => ({ record: purchaseRecord(order, session), invoiceGenerated: true })), invoicePdf: vi.fn(async () => pdf) },
    store: { record: vi.fn(async () => {}), claim: vi.fn(async () => submitted ? { status: "sent" } : { status: "claimed", token: "claim-1" }), complete: vi.fn(async () => { submitted = true; }), release: vi.fn(async () => {}) },
    mailer: { sendInvoice: vi.fn(async () => ({ id: "message-1" })) },
  };
}

describe("authoritative purchase records", () => {
  it("collects invoice billing details and sends only explicit promotional consent at checkout", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ id: "checkout-1", organization_id: "org-1", product_id: "product-1", currency: "eur", url: "https://polar.sh/checkout/test" }));
    const provider = createPolarProvider(config, { fetchImpl });
    const input = { year: 2027, contractId: "contract-1", catalog: { providerProductId: "product-1", organizationId: "org-1" }, successUrl: "https://viikkonro.fi/yrityskalenteri", returnUrl: "https://viikkonro.fi/yrityskalenteri", consentAt: at };
    await provider.startCheckout(input);
    const declined = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(declined.require_billing_address).toBe(true);
    expect(declined.is_business_customer).toBe(true);
    expect(declined.metadata).not.toHaveProperty("marketing_consent");
    await provider.startCheckout({ ...input, marketingConsent: true });
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body).metadata).toMatchObject({ marketing_consent: true, marketing_consent_version: PURCHASE_MARKETING_VERSION, marketing_consent_at: at });
  });
  it.each([2026, 2027, 2028])("records the actual selected year %i and retrieves official PDF", async year => {
    const { provider } = fixtureProvider({ metadata: { ...metadata, calendar_year: year } });
    const purchase = await provider.purchase("order-1");
    expect(purchase.record.calendar_year).toBe(year);
    expect(purchase.record.email).toBe("buyer@example.test");
    expect(await provider.invoicePdf(purchase)).toEqual(pdf);
  });
  it("allowlists billing data without card data, extra address fields or raw metadata", () => {
    const record = purchaseRecord(order, session);
    expect(record.billing_name).toBe("Ääkköset Oy");
    expect(record.billing_address).toEqual({ city: "Jyväskylä", country: "FI" });
    expect(JSON.stringify(record)).not.toContain("must-not-persist");
    expect(record).not.toHaveProperty("metadata");
    expect(record.marketing_consent).toBe(false);
  });
  it.each(["product-1","another-product"])("checks historical checkout prices against their product: %s", async productId => {
    const { fetchImpl } = fixtureProvider();
    const originalFetch = fetchImpl.getMockImplementation();
    fetchImpl.mockImplementation(async url => {
      const path = new URL(url).pathname;
      if (path === "/v1/products/product-1") return Response.json({ organization_id:"org-1",prices:[{ id:"price-10",product_id:"product-1",amount_type:"fixed",price_currency:"eur",price_amount:1000,tax_behavior:"inclusive" }] });
      if (path === "/v1/checkouts/checkout-1") return Response.json({ organization_id:"org-1",product_id:"product-1",metadata,product_price:{ id:"price-1",product_id:productId,amount_type:"fixed",price_currency:"eur",price_amount:2900,tax_behavior:"inclusive",is_archived:true } });
      return originalFetch(url);
    });
    const provider = createPolarProvider({ ...config,priceId:"price-10" },{ fetchImpl });
    if (productId !== "product-1") {
      await expect(provider.purchase("order-1")).rejects.toThrow("payment_mismatch");
    } else {
      const purchase = await provider.purchase("order-1");
      expect(purchase.record.total_cents).toBe(2900);
      expect(await provider.invoicePdf(purchase)).toEqual(pdf);
    }
  });
  it("requires explicit versioned, timestamped consent", () => {
    for (const change of [{ marketing_consent: "true" }, { marketing_consent: true }, { marketing_consent: true, marketing_consent_version: "wrong", marketing_consent_at: at }]) {
      expect(purchaseRecord({ ...order, metadata: { ...metadata, ...change } }, session).marketing_consent).toBe(false);
    }
    const record = purchaseRecord({ ...order, metadata: { ...metadata, marketing_consent: true, marketing_consent_version: PURCHASE_MARKETING_VERSION, marketing_consent_at: at } }, session);
    expect(record.marketing_consent).toBe(true);
    expect(record.marketing_consent_at).toBe("2026-10-11T12:00:00.000Z");
  });
  it("does not send invoices for unpaid or unlaunched products", async () => {
    expect(await fixtureProvider({ paid: false }).provider.purchase("order-1")).toBeNull();
    expect(await fixtureProvider({ product_id: "other" }).provider.purchase("order-1")).toBeNull();
  });
  it.each([{ customer: { ...order.customer, organization_id: "another-tenant" } }, { total_amount: 3000 }, { items: [{ product_price_id: "other" }] }, { metadata: { ...metadata, calendar_year: 9999 } }])("rejects mismatched purchase %j", async change => {
    await expect(fixtureProvider(change).provider.purchase("order-1")).rejects.toThrow();
  });
  it("requests invoice generation and defers until it is ready", async () => {
    const { provider, fetchImpl } = fixtureProvider({ is_invoice_generated: false });
    await expect(provider.invoicePdf(await provider.purchase("order-1"))).rejects.toThrow("receipt_pending");
    expect(fetchImpl.mock.calls.at(-1)[1].method).toBe("POST");
  });
  it.each(["http://polar.sh/invoice", "https://localhost/invoice", "https://evil.test/invoice", "https://polar.sh@evil.test/invoice"])("rejects unsafe invoice URL %s", async url => {
    const { provider, fetchImpl } = fixtureProvider({}, url);
    await expect(provider.invoicePdf(await provider.purchase("order-1"))).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });
  it("rejects non-PDF and oversized chunked invoice downloads", async () => {
    for (const data of [Buffer.from("not a PDF"), Buffer.alloc(5242881)]) {
      const fetchImpl = async url => new URL(url).pathname.startsWith("/v1/")
        ? Response.json({ url: "https://polar-files.s3.eu-central-1.amazonaws.com/invoice.pdf" })
        : new Response(data);
      await expect(createPolarProvider(config, { fetchImpl }).invoicePdf({ record: { order_id: "order-1" }, invoiceGenerated: true })).rejects.toThrow("invalid_invoice_pdf");
    }
  });
});

describe("durable invoice notification flow", () => {
  it("stores before sending; repeated webhooks send once", async () => {
    const deps = dependencies();
    await processPurchaseNotification({ orderId: "order-1" }, deps);
    await processPurchaseNotification({ orderId: "order-1" }, deps);
    expect(deps.store.record).toHaveBeenCalledTimes(2);
    expect(deps.mailer.sendInvoice).toHaveBeenCalledOnce();
    expect(deps.store.record.mock.invocationCallOrder[0]).toBeLessThan(deps.mailer.sendInvoice.mock.invocationCallOrder[0]);
  });
  it("persists data and releases failed invoice/email jobs for provider retries", async () => {
    const deps = dependencies();
    deps.mailer.sendInvoice.mockRejectedValueOnce(new Error("private provider response"));
    await expect(processPurchaseNotification({ orderId: "order-1" }, deps)).rejects.toThrow("receipt_pending");
    expect(deps.store.record).toHaveBeenCalledOnce();
    expect(deps.store.release).toHaveBeenCalledWith("order-1", "claim-1");
    await processPurchaseNotification({ orderId: "order-1" }, deps);
    expect(deps.store.complete).toHaveBeenCalledOnce();
  });
  it("storage failure cannot send an unrecorded invoice", async () => {
    const deps = dependencies(); deps.store.record.mockRejectedValueOnce(new Error("unavailable"));
    await expect(processPurchaseNotification({ orderId: "order-1" }, deps)).rejects.toThrow();
    expect(deps.mailer.sendInvoice).not.toHaveBeenCalled();
  });
  it("busy workers retry; refunded orders record without resending invoices", async () => {
    const deps = dependencies(); deps.store.claim.mockResolvedValue({ status: "busy" });
    await expect(processPurchaseNotification({ orderId: "order-1" }, deps)).rejects.toThrow("receipt_pending");
    deps.provider.purchase.mockResolvedValue({ record: { ...purchaseRecord(order, session), refunded_cents: 2900 } });
    await processPurchaseNotification({ orderId: "order-1" }, deps);
    expect(deps.store.record).toHaveBeenCalledTimes(2);
    expect(deps.mailer.sendInvoice).not.toHaveBeenCalled();
  });
  it("only signed webhook identifiers reach the processor; failures return retryable status", async () => {
    const raw = JSON.stringify({ type: "order.updated", data: { id: "order-1", email: "not-trusted@example.test" } });
    const secret = "webhook-secret-test", timestamp = `${Date.parse(at) / 1000}`;
    const signature = createHmac("sha256", secret).update(`event-1.${timestamp}.${raw}`).digest("base64");
    const request = valid => new Request("https://viikkonro.fi/api/billing/webhook", { method: "POST", body: raw, headers: { "webhook-id": "event-1", "webhook-timestamp": timestamp, "webhook-signature": valid ? `v1,${signature}` : "v1,invalid" } });
    const process = vi.fn(async () => { throw new Error("no private details in response"); });
    const deps = { now: () => at, webhookSecret: secret, onPurchaseNotification: process };
    expect((await handleCommerce(request(false), deps)).status).toBe(400);
    expect(process).not.toHaveBeenCalled();
    const response = await handleCommerce(request(true), deps);
    expect(response.status).toBe(503);
    expect(process).toHaveBeenCalledWith({ type: "order.updated", orderId: "order-1" });
    expect(await response.text()).not.toContain("private details");
  });
});

describe("invoice email and private persistence adapters", () => {
  const env = { MAILJET_API_KEY: "key", MAILJET_SECRET_KEY: "secret", MAILJET_FROM_EMAIL: "hi@viikkonro.fi", BILLING_OWNER_EMAIL: "owner@example.test" };
  it("sends the official invoice to the buyer with BCC, disabled tracking and deduplication", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ Messages: [{ Status: "success", To: [{ MessageUUID: "message-1" }] }] }));
    await createInvoiceMailer(env, { fetchImpl }).sendInvoice(purchaseRecord(order, session), pdf);
    const message = JSON.parse(fetchImpl.mock.calls[0][1].body).Messages[0];
    expect(message.To).toEqual([{ Email: "buyer@example.test" }]);
    expect(message.Bcc).toEqual([{ Email: "owner@example.test" }]);
    expect(message).not.toHaveProperty("Cc");
    expect(message.TextPart).toContain("29,00");
    expect(Buffer.from(message.Attachments[0].Base64Content, "base64")).toEqual(pdf);
    expect(message.DeduplicateCampaign).toBe(true);
    expect(message.TrackOpens).toBe("disabled"); expect(message.TrackClicks).toBe("disabled");
  });
  it("does not BCC the same recipient twice; provider errors fail safely", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ Messages: [{ Status: "error" }] }));
    await expect(createInvoiceMailer({ ...env, BILLING_OWNER_EMAIL: "buyer@example.test" }, { fetchImpl }).sendInvoice(purchaseRecord(order, session), pdf)).rejects.toThrow("invoice_email_unavailable");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).Messages[0]).not.toHaveProperty("Bcc");
  });
  it("DB credentials stay server-side and only whitelisted RPCs are called", async () => {
    const fetchImpl = vi.fn(async () => Response.json(true));
    const store = createPurchaseStore({ BILLING_SUPABASE_URL: "https://example.supabase.co", BILLING_SUPABASE_SECRET: "service-only" }, { fetchImpl });
    await store.record(purchaseRecord(order, session));
    expect(fetchImpl.mock.calls[0][0].pathname).toBe("/rest/v1/rpc/commerce_record_purchase");
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe("Bearer service-only");
    await expect(createPurchaseStore({ BILLING_SUPABASE_URL: "http://localhost" }, { fetchImpl }).claim("order-1")).rejects.toThrow();
  });
});
