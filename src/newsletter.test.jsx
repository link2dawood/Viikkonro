import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import NewsletterSignup from "./components/NewsletterSignup";
import { NEWSLETTER_KEY, isSnoozed, newsletterEndpoint, requestSubscription, snooze } from "./newsletter";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("newsletter signup", () => {
  it("fails closed for missing or unsafe endpoint configuration", () => {
    for (const value of ["", "http://example.com", "//example.com", "javascript:alert(1)", "/\\example.com", "https://user:password@example.com"]) {
      expect(newsletterEndpoint(value)).toBeNull();
    }
    expect(newsletterEndpoint("/api/newsletter")).toBe("/api/newsletter");
    expect(newsletterEndpoint("https://example.com/signup")).toBe("https://example.com/signup");
  });

  it("keeps the popup out of prerendered content even when configured", () => {
    vi.stubEnv("VITE_NEWSLETTER_ENDPOINT", "/api/newsletter");
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "test-key");
    expect(renderToStaticMarkup(<MemoryRouter><NewsletterSignup /></MemoryRouter>)).toBe("");
  });

  it("remembers dismissal for 30 days without storing an email", () => {
    const data = new Map();
    const store = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
    snooze(store, 30, 1000);
    expect(isSnoozed(store, 1001)).toBe(true);
    expect(isSnoozed(store, 1000 + 30 * 86400000)).toBe(false);
    expect([...data.keys()]).toEqual([NEWSLETTER_KEY]);
    expect(isSnoozed({ getItem: () => "Infinity" })).toBe(false);
    expect(isSnoozed({ getItem: () => "invalid" })).toBe(false);
  });

  it("tolerates blocked browser storage", () => {
    const store = { getItem() { throw Error(); }, setItem() { throw Error(); } };
    expect(isSnoozed(store)).toBe(false);
    expect(() => snooze(store)).not.toThrow();
  });

  it("requires consent before contacting the endpoint", async () => {
    const fetcher = vi.fn();
    await expect(requestSubscription("/api/newsletter", "reader@example.com", false, fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends only the email and explicit newsletter consent, accepting only a confirmation response", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "confirmation_required" }) });
    await requestSubscription("/api/newsletter", " reader@example.com ", true, fetcher);
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("/api/newsletter");
    expect(request.method).toBe("POST");
    expect(request.credentials).toBe("omit");
    expect(JSON.parse(request.body)).toEqual({ email: "reader@example.com", consent: true, consentVersion: "weekly-fi-v1", topic: "weekly-week-and-finnish-holidays", language: "fi" });
  });

  it.each([
    { ok: false },
    { ok: true, json: async () => ({ success: true }) },
    { ok: true, json: async () => { throw Error("HTML response"); } },
  ])("does not show success for failures or an unexpected API response", async (response) => {
    await expect(requestSubscription("/api/newsletter", "reader@example.com", true, async () => response)).rejects.toThrow();
  });

  it("times out requests so visitors can retry", async () => {
    vi.useFakeTimers();
    const fetcher = (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(Error("Aborted")));
    });
    const request = expect(requestSubscription("/api/newsletter", "reader@example.com", true, fetcher)).rejects.toThrow("Aborted");
    await vi.advanceTimersByTimeAsync(15000);
    await request;
  });
});
