#!/usr/bin/env node
// Weekly SEO report: Search Console traffic (last 7 finalized days vs the 7
// before), top queries and pages, the new page families, sitemap status,
// indexing of key pages, live site health (including that the main JS bundle
// loads, the Cloudflare-404 failure mode of 2026-09-28) and the known
// backlinks. Writes seo-report.html, seo-report.md and seo-report-subject.txt
// to the working directory; .github/workflows/weekly-seo-report.yml emails it.
//
// Every section catches its own errors, so a missing Search Console
// permission still produces a report with the health and backlink sections
// and a clear note on what to fix.

import fs from "node:fs";
import { API, SITE_PROPERTY, SITE_URL, getClient, isoDateDaysAgo } from "../src/gscClient.js";
import { checkBacklinks, readBacklinkList } from "./check-backlinks.js";

const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki", year: "numeric" }).format(new Date()));

// Page families added in 2026, reported separately so their growth is visible.
const FAMILIES = [
  ["Kela and pension payment days", /\/(kelan|elakkeen)-maksupaivat-\d{4}$/],
  ["Observance days", /\/(isanpaiva|aitienpaiva|ystavanpaiva|laskiainen|adventti)-\d{4}$/],
  ["Calculators", /\/(paivamaaralaskuri|\d+-paivaa-eteenpain|ikalaskuri|tuntilaskuri|vuosilomalaskuri|raskauslaskuri|kuukautislaskuri)$/],
  ["Moon phases", /\/kuun-vaiheet-\d{4}$/],
  ["Sunrise and sunset", /\/auringonlasku(-[a-z]+)?$/],
  ["Flag days", /\/liputuspaivat-\d{4}$/],
];
const KEY_PAGES = ["/", `/isanpaiva-${year}`, `/kelan-maksupaivat-${year}`, "/paivamaaralaskuri", `/kuun-vaiheet-${year}`, "/auringonlasku-helsinki"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const pct = (cur, prev) => (prev ? `${cur >= prev ? "+" : ""}${(((cur - prev) / prev) * 100).toFixed(1)}%` : "new");
const short = (url) => url.replace(SITE_URL, "") || "/";

// Each section: { title, rows: [[...cells]], head: [...], note, error }
const sections = [];
const alerts = [];

async function section(title, fn) {
  try {
    sections.push({ title, ...(await fn()) });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message || String(err);
    sections.push({ title, error: msg });
    // An access problem breaks every Search Console section the same way:
    // report it once, with the fix, instead of once per section.
    if (/credential|permission|forbidden|unauthori[sz]ed/i.test(msg)) {
      const access = `Search Console access failed (${msg}). Add the GCP_SA_KEY service account's client_email as an Owner in Search Console -> Settings -> Users and permissions.`;
      if (!alerts.includes(access)) alerts.push(access);
    } else {
      alerts.push(`${title}: ${msg}`);
    }
  }
}

let client;
async function gsc(url, data) {
  client ??= await getClient();
  const res = await client.request(data ? { url, method: "POST", data } : { url });
  return res.data;
}

const cur = { startDate: isoDateDaysAgo(9), endDate: isoDateDaysAgo(3) };
const prev = { startDate: isoDateDaysAgo(16), endDate: isoDateDaysAgo(10) };
const query = (range, extra = {}) =>
  gsc(`${API}/searchAnalytics/query`, { ...range, type: "web", dataState: "final", ...extra });

await section("Search traffic (last 7 finalized days vs the 7 before)", async () => {
  const [a, b] = await Promise.all([query(cur), query(prev)]);
  const x = a.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const y = b.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  if (y.clicks && x.clicks < y.clicks * 0.8) alerts.push(`Clicks fell ${pct(x.clicks, y.clicks)} week over week.`);
  return {
    head: ["Metric", "This week", "Previous week", "Change"],
    rows: [
      ["Clicks", fmt(x.clicks), fmt(y.clicks), pct(x.clicks, y.clicks)],
      ["Impressions", fmt(x.impressions), fmt(y.impressions), pct(x.impressions, y.impressions)],
      ["CTR", `${(x.ctr * 100).toFixed(2)}%`, `${(y.ctr * 100).toFixed(2)}%`, ""],
      ["Average position", fmt(x.position, 1), fmt(y.position, 1), y.position ? `${x.position <= y.position ? "better" : "worse"} by ${fmt(Math.abs(x.position - y.position), 1)}` : ""],
    ],
    note: `${cur.startDate} to ${cur.endDate} vs ${prev.startDate} to ${prev.endDate}.`,
  };
});

async function topBy(dimension, label) {
  const [a, b] = await Promise.all([
    query(cur, { dimensions: [dimension], rowLimit: 10 }),
    query(prev, { dimensions: [dimension], rowLimit: 250 }),
  ]);
  const before = new Map((b.rows || []).map((r) => [r.keys[0], r]));
  return {
    head: [label, "Clicks", "Impressions", "Position", "Clicks vs prev."],
    rows: (a.rows || []).map((r) => [
      dimension === "page" ? short(r.keys[0]) : r.keys[0],
      fmt(r.clicks),
      fmt(r.impressions),
      fmt(r.position, 1),
      pct(r.clicks, before.get(r.keys[0])?.clicks ?? 0),
    ]),
  };
}
await section("Top queries", () => topBy("query", "Query"));
await section("Top pages", () => topBy("page", "Page"));

await section("New page families", async () => {
  const [a, b] = await Promise.all([
    query(cur, { dimensions: ["page"], rowLimit: 5000 }),
    query(prev, { dimensions: ["page"], rowLimit: 5000 }),
  ]);
  const sum = (rows, re) =>
    (rows || []).filter((r) => re.test(r.keys[0])).reduce((s, r) => ({ c: s.c + r.clicks, i: s.i + r.impressions, n: s.n + 1 }), { c: 0, i: 0, n: 0 });
  return {
    head: ["Family", "Pages with impressions", "Clicks", "Impressions", "Impressions vs prev."],
    rows: FAMILIES.map(([name, re]) => {
      const x = sum(a.rows, re);
      const y = sum(b.rows, re);
      return [name, fmt(x.n), fmt(x.c), fmt(x.i), pct(x.i, y.i)];
    }),
  };
});

await section("Sitemaps", async () => {
  const data = await gsc(`${API}/sitemaps`);
  const rows = (data.sitemap || []).map((s) => {
    const web = (s.contents || []).find((c) => c.type === "web") || {};
    if (Number(s.errors) > 0) alerts.push(`Sitemap ${s.path} has ${s.errors} error(s).`);
    return [s.path.replace(SITE_URL, ""), s.lastSubmitted?.slice(0, 10) ?? "-", s.lastDownloaded?.slice(0, 10) ?? "-", s.isPending ? "pending" : "processed", fmt(web.submitted ?? 0), `${s.errors ?? 0} / ${s.warnings ?? 0}`];
  });
  return { head: ["Sitemap", "Last submitted", "Last read by Google", "State", "URLs submitted", "Errors / warnings"], rows };
});

await section("Indexing of key pages", async () => {
  const rows = [];
  for (const p of KEY_PAGES) {
    const data = await gsc("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      inspectionUrl: new URL(p, SITE_URL).href,
      siteUrl: SITE_PROPERTY,
      languageCode: "fi-FI",
    });
    const s = data.inspectionResult?.indexStatusResult ?? {};
    rows.push([p, s.verdict ?? "UNKNOWN", s.coverageState ?? "-", s.lastCrawlTime?.slice(0, 10) ?? "never"]);
  }
  return { head: ["Page", "Verdict", "Coverage", "Last crawl"], rows };
});

