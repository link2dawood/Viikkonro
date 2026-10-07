// Licensing as pure data: the shape of a licence and the questions a product
// asks about it ("is it active today", "does it unlock this feature").
//
// SECURITY NOTE: with no server and no signatures, a licence object is client
// data and anyone can forge one. Use this only to decide what to SHOW, never
// to protect anything of value. Issuing and verifying real licences needs a
// server step (a payment provider's licence-key check) and is deliberately not
// built yet.
import { toDate, dayKey } from "../calendar/events.js";
import { PRODUCTS, featuresFor, getProduct } from "./products.js";

/**
 * @typedef {object} License
 * @property {string} productId
 * @property {string} tier
 * @property {Date} issuedOn
 * @property {Date} expiresOn  inclusive
 * @property {string|null} licensee
 */

export const FREE_TIER = "free";

/** @returns {License} */
export function createLicense({ productId, tier, issuedOn, expiresOn, licensee } = {}) {
  if (!PRODUCTS[productId]) throw new Error(`Unknown product "${productId}".`);
  if (!Object.hasOwn(getProduct(productId).features, tier) || tier === FREE_TIER) {
    throw new Error(`"${tier}" is not a paid tier of ${productId}.`);
  }
  const from = toDate(issuedOn);
  const to = toDate(expiresOn);
  if (!from || !to) throw new Error("A licence needs valid issuedOn and expiresOn dates.");
  if (to < from) throw new Error("A licence cannot expire before it is issued.");
  return Object.freeze({ productId, tier, issuedOn: from, expiresOn: to, licensee: licensee?.trim() || null });
}

export function isLicenseActive(license, today) {
  if (!license) return false;
  const day = dayKey(toDate(today));
  return dayKey(license.issuedOn) <= day && day <= dayKey(license.expiresOn);
}

/** Free features are always available; paid ones need an active licence of the same product. */
export function hasFeature(productId, feature, license, today) {
  if (featuresFor(productId, FREE_TIER).includes(feature)) return true;
  if (!license || license.productId !== productId || !isLicenseActive(license, today)) return false;
  return featuresFor(productId, license.tier).includes(feature);
}

/** A licence as plain JSON for a saved configuration or an order record. */
export const licenseToJson = (l) => ({
  productId: l.productId,
  tier: l.tier,
  issuedOn: dayKey(l.issuedOn),
  expiresOn: dayKey(l.expiresOn),
  licensee: l.licensee,
});
