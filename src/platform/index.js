// Viikkonro Planning Platform: the shared foundation under every calendar and
// planning product. See docs/planning-platform.md for the architecture and the
// rules for adding a product.
//
//   data/            Finnish holiday, flag-day and payday data (existing)
//   data/dayRules.js which days count, per mode (existing, extended)
//   platform/calendar  configuration, events, periods, sources, model
//   platform/design    branding, themes, layouts
//   platform/export    ICS, CSV, XLSX, download, calendar exports
//   platform/business  product catalogue and licensing
//   platform/planners  registry of the planning tools
//   platform/analytics platform event builders
export * from "./calendar/events.js";
export * from "./calendar/periods.js";
export * from "./calendar/sources.js";
export * from "./calendar/config.js";
export * from "./calendar/model.js";
export * from "./design/branding.js";
export * from "./design/themes.js";
export * from "./design/layouts.js";
export * from "./export/ics.js";
export * from "./export/companyIcs.js";
export * from "./export/csv.js";
export * from "./export/xlsx.js";
export * from "./export/calendar.js";
export * from "./business/products.js";
export * from "./business/licensing.js";
export * from "./business/payment.js";
export * from "./planners.js";
export * from "./analytics.js";
export { DAY_RULES, dayReason, countsAsDay, summarizeDayRange } from "../data/dayRules.js";
export { renderCalendarPdf } from "./render/pdf.js";

export * from "./templates/catalog.js";
export * from "./templates/workbook.js";
export * from "./templates/access.js";
export { renderTemplatePdf } from "./templates/pdf.js";

export * from "./vacation/config.js";
export * from "./vacation/model.js";
export * from "./vacation/exports.js";
export { renderVacationPdf } from "./vacation/pdf.js";

export * from "./planning/dates.js";
export * from "./planning/model.js";
export * from "./planning/exports.js";
export * from "./construction/config.js";
export * from "./construction/model.js";
export * from "./construction/exports.js";
