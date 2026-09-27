export function clampYear(y, min = 2000, max = 2100) {
  return Math.min(max, Math.max(min, y));
}

// ─── "Today" in Finland ─────────────────────────────────────────────────────
// The site's notion of today is the calendar day in Europe/Helsinki, never the
// machine's local zone (Vercel builds run in UTC, visitors can be anywhere).
// "YYYY-MM-DD" of `instant`'s day in Helsinki.
export function helsinkiDayKey(instant = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

// A Date for a Helsinki calendar day, pinned to 10:00 UTC (12:00/13:00 in
// Helsinki). At that instant the local Y/M/D getters return the same day in
// every zone from UTC−10 to UTC+13, and Intl conversions to Helsinki agree —
// so isoWeek()/mondayOf()/formatters and Helsinki-aware helpers all see the
// same day, wherever this runs.
export function dateFromDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 10));
}
export function isoYear(date) {
  var t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var day = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - day + 3); // Thursday decides the year
  return t.getFullYear();
}

export function isoWeek(d) {
  var t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var day = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - day + 3);
  var firstThu = t.valueOf();
  t.setMonth(0, 1);
  if (t.getDay() !== 4) {
    t.setMonth(0, 1 + ((4 - t.getDay() + 7) % 7));
  }
  return 1 + Math.round((firstThu - t.valueOf()) / 604800000);
}

export function weeksInIsoYear(y) {
  return isoWeek(new Date(y, 11, 28));
}

// ISO 8601 week-date notation ("2026-W32") — the standard's own compact
// representation of a given week, distinct from (and never previously
// stated alongside) the "viikko 32/2026" phrasing used everywhere else on
// the site. week is zero-padded to 2 digits per the standard.
export function isoWeekDateLabel(week, year) {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Shared by every page that needs "how many days does this month have" —
// previously computed inline with `new Date(y, m, 0).getDate()` in four
// separate files (WeeksInEachMonth.jsx, CalendarYear.jsx, seo.js x2), so a
// bug fixed in one copy could stay wrong in the others. `month` is 1-indexed
// (1 = January), matching every other month-accepting function here.
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
export function daysInYear(y) {
  return isLeapYear(y) ? 366 : 365;
}
export function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.round((date - start) / 86400000) + 1;
}
export function daysRemainingInYear(date) {
  return daysInYear(date.getFullYear()) - dayOfYear(date);
}
export function quarterOf(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

// Meteorological season (not astronomical) by month index, keyed off the same
// Dec/Jan–Feb, Mar–May, Jun–Aug, Sep–Nov boundaries WeekDays.jsx has always
// used for its "viikko ajoittuu ___" sentence. Centralized here (rather than
// duplicated per case-form) so the Finnish prose forms and the public JSON
// feeds' English "season" field can never disagree on where a month falls.
export function seasonIndexOf(monthIndex) {
  if (monthIndex === 11 || monthIndex <= 1) return 0;
  if (monthIndex <= 4) return 1;
  if (monthIndex <= 7) return 2;
  return 3;
}
export var SEASON_KEYS_EN = ["winter", "spring", "summer", "autumn"];
// Nominative Finnish form, same 4 values WeekDays.jsx's own local
// SEASON_NOMINATIVE array already renders in its Quick Facts panel —
// centralized here so a new caller (the week PDF) doesn't hand-write a
// third copy alongside WeekDays.jsx's two case-form arrays.
export var SEASON_NOMINATIVE_FI = ["Talvi", "Kevät", "Kesä", "Syksy"];

export function mondayOf(week, year) {
  var jan4 = new Date(year, 0, 4);
  var j = (jan4.getDay() + 6) % 7;
  var firstMon = new Date(year, 0, 4 - j);
  var m = new Date(firstMon);
  m.setDate(firstMon.getDate() + (week - 1) * 7);
  return m;
}

// Simple short date formatter helper
export function dShort(d) {
  const months = [
    "tammi",
    "helmi",
    "maalis",
    "huhti",
    "touko",
    "kesä",
    "heinä",
    "elo",
    "syys",
    "loka",
    "marras",
    "joulu",
  ];
  return d.getDate() + " " + months[d.getMonth()];
}
export var WD = [
  "Sunnuntai",
  "Maanantai",
  "Tiistai",
  "Keskiviikko",
  "Torstai",
  "Perjantai",
  "Lauantai",
];
export var M_FULL = [
  "Tammikuu",
  "Helmikuu",
  "Maaliskuu",
  "Huhtikuu",
  "Toukokuu",
  "Kesäkuu",
  "Heinäkuu",
  "Elokuu",
  "Syyskuu",
  "Lokakuu",
  "Marraskuu",
  "Joulukuu",
];
export var M_SHORT = [
  "tammi",
  "helmi",
  "maalis",
  "huhti",
  "touko",
  "kesä",
  "heinä",
  "elo",
  "syys",
  "loka",
  "marras",
  "joulu",
];
// ASCII (diacritic-free) URL slugs for M_FULL, e.g. "/tyopaivat-kesakuu-2026".
// A separate array rather than stripping M_FULL/M_SHORT at call sites, so
// every route that needs a month-name slug (routing, sitemap, metadata)
// resolves the exact same 12 strings.
export var M_SLUG = [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesakuu",
  "heinakuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu",
];

// Prerendered year horizon, shared by every year-series page and its prev/next
// navigation. Mirrors prerender.js exactly: floor 2020, rolling ceiling =
// build year + 9 (seo.js sitemapEntries uses `year + FUTURE_HORIZON` and
// prerender passes new Date().getFullYear()). Guarding nav to this range keeps
// links off pages that were never prerendered — they'd 404 under the SPA
// fallback. Evaluated once at module load; the daily rebuild keeps it current.
export const PRERENDER_MIN_YEAR = 2020;
export const PRERENDER_MAX_YEAR = new Date().getFullYear() + 9;

// Sitewide seasonal navigation policy. Calendar demand for the following year
// starts before New Year, so from 1 October onward the high-intent calendar and
// printable-list links promote the upcoming calendar year while the current
// year's week hub remains present beside them. Europe/Helsinki parts keep SSR,
// nightly builds, and clients in other time zones on the same rollover date.
export const NAVIGATION_PROMOTION_MONTH = 10;
export function navigationYearTargets(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Helsinki",
      year: "numeric",
      month: "numeric",
    })
      .formatToParts(date)
      .filter((part) => part.type === "year" || part.type === "month")
      .map((part) => [part.type, Number(part.value)]),
  );
  const currentYear = parts.year;
  const promotesUpcomingYear = parts.month >= NAVIGATION_PROMOTION_MONTH;
  return {
    currentYear,
    promotedYear: promotesUpcomingYear ? currentYear + 1 : currentYear,
    promotesUpcomingYear,
  };
}

