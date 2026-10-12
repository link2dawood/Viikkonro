import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.CALENDAR_TEST_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const surfaces = ["kalenteri-2027", "tulostettava-kalenteri-2027", "tulosta-2027", "vuosi-2027", "tyopaivat-2027", "pyhapaivat-2027", "palkkapaivat-2027", "viikko-1-2027", "lomasuunnittelija", "projektiaikataulu", "sprinttisuunnittelija"];
const errors = [], rows = [];
try {
  const context = await browser.newContext({ acceptDownloads: true });
  await context.route("**/*", (route) => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.__growthCommands = [];
    window.clarity = (...args) => window.__growthCommands.push(args);
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__vitals.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const surface of surfaces) {
      const html = readFileSync(`dist/${surface}.html`, "utf8");
      assert.match(html, /class="growth-cta noprint"/);
      await page.goto(`${url}/${surface}`);
      await page.waitForFunction(() => window.__growthCommands.some((command) => command[0] === "event" && command[1] === "growth_landing"));
      await page.waitForTimeout(350);
      assert.equal(await page.locator(".growth-cta").count(), 1);
      assert.equal(await page.locator("h1").count(), 1);
      const state = await page.evaluate(() => ({ ...window.__vitals, overflow: document.documentElement.scrollWidth > innerWidth }));
      assert.equal(state.overflow, false, `${surface} overflows at ${width}px`);
      rows.push({ surface, width, ...state });
      const href = await page.locator(".growth-cta a").getAttribute("href");
      if (href.startsWith("#")) assert.equal(await page.locator(href).count(), 1);
      await page.emulateMedia({ media: "print" });
      assert.equal(await page.locator(".growth-cta").isVisible(), false);
      if (surface === "tulostettava-kalenteri-2027") {
        const columns = await page.locator(".cal-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        assert.equal(columns, 6, "existing six-column printed layout changed");
      }
      await page.emulateMedia({ media: "screen" });
    }
  }
  await page.goto(`${url}/tulosta-2027`);
  const csvWaiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Lataa Excel-CSV", exact: true }).click();
  assert.match((await csvWaiting).suggestedFilename(), /\.csv$/);
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.getByRole("button", { name: "Tulosta / tallenna PDF", exact: true }).click();
  assert.equal(await page.evaluate(() => window.__printed), true);
  await page.goto(`${url}/kalenteri-2027?company=PRIVATE_QUERY`);
  const pdf = page.locator('a[href="/pdf/kalenteri-2027.pdf"]').first();
  assert.equal(await pdf.isVisible(), true);
  const response = await context.request.get(`${url}/pdf/kalenteri-2027.pdf`);
  assert.equal(response.status(), 200);
  assert.ok((await response.body()).subarray(0, 5).equals(Buffer.from("%PDF-")));
  await page.locator(".growth-cta a").click();
  await page.waitForURL(`${url}/yrityskalenteri`);
  await page.locator("#cc-name").fill("PRIVATE_COMPANY_TEST");
  await page.waitForFunction(() => window.__growthCommands.some((command) => command[1] === "growth_preview"));
  const commands = await page.evaluate(() => window.__growthCommands);
  assert.ok(commands.some((command) => command[1] === "growth_cta_company-calendar"));
  assert.ok(commands.some((command) => command[1] === "growth_start_company-calendar"));
  assert.ok(commands.some((command) => command[1] === "growth_preview_company-calendar"));
  assert.ok(commands.some((command) => command[1] === "growth_source" && command[2] === "kalenteri"));
  assert.ok(!JSON.stringify(commands).includes("PRIVATE_"));
  assert.ok(!commands.some((command) => /^growth_purchase/.test(command[1])));
  for (const [path, kind] of [["projektiaikataulu", "project"], ["sprinttisuunnittelija", "sprint"]]) {
    await page.goto(`${url}/${path}`);
    await page.locator('.planning-editor[data-ready="true"]').waitFor();
    await page.locator(".growth-cta a").click();
    await page.locator(`#${kind}-name`).fill("PRIVATE_PROJECT_TEST");
    await page.waitForFunction(() => window.__growthCommands.some((command) => command[1] === "growth_preview"));
    const waiting = page.waitForEvent("download");
    await page.getByRole("button", { name: "Lataa Excel", exact: true }).click();
    assert.match((await waiting).suggestedFilename(), /\.xlsx$/);
    const commands = await page.evaluate(() => window.__growthCommands);
    assert.ok(commands.some((command) => command[1] === `growth_export_${kind}-planner`));
    assert.ok(!JSON.stringify(commands).includes("PRIVATE_"));
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ responsiveAndPrintChecks: rows.length, jsErrors: errors.length, freePdfAvailable: true, freeCsvAndPrintAvailable: true, companyFunnel: true, plannerExports: 2, maxObservedLabLcp: Math.max(...rows.map((row) => row.lcp)), maxObservedLabCls: Math.max(...rows.map((row) => row.cls)) }));
} finally { await browser.close(); }
