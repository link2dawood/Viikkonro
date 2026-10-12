import { PRODUCTS } from "../business/products.js";

export class BillingError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export const fail = (code) => { throw new BillingError(code); };
export const identifier = (value) => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(value);
export const instant = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail("invalid_time");
  const normalized=new Date(value).toISOString();
  if(normalized.slice(0,19)!==value.slice(0,19))fail("invalid_time");
  return normalized;
};
export const cents = (value) => { if (!Number.isSafeInteger(value) || value < 0 || value > 100000000) fail("invalid_amount"); return value; };

// Technical availability is separate from commercial launch. No prices are invented.
export const DRAFT_BILLING_CATALOG = Object.freeze({ version: 1, products: Object.keys(PRODUCTS).map(id => ({ id, launched: false })), plans: [] });

/** Operator-maintained JSON; prices use integer euro cents and immutable price IDs. */
export function validateCatalog(input) {
  if (!input || !Number.isSafeInteger(input.version) || input.version < 1 || !Array.isArray(input.products) || !Array.isArray(input.plans) || input.products.length > 100 || input.plans.length > 500) fail("invalid_catalog");
  const products = new Map();
  for (const row of input.products) {
    if (!Object.hasOwn(PRODUCTS, row.id) || products.has(row.id) || typeof row.launched !== "boolean") fail("invalid_product");
    products.set(row.id, { id: row.id, launched: row.launched });
  }
  const ids = new Set(), prices = new Set();
  const plans = input.plans.map(row => {
    if (!identifier(row.id) || ids.has(row.id) || !identifier(row.priceId) || prices.has(row.priceId) || !products.has(row.productId) || typeof row.active !== "boolean" || !["one-time", "subscription"].includes(row.kind) || row.currency !== "EUR" || !Number.isInteger(row.rank) || row.rank < 0 || row.rank > 1000) fail("invalid_plan");
    ids.add(row.id); prices.add(row.priceId); cents(row.amountCents);
    if (row.amountCents === 0 || !Number.isInteger(row.trialDays ?? 0) || (row.trialDays ?? 0) < 0 || (row.trialDays ?? 0) > 30) fail("invalid_plan");
    if (row.kind === "subscription" ? !["month", "year"].includes(row.interval) : (!Number.isInteger(row.durationDays) || row.durationDays < 1 || row.durationDays > 3660 || row.trialDays)) fail("invalid_plan_period");
    if (!Array.isArray(row.grants) || row.grants.length === 0 || row.grants.length > 100) fail("invalid_grants");
    const grants = row.grants.map(grant => {
      if (!products.has(grant.productId) || !Array.isArray(grant.features) || grant.features.length > 100 || !grant.features.every(identifier) || new Set(grant.features).size !== grant.features.length) fail("invalid_grants");
      return { productId: grant.productId, features: [...grant.features] };
    });
    if (new Set(grants.map(g => g.productId)).size !== grants.length) fail("invalid_grants");
    const limits = (row.limits ?? []).map(limit => {
      if (!grants.some(g => g.productId === limit.productId) || !identifier(limit.key) || !["minute", "month"].includes(limit.period) || !Number.isSafeInteger(limit.max) || limit.max < 0 || limit.max > 1000000000) fail("invalid_limits");
      return { productId: limit.productId, key: limit.key, period: limit.period, max: limit.max };
    });
    if (limits.length > 100 || new Set(limits.map(l => `${l.productId}:${l.key}:${l.period}`)).size !== limits.length) fail("invalid_limits");
    return { id: row.id, productId: row.productId, active: row.active, priceId: row.priceId, currency: "EUR", amountCents: row.amountCents, kind: row.kind, rank: row.rank, interval: row.interval ?? null, durationDays: row.durationDays ?? null, trialDays: row.trialDays ?? 0, grants, limits, catalogVersion: input.version };
  });
  return { version: input.version, products: [...products.values()], plans };
}

export function salePlan(catalog, id) {
  const valid = validateCatalog(catalog), plan = valid.plans.find(p => p.id === id);
  if (!plan || !plan.active || !valid.products.find(p => p.id === plan.productId)?.launched || plan.grants.some(g => !valid.products.find(p => p.id === g.productId)?.launched)) fail("product_not_launched");
  return structuredClone(plan);
}