// The year the homepage features in its season block (SeasonYear.jsx).
// Next-year calendar searches start climbing in September and peak Nov–Jan,
// so the homepage switches a month before the site-wide navigation
// (NAVIGATION_PROMOTION_MONTH): Sep–Dec -> next year, Jan–Aug -> this year.
export const HOMEPAGE_SEASON_MONTH = 9;
export function homepageSeasonYear(date = new Date()) {
  const [y, m] = helsinkiDayKey(date).split("-").map(Number);
  return m >= HOMEPAGE_SEASON_MONTH ? y + 1 : y;
}

// Centralized route-parameter validation — every year/week/month/quarter
// page renders NotFound through these rather than repeating ad hoc bounds
// checks per file. Each takes the raw (string or number) route param and
// returns a boolean; none throw, so a malformed value (NaN, "", a huge
// digit string) just fails validation instead of propagating into date
// math as Invalid Date.
export function validateYear(year) {
  const y = Number(year);
  return Number.isInteger(y) && y >= PRERENDER_MIN_YEAR && y <= PRERENDER_MAX_YEAR;
}

export function validateMonth(month) {
  const m = Number(month);
  return Number.isInteger(m) && m >= 1 && m <= 12;
}

export function validateQuarter(quarter) {
  const q = Number(quarter);
  return Number.isInteger(q) && q >= 1 && q <= 4;
}

// Deliberately does NOT also validate `year` — callers that want a clamp-
// and-redirect UX for an out-of-range week (see WeekDays.jsx) need the year
// to already be known-valid before they can compute weeksInIsoYear(year) at
// all, so they call validateYear() first, separately.
export function validateWeek(week, year) {
  const w = Number(week);
  if (!Number.isInteger(w)) return false;
  return w >= 1 && w <= weeksInIsoYear(Number(year));
}
// Kept as thin aliases to the canonical Finnish formatter (fmtFullFi) so every
// existing caller renders correct Finnish ("20. heinäkuuta 2026") without each
// call site having to be found and changed.
export function dWritten(d) {
  return fmtFullFi(d);
}
export function dFull(d) {
  return fmtFullFi(d);
}

export function formatShort(date) {
  // console.log(date.getDate() + "." + (date.getMonth() + 1) + ".");
  return date.getDate() + "." + (date.getMonth() + 1) + ".";
}
export function formatLong(date) {
  return (
    date.getDate() +
    ". " +
    date.toLocaleString("fi-FI", { month: "long" }) +
    "ta " +
    date.getFullYear()
  );
}
export const WEEKDAYS = [
  "Sunnuntai",
  "Maanantai",
  "Tiistai",
  "Keskiviikko",
  "Torstai",
  "Perjantai",
  "Lauantai",
];

