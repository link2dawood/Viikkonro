// Bounded, local adversarial probes. Mock payments/email/quota; never call live providers.
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { handleCommerce } from "../src/platform/billing/http.js";
import { purchaseCookie } from "../src/platform/billing/guest.js";
import { handleCalendarApi } from "../src/platform/api/handler.js";
import { handleSignup } from "../api/newsletter.js";
import { validateCalendarConfig } from "../src/platform/calendar/config.js";
import { buildCalendarModel } from "../src/platform/calendar/model.js";
import { validateBranding } from "../src/platform/design/branding.js";
import { validateVacationConfig, newVacationDraft } from "../src/platform/vacation/config.js";
import { validateConstructionConfig, newConstructionDraft } from "../src/platform/construction/config.js";
import { createHrConfig, newHrDraft } from "../src/platform/hr/config.js";
import { buildPlanner } from "../src/platform/planning/model.js";
import { widgetConfiguration } from "../src/platform/widget/model.js";
import { parseDraft } from "../src/components/companyCalendar/formModel.js";
import { csvCell } from "../src/platform/export/csv.js";
import { buildIcs } from "../src/platform/export/ics.js";

const output = process.env.SECURITY_AUDIT_OUTPUT || "/tmp/viikkonro-security-input-audit";
mkdirSync(output, { recursive: true });
const rows = [];
async function probe(area, name, operation, acceptable) {
  const started = performance.now(); let result;
  try { result = await operation(); } catch (error) { result = { exception: error.name }; }
  rows.push({ area, name, result, passed: acceptable(result), durationMs: Math.round(performance.now() - started) });
}
const values = [null, false, true, 0, -1, 1.5, "", "null", [], {}, { length: 1 }, [null], ["x"]];
const origin = "https://viikkonro.fi", at = "2026-10-11T12:00:00.000Z", secret = "s".repeat(64);
const session = { version:1, productId:"company-calendar", year:2027, contractId:"contract-1", checkoutId:"checkout-1", providerProductId:"product-1", priceId:"price-1", organizationId:"org-1", environment:"production", amountCents:2900, createdAt:at };
const payment = { paid:true, checkoutId:"checkout-1", productId:"product-1", priceId:"price-1", organizationId:"org-1", contractId:"contract-1", year:2027, currency:"EUR", amountCents:2900, refundedCents:0, paidAt:at };
const cookie = purchaseCookie(session, secret, at).split(";")[0];
let providerCalls = 0;
const provider = { environment:"production", catalog:async () => { providerCalls++;return {enabled:true,providerProductId:"product-1",priceId:"price-1",organizationId:"org-1",amountCents:2900,currency:"EUR",term:"calendar-year"}; }, payment:async () => {providerCalls++;return payment;}, resumeCheckout:async () => null, startCheckout:async () => {providerCalls++;return {checkoutId:"mock-checkout",url:"https://polar.sh/checkout/mock"};} };
const deps = { provider, secret, origin, consume:async () => true, now:() => at };
const commerceRequest = (action, body, headers = {}, method = "POST") => new Request(`${origin}/api/billing/${action}`, {method,headers:{origin,"content-type":"application/json",cookie,...headers},...(!["GET","HEAD"].includes(method) ? {body:typeof body === "string" ? body : JSON.stringify(body)}:{})});
async function commerce(action, body, headers, extra) {
  const response = await handleCommerce(commerceRequest(action,body,headers),{...deps,...extra});
  const text = await response.text();
  return {status:response.status,private:response.headers.get("cache-control").includes("no-store"),leak:/contract-1|checkout-1|product-1|org-1|server-secret|stack/i.test(text),...(response.status !== 200 || action === "status" ? {body:JSON.parse(text)}:{})};
}
const rejected = result => result.status >= 400 && result.status < 500 && result.private && !result.leak;
for (const body of ["", "{", "null", "x".repeat(262145)]) await probe("commerce","unsigned/malformed/oversized webhook "+rows.length,()=>commerce("webhook",body,{}, {webhookSecret:"whsec_"+Buffer.from("w".repeat(32)).toString("base64")}),rejected);
for (const action of ["checkout","status","restore","export"]) {
  for (let i=0;i<values.length;i++) await probe("commerce",`${action}: malformed root ${i}`,()=>commerce(action,values[i]),rejected);
  for (const method of ["GET","HEAD","PUT","PATCH","DELETE","OPTIONS"]) await probe("commerce",`${action}: wrong method ${method}`,async () => ({status:(await handleCommerce(commerceRequest(action,{}, {},method),deps)).status}),r=>r.status===405);
  for (const badOrigin of ["null","https://evil.invalid","https://viikkonro.fi.evil.invalid","http://viikkonro.fi",""]) await probe("commerce",`${action}: wrong origin ${badOrigin}`,()=>commerce(action,{year:2027},{origin:badOrigin}),r=>r.status===403&&!r.leak);
  for (const raw of ["{", "[] trailing", "", "{\"year\":NaN}"]) await probe("commerce",`${action}: invalid JSON ${raw}`,()=>commerce(action,raw),rejected);
}
for (const year of [null,"2027",0,-1,1.5,2025,2029,9999999999,[],{}]) await probe("commerce",`invalid year ${JSON.stringify(year)}`,()=>commerce("checkout",{year}),rejected);
for (const action of ["checkout","status","restore","export"]) await probe("commerce",`${action}: >1MiB body`,()=>commerce(action,{year:2027,padding:"x".repeat(1048576)}),rejected);
await probe("commerce","deep nested JSON root stays bounded",()=>commerce("checkout","{\"padding\":"+"[".repeat(10000)+"null"+"]".repeat(10000)+"}"),rejected);
await probe("commerce","JSON prototype key does not mutate global prototypes",async()=>{
  const result=await commerce("status",'{"year":2027,"__proto__":{"securityAuditPolluted":true}}');
  return {...result,polluted:Object.prototype.securityAuditPolluted===true};
},r=>r.status===200&&!r.polluted&&!r.leak);
for (const token of ["", "null", "a.b", "a".repeat(4096), cookie+";"+cookie]) await probe("commerce",`forged/duplicate cookie length ${token.length}`,()=>commerce("export",{year:2027,format:"csv",config:{year:2027}},{cookie:token}),r=>r.status===403&&!r.leak);
for (const format of [null,"", "html", "../../.env", [], {}]) await probe("commerce",`invalid export format ${JSON.stringify(format)}`,()=>commerce("export",{year:2027,format,config:{year:2027}}),rejected);
for (const patch of [
  {events:{}},{events:[null]},{periods:{}},{paydayDates:{}},
  {dayRuleMode:"constructor"},{dayRuleMode:"__proto__"},{theme:"constructor"},
  {include:{holidays:"false"}},{layout:{id:"year-glance",paper:"constructor"}},
  {periods:[{id:"p",label:"Closure",start:"2026-01-01",end:"2028-12-31"}]},
  {periods:[{id:"p",label:"x".repeat(121),start:"2027-01-01"}]},
  {events:[{id:"other-year",date:"2028-06-01",title:"Outside purchased year"}]},
  {periods:[{id:"other-year",start:"2028-06-01",end:"2028-06-02",label:"Outside purchased year"}]},
  {events:Array.from({length:501},(_,i)=>({id:`e${i}`,date:"2027-01-01",title:"A"}))},
]) await probe("commerce",`malformed paid config ${Object.keys(patch)[0]} ${rows.length}`,()=>commerce("export",{year:2027,format:"csv",config:{year:2027,...patch}}),rejected);
for (const logo of [null,{}, {dataUri:"https://127.0.0.1/private"},{dataUri:"data:image/png;base64,AA=="},{dataUri:"data:image/svg+xml;base64,PHN2Zy8+"}]) {
 await probe("commerce",`logo case ${JSON.stringify(logo)}`,()=>commerce("export",{year:2027,format:"csv",config:{year:2027,branding:{logo}}}),r=>logo===null ? r.status===200 : rejected(r));
}
for (const action of ["export","checkout","status"]) await probe("commerce",`${action}: rate limit`,()=>commerce(action,{year:2027},{},{consume:async()=>false}),r=>r.status===429&&!r.leak);
await probe("commerce","backend unavailable fails closed",()=>commerce("export",{year:2027},{},{consume:async()=>{throw new Error("server-secret");}}),r=>r.status===503&&!r.leak);

