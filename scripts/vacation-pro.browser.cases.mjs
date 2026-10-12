import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { newVacationDraft, VACATION_DRAFT_KEY, vacationConfigToJson } from "../src/platform/vacation/config.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.CALENDAR_TEST_URL || "http://127.0.0.1:5173";
const production = process.env.CALENDAR_TEST_MODE === "production";
const output = mkdtempSync(join(tmpdir(), "viikkonro-vacation-pro-"));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], commands = [], requests = [], downloads = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("download", (file) => downloads.push(file));
  await context.route("**/*", (route) => {
    requests.push({ url: route.request().url(), body: route.request().postData() });
    return new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort();
  });
  await context.addInitScript(() => { window.__vacationCommands = []; window.clarity = (...args) => window.__vacationCommands.push(args); });
  await page.goto(`${url}/lomasuunnittelija`);
  await page.waitForFunction(() => !document.querySelector("#vp-year").disabled && !document.querySelector("#vp-year").closest("fieldset").disabled);
  const freeResult = await page.locator(".result .main-text").textContent();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), VACATION_DRAFT_KEY), null);
  await page.locator("#vp-notes").fill("Tallentamaton huomautus");
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), VACATION_DRAFT_KEY), null);
  for (const [year, start, end, closureStart, closureEnd] of [[2026, "07-06", "07-12", "07-09", "07-10"], [2027, "07-05", "07-11", "07-08", "07-09"], [2028, "07-03", "07-09", "07-06", "07-07"]]) {
    const draft = { ...newVacationDraft(year), calendarId: "1234567890abcdef1234567890abcdef", people: [{ id: "person1", label: "Äänekosken Yhteistyökumppanit ja Työntekijät" }, { id: "person2", label: "Henkilö B" }],
      periods: [{ id: "leave", personId: "person1", type: "vacation", label: "Kesäloma", start: `${year}-${start}`, end: `${year}-${end}`, note: "Henkilökohtainen huomautus" },
        { id: "absence", personId: "person2", type: "absence", label: "Muu poissaolo", start: `${year}-07-14`, end: `${year}-07-15`, note: "Sisäinen asia" },
        ...(year === 2028 ? [{ id: "leap", personId: "person2", type: "vacation", label: "Karkauspäivä", start: "2028-02-29", end: "2028-02-29", note: "" }] : [])],
      closures: [{ id: "close", label: "Yrityksen kesäsulku", start: `${year}-${closureStart}`, end: `${year}-${closureEnd}`, note: "Sulun huomautus" }], notes: "Suunnitelman oma huomautus" };
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: VACATION_DRAFT_KEY, value: vacationConfigToJson(draft) });
    commands.push(...await page.evaluate(() => window.__vacationCommands));
    await page.reload();
    await page.waitForFunction((year) => document.querySelector("#vp-year")?.value === String(year) && !document.querySelector("#vp-year").closest("fieldset").disabled, year);
    assert.equal(await page.locator(".result .main-text").textContent(), freeResult);
    assert.equal(await page.locator(".vp-summary tbody tr").first().locator("td").first().textContent(), "3");
    await page.locator("#vp-rule").selectOption("FINLAND_STATUTORY_LEAVE");
    assert.equal(await page.locator(".vp-summary tbody tr").first().locator("td").first().textContent(), "6");
    assert.equal(await page.locator(".result .main-text").textContent(), freeResult);
    await page.waitForFunction(() => window.__vacationCommands.some((command) => command[1] === "vacation_planner_preview"));
    await page.getByRole("button", { name: "Tallenna luonnos tähän selaimeen", exact: true }).click();
    assert.match(await page.locator(".cc-status").textContent(), /tallennettiin/);
    await page.getByRole("button", { name: "Lataa PDF", exact: true }).click();
    await page.locator(".cc-unlock").waitFor();
    if (production) {
      assert.equal(downloads.length, 0);
      assert.equal(await page.getByRole("button", { name: "Avaa Pro-lataukset (testi)" }).count(), 0);
      await page.evaluate(() => localStorage.setItem("viikkonro:dev-license", JSON.stringify({ productId: "vacation-planner-pro", tier: "paid", issuedOn: "2026-01-01", expiresOn: "2099-12-31" })));
    } else {
      await page.getByRole("button", { name: "Avaa Pro-lataukset (testi)" }).click();
      for (const [label, extension] of [["Lataa PDF", "pdf"], ["Lataa Excel", "xlsx"], ["Lataa ICS", "ics"]]) {
        const waiting = page.waitForEvent("download"); await page.getByRole("button", { name: label, exact: true }).click();
        const file = await waiting; assert.equal(file.suggestedFilename(), `lomasuunnitelma-${year}.${extension}`);
        const path = join(output, `${year}.${extension}`); await file.saveAs(path);
        const bytes = readFileSync(path); assert.ok(bytes.length > 100);
        if (extension === "ics") {
          const text = bytes.toString("utf8").replace(/\r\n[ \t]/g, "");
          assert.match(text, /SUMMARY:Äänekosken Yhteistyökumppanit ja Työntekijät: Kesäloma/);
          assert.match(text, /Henkilökohtainen huomautus/);
          assert.match(text, /SUMMARY:Yrityksen kesäsulku/);
          if (year === 2028) assert.match(text, /DTSTART;VALUE=DATE:20280229/);
        }
        if (extension === "xlsx") assert.equal(bytes.subarray(0, 2).toString(), "PK");
        if (extension === "pdf") {
          assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
          const text = spawnSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
          assert.equal(text.status, 0); assert.match(text.stdout, /Suunnitelman oma huomautus/); assert.match(text.stdout, /Henkilökohtainen huomautus/);
        }
      }
      await page.getByRole("button", { name: "Lukitse Pro-lataukset" }).click();
    }
    commands.push(...await page.evaluate(() => window.__vacationCommands));
    await page.reload();
    await page.waitForFunction((year) => document.querySelector("#vp-year")?.value === String(year) && !document.querySelector("#vp-year").closest("fieldset").disabled, year);
    assert.equal(await page.locator("#vp-rule").inputValue(), "FINLAND_STATUTORY_LEAVE");
    assert.equal(await page.locator(".vp-summary tbody tr").first().locator("td").first().textContent(), "6");
    if (production) {
      await page.getByRole("button", { name: "Lataa ICS", exact: true }).click();
      await page.locator(".cc-unlock").waitFor(); assert.equal(downloads.length, 0);
    }
  }
  commands.push(...await page.evaluate(() => window.__vacationCommands));
  for (const name of ["vacation_planner_started", "vacation_planner_preview", ...(!production ? ["vacation_planner_export"] : [])]) assert.ok(commands.some((command) => command[1] === name), name);
  assert.doesNotMatch(JSON.stringify(commands), /Äänekosken|Työntekijät|Henkilökohtainen|Sisäinen|2028-02-29/);
  assert.doesNotMatch(JSON.stringify(requests), /Äänekosken|Työntekijät|Henkilökohtainen|Sisäinen|1234567890abcdef|%C3%84%C3%A4nekosken/);
  await page.screenshot({ path: join(output, "desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow at ${width}`);
  }
  await page.screenshot({ path: join(output, "mobile.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".cc-editor").isVisible(), false);
  assert.equal(await page.locator(".cc-watermark").isVisible(), true);
  await page.pdf({ path: join(output, "print-preview.pdf"), format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Tyhjennä Pro-luonnos" }).click();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), VACATION_DRAFT_KEY), null);
  assert.equal(await page.locator(".result .main-text").textContent(), freeResult);
  assert.deepEqual(errors.filter((error) => production || !error.startsWith("Hydration failed")), []);
  if (production) {
    const staticContext = await browser.newContext({ javaScriptEnabled: false }); const staticPage = await staticContext.newPage();
    await staticPage.goto(`${url}/lomasuunnittelija`);
    assert.ok(await staticPage.getByRole("heading", { name: "Lomasuunnittelija Pro: vuoden lomasuunnitelma" }).isVisible());
    await staticContext.close();
  }
  console.log(`Vacation Pro browser checks passed (${production ? "production" : "development"}); artifacts: ${output}`);
} finally { await browser.close(); }
