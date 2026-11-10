export const NEWSLETTER_KEY = "viikkonro-newsletter-until";
export const SUBSCRIBED_KEY = "viikkonro-newsletter-subscribed";
export const NEWSLETTER_DELAY = 3000;
export const DISMISS_DAYS = 30;
const DAY = 86400000;

export function newsletterEndpoint(value = import.meta.env.VITE_NEWSLETTER_ENDPOINT || "/api/newsletter") {
  if (!value) return null;
  if (/^\/(?!\/)/.test(value) && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function isSubscribed(store) {
  try {
    return store?.getItem(SUBSCRIBED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markSubscribed(store) {
  try {
    store?.setItem(SUBSCRIBED_KEY, "true");
  } catch {
    // Dismissal still works in memory when browser storage is unavailable.
  }
}

export function isSnoozed(store, now = Date.now()) {
  try {
    const until = Number(store?.getItem(NEWSLETTER_KEY));
    return Number.isFinite(until) && until > now && until <= now + DISMISS_DAYS * DAY;
  } catch {
    return false;
  }
}

export function snooze(store, days = DISMISS_DAYS, now = Date.now()) {
  try {
    store?.setItem(NEWSLETTER_KEY, String(now + days * DAY));
  } catch {
    // Dismissal still works in memory when browser storage is unavailable.
  }
}

export async function requestSubscription(endpoint, email, consent = true, fetcher = fetch, security = {}) {
  if (!newsletterEndpoint(endpoint) || !consent || !email.trim()) throw new Error("Invalid signup");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
      body: JSON.stringify({
        email: email.trim(), consent: true, consentVersion: "weekly-fi-v1",
        topic: "weekly-week-and-finnish-holidays", language: "fi",
        ...(security.token ? { token: security.token, website: security.website || "" } : security.website ? { website: security.website } : {}),
      }),
    });
    if (!response.ok) throw new Error("Signup rejected");
    const result = await response.json();
    if (result.status !== "confirmation_required" && result.status !== "subscribed") throw new Error("Unexpected signup response");
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
