import { describe, expect, it } from "vitest";
import { DEFAULT_ROBOTS, NOINDEX_ROBOTS, robotsFor } from "../data/seo.js";
import { getPageJsonLd } from "../data/pageJsonLd.js";
import { syncSeoDom } from "../data/seoDom.js";

// Helper to create a minimal DOM document mock for syncSeoDom tests
function createMockDocument(initialElements = {}) {
  const elements = {
    metas: [],
    scripts: [],
  };

  function createNode(tagName, initialAttrs = {}, textContent = "") {
    const attrs = { ...initialAttrs };
    const node = {
      tagName,
      textContent,
      name: attrs.name || "",
      type: attrs.type || "",
      setAttribute(k, v) {
        attrs[k] = String(v);
        if (k === "name") node.name = String(v);
        if (k === "type") node.type = String(v);
      },
      getAttribute(k) {
        return attrs[k];
      },
      remove() {
        if (tagName === "meta") {
          const idx = elements.metas.indexOf(node);
          if (idx !== -1) elements.metas.splice(idx, 1);
        }
        if (tagName === "script") {
          const idx = elements.scripts.indexOf(node);
          if (idx !== -1) elements.scripts.splice(idx, 1);
        }
      },
    };
    return node;
  }

  for (const m of initialElements.metas || []) {
    elements.metas.push(createNode("meta", m));
  }
  for (const s of initialElements.scripts || []) {
    elements.scripts.push(createNode("script", s, s.textContent || ""));
  }

  const doc = {
    head: {
      appendChild(node) {
        if (node.tagName === "meta") elements.metas.push(node);
        if (node.tagName === "script") elements.scripts.push(node);
        return node;
      },
    },
    createElement(tagName) {
      return createNode(tagName);
    },
    querySelectorAll(selector) {
      if (selector === 'meta[name="robots"]') {
        return [...elements.metas.filter(
          (m) => m.name === "robots" || m.getAttribute("name") === "robots",
        )];
      }
      if (selector === 'script[type="application/ld+json"]') {
        return [...elements.scripts.filter(
          (s) => s.type === "application/ld+json" || s.getAttribute("type") === "application/ld+json",
        )];
      }
      return [];
    },
  };

  return { doc, elements };
}

