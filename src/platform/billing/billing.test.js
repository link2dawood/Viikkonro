import { describe, expect, it } from "vitest";
import { DRAFT_BILLING_CATALOG, salePlan, validateCatalog } from "./catalog.js";
import { emptyBillingState, verifyEntitlement } from "./domain.js";
import { createBillingService } from "./service.js";
import { createSupabaseBillingRepository } from "./supabaseRepository.js";

const account = "10000000-0000-0000-0000-000000000001", actor = "owner";
const product = "business-calendar-api";
const plan = (id, rank, amount, kind = "subscription") => ({ id, productId: product, active: true, priceId: `${id}-eur-v1`, currency: "EUR", amountCents: amount, kind, rank, interval: kind === "subscription" ? "month" : undefined, durationDays: kind === "one-time" ? 365 : undefined, trialDays: kind === "subscription" ? 7 : 0, grants: [{ productId: product, features: ["api-access", ...(rank > 1 ? ["premium"] : [])] }], limits: [{ productId: product, key: "requests", period: "minute", max: rank * 2 }, { productId: product, key: "requests", period: "month", max: rank * 10 }] });
const catalog = () => ({ version: 1, products: [{ id: product, launched: true }], plans: [plan("basic", 1, 1000), plan("pro", 2, 2000), plan("annual-export", 1, 3000, "one-time")] });

// Test fixtures only: production persistence always uses a server repository.
function fixture() {
  let now = "2027-01-01T00:00:00.000Z", sequence = 0, config = catalog(), deny = false, conflictOnce = false;
  const records = new Map([[account, { revision: 0, state: emptyBillingState(account) }]]), events = new Set(), counters = new Map(), calls = [];
  const repository = {
    async catalog() { return config; },
    async authorize(id, user) { return !deny && id === account && user === actor; },
    async load(id) { if (!records.has(id)) throw new Error("unknown_account"); return structuredClone(records.get(id)); },
    async commit(id, revision, state, key) {
      if (key && events.has(key)) return { status: "duplicate" };
      if (conflictOnce) { conflictOnce = false; return { status: "conflict" }; }
      if (records.get(id).revision !== revision) return { status: "conflict" };
      records.set(id, { revision: revision + 1, state: structuredClone(state) }); if (key) events.add(key); return { status: "ok" };
    },
    async consume(id, revision, productId, key, limits, amount, expires) {
      if (records.get(id).revision !== revision) return { status: "conflict" };
      if (now >= expires) return { status: "not_entitled" };
      const rows = limits.map(l => ({ ...l, counter: `${id}:${productId}:${key}:${l.period}:${l.period === "minute" ? now.slice(0, 16) : now.slice(0, 7)}` }));
      if (rows.some(l => (counters.get(l.counter) ?? 0) + amount > l.max)) return { status: "usage_limit" };
      rows.forEach(l => counters.set(l.counter, (counters.get(l.counter) ?? 0) + amount)); return { status: "ok" };
    },
  };
  const provider = {
    id: "fixture", configured: true,
    async startCheckout(request) { calls.push(request); return { status: "redirect", url: "https://payments.invalid/hosted" }; },
    async verifyWebhook(body, headers) { if (headers.signature !== "verified-fixture") throw new Error("invalid_signature"); return structuredClone(body); },
    async cancel(request) { calls.push(request); return { status: "requested" }; },
    async changePlan(request) { calls.push(request); return { status: "requested" }; },
    async refund(request) { calls.push(request); return { status: "requested" }; },
    async document(request) { return { status: "redirect", url: `https://payments.invalid/${request.documentId}` }; },
  };
  const service = createBillingService({ repository, provider, clock: () => now, newId: () => `contract-${++sequence}` });
  const purchase = async (planId = "basic", requestKey = `purchase-${sequence + 1}`) => { await service.purchase({ accountId: account, actorId: actor, planId, requestKey }); return records.get(account).state.contracts.at(-1); };
  const notify = event => service.webhook({ id: `event-${++sequence}`, provider: "fixture", accountId: account, occurredAt: now, ...event }, { signature: "verified-fixture" });
  const pay = async (contract, options = {}) => notify({ contractId: contract.id, revision: contract.revision + 1, kind: "paid", paymentId: `payment-${++sequence}`, priceId: contract.plan.priceId, amountCents: contract.plan.amountCents, currency: "EUR", start: now, end: "2027-02-01T00:00:00.000Z", ...options });
  return { service, repository, records, calls, counters, purchase, notify, pay, current: () => records.get(account).state.contracts.at(-1), setNow: value => { now = value; }, setCatalog: value => { config = value; }, deny: () => { deny = true; }, conflict: () => { conflictOnce = true; }, entitlement: () => service.entitlement({ accountId: account, actorId: actor, productId: product, feature: "api-access" }) };
}

