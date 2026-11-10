// Private write endpoint; never include this module in the client bundle.
export default {
  async fetch(request) {
    return handleSignup(request, process.env);
  },
};

function reply(status, body) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...(status === 405 ? { Allow: "POST" } : {}),
    },
  });
}

function computeIsoWeek(date = new Date()) {
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNum + 3);
  return Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7) + 1;
}

export async function handleSignup(request, env, fetcher = fetch) {
  if (request.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const origin = env.SITE_ORIGIN || "https://viikkonro.fi";
  let site;
  try { site = new URL(origin); } catch { return reply(503, { error: "unavailable" }); }

  const hasBrevo = Boolean(env.BREVO_API_KEY);
  const hasMailjet = Boolean(env.MAILJET_API_KEY && env.MAILJET_SECRET_KEY);

  if (!hasBrevo && !hasMailjet) {
    return reply(503, { error: "unavailable" });
  }

  // If Brevo is configured, validate Brevo-specific prerequisites
  if (hasBrevo) {
    const listId = Number(env.BREVO_NEWSLETTER_LIST_ID);
    const templateId = Number(env.BREVO_DOI_TEMPLATE_ID);
    if (!env.TURNSTILE_SECRET_KEY || !Number.isSafeInteger(listId) || listId < 1 ||
        !Number.isSafeInteger(templateId) || templateId < 1) {
      return reply(503, { error: "unavailable" });
    }
  }

  const reqOrigin = request.headers.get("origin");
  if (reqOrigin && reqOrigin !== site.origin && !reqOrigin.startsWith("http://localhost:")) {
    return reply(403, { error: "forbidden" });
  }

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
      body?.topic !== "weekly-week-and-finnish-holidays" || body?.language !== "fi") {
    return reply(400, { error: "invalid_request" });
  }

  // Turnstile check: required when Brevo or TURNSTILE_SECRET_KEY is configured
  if (hasBrevo || env.TURNSTILE_SECRET_KEY) {
    if (typeof body?.token !== "string" || !body.token || body.token.length > 2048) {
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
    } catch {
      return reply(503, { error: "unavailable" });
    }
  }

  if (hasBrevo) {
    try {
      const listId = Number(env.BREVO_NEWSLETTER_LIST_ID);
      const templateId = Number(env.BREVO_DOI_TEMPLATE_ID);
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
      if (!result.ok) return reply(result.status === 429 ? 429 : 502, { error: "signup_unavailable" });
      return reply(202, { status: "confirmation_required" });
    } catch {
      return reply(503, { error: "unavailable" });
    }
  }

  // Mailjet flow
  try {
    const listId = Number(env.MAILJET_NEWSLETTER_LIST_ID) || 10712227;
    const auth = Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`).toString("base64");
    const addContactRes = await fetcher(`https://api.mailjet.com/v3/REST/contactslist/${listId}/managecontact`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ Action: "addnoforce", Email: email }),
    });

    if (!addContactRes.ok && addContactRes.status !== 200 && addContactRes.status !== 201) {
      return reply(addContactRes.status === 429 ? 429 : 502, { error: "signup_unavailable" });
    }

    // Send immediate welcome email via Mailjet
    const fromEmail = env.MAILJET_FROM_EMAIL || "hi@viikkonro.fi";
    const currentWeek = computeIsoWeek();
    await fetcher("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        Messages: [{
          From: { Email: fromEmail, Name: "Viikkonro" },
          To: [{ Email: email }],
          Subject: "Tervetuloa Viikkonron viikkokirjeen tilaajaksi!",
          TextPart: `Hei!\n\nKiitos Viikkonron viikkokirjeen tilauksesta.\n\nSaat jatkossa sähköpostiisi tiedon aina kun viikkonumero vaihtuu (maanantaisin) sekä ajankohtaiset kalenterivinkit, arkipyhämuistutukset ja erikoistarjoukset.\n\nTällä hetkellä on viikko ${currentWeek}.\n\nVoit tarkistaa kuluvan viikon, vuoden kalenterit ja laskurit milloin tahansa osoitteessa:\nhttps://viikkonro.fi\n\nJos haluat perua tilauksen tai et tilannut tätä viestiä, voit tehdä sen vastaamalla suoraan tähän sähköpostiin.\n\nYstävällisin terveisin,\nViikkonro.fi`,
        }],
      }),
    });

    return reply(200, { status: "subscribed", email });
  } catch {
    return reply(503, { error: "unavailable" });
  }
}
