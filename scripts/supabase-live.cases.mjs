// Explicit live verification: creates only synthetic temporary accounts and
// organizations, then removes them. No emails are sent or secrets persisted.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { randomUUID, randomBytes } from "node:crypto";

const project = readFileSync("supabase/.temp/project-ref", "utf8").trim();
const token = process.env.SUPABASE_ACCESS_TOKEN || readFileSync(`${homedir()}/.supabase/access-token`, "utf8").trim();
const config = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => /^VITE_TEAM_SUPABASE_(URL|PUBLISHABLE_KEY)=/.test(line)).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
}));
const origin = config.VITE_TEAM_SUPABASE_URL;
assert.equal(new URL(origin).hostname, `${project}.supabase.co`, "Linked project and client configuration must match");
const publishable = config.VITE_TEAM_SUPABASE_PUBLISHABLE_KEY;
const identities = [], organizations = [], checks = [];
let service;

async function request(base, path, method, body, headers) {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}
function check(condition, label) { assert.ok(condition, label); checks.push(label); }
async function api(path, method = "GET", body, session) {
  return request(origin, path, method, body, { apikey: session === "admin" ? service : publishable, ...(session ? { Authorization: `Bearer ${session === "admin" ? service : session}` } : {}) });
}
async function rpc(name, body, session) { return api(`/rest/v1/rpc/${name}`, "POST", body, session); }
async function success(name, body, session) {
  const result = await rpc(name, body, session);
  assert.equal(result.status, 200, `RPC ${name} status; code ${result.data?.code || "none"}`);
  return result.data;
}
async function command(org, action, data, session, name = "team_command") {
  const snapshot = await success("team_snapshot", { p_org: org }, session);
  return success(name, { p_org: org, p_action: action, p_data: { expected_version: snapshot.organization.version, ...data } }, session);
}

