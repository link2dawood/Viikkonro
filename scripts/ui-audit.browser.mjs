// Read-only audit of the built site. Does not submit forms, buy products or send emails.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_AUDIT_URL || "http://localhost:4173";
const output = process.env.UI_AUDIT_OUTPUT || "/tmp/viikkonro-ui-audit";
mkdirSync(output, { recursive: true });
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? htmlFiles(path.join(dir, entry.name)) : entry.name.endsWith(".html") ? [path.join(dir, entry.name)] : []);
}
const files = htmlFiles("dist");
const selectedRoutes = process.env.UI_AUDIT_ROUTES?.split(",").map(route => route.trim());
const routes = files.filter(file => !/http-equiv=["']refresh/i.test(readFileSync(file,"utf8"))).map(file => {
  const relative = path.relative("dist",file).replaceAll(path.sep,"/");
  return relative === "index.html" ? "/" : "/"+relative.replace(/\.html$/,"");
}).filter(route => route !== "/404" && !route.startsWith("/widget/") && (!selectedRoutes || selectedRoutes.includes(route)));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const results = []; let index=0;
const tasks = routes.flatMap(route => [390,1280].map(width => ({route,width})));
try {
  await Promise.all(Array.from({length:4},async () => {
    const context=await browser.newContext(); const page=await context.newPage();
    let errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("**/*",async requestRoute=>{
      const url=new URL(requestRoute.request().url());
      if(url.origin!==new URL(base).origin) return requestRoute.abort();
      if(new URL(base).hostname==="localhost" && requestRoute.request().isNavigationRequest() && url.pathname!=="/" && !url.pathname.endsWith(".html")) {
        url.pathname+=".html";
        return requestRoute.fulfill({response:await requestRoute.fetch({url:url.href})});
      }
      return requestRoute.continue();
    });
    while(index<tasks.length) {
      const task=tasks[index++]; errors=[];
      try {
        await page.setViewportSize({width:task.width,height:900});
        const response=await page.goto(base+task.route,{waitUntil:"domcontentloaded",timeout:15000});
        await page.evaluate(()=>document.fonts.ready);
        const result=await page.evaluate(()=>{
          const visible=el=>{
            const style=getComputedStyle(el);
            const closed=el.closest("details:not([open])");
            return el.getBoundingClientRect().width>0 && el.getBoundingClientRect().height>0 && style.visibility!=="hidden" && style.opacity!=="0" && !el.closest('[aria-hidden="true"]') && (!closed || closed.querySelector("summary")?.contains(el));
          };
          const description=el=>({tag:el.tagName,text:(el.innerText || el.getAttribute("aria-label") || el.name || el.id || "").trim().slice(0,110),class:el.className});
          const all=[...document.querySelectorAll("main *")];
          const controls=[...document.querySelectorAll("main button, main input, main select, main textarea")].filter(visible);
          const ids=[...document.querySelectorAll("[id]")].map(el=>el.id);
          return {
            h1:document.querySelectorAll("h1").length,main:document.querySelectorAll("main").length,
            header:document.querySelectorAll("header.nav").length,footer:document.querySelectorAll("footer.site-footer").length,
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            protruding:all.filter(el=>visible(el) && el.getBoundingClientRect().right>innerWidth+2 && !el.closest(".table-wrap,.tpl-table,.team-scroll,.hr-table,.code-block,pre")).slice(0,8).map(description),
            nativeButtons:controls.filter(el=>el.tagName==="BUTTON" && getComputedStyle(el).borderRadius==="0px" && !el.classList.contains("btn-link")).map(description),
            nativeSelects:controls.filter(el=>el.tagName==="SELECT" && getComputedStyle(el).borderRadius==="0px").map(description),
            unlabelled:controls.filter(el=>el.tagName!=="BUTTON" && el.type!=="hidden" && !el.labels?.length && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")).map(description),
            emptyButtons:controls.filter(el=>el.tagName==="BUTTON" && !el.innerText.trim() && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !el.getAttribute("title")).map(description),
            duplicateIds:[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))],
            smallControls:controls.filter(el=>{const r=el.getBoundingClientRect();return el.tagName==="BUTTON" && (r.height<24 || r.width<24);}).map(description),
          };
        });
        results.push({...task,status:response.status(),...result,errors:[...errors]});
      } catch(error) { results.push({...task,auditError:error.message}); }
      if(results.length%100===0) console.log(`Audited ${results.length}/${tasks.length} page/viewport combinations`);
    }
    await context.close();
  }));
} finally {await browser.close();}
writeFileSync(path.join(output,"results.json"),JSON.stringify({base,routeCount:routes.length,results},null,2));
const issues=results.filter(r=>r.auditError || r.status>=400 || r.errors?.length || r.overflow || r.protruding?.length || r.nativeButtons?.length || r.nativeSelects?.length || r.unlabelled?.length || r.emptyButtons?.length || r.duplicateIds?.length || r.smallControls?.length || r.h1!==1 || r.main!==1 || r.header!==1 || r.footer!==1);
writeFileSync(path.join(output,"findings.json"),JSON.stringify(issues,null,2));
console.log(JSON.stringify({routes:routes.length,viewports:results.length,flagged:issues.length,output}));
