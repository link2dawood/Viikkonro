import { validEmail } from "./purchaseRecord.js";
import { Buffer } from "node:buffer";

export function createInvoiceMailer(env, { fetchImpl = fetch } = {}) {
  return { async sendInvoice(record, pdf) {
    const sender = env.MAILJET_FROM_EMAIL, owner = env.BILLING_OWNER_EMAIL;
    if (!env.MAILJET_API_KEY || !env.MAILJET_SECRET_KEY || !validEmail(sender) || !validEmail(owner) || !validEmail(record.email)) throw new Error("invoice_email_unavailable");
    const amount = new Intl.NumberFormat("fi-FI", { style: "currency", currency: record.currency }).format(record.total_cents / 100);
    const response = await fetchImpl("https://api.mailjet.com/v3.1/send", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Basic ${Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ Messages: [{
        From: { Email: sender, Name: "Viikkonro" }, To: [{ Email: record.email }],
        ...(owner.toLowerCase() !== record.email.toLowerCase() ? { Bcc: [{ Email: owner }] } : {}),
        ReplyTo: { Email: owner },
        Subject: `Viikkonro Yrityskalenteri ${record.calendar_year} – lasku`,
        TextPart: `Kiitos ostoksestasi!\n\nViikkonro Yrityskalenteri ${record.calendar_year}\nMaksettu yhteensä: ${amount}\n\nPolarin virallinen lasku on tämän viestin liitteenä. Polar toimii maksun myyjänä (Merchant of Record).\nKalenterin lataukset: https://viikkonro.fi/yrityskalenteri\n\nTarvitsetko apua? Vastaa tähän viestiin.\nViikkonro`,
        Attachments: [{ ContentType: "application/pdf", Filename: `viikkonro-lasku-${record.order_id}.pdf`, Base64Content: Buffer.from(pdf).toString("base64") }],
        CustomID: `invoice-${record.order_id}`,
        CustomCampaign: `viikkonro-invoice-${record.environment}-${record.order_id}`,
        DeduplicateCampaign: true, TrackOpens: "disabled", TrackClicks: "disabled",
      }] }),
    });
    if (!response.ok) throw new Error("invoice_email_unavailable");
    const result = await response.json();
    if (result.Messages?.length !== 1 || result.Messages[0].Status !== "success" || !result.Messages[0].To?.[0]?.MessageUUID) throw new Error("invoice_email_unavailable");
    return { id: result.Messages[0].To[0].MessageUUID };
  } };
}
