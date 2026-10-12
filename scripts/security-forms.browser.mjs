// Local-only adversarial UI checks. All third-party/API traffic is blocked or mocked.
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.SECURITY_BROWSER_URL || "http://localhost:4173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Run destructive input checks locally.");
const output = process.env.SECURITY_BROWSER_OUTPUT || "/tmp/viikkonro-security-browser";
mkdirSync(output, { recursive:true });
const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}:{}) });
const results = [];
try {
  const context = await browser.newContext(), page = await context.newPage();
  page.setDefaultTimeout(10000);
  let errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(base).origin) return route.abort();
    if (url.pathname.startsWith("/api/")) return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({enabled:false,paid:false})});
    if (route.request().isNavigationRequest() && url.pathname !== "/" && !url.pathname.endsWith(".html")) {
      url.pathname += ".html";
      return route.fulfill({response:await route.fetch({url:url.href})});
    }
    return route.continue();
  });
  await page.addInitScript(() => { window.__securityExecuted = false; });
  const payload = '<img src=x onerror="window.__securityExecuted=true">';
  for (const path of ["/yrityskalenteri","/yrityskalenteri/ics","/hr-kalenteri","/rakennuskalenteri","/lomasuunnittelija","/projektiaikataulu","/sprinttisuunnittelija","/tyopaivalaskuri","/paivamaaralaskuri","/paivien-erotus","/tuntilaskuri","/ikalaskuri","/vuosilomalaskuri","/raskauslaskuri","/kuukautislaskuri","/ota-yhteytta","/tiimin-lomat/suunnittelu"]) {
    for (const kind of ["empty","small","large","injection"]) {
      errors = [];
      await page.goto(base+path);
      const controls = page.locator('main input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="submit"]), main textarea');
      let changed = 0;
      for (let i=0;i<await controls.count();i++) {
        const input = controls.nth(i);
        if (!await input.isVisible() || !await input.isEnabled()) continue;
        const type = await input.getAttribute("type");
        if (kind === "injection" && ["date","time","number"].includes(type)) continue;
        const value = kind === "empty" ? "" : type === "date" ? (kind === "small" ? "2000-01-01":"2100-12-31") : type === "time" ? (kind === "small"?"00:00":"23:59") : type === "number" ? (kind === "small"?"-1":"999999999") : kind === "injection" ? payload : kind === "small" ? "a" : "x".repeat(10000);
        await input.fill(value);
        changed++;
      }
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      const executed = await page.evaluate(() => window.__securityExecuted);
      const main = await page.locator("main").count();
      const row = {path,kind,changed,errors:[...errors],executed,main,passed:!errors.length&&!executed&&main===1};
      results.push(row); console.log(JSON.stringify(row));
    }
  }
  for (const raw of ["null","[]","{",JSON.stringify({v:1,form:{year:2027,layout:"constructor",paper:"constructor",events:[null,{},1],closures:{},paydayDates:{}}}),JSON.stringify({v:1,form:{year:2027,companyName:payload,events:Array.from({length:1000},(_,i)=>({id:`e${i}`,date:"2027-01-01",title:payload}))}})]) {
    await page.goto(base+"/yrityskalenteri");
    await page.evaluate(raw => localStorage.setItem("viikkonro:company-calendar:draft:v1",raw),raw);
    errors=[];
    await page.reload();
    await page.getByLabel("Yrityksen nimi",{exact:true}).waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const executed=await page.evaluate(()=>window.__securityExecuted);
    results.push({path:"/yrityskalenteri",kind:"corrupt stored draft",bytes:raw.length,errors:[...errors],executed,passed:!errors.length&&!executed});
  }
  writeFileSync(output+"/results.json",JSON.stringify(results,null,2));
  console.log(JSON.stringify({cases:results.length,failed:results.filter(r=>!r.passed).length,output}));
  process.exitCode=results.some(r=>!r.passed)?1:0;
} finally {await browser.close();}