export function getWeekdayName(date) {
  return WEEKDAYS[date.getDay()];
}
export function getDate(date) {
  return formatLong(date);
}

// ─── Centralized Finnish date formatting (single source of truth) ──────────
// getDay() is Sunday-indexed (0 = Sunday). WD/M_FULL above are the capitalized
// nominative forms (headings/labels only); the forms below carry the cases
// Finnish prose needs.

// Weekday essive ("on maanantaina"), lowercase — for prose.
export const WD_ESSIVE = [
  "sunnuntaina",
  "maanantaina",
  "tiistaina",
  "keskiviikkona",
  "torstaina",
  "perjantaina",
  "lauantaina",
];
// Month genitive ("kesäkuun viikot"), lowercase.
export const M_GENITIVE = [
  "tammikuun",
  "helmikuun",
  "maaliskuun",
  "huhtikuun",
  "toukokuun",
  "kesäkuun",
  "heinäkuun",
  "elokuun",
  "syyskuun",
  "lokakuun",
  "marraskuun",
  "joulukuun",
];
// Month partitive ("20. heinäkuuta"), lowercase.
export const M_PARTITIVE = [
  "tammikuuta",
  "helmikuuta",
  "maaliskuuta",
  "huhtikuuta",
  "toukokuuta",
  "kesäkuuta",
  "heinäkuuta",
  "elokuuta",
  "syyskuuta",
  "lokakuuta",
  "marraskuuta",
  "joulukuuta",
];
// Month inessive ("tammikuussa" = "in January"), lowercase. Every Finnish
// month name ends in "-kuu" (back-vowel stem), so the inessive is always
// "-kuu" + "ssa" — regular, not a second independent fact to source — but
// spelled out as its own array (matching M_GENITIVE/M_PARTITIVE above)
// rather than derived by string concatenation at each call site.
export const M_INESSIVE = [
  "tammikuussa",
  "helmikuussa",
  "maaliskuussa",
  "huhtikuussa",
  "toukokuussa",
  "kesäkuussa",
  "heinäkuussa",
  "elokuussa",
  "syyskuussa",
  "lokakuussa",
  "marraskuussa",
  "joulukuussa",
];

// "20. heinäkuuta 2026"
export function fmtFullFi(date) {
  return `${date.getDate()}. ${M_PARTITIVE[date.getMonth()]} ${date.getFullYear()}`;
}
// "maanantaina 20. heinäkuuta 2026" (weekday lowercase essive)
export function fmtDayWithWeekdayFi(date) {
  return `${WD_ESSIVE[date.getDay()]} ${fmtFullFi(date)}`;
}
// "Maanantai 20. heinäkuuta 2026" (weekday capitalized nominative)
export function fmtDayHeadingFi(date) {
  return `${WD[date.getDay()]} ${fmtFullFi(date)}`;
}
// "20.7.2026"
export function fmtShortFi(date) {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}
// Compact range for metadata: "20.–26.7.2026", "29.6.–5.7.2026", or
// "29.12.2025–4.1.2026" when the range crosses a calendar-year boundary.
export function fmtRangeCompactFi(mo, su) {
  const sameYear = mo.getFullYear() === su.getFullYear();
  if (sameYear && mo.getMonth() === su.getMonth()) {
    return `${mo.getDate()}.–${su.getDate()}.${su.getMonth() + 1}.${su.getFullYear()}`;
  }
  if (sameYear) {
    return `${mo.getDate()}.${mo.getMonth() + 1}.–${su.getDate()}.${su.getMonth() + 1}.${su.getFullYear()}`;
  }
  return `${fmtShortFi(mo)}–${fmtShortFi(su)}`;
}
// Range: "20.–26. heinäkuuta 2026" (same month); "29.6.–5.7.2026" (same year,
// different months); "29.12.2026–4.1.2027" (spanning a year boundary).
export function fmtRangeFi(mo, su) {
  const sameYear = mo.getFullYear() === su.getFullYear();
  if (sameYear && mo.getMonth() === su.getMonth()) {
    return `${mo.getDate()}.–${su.getDate()}. ${M_PARTITIVE[su.getMonth()]} ${su.getFullYear()}`;
  }
  if (sameYear) {
    return `${mo.getDate()}.${mo.getMonth() + 1}.–${su.getDate()}.${su.getMonth() + 1}.${su.getFullYear()}`;
  }
  return `${fmtShortFi(mo)}–${fmtShortFi(su)}`;
}
