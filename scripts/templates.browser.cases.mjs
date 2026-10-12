// Optional real-browser check against npm run preview after npm run build.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TEMPLATES, TEMPLATE_FORMATS, templatePath } from "../src/platform/templates/catalog.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.TEMPLATE_TEST_URL || "http://127.0.0.1:4173";
const output = mkdtempSync(join(tmpdir(), "viikkonro-templates-browser-"));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.setDefaultTimeout(15_000);
  const errors = [];
  const commands = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort());
  await page.addInitScript(() => { window.__templateCommands = []; window.clarity = (...args) => window.__templateCommands.push(args); });
  await page.goto(`${url}/kalenteripohjat`);
  assert.equal(await page.locator(".tpl-grid article").count(), 6);
  await page.getByLabel(/^Kategoria/).selectOption("construction");
  assert.equal(await page.locator(".tpl-grid article").count(), 1);
  await page.getByLabel(/^Tiedostomuoto/).selectOption("pdf");
  assert.equal(await page.locator(".tpl-grid article").count(), 1);
  await page.getByRole("link", { name: "Tutustu ja lataa", exact: true }).click();
  await page.waitForURL(`**${templatePath(TEMPLATES.find((template) => template.id === "construction"))}`);
  commands.push(...await page.evaluate(() => window.__templateCommands));
  for (const template of TEMPLATES) {
    await page.goto(url + templatePath(template));
    assert.equal(await page.locator("h1").textContent(), template.finnishName);
    await page.getByLabel(/^Suunnitteluvuosi/).selectOption("2028");
    assert.match(await page.locator(".tpl-preview h2").textContent(), /2028/);
    await page.getByRole("button", { name: "Piilota esikatselu", exact: true }).click();
    assert.equal(await page.locator(".tpl-table").count(), 0);
    await page.getByRole("button", { name: "Näytä esikatselu", exact: true }).click();
    assert.equal(await page.locator(".tpl-table tbody tr").count(), 5);
    for (const format of template.format) {
      const waiting = page.waitForEvent("download");
      await page.getByRole("link", { name: `Lataa ${TEMPLATE_FORMATS[format].label}`, exact: true }).click();
      const download = await waiting;
      assert.equal(download.suggestedFilename(), `${template.slug}-2028.${format}`);
      const filename = join(output, download.suggestedFilename());
      await download.saveAs(filename);
      assert.ok(readFileSync(filename).length > 100);
      if (format === "csv" && ["company", "shifts"].includes(template.id)) assert.match(readFileSync(filename, "utf8"), /2028-02-29/);
    }
    // Every static manifest asset responds with a file, not the SPA fallback.
    for (const asset of template.downloadableAssets) {
      const response = await page.request.get(url + asset.path);
      assert.equal(response.status(), 200, asset.path);
      assert.ok((await response.body()).length > 100);
      assert.ok(!response.headers()["content-type"]?.includes("text/html"), asset.path);
    }
    commands.push(...await page.evaluate(() => window.__templateCommands));
  }
  for (const name of ["template_view", "template_preview", "template_cta", "template_download"]) assert.ok(commands.some((command) => command[0] === "event" && command[1] === name), name);
  assert.ok(commands.filter((command) => command[0] === "set" && command[1].startsWith("pf_")).every((command) => ["pf_source", "pf_year", "pf_export_type"].includes(command[1])));
  // Failure and SPA fallback responses must never claim successful downloads.
  await page.goto(url + templatePath(TEMPLATES[0]));
  const failingAsset = `${url}/pohjat/${TEMPLATES[0].slug}/2027.csv`;
  for (const status of [503, 200]) {
    await page.route(failingAsset, (route) => route.fulfill({ status, contentType: "text/html", body: "<!doctype html><html>Unavailable</html>" }));
    const before = await page.evaluate(() => window.__templateCommands.filter((command) => command[1] === "template_download").length);
    await page.getByRole("link", { name: "Lataa CSV", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Lataus ei onnistunut" }).waitFor();
    assert.equal(await page.evaluate(() => window.__templateCommands.filter((command) => command[1] === "template_download").length), before);
    await page.unroute(failingAsset);
  }
  await page.goto(`${url}/kalenteripohjat`);
  await page.screenshot({ path: join(output, "catalog-desktop.png"), fullPage: true });
  await page.goto(url + templatePath(TEMPLATES.find((template) => template.id === "construction")));
  await page.screenshot({ path: join(output, "detail-desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}px`);
  }
  await page.screenshot({ path: join(output, "detail-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".tpl-downloads").isVisible(), false);
  await page.pdf({ path: join(output, "detail-print.pdf"), format: "A4", landscape: true });
  const noJs = await browser.newContext({ javaScriptEnabled: false, acceptDownloads: true });
  const staticPage = await noJs.newPage();
  await staticPage.goto(url + templatePath(TEMPLATES[0]));
  assert.equal(await staticPage.locator(".tpl-table tbody tr").count(), 5);
  const waiting = staticPage.waitForEvent("download");
  await staticPage.getByRole("link", { name: "Lataa CSV", exact: true }).click();
  assert.equal((await waiting).suggestedFilename(), `${TEMPLATES[0].slug}-2027.csv`);
  await noJs.close();
  assert.deepEqual(errors, []);
  console.log(`Template browser checks passed: 18 downloads, 54 assets, filters, preview, mobile, print, analytics, failed-download handling and no-JavaScript download. Artifacts: ${output}`);
} finally { await browser.close(); }
