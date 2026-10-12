import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const output = fs.mkdtempSync(path.join(os.tmpdir(), "viikkonro-hr-"));
const base = process.env.CALENDAR_TEST_URL ?? "http://127.0.0.1:5173";
const production = process.env.CALENDAR_TEST_MODE === "production";
try {
  const context = await browser.newContext({ acceptDownloads: true });
  await context.route(/clarity\.ms/, (route) => route.abort());
  const page = await context.newPage(); const errors = [];
  page.on("pageerror", (e) => { if (production || !e.message.includes("Hydration failed")) errors.push(e.message); });
  await page.goto(`${base}/hr-kalenteri`); await page.waitForSelector('.hr-editor[data-ready="true"]');
  await page.evaluate(() => { window.__hrAnalytics = []; window.clarity = (...args) => window.__hrAnalytics.push(args); });
  for (const year of [2026, 2027, 2028]) {
    await page.reload(); await page.waitForSelector('.hr-editor[data-ready="true"]');
    await page.evaluate(() => { window.__hrAnalytics = []; window.clarity = (...args) => window.__hrAnalytics.push(args); });
    await page.locator("#hr-year").fill(String(year));
    await page.locator("#hr-company").fill("Ääkkösyrityksen pitkä henkilöstöhallinnon vuosikello Oy");
    await page.locator("#hr-statutory").check();
    for (const label of ["palkkapäivä", "palkanlaskennan määräpäivä", "henkilöstöviestintä", "yrityksen vapaapäivä", "lomajakso", "hr:n vuositapahtuma", "yrityksen tapahtuma"]) await page.getByRole("button", { name: `Lisää ${label}`, exact: true }).click();
    const first = page.locator(".hr-row").first();
    await first.getByLabel("Nimi", { exact: true }).fill("Palkkapäivä ääkkösillä");
    await first.getByLabel("Alkuperä").selectOption("agreement");
    assert.ok(await page.getByRole("alert").isVisible());
    assert.ok(await page.getByRole("button", { name: "Lataa Excel", exact: true }).isDisabled());
    await first.getByLabel("Sopimus, voimassaolo ja kohta (pakollinen)").fill("Sopimus 2026-2028, kohta X: käyttäjän tarkistettava");
    await first.getByLabel("Huomautus").fill("Täydellinen suomalainen huomautus ä ö å.");
    assert.equal(await page.getByRole("alert").count(), 0);
    for (const format of ["pdf", "xlsx", "ics"]) {
      const promise = page.waitForEvent("download");
      await page.getByRole("button", { name: `Lataa ${format === "xlsx" ? "Excel" : format.toUpperCase()}`, exact: true }).click();
      const download = await promise; const filename = path.join(output, `${year}.${format}`);
      await download.saveAs(filename); assert.ok(fs.statSync(filename).size > 100);
      if (format === "pdf") {
        const text = execFileSync("pdftotext", [filename, "-"], { encoding: "utf8" });
        for (const needle of ["Palkkapäivä ääkkösillä", "Täydellinen suomalainen huomautus", "Finlex", "TES-kohtainen oma merkintä", "ISO"]) assert.ok(text.includes(needle), needle);
      }
      await page.getByRole("status").filter({ hasText: "Tiedosto on valmis" }).waitFor();
    }
  }
  await page.emulateMedia({ media: "print" });
  const print = path.join(output, "print.pdf"); await page.pdf({ path: print, preferCSSPageSize: true });
  const printed = execFileSync("pdftotext", [print, "-"], { encoding: "utf8" });
  assert.ok(printed.includes("Palkkapäivä ääkkösillä")); assert.ok(!printed.includes("Lisää palkkapäivä")); assert.ok(printed.includes("Finlex"));
  await page.emulateMedia({ media: "screen" }); await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));
  const events = await page.evaluate(() => window.__hrAnalytics ?? []);
  assert.ok(events.some((event) => event[0] === "event" && event[1] === "hr_calendar_export"));
  assert.ok(!JSON.stringify(events).includes("Ääkkösyrityksen"));
  assert.deepEqual(errors, []);
  if (production) { const nojs = await browser.newContext({ javaScriptEnabled: false }); const staticPage = await nojs.newPage(); await staticPage.goto(`${base}/hr-kalenteri`); assert.ok(await staticPage.getByRole("heading", { name: "HR-kalenteri ja henkilöstön vuosikello", exact: true }).isVisible()); await nojs.close(); }
  console.log(JSON.stringify({ output, downloads: 9, print: true, mobile: true, errors, production }));
} finally { await browser.close(); }
