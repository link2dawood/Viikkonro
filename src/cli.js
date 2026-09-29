#!/usr/bin/env node
// Shared CLI for Search Console tasks: `check` (F-07 — verifies the service
// account actually has Full access to the domain property) and
// `submit-sitemap` (F-08 — submits sitemap.xml after a deploy).
//
// Plain Node, not part of the Vite app bundle (nothing here is imported by
// src/main.jsx or src/entry-server.jsx), so it can use Node-only packages
// like google-auth-library without affecting the client bundle.
//
// Auth and the API client live in gscClient.js, shared with scripts/seo-report.js.

import {
  API,
  FULL_ACCESS_LEVELS,
  SITE_PROPERTY,
  SITE_URL,
  getClient,
  isoDateDaysAgo,
} from "./gscClient.js";

// Which service account the key belongs to (client_email is an identifier,
// not a credential): the address to add in Search Console.
async function whoami() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.");
  const key = JSON.parse(raw);
  console.log(`Service account: ${key.client_email}`);
  console.log(`GCP project:     ${key.project_id}`);
  console.log(`Key type:        ${key.type}`);
}

// Every Search Console property this service account can see, with its
// permission level. Empty = it was never added as a user anywhere.
async function sites() {
  await whoami();
  const client = await getClient();
  const res = await client.request({ url: "https://www.googleapis.com/webmasters/v3/sites" });
  const entries = res.data.siteEntry || [];
  console.log(`
Properties visible to this account (${entries.length}):`);
  for (const s of entries) console.log(`  ${s.siteUrl}  ->  ${s.permissionLevel}`);
  if (!entries.length) console.log("  none: add the service account above as a user in Search Console.");
  const target = entries.find((s) => s.siteUrl === SITE_PROPERTY);
  console.log(target ? `
${SITE_PROPERTY} is visible with ${target.permissionLevel}.` : `
${SITE_PROPERTY} is NOT visible to this account.`);
}

async function check() {
  const client = await getClient();
  const res = await client.request({ url: API });
  const { permissionLevel, siteUrl } = res.data;

  console.log(`Site:             ${siteUrl}`);
  console.log(`Permission level: ${permissionLevel}`);

  if (!FULL_ACCESS_LEVELS.has(permissionLevel)) {
    console.error(
      `\nFAIL: service account does not have full access to ${SITE_PROPERTY} (got "${permissionLevel}").\n` +
        "Add it inside Search Console under Settings -> Users and permissions with Full access — " +
        "creating the key alone does nothing.",
    );
    process.exit(1);
  }
  console.log("\nOK");
}

