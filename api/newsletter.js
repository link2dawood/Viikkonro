// Private write endpoint; never include this module in the client bundle.
export default {
  async fetch(request) {
    return handleSignup(request, process.env);
  },
};

function reply(status, body) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "no-store", "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow",
    ...(status === 405 ? { Allow: "POST" } : {}),
  } });
}

export async function handleSignup(request, env, fetcher = fetch) {
  if (request.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const origin = env.SITE_ORIGIN || "https://viikkonro.fi";
  const listId = Number(env.BREVO_NEWSLETTER_LIST_ID);
  const templateId = Number(env.BREVO_DOI_TEMPLATE_ID);
  let site;
  try { site = new URL(origin); } catch { return reply(503, { error: "unavailable" }); }
  if (!env.BREVO_API_KEY || !env.TURNSTILE_SECRET_KEY ||
      !Number.isSafeInteger(listId) || listId < 1 ||
      !Number.isSafeInteger(templateId) || templateId < 1) {
    return reply(503, { error: "unavailable" });
  }
  if (request.headers.get("origin") !== site.origin) return reply(403, { error: "forbidden" });
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return reply(415, { error: "json_required" });
  }

  // Bound actual bytes as well as declared size, including chunked requests.
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: "invalid_request" });
    const chunks = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return reply(413, { error: "too_large" }); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return reply(400, { error: "invalid_request" }); }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (body?.website || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      body?.consent !== true || body?.consentVersion !== "weekly-fi-v1" ||
      body?.topic !== "weekly-week-and-finnish-holidays" || body?.language !== "fi" ||
      typeof body?.token !== "string" || !body.token || body.token.length > 2048) {
    return reply(400, { error: "invalid_request" });
  }

  try {
    const verification = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: body.token }),
      signal: AbortSignal.timeout(4000),
    });
    if (!verification.ok) return reply(503, { error: "unavailable" });
    const challenge = await verification.json();
    if (challenge.success !== true || challenge.hostname !== site.hostname || challenge.action !== "newsletter") {
      return reply(400, { error: "verification_failed" });
    }

    const result = await fetcher("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": env.BREVO_API_KEY },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        email, includeListIds: [listId], templateId,
        redirectionUrl: new URL("/", site).href,
        attributes: {
          NEWSLETTER_CONSENT_VERSION: "weekly-fi-v1",
          NEWSLETTER_REQUESTED_AT: new Date().toISOString(),
          NEWSLETTER_LANGUAGE: "fi",
        },
      }),
    });
    // Never expose provider messages, credentials, or contact details.
    if (!result.ok) return reply(result.status === 429 ? 429 : 502, { error: "signup_unavailable" });
    return reply(202, { status: "confirmation_required" });
  } catch {
    return reply(503, { error: "unavailable" });
  }
}
