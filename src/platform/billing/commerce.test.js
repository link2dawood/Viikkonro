import { describe,it,expect,vi } from "vitest";
import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";
import { deflateSync } from "node:zlib";
import { calendarLicenseEnd,readPurchase,signPurchase,purchaseCookie,guestEntitlement,saleYear } from "./guest.js";
import { createPolarProvider,verifyPolarWebhook,validatePolarCheckoutUrl } from "./polar.js";
import { handleCommerce } from "./http.js";

const secret = "x".repeat(64), at = "2026-10-11T12:00:00.000Z";
const session = { version:1,productId:"company-calendar",year:2027,contractId:"contract-1",checkoutId:"checkout-1",providerProductId:"product-1",priceId:"price-1",organizationId:"org-1",environment:"production",amountCents:2900,createdAt:"2026-10-11T11:00:00.000Z" };
const payment = { paid:true,checkoutId:"checkout-1",productId:"product-1",priceId:"price-1",organizationId:"org-1",contractId:"contract-1",year:2027,currency:"EUR",amountCents:2900,refundedCents:0,paidAt:"2026-10-11T11:30:00.000Z" };
const origin = "https://viikkonro.fi";
const cookie = purchaseCookie(session,secret,at).split(";")[0];
const request = (action,body,headers={}) => new Request(`${origin}/api/billing/${action}`,{ method:body ? "POST" : "GET",headers:{ origin,"content-type":"application/json",cookie,...headers },...(body ? { body:JSON.stringify(body) } : {}) });
const provider = (paid = payment) => ({ environment:"production",catalog:vi.fn(async () => ({ enabled:true,providerProductId:"product-1",priceId:"price-1",organizationId:"org-1",amountCents:2900,currency:"EUR",term:"calendar-year" })),payment:vi.fn(async () => paid),startCheckout:vi.fn(async () => ({ checkoutId:"checkout-2",url:"https://polar.sh/checkout/test" })),resumeCheckout:vi.fn(async () => "https://polar.sh/checkout/test") });
const deps = p => ({ provider:p,secret,origin,consume:async () => true,now:() => at });

