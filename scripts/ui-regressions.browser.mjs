// Read-only release smoke checks. No purchases, emails or persistent customer data.
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_TEST_URL || "http://localhost:4173";
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(base).origin) return route.abort();
    if (new URL(base).hostname === "localhost" && route.request().isNavigationRequest() && url.pathname !== "/") {
      url.pathname += ".html";
      return route.fulfill({ response: await route.fetch({ url: url.href }) });
    }
    return route.continue();
  });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const family of ["week", "month", "year", "holiday", "working-days"]) {
      const response = await page.goto(`${base}/data/${family}`);
      assert.equal(response.status(), 200);
      assert.match(response.headers()["content-type"], /text\/html/);
      assert.equal(await page.locator("main h1").count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${family}: overflow at ${width}px`);
    }
    await page.goto(`${base}/lomasuunnittelija`);
    const secondary = page.locator(".vp-pro button.btn.btn-ghost");
    assert.equal(await secondary.count(), 5);
    for (const button of await secondary.all()) {
      assert.ok(await button.evaluate(el => el.getBoundingClientRect().height >= 44));
      assert.notEqual(await button.evaluate(el => getComputedStyle(el).borderRadius), "0px");
    }
    await page.getByRole("button", { name: "+ Lisää loma tai poissaolo", exact: true }).click();
    const remove = page.getByRole("button", { name: "Poista jakso", exact: true });
    assert.ok(await remove.evaluate(el => el.getBoundingClientRect().height >= 44));
    await remove.click();
    assert.equal(await remove.count(), 0);
    console.log(`PASS dataset pages and Vacation Pro controls at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
