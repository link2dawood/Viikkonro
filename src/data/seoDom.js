// Which path the served document was prerendered for, or null when that cannot
// be established. prerender.js writes the authoritative canonical into <head>,
// so the canonical link in the static document names the path it was built
// for. This has to be read before hydration: react-helmet-async writes its own
// canonical as soon as a page mounts, after which the tag says nothing about
// the static document.
export function prerenderedPath(doc = typeof document === "undefined" ? undefined : document) {
  if (!doc) return null;
  const link = doc.querySelector('link[rel="canonical"]');
  if (!link) return null;
  try {
    return new URL(link.getAttribute("href"), "https://viikkonro.fi").pathname;
  } catch {
    return null;
  }
}

// Whether this render has to write robots and JSON-LD into the DOM.
//
// The one case that does not is the first render of a page prerendered for
// this exact path: prerender.js already wrote that page's robots meta and its
// JSON-LD graph into <head>, and recomputing them in the browser produces the
// same bytes. Skipping it keeps the 109 KB data/pageJsonLd module off the
// critical path of every page.
//
// Every other case synchronizes:
//   - a client-side navigation, where the head still describes the old route;
//   - a route served from a shell document, whose head describes another page;
//   - a return to the initial path later in the session, where the head now
//     holds whatever the previously visited route wrote;
//   - a page passing its own jsonLd, which the static document may not match.
export function needsHeadSync({ path, prerendered, isInitialRender, hasExplicitJsonLd }) {
  if (hasExplicitJsonLd) return true;
  if (!isInitialRender) return true;
  return path !== prerendered;
}

// DOM synchronization for robots meta and structured data (JSON-LD)
// on client-side route navigation.
export function syncSeoDom(path, effectiveRobots, effectiveJsonLd, doc = typeof document !== "undefined" ? document : undefined) {
  if (!doc) return;

  // 1. Robots meta synchronization across client-side navigation
  const robotsMetas = doc.querySelectorAll('meta[name="robots"]');
  if (robotsMetas.length > 0) {
    robotsMetas[0].setAttribute("content", effectiveRobots);
    for (let i = 1; i < robotsMetas.length; i++) {
      robotsMetas[i].remove();
    }
  } else {
    const robotsMeta = doc.createElement("meta");
    robotsMeta.name = "robots";
    robotsMeta.setAttribute("content", effectiveRobots);
    doc.head.appendChild(robotsMeta);
  }

  // 2. Structured data JSON-LD synchronization across client-side navigation
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  if (effectiveJsonLd) {
    const jsonText = JSON.stringify(effectiveJsonLd, null, 2);
    if (scripts.length > 0) {
      scripts[0].textContent = jsonText;
      for (let i = 1; i < scripts.length; i++) {
        scripts[i].remove();
      }
    } else {
      const s = doc.createElement("script");
      s.type = "application/ld+json";
      s.textContent = jsonText;
      doc.head.appendChild(s);
    }
  } else {
    scripts.forEach((s) => s.remove());
  }
}
