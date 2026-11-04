import { validEmail } from "./purchaseRecord.js";
import { Buffer } from "node:buffer";

export function createInvoiceMailer(env, { fetchImpl = fetch } = {}) {
  const sender = env.MAILJET_FROM_EMAIL, owner = env.BILLING_OWNER_EMAIL;
  return {
    async sendInvoice(record, pdf, { icsContent } = {}) {
      if (!env.MAILJET_API_KEY || !env.MAILJET_SECRET_KEY || !validEmail(sender) || !validEmail(owner) || !validEmail(record.email)) throw new Error("invoice_email_unavailable");
      const amount = new Intl.NumberFormat("fi-FI", { style: "currency", currency: record.currency }).format(record.total_cents / 100);
      const attachments = [
        { ContentType: "application/pdf", Filename: `viikkonro-lasku-${record.order_id}.pdf`, Base64Content: Buffer.from(pdf).toString("base64") },
      ];
      if (icsContent) {
        attachments.push({
          ContentType: "text/calendar; charset=utf-8",
          Filename: `viikkonro-yrityskalenteri-${record.calendar_year}.ics`,
          Base64Content: Buffer.from(icsContent, "utf-8").toString("base64"),
        });
      }
      const response = await fetchImpl("https://api.mailjet.com/v3.1/send", {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Basic ${Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`).toString("base64")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ Messages: [{
          From: { Email: sender, Name: "Viikkonro" }, To: [{ Email: record.email }],
          ...(owner.toLowerCase() !== record.email.toLowerCase() ? { Bcc: [{ Email: owner }] } : {}),
          ReplyTo: { Email: owner },
          Subject: icsContent ? `Viikkonro Yrityskalenteri ${record.calendar_year} – lasku ja kalenteritiedosto` : `Viikkonro Yrityskalenteri ${record.calendar_year} – lasku`,
          TextPart: `Kiitos ostoksestasi!\n\nViikkonro Yrityskalenteri ${record.calendar_year}\nMaksettu yhteensä: ${amount}\n\nViestin liitteenä:\n1. Polarin virallinen lasku (PDF)\n${icsContent ? `2. Yrityskalenteri ${record.calendar_year} (ICS-tiedosto Google Kalenteriin, Outlookiin tai Apple Kalenteriin)\n` : ""}\nVoit muokata ja ladata kalenterin (PDF, XLSX, CSV, ICS) suoraan osoitteessa:\nhttps://viikkonro.fi/yrityskalenteri\n\nTarvitsetko apua? Vastaa tähän viestiin.\nViikkonro`,
          Attachments: attachments,
          CustomID: `invoice-${record.order_id}`,
          CustomCampaign: `viikkonro-invoice-${record.environment}-${record.order_id}`,
          DeduplicateCampaign: true, TrackOpens: "disabled", TrackClicks: "disabled",
        }] }),
      });
      if (!response.ok) throw new Error("invoice_email_unavailable");
      const result = await response.json();
      if (result.Messages?.length !== 1 || result.Messages[0].Status !== "success" || !result.Messages[0].To?.[0]?.MessageUUID) throw new Error("invoice_email_unavailable");
      return { id: result.Messages[0].To[0].MessageUUID };
    },

    async sendCalendarEmail({ email, year, icsContent, pdfBytes, companyName }) {
      if (!env.MAILJET_API_KEY || !env.MAILJET_SECRET_KEY || !validEmail(sender) || !validEmail(owner) || !validEmail(email)) throw new Error("email_unavailable");
      const attachments = [];
      if (icsContent) {
        attachments.push({
          ContentType: "text/calendar; charset=utf-8",
          Filename: `yrityskalenteri-${year}.ics`,
          Base64Content: Buffer.from(icsContent, "utf-8").toString("base64"),
        });
      }
      if (pdfBytes) {
        attachments.push({
          ContentType: "application/pdf",
          Filename: `yrityskalenteri-${year}.pdf`,
          Base64Content: Buffer.from(pdfBytes).toString("base64"),
        });
      }
      const orgPrefix = companyName ? `${companyName} – ` : "";
      const response = await fetchImpl("https://api.mailjet.com/v3.1/send", {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Basic ${Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`).toString("base64")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ Messages: [{
          From: { Email: sender, Name: "Viikkonro" }, To: [{ Email: email }],
          ReplyTo: { Email: owner },
          Subject: `Viikkonro ${orgPrefix}Yrityskalenteri ${year} – kalenteritiedostot`,
          TextPart: `Hei!\n\nTässä ovat valitsemasi yrityskalenterin ${year} tiedostot.\nLiitteenä löydät kalenteritiedostot, jotka voit tuoda suoraan kalenterisovellukseesi (Google Kalenteri, Outlook, Apple Kalenteri) tai tulostaa ja jakaa.\n\nVoit jatkaa kalenterin muokkaamista ja uusien tiedostojen lataamista milloin tahansa osoitteessa:\nhttps://viikkonro.fi/yrityskalenteri\n\nTarvitsetko apua? Vastaa tähän viestiin.\nViikkonro`,
          Attachments: attachments,
          TrackOpens: "disabled", TrackClicks: "disabled",
        }] }),
      });
      if (!response.ok) throw new Error("email_unavailable");
      const result = await response.json();
      if (result.Messages?.length !== 1 || result.Messages[0].Status !== "success") throw new Error("email_unavailable");
      return { id: result.Messages[0].To?.[0]?.MessageUUID ?? "sent" };
    },
  };
}
