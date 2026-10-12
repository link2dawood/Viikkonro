import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
const { chromium } = await import(process.env.WIDGET_PLAYWRIGHT_MODULE ?? "/tmp/viikkonro-browser-check/node_modules/playwright/index.mjs");
const rules = JSON.parse(fs.readFileSync("vercel.json", "utf8")).headers;
const enforced = rules.find((r) => r.source === "/widget/calendar/(.*)").headers;
const widget = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const file = url.pathname === "/widget/calendar/v1" ? "v1.html" : url.pathname === "/widget/calendar/v1.js" ? "v1.js" : null;
  if (!file) { res.writeHead(404); res.end(); return; }
  const headers = Object.fromEntries(enforced.map(({ key, value }) => [key, value]));
  res.writeHead(200, { ...headers, "Content-Type": file.endsWith(".js") ? "text/javascript" : "text/html" });
  res.end(fs.readFileSync(path.join("dist/widget/calendar", file)));
});
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
const widgetOrigin = await listen(widget);
const host = http.createServer((_req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(`<html><body style="margin:0"><iframe id="calendar" title="Yrityskalenteri" referrerpolicy="no-referrer" src="${widgetOrigin}/widget/calendar/v1" style="width:100%;height:650px;border:0"></iframe><iframe id="attacker" srcdoc="<p>Other frame</p>" hidden></iframe></body></html>`); });
const hostOrigin = await listen(host);
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.WIDGET_CHROMIUM ?? "/home/link2dawood/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 900, height: 850 }, timezoneId: "America/New_York" });
  await context.addInitScript(() => {
    const RealDate = Date; window.__instant = "2026-12-31T22:30:00Z";
    window.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [window.__instant])); } static now() { return new RealDate(window.__instant).getTime(); } };
  });
  const page = await context.newPage(), errors = [], requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(hostOrigin);
  const frame = page.frames().find((f) => f.url().startsWith(widgetOrigin));
  await frame.locator("table").waitFor();
  assert.match(await frame.locator(".summary").textContent(), /53\/2026.*2027-01-01/);
  assert.equal(await frame.locator("td").count(), 35);
  await frame.evaluate(() => { window.__instant = "2027-01-31T22:30:00Z"; window.dispatchEvent(new Event("focus")); });
  assert.match(await frame.locator(".summary").textContent(), /2027-02-01/);
  const configure = async (config, version = 1) => {
    await page.evaluate(({ config, version, origin }) => document.getElementById("calendar").contentWindow.postMessage({ type: "viikkonro-calendar:configure", version, config }, origin), { config, version, origin: widgetOrigin });
  };
  await configure({ date: "2028-02-29", companyName: "Ääkköset Oy", theme: "dark", color: "#abc123", events: [{ date: "2028-02-29", title: '<img src="https://example.com/leak" onerror="alert(1)">' }, { date: "2028-02-29", title: "Päällekkäinen päivä" }] });
  await frame.getByRole("heading", { name: "Ääkköset Oy" }).waitFor();
  assert.equal(await frame.locator("td time").count(), 29);
  assert.equal(await frame.locator("img").count(), 0);
  assert.equal(await frame.locator(".event").count(), 2);
  assert.match(await frame.locator(".event").first().textContent(), /<img/);
  assert.equal(await frame.locator("html").getAttribute("data-theme"), "dark");
  await page.frames().find((f) => f.url() === "about:srcdoc").evaluate(() => parent.frames[0].postMessage({ type: "viikkonro-calendar:configure", version: 1, config: { companyName: "ATTACK" } }, "*"));
  await configure({ companyName: "WRONG VERSION" }, 2);
  await configure({ token: "private", companyName: "INVALID" });
  // A round trip through the message queue ensures rejected messages were processed.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 80)));
  assert.equal(await frame.locator("h1").textContent(), "Ääkköset Oy");
  await frame.getByRole("button", { name: "Seuraava kuukausi" }).focus();
  await frame.getByRole("button", { name: "Seuraava kuukausi" }).press("Enter");
  assert.match(await frame.locator(".summary").textContent(), /2028-03-01/);
  assert.equal(await frame.evaluate(() => document.activeElement.getAttribute("aria-label")), "Seuraava kuukausi");
  await configure({ date: "2027-01-01", view: "week" });
  await frame.locator('time[datetime="2026-12-28"]').waitFor();
  assert.equal(await frame.locator("td time").count(), 7);
  assert.match(await frame.locator(".holiday").textContent(), /Uudenvuodenpäivä/);
  await configure({ date: "2028-02-29", companyName: "Pitkä suomalainen yritysnimi Ääkköset ".repeat(4), events: Array.from({ length: 100 }, (_, i) => ({ id: `event-${i}`, date: "2028-02-29", title: `Yrityksen tapahtuma ${i}` })) });
  await frame.locator(".event").nth(99).waitFor();
  await page.setViewportSize({ width: 320, height: 700 });
  assert.ok(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await frame.evaluate(() => document.documentElement.scrollHeight > innerHeight));
  assert.deepEqual(await frame.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie })), { local: 0, session: 0, cookies: "" });
  assert.deepEqual(errors, []);
  assert.ok(requests.every((url) => url.startsWith(hostOrigin) || url === `${widgetOrigin}/widget/calendar/v1` || url === `${widgetOrigin}/widget/calendar/v1.js`));
  const response = await context.request.get(`${widgetOrigin}/widget/calendar/v1`);
  assert.match(response.headers()["content-security-policy"], /connect-src 'none'/);
  await page.goto(`${widgetOrigin}/widget/calendar/v1?companyName=private`);
  await page.getByRole("alert").waitFor();
  assert.ok(!(await page.locator("body").textContent()).includes("private"));
  console.log("Business widget browser checks passed: cross-origin embed, Helsinki midnight, leap year, ISO boundary, CSP, keyboard, mobile, 100 events, XSS, message isolation and no data requests/storage.");
} finally {
  if (browser) await browser.close();
  await Promise.all([new Promise((resolve) => widget.close(resolve)), new Promise((resolve) => host.close(resolve))]);
}
