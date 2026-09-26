import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";
import { registerWebMCPTools } from "./webmcp.js";
import { trackPdfDownloads } from "./analytics.js";

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
  );
});

// Expose the calculators as WebMCP tools for in-browser AI agents (experimental;
// feature-detected no-op in browsers without navigator.modelContext).
registerWebMCPTools();
