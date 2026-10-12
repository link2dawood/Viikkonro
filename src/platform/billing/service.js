import { fail, identifier, instant, salePlan, cents } from "./catalog.js";
import { addContract, applyVerifiedEvent, verifyEntitlement, contractStatus } from "./domain.js";
import { unavailableBillingProvider } from "./provider.js";

/** Server-only orchestration; repository commits are transactional compare-and-swap. */
export function createBillingService({ repository, provider = unavailableBillingProvider, clock = () => new Date().toISOString(), newId = () => crypto.randomUUID() }) {
  if (typeof window !== "undefined") fail("server_only");
  const loadAccount=async(accountId)=>{
    const record=await repository.load(accountId);
    if(!Number.isSafeInteger(record?.revision) || record.revision<0 || record.state?.version!==1 || record.state.accountId!==accountId || !["contracts","documents","trialUses"].every(key=>Array.isArray(record.state[key])))fail("invalid_billing_boundary");
    return record;
  };
  const mutate = async (accountId, fn, eventKey = null) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const record = await loadAccount(accountId), state = structuredClone(record.state), result = fn(state);
      const saved = await repository.commit(accountId, record.revision, state, eventKey);
      if (saved.status === "duplicate") return { duplicate: true };
      if (saved.status === "ok") return result;
      if (saved.status !== "conflict") fail("billing_unavailable");
    }
    fail("billing_conflict");
  };
  const authorize = async (accountId, actorId, permission) => { if (await repository.authorize(accountId, actorId, permission)!==true) fail("forbidden"); };
  const configured = () => { if (!provider.configured) fail("payment_not_configured"); };
  const hostedRedirect = result => {
    if(result?.status!=="redirect")fail("invalid_provider_response");
    const url=new URL(result.url);
    if(url.protocol!=="https:" || url.username || url.password)fail("invalid_provider_response");
    return {status:"redirect",url:url.toString()};
  };
  return {
    async purchase({ accountId, actorId, planId, requestKey }) {
      await authorize(accountId, actorId, "manage");
      if (!provider.configured) return { status: "unavailable", reason: "payment-not-configured" };
      const now=instant(clock()),previous=(await loadAccount(accountId)).state.contracts.find(c=>c.requestKey===requestKey);
      if(previous && (previous.plan.id!==planId || previous.provider!==provider.id))fail("idempotency_conflict");
      const plan = previous?.plan ?? salePlan(await repository.catalog(), planId), id = newId();
      const contract = await mutate(accountId, state => addContract(state, { id, requestKey, plan, provider: provider.id, now }));
      if(contract.payments.length || contract.trial)return {status:"already_processed",contractId:contract.id};
      if(now>=contract.checkoutExpiresAt)fail("checkout_expired");
      // Checkout is provider-idempotent by contract ID; success redirect grants nothing.
      return hostedRedirect(await provider.startCheckout({ accountId, contractId: contract.id, plan: contract.plan, idempotencyKey: contract.id }));
    },
    async webhook(rawBody, headers) {
      configured();
      const event = await provider.verifyWebhook(rawBody, headers);
      if (event.provider !== provider.id || !identifier(event.id)) fail("invalid_event");
      if(Date.parse(instant(event.occurredAt))>Date.parse(instant(clock()))+300000)fail("future_event");
      return mutate(event.accountId, state => ({ status: applyVerifiedEvent(state, event) }), `${provider.id}:${event.id}`);
    },
    async entitlement({ accountId, actorId, productId, feature }) {
      await authorize(accountId, actorId, "entitlement");
      const record = await loadAccount(accountId);
      return { ...verifyEntitlement(record.state, productId, feature, clock()), revision: record.revision };
    },
    async summary({ accountId, actorId }) {
      await authorize(accountId, actorId, "read");
      const { state } = await loadAccount(accountId), now = clock();
      return { contracts: state.contracts.map(c => ({ id: c.id, planId: c.plan.id, productId: c.plan.productId, status: contractStatus(c, now), cancelAt: c.canceledAt, pendingPlanId: c.pendingChange?.plan.id ?? null })), documents: state.documents };
    },
    async cancel({ accountId, actorId, contractId, timing = "period_end", requestKey }) {
      configured(); await authorize(accountId, actorId, "manage");
      const { state } = await loadAccount(accountId), contract = state.contracts.find(c => c.id === contractId);
      if (!contract || contract.provider !== provider.id || contract.plan.kind !== "subscription" || !["immediate", "period_end"].includes(timing) || !identifier(requestKey)) fail("invalid_cancellation");
      await provider.cancel({ accountId, contractId, timing, idempotencyKey: `${contractId}:${requestKey}` });
      return {status:"requested"};
    },
    async changePlan({ accountId, actorId, contractId, planId, requestKey }) {
      configured(); await authorize(accountId, actorId, "manage");
      if (!identifier(requestKey)) fail("invalid_request");
      const plan = salePlan(await repository.catalog(), planId);
      const change = await mutate(accountId, state => {
        const c = state.contracts.find(c => c.id === contractId);
        if (!c || c.provider !== provider.id || c.plan.kind !== "subscription" || plan.kind !== "subscription" || c.plan.productId !== plan.productId || c.plan.interval !== plan.interval || !["active", "trial"].includes(contractStatus(c, clock())) || c.canceledAt) fail("invalid_plan_change");
        if (c.pendingChange) { if (c.pendingChange.id !== requestKey || c.pendingChange.plan.priceId !== plan.priceId) fail("change_pending"); return c.pendingChange; }
        if (c.plan.id === plan.id && c.plan.priceId === plan.priceId) fail("same_plan");
        c.pendingChange = { id: requestKey, plan, timing: plan.rank > c.plan.rank ? "immediate" : "period_end" };
        return c.pendingChange;
      });
      // First implementation uses full-price new periods, never invented prorations.
      await provider.changePlan({ accountId, contractId, ...change, idempotencyKey: `${contractId}:${requestKey}` });
      return {status:"requested"};
    },
    async refund({ accountId, actorId, contractId, paymentId, amountCents, requestKey }) {
      configured(); await authorize(accountId, actorId, "manage");
      const { state } = await loadAccount(accountId), c = state.contracts.find(c => c.id === contractId), payment = c?.payments.find(p => p.id === paymentId);
      cents(amountCents);
      if (!payment || c.provider !== provider.id || !amountCents || amountCents > payment.amountCents - payment.refundedCents || !identifier(requestKey)) fail("invalid_refund");
      await provider.refund({ accountId, contractId, paymentId, amountCents, currency: "EUR", idempotencyKey: `${contractId}:${requestKey}` });
      return {status:"requested"};
    },
    async document({ accountId, actorId, documentId }) {
      configured(); await authorize(accountId, actorId, "read");
      const { state } = await loadAccount(accountId), document = state.documents.find(d => d.id === documentId && d.provider === provider.id);
      if (!document) fail("document_not_found");
      return hostedRedirect(await provider.document({ accountId, documentId })); // Short-lived authorized provider link, not a stored card or address.
    },
    async consume({ accountId, actorId, productId, key, amount = 1 }) {
      await authorize(accountId, actorId, "entitlement");
      if (!identifier(key) || !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) fail("invalid_usage");
      for (let attempt = 0; attempt < 8; attempt++) {
        const record = await loadAccount(accountId), entitlement = verifyEntitlement(record.state, productId, null, instant(clock()));
        const limits = entitlement.limits.filter(l => l.key === key);
        if (!entitlement.allowed || !limits.length) return { status: "not_entitled" };
        const result = await repository.consume(accountId, record.revision, productId, key, limits, amount, entitlement.recheckAt);
        if (result.status !== "conflict") return result;
      }
      fail("billing_conflict");
    },
  };
}
