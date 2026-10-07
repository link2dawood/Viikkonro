// Payment abstraction. The platform needs one question answered: "can this
// visitor export?". Who answers it is a PaymentProvider:
//
//   - `unavailableProvider`   production today: no payment exists, so nothing is
//                             ever unlocked and no licence is ever restored;
//   - `createDevUnlockProvider`  local development only: grants a licence on
//                             request so the paid flow can be tested;
//   - a real provider (later)  starts a hosted checkout and returns a licence
//                             that a server has verified.
//
// There is deliberately no fake payment here. A licence stored in the browser
// can be forged (see licensing.js), so production must not restore licences
// from browser storage until a provider that verifies them server-side exists.
import { createLicense, licenseToJson } from "./licensing.js";

/**
 * @typedef {object} CheckoutRequest
 * @property {string} productId
 * @property {string} tier
 * @property {Date} today  the current day, passed in so nothing here reads a clock
 *
 * @typedef {{status: "granted", license: import("./licensing.js").License}
 *   | {status: "redirect", url: string}
 *   | {status: "unavailable", reason: string}} CheckoutResult
 *
 * @typedef {object} PaymentProvider
 * @property {string} id
 * @property {boolean} canPurchase  true only when a visitor can really pay
 * @property {(request: CheckoutRequest) => Promise<CheckoutResult>} startCheckout
 * @property {() => import("./licensing.js").License|null} restoreLicense
 */

/** @type {PaymentProvider} */
export const unavailableProvider = Object.freeze({
  id: "none",
  canPurchase: false,
  startCheckout: async () => ({ status: "unavailable", reason: "payment-not-configured" }),
  restoreLicense: () => null,
});

export const DEV_LICENSE_KEY = "viikkonro:dev-license";

const memoryStore = () => {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
};

/**
 * Local-testing provider: grants a licence for the rest of the calendar year
 * after next, remembers it in `storage`, and restores it on the next visit.
 * Never returned in a production build (see resolvePaymentProvider).
 * @returns {PaymentProvider}
 */
export function createDevUnlockProvider({ storage = memoryStore() } = {}) {
  return {
    id: "dev-unlock",
    canPurchase: true,
    startCheckout: async ({ productId, tier, today }) => {
      const license = createLicense({
        productId,
        tier,
        issuedOn: today,
        expiresOn: `${today.getFullYear() + 2}-12-31`,
        licensee: "Kehitystesti",
      });
      storage.setItem(DEV_LICENSE_KEY, JSON.stringify(licenseToJson(license)));
      return { status: "granted", license };
    },
    restoreLicense: () => {
      try {
        const raw = storage.getItem(DEV_LICENSE_KEY);
        return raw ? createLicense(JSON.parse(raw)) : null;
      } catch {
        storage.removeItem(DEV_LICENSE_KEY);
        return null;
      }
    },
  };
}

/** Forget a development licence (the "lock again" button in development). */
export const clearDevLicense = (storage) => storage.removeItem(DEV_LICENSE_KEY);

/**
 * Pick the provider for an environment. `env` is Vite's import.meta.env: the
 * development provider needs DEV to be true AND PROD to be false AND the mode
 * not to be "production", so a production build can never select it.
 */
export function resolvePaymentProvider(env, { storage } = {}) {
  const isDevelopment = env?.DEV === true && env?.PROD !== true && env?.MODE !== "production";
  return isDevelopment ? createDevUnlockProvider({ storage }) : unavailableProvider;
}