async function submitSitemap() {
  const client = await getClient();
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const url = `${API}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  await client.request({ url, method: "PUT" });
  console.log(`Submitted ${sitemapUrl} to Search Console for ${SITE_PROPERTY}.`);
}

async function inspect() {
  const year = new Date().getFullYear();
  const requested = process.argv.slice(3);
  const paths = requested.length
    ? requested
    : [
        "/",
        "/ukk",
        `/kalenteri-${year}`,
        `/vuosi-${year}`,
        "/mika-on-viikkonumero",
        "/en",
      ];
  const client = await getClient();

  for (const pathOrUrl of paths) {
    const inspectionUrl = new URL(pathOrUrl, SITE_URL);
    if (inspectionUrl.origin !== new URL(SITE_URL).origin) {
      throw new Error(`Refusing to inspect an URL outside ${SITE_URL}: ${inspectionUrl}`);
    }

    const res = await client.request({
      url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      method: "POST",
      data: {
        inspectionUrl: inspectionUrl.href,
        siteUrl: SITE_PROPERTY,
        languageCode: "fi-FI",
      },
    });
    const status = res.data.inspectionResult?.indexStatusResult ?? {};

    console.log(`\n${inspectionUrl.href}`);
    console.log(`  Verdict:          ${status.verdict ?? "UNKNOWN"}`);
    console.log(`  Coverage:         ${status.coverageState ?? "Unavailable"}`);
    console.log(`  Indexing:         ${status.indexingState ?? "Unavailable"}`);
    console.log(`  Fetch:            ${status.pageFetchState ?? "Unavailable"}`);
    console.log(`  Robots:           ${status.robotsTxtState ?? "Unavailable"}`);
    console.log(`  Last crawl:       ${status.lastCrawlTime ?? "Never/unknown"}`);
    console.log(`  Declared canon.:  ${status.userCanonical ?? "Unavailable"}`);
    console.log(`  Google canon.:    ${status.googleCanonical ?? "Unavailable"}`);
    console.log(`  Known sitemaps:   ${(status.sitemap ?? []).join(", ") || "None reported"}`);
  }
}

async function traffic() {
  const client = await getClient();
  const impressionsMin = Number(process.env.GSC_IMPRESSIONS_MIN || 3500);
  const impressionsMax = Number(process.env.GSC_IMPRESSIONS_MAX || 5500);
  const clicksMin = Number(process.env.GSC_CLICKS_MIN || 30);
  const url = `${API}/searchAnalytics/query`;

  // Search Console normally finalizes data after 2–3 days. Query a wider
  // finalized window, then evaluate the latest seven rows actually returned
  // instead of treating a still-processing recent date as a traffic collapse.
  const res = await client.request({
    url,
    method: "POST",
    data: {
      startDate: isoDateDaysAgo(14),
      endDate: isoDateDaysAgo(3),
      dimensions: ["date"],
      type: "web",
      aggregationType: "byProperty",
      dataState: "final",
      rowLimit: 20,
    },
  });

  const rows = (res.data.rows || []).slice(-7);
  if (rows.length < 7) {
    throw new Error(
      `Search Console returned only ${rows.length} finalized daily row(s); need 7 before evaluating stability.`,
    );
  }

  console.log(
    `Target: ${impressionsMin}–${impressionsMax} impressions/day; at least ${clicksMin} clicks/day`,
  );
  console.log("Date        Clicks  Impressions  CTR     Position  Status");

  const failures = [];
  for (const row of rows) {
    const date = row.keys[0];
    const impressionOk =
      row.impressions >= impressionsMin && row.impressions <= impressionsMax;
    const clickOk = row.clicks >= clicksMin;
    const status = impressionOk && clickOk ? "OK" : "OUTSIDE TARGET";
    console.log(
      `${date}  ${String(Math.round(row.clicks)).padStart(6)}  ${String(Math.round(row.impressions)).padStart(11)}  ${(row.ctr * 100).toFixed(2).padStart(5)}%  ${row.position.toFixed(1).padStart(8)}  ${status}`,
    );
    if (!impressionOk) {
      failures.push(
        `${date}: ${Math.round(row.impressions)} impressions (target ${impressionsMin}–${impressionsMax})`,
      );
    }
    if (!clickOk) {
      failures.push(
        `${date}: ${Math.round(row.clicks)} clicks (minimum ${clicksMin})`,
      );
    }
  }

  const totals = rows.reduce(
    (sum, row) => ({
      clicks: sum.clicks + row.clicks,
      impressions: sum.impressions + row.impressions,
    }),
    { clicks: 0, impressions: 0 },
  );
  console.log(
    `\n7-day average: ${(totals.clicks / rows.length).toFixed(1)} clicks, ${(totals.impressions / rows.length).toFixed(0)} impressions`,
  );

  if (failures.length) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    process.exit(1);
  }
  console.log("\nOK — the latest seven finalized days meet the traffic gate.");
}

const commands = { check, inspect, traffic, whoami, sites, "submit-sitemap": submitSitemap };
const [, , commandName] = process.argv;
const run = commands[commandName];

if (!run) {
  console.error(`Usage: node src/cli.js <${Object.keys(commands).join("|")}>`);
  process.exit(1);
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