describe("Commercial billing", () => {
  it("launches no products or prices by default", () => { expect(validateCatalog(DRAFT_BILLING_CATALOG).plans).toEqual([]); expect(DRAFT_BILLING_CATALOG.products.every(p => !p.launched)).toBe(true); expect(() => salePlan(DRAFT_BILLING_CATALOG, "basic")).toThrow("product_not_launched"); });
  it("validates EUR cents, unique price IDs and separate launch flags", () => {
    for (const patch of [{ currency: "USD" }, { amountCents: 10.5 }, { amountCents: -1 }, { interval: "week" }, { trialDays: 31 }, { limits: [{ productId: product, key: "requests", period: "month", max: -1 }] }]) { const c = catalog(); Object.assign(c.plans[0], patch); expect(() => validateCatalog(c)).toThrow(); }
    const c = catalog(); c.products[0].launched = false; expect(() => salePlan(c, "basic")).toThrow("product_not_launched");
    c.products[0].launched = true; c.plans[0].active = false; expect(() => salePlan(c, "basic")).toThrow();
  });
  it("allows prices to change as data while preserving purchased terms", async () => { const f = fixture(); const a = await f.purchase(); const c = catalog(); c.version = 2; c.plans[0].amountCents = 1500; c.plans[0].priceId = "basic-eur-v2"; f.setCatalog(c); const b = await f.purchase(); expect(a.plan.amountCents).toBe(1000); expect(b.plan.amountCents).toBe(1500); expect(b.plan.catalogVersion).toBe(2); });
  it("never treats checkout redirects or browser flags as entitlement", async () => { const f = fixture(); await f.purchase(); expect((await f.entitlement()).allowed).toBe(false); await expect(f.service.webhook({ paid: true }, { signature: "forged" })).rejects.toThrow("invalid_signature"); expect((await f.entitlement()).allowed).toBe(false); });
  it("purchases only after verified settlement and returns receipts without card data", async () => {
    const f = fixture(), c = await f.purchase(); await f.pay(c, { document: { id: "receipt-1", kind: "receipt", currency: "EUR", amountCents: 1000, issuedAt: "2027-01-01T00:00:00Z", card: "must-not-store" } });
    expect((await f.entitlement()).allowed).toBe(true); const summary = await f.service.summary({ accountId: account, actorId: actor }); expect(summary.contracts[0].status).toBe("active"); expect(JSON.stringify(summary)).not.toContain("must-not-store"); expect((await f.service.document({ accountId: account, actorId: actor, documentId: "receipt-1" })).status).toBe("redirect");
  });
  it("deduplicates purchase attempts, webhook retries and compare-and-swap conflicts", async () => {
    const f = fixture(); f.conflict(); await f.purchase("basic", "retry-key"); await f.purchase("basic", "retry-key"); expect(f.records.get(account).state.contracts).toHaveLength(1); expect(f.calls[0].idempotencyKey).toBe(f.calls[1].idempotencyKey);
    const c = f.current(); const e = { id: "same-event", contractId: c.id, revision: 1, kind: "paid", paymentId: "same-payment", priceId: c.plan.priceId, amountCents: 1000, currency: "EUR", start: "2027-01-01T00:00:00Z", end: "2027-02-01T00:00:00Z" }; await f.notify(e); expect(await f.notify(e)).toEqual({ duplicate: true }); expect(f.current().payments).toHaveLength(1);
  });
  it("rejects incorrect amount, currency, account, product and provider", async () => { const f = fixture(), c = await f.purchase(); for (const patch of [{ currency: "USD" }, { amountCents: 999 }, { priceId: "pro-eur-v1" }, { provider: "other" }, { accountId: "other" }]) await expect(f.pay(c, patch)).rejects.toThrow(); expect((await f.entitlement()).allowed).toBe(false); });
  it("expires one-time purchases and subscriptions at exclusive UTC boundaries", async () => {
    for (const planId of ["annual-export", "basic"]) { const f = fixture(), c = await f.purchase(planId); await f.pay(c); f.setNow("2027-01-31T23:59:59.999Z"); expect((await f.entitlement()).allowed).toBe(true); f.setNow("2027-02-01T00:00:00.000Z"); expect((await f.entitlement()).allowed).toBe(false); }
  });
  it("requires verified renewal and never assumes payment after expiration", async () => { const f = fixture(); await f.pay(await f.purchase()); f.setNow("2027-02-01T00:00:00.000Z"); expect((await f.entitlement()).allowed).toBe(false); await f.pay(f.current(), { end: "2027-03-01T00:00:00Z" }); expect((await f.entitlement()).allowed).toBe(true); });
  it("keeps period-end cancellation active until expiry and blocks resurrection", async () => {
    const f = fixture(); await f.pay(await f.purchase()); const c = f.current(); await f.service.cancel({ accountId: account, actorId: actor, contractId: c.id, requestKey: "cancel" }); expect((await f.entitlement()).allowed).toBe(true);
    await f.notify({ contractId: c.id, revision: 2, kind: "canceled", timing: "period_end" }); expect((await f.entitlement()).allowed).toBe(true); f.setNow("2027-02-01T00:00:00.000Z"); expect((await f.entitlement()).allowed).toBe(false); await expect(f.pay(f.current(), { end: "2027-03-01T00:00:00Z" })).rejects.toThrow("contract_canceled");
  });
  it("honors immediate cancellation only after provider verification", async () => { const f = fixture(); await f.pay(await f.purchase()); await f.notify({ contractId: f.current().id, revision: 2, kind: "canceled", timing: "immediate" }); expect((await f.entitlement()).allowed).toBe(false); });
  it("handles partial and full cumulative refunds and rejects over-refunds", async () => {
    const f = fixture(); await f.pay(await f.purchase()); const c = f.current(), p = c.payments[0]; await f.service.refund({ accountId: account, actorId: actor, contractId: c.id, paymentId: p.id, amountCents: 1000, requestKey: "refund" }); expect((await f.entitlement()).allowed).toBe(true);
    await f.notify({ contractId: c.id, revision: 2, kind: "refunded", paymentId: p.id, currency: "EUR", refundedCents: 500 }); expect((await f.entitlement()).allowed).toBe(true);
    await expect(f.notify({ contractId: c.id, revision: 3, kind: "refunded", paymentId: p.id, currency: "EUR", refundedCents: 1001 })).rejects.toThrow("invalid_refund");
    await f.notify({ contractId: c.id, revision: 3, kind: "refunded", paymentId: p.id, currency: "EUR", refundedCents: 1000 }); expect((await f.entitlement()).allowed).toBe(false);
    expect(await f.notify({ contractId: c.id, revision: 1, kind: "paid" })).toEqual({ status: "stale" }); expect((await f.entitlement()).allowed).toBe(false);
  });
  it("limits verified trials to one per account/product and never extends them", async () => {
    const f = fixture(), c = await f.purchase(); await f.notify({ contractId: c.id, revision: 1, kind: "trial", start: "2027-01-01T00:00:00Z", end: "2027-01-08T00:00:00Z" }); expect((await f.entitlement()).trial).toBe(true); f.setNow("2027-01-08T00:00:00.000Z"); expect((await f.entitlement()).allowed).toBe(false);
    const b = await f.purchase(); await expect(f.notify({ contractId: b.id, revision: 1, kind: "trial", start: "2027-01-08T00:00:00Z", end: "2027-01-15T00:00:00Z" })).rejects.toThrow("trial_not_available");
  });
  it("upgrades after paid confirmation and downgrades at the next paid period", async () => {
    const f = fixture(); await f.pay(await f.purchase()); let c = f.current(); await f.service.changePlan({ accountId: account, actorId: actor, contractId: c.id, planId: "pro", requestKey: "upgrade" }); expect((await f.entitlement()).features).not.toContain("premium");
    f.setNow("2027-01-10T00:00:00.000Z"); await f.pay(f.current(), { changeId: "upgrade", priceId: "pro-eur-v1", amountCents: 2000, end: "2027-02-10T00:00:00Z" }); expect((await f.entitlement()).features).toContain("premium");
    c = f.current(); await f.service.changePlan({ accountId: account, actorId: actor, contractId: c.id, planId: "basic", requestKey: "downgrade" });
    await expect(f.pay(f.current(), { changeId: "downgrade", priceId: "basic-eur-v1", amountCents: 1000, end: "2027-02-10T00:00:00Z" })).rejects.toThrow("early_downgrade");
    f.setNow("2027-02-10T00:00:00.000Z"); await f.pay(f.current(), { changeId: "downgrade", priceId: "basic-eur-v1", amountCents: 1000, end: "2027-03-10T00:00:00Z" }); expect((await f.entitlement()).features).not.toContain("premium");
  });
  it("meters API limits atomically and preserves usage through plan changes", async () => {
    const f = fixture(); await f.pay(await f.purchase()); const request = { accountId: account, actorId: actor, productId: product, key: "requests" };
    expect((await f.service.consume({ ...request, amount: 2 })).status).toBe("ok"); expect((await f.service.consume(request)).status).toBe("usage_limit"); expect([...f.counters.values()]).toEqual([2, 2]);
    await f.service.changePlan({ accountId: account, actorId: actor, contractId: f.current().id, planId: "pro", requestKey: "upgrade" }); await f.pay(f.current(), { changeId: "upgrade", priceId: "pro-eur-v1", amountCents: 2000 }); expect((await f.service.consume({ ...request, amount: 2 })).status).toBe("ok"); expect([...f.counters.values()]).toEqual([4, 4]);
    f.setNow("2027-02-01T00:00:00.000Z"); expect((await f.service.consume(request)).status).toBe("not_entitled");
  });
  it("denies cross-account users and fails closed when payment is unavailable", async () => {
    const f = fixture(); f.deny(); await expect(f.purchase()).rejects.toThrow("forbidden"); await expect(f.entitlement()).rejects.toThrow("forbidden");
    const g = fixture(), service = createBillingService({ repository: g.repository }); expect(await service.purchase({ accountId: account, actorId: actor })).toMatchObject({ status: "unavailable" }); expect(g.current()).toBeUndefined();
  });
  it("does not sum duplicate grant quotas or confuse features with tenant access", async () => {
    const f = fixture(); await f.pay(await f.purchase()); await f.pay(await f.purchase()); const e = await f.entitlement(); expect(e.limits.find(l => l.period === "minute").max).toBe(2); expect(verifyEntitlement(f.records.get(account).state, "company-calendar", null, "2027-01-01T00:00:00Z").allowed).toBe(false);
  });
  it("rejects browser keys and keeps persistence server-only", () => { expect(() => createSupabaseBillingRepository({ url: "https://project.supabase.co", secret: "sb_publishable_test" })).toThrow("server_secret_required"); expect(() => createSupabaseBillingRepository({ url: "https://evil.invalid", secret: "sb_secret_test" })).toThrow("invalid_backend"); });
  it("expires pending checkout quotes and preserves idempotent quoted pricing",async()=>{
    const f=fixture();await f.purchase("basic","quote");const c=catalog();c.version=2;c.plans[0].priceId="basic-v2";c.plans[0].amountCents=1500;f.setCatalog(c);await f.purchase("basic","quote");expect(f.calls.at(-1).plan.amountCents).toBe(1000);
    f.setNow("2027-01-01T00:31:00.000Z");await expect(f.purchase("basic","quote")).rejects.toThrow("checkout_expired");await expect(f.pay(f.current())).rejects.toThrow("checkout_expired");
  });
  it("accepts a delayed verified payment made before quote expiry",async()=>{const f=fixture(),c=await f.purchase();f.setNow("2027-01-01T01:00:00.000Z");await f.pay(c,{occurredAt:"2027-01-01T00:10:00Z",start:"2027-01-01T00:10:00Z",end:"2027-02-01T00:10:00Z"});expect((await f.entitlement()).allowed).toBe(true);});
  it("rejects invalid civil timestamps and excessive subscription periods",async()=>{const f=fixture(),c=await f.purchase();await expect(f.pay(c,{start:"2027-02-30T00:00:00Z"})).rejects.toThrow("invalid_time");await expect(f.pay(c,{end:"2027-04-01T00:00:00Z"})).rejects.toThrow("invalid_subscription_period");await expect(f.pay(c,{occurredAt:"2027-02-01T00:00:00Z"})).rejects.toThrow("future_event");});
  it("records incremental credit notes without restoring refunded access",async()=>{
    const f=fixture();await f.pay(await f.purchase());const c=f.current();
    for(const [revision,total] of [[2,500],[3,1000]])await f.notify({contractId:c.id,revision,kind:"refunded",paymentId:c.payments[0].id,currency:"EUR",refundedCents:total,document:{id:`credit-${revision}`,kind:"credit-note",currency:"EUR",amountCents:500,issuedAt:"2027-01-01T00:00:00Z"}});
    expect((await f.entitlement()).allowed).toBe(false);expect((await f.service.summary({accountId:account,actorId:actor})).documents).toHaveLength(2);
  });
  it("rechecks quotas when an earlier premium grant expires",async()=>{
    const f=fixture();await f.pay(await f.purchase());await f.pay(await f.purchase("pro"),{end:"2027-01-02T00:00:00Z"});
    let e=await f.entitlement();expect(e.expiresAt).toBe("2027-02-01T00:00:00.000Z");expect(e.recheckAt).toBe("2027-01-02T00:00:00.000Z");expect(e.limits.find(l=>l.period==="minute").max).toBe(4);
    f.setNow("2027-01-02T00:00:00.000Z");e=await f.entitlement();expect(e.limits.find(l=>l.period==="minute").max).toBe(2);
  });
  it("requires explicit launch of bundled products and prevents repeated bundle trials",async()=>{
    const f=fixture(),config=catalog();config.products.push({id:"company-calendar",launched:false});config.plans[0].grants.push({productId:"company-calendar",features:["pdf-export"]});f.setCatalog(config);await expect(f.purchase()).rejects.toThrow("product_not_launched");
    config.products[1].launched=true;const first=await f.purchase();await f.notify({contractId:first.id,revision:1,kind:"trial",start:"2027-01-01T00:00:00Z",end:"2027-01-08T00:00:00Z"});
    config.plans[1].productId="company-calendar";const second=await f.purchase("pro");await expect(f.notify({contractId:second.id,revision:1,kind:"trial",start:"2027-01-01T00:00:00Z",end:"2027-01-08T00:00:00Z"})).rejects.toThrow("trial_not_available");
  });
  it("keeps server credentials and request payloads in the repository boundary",async()=>{
    const calls=[],repo=createSupabaseBillingRepository({url:"https://fixture.supabase.co",secret:"sb_secret_fixture",fetchImpl:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({revision:1,state:emptyBillingState(account)}),{status:200});}});
    await repo.load(account);expect(calls[0].url).toBe("https://fixture.supabase.co/rest/v1/rpc/billing_state_get");expect(JSON.parse(calls[0].options.body)).toEqual({p_account:account});expect(calls[0].options.redirect).toBe("error");expect(calls[0].options.cache).toBe("no-store");
  });
  it("rejects malformed authorization replies and wrong-account repository data",async()=>{
    const f=fixture();f.repository.authorize=async()=>({allowed:true});await expect(f.entitlement()).rejects.toThrow("forbidden");
    f.repository.authorize=async()=>true;f.repository.load=async()=>({revision:0,state:emptyBillingState("another-account")});await expect(f.entitlement()).rejects.toThrow("invalid_billing_boundary");
  });
});
