import assert from "node:assert/strict";
import fs from "node:fs";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || "/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs");
const origin=new URL(process.env.CHECKOUT_TEST_URL || "http://127.0.0.1:4175").origin;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || "/home/link2dawood/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome"});
const errors=[],results=[];
try {
  for(const path of ["/yrityskalenteri","/yrityskalenteri/ics"]) {
    for(const year of [2026,2027,2028]) {
      const context=await browser.newContext(),page=await context.newPage();let payload;
      page.on("pageerror",error=>errors.push(error.message));
      await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException("Unavailable","QuotaExceededError");};});
      await page.route("**/*",async route=>{
        const url=new URL(route.request().url());
        if(url.hostname==="polar.sh")return route.fulfill({contentType:"text/html",body:"<h1>Checkout fixture</h1>"});
        if(url.pathname==="/api/billing/catalog")return route.fulfill({contentType:"application/json",body:JSON.stringify({enabled:true,amountCents:1000,currency:"EUR",term:"calendar-year"})});
        if(url.pathname==="/api/billing/status")return route.fulfill({status:503,contentType:"application/json",body:'{"error":"payment_unavailable"}'});
        if(url.pathname==="/api/billing/checkout") {payload=route.request().postDataJSON();return route.fulfill({contentType:"application/json",body:'{"url":"https://polar.sh/checkout/fixture"}'});}
        if(url.origin!==origin)return route.abort();
        if(["localhost","127.0.0.1"].includes(url.hostname) && route.request().isNavigationRequest()) {
          url.pathname+=".html";
          return route.fulfill({response:await route.fetch({url:url.href})});
        }
        return route.continue();
      });
      await page.goto(origin+path);
      const consent=page.getByRole("button",{name:"Vain välttämättömät"});if(await consent.isVisible())await consent.click();
      await page.getByRole("button",{name:/Osta kalenterin \d{4} lataukset/}).waitFor();
      await page.locator("#cc-year").selectOption(String(year));
      await page.getByRole("button",{name:`Osta kalenterin ${year} lataukset`,exact:true}).waitFor();
      assert.ok(await page.getByRole("link",{name:"Hinta ja ostaminen",exact:true}).isVisible());
      assert.ok((await page.getByRole("status").allTextContents()).some(text=>text.includes("Selaimen tallennustila")));
      const downloadPromise=page.waitForEvent("download");
      await page.getByRole("button",{name:"Tallenna luonnos JSON-tiedostona",exact:true}).click();
      const download=await downloadPromise;assert.equal(download.suggestedFilename(),`yrityskalenteri-${year}-luonnos.json`);
      const file=await download.path(),draft=JSON.parse(fs.readFileSync(file,"utf8"));
      assert.equal(draft.form.year,year);assert.ok(!JSON.stringify(draft).includes("restoreCode"));
      await page.getByRole("link",{name:"Hinta ja ostaminen",exact:true}).click();
      await page.getByRole("button",{name:`Osta kalenterin ${year} lataukset`,exact:true}).click();
      await page.waitForURL("https://polar.sh/checkout/fixture");
      assert.deepEqual(payload,{year,marketingConsent:false,returnTo:path.endsWith("/ics")?"company-ics":"company-calendar"});
      await page.goto(`${origin}${path}?payment=return&year=${year}`);
      await page.waitForFunction(y=>document.querySelector("#cc-year")?.value===String(y),year);
      assert.equal(await page.getByText(`Kalenterin ${year} lataukset on avattu.`,{exact:true}).count(),0,"return URL cannot unlock payment");
      await page.getByLabel("Avaa tallennettu luonnos").setInputFiles({name:"draft.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(draft))});
      await page.getByText("Luonnos on avattu. Latausoikeus tarkistetaan erikseen.",{exact:true}).waitFor();
      await page.getByLabel("Avaa tallennettu luonnos").setInputFiles({name:"invalid.json",mimeType:"application/json",buffer:Buffer.from("null")});
      await page.getByText(/Luonnosta ei voitu avata/).waitFor();
      results.push({path,year,passed:true});await context.close();
    }
  }
  assert.deepEqual(errors,[]);
  console.log(`${results.length} blocked-storage checkout, status-failure, year/tool return, backup and unpaid-authorization checks passed; no JavaScript errors.`);
} finally {await browser.close();}
