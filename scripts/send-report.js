#!/usr/bin/env node
// Emails seo-report.html (written by scripts/seo-report.js) over SMTP.
// Env: SMTP_HOST, SMTP_PORT (465 = implicit TLS, otherwise STARTTLS),
// SMTP_USER, SMTP_PASSWORD, REPORT_EMAIL_TO (comma-separated), optional
// SMTP_FROM (defaults to SMTP_USER). nodemailer is installed by the workflow
// with --no-save, so it is not a project dependency.

import fs from "node:fs";
import nodemailer from "nodemailer";

const need = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "REPORT_EMAIL_TO"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing secrets: ${missing.join(", ")}. The report is still in the workflow run summary.`);
  process.exit(1);
}

const port = Number(process.env.SMTP_PORT || 587);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

const info = await transport.sendMail({
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
  to: process.env.REPORT_EMAIL_TO,
  subject: fs.readFileSync("seo-report-subject.txt", "utf8").trim(),
  html: fs.readFileSync("seo-report.html", "utf8"),
  text: fs.readFileSync("seo-report.md", "utf8"),
});
console.log(`Sent: ${info.messageId}`);
