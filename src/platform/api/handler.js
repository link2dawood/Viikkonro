import { API_RESOURCES, ApiInputError, calendarApiData } from "./calendar.js";

export function apiReply(status, body, requestId, extra = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff", "X-Request-Id": requestId, ...extra } });
}

// Dependencies are injected for real HTTP tests; production has no memory limiter fallback.
export async function handleCalendarApi(request, { consume, requestId, monitor = () => {} }) {
  const started = performance.now();
  let resource = "unknown", status = 500;
  const finish = (code, body, extra) => { status = code; return apiReply(code, body, requestId, extra); };
  const fail = (code, error, extra) => finish(code, { version: "v1", error: { code: error, requestId } }, extra);
  try {
    const url = new URL(request.url);
    const match = /^\/api\/v1\/([a-z-]+)$/.exec(url.pathname);
    if (!match || !API_RESOURCES.includes(match[1])) return fail(404, "not_found");
    resource = match[1];
    if (request.method !== "GET") return fail(405, "method_not_allowed", { Allow: "GET" });
    if (url.search.length > 1024) return fail(400, "invalid_parameters");
    const auth = request.headers.get("authorization") ?? "";
    if (!/^Bearer vnr_[a-f0-9]{64}$/.test(auth)) return fail(401, "invalid_api_key");
    // Validate before charging quota, but return no data until authorization succeeds.
    let data;
    try { data = calendarApiData(resource, url.searchParams); }
    catch (error) { if (error instanceof ApiInputError) return fail(400, "invalid_parameters"); throw error; }
    const usage = await consume(auth.slice(7), resource);
    if (usage.status === "invalid_key") return fail(401, "invalid_api_key");
    if (["rate_limit", "usage_limit"].includes(usage.status)) return fail(429, usage.status, { "Retry-After": String(usage.retryAfter) });
    if (usage.status !== "ok") throw new Error("Invalid limiter response");
    return finish(200, { version: "v1", timezone: "Europe/Helsinki", data }, { "X-RateLimit-Limit": String(usage.minuteLimit), "X-RateLimit-Remaining": String(usage.minuteRemaining), "X-Usage-Limit": String(usage.monthLimit), "X-Usage-Remaining": String(usage.monthRemaining) });
  } catch { return fail(503, "unavailable", { "Retry-After": "30" }); }
  finally {
    // Never log headers, keys, query strings, IPs or response data.
    try { monitor({ requestId, resource, status, durationMs: Math.round(performance.now() - started) }); } catch { /* Monitoring cannot affect authorization. */ }
  }
}
