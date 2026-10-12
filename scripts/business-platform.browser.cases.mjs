import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { initialCompanyConfiguration } from "../src/platform/businessWorkspace/model.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"viikkonro-business-browser-"));
execFileSync(process.execPath,["node_modules/vite/bin/vite.js","build","--outDir",path.join(root,"dist")],{env:{...process.env,VITE_TEAM_SUPABASE_URL:"https://business-test.supabase.co",VITE_TEAM_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_browser_fixture"},stdio:"pipe"});
const policy=JSON.parse(fs.readFileSync("vercel.json","utf8")).headers.find(r=>r.source==="/tiimin-lomat/suunnittelu");
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://localhost"),name=url.pathname==="/tiimin-lomat/suunnittelu"?"tiimin-lomat/suunnittelu.html":url.pathname.slice(1),file=path.resolve(root,"dist",name);
 if(!file.startsWith(path.join(root,"dist")+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 const headers=url.pathname==="/tiimin-lomat/suunnittelu"?Object.fromEntries(policy.headers.map(h=>[h.key,h.value])):{};
 res.writeHead(200,{...headers,"Content-Type":name.endsWith(".js")?"text/javascript":name.endsWith(".css")?"text/css":"text/html"});res.end(fs.readFileSync(file));
});
const base=await new Promise(resolve=>server.listen(0,"127.0.0.1",()=>resolve(`http://127.0.0.1:${server.address().port}`)));
const id=(n)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const clients=[{id:id(10),firmId:id(1),name:"Asiakas A Oy"},{id:id(11),firmId:id(1),name:"Asiakas B Oy"}];
const configs=new Map(),versions=new Map();let sequence=200,firmVersion=1,clientVersion=1,overrideRole=null,holdSnapshot=false,holdTemplate=false,holdExport=false;
const pending=[];
const waitForPending=async(count)=>{const until=Date.now()+10000;while(pending.length<count){if(Date.now()>until)throw new Error("Fixture response was not reached");await new Promise(resolve=>setTimeout(resolve,20));}};
let lastPage;
const exports=[];let browser;
const role=(email)=>overrideRole&&email.startsWith("owner")?overrideRole:email.startsWith("owner")?"firm_owner":email.startsWith("manager")?"firm_manager":email.startsWith("admin")?"client_admin":email.startsWith("editor")?"editor":"viewer";
const token=(email)=>`${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({email,sub:id(2),exp:Math.floor(Date.now()/1000)+3600})).toString("base64url")}.fixture`;
const user=(email)=>({id:id(2),email,aud:"authenticated",role:"authenticated",email_confirmed_at:"2026-10-11T00:00:00Z"});
const templates=[{id:id(100),name:"PRIVATE FIRM TEMPLATE",configuration:initialCompanyConfiguration("",2027)}];
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??"/home/link2dawood/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome",headless:true});
 const open=async(email)=>{
  const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();const errors=[],requests=[];
  lastPage=page;
  page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>requests.push(r.url()));
  await context.route("https://business-test.supabase.co/**",async(route)=>{
   const req=route.request(),url=new URL(req.url()),body=req.postDataJSON()??{};
   const reply=(data,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(data)});
   if(url.pathname.includes("/auth/v1/token"))return reply({access_token:token(email),refresh_token:"fixture",expires_in:3600,token_type:"bearer",user:user(email)});
   if(url.pathname.startsWith("/auth/"))return reply({});
   const action=url.pathname.split("/").at(-1),r=role(email),key=`${body.p_client}:${body.p_year??body.p_data?.year}`;
   if(action==="team_list_organizations")return reply(r.startsWith("firm_")?[{id:id(1),name:"Tilitoimisto",role:r==="firm_owner"?"owner":"manager"}]:[]);
   if(action==="business_list")return reply({firms:r.startsWith("firm_")?[{id:id(1),name:"Tilitoimisto",role:r==="firm_owner"?"owner":"manager",plan:"free_preview",clientLimit:1000}]:[],clients:(r.startsWith("firm_")?clients:[clients[email.startsWith("viewer-b")?1:0]]).map(c=>({...c,role:r}))});
   if(action==="business_snapshot"){
    if(!r.startsWith("firm_") && body.p_client!==clients[email.startsWith("viewer-b")?1:0].id)return reply({code:"42501"},403);
    const c=clients.find(c=>c.id===body.p_client),cfg=configs.get(key),data={role:r,firmVersion,client:{...c,version:clientVersion},year:body.p_year,calendar:cfg?{id:id(200+(c.id===id(10)?0:1)),version:versions.get(key),configuration:cfg}:null,access:[],audit:[{id:1,action:"save_calendar",actor_id:id(2),recorded_at:"2026-10-11T00:00:00Z"}],exports:exports.filter(e=>e.client===body.p_client).map(({client,...e})=>e)};
    if(holdSnapshot){holdSnapshot=false;pending.push(()=>reply(data));return;}return reply(data);
   }
   if(action==="business_templates_list"){if(!r.startsWith("firm_"))return reply({code:"42501"},403);if(holdTemplate){holdTemplate=false;pending.push(()=>reply(templates));return;}return reply(templates);}
   if(action==="business_firm_command"){if(body.p_action==="save_template")templates.push({id:id(sequence++),name:body.p_data.name,configuration:initialCompanyConfiguration("",2027)});return reply(id(sequence++));}
   if(action==="business_client_command"){
    if(body.p_action==="save_calendar"){configs.set(key,body.p_data.configuration);versions.set(key,(versions.get(key)??0)+1);clientVersion++;}
    if(body.p_action==="export_record"){exports.push({client:body.p_client,id:id(sequence++),format:body.p_data.format,calendar_version:body.p_data.expected_version,status:"prepared",actor_id:id(2),recorded_at:"2026-10-11T00:00:00Z"});if(holdExport){holdExport=false;pending.push(()=>reply({id:id(sequence++)}));return;}}
    return reply({id:id(sequence++)});
   }
   return reply({code:"42501"},403);
  });
  await page.goto(`${base}/tiimin-lomat/suunnittelu`);
  const form=page.locator(".team-auth form").first();await form.locator('input[name="email"]').fill(email);await form.locator('input[name="password"]').fill("Fixture-password-123");await form.getByRole("button",{name:"Kirjaudu",exact:true}).click();
  await page.getByText("Tilitoimiston asiakasyritykset",{exact:true}).click();
  await page.getByLabel("Asiakasyritys",{exact:true}).selectOption(email.startsWith("viewer-b")?id(11):id(10));
  await page.getByLabel("Asiakaskalenterin vuosi").fill("2027");
  await page.locator(`[data-business-role="${role(email)}"]`).waitFor();
  return{context,page,errors,requests};
 };
 const owner=await open("owner@example.test"),page=owner.page;
 await page.getByLabel("Kalenterin yritysnimi").fill("Ääkköset Tilitoimiston Asiakas A Oy");
 const logoInput=page.getByLabel("Logo (PNG tai SVG)");
 await logoInput.setInputFiles({name:"logo.svg",mimeType:"image/svg+xml",buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#1f7a5c"/></svg>')});
 await page.getByRole("button",{name:"Lisää tapahtuma",exact:true}).click();await page.getByLabel("Tapahtuman 1 päivä").fill("2027-12-31");await page.getByLabel("Tapahtuman 1 otsikko").fill("PRIVATE A, päätöspäivä");
 await page.getByRole("button",{name:"Lisää sulkupäivä",exact:true}).click();await page.getByLabel("Sulkupäivän 1 alku").fill("2027-12-30");await page.getByLabel("Sulkupäivän 1 loppu").fill("2028-01-02");
 await page.getByRole("button",{name:"Tallenna asiakaskalenteri"}).click();await page.getByText("Muutos tallennettu.",{exact:true}).waitFor();
 for(const format of ["PDF","XLSX","CSV","ICS"]){const download=page.waitForEvent("download");await page.getByRole("button",{name:`Vie ${format}`,exact:true}).click();const result=await download;await result.saveAs(path.join(root,`client-a.${format.toLowerCase()}`));await page.getByText("Yksityinen tiedosto valmisteltu.",{exact:false}).waitFor();}
 assert.ok(configs.get(`${id(10)}:2027`).branding.logo.dataUri.startsWith("data:image/svg+xml;base64,"));
 await logoInput.setInputFiles({name:"logo.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAAAEUlEQVR4nGM4ISeHFTFQTwIAbv4ggUBHKgEAAAAASUVORK5CYII=","base64")});
 await page.getByRole("button",{name:"Tallenna asiakaskalenteri"}).click();await page.getByText("Muutos tallennettu.",{exact:true}).waitFor();
 assert.ok(configs.get(`${id(10)}:2027`).branding.logo.dataUri.startsWith("data:image/png;base64,"));
 const pngPdf=page.waitForEvent("download");await page.getByRole("button",{name:"Vie PDF",exact:true}).click();await(await pngPdf).saveAs(path.join(root,"client-a-png.pdf"));await page.getByText("Yksityinen tiedosto valmisteltu.",{exact:false}).waitFor();
 await page.getByLabel("Asiakasyritys",{exact:true}).selectOption(id(11));await page.getByLabel("Kalenterin yritysnimi").fill("Asiakas B Oy");assert.equal(await page.getByLabel("Tapahtuman 1 otsikko").count(),0);
 await page.getByRole("button",{name:"Tallenna asiakaskalenteri"}).click();await page.getByText("Muutos tallennettu.",{exact:true}).waitFor();
 await page.getByLabel("Asiakasyritys",{exact:true}).selectOption(id(10));await page.getByLabel("Tapahtuman 1 otsikko").waitFor();
 await page.getByLabel("Tapahtuman 1 otsikko").fill("UNSAVED PRIVATE DRAFT");
 holdSnapshot=true;await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await waitForPending(1);
 holdTemplate=true;await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await waitForPending(2);
 overrideRole="editor";firmVersion++;clientVersion++;await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await page.locator('[data-business-role="editor"]').waitFor();
 await Promise.all(pending.splice(0).map(fn=>fn()));await page.getByLabel("Tapahtuman 1 otsikko").fill("PRIVATE A, päätöspäivä");
 assert.equal(await page.getByText("PRIVATE FIRM TEMPLATE",{exact:true}).count(),0);assert.equal(await page.getByLabel("Asiakasyritys",{exact:true}).locator("option").count(),2);
 overrideRole="viewer";firmVersion++;clientVersion++;await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await page.locator('[data-business-role="viewer"]').waitFor();assert.equal(await page.getByRole("button",{name:"Tallenna asiakaskalenteri"}).count(),0);
 holdExport=true;let downloadAfterLogout=false;page.on("download",()=>{downloadAfterLogout=true;});await page.getByRole("button",{name:"Vie ICS",exact:true}).click();await waitForPending(1);await page.getByRole("button",{name:"Kirjaudu ulos"}).click();await Promise.all(pending.splice(0).map(fn=>fn()));await page.getByRole("heading",{name:"Kirjaudu sisään"}).waitFor();assert.equal(downloadAfterLogout,false);
 assert.deepEqual(owner.errors,[]);await owner.context.close();overrideRole=null;
 for(const [email,expected] of [["manager@example.test","firm_manager"],["admin@example.test","client_admin"],["editor@example.test","editor"],["viewer-b@example.test","viewer"]]){
  const actor=await open(email),p=actor.page;
  assert.equal(await p.getByRole("button",{name:"Tallenna asiakaskalenteri"}).count(),expected==="viewer"?0:1);
  assert.equal(await p.getByText("Asiakasyrityksen käyttöoikeudet",{exact:true}).count(),expected==="client_admin"?1:0);
  if(expected==="viewer"){assert.equal(await p.getByLabel("Asiakasyritys",{exact:true}).locator("option").count(),2);assert.ok(!(await p.locator("body").textContent()).includes("PRIVATE A"));const download=p.waitForEvent("download");await p.getByRole("button",{name:"Vie ICS",exact:true}).click();await(await download).saveAs(path.join(root,"client-b.ics"));}
  await p.setViewportSize({width:375,height:850});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(await p.evaluate(()=>({local:localStorage.length,session:sessionStorage.length})),{local:0,session:0});assert.deepEqual(actor.errors,[]);assert.ok(actor.requests.every(url=>url.startsWith(base)||url.startsWith("https://business-test.supabase.co/")));await actor.context.close();
 }
 const a=fs.readFileSync(path.join(root,"client-a.ics"),"utf8"),b=fs.readFileSync(path.join(root,"client-b.ics"),"utf8");assert.ok(a.includes("PRIVATE A"));assert.ok(!b.includes("PRIVATE A"));assert.ok(a.includes(id(10)));assert.ok(b.includes(id(11)));
 assert.equal(exports.filter(e=>e.client===id(10)).length,6);assert.equal(exports.filter(e=>e.client===id(11)).length,1);
 console.log(`Business browser checks passed: five roles, scoped clients, drafts/templates cleared after downgrade, delayed reads, logout during export, four formats, CSP, mobile and no analytics/token storage. Artifacts: ${root}`);
}catch(error){if(lastPage){fs.writeFileSync(path.join(root,"failure.html"),await lastPage.content());console.error((await lastPage.locator("body").innerText()).slice(0,2500));console.error("Browser fixture:",root);}throw error;}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
