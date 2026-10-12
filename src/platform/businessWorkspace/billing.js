// Interface only. Client-supplied billing state never grants access or larger quotas.
export const BUSINESS_BILLING = Object.freeze({ productId: "multi-company-platform", plan: "free_preview", chargingEnabled: false, provider: null, futurePlans: ["firm_subscription", "per_client"] });
export const unavailableBusinessBilling = Object.freeze({ async checkout() { return { status: "unavailable", reason: "billing-not-configured" }; }, async entitlement() { return { plan: "free_preview", chargingEnabled: false }; } });
