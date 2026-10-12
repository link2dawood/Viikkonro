// Local-only browser checks: dev unlock is never enabled in production.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createForm, DRAFT_KEY, serializeDraft } from "../src/components/companyCalendar/formModel.js";
import { schoolHolidayCities } from "../src/platform/calendar/sources.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const url = process.env.CALENDAR_TEST_URL || "http://127.0.0.1:5173";
const production = process.env.CALENDAR_TEST_MODE === "production";
const output = mkdtempSync(join(tmpdir(), "viikkonro-company-ics-"));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const unfold = (ics) => ics.replace(/\r\n[ \t]/g, "");
const records = (ics) => [...unfold(ics).matchAll(/BEGIN:VEVENT\r\n([\s\S]*?)END:VEVENT/g)].map((match) => {
  const body = match[1];
  return { uid: /^UID:(.*)$/m.exec(body)[1].trim(), summary: /^SUMMARY:(.*)$/m.exec(body)[1].trim(), body };
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], requests = [], downloads = [], commands = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("download", (download) => downloads.push(download));
  await context.route("**/*", (route) => {
    const request = route.request();
    requests.push({ url: request.url(), body: request.postData() });
    return new URL(request.url()).origin === new URL(url).origin ? route.continue() : route.abort();
  });
  await context.addInitScript(() => {
    window.__icsCommands = [];
    window.clarity = (...args) => window.__icsCommands.push(args);
  });
  await page.goto(`${url}/yrityskalenteri/ics`);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.form.calendarId, DRAFT_KEY);
  const downloadIcs = async (name) => {
    const waiting = page.waitForEvent("download");
    await page.getByRole("button", { name: "Lataa ICS", exact: true }).click();
    const file = await waiting;
    assert.ok(file.suggestedFilename().endsWith(".ics"));
    const path = join(output, `${name}.ics`);
    await file.saveAs(path);
    const text = readFileSync(path, "utf8");
    assert.match(text, /X-WR-TIMEZONE:Europe\/Helsinki/);
    assert.ok(!text.includes("REFRESH-INTERVAL"));
    assert.equal(new Set(records(text).map((event) => event.uid)).size, records(text).length);
    return text;
  };
  for (const year of [2026, 2027, 2028]) {
    const form = createForm(year);
    form.companyName = "Äänekosken Työläiset ja Yhteistyökumppanit Oy";
    form.calendarId = "1234567890abcdef1234567890abcdef";
    form.flagDays = true;
    form.schoolCity = schoolHolidayCities(year)[0] || "";
    form.schoolOn = Boolean(form.schoolCity);
    form.paydayRule = "day";
    form.paydayDay = 1;
    form.paydayDates = [{ id: "salary", date: `${year}-03-10` }];
    form.closures = [{ id: "closure", label: "Vuodenvaihteen sulku", start: `${year - 1}-12-28`, end: `${year}-01-05` }];
    form.events = Array.from({ length: 25 }, (_, index) => ({ id: `meeting${index}`, date: `${year}-${year === 2028 ? "02-29" : "05-12"}`, title: `Henkilöstöpäivä ${index}` }));
    form.events.push({ ...form.events[0], id: "duplicate" });
    form.seasonOn = true;
    form.season = { label: "Kesälomakausi", start: `${year}-06-01`, end: `${year}-08-31` };
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: DRAFT_KEY, value: serializeDraft(form) });
    commands.push(...await page.evaluate(() => window.__icsCommands));
    await page.reload();
    await page.waitForFunction((year) => document.querySelector("#cc-year")?.value === String(year) && document.querySelector("#cc-name")?.value.startsWith("Äänekosken"), year);
    assert.equal(await page.locator("#cc-logo, #cc-color, #cc-paper").count(), 0);
    assert.equal(await page.locator(".cc-exports button.btn").count(), 1);
    assert.equal(await page.locator(".cc-layout").getAttribute("data-clarity-mask"), "True");
    await page.getByLabel("Yrityksen nimi", { exact: true }).fill(`${form.companyName} `);
    await page.waitForFunction(() => window.__icsCommands.some((command) => command[1] === "company_ics_preview"));
    await page.getByRole("button", { name: "Lataa ICS", exact: true }).click();
    await page.locator(".cc-unlock").waitFor();
    if (production) {
      assert.equal(downloads.length, 0);
      assert.equal(await page.getByRole("button", { name: "Avaa lataukset (testi)" }).count(), 0);
      assert.match(await page.locator(".cc-unlock").textContent(), /Osta lataukset/);
      // Editing local data does not forge an export entitlement.
      await page.evaluate(() => localStorage.setItem("viikkonro:dev-license", JSON.stringify({ productId: "company-calendar", tier: "paid", expiresOn: "2099-12-31" })));
    } else {
      const unlock = page.getByRole("button", { name: "Avaa lataukset (testi)" });
      // Previous test years can retain the genuine development-only licence.
      if (await unlock.count()) await unlock.click();
      const first = await downloadIcs(`${year}-first`);
      assert.match(first, new RegExp(`DTSTART;VALUE=DATE:${year - 1}1228`));
      assert.match(first, new RegExp(`DTEND;VALUE=DATE:${year}0106`));
      assert.match(unfold(first), /SUMMARY:Kesälomakausi/);
      assert.equal(records(first).filter((event) => event.summary === "Henkilöstöpäivä 0").length, 1);
      if (year === 2028) assert.match(first, /DTSTART;VALUE=DATE:20280229/);
      const originalUid = records(first).find((event) => event.summary === "Henkilöstöpäivä 1").uid;
      await page.getByLabel("Tapahtuman nimi", { exact: true }).nth(1).fill("Päivitetty henkilöstöpäivä");
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.form.events[1].title === "Päivitetty henkilöstöpäivä", DRAFT_KEY);
      commands.push(...await page.evaluate(() => window.__icsCommands));
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('[aria-label="Tapahtuman nimi"]')[1]?.value === "Päivitetty henkilöstöpäivä");
      const next = await downloadIcs(`${year}-reload`);
      assert.equal(records(next).find((event) => event.summary === "Päivitetty henkilöstöpäivä").uid, originalUid);
      await page.goto(`${url}/yrityskalenteri`);
      await page.waitForFunction(() => document.querySelectorAll('[aria-label="Tapahtuman nimi"]')[1]?.value === "Päivitetty henkilöstöpäivä");
      const builder = await downloadIcs(`${year}-builder`);
      assert.deepEqual(records(builder).map((event) => event.uid), records(next).map((event) => event.uid));
      await page.getByRole("button", { name: "Lukitse uudelleen" }).click();
      await page.getByRole("link", { name: "Yrityksen ICS-kalenteri ja tuontiohjeet" }).click();
      await page.getByRole("heading", { level: 1, name: `Yrityksen ICS-kalenteri ${year}` }).waitFor();
    }
  }
  commands.push(...await page.evaluate(() => window.__icsCommands));
  for (const name of ["company_ics_view", "company_ics_preview", "company_ics_export_attempt"]) assert.ok(commands.some((command) => command[1] === name), name);
  if (!production) for (const name of ["company_ics_export", "company_ics_cta"]) assert.ok(commands.some((command) => command[1] === name), name);
  assert.doesNotMatch(JSON.stringify(commands), /Äänekosken|Henkilöstöpäivä|Päivitetty|data:image|2028-02-29/);
  assert.doesNotMatch(JSON.stringify(requests), /Äänekosken|Henkilöstöpäivä|Päivitetty|1234567890abcdef|%C3%84%C3%A4nekosken/);
  // Route changes must preserve edits even before the 500 ms draft save fires.
  await page.goto(`${url}/yrityskalenteri`);
  await page.waitForFunction(() => document.querySelector("#cc-name")?.value.startsWith("Äänekosken"));
  await page.locator("#cc-name").fill("Nopea siirtyminen Oy");
  await page.getByRole("link", { name: "Yrityksen ICS-kalenteri ja tuontiohjeet", exact: true }).click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.form.companyName === "Nopea siirtyminen Oy", DRAFT_KEY);
  assert.equal(await page.locator("#cc-name").inputValue(), "Nopea siirtyminen Oy");
  await page.screenshot({ path: join(output, "desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow at ${width}`);
  }
  await page.screenshot({ path: join(output, "mobile.png"), fullPage: true });
  assert.deepEqual(errors.filter((error) => production || !error.startsWith("Hydration failed")), []);
  if (production) {
    const staticContext = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(`${url}/yrityskalenteri/ics`);
    assert.ok(await staticPage.getByRole("heading", { name: "ICS-tiedoston tuonti kalenterisovellukseen" }).isVisible());
    await staticContext.close();
  }
  console.log(`Company ICS browser checks passed (${production ? "production" : "development"}); artifacts: ${output}`);
} finally { await browser.close(); }
