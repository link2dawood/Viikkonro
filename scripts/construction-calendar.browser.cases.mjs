import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { isoWeek, isoYear } from "../src/components/dateUtils.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.CALENDAR_TEST_URL || "http://127.0.0.1:5173";
const production = process.env.CALENDAR_TEST_MODE === "production";
const output = mkdtempSync(join(tmpdir(), "viikkonro-construction-"));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const errors = [], requests = [], commands = [];
  await context.route("**/*", (route) => {
    requests.push({ url: route.request().url(), body: route.request().postData() });
    return new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort();
  });
  await context.addInitScript(() => { window.__constructionCommands = []; window.clarity = (...args) => window.__constructionCommands.push(args); });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on("pageerror", (error) => errors.push(error.message));
  for (const year of [2026, 2027, 2028]) {
    await page.goto(`${url}/rakennuskalenteri`);
    await page.waitForSelector('.construction-editor[data-ready="true"]');
    await page.locator("#c-project").fill("Äänekosken rakennusyrityksen pitkä suomalainen yhteistyöprojekti");
    await page.locator("#c-site").fill("Yksityinen työmaa, pohjoinen alue");
    await page.locator("#c-end").fill(`${year + 1}-01-11`);
    await page.locator("#c-start").fill(`${year}-12-28`);
    await page.locator("#c-subcontractors").fill("Aliurakoitsijan kaluston käyttö ja työjärjestys");
    await page.locator("#c-weather").fill("Oma pakkasriskihuomio, ei sääennustetta");
    const buttons = ["Lisää työvaihe", "Lisää viikkotehtävä", "Lisää välitavoite", "Lisää toimitus", "Lisää tarkastus", "Lisää työmaan tauko"];
    for (const name of buttons) await page.getByRole("button", { name, exact: true }).click();
    const rows = page.locator(".construction-row");
    await rows.nth(0).getByLabel("Nimi", { exact: true }).fill("Runkotyö ja hyväksyntä");
    await rows.nth(0).getByLabel("Loppu", { exact: true }).fill(`${year + 1}-01-08`);
    await rows.nth(1).getByLabel("Nimi", { exact: true }).fill("Viikon betonointi");
    await rows.nth(1).getByLabel("Loppu", { exact: true }).fill(`${year + 1}-01-04`);
    await rows.nth(1).getByLabel("Huomautus", { exact: true }).fill("Sisäinen huomio: öljy ja jäätyminen.");
    await rows.nth(1).getByText("Aliurakoitsija- ja sääriskihuomiot", { exact: true }).click();
    await rows.nth(1).getByLabel("Aliurakoitsijahuomio", { exact: true }).fill("Nostokaluston käyttö");
    await rows.nth(1).getByLabel("Sääriski (oma huomio)", { exact: true }).fill("Betonoinnin lämpötila");
    await rows.nth(2).getByLabel("Päivämäärä", { exact: true }).fill(`${year}-12-29`);
    await rows.nth(3).getByLabel("Päivämäärä", { exact: true }).fill(`${year}-12-30`);
    await rows.nth(4).getByLabel("Päivämäärä", { exact: true }).fill(`${year}-12-31`);
    await rows.nth(5).getByLabel("Alku", { exact: true }).fill(`${year}-12-29`);
    await rows.nth(5).getByLabel("Loppu", { exact: true }).fill(`${year + 1}-01-02`);
    await page.getByRole("button", { name: "Lisää toimitus", exact: true }).click();
    await rows.nth(6).getByLabel("Nimi", { exact: true }).fill("Lopputoimitus");
    await rows.nth(6).getByLabel("Päivämäärä", { exact: true }).fill(`${year + 1}-01-10`);
    assert.equal(await page.getByRole("alert").count(), 0);
    assert.ok(await page.locator(".construction-conflicts").count());
    if (year === 2026) assert.ok((await page.locator("#c-week").inputValue()).includes("2026-53"));
    await page.waitForFunction(() => window.__constructionCommands.some((command) => command[1] === "construction_planner_created"));
    for (const layout of ["weekly", "overview"]) {
      await page.locator("#c-layout").selectOption(layout);
      assert.equal(await page.locator(".construction-weeks").count(), layout === "overview" ? 1 : 0);
      for (const [label, format] of [["Lataa PDF", "pdf"], ["Lataa Excel", "xlsx"], ["Lataa CSV", "csv"], ["Lataa ICS", "ics"]]) {
        const waiting = page.waitForEvent("download"); await page.getByRole("button", { name: label, exact: true }).click();
        const file = await waiting; assert.equal(file.suggestedFilename(), `rakennuskalenteri.${format}`);
        const path = join(output, `${year}-${layout}.${format}`); await file.saveAs(path);
        const bytes = readFileSync(path); assert.ok(bytes.length > 100);
        if (format === "pdf") {
          const parsed = spawnSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
          assert.equal(parsed.status, 0); assert.ok(parsed.stdout.includes("Äänekosken rakennusyrityksen pitkä suomalainen yhteistyöprojekti"));
          assert.ok(parsed.stdout.includes("Sisäinen huomio: öljy ja jäätyminen."));
          assert.equal(parsed.stdout.includes("Lopputoimitus"), layout === "overview");
        } else if (format === "ics") {
          const text = bytes.toString("utf8").replace(/\r\n[ \t]/g, "");
          assert.ok(text.includes("SUMMARY:Toimitus: Lopputoimitus"));
          assert.ok(text.includes("Nostokaluston käyttö"));
          assert.ok(text.includes("Betonoinnin lämpötila"));
          assert.ok(!text.match(/URL:|REFRESH-INTERVAL|TZID/));
        } else if (format === "csv") {
          assert.deepEqual([...bytes.slice(0, 3)], [239, 187, 191]);
          assert.ok(bytes.toString("utf8").includes("Lopputoimitus"));
        } else assert.deepEqual([...bytes.slice(0, 2)], [80, 75]);
      }
    }
    await page.locator("#c-layout").selectOption("weekly");
    const finalDate = new Date(year + 1, 0, 10);
    const lastWeek = `${isoYear(finalDate)}-${isoWeek(finalDate)}`;
    await page.locator("#c-week").selectOption(lastWeek);
    assert.ok((await page.locator(".construction-preview").textContent()).includes("Lopputoimitus"));
    await rows.nth(6).getByLabel("Päivämäärä", { exact: true }).fill(`${year + 1}-01-12`);
    assert.equal(await page.getByRole("alert").count(), 1);
    assert.equal(await page.getByRole("button", { name: "Lataa PDF", exact: true }).isDisabled(), true);
    await rows.nth(6).getByLabel("Päivämäärä", { exact: true }).fill(`${year + 1}-01-10`);
    commands.push(...await page.evaluate(() => window.__constructionCommands));
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.screenshot({ path: join(output, "desktop.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".construction-editor").isVisible(), false);
  assert.equal(await page.locator(".construction-preview").isVisible(), true);
  assert.equal(await page.locator(".construction-help").isVisible(), false);
  await page.pdf({ path: join(output, "print-week.pdf"), preferCSSPageSize: true, printBackground: true });
  const printed = spawnSync("pdfinfo", [join(output, "print-week.pdf")], { encoding: "utf8" });
  assert.equal(printed.status, 0); assert.match(printed.stdout, /Pages:\s+1\b/);
  await page.emulateMedia({ media: "screen" });
  for (const name of ["construction_planner_started", "construction_planner_created", "construction_planner_export"]) assert.ok(commands.some((command) => command[1] === name), name);
  assert.ok(!JSON.stringify(commands).match(/Äänekosken|Yksityinen|Nostokaluston|Sisäinen|Runkotyö|pakkasriski/));
  assert.ok(!JSON.stringify(requests).match(/Äänekosken|Yksityinen|Nostokaluston|Sisäinen|Runkotyö|pakkasriski/));
  assert.deepEqual(errors.filter((error) => production || !error.startsWith("Hydration failed")), []);
  await page.reload(); await page.waitForSelector('.construction-editor[data-ready="true"]');
  assert.equal(await page.locator(".construction-row").count(), 0);
  assert.equal(await page.locator("#c-project").inputValue(), "Rakennusprojekti");
  const defaultDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Lataa ICS", exact: true }).click();
  await (await defaultDownload).saveAs(join(output, "default.ics"));
  assert.equal((await page.evaluate(() => window.__constructionCommands)).filter((command) => command[1] === "construction_planner_created").length, 1);
  if (production) {
    const noJs = await browser.newContext({ javaScriptEnabled: false }), landing = await noJs.newPage();
    await landing.goto(`${url}/rakennuskalenteri`);
    assert.ok(await landing.getByRole("heading", { name: "Rakennuskalenteri ja työmaan viikkoaikataulu", exact: true }).isVisible());
    assert.ok(await landing.getByText("Mitä rakennuskalenterilla voi suunnitella?", { exact: true }).isVisible());
    await noJs.close();
  }
  console.log(`Construction browser checks passed (${production ? "production" : "development"}); 24 exports and print preview: ${output}`);
} finally { await browser.close(); }
