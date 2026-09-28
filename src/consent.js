// Analytics consent for Microsoft Clarity (client only).
//
// index.html starts every page with Clarity's Consent API V2 set to
// denied (cookieless mode). A visitor's choice from ConsentBanner is kept in
// localStorage — storing the choice itself is strictly necessary and needs
// no consent — and re-applied on every page load before clarity.js loads
// (it's deferred until the page is idle), so returning visitors who agreed
// are recognised from the first page on.
//
// Advertising storage always stays denied here: ads need a Google-certified
// CMP (see AdSlot.jsx), which this banner is not.
export const CONSENT_KEY = "viikkonro-consent";
// Bump when the banner's purposes change, so everyone is asked again.
export const CONSENT_VERSION = 1;
export const CONSENT_OPEN_EVENT = "viikkonro:consent-open";

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // blocked storage (e.g. some private modes)
  }
}

function clarity(...args) {
  if (typeof window !== "undefined" && typeof window.clarity === "function") {
    window.clarity(...args);
  }
}

// { analytics: boolean, at: ISO string } or null when the visitor hasn't
// chosen yet (or chose under an older banner version).
export function readConsent(store = storage()) {
  try {
    const raw = store?.getItem(CONSENT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value?.v !== CONSENT_VERSION || typeof value.analytics !== "boolean") return null;
    return { analytics: value.analytics, at: value.at };
  } catch {
    return null;
  }
}

export function saveConsent(analytics, store = storage(), now = new Date()) {
  try {
    store?.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, analytics, at: now.toISOString() }));
  } catch {
    // Storage unavailable: the choice still applies to this page view.
  }
}

// Tell Clarity. `revoked` = the visitor had granted and now declined, in
// which case Clarity's cookies are also erased (Consent API v1 call).
export function applyConsent(analytics, { revoked = false } = {}) {
  clarity("consentv2", { ad_Storage: "denied", analytics_Storage: analytics ? "granted" : "denied" });
  if (revoked) clarity("consent", false);
}

// On page load: re-send a stored "granted". Denied is already the default.
export function applyStoredConsent() {
  const stored = readConsent();
  if (stored?.analytics) applyConsent(true);
}

// Record a choice made in the banner.
export function chooseConsent(analytics) {
  const previous = readConsent();
  saveConsent(analytics);
  applyConsent(analytics, { revoked: previous?.analytics === true && !analytics });
}

// Re-open the banner (footer link, privacy page button).
export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
