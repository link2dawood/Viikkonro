// Administrative setup only. Requires a sender already verified in Mailjet;
// does not register senders, send emails, or put credentials in browser code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const project = readFileSync("supabase/.temp/project-ref", "utf8").trim();
const token = process.env.SUPABASE_ACCESS_TOKEN || readFileSync(`${homedir()}/.supabase/access-token`, "utf8").trim();
const values = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((line) => /^(MAILJET_API_KEY|MAILJET_SECRET_KEY|MAILJET_FROM_EMAIL|VITE_TEAM_SUPABASE_URL)=/.test(line)).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
}));
assert.equal(new URL(values.VITE_TEAM_SUPABASE_URL).hostname, `${project}.supabase.co`, "Linked project must match client configuration");
const sender = values.MAILJET_FROM_EMAIL;
assert.ok(sender && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender), "Set MAILJET_FROM_EMAIL to an already verified Mailjet sender");
assert.ok(values.MAILJET_API_KEY && values.MAILJET_SECRET_KEY, "Server-only Mailjet credentials required");
const response = await fetch("https://api.mailjet.com/v3/REST/sender?Limit=100", {
  headers: { Authorization: `Basic ${Buffer.from(`${values.MAILJET_API_KEY}:${values.MAILJET_SECRET_KEY}`).toString("base64")}` }, signal: AbortSignal.timeout(30000),
});
assert.equal(response.status, 200, "Mailjet credentials must authenticate");
const senders = await response.json();
assert.ok(senders.Data.some((row) => row.Email.toLowerCase() === sender.toLowerCase() && row.Status === "Active"), "Sender must be registered and active in Mailjet before changing Supabase SMTP");
const endpoint = `https://api.supabase.com/v1/projects/${project}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const payload = {
  smtp_host: "in-v3.mailjet.com", smtp_port: "587", smtp_user: values.MAILJET_API_KEY, smtp_pass: values.MAILJET_SECRET_KEY,
  smtp_admin_email: sender, smtp_sender_name: "Viikkonro",
};
const templates = {
  mailer_subjects_recovery: "Viikkonro: salasanan palautuskoodi",
  mailer_templates_recovery_content: "<h2>Salasanan palautus</h2><p>Palautuskoodisi on <strong>{{ .Token }}</strong>.</p><p>Syötä koodi Viikkonron tiimin lomasuunnittelijassa. Jos et pyytänyt palautusta, voit ohittaa viestin.</p>",
};
const updated = await fetch(endpoint, { method: "PATCH", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
assert.equal(updated.status, 200, "Supabase SMTP update must succeed");
// Free projects permit custom templates only after custom SMTP is enabled.
const templateUpdate = await fetch(endpoint, { method: "PATCH", headers, body: JSON.stringify(templates), signal: AbortSignal.timeout(30000) });
assert.equal(templateUpdate.status, 200, "Supabase recovery template update must succeed");
const verified = await fetch(endpoint, { headers, signal: AbortSignal.timeout(30000) });
assert.equal(verified.status, 200, "Read back applied Auth settings");
const configuration = await verified.json();
assert.equal(configuration.smtp_host, payload.smtp_host);
assert.equal(configuration.smtp_admin_email, sender);
assert.equal(configuration.mailer_templates_recovery_content, templates.mailer_templates_recovery_content);
assert.equal(configuration.mailer_autoconfirm, false, "Email confirmation must remain required");
assert.equal(configuration.mailer_otp_length, 8, "Preserve eight-digit recovery codes");
console.log(JSON.stringify({ smtpConfigured: true, sender, recoveryTemplateVerified: true, emailsSent: 0 }));
