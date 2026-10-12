import { randomUUID } from "node:crypto";
import { inflateSync } from "node:zlib";
import PDFDocument from "pdfkit";
import { BillingError, fail } from "./catalog.js";
import { calendarLicenseEnd, cookiePurchase, guestEntitlement, purchaseCookie, readPurchase, saleYear, signPurchase } from "./guest.js";
import { verifyPolarWebhook } from "./polar.js";
import { validateCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
import { renderCalendarPdf } from "../render/pdf.js";
import { calendarToCsv, calendarToXlsx, XLSX_MIME } from "../export/calendar.js";
import { companyCalendarToIcs, isCalendarIdentity } from "../export/companyIcs.js";

const privateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...privateHeaders, "Content-Type": "application/json", ...extra } });
async function bytes(request, max) {
  if (Number(request.headers.get("content-length")) > max) fail("body_too_large");
  const reader = request.body?.getReader();
  if (!reader) fail("invalid_body");
  const chunks = []; let length = 0;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > max) { await reader.cancel(); fail("body_too_large"); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
function pngLogo(logo) {
  if (!logo) return null;
  if (typeof logo.dataUri !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo.dataUri)) fail("invalid_logo");
  const png = Buffer.from(logo.dataUri.split(",")[1], "base64");
  if (png.length < 33 || png.length > 524288 || !png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || png.toString("ascii",12,16) !== "IHDR") fail("invalid_logo");
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  if (!width || !height || width > 2000 || height > 2000 || width * height > 2000000) fail("invalid_logo");
  const depths = { 0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16] };
  if (!depths[png[25]]?.includes(png[24]) || png[26] !== 0 || png[27] !== 0 || png[28] > 1) fail("invalid_logo");
  const compressed = []; let offset = 8, headers = 0, ended = false;
  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset), type = png.toString("ascii",offset+4,offset+8);
    if (offset + 12 + length > png.length) fail("invalid_logo");
    if (type === "IHDR" && (++headers !== 1 || offset !== 8 || length !== 13)) fail("invalid_logo");
    if (type === "IDAT") compressed.push(png.subarray(offset+8,offset+8+length));
    offset += length + 12;
    if (type === "IEND") { if (length !== 0 || offset !== png.length) fail("invalid_logo"); ended = true; break; }
  }
  if (!ended || headers !== 1 || !compressed.length) fail("invalid_logo");
  // Dimensions alone do not stop malicious IDAT decompression bombs. Bound
  // inflation before the PDF library decodes the same pixel stream.
  try { inflateSync(Buffer.concat(compressed),{ maxOutputLength:width*height*8+height*8+1024 }); }
  catch { fail("invalid_logo"); }
  return logo.dataUri;
}
/** Inject provider/limiter for meaningful HTTP and security tests. */
export async function handleCommerce(request, { provider, secret, origin, webhookSecret, consume, onPurchaseNotification, now = () => new Date().toISOString() }) {
  try {
    const url = new URL(request.url), action = url.pathname.split("/").at(-1);
    if (action === "webhook") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" },405);
      const event = verifyPolarWebhook(await bytes(request,262144),request.headers,webhookSecret,Date.parse(now()));
      if (event.type !== "ignored" && onPurchaseNotification) await onPurchaseNotification(event);
      return json({ received: true });
    }
    if (!["catalog","checkout","status","export","restore"].includes(action)) return json({ error: "not_found" },404);
    if (request.method !== (action === "catalog" ? "GET" : "POST")) return json({ error: "method_not_allowed" },405);
    if (action !== "catalog" && (request.headers.get("origin") !== origin || !/^application\/json(?:;|$)/i.test(request.headers.get("content-type") ?? ""))) return json({ error: "invalid_origin" },403);
    if (!await consume(action)) return json({ error: "rate_limited" },429,{ "Retry-After": "60" });
    if (action === "catalog") {
      const catalog = await provider.catalog();
      return json(catalog.enabled ? { enabled:true,amountCents:catalog.amountCents,currency:catalog.currency,term:catalog.term } : { enabled:false });
    }
    let body;
    try { body = JSON.parse((await bytes(request,1048576)).toString("utf8")); } catch (e) { if (e instanceof BillingError) throw e; fail("invalid_body"); }
    const year = body?.year, at = now();
    if (!saleYear(year,at)) fail("invalid_year");
    let session = cookiePurchase(request,secret,year,at);
    if (action === "restore") {
      session = readPurchase(body.code,secret,year,at);
      if (!session) return json({ error:"invalid_purchase" },403);
    }
    if (action === "checkout") {
      const returnTo = body.returnTo === undefined ? "company-calendar" : body.returnTo;
      if (!["company-calendar","company-ics"].includes(returnTo)) fail("invalid_return_to");
      const returnPath = returnTo === "company-ics" ? "/yrityskalenteri/ics" : "/yrityskalenteri";
      const returnUrls = { successUrl:`${origin}${returnPath}?payment=return&year=${year}`,returnUrl:`${origin}${returnPath}?payment=return&year=${year}` };
      const catalog = await provider.catalog();
      if (!catalog.enabled) return json({ error:"payment_unavailable" },503);
      if (session && guestEntitlement(session,await provider.payment(session),at).allowed) return json({ paid:true });
      if (session && session.providerProductId === catalog.providerProductId && session.priceId === catalog.priceId && session.amountCents === catalog.amountCents) {
        const resume = await provider.resumeCheckout(session, { marketingConsent: body.marketingConsent === true,...returnUrls });
        if (resume) return json({ url:resume });
      }
      // A failed or abandoned checkout does not grant anything. Create a fresh
      // session on retry; only a provider-confirmed payment can authorize export.
      const contractId = randomUUID();
      const checkout = await provider.startCheckout({ year,contractId,catalog,marketingConsent:body.marketingConsent === true,consentAt:at,...returnUrls });
      session = { version:1,productId:"company-calendar",year,contractId,checkoutId:checkout.checkoutId,providerProductId:catalog.providerProductId,priceId:catalog.priceId,organizationId:catalog.organizationId,environment:provider.environment,amountCents:catalog.amountCents,createdAt:at };
      return json({ url:checkout.url },200,{ "Set-Cookie":purchaseCookie(session,secret,at) });
    }
    if (!session) return action === "status" ? json({ paid:false,year }) : json({ error:"payment_required" },403);
    const entitlement = guestEntitlement(session,await provider.payment(session),at);
    if (action === "status" || action === "restore") {
      if (action === "restore" && !entitlement.allowed) return json({ error:"payment_required" },403);
      return json({ paid:entitlement.allowed,year,expiresAt:calendarLicenseEnd(year),...(entitlement.allowed ? { restoreCode:signPurchase(session,secret) } : {}) },200,action === "restore" ? { "Set-Cookie":purchaseCookie(session,secret,at) } : {});
    }
    const format = body.format;
    if (!["pdf","xlsx","csv","ics"].includes(format)) fail("invalid_format");
    if (!entitlement.allowed || !entitlement.features.includes(`${format}-export`)) return json({ error:"payment_required" },403);
    if (!body.config || Number(body.config.year) !== year || !Array.isArray(body.config.events ?? []) || !Array.isArray(body.config.periods ?? []) || !Array.isArray(body.config.paydayDates ?? [])) fail("invalid_config");
    const logo = pngLogo(body.config.branding?.logo);
    const result = validateCalendarConfig({ ...body.config,product:"company-calendar",include:{ ...body.config.include,weekNumbers:true } });
    if (!result.config || result.issues.length) fail("invalid_config");
    const model = buildCalendarModel(result.config);
    let content, mime;
    if (format === "pdf") { content = (await renderCalendarPdf(model,{ PDFDocument,logo,generatedOn:new Date(at) })).bytes; mime = "application/pdf"; }
    if (format === "xlsx") { content = calendarToXlsx(model); mime = XLSX_MIME; }
    if (format === "csv") { content = calendarToCsv(model); mime = "text/csv;charset=utf-8"; }
    if (format === "ics") {
      if (!isCalendarIdentity(body.calendarId)) fail("invalid_calendar_id");
      if (body.paydayRows != null && (!Array.isArray(body.paydayRows) || body.paydayRows.length > 60 || body.paydayRows.some(row => !row || !/^\d{4}-\d\d-\d\d$/.test(row.date) || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(row.id)))) fail("invalid_payday_rows");
      content = companyCalendarToIcs(model,{ calendarId:body.calendarId,paydayRows:body.paydayRows ?? [] }); mime = "text/calendar;charset=utf-8";
    }
    return new Response(content,{ headers:{ ...privateHeaders,"Content-Type":mime,"Content-Disposition":`attachment; filename="yrityskalenteri-${year}.${format}"` } });
  } catch (error) {
    const code = error instanceof BillingError ? error.code : "payment_unavailable";
    const unavailable = ["payment_unavailable","polar_unavailable","purchase_secret_required","payment_not_configured","receipt_pending"].includes(code);
    return json({ error:unavailable ? "payment_unavailable" : "invalid_request" },unavailable ? 503 : 400);
  }
}
