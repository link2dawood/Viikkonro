import { readFileSync } from "node:fs";
import { DRAFT_BILLING_CATALOG, validateCatalog } from "../src/platform/billing/catalog.js";

// Local validation/output only. No provider, network access or database mutation.
try {
  const input=process.argv[2] ? JSON.parse(readFileSync(process.argv[2],"utf8")) : DRAFT_BILLING_CATALOG;
  process.stdout.write(`${JSON.stringify(validateCatalog(input),null,2)}\n`);
} catch(error) { console.error(`Billing catalog rejected: ${error.code ?? "invalid_json"}`);process.exitCode=1; }