for (const key of ["events","periods","paydayDates"]) for (const value of values.filter(v=>v!==null&&!Array.isArray(v))) await probe("calendar",`${key}: wrong collection type ${JSON.stringify(value)}`,()=>{const r=validateCalendarConfig({year:2027,[key]:value});return {accepted:!!r.config};},r=>r.accepted===false);
for (const value of values) await probe("calendar",`wrong root ${JSON.stringify(value)}`,()=>({accepted:!!validateCalendarConfig(value).config}),r=>r.accepted===false);
for (const key of ["dayRuleMode","theme","product"]) for (const value of ["__proto__","constructor","toString","hasOwnProperty"]) await probe("calendar",`${key}: inherited key ${value}`,()=>({accepted:!!validateCalendarConfig({year:2027,[key]:value}).config}),r=>r.accepted===false);
for (const key of ["holidays","flagDays","weekNumbers"]) for (const value of ["false",1,{},[]]) await probe("calendar",`nonboolean ${key} ${JSON.stringify(value)}`,()=>({accepted:!!validateCalendarConfig({year:2027,include:{[key]:value}}).config}),r=>r.accepted===false);
for (const count of [0,1,500,501]) await probe("calendar",`events count ${count}`,()=>({accepted:!!validateCalendarConfig({year:2027,events:Array.from({length:count},(_,i)=>({id:`e${i}`,date:"2027-01-01",title:"A"}))}).config}),r=>r.accepted===(count<=500));
for (const count of [0,1,60,61]) await probe("calendar",`payday count ${count}`,()=>({accepted:!!validateCalendarConfig({year:2027,paydayDates:Array(count).fill("2027-01-15")}).config}),r=>r.accepted===(count<=60));
for (const count of [0,1,100,101]) await probe("calendar",`period count ${count}`,()=>({accepted:!!validateCalendarConfig({year:2027,periods:Array.from({length:count},(_,i)=>({id:`p${i}`,label:"Closure",start:"2027-01-01",end:"2027-01-01"}))}).config}),r=>r.accepted===(count<=100));
for (const length of [0,1,80,81,100000]) await probe("branding",`company name length ${length}`,()=>({accepted:!!validateBranding({companyName:"a".repeat(length)}).branding}),r=>r.accepted===(length<=80));
for (const length of [0,1,120,121,100000]) await probe("calendar",`event title length ${length}`,()=>({accepted:!!validateCalendarConfig({year:2027,events:[{id:"e",date:"2027-01-01",title:"a".repeat(length)}]}).config}),r=>r.accepted===(length>0&&length<=120));
for (const date of ["2026-02-29","2027-02-29","2028-02-30","2027-13-01","2027-00-01","2027-01-00","not-a-date",null]) await probe("calendar",`invalid date ${date}`,()=>({accepted:!!validateCalendarConfig({year:2027,events:[{id:"e",date,title:"A"}]}).config}),r=>r.accepted===false);
for (const year of [2026,2027,2028]) await probe("calendar",`year ${year} date boundaries`,()=>{const r=validateCalendarConfig({year,events:[{id:"last",date:`${year}-12-31`,title:"Ääkköset"}]});const model=buildCalendarModel(r.config);return {days:model.months.flatMap(m=>m.rows.flatMap(w=>w.days.filter(Boolean))).length};},r=>r.days===(year===2028?366:365));

