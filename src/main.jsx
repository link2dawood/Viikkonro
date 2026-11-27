import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./App.css";
import "./app.js";
import { preloadRoute } from "./AppRoutes.jsx";
import App from "./App.jsx";
import { registerWebMCPTools } from "./webmcp.js";
import { trackPdfDownloads } from "./analytics.js";
import { applyStoredConsent } from "./consent.js";
import {
  captureError,
  loadSentryWhenIdle,
  reactErrorHandler,
} from "./sentryLazy.js";

// Error reporting is buffered immediately and the Sentry SDK itself is
// imported after load, once the main thread is idle. See src/sentryLazy.js for
// why: its init() instrumentation used to run inside the hydration window.
loadSentryWhenIdle();

// A returning visitor's analytics consent, queued before clarity.js loads
// (it waits for idle), so Clarity starts with the right cookie setting.
applyStoredConsent();
// Before hydration, so a download clicked on the prerendered page is counted.
trackPdfDownloads();

// hydrateRoot REUSES the prerendered HTML instead of createRoot().render()'s
// wipe-and-rebuild. The prerendered markup becomes the final paint, so LCP
// happens at first paint rather than after the JS bundle re-renders the tree.
// Inside startTransition, hydration is time-sliced: React yields to the
// browser every few milliseconds instead of hydrating the whole page (e.g. a
// 12-month calendar grid) in one long task, so a tap during load is handled
// promptly (INP). The page is already painted, so nothing visible waits.
// Preload only the matched route before hydration so the first client render
// uses its real component, matching the complete eagerly rendered SSR HTML.
preloadRoute(window.location.pathname).then(() => startTransition(() => {
  hydrateRoot(
    document.getElementById("root"),
    <HelmetProvider>
      <App />
    </HelmetProvider>,
    {
      onUncaughtError: reactErrorHandler(),
      onCaughtError: reactErrorHandler(),
      onRecoverableError: reactErrorHandler(),
    },
  );
})).catch(error => captureError(error));

// Expose the calculators as WebMCP tools for in-browser AI agents (experimental;
// feature-detected no-op in browsers without navigator.modelContext).
registerWebMCPTools();
