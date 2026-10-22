import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { sitemapEntries } from "./seo.js";
import { SUN_CITIES, SUN_HUB_PATH, sunCityPath } from "./sunCities.js";
import { PRERENDER_MIN_YEAR, PRERENDER_MAX_YEAR } from "../components/dateUtils.js";

const vercel = JSON.parse(
  fs.readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"),
);
const redirects = new Map(
  vercel.redirects.map((rule) => [rule.source, rule]),
);

const requiredRedirects = [
  ["/week/:week/:year", "/viikko-:week-:year"],
  ["/month/:month/:year", "/kuukausi-:month-:year"],
  ["/year/:year", "/vuosi-:year"],
  ["/print/:year", "/tulosta-:year"],
  ["/pdfs/:file", "/pdf/:file"],
  ["/cdn-cgi/l/email-protection", "/"],
  ["/kalenteri-:y(\\d+)-1", "/kalenteri-:y-alkuvuosi"],
  ["/kalenteri-:y(\\d+)-2", "/kalenteri-:y-loppuvuosi"],
  // Search Console reported /kaupunki/helsinki as a 404. It was never a real
  // route: 835 week pages linked it as the sunrise/sunset location credit until
  // commit 320fffa removed the link. The related page is that city's sun page.
  ["/kaupunki", SUN_HUB_PATH],
  ["/kaupunki/:slug", "/auringonlasku-:slug"],
];

// Translates the path-to-regexp subset this config uses into a RegExp so the
// suite can reason about which URLs a rule actually captures. Vercel compiles
// the real thing; this mirrors ":name(regex)", ":name*" and bare ":name" only,
// which is every form present in vercel.json.
function compileSource(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (char !== ":") {
      out += /[.*+?^${}()|[\]\\]/.test(char) ? `\\${char}` : char;
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) end += 1;
    if (source[end] === "(") {
      let depth = 1;
      let close = end + 1;
      while (close < source.length && depth > 0) {
        if (source[close] === "(") depth += 1;
        if (source[close] === ")") depth -= 1;
        close += 1;
      }
      out += `(${source.slice(end + 1, close - 1)})`;
      i = close;
    } else if (source[end] === "*") {
      out += "(.*)";
      i = end + 1;
    } else {
      out += "([^/]+)";
      i = end;
    }
  }
  return new RegExp(`^${out}$`);
}

const routePaths = sitemapEntries(2026).map((entry) => entry.path);
const routes = new Set(routePaths);