const apiKey = "vnr_"+"a".repeat(64);
const invalidQueries = ["", "year=null", "year=0", "year=-1", "year=1.5", "year=2027&year=2028", "year=2027&unknown=x", "year=2027&rule=constructor", "year="+"9".repeat(1100)];
for (const query of invalidQueries) await probe("api",`calendar query ${query.slice(0,70)}`,async()=>{let charged=false;const r=await handleCalendarApi(new Request(`${origin}/api/v1/calendar?${query}`,{headers:{authorization:`Bearer ${apiKey}`}}),{requestId:"audit",consume:async()=>{charged=true;return {status:"ok"};}});return {status:r.status,charged};},r=>r.status===400&&!r.charged);
for (const auth of ["", "Bearer null", "Bearer "+"x".repeat(10000), "Bearer "+apiKey+"x"]) await probe("api",`malformed key length ${auth.length}`,async()=>({status:(await handleCalendarApi(new Request(`${origin}/api/v1/week?date=2027-01-01`,{headers:{authorization:auth}}),{requestId:"audit",consume:async()=>{throw new Error();}})).status}),r=>r.status===401);
for (const [resource,queries] of [
  ["holidays",["year=null","year=2101","year=2027&year=2028"]],
  ["flag-days",["year=0","year=2027&private=true"]],
  ["paydays",["year=2027&day=0","year=2027&day=32","year=2027&day=null"]],
  ["week",["date=2027-02-29","year=2027&week=53","year=2026&week=0","date=2027-01-01&year=2027"]],
  ["working-days",["from=2027-01-02&to=2027-01-01","from=2027-01-01&to=2028-01-02","from=null&to=2027-01-01","from=2027-01-01&to=2027-01-02&rule=__proto__"]],
  ["school-holidays",["year=2027&city=null","year=2027","year=2000&city=Helsinki"]],
]) for(const query of queries) await probe("api",`${resource} ${query}`,async()=>({status:(await handleCalendarApi(new Request(`${origin}/api/v1/${resource}?${query}`,{headers:{authorization:`Bearer ${apiKey}`}}),{requestId:"audit",consume:async()=>{throw new Error("invalid inputs must not reach authorization");}})).status}),r=>r.status===400);

