import { companyCalendarModel } from "./model.js";
import { calendarToCsv, calendarToXlsx, calendarToIcs } from "../export/calendar.js";
export async function exportCompanyCalendar(snapshot, format) {
  const model = companyCalendarModel(snapshot);
  if (format === "csv") return calendarToCsv(model);
  if (format === "xlsx") return calendarToXlsx(model);
  if (format === "ics") return calendarToIcs(model, { domain: `${snapshot.client.id}.${snapshot.calendar.id}.business.viikkonro.fi` });
  if (format === "pdf") {
    const { exportCalendarPdf } = await import("../render/browserPdf.js");
    return (await exportCalendarPdf(model, { logo: model.config.branding.logo })).bytes;
  }
  throw new Error("Unknown export");
}
export async function artifactHash(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2,"0")).join("");
}
