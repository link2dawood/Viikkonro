import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { LEGAL_PATHS, LEGAL_UPDATED, refundFaqs } from "../src/data/legalPolicies.js";
import { routeMeta } from "../src/data/seo.js";

test("policy pages are prerendered with canonical URLs, contact and unchanged WebPage identifiers",()=>{
  const sitemap=readFileSync("dist/sitemap.xml","utf8");
  for(const path of LEGAL_PATHS) {
    const html=readFileSync(`dist${path}.html`,"utf8");
    assert.equal((html.replace(/<!--[\s\S]*?-->/g,"").match(/<h1>/g)||[]).length,1,path);
    assert.ok(html.includes(`<title>${routeMeta[path].title}</title>`),path);
    assert.ok(html.includes(`rel="canonical" href="https://viikkonro.fi${path}"`),path);
    assert.ok(sitemap.includes(`<loc>https://viikkonro.fi${path}</loc>`),path);
    const nodes=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])["@graph"]);
    const pages=nodes.filter(n=>n["@id"]===`https://viikkonro.fi${path}#webpage`);
    assert.equal(pages.length,1,path);assert.equal(pages[0]["@type"],"WebPage",path);assert.equal(pages[0].dateModified,LEGAL_UPDATED,path);
    for(const target of LEGAL_PATHS)assert.ok(html.includes(`href="${target}"`),path);
    assert.ok(html.includes("hi@viikkonro.fi"),path);
    assert.ok(html.includes("Dawood Zafar"),path);
    assert.ok(html.includes('href="https://dawoodzafar.us"'),path);
    assert.ok(html.includes('href="https://wa.me/9230633301114"'),path);
    assert.ok(html.includes("se ei ole rekisteröity yritys"),path);
    assert.ok(!html.includes("Rekisteritunnus:"),path);
  }
});
test("refund FAQ schema matches visible content and cancellation remains public and masked",()=>{
  const html=readFileSync("dist/palautusehdot.html","utf8");
  const nodes=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>JSON.parse(m[1])["@graph"]);
  const faq=nodes.find(n=>n["@type"]==="FAQPage");assert.ok(faq);
  assert.deepEqual(faq.mainEntity.map(q=>({q:q.name,a:q.acceptedAnswer.text})),refundFaqs());
  assert.ok(html.includes('id="peruuttaminen"'));assert.ok(html.includes('data-clarity-mask="True"'));
  assert.ok(html.includes("Käyttämättömän ostoksen palautus"));
  assert.ok(html.includes("Käyttämättömyyttä koskeva ehto ei rajoita kuluttajan pakottavia oikeuksia"));
  assert.ok(!html.includes('name="robots" content="noindex'));
  assert.ok(readFileSync("dist/yrityskalenteri.html","utf8").includes('href="/palautusehdot#peruuttaminen"'));
});
test("footer links stay Finnish on English route and generated AI index includes refund instructions",()=>{
  const html=readFileSync("dist/en.html","utf8");
  assert.match(html,/<a[^>]*hrefLang="fi"[^>]*href="\/palautusehdot"[^>]*>Refunds and cancellation \(Finnish\)<\/a>/i);
  for(const file of ["dist/llms.txt","dist/ai.txt","dist/llms-full.txt"])assert.ok(readFileSync(file,"utf8").includes("/palautusehdot"),file);
});
test("cancellation mail credentials and server implementation never enter the browser bundle",()=>{
  for(const file of readdirSync("dist/assets").filter(name=>name.endsWith(".js"))) {
    const script=readFileSync(`dist/assets/${file}`,"utf8");
    for(const serverValue of ["MAILJET_SECRET_KEY","BILLING_SUPABASE_SECRET","PURCHASE_SIGNING_SECRET","api.mailjet.com/v3.1/send","sendWithdrawal"])
      assert.ok(!script.includes(serverValue),`${file}: ${serverValue}`);
  }
});
