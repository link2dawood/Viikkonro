import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync, spawn } from "node:child_process";
// Dedicated disposable cluster: never connect to an existing application database.
const bin = process.env.TEAM_POSTGRES_BIN ?? "/usr/lib/postgresql/16/bin";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "viikkonro-team-db-"));
const data = path.join(root, "data");
const run = (name, args) => execFileSync(path.join(bin, name), args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
let started = false;
try {
  run("initdb", ["-D", data, "--auth=trust", "--no-locale", "--encoding=UTF8"]);
  run("pg_ctl", ["-D", data, "-l", path.join(root, "postgres.log"), "-o", `-k ${root} -c listen_addresses=''`, "-w", "start"]); started = true;
  const args = ["-h", root, "-d", "postgres", "-v", "ON_ERROR_STOP=1"];
  run("psql", [...args, "-c", "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;"]);
  run("psql", [...args, "-f", "supabase/migrations/202610100001_team_leave.sql"]);
  run("psql", [...args, "-f", "supabase/migrations/202610100002_shift_planner.sql"]);
  run("psql", [...args, "-c", "create role service_role bypassrls;"]);
  run("psql", [...args, "-c", "alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant all on sequences to anon,authenticated,service_role; alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;"]);
  run("psql", [...args, "-f", "supabase/migrations/202610100003_business_api.sql"]);
  run("psql", [...args, "-f", "supabase/migrations/202610110004_business_platform.sql"]);
  run("psql", [...args, "-f", "supabase/migrations/202610110005_billing.sql"]);
  run("psql", [...args, "-f", "supabase/migrations/202610110006_commerce_limits.sql"]);
  run("psql", [...args, "-f", "supabase/migrations/202610110007_purchase_records.sql"]);
  run("psql", [...args, "-f", "supabase/migrations/202610110008_purchase_consent_constraint.sql"]);
  const result = spawnSync(path.join(bin, "psql"), [...args, "-f", "scripts/team-db.cases.sql"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message);
  const shifts = spawnSync(path.join(bin, "psql"), [...args, "-f", "scripts/shift-db.cases.sql"], { encoding: "utf8" });
  if (shifts.status !== 0) throw new Error(shifts.stderr || shifts.error?.message);
  const api = spawnSync(path.join(bin, "psql"), [...args, "-f", "scripts/business-api-db.cases.sql"], { encoding: "utf8" });
  if (api.status !== 0) throw new Error(api.stderr || api.error?.message);
  const business = spawnSync(path.join(bin, "psql"), [...args, "-f", "scripts/business-platform-db.cases.sql"], { encoding: "utf8" });
  if (business.status !== 0) throw new Error(business.stderr || business.error?.message);
  const billing=spawnSync(path.join(bin,"psql"),[...args,"-f","scripts/billing-db.cases.sql"],{encoding:"utf8"});
  if(billing.status!==0)throw new Error(billing.stderr || billing.error?.message);
  run("psql", [...args,"-f","scripts/commerce-db.cases.sql"]);
  const purchases = spawnSync(path.join(bin, "psql"), [...args, "-f", "scripts/purchase-db.cases.sql"], { encoding: "utf8" });
  if (purchases.status !== 0) throw new Error(purchases.stderr || purchases.error?.message);
  const assertions = (result.stderr.match(/NOTICE:  PASS:/g) ?? []).length + (shifts.stderr.match(/NOTICE:  PASS:/g) ?? []).length + (api.stderr.match(/NOTICE:  PASS:/g) ?? []).length + (business.stderr.match(/NOTICE:  PASS:/g) ?? []).length + (billing.stderr.match(/NOTICE:  PASS:/g) ?? []).length + (purchases.stderr.match(/NOTICE:  PASS:/g) ?? []).length;
  const invoiceWorkers = Array.from({ length: 8 }, () => new Promise((resolve, reject) => {
    const worker = spawn(path.join(bin, "psql"), [...args, "-Atc", "set role service_role; select public.commerce_invoice_claim('10000000-0000-4000-8000-000000000003')->>'status';"], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "", errors = "";
    worker.stdout.on("data", chunk => { output += chunk; });
    worker.stderr.on("data", chunk => { errors += chunk; });
    worker.on("error", reject);
    worker.on("close", code => code === 0 ? resolve(output.trim().split("\n").at(-1)) : reject(new Error(errors)));
  }));
  const invoiceResults = await Promise.all(invoiceWorkers);
  if (invoiceResults.filter(value => value === "claimed").length !== 1 || invoiceResults.filter(value => value === "busy").length !== 7) throw new Error("Concurrent invoice send claim bypass");
  // Eight distinct connections contend for one remaining request, like serverless workers.
  run("psql", [...args, "-c", "insert into private.business_api_keys(key_hash,label,minute_limit) values(repeat('b',64),'Concurrent API',1);"]);
  const apiWorkers = Array.from({ length: 8 }, () => new Promise((resolve, reject) => {
    const worker = spawn(path.join(bin, "psql"), [...args, "-Atc", "set role service_role; select public.business_api_consume(repeat('b',64),'week')->>'status';"], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "", errors = "";
    worker.stdout.on("data", (chunk) => { output += chunk; });
    worker.stderr.on("data", (chunk) => { errors += chunk; });
    worker.on("error", reject);
    worker.on("close", (code) => code === 0 ? resolve(output.trim().split("\n").at(-1)) : reject(new Error(errors)));
  }));
  const apiResults = await Promise.all(apiWorkers);
  if (apiResults.filter((value) => value === "ok").length !== 1 || apiResults.filter((value) => value === "rate_limit").length !== 7) throw new Error("Concurrent API quota bypass");
  run("psql", [...args, "-c", "select public.test_assert((select month_used=1 from private.business_api_keys where key_hash=repeat('b',64)),'concurrent requests cannot overspend quota');"]);
  const billingAccount=run("psql",[...args,"-Atc","select id from private.billing_accounts where user_id='00000000-0000-0000-0000-000000000001'"]).trim();
  const billingWorkers=Array.from({length:8},()=>new Promise((resolve,reject)=>{
    const worker=spawn(path.join(bin,"psql"),[...args,"-Atc",`set role service_role;select public.billing_usage_consume('${billingAccount}',0,'business-calendar-api','requests','[{"period":"minute","max":1},{"period":"month","max":10}]',1,clock_timestamp()+interval '1 day')->>'status';`],{stdio:["ignore","pipe","pipe"]});
    let output="",errors="";worker.stdout.on("data",chunk=>{output+=chunk;});worker.stderr.on("data",chunk=>{errors+=chunk;});worker.on("error",reject);worker.on("close",code=>code===0?resolve(output.trim().split("\n").at(-1)):reject(new Error(errors)));
  }));
  const billingResults=await Promise.all(billingWorkers);
  if(billingResults.filter(s=>s==="ok").length!==1 || billingResults.filter(s=>s==="usage_limit").length!==7)throw new Error("Concurrent billing quota bypass");
  run("psql",[...args,"-c",`select public.test_assert((select sum(used) from private.billing_usage where account_id='${billingAccount}')=2,'concurrent billing request consumes one minute and one month unit');`]);
  const firm = run("psql", [...args,"-Atc","select id from public.team_organizations where name='Accounting Firm A'"]).trim();
  const clientD = run("psql", [...args,"-Atc",`set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'; select public.business_firm_command('${firm}','create_client','{"name":"Race Client D"}');`]).trim().split("\n").at(-1);
  const businessRace = async (change,writer,user) => {
    const holder=spawn(path.join(bin,"psql"),args,{stdio:["pipe","pipe","pipe"]});let holderErrors="";
    holder.stderr.on("data",chunk=>{holderErrors+=chunk;});
    const done=new Promise(resolve=>holder.on("close",resolve));
    const acquired=new Promise((resolve,reject)=>{holder.stdout.on("data",chunk=>{if(chunk.toString().includes("BUSINESS_LOCKED"))resolve();});holder.on("close",()=>reject(new Error(holderErrors)));});
    holder.stdin.end(`set role authenticated;set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';begin;${change};select 'BUSINESS_LOCKED';select pg_sleep(0.5);commit;`);
    await acquired;
    const worker=spawn(path.join(bin,"psql"),[...args,"-v","VERBOSITY=verbose"],{stdio:["pipe","pipe","pipe"]});let errors="";
    worker.stderr.on("data",chunk=>{errors+=chunk;});const workerDone=new Promise(resolve=>worker.on("close",resolve));
    worker.stdin.end(`set role authenticated;set request.jwt.claim.sub='${user}';${writer};`);
    if(await workerDone===0 || await done!==0 || !errors.includes("42501"))throw new Error("Business revocation race allowed stale writer: "+errors+holderErrors);
  };
  const businessWrite=`select public.business_client_command('${clientD}','save_calendar','{"year":2027,"expected_version":0,"configuration":{"version":1,"year":2027}}')`;
  await businessRace(`select public.team_command('${firm}','revoke_access',jsonb_build_object('expected_version',(select version from public.team_organizations where id='${firm}'),'user_id','00000000-0000-0000-0000-000000000003'))`,businessWrite,'00000000-0000-0000-0000-000000000003');
  run("psql",[...args,"-c",`set role authenticated;set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';select public.business_client_command('${clientD}','grant_access','{"email":"outsider@example.test","role":"editor"}');`]);
  await businessRace(`select public.business_client_command('${clientD}','revoke_access','{"userId":"00000000-0000-0000-0000-000000000005"}')`,businessWrite,'00000000-0000-0000-0000-000000000005');
  // Empty synthetic billing accounts are removed by the test operator. Real
  // accounts deliberately block tenant deletion until a retention/closure flow.
  run("psql",[...args,"-c",`delete from private.billing_accounts where organization_id='${firm}';`]);
  run("psql", [...args,"-c",`set role authenticated;set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';select public.team_command('${firm}','delete_organization',jsonb_build_object('expected_version',(select version from public.team_organizations where id='${firm}')));reset role;select public.test_assert((select count(*) from public.business_firms where organization_id='${firm}')=0,'firm deletion removes enablement');select public.test_assert((select count(*) from public.business_clients where organization_id='${firm}')=0,'firm deletion removes all client companies');select public.test_assert((select count(*) from public.business_audit where organization_id='${firm}')=0,'firm deletion removes private audit history');select public.test_assert((select count(*) from public.business_clients c join public.team_organizations o on o.id=c.organization_id where o.name='Accounting Firm B')=1,'firm deletion preserves another firm client');`]);
  const org = run("psql", [...args, "-Atc", "select id from public.team_organizations where name='Organization A'"]).trim();
  const owner = spawn(path.join(bin, "psql"), args, { stdio: ["pipe", "pipe", "pipe"] });
  const ownerDone = new Promise((resolve) => owner.on("close", resolve));
  let ownerErrors = ""; owner.stderr.on("data", (chunk) => { ownerErrors += chunk; });
  const locked = new Promise((resolve, reject) => {
    owner.stdout.on("data", (chunk) => { if (chunk.toString().includes("LOCKED")) resolve(); });
    owner.on("close", () => reject(new Error("Concurrent owner transaction failed: " + ownerErrors)));
  });
  owner.stdin.end(`set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'; begin; select public.team_command('${org}','revoke_access',jsonb_build_object('expected_version',(select version from public.team_organizations where id='${org}'),'user_id','00000000-0000-0000-0000-000000000003')); select 'LOCKED'; select pg_sleep(0.8); commit;`);
  await locked;
  const manager = spawn(path.join(bin, "psql"), [...args, "-v", "VERBOSITY=verbose"], { stdio: ["pipe", "pipe", "pipe"] });
  let managerErrors = ""; manager.stderr.on("data", (chunk) => { managerErrors += chunk; });
  const managerDone = new Promise((resolve) => manager.on("close", resolve));
  manager.stdin.end(`set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003'; select public.team_command('${org}','closure','{"expected_version":13,"label":"Blocked","start_date":"2027-07-01","end_date":"2027-07-02"}');`);
  const managerCode = await managerDone, ownerCode = await ownerDone;
  if (ownerCode !== 0 || managerCode === 0 || !managerErrors.includes("42501")) throw new Error("Concurrent revoked writer must be forbidden after the lock: " + managerErrors + ownerErrors);
  run("psql", [...args, "-c", `set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'; select public.team_command('${org}','delete_organization',jsonb_build_object('expected_version',(select version from public.team_organizations where id='${org}'))); reset role; select public.test_assert((select count(*) from public.team_organizations where id='${org}')=0,'organization deletion succeeds'); select public.test_assert((select count(*) from public.team_leaves where organization_id='${org}')=0,'organization data deleted'); select public.test_assert((select count(*) from public.team_organizations where name='Organization B')=1,'deletion preserves other tenant');`]);
  console.log(`${assertions + 21} authorization and tenant isolation assertions passed, including business firm/client revocation races, commerce/billing/API quotas and tenant-scoped deletion. Isolated cluster: ${root}`);
} catch (error) {
  console.error(error.stderr?.toString() ?? error.message); process.exitCode = 1;
} finally { if (started) run("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]); }
