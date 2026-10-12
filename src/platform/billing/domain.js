import { cents, fail, identifier, instant } from "./catalog.js";

export const emptyBillingState = accountId => ({ version: 1, accountId, contracts: [], documents: [], trialUses: [] });
const span = (start, end) => { start = instant(start); end = instant(end); if (end <= start) fail("invalid_period"); return { start, end }; };
const activePayment = (contract, now) => contract.payments.findLast(p => p.start <= now && now < p.end && p.refundedCents < p.amountCents);

/** Derived exclusively from server-loaded state, with exclusive UTC expiration. */
export function verifyEntitlement(state, productId, feature, now) {
  now = instant(now);
  const sources = [];
  for (const contract of state.contracts) {
    if (contract.canceledAt && now >= contract.canceledAt) continue;
    const payment = activePayment(contract, now);
    const trial = !payment && contract.trial && contract.trial.start <= now && now < contract.trial.end;
    const plan = payment?.plan ?? (trial ? contract.plan : null);
    const grant = plan?.grants.find(g => g.productId === productId);
    if (!grant || (feature && !grant.features.includes(feature))) continue;
    const expiresAt=[trial ? contract.trial.end : payment.end,contract.canceledAt].filter(Boolean).sort()[0];
    sources.push({ contractId: contract.id, planId: plan.id, status: trial ? "trial" : "active", expiresAt, features: grant.features, limits: plan.limits.filter(l => l.productId === productId) });
  }
  const limits = new Map();
  for (const source of sources) for (const limit of source.limits) {
    const key = `${limit.key}:${limit.period}`;
    limits.set(key, { ...limit, max: Math.max(limits.get(key)?.max ?? 0, limit.max) });
  }
  const expirations=sources.map(s=>s.expiresAt).sort();
  return { allowed: sources.length > 0, productId, features: [...new Set(sources.flatMap(s => s.features))], limits: [...limits.values()], trial: sources.some(s => s.status === "trial"), expiresAt: expirations.at(-1) ?? null, recheckAt: expirations[0] ?? null, sources };
}

export function contractStatus(contract, now) {
  now = instant(now);
  if (contract.canceledAt && now >= contract.canceledAt) return "canceled";
  if (activePayment(contract, now)) return contract.cancelAtPeriodEnd ? "canceling" : "active";
  if (contract.trial && contract.trial.start <= now && now < contract.trial.end) return "trial";
  if (contract.payments.length && contract.payments.at(-1).refundedCents === contract.payments.at(-1).amountCents) return "refunded";
  return contract.payments.length || contract.trial ? "expired" : "pending";
}

export function addContract(state, { id, requestKey, plan, provider, now }) {
  if (!identifier(id) || !identifier(requestKey) || !identifier(provider)) fail("invalid_contract");
  const previous = state.contracts.find(c => c.requestKey === requestKey);
  if (previous) { if (previous.plan.priceId !== plan.priceId || previous.provider !== provider) fail("idempotency_conflict"); return previous; }
  if (state.contracts.some(c => c.id === id) || state.contracts.length >= 10000) fail("contract_limit");
  const createdAt=instant(now),checkoutExpiresAt=new Date(Date.parse(createdAt)+30*60000).toISOString();
  const contract = { id, requestKey, plan: structuredClone(plan), provider, createdAt, checkoutExpiresAt, revision: 0, payments: [], trial: null, pendingChange: null, canceledAt: null, cancelAtPeriodEnd: false };
  state.contracts.push(contract); return contract;
}

