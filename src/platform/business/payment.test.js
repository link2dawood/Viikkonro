import { describe, expect, it } from "vitest";
import {
  DEV_LICENSE_KEY,
  clearDevLicense,
  createDevUnlockProvider,
  resolvePaymentProvider,
  unavailableProvider,
} from "./payment.js";
import { hasFeature } from "./licensing.js";

const memory = () => {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k), map };
};
const today = new Date(2026, 9, 7);
const request = { productId: "company-calendar", tier: "paid", today };

describe("payment providers", () => {
  it("never unlocks anything when no payment exists", async () => {
    expect(unavailableProvider.canPurchase).toBe(false);
    expect(await unavailableProvider.startCheckout(request)).toEqual({ status: "unavailable", reason: "payment-not-configured" });
    expect(unavailableProvider.restoreLicense()).toBeNull();
  });
  it("grants, stores and restores a development licence", async () => {
    const storage = memory();
    const provider = createDevUnlockProvider({ storage });
    expect(provider.restoreLicense()).toBeNull();
    const outcome = await provider.startCheckout(request);
    expect(outcome.status).toBe("granted");
    expect(outcome.license).toMatchObject({ productId: "company-calendar", tier: "paid", licensee: "Kehitystesti" });
    expect(hasFeature("company-calendar", "pdf-export", outcome.license, today)).toBe(true);
    // Another provider over the same storage (the next page visit) gets it back.
    expect(createDevUnlockProvider({ storage }).restoreLicense()).toMatchObject({ tier: "paid" });
    clearDevLicense(storage);
    expect(provider.restoreLicense()).toBeNull();
  });
  it("ignores a corrupted stored licence instead of failing", () => {
    for (const junk of ["not json", "{}", '{"productId":"nope"}', "null"]) {
      const storage = memory();
      storage.setItem(DEV_LICENSE_KEY, junk);
      expect(createDevUnlockProvider({ storage }).restoreLicense()).toBeNull();
    }
  });
  it("lets the development licence expire", async () => {
    const outcome = await createDevUnlockProvider({ storage: memory() }).startCheckout(request);
    expect(hasFeature("company-calendar", "pdf-export", outcome.license, new Date(2028, 11, 31))).toBe(true);
    expect(hasFeature("company-calendar", "pdf-export", outcome.license, new Date(2029, 0, 1))).toBe(false);
  });
});

describe("choosing the provider for an environment", () => {
  it("offers the development unlock only in development", () => {
    expect(resolvePaymentProvider({ DEV: true, PROD: false, MODE: "development" }).id).toBe("dev-unlock");
  });
  it("can never offer it in a production build", () => {
    for (const env of [
      { DEV: false, PROD: true, MODE: "production" },
      { DEV: true, PROD: true, MODE: "production" }, // contradictory flags still lock
      { DEV: true, PROD: false, MODE: "production" },
      { DEV: false },
      { PROD: true },
      {},
      null,
      undefined,
    ]) {
      expect(resolvePaymentProvider(env), JSON.stringify(env)).toBe(unavailableProvider);
    }
  });
});
