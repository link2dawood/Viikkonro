#!/usr/bin/env node
// Diagnoses the report-email SMTP secrets without revealing them: prints only
// the shape of each value (length, character classes, stray whitespace) and
// then tests the login with an SMTP AUTH handshake (no email is sent).
// Mailjet: SMTP_USER is the API key and SMTP_PASSWORD the secret key, both
// 32 hexadecimal characters.

import nodemailer from "nodemailer";

function shape(name) {
  const v = process.env[name];
  if (v === undefined || v === "") return `${name}: NOT SET`;
  const notes = [];
  if (v !== v.trim()) notes.push("has leading/trailing whitespace or a line break");
  if (/\s/.test(v.trim())) notes.push("contains whitespace inside");
  if (v.includes("@")) notes.push("contains @ (looks like an email address, not an API key)");
  const t = v.trim();
  if (/^[0-9a-f]{32}$/i.test(t)) notes.push("looks like a 32-character Mailjet key");
  return `${name}: length ${v.length}${notes.length ? `, ${notes.join(", ")}` : ""}`;
}

for (const name of ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "REPORT_EMAIL_TO"]) {
  const v = process.env[name];
  // These are not secret credentials; showing them helps spot typos.
  console.log(`${name}: ${v ? JSON.stringify(v) : "NOT SET"}`);
}
console.log(shape("SMTP_USER"));
console.log(shape("SMTP_PASSWORD"));
if (process.env.SMTP_USER && process.env.SMTP_USER.trim() === (process.env.SMTP_PASSWORD || "").trim()) {
  console.log("SMTP_USER and SMTP_PASSWORD are identical: the secret key was probably pasted into both.");
}

const port = Number(process.env.SMTP_PORT || 587);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});
try {
  await transport.verify();
  console.log("\nSMTP login OK.");
} catch (err) {
  console.log(`\nSMTP login FAILED: ${err.message}`);
  process.exitCode = 1;
}