const newsletterEnv={SITE_ORIGIN:origin,BREVO_NEWSLETTER_LIST_ID:"1",BREVO_DOI_TEMPLATE_ID:"1",BREVO_API_KEY:"mock",TURNSTILE_SECRET_KEY:"mock"};
let mailCalls=0;
for (const body of [...values,"{",{email:"a@b.fi",consent:false},{email:"x".repeat(255)+"@x.fi",consent:true},{padding:"x".repeat(8193)}]) await probe("newsletter",`invalid body ${rows.length}`,async()=>{const r=await handleSignup(new Request(origin+"/api/newsletter",{method:"POST",headers:{origin,"content-type":"application/json"},body:typeof body==="string"?body:JSON.stringify(body)}),newsletterEnv,async()=>{mailCalls++;throw new Error();});return {status:r.status};},r=>[400,413].includes(r.status));

for (const [name,validator,base] of [
  ["vacation",validateVacationConfig,newVacationDraft(2027)],
  ["construction",validateConstructionConfig,newConstructionDraft("2027-01-01")],
  ["hr",createHrConfig,newHrDraft(2027)],
  ["project",buildPlanner,{kind:"project",start:"2027-01-01",workingDays:10}],
  ["sprint",buildPlanner,{kind:"sprint",start:"2027-01-01",weeks:2,count:2}],
  ["widget",widgetConfiguration,{date:"2027-01-01"}],
]) {
 await probe(name,"minimal valid configuration",()=>({accepted:!!(validator(base)?.config??validator(base))}),r=>r.accepted===true);
 for(const value of [null,false,0,"",[],{}]) await probe(name,`invalid root ${JSON.stringify(value)}`,()=>{const r=validator(value);return {accepted:!!(r?.config??(r?.issues?null:r))};},r=>!!r.exception||r.accepted===false||(name==="widget"&&r.accepted===true&&JSON.stringify(value)==="{}"));
}
for (const value of [null,"", "{", "null", "[]", "0", "false", "x".repeat(1200001),JSON.stringify({v:1,form:{events:[null,1,{}],closures:{},paydayDates:{},companyName:{},logo:{}}})]) await probe("draft","corrupted storage "+rows.length,()=>({safe:parseDraft(value,{years:[2026,2027,2028],fallbackYear:2027})===null||typeof parseDraft(value,{years:[2026,2027,2028],fallbackYear:2027})==="object"}),r=>r.safe===true);
for (const svg of ['<svg onload="alert(1)"/>','<svg><script>alert(1)</script></svg>','<svg><foreignObject/></svg>','<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg/>','<svg><image href="https://evil.invalid/x"/></svg>','<svg><style>@import "https://evil.invalid/x";</style></svg>']) await probe("logo","unsafe SVG "+rows.length,()=>({rejected:!validateBranding({logo:{dataUri:"data:image/svg+xml;base64,"+Buffer.from(svg).toString("base64")}}).branding}),r=>r.rejected);
for (const value of ["=1+1","+1+1","-1+1","@SUM(1)","\t=1+1","\r=1+1","\n=1+1"]) await probe("csv",`formula prefix ${JSON.stringify(value)}`,()=>({protected:csvCell(value,{escapeFormulas:true}).replace(/^"/,"").startsWith("'")}),r=>r.protected);
await probe("ics","untrusted URL CRLF cannot inject a second event",()=>{
 const body=buildIcs({calName:"Audit",calDesc:"Audit",stamp:"20261011T120000Z",events:[{uid:"audit@viikkonro.fi",date:new Date(2027,0,1),summary:"Audit",url:"https://example.invalid/\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Injected"}]});
 return {eventCount:(body.match(/BEGIN:VEVENT/g)||[]).length};
},r=>r.exception||r.eventCount===1);
const failed = rows.filter(row=>!row.passed);
writeFileSync(output+"/results.json",JSON.stringify({tests:rows.length,providerCalls,mailCalls,rows},null,2));
writeFileSync(output+"/findings.json",JSON.stringify(failed,null,2));
console.log(JSON.stringify({tests:rows.length,passed:rows.length-failed.length,flagged:failed.length,mailCalls,output}));
for(const row of failed) console.log(row.area,row.name,JSON.stringify(row.result));
// Audit flags need contextual security assessment; they are not all remote exploits.
process.exitCode=failed.length?1:0;
