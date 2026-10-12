import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs");
const origin = new URL(process.env.INDEXING_TEST_URL || "http://127.0.0.1:4173").origin;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || "/home/link2dawood/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const errors = [], results = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const year of [2026, 2027, 2028]) {
      const path = `/pyhat-${year}/vappu`;
      const response = await page.goto(`${origin}${path}`);
      assert.equal(response.status(), 200);
      await page.getByRole("heading", { name: "Vappu lähivuosina", exact: true }).waitFor();
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), `https://viikkonro.fi${path}`);
      assert.equal(await page.locator(".site-footer").count(), 1);
      assert.equal(await page.locator(".data-table tbody tr").count(), 3);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} ${width}: overflow`);
      const link = page.getByRole("link", { name: `toukokuun ${year} työpäiviä`, exact: true });
      await link.click();
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(new URL(page.url()).pathname, `/tyopaivat-toukokuu-${year}`);
      assert.ok(!(await page.getByRole("heading", { level: 1 }).innerText()).includes("Sivua ei löytynyt"));
      results.push({ path, width });
    }
  }
  assert.deepEqual(errors, []);
  console.log(`${results.length} Vappu desktop/mobile and internal-link checks passed; no JavaScript errors.`);
} finally { await browser.close(); }
