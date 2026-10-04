// Sentry error tracking (client only). Does nothing unless VITE_SENTRY_DSN is
// set at build time, so local dev and forks stay silent.
//
// The SDK is loaded lazily after the page is idle so it never competes with
// LCP/INP. Errors thrown before it loads are buffered and replayed.
const DSN = import.meta.env.VITE_SENTRY_DSN;

let sentry = null;
const pending = [];

// Network noise and browser-extension errors that are not actionable.
const IGNORE_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "Non-Error promise rejection captured",
  "Failed to fetch",
  "NetworkError when attempting to fetch resource",
  "Load failed",
];
const DENY_URLS = [/^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i];

export function initSentry() {
  if (!DSN || typeof window === "undefined") return;
  const load = () =>
    import("@sentry/react")
      .then((Sentry) => {
        Sentry.init({
          dsn: DSN,
          environment: import.meta.env.MODE,
          release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
          sendDefaultPii: false,
          ignoreErrors: IGNORE_ERRORS,
          denyUrls: DENY_URLS,
          tracesSampleRate: 0,
        });
        sentry = Sentry;
        pending.splice(0).forEach(([err, ctx]) => Sentry.captureException(err, ctx));
      })
      .catch(() => {
        /* blocked by an ad blocker or offline: error tracking is best-effort */
      });
  if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 4000 });
  else setTimeout(load, 2000);
}

// Report a handled error (e.g. a failed form submit) with optional context.
export function captureError(error, extra) {
  if (!DSN) return;
  const err = error instanceof Error ? error : new Error(String(error));
  const ctx = extra ? { extra } : undefined;
  if (sentry) sentry.captureException(err, ctx);
  else if (pending.length < 20) pending.push([err, ctx]);
}
