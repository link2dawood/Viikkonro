import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.CALENDAR_TEST_URL || "http://127.0.0.1:5173";
const production = process.env.CALENDAR_TEST_MODE === "production";
const output = mkdtempSync(join(tmpdir(), "viikkonro-planning-suite-"));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const requests = [], errors = [], commands = [];
  await context.route("**/*", (route) => {
    requests.push({ url: route.request().url(), body: route.request().postData() });
    return new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort();
  });
  await context.addInitScript(() => { window.__planningCommands = []; window.clarity = (...args) => window.__planningCommands.push(args); });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const kind of ["project", "sprint"]) for (const year of [2026, 2027, 2028]) {
    await page.goto(`${url}/${kind === "project" ? "projektiaikataulu" : "sprinttisuunnittelija"}`);
    await page.waitForSelector('.planning-editor[data-ready="true"]');
    await page.locator(`#${kind === "project" ? "p" : "s"}-start`).fill(`${year}-01-11`);
    await page.locator(`#${kind}-name`).fill("Äänekosken yksityinen yhteistyöprojekti");
    if (kind === "project") {
      await page.getByRole("button", { name: "Lisää vaihe", exact: true }).click();
      await page.getByRole("button", { name: "Lisää vaihe", exact: true }).click();
      const fields = page.locator(".planning-editor fieldset");
      await fields.nth(0).getByRole("textbox").first().fill("Esiselvitys ja hyväksyntä");
      await fields.nth(1).getByLabel("Alkaa vaiheen jälkeen").selectOption("phase-1");
      await fields.nth(0).getByLabel("Huomautus").fill("Sisäinen huomautus, öljy ja ääni.");
      await page.getByRole("button", { name: "Lisää välitavoite", exact: true }).click();
      await fields.nth(2).getByLabel("Nimi", { exact: true }).fill("Vaiheen hyväksyntä");
      await fields.nth(2).getByLabel("Vaiheen valmistuminen").selectOption("phase-2");
      assert.equal(await fields.nth(0).getByRole("button", { name: "Poista vaihe", exact: true }).isDisabled(), true);
      assert.equal(await page.locator('.planning-editor [role="alert"]').count(), 0);
      await fields.nth(0).getByLabel("Alkaa vaiheen jälkeen").selectOption("phase-2");
      assert.match(await page.locator('.planning-editor [role="alert"]').textContent(), /kehän/);
      assert.equal(await page.getByRole("button", { name: "Lataa PDF", exact: true }).isDisabled(), true);
      await fields.nth(0).getByLabel("Alkaa vaiheen jälkeen").selectOption("");
    } else {
      await page.locator("#s-number").fill("42");
      assert.equal(await page.locator(".data-table tbody tr").first().locator("th").textContent(), "42");
    }
    for (const [label, extension] of [["Lataa PDF", "pdf"], ["Lataa Excel", "xlsx"], ["Lataa ICS", "ics"]]) {
      const waiting = page.waitForEvent("download"); await page.getByRole("button", { name: label, exact: true }).click();
      const file = await waiting;
      const path = join(output, `${kind}-${year}.${extension}`); await file.saveAs(path);
      const bytes = readFileSync(path); assert.ok(bytes.length > 100);
      if (extension === "pdf") {
        const parsed = spawnSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
        assert.equal(parsed.status, 0); assert.ok(parsed.stdout.includes("Äänekosken yksityinen yhteistyöprojekti"));
        if (kind === "project") assert.ok(parsed.stdout.includes("Sisäinen huomautus, öljy ja ääni."));
        else assert.ok(parsed.stdout.includes("Sprintti 42"));
      }
      if (extension === "ics") {
        const text = bytes.toString("utf8").replace(/\r\n[ \t]/g, "");
        assert.match(text, /X-WR-TIMEZONE:Europe\/Helsinki/);
        assert.ok(!text.includes("URL:"));
        assert.ok(text.includes(kind === "project" ? "SUMMARY:Vaiheen hyväksyntä" : "SUMMARY:Sprintti 42"));
      }
    }
    commands.push(...await page.evaluate(() => window.__planningCommands));
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `${kind}: overflow at ${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (year === 2028) {
      await page.screenshot({ path: join(output, `${kind}-desktop.png`), fullPage: true });
      await page.emulateMedia({ media: "print" });
      assert.equal(await page.getByRole("button", { name: "Lataa PDF", exact: true }).isVisible(), false);
      assert.equal(await page.locator(".data-table").isVisible(), true);
      await page.emulateMedia({ media: "screen" });
    }
  }
  assert.deepEqual(errors.filter((error) => production || !error.startsWith("Hydration failed")), []);
  assert.ok(commands.some((command) => command[1] === "planning_suite_created"));
  assert.ok(commands.some((command) => command[1] === "planning_suite_export"));
  assert.ok(!JSON.stringify(commands).match(/Äänekosken|Esiselvitys|Sisäinen/));
  assert.ok(!JSON.stringify(requests).match(/Äänekosken|Esiselvitys|Sisäinen/));
  if (production) {
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const landing = await noJs.newPage(); await landing.goto(`${url}/projektiaikataulu`);
    assert.equal(await landing.locator("h1").textContent(), "Projektiaikataulu");
    assert.ok(await landing.getByText("Voinko ladata projektisuunnitelman?", { exact: true }).count());
    await noJs.close();
  }
  console.log(`Planning suite browser checks passed; 18 artifacts: ${output}`);
} finally { await browser.close(); }