describe("guest purchases use verified provider payment, not a cookie/return URL",() => {
  it.each([2026,2027,2028])("supports selected year %i and Helsinki exclusive expiry",year => {
    expect(saleYear(year,at)).toBe(true);
    expect(calendarLicenseEnd(year)).toBe(`${year}-12-31T22:00:00.000Z`);
    expect(readPurchase(signPurchase({ ...session,year },secret),secret,year,at)?.year).toBe(year);
  });
  it("rejects past and out-of-range sales",() => { expect(saleYear(2025,at)).toBe(false);expect(saleYear(2029,at)).toBe(false); });
  it("signs HttpOnly host cookie and rejects edits/wrong secret/wrong year",() => {
    expect(purchaseCookie(session,secret,at)).toContain("Secure; HttpOnly; SameSite=Lax");
    const token = signPurchase(session,secret);
    expect(readPurchase(token,secret,2028,at)).toBeNull();
    expect(readPurchase(token,"y".repeat(64),2027,at)).toBeNull();
    expect(readPurchase(`x${token}`,secret,2027,at)).toBeNull();
    expect(readPurchase(`${token}.extra`,secret,2027,at)).toBeNull();
    expect(guestEntitlement(session,null,at).allowed).toBe(false);
  });
  it.each(["checkoutId","productId","priceId","organizationId","contractId","year","currency"])("rejects mismatched %s",field => {
    expect(guestEntitlement(session,{ ...payment,[field]:"different" },at).allowed).toBe(false);
  });
  it("refunds and expiration revoke access; partial refunds retain it",() => {
    expect(guestEntitlement(session,payment,at).allowed).toBe(true);
    expect(guestEntitlement(session,{ ...payment,refundedCents:100 },at).allowed).toBe(true);
    expect(guestEntitlement(session,{ ...payment,refundedCents:2900 },at).allowed).toBe(false);
    expect(guestEntitlement(session,payment,calendarLicenseEnd(2027)).allowed).toBe(false);
    expect(readPurchase(signPurchase(session,secret),secret,2027,calendarLicenseEnd(2027))).toBeNull();
  });
});
describe("commerce HTTP authorization and artifacts",() => {
  it("exposes only generic catalog data",async () => {
    const r = await handleCommerce(request("catalog"),deps(provider()));
    expect(await r.json()).toEqual({ enabled:true,amountCents:2900,currency:"EUR",term:"calendar-year" });
    expect(r.headers.get("cache-control")).toBe("private, no-store");
  });
  it.each(["checkout","status","export","restore"])("blocks cross-origin %s",async action => {
    const p = provider();
    const r = await handleCommerce(request(action,{ year:2027 },{ origin:"https://evil.test" }),deps(p));
    expect(r.status).toBe(403);expect(p.payment).not.toHaveBeenCalled();
  });
  it("rate limits before calling Polar; limiter failure fails closed",async () => {
    expect((await handleCommerce(request("status",{ year:2027 }),{ ...deps(provider()),consume:async () => false })).status).toBe(429);
    expect((await handleCommerce(request("status",{ year:2027 }),{ ...deps(provider()),consume:async () => { throw new Error(); } })).status).toBe(503);
  });
  it("return URL and signed cookie never prove payment",async () => {
    const p = provider(null);
    const r = await handleCommerce(request("status",{ year:2027,payment:"success" }),deps(p));
    expect((await r.json()).paid).toBe(false);
    expect((await handleCommerce(request("export",{ year:2027,format:"csv" }),deps(p))).status).toBe(403);
  });
  it("starts checkout and reuses open checkout",async () => {
    const p = provider(null);
    const fresh = await handleCommerce(request("checkout",{ year:2027 },{ cookie:"" }),deps(p));
    expect(fresh.status).toBe(200);expect(fresh.headers.get("set-cookie")).toContain("HttpOnly");
    expect(p.startCheckout.mock.calls[0][0]).not.toHaveProperty("companyName");
    await handleCommerce(request("checkout",{ year:2027 }),deps(p));
    expect(p.resumeCheckout).toHaveBeenCalledOnce();expect(p.startCheckout).toHaveBeenCalledOnce();
  });
  it.each([2026,2027,2028])("returns to the selected company calendar/ICS year %i",async year => {
    for(const returnTo of ["company-calendar","company-ics"]) {
      const p=provider(null),path=returnTo==="company-ics"?"/yrityskalenteri/ics":"/yrityskalenteri";
      const r=await handleCommerce(request("checkout",{year,returnTo},{cookie:""}),deps(p));
      expect(r.status).toBe(200);
      expect(p.startCheckout.mock.calls[0][0]).toMatchObject({successUrl:`${origin}${path}?payment=return&year=${year}`,returnUrl:`${origin}${path}?payment=return&year=${year}`});
    }
  });
  it.each(["https://evil.test","//evil.test","__proto__",null,0,{},[]].map(value => [value]))("rejects an untrusted checkout return target %j",async returnTo => {
    const p=provider(null),r=await handleCommerce(request("checkout",{year:2027,returnTo},{cookie:""}),deps(p));
    // Omitted/legacy targets default to the company builder; explicit null is invalid.
    expect(r.status).toBe(400);expect(p.startCheckout).not.toHaveBeenCalled();
  });
  it("does not reuse an older checkout that returns to another tool/year",async () => {
    const checkout={id:"checkout-1",organization_id:"org-1",product_id:"product-1",metadata:{viikkonro_contract:"contract-1"},require_billing_address:true,status:"open",expires_at:"2099-01-01T00:00:00Z",url:"https://polar.sh/checkout/test",success_url:`${origin}/yrityskalenteri?payment=return`,return_url:`${origin}/yrityskalenteri`};
    const p=createPolarProvider({environment:"production",accessToken:"fixture",organizationId:"org-1"},{fetchImpl:async()=>new Response(JSON.stringify(checkout),{headers:{"content-type":"application/json"}})});
    expect(await p.resumeCheckout(session,{successUrl:`${origin}/yrityskalenteri/ics?payment=return&year=2027`,returnUrl:`${origin}/yrityskalenteri/ics?payment=return&year=2027`})).toBeNull();
    expect(await p.resumeCheckout(session,{successUrl:checkout.success_url,returnUrl:checkout.return_url})).toBe("https://polar.sh/checkout/test");
  });
  it("starts a EUR 10 checkout instead of resuming an unpaid EUR 29 price",async () => {
    const p = provider(null);
    p.catalog.mockResolvedValue({ enabled:true,providerProductId:"product-1",priceId:"price-10",organizationId:"org-1",amountCents:1000,currency:"EUR",term:"calendar-year" });
    const r = await handleCommerce(request("checkout",{ year:2027 }),deps(p));
    expect(r.status).toBe(200);
    expect(p.resumeCheckout).not.toHaveBeenCalled();
    expect(p.startCheckout).toHaveBeenCalledOnce();
    expect(p.startCheckout.mock.calls[0][0].catalog).toMatchObject({ priceId:"price-10",amountCents:1000 });
    const token = r.headers.get("set-cookie").split(";")[0].split("=")[1];
    expect(readPurchase(token,secret,2027,at)).toMatchObject({ priceId:"price-10",amountCents:1000 });
  });
  it("preserves a verified EUR 29 purchase when new sales cost EUR 10",async () => {
    const p = provider();
    p.catalog.mockResolvedValue({ enabled:true,providerProductId:"product-1",priceId:"price-10",organizationId:"org-1",amountCents:1000,currency:"EUR",term:"calendar-year" });
    const r = await handleCommerce(request("checkout",{ year:2027 }),deps(p));
    expect(await r.json()).toEqual({ paid:true });
    expect(p.startCheckout).not.toHaveBeenCalled();
    expect(p.resumeCheckout).not.toHaveBeenCalled();
    const restored = await handleCommerce(request("restore",{year:2027,code:signPurchase(session,secret)},{cookie:""}),deps(p));
    expect(restored.status).toBe(200);
    expect((await restored.json()).paid).toBe(true);
  });
  it("private code restores only the purchased year after fresh verification",async () => {
    const r = await handleCommerce(request("restore",{ year:2027,code:signPurchase(session,secret) },{ cookie:"" }),deps(provider()));
    expect(r.status).toBe(200);expect(r.headers.get("set-cookie")).toContain("HttpOnly");
    expect((await handleCommerce(request("restore",{ year:2028,code:signPurchase(session,secret) }),deps(provider()))).status).toBe(403);
    expect((await handleCommerce(request("restore",{ year:2027,code:signPurchase(session,secret) }),deps(provider({ ...payment,refundedCents:2900 })))).status).toBe(403);
  });
  it.each([2026,2027,2028])("renders all purchased artifacts for %i using shared engine",async year => {
    const s = { ...session,year }, p = provider({ ...payment,year });
    const headers = { cookie:purchaseCookie(s,secret,at).split(";")[0] };
    for (const format of ["pdf","xlsx","csv","ics"]) {
      const logo = year === 2026 ? {dataUri:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAAAEUlEQVR4nGM4ISeHFTFQTwIAbv4ggUBHKgEAAAAASUVORK5CYII="} : null;
      const r = await handleCommerce(request("export",{ year,format,calendarId:"a".repeat(32),config:{ year,branding:{ companyName:"Ääkköset Oy",logo },events:[{ id:"event-1",date:`${year}-12-31`,title:"Vuoden päätös" }] } },headers),deps(p));
      expect(r.status).toBe(200);
      const data = new Uint8Array(await r.arrayBuffer());expect(data.length).toBeGreaterThan(100);
      if (format === "pdf") expect(new TextDecoder().decode(data.slice(0,4))).toBe("%PDF");
      if (format === "xlsx") expect([...data.slice(0,2)]).toEqual([80,75]);
      if (format === "ics") expect(new TextDecoder().decode(data)).toContain(`DTSTART;VALUE=DATE:${year}1231`);
      if (format === "csv") expect(new TextDecoder().decode(data)).toContain("Vuoden päätös");
    }
    expect(p.payment).toHaveBeenCalledTimes(4);
  });
  it("rejects year switching, SVG/external logos and oversized bodies",async () => {
    const p=provider();
    expect((await handleCommerce(request("export",{ year:2027,format:"pdf",config:{ year:2028 } }),deps(p))).status).toBe(400);
    expect((await handleCommerce(request("export",{ year:2027,format:"pdf",config:{ year:2027,branding:{ logo:{ dataUri:"https://private.invalid/logo" } } } }),deps(p))).status).toBe(400);
    expect((await handleCommerce(request("checkout",{ year:2027,padding:"x".repeat(1048576) }),deps(p))).status).toBe(400);
  });
  it("rejects PNG decompression bombs before invoking the PDF renderer",async () => {
    const chunk = (type,data) => { const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);out.write(type,4);data.copy(out,8);return out; };
    const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(1,0);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=6;
    const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(Buffer.alloc(1024*1024))),chunk("IEND",Buffer.alloc(0))]);
    const r=await handleCommerce(request("export",{year:2027,format:"pdf",config:{year:2027,branding:{logo:{dataUri:`data:image/png;base64,${png.toString("base64")}`}}}}),deps(provider()));
    expect(r.status).toBe(400);
  });
});
describe("Polar adapter and signed webhooks",() => {
  const config = { environment:"production",accessToken:"server-token",organizationId:"org-1",productId:"product-1",priceId:"price-1",enabled:true };
  const order = { paid:true,checkout_id:session.checkoutId,product_id:session.providerProductId,subscription_id:null,currency:"eur",discount_amount:0,total_amount:2900,items:[{ product_price_id:session.priceId }],metadata:{ viikkonro_contract:session.contractId,calendar_year:session.year,viikkonro_product:session.productId },created_at:payment.paidAt,refunded_amount:0,refunded_tax_amount:0 };
  it.each(["checkout_id","product_id","currency","discount_amount","total_amount","items","metadata"])("authoritative reconciliation rejects incorrect %s",async field => {
    const invalid = { ...order,[field]:field === "total_amount" ? 3000 : field === "discount_amount" ? 100 : field === "items" ? [{ product_price_id:"other" }] : field === "metadata" ? {} : "other" };
    const fetchImpl = async () => Response.json({ items:[invalid] });
    await expect(createPolarProvider(config,{ fetchImpl }).payment(session)).rejects.toThrow();
  });
  it("pending, duplicate, tax-exempt and refunded provider orders",async () => {
    const adapter = row => createPolarProvider(config,{ fetchImpl:async () => Response.json({ items:row }) });
    expect(await adapter([]).payment(session)).toBeNull();
    await expect(adapter([order,order]).payment(session)).rejects.toThrow();
    expect((await adapter([{ ...order,paid:false }]).payment(session)).paid).toBe(false);
    const exempt = await adapter([{ ...order,total_amount:2311 }]).payment(session);
    expect(guestEntitlement(session,exempt,at).allowed).toBe(true);
    const refunded = await adapter([{ ...order,refunded_amount:2311,refunded_tax_amount:589 }]).payment(session);
    expect(guestEntitlement(session,refunded,at).allowed).toBe(false);
  });
  it.each([1000,2900])("reads the current %i-cent price and pins the API version",async amountCents => {
    const fetchImpl = vi.fn(async () => Response.json({ id:"product-1",organization_id:"org-1",visibility:"public",is_recurring:false,prices:[{ id:"price-1",amount_type:"fixed",price_currency:"eur",price_amount:amountCents,tax_behavior:"inclusive" }] }));
    expect((await createPolarProvider(config,{ fetchImpl }).catalog()).amountCents).toBe(amountCents);
    expect(fetchImpl.mock.calls[0][1].headers["Polar-Version"]).toBe("2026-10");
  });
  it.each(["https://evil.test/checkout/x","http://polar.sh/checkout/x","https://polar.sh@evil.test/checkout/x","https://polar.sh/other"])("rejects unsafe checkout %s",url => expect(() => validatePolarCheckoutUrl(url,"production")).toThrow());
  it("disabled products cannot be sold",async () => expect(await createPolarProvider({ ...config,enabled:false }).catalog()).toEqual({ enabled:false }));
  it("uses raw UTF-8 webhook secret exactly as official Polar SDK",() => {
    const raw = new TextEncoder().encode(JSON.stringify({ type:"order.paid",data:{ email:"private@example.test" } }));
    const webhookSecret="production-webhook-secret",timestamp=String(Date.parse(at)/1000);
    const sig=createHmac("sha256",webhookSecret).update(`event-1.${timestamp}.`).update(raw).digest("base64");
    const headers=new Headers({ "webhook-id":"event-1","webhook-timestamp":timestamp,"webhook-signature":`v1,${sig}` });
    expect(verifyPolarWebhook(raw,headers,webhookSecret,Date.parse(at))).toEqual({ type:"order.paid" });
    expect(() => verifyPolarWebhook(new TextEncoder().encode("{}"),headers,webhookSecret,Date.parse(at))).toThrow();
    expect(() => verifyPolarWebhook(raw,headers,webhookSecret,Date.parse(at)+301000)).toThrow();
  });
});
