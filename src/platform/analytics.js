// Analytics events for platform products. Pure builders that return the
// Clarity commands to send ([["set", key, value], ["event", name]]); the
// browser call lives in src/analytics.js (trackPlatformEvent). Only a fixed
// list of coarse tags is ever sent: never a company name, a free-text field or
// a full date, so nothing personal reaches analytics.

export const PLATFORM_EVENTS = Object.freeze([
  "cta_click", // a call to action for a platform product was clicked
  "builder_start", // the visitor changed a builder input for the first time
  "preview_ready", // a valid preview was shown
  "export_download", // a file export was downloaded
  "checkout_start",
  "purchase",
  // Company calendar builder (/yrityskalenteri)
  "company_calendar_view",
  "company_calendar_started",
  "company_calendar_preview",
  "company_calendar_export_attempt",
  "company_calendar_pdf_export",
  "company_calendar_xlsx_export",
  "company_calendar_csv_export",
  "company_calendar_ics_export",
  "company_calendar_cta_click",
]);

export const PLATFORM_TAG_KEYS = Object.freeze(["product", "source", "export_type", "tier", "year", "size", "layout"]);

const FULL_DATE = /\d{4}-\d{2}-\d{2}/;

/** @returns {Array<["set", string, string] | ["event", string]>} */
export function platformEventCommands(name, props = {}) {
  if (!PLATFORM_EVENTS.includes(name)) throw new Error(`Unknown platform event "${name}".`);
  const tags = PLATFORM_TAG_KEYS.filter((key) => props[key] !== undefined && props[key] !== null)
    .map((key) => [key, String(props[key])])
    .filter(([, value]) => !FULL_DATE.test(value))
    .map(([key, value]) => ["set", `pf_${key}`, value]);
  return [...tags, ["event", name], ...(props.product ? [["event", `${name}_${props.product}`]] : [])];
}