await section("Live site health", async () => {
  const rows = [];
  const get = async (u) => {
    const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 ViikkonroSeoReport/1.0", "Accept-Encoding": "gzip, deflate, br" }, signal: AbortSignal.timeout(20000) });
    return { status: res.status, cf: res.headers.get("cf-cache-status") ?? "-", text: res.ok ? await res.text() : "" };
  };
  const home = await get(`${SITE_URL}/`);
  rows.push(["/", home.status, home.cf]);
  // The main JS bundle must load, or no calculator works (see CLAUDE.md, Cloudflare).
  for (const asset of [...new Set(home.text.match(/\/assets\/[\w.-]+\.js/g) || [])]) {
    const r = await get(SITE_URL + asset);
    rows.push([asset, r.status, r.cf]);
    if (r.status !== 200) alerts.push(`JS bundle ${asset} returns ${r.status} (cf-cache-status ${r.cf}): purge it in Cloudflare.`);
  }
  for (const p of KEY_PAGES.slice(1)) {
    const r = await get(SITE_URL + p);
    rows.push([p, r.status, r.cf]);
    if (r.status !== 200) alerts.push(`${p} returns ${r.status}.`);
  }
  const sm = await get(`${SITE_URL}/sitemap.xml`);
  const count = (sm.text.match(/<loc>/g) || []).length;
  rows.push(["/sitemap.xml", sm.status, `${fmt(count)} URLs`]);
  return { head: ["URL", "Status", "Cloudflare / note"], rows };
});