describe("legacy URL consolidation", () => {
  it.each(requiredRedirects)("keeps %s as a permanent single-hop redirect", (source, destination) => {
    expect(redirects.get(source)).toMatchObject({
      destination,
      statusCode: 301,
    });
    expect(redirects.has(destination)).toBe(false);
  });

  it("publishes only canonical route families in the generated inventory", () => {
    const paths = sitemapEntries(2026).map((entry) => entry.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(
      paths.filter(
        (path) =>
          /^\/(?:year|week|month)\//.test(path) ||
          /^\/kalenteri-\d+-(?:1|2)$/.test(path),
      ),
    ).toEqual([]);
  });
});

describe("unsupported calendar years redirect instead of 404ing", () => {
  // Vercel evaluates redirects BEFORE the filesystem, so a rule that matches a
  // prerendered path hijacks a real page. The year floor is a hardcoded
  // PRERENDER_MIN_YEAR, so a rule bounded to <= 2019 can never collide -- but
  // only while that floor stays put, which this asserts.
  it("pins the floor the pre-2020 rules are built against", () => {
    expect(PRERENDER_MIN_YEAR).toBe(2020);
  });

  it.each([
    ["/viikko-10-2019", "/viikko-10-2020"],
    ["/viikko-1-1999", "/viikko-1-2020"],
    ["/q4-2019", "/q4-2020"],
    ["/q1-2015", "/q1-2020"],
    ["/kuukausi-9-2018", "/kuukausi-9-2020"],
    ["/vuosi-2019", "/vuosi-2020"],
    ["/tulosta-2019", "/tulosta-2020"],
    ["/kalenteri-2019", "/kalenteri-2020"],
    ["/kalenteri-2019-alkuvuosi", "/kalenteri-2020-alkuvuosi"],
    ["/kalenteri-2019-loppuvuosi", "/kalenteri-2020-loppuvuosi"],
    ["/tyopaivat-2019", "/tyopaivat-2020"],
    ["/tyopaivat-tammikuu-2019", "/tyopaivat-tammikuu-2020"],
    ["/elakkeen-maksupaivat-2019", "/elakkeen-maksupaivat-2020"],
    ["/tulostettava-kalenteri-2019", "/tulostettava-kalenteri-2020"],
    ["/kuun-vaiheet-2019", "/kuun-vaiheet-2020"],
    ["/pyhat-2019/joulupaiva", "/pyhat-2020/joulupaiva"],
  ])("sends %s to %s", (requested, expected) => {
    const rule = vercel.redirects.find((candidate) => compileSource(candidate.source).test(requested));
    expect(rule, `no redirect matches ${requested}`).toBeTruthy();
    expect(rule.statusCode).toBe(301);

    const match = compileSource(rule.source).exec(requested);
    const names = [...rule.source.matchAll(/:([A-Za-z0-9_]+)/g)].map((m) => m[1]);
    let resolved = rule.destination;
    names.forEach((name, index) => {
      resolved = resolved.replace(`:${name}`, match[index + 1]);
    });
    expect(resolved).toBe(expected);
    // A redirect must land on a page that exists, never on another 404.
    expect(routes.has(expected)).toBe(true);
  });

  // The reported /viikko-*-2036 404s need no rule: PRERENDER_MAX_YEAR is
  // currentYear + 9, so 2036 is prerendered from 2027-01-01 onward. A redirect
  // for it would shadow those real pages the moment the horizon reaches them.
  it("never redirects a year inside the rolling prerender horizon", () => {
    for (const rule of vercel.redirects) {
      const pattern = compileSource(rule.source);
      for (let year = PRERENDER_MIN_YEAR; year <= PRERENDER_MAX_YEAR + 1; year += 1) {
        for (const probe of [`/viikko-25-${year}`, `/vuosi-${year}`, `/tulosta-${year}`, `/q4-${year}`]) {
          expect(pattern.test(probe), `${rule.source} captures in-horizon ${probe}`).toBe(false);
        }
      }
    }
  });

  it("shadows no prerendered route", () => {
    // One combined alternation rejects a route in a single test instead of one
    // per rule, which keeps a full 15k-route sweep off the suite's hot path.
    // The per-rule search only runs for a route that actually matched.
    const compiled = vercel.redirects.map((rule) => [rule, compileSource(rule.source)]);
    const anyRule = new RegExp(
      `^(?:${compiled.map(([, pattern]) => pattern.source.slice(1, -1)).join("|")})$`,
    );
    const shadowed = routePaths
      .filter((path) => anyRule.test(path))
      .map((path) => {
        const hit = compiled.find(([, pattern]) => pattern.test(path));
        return `${hit[0].source} -> ${path}`;
      });
    expect(shadowed).toEqual([]);
  });

  // The family alternation is a long list, so assert the destination exists for
  // every branch rather than the handful spot-checked above: a family whose
  // 2020 page is not published would turn this redirect into a 404 hop. That is
  // why /koululomat- is deliberately absent from the alternation -- it publishes
  // only the years whose school-holiday data reaches the CONFIRMED tier (today
  // 2026-2028), so every possible destination year would eventually drift off.
  it("resolves every family branch to a published 2020 page", () => {
    const rule = vercel.redirects.find((candidate) => candidate.source.includes("tulostettava-kalenteri"));
    const families = rule.source.match(/\(([^)]*\|[^)]*)\)/)[1].split("|");
    expect(families.length).toBeGreaterThan(25);
    expect(families).not.toContain("koululomat");
    const missing = families
      .map((family) => `/${family}-2020`)
      .filter((destination) => !routes.has(destination));
    expect(missing).toEqual([]);
  });

  it("resolves every sun-city slug the /kaupunki rule can produce", () => {
    const rule = redirects.get("/kaupunki/:slug");
    for (const city of SUN_CITIES) {
      const resolved = rule.destination.replace(":slug", city.slug);
      expect(resolved).toBe(sunCityPath(city.slug));
      expect(routes.has(resolved)).toBe(true);
    }
  });
});
