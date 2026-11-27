import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { robotsFor } from "../data/seo";
import { needsHeadSync, prerenderedPath, syncSeoDom } from "../data/seoDom";

// Sets this page's <title>/description/robots/canonical for as long as it's
// mounted; react-helmet-async restores the previous values automatically on
// unmount, so client-side navigation between routes always shows the right
// tab title. `canonical` matters most for routes that are never prerendered
// (/year, /week, /month, /print) - without it they'd keep whatever canonical
// was baked into the index.html shell they were served from (the homepage's).
//
// Robots meta and page-level JSON-LD are explicitly synchronized with the DOM
// on every route transition (Finding 2 fix), ensuring that navigation between
// indexable and noindex pages always cleans up or applies the correct
// directives.
//
// The one case that needs no synchronization is the very first render of a
// page that was prerendered for this exact path: prerender.js already wrote
// the authoritative robots meta and the page's JSON-LD graph into <head>, and
// the client recomputation produces the same bytes. Re-running it bought
// nothing and cost the 109 KB data/pageJsonLd module on the critical path of
// every page. So the structured-data builder is imported on demand, and only
// for a path the served document was not built for: a client-side navigation,
// or a route served from a shell document.

// Read once at module load, which runs before hydration. See prerenderedPath().
const PRERENDERED_PATH = prerenderedPath();

// Cleared by the first effect run, so returning to the initial path later in
// the session still re-applies its head data over the previous route's.
let firstSync = true;

const SEO = ({ title, description, robots, canonical, lang, alternates = [], jsonLd }) => {
  let locationPath = "/";
  try {
    const loc = useLocation();
    if (loc?.pathname) locationPath = loc.pathname;
  } catch {
    // Outside Router context (e.g. isolated test environments)
  }

  const path = canonical
    ? new URL(canonical, "https://viikkonro.fi").pathname
    : locationPath;

  const effectiveRobots = robotsFor(path, robots);

  useEffect(() => {
    const isInitialRender = firstSync;
    firstSync = false;
    const sync = needsHeadSync({
      path,
      prerendered: PRERENDERED_PATH,
      isInitialRender,
      hasExplicitJsonLd: jsonLd !== undefined,
    });
    // The static document already carries this path's robots meta and graph.
    if (!sync) return;
    if (jsonLd !== undefined) {
      syncSeoDom(path, effectiveRobots, jsonLd);
      return;
    }
    let cancelled = false;
    import("../data/pageJsonLd").then(({ getPageJsonLd }) => {
      if (cancelled) return;
      syncSeoDom(path, effectiveRobots, getPageJsonLd(path));
    }).catch(() => {
      // A failed chunk load must not leave a stale robots directive behind.
      if (!cancelled) syncSeoDom(path, effectiveRobots, null);
    });
    return () => {
      cancelled = true;
    };
  }, [path, effectiveRobots, jsonLd]);

  return (
    <Helmet htmlAttributes={lang ? { lang } : undefined}>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={effectiveRobots} />
      {canonical && <link rel="canonical" href={canonical} />}
      {alternates.map((alternate) => (
        <link
          key={alternate.lang}
          rel="alternate"
          hrefLang={alternate.lang}
          href={alternate.href}
        />
      ))}
    </Helmet>
  );
};

export default SEO;