await section("Backlinks (seo/backlinks.txt)", async () => {
  const list = readBacklinkList();
  if (!list.length) return { rows: [], note: "No backlinks listed yet. Add the pages that link to viikkonro.fi to seo/backlinks.txt (see the comments in that file)." };
  const results = await checkBacklinks(list);
  for (const r of results.filter((x) => !x.ok)) alerts.push(`Backlink lost: ${r.source} (${r.state}).`);
  return {
    head: ["Linking page", "State", "Anchor text"],
    rows: results.map((r) => [r.source, r.state, r.links.map((l) => l.text).filter(Boolean).join(" | ") || "-"]),
    note: `${results.filter((r) => r.ok).length}/${results.length} known backlinks present.`,
  };
});

// ---- Render ----
const today = new Date().toISOString().slice(0, 10);
const subject = `Viikkonro SEO report ${today}${alerts.length ? ` - ${alerts.length} alert(s)` : ""}`;

const md = [`# ${subject}`, ""];
if (alerts.length) md.push("## Alerts", "", ...alerts.map((a) => `- ${a}`), "");
for (const s of sections) {
  md.push(`## ${s.title}`, "");
  if (s.error) {
    md.push(`**Could not load:** ${s.error}`, "");
    continue;
  }
  if (s.rows?.length) {
    md.push(`| ${s.head.join(" | ")} |`, `| ${s.head.map(() => "---").join(" | ")} |`);
    for (const r of s.rows) md.push(`| ${r.map((c) => String(c).replace(/\|/g, "/")).join(" | ")} |`);
    md.push("");
  }
  if (s.note) md.push(s.note, "");
}

const table = (s) =>
  `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px"><tr>${s.head.map((h) => `<th align="left" style="border-bottom:2px solid #1f7a5c">${esc(h)}</th>`).join("")}</tr>${s.rows.map((r) => `<tr>${r.map((c) => `<td style="border-bottom:1px solid #ddd">${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#16302a;max-width:760px">
<h1 style="font-size:20px">${esc(subject)}</h1>
${alerts.length ? `<div style="background:#fff4e5;border-left:4px solid #e08a00;padding:10px 14px"><strong>Alerts</strong><ul>${alerts.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>` : `<p style="color:#1f7a5c"><strong>No alerts this week.</strong></p>`}
${sections
  .map((s) => `<h2 style="font-size:16px;margin-top:24px">${esc(s.title)}</h2>${s.error ? `<p style="color:#b00020"><strong>Could not load:</strong> ${esc(s.error)}</p>` : `${s.rows?.length ? table(s) : ""}${s.note ? `<p style="color:#555">${esc(s.note)}</p>` : ""}`}`)
  .join("\n")}
<p style="color:#888;font-size:12px;margin-top:30px">Generated by .github/workflows/weekly-seo-report.yml. Search Console data for ${SITE_PROPERTY}.</p>
</body></html>`;

fs.writeFileSync("seo-report.md", md.join("\n"));
fs.writeFileSync("seo-report.html", html);
fs.writeFileSync("seo-report-subject.txt", subject);
console.log(md.join("\n"));
