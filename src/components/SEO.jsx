import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { robotsFor } from "../data/seo";
import { getPageJsonLd } from "../data/pageJsonLd";
import { syncSeoDom } from "../data/seoDom";

// Sets this page's <title>/description/robots/canonical for as long as it's
// mounted; react-helmet-async restores the previous values automatically on
// unmount, so client-side navigation between routes always shows the right
// tab title. `canonical` matters most for routes that are never prerendered
// (/year, /week, /month, /print) - without it they'd keep whatever canonical
// was baked into the index.html shell they were served from (the homepage's).
//
// Robots meta and page-level JSON-LD are explicitly synchronized with the DOM
// on every route transition (Finding 2 fix), ensuring that navigation between
// indexable and noindex pages always cleans up or applies the correct directives.
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
  const effectiveJsonLd = jsonLd !== undefined ? jsonLd : getPageJsonLd(path);

  useEffect(() => {
    syncSeoDom(path, effectiveRobots, effectiveJsonLd);
  }, [path, effectiveRobots, effectiveJsonLd]);

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
