// Isolated local subprocesses: bounded adversarial CPU/memory checks, no network calls.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const moduleUrl = path => new URL(path, root).href;
const output = process.env.SECURITY_AUDIT_OUTPUT || "/tmp/viikkonro-security-resource-audit";
mkdirSync(output, { recursive:true });
const results = [];
for (const [name, code] of [
  ["working days 2026-2028", `import {calculateDaysBetween} from '${moduleUrl("src/data/workingDaysContent.js")}';calculateDaysBetween('2026-01-01','2028-12-31');`],
  ["working days 0100-9999", `import {calculateDaysBetween} from '${moduleUrl("src/data/workingDaysContent.js")}';calculateDaysBetween('0100-01-01','9999-12-31');`],
  ["SVG malformed CSS url repetitions", `import {validateBranding} from '${moduleUrl("src/platform/design/branding.js")}';const svg='<svg><style>'+'url('.repeat(60000)+'</style></svg>';validateBranding({logo:{dataUri:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')}});`],
]) {
  const start = performance.now();
  const child = spawnSync(process.execPath,["--max-old-space-size=128","--input-type=module","-e",code],{timeout:5000,maxBuffer:4096});
  const row = {name,durationMs:Math.round(performance.now()-start),exit:child.status,signal:child.signal,error:child.error?.code??null};
  results.push(row);console.log(JSON.stringify(row));
}
writeFileSync(output+"/results.json",JSON.stringify(results,null,2));
process.exitCode = results.some(row=>row.exit!==0)?1:0;
