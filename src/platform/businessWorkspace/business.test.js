import { describe,it,expect } from "vitest";
import { configFromJson, configToJson } from "../calendar/config.js";
import { BUSINESS_ROLES, canEditCompanyCalendar, canManageClientAccess, initialCompanyConfiguration, validateBusinessSnapshot, companyCalendarModel, reusableCompanyTemplate, createBusinessScope } from "./model.js";
import { exportCompanyCalendar, artifactHash } from "./exports.js";
import { BUSINESS_BILLING, unavailableBusinessBilling } from "./billing.js";
const client = "10000000-0000-0000-0000-000000000001", firm = "20000000-0000-0000-0000-000000000001", calendar = "30000000-0000-0000-0000-000000000001";
const snapshot = (year=2027) => ({ role:"firm_owner",firmVersion:1,year,client:{id:client,firmId:firm,name:"Ääkköset Oy",version:1},calendar:{id:calendar,version:1,configuration:initialCompanyConfiguration("Ääkköset Oy",year)},access:[],audit:[],exports:[] });
describe("Multi-company calendar foundation",()=>{
 for(const year of [2026,2027,2028]) it(`reuses calendar and exports ${year}`,async()=>{
  const s=snapshot(year);s.calendar.configuration.events=[{id:"private",date:`${year}-12-31`,endDate:`${year+1}-01-02`,title:"Ääkköset, yksityinen päivä"}];
  expect(companyCalendarModel(s).stats.days).toBe(year===2028?366:365);
  const ics=await exportCompanyCalendar(s,"ics");expect(ics).toContain(`DTEND;VALUE=DATE:${year+1}0103`);expect(ics).toContain(client);expect(ics).toContain(calendar);expect(ics).toContain("Ääkköset");
  const bytes=await exportCompanyCalendar(s,"xlsx");expect([...bytes.slice(0,2)]).toEqual([80,75]);
  expect(await exportCompanyCalendar(s,"csv")).toContain("Ääkköset");
  const pdf=await exportCompanyCalendar(s,"pdf");expect(new TextDecoder().decode(pdf.slice(0,4))).toBe("%PDF");
 });
 it("isolates ICS identities between clients",async()=>{
  const a=snapshot(),b=snapshot();b.client.id="10000000-0000-0000-0000-000000000002";
  const uids=async(s)=>(await exportCompanyCalendar(s,"ics")).match(/^UID:.*(?:\r\n .* )?/gm);
  expect(await uids(a)).not.toEqual(await uids(b));
 });
 it("copies reusable settings without company data",()=>{
  const source=initialCompanyConfiguration("Private A",2027);source.events=[{id:"a",date:"2027-01-01",title:"Secret"}];source.paydayDates=["2027-01-15"];source.periods=[{id:"c",kind:"closure",label:"Private closure",start:"2027-07-01",end:"2027-07-02"}];source.branding.logo={dataUri:"data:image/png;base64,iVBORw0KGgo="};
  const template=reusableCompanyTemplate(source,"Company B",2028);
  expect(template).toMatchObject({year:2028,events:[],periods:[],paydayDates:[],branding:{companyName:"Company B",logo:null}});expect(JSON.stringify(template)).not.toContain("Private");expect(configToJson(configFromJson(template))).toEqual(template);
 });
 it("makes permissions explicit",()=>{for(const role of BUSINESS_ROLES){expect(canEditCompanyCalendar(role)).toBe(role!=="viewer");expect(canManageClientAccess(role)).toBe(["firm_owner","client_admin"].includes(role));}expect(canEditCompanyCalendar("owner")).toBe(false);});
 it("rejects mismatched tenants, years and malformed configuration",()=>{const s=snapshot();expect(()=>validateBusinessSnapshot(s,firm,2027)).toThrow();expect(()=>validateBusinessSnapshot(s,client,2028)).toThrow();s.calendar.configuration.branding.logo={dataUri:'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+'};expect(()=>validateBusinessSnapshot(s,client,2027)).toThrow();});
 it("rejects delayed privileged snapshots after client and firm downgrades",()=>{
  const guard=createBusinessScope();let token=guard.reset(`${client}:2027`);const old=snapshot();expect(guard.accept(old,token,client,2027)).toBe(true);
  const newer=snapshot();newer.role="viewer";newer.client.version=2;newer.firmVersion=2;expect(guard.accept(newer,token,client,2027)).toBe(true);expect(guard.accept(old,token,client,2027)).toBe(false);
  guard.reset(`${firm}:2027`);expect(guard.current(token)).toBe(false);expect(guard.accept(newer,token,client,2027)).toBe(false);
  token=guard.reset(`${client}:2028`);expect(guard.accept(snapshot(2028),token,client,2028)).toBe(true);
 });
 it("keeps firm audit history outside client permissions",()=>{const s=snapshot();s.firmAudit=[{id:1,action:"create_client"}];expect(validateBusinessSnapshot(s,client,2027)).toBe(s);for(const role of ["client_admin","editor","viewer"]){s.role=role;expect(()=>validateBusinessSnapshot(s,client,2027)).toThrow("permission boundary");}s.firmAudit=[];expect(validateBusinessSnapshot(s,client,2027)).toBe(s);});
 it("retains calendar versions for optimistic edits",()=>{const guard=createBusinessScope();const token=guard.reset(`${client}:2027`);const fresh=snapshot();fresh.calendar.version=3;expect(guard.accept(fresh,token,client,2027)).toBe(true);expect(guard.accept(snapshot(),token,client,2027)).toBe(false);});
 it("fingerprints artifacts without transmitting their contents",async()=>{expect(await artifactHash("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");});
 it("does not charge or trust client billing flags",async()=>{expect(BUSINESS_BILLING.chargingEnabled).toBe(false);expect((await unavailableBusinessBilling.checkout()).status).toBe("unavailable");expect(await unavailableBusinessBilling.entitlement()).toMatchObject({plan:"free_preview",chargingEnabled:false});});
});
