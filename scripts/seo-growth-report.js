#!/usr/bin/env node
// Read-only Search Console comparison for the SEO growth changes. No sitemap
// submissions, indexing requests, email, or changes to the live site.
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { API, SITE_PROPERTY, getClient, isoDateDaysAgo } from "../src/gscClient.js";

export const QUERY_PATTERN = "viikkonumero|viikkonumerot|mikä viikko|viikko [0-9]+|kalenteri|työpäivälaskuri|raskauslaskuri|auringonlasku|nimipäivä|parillinen|pariton|parilliset|parittomat";
const ROW_LIMIT = 25000;
const MAX_PAGES = 10;

export function comparisonWindows(endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Use --end-date YYYY-MM-DD.");
  const end = new Date(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(end.getTime()) || end.toISOString().slice(0, 10) !== endDate) {
    throw new Error("Invalid end date.");
  }
  const offset = (days) => new Date(end.getTime() + days * 86400000).toISOString().slice(0, 10);
  return {
    current: { startDate: offset(-27), endDate },
    previous: { startDate: offset(-55), endDate: offset(-28) },
  };
}

export function growthRequest(range, startRow = 0) {
  return {
    ...range,
    type: "web",
    dataState: "final",
    dimensions: ["query", "page", "device"],
    dimensionFilterGroups: [{ groupType: "and", filters: [
      { dimension: "country", operator: "equals", expression: "fin" },
      { dimension: "query", operator: "includingRegex", expression: QUERY_PATTERN },
    ] }],
    rowLimit: ROW_LIMIT,
    startRow,
  };
}

// Keep query and device separate when comparing PDF/HTML rows. Do not call
// these site-wide totals: query anonymization and API limits omit some data.
export function summarizeRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const [query, page, device] = row.keys;
    const format = new URL(page).pathname.toLowerCase().endsWith(".pdf") ? "pdf" : "html";
    const key = JSON.stringify([query, device, format]);
    const group = groups.get(key) || { query, device, format, clicks: 0, impressions: 0, weightedPosition: 0 };
    group.clicks += row.clicks;
    group.impressions += row.impressions;
    group.weightedPosition += row.position * row.impressions;
    groups.set(key, group);
  }
  return [...groups.values()].map(({ weightedPosition, ...group }) => ({
    ...group,
    ctr: group.impressions ? group.clicks / group.impressions : null,
    position: group.impressions ? weightedPosition / group.impressions : null,
  })).sort((a, b) => b.impressions - a.impressions);
}

export async function fetchRows(request, range) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await request(growthRequest(range, page * ROW_LIMIT));
    const batch = result.rows || [];
    rows.push(...batch);
    if (batch.length < ROW_LIMIT) return { rows, paginationLimitReached: false };
  }
  return { rows, paginationLimitReached: true };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: npm run report:seo-growth -- [--end-date YYYY-MM-DD] [--output path.json]\nCompares two adjacent 28-day windows, Finnish web searches, finalized data.\nDefaults: end date three days ago; output seo-growth-report.json.\nUses existing Search Console credentials. Read-only; sends no messages.");
    return;
  }
  let endDate = isoDateDaysAgo(3);
  let output = "seo-growth-report.json";
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i + 1] || !["--end-date", "--output"].includes(args[i])) throw new Error("Unknown or incomplete option. Use --help.");
    if (args[i] === "--end-date") endDate = args[i + 1];
    else output = args[i + 1];
  }
  const windows = comparisonWindows(endDate);
  const client = await getClient();
  const request = async (data) => (await client.request({ url: `${API}/searchAnalytics/query`, method: "POST", data })).data;
  const [current, previous] = await Promise.all([
    fetchRows(request, windows.current), fetchRows(request, windows.previous),
  ]);
  const report = {
    generatedAt: new Date().toISOString(), property: SITE_PROPERTY, country: "fin",
    windows,
    limitations: [
      "Returned rows are not complete site traffic: anonymized queries and Search Console API limits omit data.",
      "Average position is not a fixed rank. A missing row is not proof of zero impressions or exclusion from search.",
      "CTR is clicks divided by impressions; compare the same query, device, landing page, and time period.",
      "PDF/HTML comparisons reflect reported search performance, not engagement or proof of cannibalization.",
      "Deployment timing, seasonality and concurrent changes prevent causal attribution from this report alone.",
    ],
    current: { ...current, byQueryDeviceFormat: summarizeRows(current.rows) },
    previous: { ...previous, byQueryDeviceFormat: summarizeRows(previous.rows) },
  };
  // Exclusive creation protects an earlier baseline from accidental overwrite.
  await fs.writeFile(output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.log(`Saved ${output}: ${current.rows.length} current and ${previous.rows.length} previous query/page/device rows.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Never log a Google request object: it can contain authorization headers.
    console.error(error.code === "EEXIST"
      ? "Output already exists. Choose a new --output path to preserve the baseline."
      : /default credentials|could not load.*credentials/i.test(error.message || "")
      ? "Search Console credentials are unavailable. Configure GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON with an account that can read this property. No report was generated."
      : "Report could not be generated. Check date/options, Search Console credentials and read access, and output directory. No report or live-site change was made.");
    process.exitCode = 1;
  });
}
