import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CONSENT_KEY, CONSENT_VERSION, applyConsent, readConsent, saveConsent } from "./consent.js";
import ConsentBanner from "./components/ConsentBanner.jsx";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
}

afterEach(() => {
  delete globalThis.window;
});

describe("stored consent", () => {
  it("round-trips a choice", () => {
    const s = memoryStorage();
    saveConsent(true, s, new Date("2026-09-27T10:00:00Z"));
    expect(readConsent(s)).toEqual({ analytics: true, at: "2026-09-27T10:00:00.000Z" });
    saveConsent(false, s);
    expect(readConsent(s).analytics).toBe(false);
  });

  it("asks again for missing, corrupt or older-version choices", () => {
    expect(readConsent(memoryStorage())).toBeNull();
    expect(readConsent(memoryStorage({ [CONSENT_KEY]: "{not json" }))).toBeNull();
    expect(readConsent(memoryStorage({ [CONSENT_KEY]: JSON.stringify({ v: CONSENT_VERSION - 1, analytics: true }) }))).toBeNull();
    expect(readConsent(null)).toBeNull();
  });
});

describe("Clarity consent signals", () => {
  it("grants analytics storage only, never ads", () => {
    const clarity = vi.fn();
    globalThis.window = { clarity };
    applyConsent(true);
    expect(clarity).toHaveBeenCalledWith("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    expect(clarity).toHaveBeenCalledTimes(1);
  });

  it("erases Clarity cookies when consent is withdrawn", () => {
    const clarity = vi.fn();
    globalThis.window = { clarity };
    applyConsent(false, { revoked: true });
    expect(clarity).toHaveBeenNthCalledWith(1, "consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
    expect(clarity).toHaveBeenNthCalledWith(2, "consent", false);
  });
});

describe("ConsentBanner", () => {
  it("renders nothing in prerendered HTML (shown only after mount)", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ConsentBanner />
      </MemoryRouter>,
    );
    expect(html).toBe("");
  });
});
