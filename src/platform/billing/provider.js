// Server adapter contract. The unavailable adapter never grants or charges.
// A real adapter must host checkout, verify raw webhook signatures, reconcile
// provider revisions and map provider data into canonical domain events.
export const unavailableBillingProvider = Object.freeze({
  id: "none", configured: false,
  async startCheckout() { return { status: "unavailable", reason: "payment-not-configured" }; },
  async verifyWebhook() { throw new Error("payment-not-configured"); },
  async cancel() { throw new Error("payment-not-configured"); },
  async changePlan() { throw new Error("payment-not-configured"); },
  async refund() { throw new Error("payment-not-configured"); },
  async document() { throw new Error("payment-not-configured"); },
});
