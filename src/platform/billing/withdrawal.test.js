import { describe, it, expect, vi } from "vitest";
import { handleWithdrawal, createWithdrawalMailer } from "./withdrawal.js";

const origin="https://viikkonro.fi";
const uuid="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const body={name:"Ääkkönen Oy",email:"buyer@example.com",orderId:uuid,confirmed:true};
const request=(payload=body,headers={})=>new Request(`${origin}/api/billing/withdrawal`,{method:"POST",headers:{origin,"Content-Type":"application/json",...headers},body:JSON.stringify(payload)});
function dependencies() {
  return {origin,consume:vi.fn().mockResolvedValue(true),now:()=>"2026-10-11T20:00:00Z",
    provider:{purchase:vi.fn().mockResolvedValue({record:{order_id:uuid,email:body.email,calendar_year:2027}})},
    mailer:{sendWithdrawal:vi.fn().mockResolvedValue(undefined)}};
}
describe("cancellation notices",()=>{
  it("verifies the actual order and acknowledges the notice without refunding money",async()=>{
    const deps=dependencies();
    const res=await handleWithdrawal(request({...body,email:"BUYER@example.com",orderId:uuid.toUpperCase()}),deps);
    expect(res.status).toBe(202);
    const result=await res.json();expect(Object.keys(result).sort()).toEqual(["id","receivedAt"]);
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.receivedAt).toBe("2026-10-11T20:00:00Z");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(deps.provider.purchase).toHaveBeenCalledWith(uuid);
    expect(deps.mailer.sendWithdrawal).toHaveBeenCalledWith({name:body.name,email:body.email,id:result.id,receivedAt:result.receivedAt,year:2027,orderId:uuid});
  });
  it("accepts a notice after the selected calendar year has ended",async()=>{
    const deps=dependencies();deps.provider.purchase.mockResolvedValue({record:{order_id:uuid,email:body.email,calendar_year:2020}});
    expect((await handleWithdrawal(request(),deps)).status).toBe(202);
    expect(deps.mailer.sendWithdrawal.mock.calls[0][0].year).toBe(2020);
  });
  it.each([null,[],0,"",{}, {...body,name:""},{...body,name:" "},{...body,name:"a".repeat(161)},
    {...body,name:"x\r\nBcc: attacker"},{...body,email:null},{...body,email:"bad"},{...body,email:"a".repeat(255)+"@example.com"},
    {...body,email:"x@example.com\r\nBcc:y@example.com"},{...body,orderId:null},{...body,orderId:"../../orders"},
    {...body,confirmed:false},{...body,confirmed:"true"},{...body,refundAmount:1000},{...body,name:{value:"x"}}])("rejects malformed or unsafe input %#",async payload=>{
    const deps=dependencies();expect((await handleWithdrawal(request(payload),deps)).status).toBe(400);
    expect(deps.provider.purchase).not.toHaveBeenCalled();expect(deps.mailer.sendWithdrawal).not.toHaveBeenCalled();
  });
  it.each([null,{record:{email:"someone@example.com"}}])("does not disclose or email an unmatched order %#",async purchase=>{
    const deps=dependencies();deps.provider.purchase.mockResolvedValue(purchase);
    const res=await handleWithdrawal(request(),deps);expect(res.status).toBe(400);
    expect(await res.json()).toEqual({error:"order_not_verified"});expect(deps.mailer.sendWithdrawal).not.toHaveBeenCalled();
  });
  it.each([{}, {"content-length":"9000"}])("bounds streamed and declared bodies %#",async headers=>{
    const deps=dependencies();const res=await handleWithdrawal(request({...body,name:"a".repeat(9000)},headers),deps);
    expect(res.status).toBe(413);expect(deps.provider.purchase).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON",async()=>{
    const res=await handleWithdrawal(new Request(`${origin}/api/billing/withdrawal`,{method:"POST",headers:{origin,"Content-Type":"application/json"},body:"{"}),dependencies());expect(res.status).toBe(400);
  });
  it("restricts origin, method and content type",async()=>{
    const deps=dependencies();
    expect((await handleWithdrawal(request(body,{origin:"https://evil.example"}),deps)).status).toBe(403);
    expect((await handleWithdrawal(request(body,{"Content-Type":"text/plain"}),deps)).status).toBe(415);
    const res=await handleWithdrawal(new Request(origin),deps);expect(res.status).toBe(405);expect(res.headers.get("Allow")).toBe("POST");
    expect(deps.consume).not.toHaveBeenCalled();
  });
  it("limits attempts before querying orders or sending mail",async()=>{
    const deps=dependencies();deps.consume.mockResolvedValue(false);
    expect((await handleWithdrawal(request(),deps)).status).toBe(429);expect(deps.provider.purchase).not.toHaveBeenCalled();
  });
  it.each(["consume","purchase","sendWithdrawal"])("fails closed on %s failure without leaking secrets",async step=>{
    const deps=dependencies();(step==="consume" ? deps.consume : step==="purchase" ? deps.provider.purchase : deps.mailer.sendWithdrawal).mockRejectedValue(new Error("secret-token"));
    const res=await handleWithdrawal(request(),deps);expect(res.status).toBe(503);expect(await res.json()).toEqual({error:"unavailable"});
  });
});
describe("durable email acknowledgement",()=>{
  const env={MAILJET_API_KEY:"test-key",MAILJET_SECRET_KEY:"test-secret",MAILJET_FROM_EMAIL:"hi@viikkonro.fi",BILLING_OWNER_EMAIL:"owner@example.com"};
  const notice={...body,id:uuid,receivedAt:"2026-10-11T20:00:00Z",year:2027};
  const accepted=()=>Response.json({Messages:[{Status:"success",To:[{MessageUUID:"mail-id"}]}]});
  it("sends a plain-text receipt and private owner copy with tracking disabled",async()=>{
    const fetchImpl=vi.fn().mockResolvedValue(accepted());await createWithdrawalMailer(env,{fetchImpl}).sendWithdrawal(notice);
    const [url,opts]=fetchImpl.mock.calls[0];expect(url).toBe("https://api.mailjet.com/v3.1/send");expect(opts.redirect).toBe("error");
    const msg=JSON.parse(opts.body).Messages[0];expect(msg.To).toEqual([{Email:body.email}]);expect(msg.Bcc).toEqual([{Email:env.BILLING_OWNER_EMAIL}]);
    expect(msg.TrackClicks).toBe("disabled");expect(msg.TrackOpens).toBe("disabled");expect(msg.HTMLPart).toBeUndefined();
    expect(msg.TextPart).toContain("Ääkkönen Oy");expect(msg.TextPart).toContain(notice.receivedAt);expect(msg.TextPart).toContain(uuid);
    expect(msg.TextPart).toContain("Se ei tarkoita, että maksu olisi jo palautettu");
    expect(opts.body).not.toContain(env.MAILJET_SECRET_KEY);
  });
  it("avoids duplicate owner/buyer recipients",async()=>{
    const fetchImpl=vi.fn().mockResolvedValue(accepted());await createWithdrawalMailer({...env,BILLING_OWNER_EMAIL:body.email},{fetchImpl}).sendWithdrawal(notice);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).Messages[0].Bcc).toBeUndefined();
  });
  it.each([Response.json({}, {status:500}),Response.json({Messages:[{Status:"error"}]}),Response.json({Messages:[{Status:"success",To:[]}]} )])("never acknowledges rejected mail %#",async response=>{
    await expect(createWithdrawalMailer(env,{fetchImpl:vi.fn().mockResolvedValue(response)}).sendWithdrawal(notice)).rejects.toThrow("unavailable");
  });
  it("requires complete server configuration",async()=>{
    const fetchImpl=vi.fn();await expect(createWithdrawalMailer({...env,MAILJET_SECRET_KEY:""},{fetchImpl}).sendWithdrawal(notice)).rejects.toThrow();expect(fetchImpl).not.toHaveBeenCalled();
  });
});
