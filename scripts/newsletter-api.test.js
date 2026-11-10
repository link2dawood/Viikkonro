import { describe, expect, it, vi } from "vitest";
import { handleSignup } from "../api/newsletter.js";

const env = {
  SITE_ORIGIN: "https://viikkonro.fi", BREVO_API_KEY: "private-test-key",
  BREVO_NEWSLETTER_LIST_ID: "12", BREVO_DOI_TEMPLATE_ID: "34", TURNSTILE_SECRET_KEY: "secret-test",
};
const data = {
  email: "reader@example.com", consent: true, consentVersion: "weekly-fi-v1",
  topic: "weekly-week-and-finnish-holidays", language: "fi", token: "valid-token",
};
function request(body = data, headers = {}, method = "POST") {
  return new Request("https://viikkonro.fi/api/newsletter", {
    method, headers: { origin: env.SITE_ORIGIN, "content-type": "application/json", ...headers },
    ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  });
}
function provider(challenge = {}) {
  return vi.fn().mockResolvedValueOnce(Response.json({ success: true, hostname: "viikkonro.fi", action: "newsletter", ...challenge }))
    .mockResolvedValueOnce(new Response(null, { status: 201 }));
}

describe("Brevo newsletter endpoint", () => {
  it("validates the challenge before requesting DOI, using server-owned list and consent metadata", async () => {
    const fetcher = provider();
    const result = await handleSignup(request({ ...data, listId: 999 }), env, fetcher);
    expect(result.status).toBe(202);
    expect(await result.json()).toEqual({ status: "confirmation_required" });
    expect(result.headers.get("cache-control")).toBe("no-store");
    const [url, options] = fetcher.mock.calls[1];
    expect(url).toBe("https://api.brevo.com/v3/contacts/doubleOptinConfirmation");
    expect(options.headers["api-key"]).toBe(env.BREVO_API_KEY);
    const body = JSON.parse(options.body);
    expect(body.includeListIds).toEqual([12]);
    expect(body.templateId).toBe(34);
    expect(body.redirectionUrl).toBe("https://viikkonro.fi/");
    expect(body.attributes.NEWSLETTER_CONSENT_VERSION).toBe("weekly-fi-v1");
    expect(Number.isNaN(Date.parse(body.attributes.NEWSLETTER_REQUESTED_AT))).toBe(false);
  });
  it.each([
    null, "{", { ...data, consent: false }, { ...data, consentVersion: "unknown" },
    { ...data, token: "" }, { ...data, token: "a".repeat(2049) },
    { ...data, email: "not-an-email" }, { ...data, website: "spam" }, { ...data, language: "en" },
  ])("rejects invalid input without calling external services", async (body) => {
    const fetcher = vi.fn();
    expect((await handleSignup(request(body), env, fetcher)).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("limits actual body bytes", async () => {
    expect((await handleSignup(request("a".repeat(8193)), env, vi.fn())).status).toBe(413);
  });
  it("rejects foreign origins, unexpected media types and GET", async () => {
    const fetcher = vi.fn();
    expect((await handleSignup(request(data, { origin: "https://attacker.test" }), env, fetcher)).status).toBe(403);
    expect((await handleSignup(request(data, { "content-type": "text/plain" }), env, fetcher)).status).toBe(415);
    expect((await handleSignup(request(data, {}, "GET"), env, fetcher)).status).toBe(405);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([{ success: false }, { hostname: "attacker.test" }, { action: "other" }])("rejects invalid challenges", async (challenge) => {
    const fetcher = provider(challenge);
    expect((await handleSignup(request(), env, fetcher)).status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each(["BREVO_API_KEY", "BREVO_NEWSLETTER_LIST_ID", "BREVO_DOI_TEMPLATE_ID", "TURNSTILE_SECRET_KEY"])("fails closed without %s", async (key) => {
    const fetcher = vi.fn();
    expect((await handleSignup(request(), { ...env, [key]: "" }, fetcher)).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([400, 401, 429, 500])("does not report provider failure %i as success or leak details", async (status) => {
    const fetcher = provider();
    fetcher.mockReset().mockResolvedValueOnce(Response.json({ success: true, hostname: "viikkonro.fi", action: "newsletter" }))
      .mockResolvedValueOnce(Response.json({ message: "private provider details" }, { status }));
    const result = await handleSignup(request(), env, fetcher);
    expect(result.status).toBe(status === 429 ? 429 : 502);
    expect(await result.text()).not.toContain("private");
  });
  it("handles network failures without exposing secrets", async () => {
    const result = await handleSignup(request(), env, async () => { throw Error(env.BREVO_API_KEY); });
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain(env.BREVO_API_KEY);
  });
});

describe("Mailjet newsletter endpoint", () => {
  const mailjetEnv = {
    SITE_ORIGIN: "https://viikkonro.fi",
    MAILJET_API_KEY: "mj-test-key",
    MAILJET_SECRET_KEY: "mj-secret-key",
    MAILJET_NEWSLETTER_LIST_ID: "10712227",
    MAILJET_FROM_EMAIL: "hi@viikkonro.fi",
  };

  it("subscribes contact to Mailjet list and sends welcome email", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Count: 1 }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ Messages: [{ Status: "success" }] }), { status: 200 }));

    const res = await handleSignup(request({ email: "newuser@example.com", consent: true, consentVersion: "weekly-fi-v1", topic: "weekly-week-and-finnish-holidays", language: "fi" }), mailjetEnv, fetcher);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "subscribed", email: "newuser@example.com" });
    expect(fetcher).toHaveBeenCalledTimes(2);

    const [addCallUrl, addCallOptions] = fetcher.mock.calls[0];
    expect(addCallUrl).toContain("/v3/REST/contactslist/10712227/managecontact");
    expect(JSON.parse(addCallOptions.body)).toEqual({ Action: "addnoforce", Email: "newuser@example.com" });

    const [sendCallUrl, sendCallOptions] = fetcher.mock.calls[1];
    expect(sendCallUrl).toBe("https://api.mailjet.com/v3.1/send");
    const sendBody = JSON.parse(sendCallOptions.body);
    expect(sendBody.Messages[0].To[0].Email).toBe("newuser@example.com");
    expect(sendBody.Messages[0].Subject).toContain("Tervetuloa Viikkonron viikkokirjeen tilaajaksi");
  });

  it("returns 502 when Mailjet list addition fails", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ErrorMessage: "Service error" }), { status: 500 }));
    const res = await handleSignup(request({ email: "error@example.com", consent: true, consentVersion: "weekly-fi-v1", topic: "weekly-week-and-finnish-holidays", language: "fi" }), mailjetEnv, fetcher);
    expect(res.status).toBe(502);
  });
});
