import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const root = fs.mkdtempSync(path.join(os.tmpdir(), "viikkonro-team-browser-"));
const base = process.env.TEAM_TEST_URL ?? "http://127.0.0.1:4174";
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
// Test-only HTTP fixtures exercise the real Supabase SDK. SQL isolation is tested separately against PostgreSQL.
const org = { id: id(1), name: "Ääkkösyritys A Oy", calendar_year: 2027, min_coverage: 2, include_holidays: true, version: 1 };
const state = { organization: org, departments: [], members: [{ id: id(2), label: "Työntekijä", active: true }, { id: id(3), label: "Omistaja", active: true }, { id: id(4), label: "Esihenkilö", active: true }], types: [{ id: id(5), name: "Vuosiloma", kind: "vacation" }, { id: id(9), name: "Yksityinen vapaa", kind: "custom" }], leaves: [{ id: id(6), member_id: id(3), type_id: id(9), start_date: "2027-07-01", end_date: "2027-07-10", status: "approved" }, { id: id(7), member_id: id(2), type_id: id(5), start_date: "2027-07-01", end_date: "2027-07-10", status: "pending" }], closures: [], memberships: [{ user_id: id(3), role: "owner", member_id: id(3) }, { user_id: id(4), role: "manager", member_id: id(4) }, { user_id: id(2), role: "employee", member_id: id(2) }], invites: [] };
let sequence = 100, delaySnapshot = false, delayNextSnapshot = false, downgradeManager = false;
state.shift_templates = []; state.shifts = []; state.availability = [];
let lastPage;
const user = (email) => ({ id: email.startsWith("employee") ? id(2) : email.startsWith("manager") ? id(4) : id(3), email, role: "authenticated", aud: "authenticated", email_confirmed_at: "2026-10-10T00:00:00Z" });
const roleOf = (uid) => uid === id(2) || (uid === id(4) && downgradeManager) ? "employee" : uid === id(4) ? "manager" : "owner";
const session = (account) => ({ access_token: `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: account.id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.fixture`, refresh_token: "test-only-refresh", expires_in: 3600, token_type: "bearer", user: account });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const snapshot = (uid, orgId) => {
  const role = roleOf(uid), next = structuredClone(state), y = next.organization.calendar_year;
  if (orgId === id(20)) { next.organization = { ...next.organization, id: id(20), name: "Organisaatio B" }; next.members = []; next.leaves = []; next.memberships = []; next.invites = []; }
  next.role = role; next.member_id = uid;
  next.leaves = next.leaves.filter((l) => l.start_date <= `${y}-12-31` && l.end_date >= `${y}-01-01`).map((l) => ({ ...l, type_id: role === "employee" && l.member_id !== uid ? null : l.type_id }));
  if (role !== "owner") { next.memberships = []; next.invites = []; }
  for (const name of ["shift_templates", "shifts", "availability"]) next[name] = next[name].map((r) => ({ ...r, organization_id: orgId, ...(name !== "shift_templates" && role === "employee" && r.member_id !== uid ? { notes: "" } : {}) }));
  if (orgId === id(20)) { next.shift_templates = []; next.shifts = []; next.availability = []; }
  return next;
};
try {
  const context = await browser.newContext({ acceptDownloads: true });
  const requests = [], errors = [];
  const policy = JSON.parse(fs.readFileSync("vercel.json", "utf8")).headers.find((h) => h.source === "/tiimin-lomat/suunnittelu");
  await context.route(`${base}/tiimin-lomat/suunnittelu`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...Object.fromEntries(policy.headers.map((h) => [h.key.toLowerCase(), h.value])) } });
  });
  await context.route("https://team-test.supabase.co/**", async (route) => {
    const request = route.request(), pathname = new URL(request.url()).pathname, body = request.postDataJSON() ?? {};
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (pathname.startsWith("/auth/v1/")) {
      if (pathname.includes("/token")) return reply(session(user(body.email ?? "owner@example.test")));
      if (pathname.includes("/signup")) return reply({ user: user(body.email) });
      if (pathname.includes("/recover")) return reply({ msg: "Error sending recovery email", error_code: "unexpected_failure" }, 500);
      return reply({});
    }
    const jwt = request.headers().authorization?.split(" ")[1];
    const uid = jwt?.includes(".") ? JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()).sub : null;
    if (!uid) return reply({ code: "42501", message: "Forbidden" }, 403);
    const fn = pathname.split("/").at(-1), role = roleOf(uid);
    if (fn === "team_list_organizations") return reply([{ id: id(1), name: org.name, role }, ...(role === "owner" ? [{ id: id(20), name: "Organisaatio B", role }] : [])]);
    if (fn === "team_snapshot" || fn === "shift_snapshot") { const next = snapshot(uid, body.p_org); if (delaySnapshot || delayNextSnapshot) { delayNextSnapshot = false; await sleep(350); } return reply(next); }
    if (fn === "shift_command") {
      const d = body.p_data, action = body.p_action;
      if (d.expected_version !== org.version) return reply({ code: "40001" }, 409);
      if (role === "employee" && (action !== "availability" || d.member_id !== uid)) return reply({ code: "42501" }, 403);
      const name = action === "template" ? "shift_templates" : action === "shift" ? "shifts" : "availability";
      const next = { ...d, id: d.id || id(++sequence), organization_id: body.p_org };
      if (name === "shift_templates") { next.start_time = d.start_time.slice(0, 5) + ":00"; next.end_time = d.end_time.slice(0, 5) + ":00"; }
      const existing = state[name].find((r) => r.id === d.id);
      if (existing) Object.assign(existing, next); else state[name].push(next);
      org.version += 1; return reply({});
    }
    if (fn === "team_command") {
      const d = body.p_data, action = body.p_action;
      if (d.expected_version !== org.version) return reply({ code: "40001", message: "Stale calendar" }, 409);
      if (role === "employee" && action !== "leave" && action !== "remove_leave") return reply({ code: "42501" }, 403);
      if (action === "settings") Object.assign(org, d);
      else if (action === "department") state.departments.push({ id: id(++sequence), name: d.name });
      else if (action === "member") state.members.push({ ...d, id: id(++sequence), active: d.active });
      else if (action === "type") state.types.push({ id: id(++sequence), name: d.name, kind: "custom" });
      else if (action === "closure") state.closures.push({ ...d, id: id(++sequence) });
      else if (action === "leave") {
        const existing = state.leaves.find((l) => l.id === d.id);
        if (existing) Object.assign(existing, d); else state.leaves.push({ ...d, id: id(++sequence) });
      }
      org.version += 1; return reply(action === "invite" ? { token: "c".repeat(64) } : {});
    }
    return reply({ code: "42501" }, 403);
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message)); page.on("request", (request) => requests.push(request.url()));
  lastPage = page;
  const login = async (email) => {
    await page.goto(`${base}/tiimin-lomat/suunnittelu`);
    const form = page.locator(".team-auth > form"); await form.getByLabel("Sähköposti", { exact: true }).fill(email); await form.getByLabel("Salasana", { exact: true }).fill("LongPassword123!"); await form.getByRole("button", { name: "Kirjaudu", exact: true }).click();
    await page.locator(".team-org select").selectOption(id(1)); await page.locator(".team-preview").waitFor();
  };
  const download = async (format, prefix) => {
    const promise = page.waitForEvent("download"); await page.getByRole("button", { name: `Lataa ${format === "xlsx" ? "Excel" : format.toUpperCase()}`, exact: true }).click();
    const file = await promise, target = path.join(root, `${prefix}.${format}`); await file.saveAs(target); assert.ok(fs.statSync(target).size > 100);
    await page.getByRole("status").filter({ hasText: "Yksityinen tiedosto on valmis" }).waitFor();
    return target;
  };
  await page.goto(`${base}/tiimin-lomat/suunnittelu`);
  await page.getByText("Unohditko salasanan?", { exact: true }).click();
  await page.getByLabel("Palautuksen sähköposti", { exact: true }).fill("owner@example.test");
  await page.getByRole("button", { name: "Pyydä palautuskoodi", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Palautus epäonnistui" }).waitFor();
  assert.ok(!(await page.locator(".team-auth").innerText()).includes("Jos osoitteella on tili"));
  await login("owner@example.test");
  const openShifts = async () => { await page.getByRole("button", { name: "Työvuorosuunnittelu", exact: true }).click(); await page.getByRole("table", { name: "Työvuorolista ja päiväkattavuus" }).waitFor(); };
  const backToLeave = async () => { await page.getByRole("button", { name: "Lomasuunnittelu", exact: true }).click(); await page.locator(".team-preview").waitFor(); };
  const shiftDownload = async (format, prefix) => {
    const promise = page.waitForEvent("download"); await page.getByRole("button", { name: `Lataa työvuorot ${format === "xlsx" ? "Excel" : format.toUpperCase()}`, exact: true }).click();
    const file = await promise, target = path.join(root, `${prefix}.${format}`); await file.saveAs(target); assert.ok(fs.statSync(target).size > 100);
    await page.getByRole("status").filter({ hasText: "Yksityinen tiedosto on valmis" }).waitFor(); return target;
  };
  await openShifts(); await page.getByText("Vuoromallit", { exact: true }).click();
  const templateForm = page.getByRole("form", { name: "Vuoromallilomake" });
  for (const kind of ["morning", "evening", "night", "custom"]) {
    await templateForm.getByRole("combobox", { name: "Vuoron tyyppi", exact: true }).selectOption(kind);
    await templateForm.getByRole("button", { name: "Tallenna vuoromalli", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  }
  const shiftForm = page.getByRole("form", { name: "Vuorolomake" });
  await shiftForm.getByRole("combobox", { name: "Henkilö", exact: true }).selectOption(id(3));
  await shiftForm.getByRole("combobox", { name: "Vuoromalli", exact: true }).selectOption(state.shift_templates.find((t) => t.kind === "night").id);
  await shiftForm.getByLabel("Mallin päivämäärä", { exact: true }).fill("2027-07-05");
  assert.equal(await shiftForm.getByLabel("Loppu (Suomen aika)", { exact: true }).inputValue(), "2027-07-06T06:00");
  await shiftForm.getByLabel("Muistiinpano (vain työjärjestelyt)", { exact: true }).fill("Private coworker shift note");
  await shiftForm.getByRole("button", { name: "Tallenna vuoro", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await shiftForm.getByRole("combobox", { name: "Henkilö", exact: true }).selectOption(id(3));
  await shiftForm.getByLabel("Alku (Suomen aika)", { exact: true }).fill("2027-07-05T23:00"); await shiftForm.getByLabel("Loppu (Suomen aika)", { exact: true }).fill("2027-07-06T07:00");
  await shiftForm.getByRole("button", { name: "Tallenna vuoro", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await page.getByLabel("Jakson päivä", { exact: true }).fill("2027-07-05");
  assert.ok((await page.getByRole("table", { name: "Työvuorolista ja päiväkattavuus" }).innerText()).includes("Päällekkäinen vuoro"));
  await page.getByRole("combobox", { name: "Työvuorolistan näkymä", exact: true }).selectOption("month");
  assert.equal(await page.getByRole("table", { name: "Työvuorolista ja päiväkattavuus" }).locator("tbody tr").count(), 31);
  for (const format of ["pdf", "xlsx", "ics"]) await shiftDownload(format, "shift-owner");
  await backToLeave();
  await page.getByText("Organisaation hallinta", { exact: true }).click();
  for (const year of [2026, 2027, 2028]) {
    await page.locator(".team-settings").getByLabel("Kalenterivuosi", { exact: true }).fill(String(year)); await page.getByRole("button", { name: "Tallenna asetukset", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
    for (const format of ["pdf", "xlsx", "ics"]) await download(format, `owner-${year}`);
  }
  await page.locator(".team-settings").getByLabel("Kalenterivuosi", { exact: true }).fill("2027"); await page.getByRole("button", { name: "Tallenna asetukset", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await page.getByLabel("Uusi osasto", { exact: true }).fill("Rakennussuunnittelu"); await page.getByRole("button", { name: "Lisää osasto", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await page.getByLabel("Uuden jäsenen nimi tai tunniste").fill("Uusi jäsen"); await page.getByRole("button", { name: "Lisää jäsen", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await page.getByLabel("Uusi poissaololaji", { exact: true }).fill("Koulutus"); await page.getByRole("button", { name: "Lisää poissaololaji", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  const closure = page.locator(".team-settings form").filter({ has: page.getByLabel("Uuden sulun nimi", { exact: true }) });
  await closure.getByLabel("Uuden sulun nimi").fill("Yrityksen kesäsulku"); await closure.getByLabel("Alku", { exact: true }).fill("2027-07-05"); await closure.getByLabel("Loppu", { exact: true }).fill("2027-07-06"); await closure.getByRole("button", { name: "Lisää yrityksen sulku", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await page.getByRole("combobox", { name: "Näkymä", exact: true }).selectOption("year"); assert.equal(await page.locator(".team-month").count(), 12);
  await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)); await page.setViewportSize({ width: 1280, height: 900 });
  delaySnapshot = true; await page.locator(".team-org select").selectOption(id(20)); await page.locator(".team-preview h2").filter({ hasText: "Organisaatio B" }).waitFor(); assert.ok(!(await page.locator(".team-preview").innerText()).includes("Ääkkösyritys A"));
  await page.locator(".team-org select").selectOption(id(1)); await page.locator(".team-preview h2").filter({ hasText: "Ääkkösyritys A" }).waitFor();
  let afterLogoutDownloads = 0; page.on("download", () => { afterLogoutDownloads += 1; });
  await page.getByRole("button", { name: "Lataa PDF", exact: true }).click(); await page.getByRole("button", { name: "Kirjaudu ulos", exact: true }).click(); await sleep(600); assert.equal(afterLogoutDownloads, 0); assert.equal(await page.locator(".team-preview").count(), 0); delaySnapshot = false;
  await login("employee@example.test"); assert.equal(await page.getByText("Organisaation hallinta", { exact: true }).count(), 0);
  await openShifts(); await page.getByLabel("Jakson päivä", { exact: true }).fill("2027-07-05");
  assert.equal(await page.getByRole("form", { name: "Vuorolomake" }).count(), 0); assert.equal(await page.getByRole("form", { name: "Vuoromallilomake" }).count(), 0);
  assert.ok(!(await page.locator('section[aria-label="Työvuorosuunnittelija"]').innerText()).includes("Private coworker shift note"));
  const availabilityForm = page.getByRole("form", { name: "Estelomake" });
  assert.equal(await availabilityForm.getByRole("combobox", { name: "Henkilö", exact: true }).locator("option").count(), 1);
  await availabilityForm.getByLabel("Alku (Suomen aika)", { exact: true }).fill("2027-07-05T09:00"); await availabilityForm.getByLabel("Loppu (Suomen aika)", { exact: true }).fill("2027-07-05T17:00");
  await availabilityForm.getByRole("button", { name: "Tallenna este", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  for (const format of ["pdf", "xlsx", "ics"]) {
    const file = await shiftDownload(format, "shift-employee");
    const content = format === "pdf" ? execFileSync("pdftotext", [file, "-"], { encoding: "utf8" }) : fs.readFileSync(file).toString("utf8"); assert.ok(!content.includes("Private coworker shift note"));
  }
  await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)); await page.setViewportSize({ width: 1280, height: 900 });
  await backToLeave();
  const ownerRow = page.locator(".team-leaves tr").filter({ hasText: "Omistaja" }); assert.ok((await ownerRow.innerText()).includes("Poissaolo")); assert.ok(!(await ownerRow.innerText()).includes("Yksityinen vapaa"));
  assert.equal(await page.locator(".team-leave-editor").getByRole("combobox", { name: "Tiimin jäsen", exact: true }).locator("option").count(), 1);
  for (const format of ["pdf", "xlsx", "ics"]) {
    const file = await download(format, `employee-${format}`);
    const content = format === "pdf" ? execFileSync("pdftotext", [file, "-"], { encoding: "utf8" }) : fs.readFileSync(file).toString("utf8");
    assert.ok(!content.includes("Yksityinen vapaa"));
  }
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((key) => /supabase|auth-token/i.test(key)).length), 0);
  assert.ok(!requests.some((url) => /clarity|bing\.com|google-analytics|doubleclick/i.test(url))); assert.deepEqual(errors, []);
  const editor = page.locator(".team-leave-editor"); await editor.getByLabel("Alku", { exact: true }).fill("2027-07-05"); await editor.getByLabel("Loppu", { exact: true }).fill("2027-07-08"); await editor.getByRole("button", { name: "Tallenna poissaolo", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  await page.getByRole("button", { name: "Kirjaudu ulos", exact: true }).click(); await login("manager@example.test");
  await page.locator(".team-leaves tr").filter({ hasText: "2027-07-05-2027-07-08" }).getByRole("button", { name: "Muokkaa", exact: true }).click(); await page.locator(".team-leave-editor").getByRole("combobox", { name: "Tila", exact: true }).selectOption("approved"); await page.locator(".team-leave-editor").getByRole("button", { name: "Tallenna poissaolo", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Muutos tallennettu" }).waitFor();
  assert.ok((await page.locator(".team-leaves tr").filter({ hasText: "2027-07-05-2027-07-08" }).innerText()).includes("Hyväksytty"));
  for (const format of ["pdf", "xlsx", "ics"]) await download(format, `manager-${format}`);
  await openShifts(); await page.getByLabel("Jakson päivä", { exact: true }).fill("2027-07-05");
  await page.getByRole("button", { name: "Muokkaa vuoroa", exact: true }).first().click();
  assert.equal(await page.getByRole("form", { name: "Vuorolomake" }).locator("textarea").inputValue(), "Private coworker shift note");
  delayNextSnapshot = true;
  const shiftStarted = page.waitForRequest((r) => r.url().endsWith("shift_snapshot")); await page.evaluate(() => window.dispatchEvent(new Event("focus"))); await shiftStarted; await sleep(50);
  downgradeManager = true; org.version += 1;
  await page.getByRole("button", { name: "Päivitä työvuorot", exact: true }).click(); await sleep(500);
  assert.equal(await page.getByRole("form", { name: "Vuorolomake" }).count(), 0);
  assert.ok(!(await page.locator('section[aria-label="Työvuorosuunnittelija"]').innerText()).includes("Private coworker shift note"));
  assert.ok(!(await page.getByRole("form", { name: "Estelomake" }).getByLabel("Muistiinpano (vain työjärjestelyt)", { exact: true }).inputValue()).includes("Private coworker shift note"));
  downgradeManager = false; org.version += 1;
  await login("manager@example.test");
  delayNextSnapshot = true;
  const started = page.waitForRequest((r) => r.url().endsWith("team_snapshot")); await page.evaluate(() => window.dispatchEvent(new Event("focus"))); await started; await sleep(50);
  downgradeManager = true; org.version += 1;
  await page.getByRole("button", { name: "Päivitä tiedot", exact: true }).click(); await sleep(500);
  assert.ok((await page.locator(".team-controls").innerText()).includes("Käyttöoikeus: Työntekijä"));
  assert.ok(!(await page.locator(".team-leaves tr").filter({ hasText: "Omistaja" }).innerText()).includes("Yksityinen vapaa"));
  await page.reload(); assert.equal(await page.locator(".team-preview").count(), 0); await page.locator(".team-auth").waitFor();
  console.log(JSON.stringify({ output: root, downloads: 21, shiftTemplates: true, overnightShifts: true, shiftOverlap: true, employeeAvailability: true, shiftNoteRedaction: true, owner: true, managerApproval: true, employeeRedaction: true, organizationSwitch: true, logoutRace: true, permissionDowngradeRace: true, mobile: true, noAnalytics: true, noPersistedTokens: true, errors }));
} catch (error) {
  if (lastPage) { fs.writeFileSync(path.join(root, "failure.html"), await lastPage.content()); console.error((await lastPage.locator('[role="status"]').allTextContents()).join("\n")); }
  console.error(`Test fixture artifacts: ${root}`); throw error;
} finally { await browser.close(); }
