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
