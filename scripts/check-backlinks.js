#!/usr/bin/env node
// Known-backlinks monitor: for every page listed in seo/backlinks.txt, fetch
// it and check that it still links to viikkonro.fi, and whether the link is
// nofollow / sponsored / ugc. Search Console's API has no links data, so this
// checks the links you already know about rather than discovering new ones.
//
// Usage: node scripts/check-backlinks.js [--json]
// Exit code 1 when any listed page no longer links to the site.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIST = path.join(ROOT, "seo", "backlinks.txt");
const TARGET_HOST = "viikkonro.fi";
const UA = "Mozilla/5.0 (compatible; ViikkonroBacklinkCheck/1.0; +https://viikkonro.fi/)";

export function readBacklinkList(file = LIST) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, "").trim())
    .filter((line) => /^https?:\/\//i.test(line));
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// All <a> tags in the HTML that point at viikkonro.fi, with rel and anchor text.
export function findLinks(html, pageUrl) {
  const links = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const href = (attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i) || [])
      .slice(2)
      .find((v) => v !== undefined);
    if (!href) continue;
    let url;
    try {
      url = new URL(decode(href), pageUrl);
    } catch {
      continue;
    }
    const host = url.hostname.replace(/^www\./, "");
    if (host !== TARGET_HOST) continue;
    const rel = ((attrs.match(/\brel\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2] || "").toLowerCase();
    const text = decode(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 80);
    links.push({
      target: url.href,
      text,
      nofollow: /\bnofollow\b/.test(rel),
      sponsored: /\bsponsored\b/.test(rel),
      ugc: /\bugc\b/.test(rel),
    });
  }
  return links;
}

export async function checkBacklinks(urls = readBacklinkList()) {
  const results = [];
  for (const source of urls) {
    try {
      const res = await fetch(source, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      const html = res.ok ? await res.text() : "";
      const links = res.ok ? findLinks(html, res.url) : [];
      const follow = links.filter((l) => !l.nofollow && !l.sponsored && !l.ugc);
      results.push({
        source,
        status: res.status,
        ok: res.ok && links.length > 0,
        links,
        follow: follow.length,
        state: !res.ok ? `HTTP ${res.status}` : !links.length ? "link missing" : follow.length ? "dofollow" : "nofollow only",
      });
    } catch (err) {
      results.push({ source, status: 0, ok: false, links: [], follow: 0, state: `fetch failed: ${err.name === "TimeoutError" ? "timeout" : err.message}` });
    }
  }
  return results;
}

async function main() {
  const urls = readBacklinkList();
  if (!urls.length) {
    console.log("No backlinks listed in seo/backlinks.txt yet: nothing to check.");
    return;
  }
  const results = await checkBacklinks(urls);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      console.log(`${r.ok ? "OK  " : "FAIL"} ${r.state.padEnd(14)} ${r.source}`);
      for (const l of r.links) console.log(`       -> ${l.target}  "${l.text}"${l.nofollow ? " [nofollow]" : ""}${l.sponsored ? " [sponsored]" : ""}${l.ugc ? " [ugc]" : ""}`);
    }
    const lost = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - lost}/${results.length} backlinks present.`);
  }
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
