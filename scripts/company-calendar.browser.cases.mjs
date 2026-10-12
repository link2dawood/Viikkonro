// Optional real-browser checks. See docs/company-calendar.md for setup.
// Uses an isolated Playwright installation; no application dependency is added.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const url = process.env.CALENDAR_TEST_URL || "http://127.0.0.1:5173";
const production = process.env.CALENDAR_TEST_MODE === "production";
const output = mkdtempSync(join(tmpdir(), "viikkonro-calendar-browser-"));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.setDefaultTimeout(15_000);
  const errors = [];
  const downloads = [];
  const capturedCommands = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("download", (d) => downloads.push(d));
  // Keep this check local: prevent analytics, ads and external forms from loading.
  await page.route("**/*", (route) => {
    const requested = new URL(route.request().url());
    return requested.origin === new URL(url).origin ? route.continue() : route.abort();
  });
  await page.addInitScript(() => {
    window.__calendarCommands = [];
    window.clarity = (...args) => window.__calendarCommands.push(args);
  });
  await page.goto(`${url}/yrityskalenteri`);
  // The SSR input exists before hydration restores the draft. Wait for the
  // mounted editor before typing so the restore effect cannot replace this edit.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("viikkonro:company-calendar:draft:v1"))?.form.calendarId);
  await page.getByLabel("Yrityksen nimi", { exact: true }).fill("Äänekosken Työläiset ja Yhteistyökumppanit Oy");
  assert.equal(await page.locator(".cc-watermark").count(), 1);
  assert.equal(await page.locator(".cc-layout").getAttribute("data-clarity-mask"), "True");

  // Unfinished data must be corrected before any export or unlock attempt.
  await page.getByRole("button", { name: "+ Lisää tapahtuma", exact: true }).click();
  await page.getByLabel("Päivä", { exact: true }).fill("2027-05-12");
  await page.getByRole("button", { name: "Lataa PDF", exact: true }).click();
  assert.match(await page.locator(".cc-status").textContent(), /Tarkista/);
  assert.equal(await page.locator(".cc-unlock").count(), 0);
  await page.getByLabel("Tapahtuman nimi", { exact: true }).fill("Henkilöstöpäivä Äänekoskella");
  await page.getByRole("button", { name: "Lataa PDF", exact: true }).click();
  await page.locator(".cc-unlock").waitFor();
  assert.equal(downloads.length, 0);

  if (production) {
    assert.equal(await page.getByRole("button", { name: "Avaa lataukset (testi)" }).count(), 0);
    assert.match(await page.locator(".cc-unlock").textContent(), /Osta lataukset/);
    // Forged browser licences never unlock production exports.
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("viikkonro:company-calendar:draft:v1"))?.form.companyName.includes("Äänekosken"));
    await page.evaluate(() => localStorage.setItem("viikkonro:dev-license", JSON.stringify({ productId: "company-calendar", tier: "paid", issuedOn: "2026-01-01", expiresOn: "2099-12-31" })));
    await page.reload();
    await page.locator(".cc-watermark").waitFor();
    // The server-rendered watermark exists before the draft restoration effect.
    await page.waitForFunction(() => [...document.querySelectorAll("input")].some((input) => input.value === "Äänekosken Työläiset ja Yhteistyökumppanit Oy"));
    assert.equal(await page.getByLabel("Yrityksen nimi", { exact: true }).inputValue(), "Äänekosken Työläiset ja Yhteistyökumppanit Oy");
    await page.getByLabel("Pääväri", { exact: true }).fill("#ffffff");
    await page.getByRole("button", { name: "Lataa PDF", exact: true }).click();
    await page.locator(".cc-unlock").waitFor();
    assert.equal(downloads.length, 0);
  } else {
    await page.getByRole("button", { name: "Avaa lataukset (testi)" }).click();
    await page.locator(".cc-watermark").waitFor({ state: "detached" });
    await page.getByLabel("Kalenterin vuosi", { exact: true }).selectOption("2028");
    await page.getByLabel("Päivä", { exact: true }).fill("2028-02-29");
    assert.match(await page.locator("h1").textContent(), /2028/);
    await page.getByRole("button", { name: "+ Lisää sulkupäivä", exact: true }).click();
    await page.getByLabel("Sulkupäivän nimi").fill("Vuodenvaihteen sulku");
    await page.getByLabel("Alkaa", { exact: true }).fill("2027-12-28");
    await page.getByLabel("Päättyy", { exact: true }).fill("2028-01-05");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAAAEUlEQVR4nGM4ISeHFTFQTwIAbv4ggUBHKgEAAAAASUVORK5CYII=", "base64");
    const download = async (label, extension, suffix = "") => {
      const waiting = page.waitForEvent("download");
      await page.getByRole("button", { name: label, exact: true }).click();
      const file = await waiting;
      assert.ok(file.suggestedFilename().endsWith(`-2028.${extension}`));
      const path = join(output, `${extension}${suffix}.${extension}`);
      await file.saveAs(path);
      console.log(`Verified download: ${extension}${suffix}`);
      assert.ok(readFileSync(path).length > 100);
      return path;
    };
    await page.getByLabel("Logo (PNG tai SVG, enintään 512 kt)").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
    await page.locator(".cc-logo").waitFor();
    await download("Lataa PDF", "pdf", "-png");
    await page.getByLabel("Logo (PNG tai SVG, enintään 512 kt)").setInputFiles({
      name: "logo.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect width="100" height="40" fill="#1f7a5c"/></svg>'),
    });
    await page.waitForFunction(() => document.querySelector(".cc-logo")?.src.startsWith("data:image/svg+xml"));
    for (const label of ["Koko vuosi yhdellä sivulla", "Yksi kuukausi sivulla", "Viikkonumeroluettelo"]) {
      await page.getByRole("radio", { name: new RegExp(label) }).check();
      await download("Lataa PDF", "pdf", `-${label.split(" ")[0]}`);
    }
    for (const [label, extension] of [["Lataa Excel", "xlsx"], ["Lataa CSV", "csv"], ["Lataa ICS", "ics"]]) await download(label, extension);
    assert.match(readFileSync(join(output, "csv.csv"), "utf8"), /29\.02\.2028/);
    assert.match(readFileSync(join(output, "ics.ics"), "utf8"), /DTSTART;VALUE=DATE:20280229/);
    assert.equal(readFileSync(join(output, "xlsx.xlsx")).subarray(0, 2).toString(), "PK");
    capturedCommands.push(...await page.evaluate(() => window.__calendarCommands));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("viikkonro:company-calendar:draft:v1"))?.form.logo?.dataUri.startsWith("data:image/svg+xml"));
    await page.reload();
    await page.locator(".cc-logo").waitFor();
    assert.equal(await page.locator(".cc-watermark").count(), 0);
    assert.equal(await page.getByLabel("Kalenterin vuosi", { exact: true }).inputValue(), "2028");
    await page.getByRole("button", { name: "Lukitse uudelleen" }).click();
    await page.locator(".cc-watermark").waitFor();
    await page.getByLabel("Pääväri", { exact: true }).fill("#ffffff");
  }

  await page.waitForFunction(() => window.__calendarCommands.some((c) => c[1] === "company_calendar_preview"));
  const commands = [...capturedCommands, ...await page.evaluate(() => window.__calendarCommands)];
  assert.ok(commands.some((c) => c[1] === "company_calendar_export_attempt"));
  assert.ok(!JSON.stringify(commands).match(/Äänekosken|Henkilöstöpäivä|data:image|2028-02-29/));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(output, "desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
    assert.ok(dimensions.scroll <= dimensions.width, `horizontal page overflow at ${width}: ${dimensions.scroll}`);
  }
  await page.screenshot({ path: join(output, "mobile.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".cc-editor").isVisible(), false);
  assert.equal(await page.locator(".cc-watermark").isVisible(), true);
  await page.pdf({ path: join(output, "watermarked-print-preview.pdf"), format: "A4", printBackground: true });
  // Vite serves an empty root in development; the existing hydration entry
  // reports that once and regenerates it. Production must have no such error.
  assert.deepEqual(errors.filter((e) => production || !e.startsWith("Hydration failed")), []);
  console.log(`Company calendar browser checks passed (${production ? "production" : "development"}); artifacts: ${output}`);
} finally {
  await browser.close();
}
