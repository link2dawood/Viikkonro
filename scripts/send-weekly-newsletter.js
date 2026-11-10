#!/usr/bin/env node
/**
 * scripts/send-weekly-newsletter.js
 *
 * Sends a weekly email reminder when the ISO week number changes (every Monday).
 * Reads subscribers from Mailjet contact list 10712227 (Viikkonro Viikkokirje).
 *
 * Usage:
 *   node scripts/send-weekly-newsletter.js [--dry-run]
 */

import { isoWeek, isoYear, mondayOf, fmtDayWithWeekdayFi } from "../src/components/dateUtils.js";
import { holidaysInYear } from "../src/data/holidays.js";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const listId = Number(process.env.MAILJET_NEWSLETTER_LIST_ID) || 10712227;
  const fromEmail = process.env.MAILJET_FROM_EMAIL || "hi@viikkonro.fi";

  const now = new Date();
  const week = isoWeek(now);
  const year = isoYear(now);
  const monday = mondayOf(week, year);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Find holidays falling in this week
  const allYearHolidays = holidaysInYear(year);
  const weekHolidays = allYearHolidays.filter(h => {
    const d = new Date(h.date);
    return d >= monday && d <= sunday;
  });

  const rangeStr = `${monday.getDate()}.${monday.getMonth() + 1}. – ${sunday.getDate()}.${sunday.getMonth() + 1}.${year}`;
  const subject = `Viikko ${week} alkaa (${rangeStr}) – Viikkonro`;

  let holidayText = "Ei virallisia arkipyhiä tällä viikolla.";
  if (weekHolidays.length > 0) {
    holidayText = weekHolidays.map(h => `• ${h.nameFi} (${fmtDayWithWeekdayFi(new Date(h.date))})`).join("\n");
  }

  const textBody = `Hei!

Tänään alkaa uusi kalenteriviikko:
Viikko ${week} / ${year} (${rangeStr})

Viikon pyhäpäivät ja merkkipäivät:
${holidayText}

Tarkista kuluva viikko, kuukausikalenteri ja työpäivälaskuri osoitteessa:
https://viikkonro.fi/viikko-${week}-${year}

Tarvitsetko tulostettavan kalenterin tai yrityksen vuosisuunnitelman?
• Tulosta kuukausi tai viikko: https://viikkonro.fi/tulosta-${year}
• Yrityskalenteri & lomasuunnittelija: https://viikkonro.fi/yrityskalenteri

Mukavaa ja tuottavaa viikkoa!
Viikkonro.fi

---
Voit perua tilauksen vastaamalla tähän viestiin tai lähettämällä viestin osoitteeseen ${fromEmail}.`;

  console.log(`[Weekly Newsletter] Preparing week ${week}/${year}`);
  console.log(`Subject: ${subject}`);
  console.log(`\nEmail preview:\n---\n${textBody}\n---\n`);

  if (isDryRun) {
    console.log("[DRY RUN] Finished without sending.");
    return;
  }

  if (!apiKey || !secretKey) {
    console.warn("[Weekly Newsletter] MAILJET_API_KEY or MAILJET_SECRET_KEY not set. Skipping send.");
    return;
  }

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  // Fetch recipients from Mailjet contact list
  console.log(`Fetching contacts for list ${listId}...`);
  const listRes = await fetch(`https://api.mailjet.com/v3/REST/listrecipient?ContactsList=${listId}&IsUnsub=false&Limit=1000`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!listRes.ok) {
    throw new Error(`Failed to fetch contact list recipients: ${listRes.status} ${await listRes.text()}`);
  }

  const listData = await listRes.json();
  const recipientIds = (listData.Data || []).map(r => r.ContactID);
  console.log(`Found ${recipientIds.length} active recipient(s) in list ${listId}.`);

  if (recipientIds.length === 0) {
    console.log("No recipients in list. Done.");
    return;
  }

  // Fetch contact email for each contact ID
  const emails = [];
  for (const cid of recipientIds) {
    try {
      const cRes = await fetch(`https://api.mailjet.com/v3/REST/contact/${cid}`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.Data?.[0]?.Email) emails.push(cData.Data[0].Email);
      }
    } catch (err) {
      console.warn(`Could not fetch email for contact ${cid}:`, err.message);
    }
  }

  console.log(`Sending weekly reminder to ${emails.length} subscriber(s)...`);

  const messages = emails.map(email => ({
    From: { Email: fromEmail, Name: "Viikkonro" },
    To: [{ Email: email }],
    Subject: subject,
    TextPart: textBody,
    CustomCampaign: `weekly-newsletter-${year}-w${week}`,
  }));

  // Batch send in chunks of 50
  for (let i = 0; i < messages.length; i += 50) {
    const chunk = messages.slice(i, i + 50);
    const sendRes = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ Messages: chunk }),
    });

    if (!sendRes.ok) {
      console.error(`Batch send failed: ${sendRes.status}`, await sendRes.text());
    } else {
      console.log(`Batch ${Math.floor(i / 50) + 1} sent successfully.`);
    }
  }

  console.log("[Weekly Newsletter] Completed.");
}

main().catch(err => {
  console.error("[Weekly Newsletter Error]:", err);
  process.exit(1);
});
