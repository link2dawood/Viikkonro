import { build } from "vite";
import fs from "node:fs";
await build({ configFile: false, publicDir: false, build: {
  target: "es2020", outDir: "dist/widget/calendar", emptyOutDir: false,
  lib: { entry: "src/platform/widget/runtime.js", name: "ViikkonroCalendarV1", formats: ["iife"], fileName: () => "v1.js" },
  reportCompressedSize: true,
} });
fs.writeFileSync("dist/widget/calendar/v1.html", `<!doctype html>
<html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, follow"><meta name="referrer" content="no-referrer"><title>Viikkonro yrityskalenteri</title>
<style>
:root{--bg:#fff;--ink:#15211f;--line:#b9c4bf;--accent:#1f7a5c;color-scheme:light}
:root[data-theme=dark]{--bg:#15211f;--ink:#f3f7f5;--line:#82978c;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;padding:12px;font:14px system-ui,sans-serif;background:var(--bg);color:var(--ink)}h1,h2{font-size:1.15rem;margin:0;overflow-wrap:anywhere}h1{margin-bottom:12px}nav{display:flex;align-items:center;justify-content:space-between;gap:10px}nav h2{text-align:center}button{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;min-width:44px;min-height:44px;font-size:1.4rem;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid var(--ink);outline-offset:2px}button:disabled{opacity:.4;cursor:default}.summary,.note{font-size:.85rem}table{width:100%;table-layout:fixed;border-collapse:collapse}caption{text-align:left;font-size:.85rem;padding:8px 0}th,td{border:1px solid var(--line);padding:5px;vertical-align:top;text-align:left;overflow-wrap:anywhere}th:first-child{width:32px}td{height:64px}time{font-weight:700}span{display:block;font-size:.72rem;margin-top:4px}.holiday{font-weight:600}.event{border-inline-start:3px solid var(--accent);padding-inline-start:3px}[aria-current=date]{outline:2px solid var(--ink);outline-offset:-2px}a{color:var(--ink);font-size:.85rem}@media(max-width:400px){body{padding:6px}th,td{padding:3px}span{font-size:.65rem}h1,h2{font-size:1rem}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style><script defer src="/widget/calendar/v1.js"></script></head><body><main id="calendar"><p>Kalenteri latautuu.</p></main><noscript>Kalenteri tarvitsee JavaScriptin. <a href="https://viikkonro.fi">Avaa Viikkonro.fi</a>.</noscript></body></html>`);
