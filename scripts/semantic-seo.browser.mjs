import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs");
const base=process.env.SEMANTIC_TEST_URL || "http://127.0.0.1:4173";
const origin=new URL(base).origin;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || "/home/link2dawood/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome"});
const paths=["/","/mika-on-viikkonumero","/viikko-53-2026","/kuukausi-2-2028","/vuosi-2027","/pyhat-2027/joulupaiva","/liputuspaivat-2027","/koululomat-2027","/tyopaivat-2027","/lomasuunnittelija","/palkkapaivat-2027","/projektiaikataulu","/rakennuskalenteri","/hr-kalenteri","/tiimin-lomat","/kalenteripohjat","/data/week","/yrityskalenteri","/yrityskalenteri/ics","/auringonlasku-helsinki","/nimipaiva/elmer","/raskauslaskuri","/tietolahteet"];
const results=[];
const output="/tmp/viikkonro-semantic-browser";mkdirSync(output,{recursive:true});
try {
  const page=await browser.newPage();const errors=[];
  page.on("pageerror",e=>errors.push({url:page.url(),message:e.message}));
  await page.route("**/*",route=>new URL(route.request().url()).origin===origin ? route.continue() : route.abort());
  for (const width of [390,1280]) {
    await page.setViewportSize({width,height:900});
    for (const path of paths) {
      await page.goto(`${origin}${path}`);
      const guide=page.locator(".topic-guide");await guide.waitFor();
      assert.equal(await guide.count(),1,path);
      assert.equal(await page.getByRole("heading",{level:1}).count(),1,path);
      const layout=await guide.evaluate(node=>({right:node.getBoundingClientRect().right,left:node.getBoundingClientRect().left,width:innerWidth,overflow:node.scrollWidth>node.clientWidth+1}));
      assert.ok(layout.left>=-1 && layout.right<=layout.width+1 && !layout.overflow,`${path} ${width}: guide overflow`);
      const links=guide.locator("li a");assert.ok(await links.count()>0,path);
      await links.first().focus();assert.ok(await links.first().evaluate(a=>a===document.activeElement),path);
      await page.emulateMedia({media:"print"});assert.equal(await guide.isVisible(),false,path);await page.emulateMedia({media:"screen"});
      results.push({path,width,topic:await guide.getAttribute("data-topic-id"),passed:true});
    }
  }
  await page.goto(`${origin}/hr-kalenteri`);await page.locator(".topic-guide").scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/desktop.png`});
  await page.setViewportSize({width:390,height:900});await page.goto(`${origin}/hr-kalenteri`);await page.locator(".topic-guide").scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/mobile.png`});
  if(origin==="https://viikkonro.fi") {
    await page.goto(`${origin}/yrityskalenteri`);
    const purchase=page.locator('section[aria-label="Yrityskalenterin osto"]');
    await purchase.getByRole("button",{name:/Osta kalenterin/}).waitFor();assert.match(await purchase.innerText(),/10,00\s*€/u);
  }
  writeFileSync(`${output}/results.json`,JSON.stringify({results,errors},null,2));
  assert.deepEqual(errors,[]);
  console.log(`${results.length} topic-guide browser checks passed; no JavaScript errors.`);
} finally {await browser.close();}
