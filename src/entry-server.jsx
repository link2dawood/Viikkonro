import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import AppRoutes from "./AppRoutes";

// Called once per route at build time by prerender.js to produce static HTML.
// <Helmet> requires a HelmetProvider ancestor even here; prerender.js applies
// the actual <title>/meta tags itself from routeMeta, so the collected helmet
// context isn't used for that — this just satisfies react-helmet-async.
export function render(url) {
  return renderToString(
    <HelmetProvider>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </HelmetProvider>,
  );
}

export { pageModuleForRoute } from "./AppRoutes.jsx";
