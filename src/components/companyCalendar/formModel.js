// The company calendar form as plain data: its starting state, how it becomes a
// platform calendar configuration, what the free preview is allowed to show,
// and how a draft is saved in the browser. No React in here, so it is tested
// directly.
import { DEFAULT_BRAND_COLOR, defaultCompanyCalendarInput } from "../../data/companyCalendar.js";
import { dayKey, toDate } from "../../platform/calendar/events.js";
import { MAX_COMPANY_EVENTS, MAX_PAYDAY_DATES } from "../../platform/calendar/config.js";
import { LAYOUTS, PAPER } from "../../platform/design/layouts.js";

export const MAX_CLOSURES = 60;
export const DRAFT_KEY = "viikkonro:company-calendar:draft:v1";
export const DRAFT_MAX_CHARS = 1_200_000; // the logo (up to 512 KB) is stored as base64 text

let rowCounter = 0;
export const newRowId = () => `r${(rowCounter += 1)}`;

export function createForm(year) {
  return {
    year,
    companyName: "",
    logo: null, // { mime, dataUri }, validated before it gets here
    color: DEFAULT_BRAND_COLOR,
    layout: "year-glance",
    paper: "A4",
    holidays: true,
    flagDays: false,
    schoolOn: false,
    schoolCity: "",
    paydayRule: "none", // none | day | last
    paydayDay: 15,
    paydayDates: [], // { id, date }
    closures: [], // { id, label, start, end }
    events: [], // { id, date, title }
    seasonOn: false,
    season: { label: "Lomakausi", start: "", end: "" },
  };
}

const inYear = (value, year) => {
  const d = toDate(value);
  return d !== null && d.getFullYear() === year;
};

/**
 * The form as a platform configuration input. Rows that are not finished, or
 * whose date falls outside the chosen year, are left out and counted in
 * `skipped`, so a half-typed row never blocks the preview.
 */
export function formToConfigInput(form) {
  let skipped = 0;
  const base = defaultCompanyCalendarInput(form.year);

  const periods = [];
  for (const row of form.closures.slice(0, MAX_CLOSURES)) {
    if (!row.start && !row.end && !row.label) continue; // an empty row is not a mistake
    const start = toDate(row.start);
    const end = toDate(row.end || row.start);
    const overlapsYear = start && end && start <= new Date(form.year, 11, 31) && end >= new Date(form.year, 0, 1);
    if (!start || !end || end < start || !overlapsYear) {
      skipped += 1;
      continue;
    }
    periods.push({ id: `closure-${row.id}`, label: row.label.trim() || "Sulkupäivä", start: dayKey(start), end: dayKey(end), kind: "closure" });
  }
  if (form.seasonOn && form.season.start) {
    const start = toDate(form.season.start);
    const end = toDate(form.season.end || form.season.start);
    if (start && end && end >= start && start <= new Date(form.year, 11, 31) && end >= new Date(form.year, 0, 1)) {
      periods.push({ id: "season", label: form.season.label.trim() || "Lomakausi", start: dayKey(start), end: dayKey(end), kind: "season" });
    } else skipped += 1;
  }

  const events = [];
  for (const row of form.events.slice(0, MAX_COMPANY_EVENTS)) {
    if (!row.date && !row.title.trim()) continue;
    if (!row.title.trim() || !inYear(row.date, form.year)) {
      skipped += 1;
      continue;
    }
    events.push({ id: `event-${row.id}`, date: row.date, title: row.title.trim() });
  }

  const paydayDates = [];
  for (const row of form.paydayDates.slice(0, MAX_PAYDAY_DATES)) {
    if (!row.date) continue;
    if (!inYear(row.date, form.year)) skipped += 1;
    else paydayDates.push(row.date);
  }

  const day = Math.min(31, Math.max(1, Math.trunc(Number(form.paydayDay)) || 15));
  return {
    skipped,
    input: {
      ...base,
      layout: { id: form.layout, paper: form.paper },
      branding: { companyName: form.companyName, logo: form.logo, primaryColor: form.color, accentColor: null },
      include: {
        weekNumbers: true,
        holidays: form.holidays,
        flagDays: form.flagDays,
        paydays: form.paydayRule === "day" ? { day } : form.paydayRule === "last" ? { day: "last" } : null,
        schoolHolidays: form.schoolOn && form.schoolCity ? { city: form.schoolCity } : null,
      },
      paydayDates,
      periods,
      events,
    },
  };
}

/**
 * The free preview: the company name and the visitor's own days are shown, but
 * with the default theme colours and no logo. Colours and logo come with the
 * paid export, and the preview is watermarked by the page.
 */
export function limitedPreviewInput(input) {
  return {
    ...input,
    theme: "classic",
    branding: { companyName: input.branding.companyName, logo: null, primaryColor: null, accentColor: null },
  };
}

// ── Draft in the browser (never sent anywhere) ─────────────────────────────

export const serializeDraft = (form) => JSON.stringify({ v: 1, form });

const str = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const rows = (list, max, pick) =>
  (Array.isArray(list) ? list.slice(0, max) : []).filter((r) => r && typeof r === "object").map((r) => ({ id: newRowId(), ...pick(r) }));

/** A saved draft back into a safe form, or null. Unknown or malformed parts are ignored, never trusted. */
export function parseDraft(text, { years, fallbackYear }) {
  if (typeof text !== "string" || text.length > DRAFT_MAX_CHARS) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const f = data?.form;
  if (data?.v !== 1 || !f || typeof f !== "object") return null;
  const form = createForm(years.includes(f.year) ? f.year : fallbackYear);
  form.companyName = str(f.companyName, 80);
  form.color = /^#[0-9a-f]{6}$/i.test(f.color) ? f.color : DEFAULT_BRAND_COLOR;
  form.layout = LAYOUTS[f.layout] ? f.layout : "year-glance";
  form.paper = PAPER[f.paper] ? f.paper : "A4";
  form.holidays = f.holidays !== false;
  form.flagDays = f.flagDays === true;
  form.schoolOn = f.schoolOn === true;
  form.schoolCity = str(f.schoolCity, 60);
  form.paydayRule = ["none", "day", "last"].includes(f.paydayRule) ? f.paydayRule : "none";
  form.paydayDay = Math.min(31, Math.max(1, Math.trunc(Number(f.paydayDay)) || 15));
  form.paydayDates = rows(f.paydayDates, MAX_PAYDAY_DATES, (r) => ({ date: str(r.date, 10) }));
  form.closures = rows(f.closures, MAX_CLOSURES, (r) => ({ label: str(r.label, 120), start: str(r.start, 10), end: str(r.end, 10) }));
  form.events = rows(f.events, MAX_COMPANY_EVENTS, (r) => ({ date: str(r.date, 10), title: str(r.title, 120) }));
  form.seasonOn = f.seasonOn === true;
  form.season = { label: str(f.season?.label, 120) || "Lomakausi", start: str(f.season?.start, 10), end: str(f.season?.end, 10) };
  // The logo is kept only if it is a data URI of a type the builder accepts.
  const uri = f.logo?.dataUri;
  if (typeof uri === "string" && /^data:image\/(png|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(uri)) {
    form.logo = { mime: uri.startsWith("data:image/png") ? "image/png" : "image/svg+xml", dataUri: uri };
  }
  return form;
}
