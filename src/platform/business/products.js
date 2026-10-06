// The product catalogue of the Viikkonro planning platform: what exists, what
// is planned, and the commercial model of each. Prices here are HYPOTHESES from
// the product plan (validated: false). They are not shown to visitors and must
// be confirmed by the pre-sale test before any is published.

/**
 * @typedef {object} Product
 * @property {string} id
 * @property {string} name
 * @property {"consumer"|"business"} audience
 * @property {"live"|"planned"} status
 * @property {string|null} path  indexable URL once the product has a page
 * @property {{model: "free"|"one-time"|"subscription", period?: "year"|"month",
 *   hypothesisEur: [number, number]|null, validated: boolean}} pricing
 * @property {Record<string, string[]>} features  feature ids unlocked per tier
 */

export const PRICING_MODELS = Object.freeze(["free", "one-time", "subscription"]);

const free = { model: "free", hypothesisEur: null, validated: false };
const hypothesis = (model, period, min, max) => ({ model, period, hypothesisEur: [min, max], validated: false });
const open = { model: "subscription", period: "month", hypothesisEur: null, validated: false };

/** @type {Record<string, Product>} */
export const PRODUCTS = Object.freeze({
  "company-calendar": {
    id: "company-calendar",
    name: "Yrityskalenteri",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("one-time", "year", 29, 59),
    features: {
      free: ["preview", "standard-calendar"],
      paid: ["logo", "company-days", "paydays", "xlsx", "ics", "no-watermark", "saved-configuration"],
    },
  },
  "excel-templates": {
    id: "excel-templates",
    name: "Excel- ja Sheets-pohjat",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("one-time", null, 9, 29),
    features: {},
  },
  "company-ics": {
    id: "company-ics",
    name: "Yrityksen ICS-kalenteri",
    audience: "business",
    status: "planned",
    path: null,
    pricing: open,
    features: {},
  },
  "vacation-planner": {
    id: "vacation-planner",
    name: "Lomasuunnittelija",
    audience: "consumer",
    status: "live",
    path: "/lomasuunnittelija",
    pricing: free,
    features: {},
  },
  "project-planner": {
    id: "project-planner",
    name: "Projektiaikataulu",
    audience: "business",
    status: "live",
    path: "/projektiaikataulu",
    pricing: free,
    features: {},
  },
  "sprint-planner": {
    id: "sprint-planner",
    name: "Sprinttisuunnittelija",
    audience: "business",
    status: "live",
    path: "/sprinttisuunnittelija",
    pricing: free,
    features: {},
  },
  "construction-planner": {
    id: "construction-planner",
    name: "Rakennustyömaan viikkoaikataulu",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("one-time", "year", 49, 99),
    features: {},
  },
  "hr-payroll-calendar": {
    id: "hr-payroll-calendar",
    name: "HR- ja palkkakalenteri",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("subscription", "month", 29, 99),
    features: {},
  },
  "team-leave-planner": {
    id: "team-leave-planner",
    name: "Tiimin lomat ja poissaolot",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("subscription", "month", 12, 29),
    features: {},
  },
  "shift-planner": {
    id: "shift-planner",
    name: "Työvuorosuunnittelu",
    audience: "business",
    status: "planned",
    path: null,
    pricing: open,
    features: {},
  },
  "hr-deadline-toolkit": {
    id: "hr-deadline-toolkit",
    name: "HR-määräaikatyökalut",
    audience: "business",
    status: "planned",
    path: null,
    pricing: free,
    features: {},
  },
  "business-calendar-api": {
    id: "business-calendar-api",
    name: "Business Calendar API",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("subscription", "month", 49, 299),
    features: {},
  },
  "white-label-widget": {
    id: "white-label-widget",
    name: "White-label-kalenteri ja -widget",
    audience: "business",
    status: "planned",
    path: null,
    pricing: hypothesis("subscription", "month", 49, 299),
    features: {},
  },
});

export function getProduct(id) {
  const product = PRODUCTS[id];
  if (!product) throw new Error(`Unknown product "${id}".`);
  return product;
}

export const productsByStatus = (status) => Object.values(PRODUCTS).filter((p) => p.status === status);

/** Feature ids a tier unlocks for a product. The free tier is open to everyone. */
export const featuresFor = (productId, tier) => getProduct(productId).features[tier] ?? [];
