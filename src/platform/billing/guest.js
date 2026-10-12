import { createHmac, timingSafeEqual } from "node:crypto";
import { emptyBillingState, verifyEntitlement } from "./domain.js";
import { featuresFor } from "../business/products.js";
import { helsinkiInstant, helsinkiLocal } from "../shifts/time.js";
import { fail, identifier } from "./catalog.js";

export const COMPANY_PRODUCT = "company-calendar";
export const purchaseCookieName = year => `__Host-viikkonro-purchase-${year}`;
export const calendarLicenseEnd = year => helsinkiInstant(`${year + 1}-01-01T00:00`);
export function saleYear(year, now = new Date().toISOString()) {
  const current = Number(helsinkiLocal(now).slice(0, 4));
  return Number.isInteger(year) && year >= current && year <= current + 2;
}
const secretKey = secret => {
  if (typeof secret !== "string" || secret.length < 43) fail("purchase_secret_required");
  return secret;
};
const signature = (value, secret) => createHmac("sha256", secretKey(secret)).update(value).digest();

// HttpOnly bearer capability contains no company data, email, card or customer ID.
// A signed cookie is only checkout ownership; it NEVER proves payment.
export function signPurchase(session, secret) {
  const value = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${value}.${signature(value, secret).toString("base64url")}`;
}
export function readPurchase(value, secret, year, now = new Date().toISOString()) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const [payload, mac, extra] = value.split(".");
    if (extra || !payload || !mac) return null;
    const expected = signature(payload, secret), actual = Buffer.from(mac, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url"));
    if (session.version !== 1 || session.productId !== COMPANY_PRODUCT || session.year !== year || !identifier(session.checkoutId) || !identifier(session.providerProductId) || !identifier(session.priceId) || !identifier(session.contractId) || !identifier(session.organizationId) || !["production", "sandbox"].includes(session.environment) || !Number.isSafeInteger(session.amountCents) || session.amountCents < 1 || session.amountCents > 100000000 || !Number.isFinite(Date.parse(session.createdAt)) || Date.parse(session.createdAt) > Date.parse(now) + 300000 || calendarLicenseEnd(year) <= now) return null;
    return session;
  } catch { return null; }
}
export function purchaseCookie(session, secret, now = new Date().toISOString()) {
  const seconds = Math.max(0, Math.floor((Date.parse(calendarLicenseEnd(session.year)) - Date.parse(now)) / 1000));
  return `${purchaseCookieName(session.year)}=${signPurchase(session, secret)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;
}
export function cookiePurchase(request, secret, year, now) {
  const values = (request.headers.get("cookie") ?? "").split(";").map(row => row.trim());
  const name = `${purchaseCookieName(year)}=`;
  const matching = values.filter(row => row.startsWith(name));
  return matching.length === 1 ? readPurchase(matching[0].slice(name.length), secret, year, now) : null;
}

/** Reuse the common entitlement engine, with freshly reconciled provider data. */
export function guestEntitlement(session, payment, now = new Date().toISOString()) {
  const state = emptyBillingState(session.contractId);
  if (payment?.paid && payment.checkoutId === session.checkoutId && payment.productId === session.providerProductId && payment.priceId === session.priceId && payment.organizationId === session.organizationId && payment.contractId === session.contractId && payment.year === session.year && payment.currency === "EUR" && Number.isSafeInteger(payment.amountCents) && payment.amountCents > 0 && Number.isSafeInteger(payment.refundedCents) && payment.refundedCents >= 0 && payment.refundedCents <= payment.amountCents && Number.isFinite(Date.parse(payment.paidAt)) && payment.paidAt >= session.createdAt && payment.paidAt <= now) {
    const plan = { id: "company-calendar-year", grants: [{ productId: COMPANY_PRODUCT, features: featuresFor(COMPANY_PRODUCT, "paid") }], limits: [] };
    state.contracts.push({ id: session.contractId, payments: [{ start: payment.paidAt, end: calendarLicenseEnd(session.year), amountCents: payment.amountCents, refundedCents: payment.refundedCents, plan }] });
  }
  return verifyEntitlement(state, COMPANY_PRODUCT, null, now);
}
