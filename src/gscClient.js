// Shared Search Console API client for the plain-Node scripts (src/cli.js,
// scripts/seo-report.js). Not part of the Vite app bundle.
//
// Auth: a GCP service-account JSON key, provided as GOOGLE_APPLICATION_CREDENTIALS_JSON
// (the raw JSON string, the standard way to pass a service-account key through a CI
// secret without writing a file to disk). Falls back to GOOGLE_APPLICATION_CREDENTIALS
// (a file path) for local use, via google-auth-library's own default resolution.
// The service account must be added in Search Console (Settings -> Users and
// permissions) as an Owner of the domain property: creating the key alone
// grants nothing.

import { GoogleAuth } from "google-auth-library";
import { SITE_URL } from "./data/seo.js";

export { SITE_URL };
export const SITE_PROPERTY = `sc-domain:${new URL(SITE_URL).hostname}`;
// webmasters (not the newer searchconsole API) is what still exposes the
// sites.get permission check, sitemaps and search analytics used here.
const SCOPES = ["https://www.googleapis.com/auth/webmasters"];
export const FULL_ACCESS_LEVELS = new Set(["siteOwner", "siteFullUser"]);
export const API = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}`;

function credentialsFromEnv() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) return {};
  try {
    return { credentials: JSON.parse(raw) };
  } catch {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON is set but isn't valid JSON: paste the whole service-account key file contents verbatim.",
    );
  }
}

export async function getClient() {
  const auth = new GoogleAuth({ ...credentialsFromEnv(), scopes: SCOPES });
  return auth.getClient();
}

export function isoDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
