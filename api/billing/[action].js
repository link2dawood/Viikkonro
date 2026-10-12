import { createHmac } from "node:crypto";
import { handleCommerce } from "../../src/platform/billing/http.js";
import { createPolarProvider, polarConfig } from "../../src/platform/billing/polar.js";
import { createPurchaseStore } from "../../src/platform/billing/purchaseStore.js";
import { createInvoiceMailer } from "../../src/platform/billing/invoiceEmail.js";
import { processPurchaseNotification } from "../../src/platform/billing/purchaseRecord.js";
import { handleWithdrawal, createWithdrawalMailer } from "../../src/platform/billing/withdrawal.js";

export default { async fetch(request) {
  const env = process.env;
  const config = polarConfig(env);
  const provider = createPolarProvider(config);
  const origin=env.BILLING_SITE_ORIGIN ?? "https://viikkonro.fi";
  const action = new URL(request.url).pathname.split("/").at(-1);
  const consume=async action => {
    const url = new URL(env.BILLING_SUPABASE_URL ?? "https://invalid.invalid");
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || url.pathname !== "/" || !env.BILLING_SUPABASE_SECRET || !env.PURCHASE_SIGNING_SECRET) throw new Error("unavailable");
    // Vercel overwrites this trusted header. Never persist its plaintext value.
    const ip = request.headers.get("x-vercel-forwarded-for") ?? "unknown";
    const day = new Date().toISOString().slice(0,10);
    const bucket = createHmac("sha256",env.PURCHASE_SIGNING_SECRET).update(`${day}:${ip}`).digest("hex");
    const result = await fetch(new URL("/rest/v1/rpc/commerce_consume",url),{ method:"POST",redirect:"error",signal:AbortSignal.timeout(5000),headers:{ apikey:env.BILLING_SUPABASE_SECRET,Authorization:`Bearer ${env.BILLING_SUPABASE_SECRET}`,"Content-Type":"application/json" },body:JSON.stringify({ p_bucket:bucket,p_action:action }) });
    if (!result.ok) throw new Error("unavailable");
    return (await result.json()) === true;
  };
  if (action === "withdrawal") return handleWithdrawal(request,{
    origin,provider,mailer:createWithdrawalMailer(env),
    // Reuse the existing ten-per-minute recovery bucket; no new DB grants.
    consume:()=>consume("restore"),
  });
  const response = await handleCommerce(request,{
    provider,secret:env.PURCHASE_SIGNING_SECRET,webhookSecret:config.webhookSecret,
    onPurchaseNotification:event => processPurchaseNotification(event, {
      provider,store:createPurchaseStore(env),mailer:createInvoiceMailer(env),
    }),
    origin,consume,
  });
  if (["catalog","checkout","status","export","restore","webhook"].includes(action)) console.info(JSON.stringify({ event:"commerce_request",action,status:response.status }));
  return response;
} };
