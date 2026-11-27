// Deferred Sentry loading.
//
// @sentry/react is roughly 90 KB raw, and init() does more than download:
// it instruments the global error handlers, timers, animation frames,
// addEventListener, fetch, XHR and history, then installs breadcrumbs. On a
// mid-range phone that is tens of milliseconds of blocking work, and it ran
// inside the hydration window, where it competed with React for the main
// thread. A Lighthouse run on /adventti-2026 attributed 1,043 ms of CPU to the
// chunk that held React and Sentry together.
//
// None of that work is needed to render a page, so the SDK is imported after
// the load event once the main thread is idle, the same pattern index.html
// already uses for clarity.js. Errors are not lost in the meantime: the
// listeners below are registered synchronously, buffer what they see, and
// replay it into Sentry as soon as it arrives. The reporting window therefore
// still covers the whole page load, including hydration.
import { publicErrorEvent } from "./errorReporting.js";

const DSN =
  "https://1ae2cecc5e24d5d63d03f083901d3e07@o4510551843143680.ingest.us.sentry.io/4512197245403136";

// Cap the buffer. A render loop that throws on every attempt must not grow an
// unbounded array while the SDK is still on its way.
const MAX_BUFFERED = 10;

const buffered = [];
let capture = null;
let started = false;

// Forward an error to Sentry, or hold it until the SDK is ready.
export function captureError(error) {
  if (capture) {
    capture(error);
    return;
  }
  if (buffered.length < MAX_BUFFERED) buffered.push(error);
}

// Drop-in replacement for Sentry.reactErrorHandler() in hydrateRoot's error
// callbacks. beforeSend (publicErrorEvent) keeps only the exception type and
// the asset stack frames, so a component stack would be stripped from the
// payload anyway; passing the error alone loses nothing that is actually sent.
export function reactErrorHandler() {
  return (error) => captureError(error);
}

function bufferEarlyErrors() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    if (capture) return; // Sentry's own handler has taken over.
    if (event.error) captureError(event.error);
  });
  window.addEventListener("unhandledrejection", (event) => {
    if (capture) return;
    if (event.reason) captureError(event.reason);
  });
}

async function start() {
  if (started) return;
  started = true;
  try {
    // ./sentryClient.js, not @sentry/react: a namespace import cannot be
    // tree-shaken. See that file.
    const { init, captureException } = await import("./sentryClient.js");
    init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
      sendDefaultPii: false,
      maxBreadcrumbs: 0,
      beforeSend: publicErrorEvent,
    });
    capture = captureException;
    // Replay what happened before the SDK existed, oldest first.
    while (buffered.length > 0) captureException(buffered.shift());
  } catch {
    // A blocked or failed Sentry download must never break the page. The
    // buffer is simply dropped: nothing in the application reads it.
  }
}

// Load after the load event, when the main thread next goes idle. The timeout
// bounds the wait on a page that never becomes idle, so a long-lived tab still
// reports its errors.
export function loadSentryWhenIdle() {
  if (typeof window === "undefined") return;
  bufferEarlyErrors();
  const idle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(start, { timeout: 4000 });
    } else {
      window.setTimeout(start, 1500);
    }
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}