describe("Finding 2: Robots and JSON-LD SPA navigation remediation", () => {
  describe("robotsFor logic", () => {
    it("returns DEFAULT_ROBOTS for indexable routes", () => {
      expect(robotsFor("/")).toBe(DEFAULT_ROBOTS);
      expect(robotsFor("/viikko-42-2026")).toBe(DEFAULT_ROBOTS);
      expect(robotsFor("/laskurit")).toBe(DEFAULT_ROBOTS);
      expect(robotsFor("/tyopaivat-2026")).toBe(DEFAULT_ROBOTS);
      expect(robotsFor("/pyhat-2026/joulupaiva")).toBe(DEFAULT_ROBOTS);
    });

    it("returns NOINDEX_ROBOTS for out-of-window and non-indexable routes", () => {
      // Out of rolling 6-year window for dated pages
      expect(robotsFor("/kuukausi-10-2020")).toBe(NOINDEX_ROBOTS);
      expect(robotsFor("/tyopaivat-2020")).toBe(NOINDEX_ROBOTS);
      expect(robotsFor("/404")).toBe(NOINDEX_ROBOTS);
      expect(robotsFor("/widget/viikko")).toBe(NOINDEX_ROBOTS);
    });

    it("respects explicit robots overrides", () => {
      expect(robotsFor("/", "noindex, nofollow")).toBe("noindex, nofollow");
    });
  });

  describe("getPageJsonLd logic", () => {
    it("generates structured schema for indexable pages", () => {
      const homeLd = getPageJsonLd("/");
      expect(homeLd).not.toBeNull();
      expect(homeLd["@context"]).toBe("https://schema.org");
      expect(homeLd["@graph"]).toBeDefined();
      const homePageNode = homeLd["@graph"].find((n) => n["@id"] === "https://viikkonro.fi/#webpage");
      expect(homePageNode).toBeDefined();

      const weekLd = getPageJsonLd("/viikko-42-2026");
      expect(weekLd).not.toBeNull();
      const weekPageNode = weekLd["@graph"].find((n) => n["@id"] === "https://viikkonro.fi/viikko-42-2026#webpage");
      expect(weekPageNode).toBeDefined();

      const laskuritLd = getPageJsonLd("/laskurit");
      expect(laskuritLd).not.toBeNull();
      const laskuritPageNode = laskuritLd["@graph"].find((n) => n["@id"] === "https://viikkonro.fi/laskurit#webpage");
      expect(laskuritPageNode).toBeDefined();
    });

    it("returns null for noindex archives and out-of-window pages", () => {
      expect(getPageJsonLd("/kuukausi-10-2020")).toBeNull();
      expect(getPageJsonLd("/tyopaivat-2020")).toBeNull();
      expect(getPageJsonLd("/404")).toBeNull();
      expect(getPageJsonLd("/widget/viikko")).toBeNull();
    });
  });

  describe("syncSeoDom DOM synchronization across navigation", () => {
    it("Reproduction Case 1: direct load /kuukausi-10-2020 then navigate to /", () => {
      // Step 1: initial page load of /kuukausi-10-2020 (noindex, no schema)
      const { doc } = createMockDocument({
        metas: [{ name: "robots", content: NOINDEX_ROBOTS }],
        scripts: [],
      });

      expect(doc.querySelectorAll('meta[name="robots"]')[0].getAttribute("content")).toBe(NOINDEX_ROBOTS);
      expect(doc.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);

      // Step 2: SPA navigate to /
      const homeRobots = robotsFor("/");
      const homeJsonLd = getPageJsonLd("/");
      syncSeoDom("/", homeRobots, homeJsonLd, doc);

      // Verify robots is updated to DEFAULT_ROBOTS
      const robotsTags = doc.querySelectorAll('meta[name="robots"]');
      expect(robotsTags.length).toBe(1);
      expect(robotsTags[0].getAttribute("content")).toBe(DEFAULT_ROBOTS);

      // Verify homepage JSON-LD script was added
      const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
      expect(scriptTags.length).toBe(1);
      const parsedGraph = JSON.parse(scriptTags[0].textContent);
      expect(parsedGraph["@context"]).toBe("https://schema.org");
      expect(parsedGraph["@graph"].some((n) => n["@id"] === "https://viikkonro.fi/#webpage")).toBe(true);
    });

    it("Reproduction Case 2: direct load /viikko-42-2026 then navigate to /laskurit", () => {
      // Step 1: initial page load of /viikko-42-2026
      const weekLd = getPageJsonLd("/viikko-42-2026");
      const { doc } = createMockDocument({
        metas: [{ name: "robots", content: DEFAULT_ROBOTS }],
        scripts: [{ type: "application/ld+json", textContent: JSON.stringify(weekLd, null, 2) }],
      });

      // Verify initial state has week 42 schema
      expect(doc.querySelectorAll('script[type="application/ld+json"]')[0].textContent).toContain("viikko-42-2026");

      // Step 2: SPA navigate to /laskurit
      const laskuritRobots = robotsFor("/laskurit");
      const laskuritJsonLd = getPageJsonLd("/laskurit");
      syncSeoDom("/laskurit", laskuritRobots, laskuritJsonLd, doc);

      // Verify robots is DEFAULT_ROBOTS
      const robotsTags = doc.querySelectorAll('meta[name="robots"]');
      expect(robotsTags.length).toBe(1);
      expect(robotsTags[0].getAttribute("content")).toBe(DEFAULT_ROBOTS);

      // Verify week 42 schema is replaced and does NOT linger
      const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
      expect(scriptTags.length).toBe(1);
      expect(scriptTags[0].textContent).not.toContain("viikko-42-2026");
      expect(scriptTags[0].textContent).toContain("https://viikkonro.fi/laskurit#webpage");
    });

    it("navigating from indexable page to noindex page removes JSON-LD and sets noindex", () => {
      // Initial state: /laskurit
      const laskuritLd = getPageJsonLd("/laskurit");
      const { doc } = createMockDocument({
        metas: [{ name: "robots", content: DEFAULT_ROBOTS }],
        scripts: [{ type: "application/ld+json", textContent: JSON.stringify(laskuritLd, null, 2) }],
      });

      // Navigate to /kuukausi-10-2020
      const noindexRobots = robotsFor("/kuukausi-10-2020");
      const noindexLd = getPageJsonLd("/kuukausi-10-2020");
      expect(noindexLd).toBeNull();

      syncSeoDom("/kuukausi-10-2020", noindexRobots, noindexLd, doc);

      // Robots meta updated to noindex
      const robotsTags = doc.querySelectorAll('meta[name="robots"]');
      expect(robotsTags.length).toBe(1);
      expect(robotsTags[0].getAttribute("content")).toBe(NOINDEX_ROBOTS);

      // JSON-LD scripts completely removed
      const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
      expect(scriptTags.length).toBe(0);
    });

    it("cleans up duplicate robots meta tags", () => {
      const { doc, elements } = createMockDocument({
        metas: [
          { name: "robots", content: NOINDEX_ROBOTS },
          { name: "robots", content: DEFAULT_ROBOTS },
        ],
      });
      expect(doc.querySelectorAll('meta[name="robots"]').length).toBe(2);

      syncSeoDom("/", DEFAULT_ROBOTS, null, doc);

      expect(elements.metas.length).toBe(1);
      expect(elements.metas[0].getAttribute("content")).toBe(DEFAULT_ROBOTS);
    });
  });
});
