// The product catalogue of the Viikkonro planning platform: what exists, what
// is planned, and the commercial model of each. Prices here are HYPOTHESES from
// the product plan (validated: false). They are not shown to visitors and must
// be confirmed by the pre-sale test before any is published.

/**
 * @typedef {object} Product
 * @property {string} id
 * @property {string} name
 * @property {"consumer"|"business"} audience
 * @property {"live"|"preview"|"planned"} status
 * @property {string|null} path  indexable URL once the product has a page
 * @property {{model: "free"|"one-time"|"subscription", period?: "year"|"month",
 *   hypothesisEur: [number, number]|null, validated: boolean}} pricing
 * @property {Record<string, string[]>} features  feature ids unlocked per tier
 */

export const PRICING_MODELS = Object.freeze(["free", "one-time", "subscription"]);

const free = { model: "free", hypothesisEur: null, validated: false };
const hypothesis = (model, period, min, max) => ({ model, period, hypothesisEur: [min, max], validated: false });

/** @type {Record<string, Product>} */
export const PRODUCTS = Object.freeze({
  "company-calendar": {
    id: "company-calendar",
    name: "Viikkonro Yrityskalenteri",
    audience: "business",
    status: "preview",
    path: "/yrityskalenteri",
    pricing: hypothesis("one-time", "year", 29, 59),
    features: {
      free: ["preview", "watermark-preview"],
      paid: [
        "logo",
        "branding",
        "company-days",
        "pdf-export",
        "xlsx-export",
        "csv-export",
        "ics-export",
        "no-watermark",
      ],
    },
  },
  "excel-templates": {
    id: "excel-templates",
    name: "Excel- ja Sheets-pohjat",
    audience: "business",
    status: "live",
    path: "/kalenteripohjat",
    pricing: free,
    features: { free: ["template-preview", "template-download"] },
  },
  "company-ics": {
    id: "company-ics",
    name: "Yrityksen ICS-kalenteri",
    audience: "business",
    status: "preview",
    path: "/yrityskalenteri/ics",
    // Included in the company-calendar export licence, not a hosted subscription.
    pricing: hypothesis("one-time", "year", 29, 59),
    features: {},
  },
  "vacation-planner-pro": {
    id: "vacation-planner-pro", name: "Lomasuunnittelija Pro", audience: "business", status: "preview", path: "/lomasuunnittelija",
    pricing: { model: "one-time", period: "year", hypothesisEur: null, validated: false },
    features: { free: ["preview"], paid: ["pdf-export", "xlsx-export", "ics-export"] },
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
    status: "live",
    path: "/rakennuskalenteri",
    pricing: free,
    features: {},
  },
  "hr-payroll-calendar": {
    id: "hr-payroll-calendar",
    name: "HR- ja palkkakalenteri",
    audience: "business",
    status: "live",
    path: "/hr-kalenteri",
    pricing: free,
    features: {},
  },
  "team-leave-planner": {
    id: "team-leave-planner",
    name: "Tiimin lomat ja poissaolot",
    audience: "business",
    status: "live",
    path: "/tiimin-lomat",
    pricing: free,
    features: {},
  },
  "shift-planner": {
    id: "shift-planner",
    name: "Työvuorosuunnittelu",
    audience: "business",
    // Implemented in the private team workspace; no indexable product URL or
    // subscription checkout is claimed before Supabase activation.
    status: "preview",
    path: null,
    pricing: free,
    features: { free: ["shift-roster", "shift-templates", "availability", "pdf-export", "xlsx-export", "ics-export"] },
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
  "multi-company-platform": {
    id: "multi-company-platform", name: "Tilitoimiston asiakaskalenterit",
    audience: "business", status: "preview", path: null, pricing: free,
    features: { free: ["client-calendars", "company-branding", "reusable-templates", "client-permissions", "audit-history", "export-history", "pdf-export", "xlsx-export", "csv-export", "ics-export"] },
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
