import { startTransition } from "react";
import * as Sentry from "@sentry/react";
import { hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";
import { registerWebMCPTools } from "./webmcp.js";
import { trackPdfDownloads } from "./analytics.js";
import { applyStoredConsent } from "./consent.js";

Sentry.init({
  dsn: "https://1ae2cecc5e24d5d63d03f083901d3e07@o4510551843143680.ingest.us.sentry.io/4512197245403136",
  environment: import.meta.env.MODE,
});

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
startTransition(() => {
  hydrateRoot(
    document.getElementById("root"),
    <HelmetProvider>
      <App />
    </HelmetProvider>,
    {
      onUncaughtError: Sentry.reactErrorHandler(),
      onCaughtError: Sentry.reactErrorHandler(),
      onRecoverableError: Sentry.reactErrorHandler(),
    },
  );
});

// Expose the calculators as WebMCP tools for in-browser AI agents (experimental;
// feature-detected no-op in browsers without navigator.modelContext).
registerWebMCPTools();