/** Adapter events must come from signature-verified, reconciled provider data. */
export function applyVerifiedEvent(state, event) {
  if (!identifier(event.id) || !identifier(event.provider) || event.accountId !== state.accountId || !Number.isSafeInteger(event.revision) || event.revision < 1) fail("invalid_event");
  const at = instant(event.occurredAt), contract = state.contracts.find(c => c.id === event.contractId);
  if (!contract || contract.provider !== event.provider) fail("unknown_contract");
  if (event.revision <= contract.revision) return "stale";
  if(at<contract.createdAt)fail("event_before_contract");
  if(["paid","trial"].includes(event.kind) && !contract.payments.length && !contract.trial && at>contract.checkoutExpiresAt)fail("checkout_expired");
  if (event.kind === "trial") {
    if (contract.canceledAt || contract.plan.kind !== "subscription" || !contract.plan.trialDays || contract.trial || contract.payments.length || contract.plan.grants.some(g=>state.trialUses.includes(g.productId))) fail("trial_not_available");
    const period = span(event.start, event.end);
    if (Date.parse(period.end) - Date.parse(period.start) > contract.plan.trialDays * 86400000) fail("invalid_trial");
    contract.trial = period; state.trialUses.push(...contract.plan.grants.map(g=>g.productId));
  } else if (event.kind === "paid") {
    if (contract.canceledAt && at >= contract.canceledAt) fail("contract_canceled");
    const change = contract.pendingChange;
    const plan = event.changeId ? (change?.id === event.changeId ? change.plan : null) : contract.plan;
    if (!plan || event.priceId !== plan.priceId || event.currency !== "EUR" || cents(event.amountCents) !== plan.amountCents || !identifier(event.paymentId) || state.contracts.some(c => c.payments.some(p => p.id === event.paymentId))) fail("payment_mismatch");
    const period = span(event.start, event.end);
    if (plan.kind === "subscription" && Date.parse(period.end) - Date.parse(period.start) > (plan.interval === "month" ? 32 : 366) * 86400000) fail("invalid_subscription_period");
    if (contract.canceledAt && period.start >= contract.canceledAt) fail("contract_canceled");
    if (plan.kind === "one-time" && (contract.payments.length || Date.parse(period.end) - Date.parse(period.start) > plan.durationDays * 86400000)) fail("invalid_purchase_period");
    const last = contract.payments.at(-1);
    if (last && period.start < last.start) fail("invalid_period");
    if (last && !event.changeId && period.start < last.end) fail("overlapping_billing_period");
    if (change && event.changeId && change.timing === "period_end" && last && period.start < last.end) fail("early_downgrade");
    if (change && event.changeId) {
      if (last && change.timing === "immediate") last.end = period.start;
      contract.plan = plan; contract.pendingChange = null;
    }
    contract.payments.push({ id: event.paymentId, amountCents: event.amountCents, currency: "EUR", refundedCents: 0, ...period, plan: structuredClone(plan) });
    contract.trial = null;
    if (contract.cancelAtPeriodEnd) contract.canceledAt = period.end;
  } else if (event.kind === "canceled") {
    if (contract.plan.kind !== "subscription" || !["immediate", "period_end"].includes(event.timing)) fail("invalid_cancellation");
    contract.cancelAtPeriodEnd = event.timing === "period_end";
    contract.canceledAt = event.timing === "immediate" ? at : (contract.payments.at(-1)?.end ?? contract.trial?.end ?? at);
    contract.pendingChange = null;
  } else if (event.kind === "refunded") {
    const payment = contract.payments.find(p => p.id === event.paymentId);
    if (!payment || event.currency !== "EUR" || cents(event.refundedCents) < payment.refundedCents || event.refundedCents > payment.amountCents) fail("invalid_refund");
    payment.refundedCents = event.refundedCents; // Provider's cumulative total; partial refunds retain access.
  } else fail("invalid_event_kind");
  if (event.document) {
    const d = event.document;
    if (!identifier(d.id) || !["invoice", "receipt", "credit-note"].includes(d.kind) || d.currency !== "EUR") fail("invalid_document");
    cents(d.amountCents);
    if(event.kind==="refunded" ? (d.kind!=="credit-note" || !d.amountCents || d.amountCents>event.refundedCents) : (d.kind==="credit-note" || d.amountCents!==event.amountCents))fail("invalid_document");
    const issuedAt = instant(d.issuedAt);
    // No card fields, billing addresses or arbitrary provider payloads are retained.
    const document = { id: d.id, provider: event.provider, contractId: contract.id, paymentId: event.paymentId, kind: d.kind, currency: "EUR", amountCents: d.amountCents, issuedAt };
    const existing = state.documents.findIndex(row => row.provider === document.provider && row.id === document.id);
    if (existing < 0) state.documents.push(document);
    else if(JSON.stringify(state.documents[existing])!==JSON.stringify(document))fail("document_conflict");
  }
  contract.revision = event.revision;
  return "applied";
}