try {
  const keys = await request("https://api.supabase.com", `/v1/projects/${project}/api-keys`, "GET", undefined, { Authorization: `Bearer ${token}` });
  assert.equal(keys.status, 200, "Administrative API access");
  service = keys.data.find((key) => key.name === "service_role")?.api_key;
  assert.ok(service, "Admin key available only in process memory");
  for (const role of ["owner-a", "owner-b", "manager", "employee"]) {
    const identity = { email: `viikkonro-${role}-${randomUUID()}@example.invalid`, password: randomBytes(24).toString("base64url") };
    const created = await api("/auth/v1/admin/users", "POST", { email: identity.email, password: identity.password, email_confirm: true }, "admin");
    assert.equal(created.status, 200, "Create temporary confirmed identity without sending email");
    identity.id = created.data.id;
    identities.push(identity);
    const login = await api("/auth/v1/token?grant_type=password", "POST", { email: identity.email, password: identity.password });
    assert.equal(login.status, 200, "Real password authentication");
    identity.session = login.data.access_token;
  }
  checks.push("Four real Auth sessions created");
  const [a, b, manager, employee] = identities;
  for (const owner of [a, b]) {
    const id = await success("team_create_organization", { p_name: `Activation test ${randomUUID()}`, p_year: 2027, p_label: "Synthetic owner" }, owner.session);
    owner.org = id;
    organizations.push({ id, session: owner.session });
  }
  check((await success("team_list_organizations", {}, a.session)).length === 1, "JWT-scoped organization listing");
  const hidden = await api(`/rest/v1/team_organizations?id=eq.${b.org}&select=id`, "GET", undefined, a.session);
  check(hidden.status === 200 && hidden.data.length === 0, "RLS hides another tenant's table rows");
  const forbidden = await rpc("team_snapshot", { p_org: b.org }, a.session);
  check(forbidden.data?.code === "42501", "RPC denies another tenant's snapshot");
  const anonymous = await rpc("team_list_organizations", {});
  check([401, 403, 404].includes(anonymous.status), "Anonymous users cannot list organizations");
  const direct = await api(`/rest/v1/team_organizations?id=eq.${a.org}`, "PATCH", { name: "Forbidden write" }, a.session);
  check(direct.data?.code === "42501", "Direct table writes are revoked");
  for (const identity of [manager, employee]) {
    await command(a.org, "member", { label: `Synthetic ${identity === manager ? "manager" : "employee"}` }, a.session);
    const snapshot = await success("team_snapshot", { p_org: a.org }, a.session);
    identity.member = snapshot.members.find((row) => row.label === `Synthetic ${identity === manager ? "manager" : "employee"}`).id;
    const invitation = await command(a.org, "invite", { email: identity.email, member_id: identity.member, role: identity === manager ? "manager" : "employee" }, a.session);
    await success("team_accept_invite", { p_token: invitation.token }, identity.session);
  }
  check((await success("team_snapshot", { p_org: a.org }, manager.session)).role === "manager", "Manager invitation checks real confirmed identity");
  const employeeView = await success("team_snapshot", { p_org: a.org }, employee.session);
  check(employeeView.role === "employee" && employeeView.memberships.length === 0, "Employee cannot read access-management records");
  const employeeAdmin = await rpc("team_command", { p_org: a.org, p_action: "member", p_data: { expected_version: employeeView.organization.version, label: "Forbidden employee administration" } }, employee.session);
  check(employeeAdmin.data?.code === "42501", "Employee cannot administer members");
  await command(a.org, "closure", { start_date: "2027-12-31", end_date: "2028-01-02", label: "Synthetic closure" }, manager.session);
  check((await success("team_snapshot", { p_org: a.org }, a.session)).closures.length === 1, "Manager creates a cross-year closure");
  const shiftView = await success("shift_snapshot", { p_org: a.org }, employee.session);
  check(shiftView.role === "employee", "Shift snapshot respects employee membership");
  const deniedShift = await rpc("shift_snapshot", { p_org: b.org }, employee.session);
  check(deniedShift.data?.code === "42501", "Shift snapshots preserve tenant isolation");

  await success("business_firm_command", { p_org: a.org, p_action: "enable", p_data: {} }, a.session);
  const clients = [];
  for (const name of ["Synthetic client A", "Synthetic client B"]) clients.push(await success("business_firm_command", { p_org: a.org, p_action: "create_client", p_data: { name } }, a.session));
  await success("business_client_command", { p_client: clients[0], p_action: "grant_access", p_data: { email: b.email, role: "viewer" } }, a.session);
  check((await success("business_snapshot", { p_client: clients[0], p_year: 2027 }, b.session)).role === "viewer", "Client-specific viewer grant works");
  const sibling = await rpc("business_snapshot", { p_client: clients[1], p_year: 2027 }, b.session);
  check(sibling.data?.code === "42501", "Client viewer cannot access a sibling company");
  const templates = await rpc("business_templates_list", { p_org: a.org }, b.session);
  check(templates.data?.code === "42501", "Client viewer cannot access firm templates");
  for (const [name, args] of [["business_api_issue", { p_label: "Forbidden" }], ["billing_catalog_get", {}]]) {
    const denied = await rpc(name, args, employee.session);
    check([401, 403, 404].includes(denied.status), `Browser session cannot execute ${name}`);
  }
  await command(a.org, "revoke_access", { user_id: manager.id }, a.session);
  const revoked = await rpc("team_snapshot", { p_org: a.org }, manager.session);
  check(revoked.data?.code === "42501", "Revocation immediately invalidates an existing JWT's access");
  const recovery = await api("/auth/v1/admin/generate_link", "POST", { type: "recovery", email: a.email }, "admin");
  check(recovery.status === 200 && /^\d{8}$/.test(recovery.data.email_otp), "Recovery generates the configured eight-digit code without sending mail");
  const verified = await api("/auth/v1/verify", "POST", { email: a.email, token: recovery.data.email_otp, type: "recovery" });
  check(verified.status === 200 && Boolean(verified.data.access_token), "Real recovery OTP verification");
} finally {
  const cleanupErrors = [];
  for (const organization of organizations.reverse()) {
    try { await command(organization.id, "delete_organization", {}, organization.session); }
    catch { cleanupErrors.push("temporary organization"); }
  }
  for (const identity of identities) {
    try {
      const result = await api(`/auth/v1/admin/users/${identity.id}`, "DELETE", undefined, "admin");
      if (result.status !== 200) cleanupErrors.push("temporary identity");
    } catch { cleanupErrors.push("temporary identity"); }
  }
  assert.equal(cleanupErrors.length, 0, "Temporary activation records must be removed");
}
console.log(JSON.stringify({ passed: checks.length, temporaryAccountsRemoved: identities.length, temporaryOrganizationsRemoved: organizations.length, emailsSent: 0 }));
