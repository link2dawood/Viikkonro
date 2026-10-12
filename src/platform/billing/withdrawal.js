import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { validEmail } from "./purchaseRecord.js";

const reply = (status, body) => Response.json(body, { status, headers: {
  "Cache-Control":"private, no-store", "X-Robots-Tag":"noindex, nofollow",
  "Referrer-Policy":"no-referrer", "X-Content-Type-Options":"nosniff",
  ...(status === 405 ? { Allow:"POST" } : {}),
} });
const orderId = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// This receives a cancellation notice, not permission to move money. An
// operator reviews it and administers an eligible refund through Polar.
export async function handleWithdrawal(request, { origin, provider, mailer, consume, now = () => new Date().toISOString() }) {
  if (request.method !== "POST") return reply(405,{ error:"method_not_allowed" });
  if (request.headers.get("origin") !== origin) return reply(403,{ error:"forbidden" });
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") ?? "")) return reply(415,{ error:"json_required" });
  try {
    if (!await consume()) return reply(429,{ error:"rate_limited" });
    if (Number(request.headers.get("content-length")) > 8192) return reply(413,{ error:"too_large" });
    const reader=request.body?.getReader();
    if (!reader) return reply(400,{ error:"invalid_request" });
    let size=0;const chunks=[];
    for (;;) {
      const {value,done}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>8192){await reader.cancel();return reply(413,{ error:"too_large" });}
      chunks.push(Buffer.from(value));
    }
    let body;
    try { body=JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return reply(400,{ error:"invalid_request" }); }
    if (!body || Array.isArray(body) || typeof body !== "object" ||
      Object.keys(body).some(key=>!["name","email","orderId","confirmed"].includes(key)) ||
      typeof body.name !== "string" || !body.name.trim() || body.name.length > 160 || Array.from(body.name).some(char=>char.charCodeAt(0)<32 || char.charCodeAt(0)===127) ||
      !validEmail(body.email) || /[<>,;":]/.test(body.email) || !orderId(body.orderId) || body.confirmed !== true) {
      return reply(400,{ error:"invalid_request" });
    }
    // Reconcile the actual paid order, including its tenant/product. The
    // recipient must match that order, preventing an open email relay. No
    // active export cookie is needed: rights can outlive the calendar year.
    const purchase=await provider.purchase(body.orderId.toLowerCase());
    if (!purchase || purchase.record.email.toLowerCase() !== body.email.toLowerCase()) {
      return reply(400,{ error:"order_not_verified" });
    }
    const notice={ id:randomUUID(),name:body.name.trim(),orderId:purchase.record.order_id,
      email:purchase.record.email,year:purchase.record.calendar_year,receivedAt:now() };
    await mailer.sendWithdrawal(notice);
    return reply(202,{ id:notice.id,receivedAt:notice.receivedAt });
  } catch { return reply(503,{ error:"unavailable" }); }
}

export function createWithdrawalMailer(env, { fetchImpl = fetch } = {}) {
  return { async sendWithdrawal(notice) {
    const sender=env.MAILJET_FROM_EMAIL,owner=env.BILLING_OWNER_EMAIL;
    if (!env.MAILJET_API_KEY || !env.MAILJET_SECRET_KEY || !validEmail(sender) || !validEmail(owner) || !validEmail(notice.email)) throw new Error("unavailable");
    const response=await fetchImpl("https://api.mailjet.com/v3.1/send",{
      method:"POST",redirect:"error",signal:AbortSignal.timeout(15000),
      headers:{ Authorization:`Basic ${Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`).toString("base64")}`,"Content-Type":"application/json" },
      body:JSON.stringify({Messages:[{
        From:{Email:sender,Name:"Viikkonro"},To:[{Email:notice.email}],
        ...(owner.toLowerCase() !== notice.email.toLowerCase() ? {Bcc:[{Email:owner}]} : {}),
        ReplyTo:{Email:sender},Subject:"Viikkonro: peruuttamisilmoitus vastaanotettu",
        TextPart:`Peruuttamisilmoituksesi on vastaanotettu.\n\nNimi: ${notice.name}\nTuote: Viikkonro Yrityskalenteri ${notice.year}\nPolarin tilaustunniste: ${notice.orderId}\nVastaanotettu (UTC): ${notice.receivedAt}\nIlmoituksen tunniste: ${notice.id}\n\nOlet ilmoittanut peruuttavasi tämän ostoksen. Tämä viesti vahvistaa ilmoituksen vastaanottamisen. Se ei tarkoita, että maksu olisi jo palautettu. Käsittelemme pyynnön palautusehtojen ja sovellettavien oikeuksien mukaisesti.\n\nPalautusehdot: https://viikkonro.fi/palautusehdot\nAsiakaspalvelu: hi@viikkonro.fi\n\nSäilytä tämä vahvistus.`,
        CustomID:`withdrawal-${notice.id}`,TrackOpens:"disabled",TrackClicks:"disabled",
      }]}),
    });
    if (!response.ok) throw new Error("unavailable");
    const result=await response.json();
    if (result.Messages?.length !== 1 || result.Messages[0].Status !== "success" || !result.Messages[0].To?.[0]?.MessageUUID) throw new Error("unavailable");
  } };
}
