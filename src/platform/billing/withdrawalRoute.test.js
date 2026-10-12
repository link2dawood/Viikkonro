import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
const fixture=vi.hoisted(()=>({purchase:vi.fn()}));
vi.mock("./polar.js",()=>({polarConfig:()=>({}),createPolarProvider:()=>({purchase:fixture.purchase})}));
import endpoint from "../../../../api/billing/[action].js";

const id="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const request=(origin="https://viikkonro.fi")=>new Request("https://viikkonro.fi/api/billing/withdrawal",{method:"POST",headers:{origin,"Content-Type":"application/json","x-vercel-forwarded-for":"192.0.2.1"},body:JSON.stringify({name:"Test",email:"buyer@example.com",orderId:id,confirmed:true})});
describe("deployed cancellation route",()=>{
  beforeEach(()=>{
    vi.stubEnv("BILLING_SITE_ORIGIN","https://viikkonro.fi");vi.stubEnv("BILLING_SUPABASE_URL","https://test.supabase.co");vi.stubEnv("BILLING_SUPABASE_SECRET","test-db-secret");vi.stubEnv("PURCHASE_SIGNING_SECRET","test-signing-secret");
    vi.stubEnv("MAILJET_API_KEY","test-key");vi.stubEnv("MAILJET_SECRET_KEY","test-mail-secret");vi.stubEnv("MAILJET_FROM_EMAIL","hi@viikkonro.fi");vi.stubEnv("BILLING_OWNER_EMAIL","owner@example.com");
    fixture.purchase.mockReset().mockResolvedValue({record:{order_id:id,email:"buyer@example.com",calendar_year:2027}});
  });
  afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
  it("dispatches through the shared database limiter before sending the acknowledgement",async()=>{
    const fetchImpl=vi.fn().mockResolvedValueOnce(Response.json(true)).mockResolvedValueOnce(Response.json({Messages:[{Status:"success",To:[{MessageUUID:"sent"}]}]}));vi.stubGlobal("fetch",fetchImpl);
    const res=await endpoint.fetch(request());expect(res.status).toBe(202);
    const [limitUrl,limitOpts]=fetchImpl.mock.calls[0];expect(String(limitUrl)).toBe("https://test.supabase.co/rest/v1/rpc/commerce_consume");
    const limiter=JSON.parse(limitOpts.body);expect(limiter.p_action).toBe("restore");expect(limiter.p_bucket).toMatch(/^[0-9a-f]{64}$/);expect(limitOpts.body).not.toContain("192.0.2.1");
    expect(fetchImpl.mock.calls[1][0]).toBe("https://api.mailjet.com/v3.1/send");expect(fixture.purchase).toHaveBeenCalledOnce();
    expect(await res.text()).not.toContain("test-db-secret");
  });
  it("does not call external services for a cross-origin notice",async()=>{
    const fetchImpl=vi.fn();vi.stubGlobal("fetch",fetchImpl);expect((await endpoint.fetch(request("https://evil.example"))).status).toBe(403);expect(fetchImpl).not.toHaveBeenCalled();expect(fixture.purchase).not.toHaveBeenCalled();
  });
  it("stops on a denied database limit",async()=>{
    const fetchImpl=vi.fn().mockResolvedValue(Response.json(false));vi.stubGlobal("fetch",fetchImpl);expect((await endpoint.fetch(request())).status).toBe(429);expect(fetchImpl).toHaveBeenCalledOnce();expect(fixture.purchase).not.toHaveBeenCalled();
  });
  it("fails closed when metering credentials are missing",async()=>{
    vi.stubEnv("BILLING_SUPABASE_SECRET","");const fetchImpl=vi.fn();vi.stubGlobal("fetch",fetchImpl);expect((await endpoint.fetch(request())).status).toBe(503);expect(fetchImpl).not.toHaveBeenCalled();
  });
});
