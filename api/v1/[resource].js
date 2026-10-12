import { createHash, randomUUID } from "node:crypto";
import { handleCalendarApi } from "../../src/platform/api/handler.js";

export function apiUsageStore(env, fetcher = fetch) {
  const url = new URL(env.BUSINESS_API_SUPABASE_URL ?? "https://invalid.invalid");
  const secret = env.BUSINESS_API_SUPABASE_SECRET;
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || url.pathname !== "/" || url.search || url.hash || url.username || url.password || !secret) throw new Error("API backend unavailable");
  if (!secret.startsWith("sb_secret_")) {
    try { if (JSON.parse(Buffer.from(secret.split(".")[1], "base64url").toString()).role !== "service_role") throw new Error(); }
    catch { throw new Error("Server secret required"); }
  }
  // Secret credentials remain exclusively in this server function.
  return async (key, endpoint) => {
    const response = await fetcher(new URL("/rest/v1/rpc/business_api_consume", url), { method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(5000),
      headers: { apikey: secret, ...(secret.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${secret}` }), "Content-Type": "application/json" },
      body: JSON.stringify({ p_hash: createHash("sha256").update(key).digest("hex"), p_endpoint: endpoint }) });
    if (!response.ok) throw new Error("API backend unavailable");
    return response.json();
  };
}
export default { async fetch(request) {
  const requestId = randomUUID();
  return handleCalendarApi(request, { requestId, consume: async (...args) => apiUsageStore(process.env)(...args), monitor: (entry) => console.info(JSON.stringify({ event: "business_api_request", ...entry })) });
} };
