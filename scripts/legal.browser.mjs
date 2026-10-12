import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || "/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs");
const origin=new URL(process.env.LEGAL_TEST_URL || "http://127.0.0.1:4173").origin;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || "/home/link2dawood/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome"});
const paths=["/tietoa-meista","/tietosuoja","/kayttoehdot","/palautusehdot"];
const uuid="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const output="/tmp/viikkonro-legal-browser";mkdirSync(output,{recursive:true});
const results=[],errors=[];
try {
  const page=await browser.newPage();page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/*",route=>new URL(route.request().url()).origin===origin ? route.continue() : route.abort());
  for(const width of [390,1280]) {
    await page.setViewportSize({width,height:900});
    for(const path of paths) {
      await page.goto(`${origin}${path}`);await page.locator(".legal-navigation").waitFor();
      const necessary=page.getByRole("button",{name:"Vain välttämättömät"});if(await necessary.isVisible())await necessary.click();
      assert.equal(await page.getByRole("heading",{level:1}).count(),1,path);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"),`https://viikkonro.fi${path}`);
      assert.equal(await page.locator(".site-footer").count(),1,path);
      assert.equal(await page.locator(".legal-navigation a").count(),4,path);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} ${width}: overflow`);
      results.push({path,width,passed:true});
    }
  }
  let attempts=0,payload=null,mode="success";
  await page.route("**/api/billing/withdrawal",async route=>{
    attempts++;payload=route.request().postDataJSON();
    await new Promise(resolve=>setTimeout(resolve,150));
    await route.fulfill({status:mode==="success" ? 202 : mode==="mismatch" ? 400 : 503,contentType:"application/json",body:JSON.stringify(mode==="success" ? {id:uuid,receivedAt:"2026-10-11T20:00:00Z"} : {error:mode==="mismatch" ? "order_not_verified" : "unavailable"})});
  });
  const fill=async()=>{
    await page.locator("#withdraw-name").fill("Ääkkönen Oy");await page.locator("#withdraw-email").fill("buyer@example.com");await page.locator("#withdraw-order").fill(uuid);
    await page.getByRole("button",{name:"Tarkista peruuttamisilmoitus"}).click();
  };
  await page.goto(`${origin}/palautusehdot#peruuttaminen`);
  await page.getByRole("button",{name:"Tarkista peruuttamisilmoitus"}).click();assert.equal(await page.getByRole("button",{name:"Vahvista peruuttaminen"}).count(),0);
  await page.setViewportSize({width:390,height:900});
  await page.locator("#withdraw-name").fill("Ä".repeat(160));await page.locator("#withdraw-email").fill("buyer@example.com");await page.locator("#withdraw-order").fill(uuid);
  await page.getByRole("button",{name:"Tarkista peruuttamisilmoitus"}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"long Finnish name review overflow");
  await page.getByRole("button",{name:"Muokkaa tietoja"}).click();
  await fill();assert.equal(attempts,0);assert.ok(await page.getByRole("button",{name:"Vahvista peruuttaminen"}).isVisible());
  await page.getByRole("button",{name:"Muokkaa tietoja"}).click();assert.equal(await page.locator("#withdraw-name").inputValue(),"Ääkkönen Oy");
  await page.getByRole("button",{name:"Tarkista peruuttamisilmoitus"}).click();
  const confirm=page.getByRole("button",{name:"Vahvista peruuttaminen"});await confirm.click();
  assert.ok(await page.getByRole("button",{name:"Lähetetään..."}).isDisabled());
  await page.locator('#peruuttaminen [role="status"]').waitFor();assert.equal(attempts,1);assert.deepEqual(payload,{name:"Ääkkönen Oy",email:"buyer@example.com",orderId:uuid,confirmed:true});
  assert.match(await page.locator('#peruuttaminen [role="status"]').innerText(),/Maksua ei ole vielä automaattisesti palautettu/);
  assert.equal(await page.locator("#peruuttaminen").getAttribute("data-clarity-mask"),"True");
  for(const failure of ["mismatch","unavailable"]) {
    mode=failure;await page.goto(`${origin}/palautusehdot`);await fill();await page.getByRole("button",{name:"Vahvista peruuttaminen"}).click();
    await page.locator('#peruuttaminen [role="alert"]').waitFor();assert.ok(await page.locator('#peruuttaminen a[href="mailto:hi@viikkonro.fi"]').isVisible());
    assert.ok(await page.getByRole("button",{name:"Vahvista peruuttaminen"}).isEnabled());
  }
  await page.setViewportSize({width:390,height:900});await page.goto(`${origin}/palautusehdot#peruuttaminen`);await page.locator("#peruuttaminen").scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/mobile.png`});
  await page.emulateMedia({media:"print"});assert.equal(await page.locator("#peruuttaminen").isVisible(),false);await page.emulateMedia({media:"screen"});
  await page.goto(`${origin}/en`);assert.equal(await page.locator('.site-footer a[href="/palautusehdot"]').getAttribute("hreflang"),"fi");
  assert.deepEqual(errors,[]);writeFileSync(`${output}/results.json`,JSON.stringify({results,attempts,errors},null,2));
  console.log(`${results.length} legal-page desktop/mobile checks and cancellation validation/review/success/failure/print checks passed; no JavaScript errors.`);
} finally {await browser.close();}
