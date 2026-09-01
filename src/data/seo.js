// Per-route SEO metadata — the single source of truth used by prerender.js to
// give each static page its own <title>, <meta description>, Open Graph tags
// and a SELF-referencing canonical URL. Without this, every prerendered page
// would share the homepage's title + canonical, which tells search engines the
// subpages are duplicates of the homepage and suppresses their indexing.

// SITE_ORIGIN is injected two ways so this file works whether it's loaded
// through Vite (client/SSR bundles, via the `define` in vite.config.js) or
// directly by plain Node (prerender.js, which imports this file without any
// Vite transform and so only ever sees real process.env).
export const SITE_URL = process.env.SITE_ORIGIN || "https://viikkonro.fi";

// Finnish date formatters live in one place (dateUtils.js). Imported with an
// explicit .js extension so plain-Node prerender.js can resolve it too (the
// ISO-week math below stays inline — untouched — per the no-touch rule).
import {
  M_GENITIVE,
  M_INESSIVE,
  M_SLUG,
  daysInYear,
  fmtFullFi,
  fmtRangeCompactFi,
  fmtShortFi,
  isLeapYear,
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
  WD_ESSIVE,
} from "../components/dateUtils.js";
import {
  HOLIDAY_DEFINITIONS,
  holidayPageFor,
  holidayPageMeta,
} from "./holidayPages.js";
import { holidaysInYear } from "./holidays.js";
import { flagDaysMeta } from "./flagDayPages.js";
import {
  nameDayDateKeys,
  nameDayNames,
} from "./nameDays.js";
import {
  nameDayDateMeta,
  nameDayDatePage,
  nameDayNameMeta,
  nameDayNamePage,
  todayNameDayMeta,
  todayNameDayPage,
} from "./nameDayPages.js";
import {
  CONFIDENCE,
  pageConfidenceTier,
  schoolHolidayMeta,
  schoolHolidayPage,
  schoolHolidayYears,
} from "./schoolHolidayPages.js";
import {
  currentMonthMeta,
  currentYearMeta,
  weekdayMeta,
} from "./currentDateContent.js";
import { englishMeta } from "./englishContent.js";
import { DATASET_PAGES, datasetPageMeta } from "./datasetPages.js";

// Fixed date the FAQ/explainer/calculator page COPY (not just computed data)
// was last substantively edited. Bump both by hand when that prose actually
// changes — kept fixed rather than build-time "today" so the visible
// "Päivitetty" line on each page and its dateModified in structured data
// always agree, and so a date claiming freshness doesn't roll every day just
// because the site auto-rebuilds while the words on the page haven't changed.
export const CONTENT_UPDATED = "2026-08-21";
export const CONTENT_UPDATED_FI = fmtFullFi(new Date(2026, 7, 21));

// The /data/* JSON feeds' schemaVersion field and the real schema.org
// Dataset.version property (see prerender.js's datasetSchema()) — bumped only
// on a breaking payload-shape change (a field renamed or removed; adding a
// field is not breaking). Lives here, not in prerender.js, so openDataContent.js
// (client bundle) and prerender.js (plain Node) both read the one real value
// instead of each hand-maintaining their own copy of "1.0".
export const FEED_SCHEMA_VERSION = "1.0";

// Mirrors src/components/dateUtils.jsx's isoWeek/weeksInIsoYear exactly.
// Duplicated (not imported) because prerender.js runs this file as plain
// Node ESM, which can't load a .jsx module.
function isoWeek(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - day + 3);
  const firstThu = t.valueOf();
  t.setMonth(0, 1);
  if (t.getDay() !== 4) {
    t.setMonth(0, 1 + ((4 - t.getDay() + 7) % 7));
  }
  return 1 + Math.round((firstThu - t.valueOf()) / 604800000);
}
function weeksInIsoYear(y) {
  return isoWeek(new Date(y, 11, 28));
}
function isoYear(date) {
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - day + 3);
  return t.getFullYear();
}
export function mondayOf(week, year) {
  const jan4 = new Date(year, 0, 4);
  const j = (jan4.getDay() + 6) % 7;
  const firstMon = new Date(year, 0, 4 - j);
  const m = new Date(firstMon);
  m.setDate(firstMon.getDate() + (week - 1) * 7);
  return m;
}
function formatShort(d) {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}
const M_FULL = [
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

// Per-route <title>/<description> for the DYNAMIC pages. These are the single
// source of truth used by BOTH the page components (their <SEO> tag) and
// prerender.js (the static <head> it writes), so the crawlable HTML and the
// client-hydrated title never diverge. Each output is unique per route, which
// is what turns the ~200 week/month/year URLs from homepage-duplicates into
// real, individually indexable pages.
export function weekMeta(w, y) {
  const mo = mondayOf(w, y);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);
  return {
    title: `Viikko ${w} vuonna ${y} – ${fmtRangeCompactFi(mo, su)} | Viikko Nro`,
    // Short dates (fmtFullFi ran ~190 chars → truncated in SERPs). ~148 chars
    // keeps every keyword term within Google's snippet limit.
    description: `Viikko ${w} vuonna ${y} alkaa maanantaina ${formatShort(mo)} ja päättyy sunnuntaina ${formatShort(su)}${su.getFullYear()}. Katso päivämäärät, juhlapäivät, työpäivät sekä tulostettava kalenteri.`,
  };
}
export function monthMeta(m, y) {
  // Genitive + "viikot" + year, IN THAT ORDER ("Kesäkuun viikot 2026") —
  // matches how people actually search ("kesäkuun viikot",
  // "heinäkuun viikot 2026") as a literal contiguous phrase. Year-before-viikot
  // ("Kesäkuun 2026 viikot") looks similar but doesn't match either query, since
  // "2026" then breaks up the "kesäkuun viikot" substring. The old nominative
  // "Kesäkuu 2026 – ... kalenteri" title never contained the phrase at all.
  const genitiveCap = M_GENITIVE[m - 1].replace(/^./, (c) => c.toUpperCase());
  return {
    title: `${genitiveCap} viikot ${y} – viikkonumerot | Viikko Nro`,
    description: `${genitiveCap} ${y} viikkonumerot, päivämäärät, työpäivät ja arkipyhät. Lataa tulostettava kuukausikalenteri ISO 8601 -viikkonumeroilla PDF-muodossa.`,
  };
}

// ISO weeks touching a given calendar month, deduped by (isoYear, isoWeek)
// and bounds-checked against the prerendered horizon — the exact same
// dedup/bounds logic WeeksInEachMonth.jsx's getMonthWeeks() and prerender.js's
// weekCollectionNodes() already use to build this page's own week-card grid
// and CollectionPage ItemList. Reimplemented here (not imported from either)
// because one lives in a Vite-only JSX component and the other is private to
// prerender.js — but verified to produce identical output, so the FAQ answers
// built from it can never disagree with what the page actually shows.
function monthWeekList(year, month) {
  const mi = month - 1;
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const seen = new Set();
  const weeks = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, mi, day);
    const wy = isoYear(date);
    const w = isoWeek(date);
    const key = `${wy}-${w}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (wy < PRERENDER_MIN_YEAR || wy > PRERENDER_MAX_YEAR) continue;
    weeks.push({ week: w, year: wy });
  }
  return weeks;
}

// Working/weekend/holiday split for one calendar month (see workingDaySplit()
// below for the whole-year version workingDaysFaqs() uses) — shared by
// monthFaqs() and WeeksInEachMonth.jsx's visible quick-facts block, so both
// read from the same real computation instead of two hand-rolled counts.
export function monthStats(year, month) {
  const mi = month - 1;
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const holidaysThisMonth = holidaysInYear(year).filter(
    (h) => h.date.getMonth() === mi,
  );
  const officialDateSet = new Set(
    holidaysThisMonth.filter((h) => h.official).map((h) => h.date.toDateString()),
  );

  let working = 0;
  let weekend = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, mi, day);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) weekend += 1;
    else if (!officialDateSet.has(date.toDateString())) working += 1;
  }

  const weeks = monthWeekList(year, month);
  return {
    weeks,
    weekCount: weeks.length,
    working,
    weekend,
    holidays: holidaysThisMonth,
    firstDay: new Date(year, mi, 1),
    lastDay: new Date(year, mi, daysInMonth),
  };
}

// Shared by WeeksInEachMonth.jsx and prerender.js so the visible FAQ and its
// FAQPage JSON-LD always contain exactly the same questions and answers —
// same discipline as calendarFaqs()/workingDaysFaqs(). Deliberately asks
// month-scoped questions (week count, which week numbers, whole-month holiday
// summary) that no week page asks about a single week, so these never
// duplicate week-page FAQ content. Every subject is nominative ("Kesäkuu 2026
// sisältää...") to stay grammatically safe without needing inessive/illative
// month-name forms this codebase doesn't currently export.
export function monthFaqs(month, year) {
  const monthName = M_FULL[month - 1];
  const stats = monthStats(year, month);
  const weekListText = stats.weeks.map((w) => w.week).join(", ");
  const officialHolidays = stats.holidays.filter((h) => h.official);

  return [
    {
      q: `Kuinka monta viikkoa ${monthName} ${year} sisältää?`,
      a: `${monthName} ${year} sisältää ${stats.weekCount} viikkoa.`,
    },
    {
      q: `Mitkä viikkonumerot ${monthName} ${year} sisältää?`,
      a: `${monthName} ${year} sisältää viikot ${weekListText}.`,
    },
    {
      q: `Sisältääkö ${monthName} ${year} arkipyhiä?`,
      a:
        officialHolidays.length > 0
          ? `Kyllä. ${monthName} ${year} arkipyhät ovat: ${officialHolidays.map((h) => h.name).join(", ")}.`
          : `Ei. ${monthName} ${year} ei sisällä yhtään virallista arkipyhää.`,
    },
  ];
}

// Calendar-quarter months, 1-indexed — Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep,
// Q4 Oct-Dec. Fiscal (non-calendar-aligned) quarters aren't modeled — nothing
// in the codebase's holiday/working-day data is fiscal-year aware, and STEP
// constraints for this route family explicitly rule out accounting-specific
// calculations.
const QUARTER_MONTHS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
];

// Reuses monthStats() for each of the quarter's 3 months — no new day-by-day
// loop. A week that touches two months inside the same quarter (e.g. the
// week spanning Jan/Feb) would otherwise be counted twice, so weeks are
// de-duplicated by {year,week} while preserving chronological order (the 3
// months are already walked in date order, so a first-occurrence dedupe is
// enough — no re-sort needed).
export function quarterStats(year, quarter) {
  const months = QUARTER_MONTHS[quarter - 1];
  const monthStatsList = months.map((m) => monthStats(year, m));

  const seen = new Set();
  const weeks = [];
  let working = 0;
  let weekend = 0;
  let holidays = [];
  for (const ms of monthStatsList) {
    working += ms.working;
    weekend += ms.weekend;
    holidays = holidays.concat(ms.holidays);
    for (const w of ms.weeks) {
      const key = `${w.year}-${w.week}`;
      if (seen.has(key)) continue;
      seen.add(key);
      weeks.push(w);
    }
  }

  const firstDay = monthStatsList[0].firstDay;
  const lastDay = monthStatsList[monthStatsList.length - 1].lastDay;
  const totalDays = Math.round((lastDay - firstDay) / 86400000) + 1;

  return {
    quarter,
    year,
    months,
    weeks,
    weekCount: weeks.length,
    working,
    weekend,
    holidays,
    firstDay,
    lastDay,
    totalDays,
  };
}

export function quarterMeta(quarter, year) {
  const stats = quarterStats(year, quarter);
  const monthNames = stats.months.map((m) => M_FULL[m - 1]).join(", ");
  const firstWeek = stats.weeks[0].week;
  const lastWeek = stats.weeks[stats.weeks.length - 1].week;
  return {
    title: `Q${quarter} ${year} – viikot, työpäivät ja päivämäärät | Viikko Nro`,
    description: `Q${quarter} ${year} (${monthNames}) sisältää viikot ${firstWeek}–${lastWeek} ja ${stats.working} työpäivää. Katso tarkat päivämäärät ja juhlapyhät.`,
  };
}

// Shared by QuarterPage.jsx and prerender.js's FAQPage JSON-LD — same
// visible/schema-parity discipline as monthFaqs()/workingDaysFaqs(). Exactly
// 4 questions (the 3 the brief specifies plus a holiday question mirroring
// monthFaqs()'s), all computed from quarterStats() so nothing here can drift
// from the Quick Facts block or the month/week pages the quarter aggregates.
export function quarterFaqs(quarter, year) {
  const stats = quarterStats(year, quarter);
  const firstWeek = stats.weeks[0].week;
  const lastWeek = stats.weeks[stats.weeks.length - 1].week;
  const weekRangeText =
    firstWeek === lastWeek ? `viikon ${firstWeek}` : `viikot ${firstWeek}–${lastWeek}`;
  const monthGenitives = stats.months.map((m) => M_GENITIVE[m - 1]);
  const monthListText = `${monthGenitives[0]}, ${monthGenitives[1]} ja ${monthGenitives[2]}`;
  const officialHolidays = stats.holidays.filter((h) => h.official);

  return [
    {
      q: `Mitkä viikot kuuluvat Q${quarter} ${year}?`,
      a: `Q${quarter} ${year} sisältää ${weekRangeText}.`,
    },
    {
      q: `Kuinka monta työpäivää Q${quarter} ${year} sisältää?`,
      a: `Q${quarter} ${year} sisältää ${stats.working} työpäivää.`,
    },
    {
      q: `Mitkä kuukaudet kuuluvat Q${quarter} ${year}?`,
      a: `Q${quarter} ${year} sisältää ${monthListText}.`,
    },
    {
      q: `Onko Q${quarter} ${year} arkipyhiä?`,
      a:
        officialHolidays.length > 0
          ? `Kyllä. Q${quarter} ${year} arkipyhät ovat: ${officialHolidays.map((h) => h.name).join(", ")}.`
          : `Ei. Q${quarter} ${year} ei sisällä yhtään virallista arkipyhää.`,
    },
  ];
}

export function yearMeta(y) {
  const total = weeksInIsoYear(y);
  return {
    title: `Viikkonumerot ${y} – kaikki ${total} viikkoa | Viikko Nro`,
    description: `Katso viikkonumerot ${y}: kaikki ${total} viikkoa päivämäärineen. Selaa viikkoja, työpäiviä ja arkipyhiä tai lataa tulostettava viikkokalenteri PDF-muodossa.`,
  };
}

// Shared by YearCalendar.jsx and prerender.js — same discipline as
// calendarFaqs()/monthFaqs(). "Millä viikolla vuosi Y alkaa/päättyy" is only
// a genuinely informative (non-tautological) question if it means "which ISO
// week does 1 Jan / 31 Dec fall in" rather than "what is this year's own
// first/last week number" (always 1 and weeksInIsoYear(y) by definition, true
// of every year, not worth asking). The answer is honest either way: most
// years' 1 Jan/31 Dec sit inside that same year's own week range, but roughly
// 4 years out of 5 one end spills into the adjacent calendar year's ISO
// week — exactly the boundary behaviour src/pages/WhatWeek.jsx explains, now
// surfaced per-year with the real date this year actually has.
export function yearFaqs(year) {
  const total = weeksInIsoYear(year);
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const jan1Week = isoWeek(jan1);
  const jan1IsoYear = isoYear(jan1);
  const dec31Week = isoWeek(dec31);
  const dec31IsoYear = isoYear(dec31);

  const startNote =
    jan1IsoYear !== year
      ? ` Päivä kuuluu vielä edellisen vuoden viimeiseen viikkoon, ei vuoden ${year} viikkoon 1.`
      : "";
  const endNote =
    dec31IsoYear !== year
      ? ` Päivä kuuluu jo seuraavan vuoden viikkoon 1.`
      : "";

  return [
    {
      q: `Kuinka monta viikkoa vuodessa ${year} on?`,
      a: `Vuodessa ${year} on ${total} viikkoa.`,
    },
    {
      q: `Millä viikolla vuosi ${year} alkaa?`,
      a: `Tammikuun 1. päivä ${year} kuuluu viikkoon ${jan1Week} vuonna ${jan1IsoYear}.${startNote}`,
    },
    {
      q: `Millä viikolla vuosi ${year} päättyy?`,
      a: `Joulukuun 31. päivä ${year} kuuluu viikkoon ${dec31Week} vuonna ${dec31IsoYear}.${endNote}`,
    },
    {
      q: `Onko ${year} karkausvuosi?`,
      a: isLeapYear(year)
        ? `Kyllä. Vuosi ${year} on karkausvuosi ja siinä on ${daysInYear(year)} päivää (helmikuussa 29).`
        : `Ei. Vuodessa ${year} on ${daysInYear(year)} päivää (helmikuussa 28).`,
    },
  ];
}

// Shared by YearCalendar.jsx's visible Quick Facts block — reuses
// workingDaySplit() (the same year-level working/weekend/holiday count
// workingDaysFaqs() already uses) plus the same Jan-1/Dec-31 ISO-week lookup
// as yearFaqs(), so the quick facts and the FAQ answers can never disagree.
export function yearStats(year) {
  const { working, weekend, holiday } = workingDaySplit(year);
  const officialHolidayCount = holidaysInYear(year).filter(
    (h) => h.official,
  ).length;
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  return {
    weekCount: weeksInIsoYear(year),
    working,
    weekend,
    workdayHolidays: holiday,
    officialHolidayCount,
    firstWeek: isoWeek(jan1),
    firstWeekYear: isoYear(jan1),
    lastWeek: isoWeek(dec31),
    lastWeekYear: isoYear(dec31),
  };
}

export function printMeta(y) {
  const total = weeksInIsoYear(y);
  return {
    title: `Tulostettava viikkolista ${y} – ${total} ISO-viikkoa | Viikko Nro`,
    description: `Tulosta vuoden ${y} kaikki ${total} ISO-viikkoa riveittäin alkamis- ja päättymispäivineen. Tallenna viikkolista PDF-muodossa tai lataa Excel-yhteensopiva CSV.`,
  };
}
export function holidaysMeta(y) {
  return {
    title: `Suomen pyhäpäivät ${y} – arkipyhät | Viikko Nro`,
    description: `Suomen viralliset pyhäpäivät ${y}: päivämäärät, viikonpäivät ja viikkonumerot. Uudenvuodenpäivä, pääsiäinen, vappu, juhannus, itsenäisyyspäivä ja joulu.`,
  };
}
export function workingDaysMeta(y) {
  return {
    title: `Työpäivät ${y} – montako työpäivää vuodessa | Viikko Nro`,
    description: `Montako työpäivää vuonna ${y}? Työpäivien määrä kuukausittain, viikonloput ja arkipyhät huomioiden – hyödyksi palkanlaskentaan ja työajan suunnitteluun.`,
  };
}

// Working/weekend/holiday split for a calendar year — the same three-way
// classification WorkingDays.jsx renders (Mon–Fri minus official arkipyhät).
// Pulled out as its own function (not just inlined in workingDaysFaqs) since
// it's the one part of this file that walks all ~365 days of a year; keeping
// it separate makes that cost visible and reusable rather than duplicated.
function workingDaySplit(y) {
  const officialSet = new Set(
    holidaysInYear(y)
      .filter((h) => h.official)
      .map((h) => h.date.toDateString()),
  );
  let working = 0;
  let weekend = 0;
  let holiday = 0;
  const d = new Date(y, 0, 1);
  while (d.getFullYear() === y) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekend += 1;
    else if (officialSet.has(d.toDateString())) holiday += 1;
    else working += 1;
    d.setDate(d.getDate() + 1);
  }
  return { working, weekend, holiday };
}

// Shared by WorkingDays.jsx and prerender.js so the visible FAQ and its
// FAQPage JSON-LD always contain exactly the same questions and answers —
// same discipline as calendarFaqs(). Every answer carries a real value
// computed for this exact year, not a static "yes/it varies" — including the
// holiday-impact question, whose number genuinely changes year to year
// depending on which weekday each arkipyhä lands on (e.g. an arkipyhä that
// falls on a Saturday doesn't reduce the working-day count at all, since
// that day was already a weekend).
export function workingDaysFaqs(y) {
  const { working, weekend, holiday } = workingDaySplit(y);
  return [
    {
      q: `Montako työpäivää vuonna ${y} on?`,
      a: `Vuonna ${y} on ${working} työpäivää.`,
    },
    {
      q: `Kuinka monta viikonloppupäivää vuonna ${y} on?`,
      a: `Vuonna ${y} on ${weekend} viikonloppupäivää.`,
    },
    {
      q: `Vaikuttavatko arkipyhät työpäivien määrään vuonna ${y}?`,
      a:
        holiday > 0
          ? `Kyllä. Vuonna ${y} arkipyhät vähentävät työpäivien määrää ${holiday} päivällä, koska ne osuvat maanantain ja perjantain väliin.`
          : `Ei suoraan vuonna ${y}: jokainen virallinen arkipyhä osuu tänä vuonna viikonloppuun, joten yksikään ei vähennä työpäivien määrää enää erikseen.`,
    },
  ];
}

// Per-month working-day pages (/tyopaivat-<slug>-<year>) — a distinct search
// intent ("työpäivät tammikuussa 2026") from both the year-level
// /tyopaivat-<year> hub and the week-numbering /kuukausi-<m>-<y> page, so the
// title/FAQ wording below is deliberately its own phrasing rather than
// reused copy. The underlying counts reuse monthStats() (seo.js's own
// month-level day loop, already shared by monthFaqs()/WeeksInEachMonth.jsx)
// instead of a new day-counting loop, per the "avoid duplicate logic" rule
// for this route. Uses M_INESSIVE ("tammikuussa") rather than the bare
// nominative month name — natural Finnish for "in <month>", and no longer
// needs the nominative workaround an earlier pass used before M_INESSIVE
// existed.
export function monthlyWorkingDaysMeta(month, year) {
  const monthInessive = M_INESSIVE[month - 1];
  const monthInessiveCap = monthInessive.replace(/^./, (c) => c.toUpperCase());
  const stats = monthStats(year, month);
  const officialCount = stats.holidays.filter((h) => h.official).length;
  return {
    title: `Työpäivät ${monthInessive} ${year} | Viikko Nro`,
    description: `${monthInessiveCap} ${year} on ${stats.working} työpäivää, ${stats.weekend} viikonloppupäivää ja ${officialCount} arkipyhää. Katso päivämäärät ja viikkonumerot.`,
  };
}

// Shared by MonthlyWorkingDays.jsx and prerender.js's FAQPage JSON-LD — same
// visible/schema-parity discipline as workingDaysFaqs()/monthFaqs(). Asks
// working-day-count questions (not week-numbering questions, which
// /kuukausi-<m>-<y>'s monthFaqs() already owns), so the two routes never
// duplicate FAQ content for the same month.
export function monthlyWorkingDayFaqs(month, year) {
  const monthInessive = M_INESSIVE[month - 1];
  const monthInessiveCap = monthInessive.replace(/^./, (c) => c.toUpperCase());
  const stats = monthStats(year, month);
  const officialHolidays = stats.holidays.filter((h) => h.official);
  const holidayAnswer =
    officialHolidays.length > 0
      ? `Kyllä. ${monthInessiveCap} ${year} arkipyhät ovat: ${officialHolidays.map((h) => h.name).join(", ")}.`
      : `Ei. ${monthInessiveCap} ${year} ei ole yhtään virallista arkipyhää.`;

  return [
    {
      q: `Montako työpäivää ${monthInessive} ${year} on?`,
      a: `${monthInessiveCap} ${year} on ${stats.working} työpäivää.`,
    },
    {
      q: `Kuinka monta viikonloppupäivää ${monthInessive} ${year} on?`,
      a: `${monthInessiveCap} ${year} on ${stats.weekend} viikonloppupäivää.`,
    },
    {
      q: `Onko ${monthInessive} ${year} arkipyhiä?`,
      a: holidayAnswer,
    },
  ];
}

// One downloadable PDF per year (dist/pdf/kalenteri-<year>.pdf, generated by
// prerender.js), covering the full year regardless of which /kalenteri-*
// variant links to it. Single source of truth for the path so the download
// button (CalendarYear.jsx/YearCalendar.jsx), the <link rel="alternate">, the
// associatedMedia schema, and the sitemap entry (all in prerender.js) can't
// drift apart. Singular "/pdf/", not "/pdfs/" — matches the route family's
// own naming convention exactly (kalenteri-<year>.pdf inside it), same as
// every other single-segment family this site uses (/data/, not /datas/).
export function calendarPdfPath(y) {
  return `/pdf/kalenteri-${y}.pdf`;
}

// One downloadable PDF per ISO week (dist/pdf/viikko-<week>-<year>.pdf),
// same single-source-of-truth reasoning as calendarPdfPath() above — the
// download link on WeekDays.jsx, the <link rel="alternate">, the
// associatedMedia/DownloadAction schema, and the sitemap entry (all in
// prerender.js) all read this one function.
export function weekPdfPath(week, year) {
  return `/pdf/viikko-${week}-${year}.pdf`;
}

// One downloadable PDF per calendar month (dist/pdf/kuukausi-<month>-<year>.pdf),
// same single-source-of-truth reasoning as calendarPdfPath()/weekPdfPath()
// above.
export function monthPdfPath(month, year) {
  return `/pdf/kuukausi-${month}-${year}.pdf`;
}

// Full-year calendar pages. `half` = null | 1 | 2; `print` = print-optimized.
export function calendarMeta(y, half, print) {
  if (print) {
    const total = weeksInIsoYear(y);
    return {
      title: `Tulostettava A4-kuukausikalenteri ${y} | Viikko Nro`,
      description: `Tulostettava A4-kuukausikalenteri ${y}: 12 kuukautta, ${total} ISO-viikkoa sekä Suomen juhla- ja liputuspäivät. Lataa valmis PDF tai Excel-yhteensopiva CSV.`,
      robots: "index, follow",
    };
  }
  if (half === 1) {
    return {
      title: `Kalenteri ${y}, 1. vuosipuolisko | Viikko Nro`,
      description: `Vuoden ${y} kevätpuolen kalenteri: tammikuu–kesäkuu. Viikkonumerot, juhlapäivät ja tulostettava PDF.`,
    };
  }
  if (half === 2) {
    return {
      title: `Kalenteri ${y}, 2. vuosipuolisko | Viikko Nro`,
      description: `Vuoden ${y} syyspuolen kalenteri: heinäkuu–joulukuu. Viikkonumerot, juhlapäivät ja tulostettava PDF.`,
    };
  }
  const total = weeksInIsoYear(y);
  return {
    title: `Viikkokalenteri ${y} – 12 kuukautta | Viikko Nro`,
    description: `Avaa viikkokalenteri ${y}: kaikki 12 kuukautta, ${total} ISO-viikkoa ja Suomen juhlapäivät. Selaa kuukausia ja avaa jokaisen viikon tarkat päivämäärät.`,
  };
}

// Shared by CalendarYear.jsx and prerender.js so the visible calendar FAQ and
// its FAQPage JSON-LD always contain exactly the same questions and answers.
export function calendarFaqs(y) {
  const total = weeksInIsoYear(y);
  return [
    {
      q: `Mikä on viikkokalenteri ${y} yhdellä lauseella?`,
      a: `Viikkokalenteri ${y} näyttää vuoden kaikki ${total} ISO-viikkoa, päivämäärät, viikkonumerot ja Suomen juhlapäivät yhdessä näkymässä.`,
    },
    {
      q: `Kuinka monta viikkoa vuodessa ${y} on?`,
      a: `Vuodessa ${y} on ${total} ISO-viikkoa. Viikko alkaa maanantaina ja päättyy sunnuntaina.`,
    },
    {
      q: `Miten viikkokalenteri ${y} tulostetaan tai tallennetaan PDF-muodossa?`,
      a: `Paina kalenterin Tulosta / tallenna PDF -painiketta ja valitse selaimen tulostusikkunasta tulostin tai PDF-tallennus. Kalenteri sovitetaan A4-vaakasivulle.`,
    },
    {
      q: `Mitä viikkonäkymä ${y} näyttää?`,
      a: `Viikkonäkymä näyttää jokaisen kuukauden päivät, maanantaisin alkavat viikkonumerot sekä Suomen juhla- ja liputuspäivät. Viikkonumerosta voi avata viikon oman sivun.`,
    },
    {
      q: `Voiko viikkokalenterista avata yksittäisen viikon päivämäärät?`,
      a: `Kyllä. Napsauta kalenterissa maanantain vieressä näkyvää viikkonumeroa, niin saat viikon kaikki seitsemän päivämäärää, työpäivien määrän ja päivänvalotiedot.`,
    },
  ];
}

// Home page title/description carry the actual current week and date range
// (what F-04 calls "distinguishing data"), computed the same way at build
// time (prerender.js, for crawlers) and at hydration (Home.jsx render body —
// deliberately NOT inside an effect, so it's correct during SSR too, unlike
// Weekcounter's useLayoutEffect-based state which renders as 0 server-side).
export function homeMeta(now) {
  const week = isoWeek(now);
  const year = isoYear(now);
  const mo = mondayOf(week, year);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);
  // The live week and compact start date distinguish every weekly build while
  // leaving room for both the exact head query and the full "viikkonumero"
  // keyword. Even a two-digit week/date remains below 60 characters.
  const startDate = formatShort(mo);
  // The direct-answer sentence rendered as the homepage's on-page lead
  // paragraph (Weekcounter.jsx). The meta description below targets the exact
  // head query while drawing its dates from these same computed values.
  const lead = `Juuri nyt on viikko ${week} (viikkonumero ${week}) vuonna ${year}. Viikko alkaa ${WD_ESSIVE[mo.getDay()]} ${fmtShortFi(mo)} ja päättyy ${WD_ESSIVE[su.getDay()]} ${fmtShortFi(su)}.`;
  return {
    title: `Mikä viikko nyt on? Viikkonumero ${week} (${startDate}) | Viikko Nro`,
    // Lead with the short-query term while retaining "viikko", "kuluva viikko"
    // and "viikon numero" naturally inside the 140–160-character budget.
    description: `Katso viikkonumero heti: nyt on viikko ${week} vuonna ${year}. Kuluva viikko alkaa ${WD_ESSIVE[mo.getDay()]} ${formatShort(mo)} ja päättyy ${WD_ESSIVE[su.getDay()]} ${formatShort(su)} Tarkista muun päivän viikon numero.`,
    lead,
  };
}

export const routeMeta = {
  "/": {
    // Brand-last ("| Viikko Nro"), matching every other page's convention.
    // Replaced at build time with homeMeta(); kept as a safe fallback.
    title: "Mikä viikko nyt on? Viikkonumero | Viikko Nro",
    description:
      "Katso viikkonumero heti ja selvitä mikä viikko nyt on. Viikkolaskuri näyttää kuluvan viikon sekä minkä tahansa päivämäärän viikon numeron ISO 8601:n mukaan.",
  },
  "/en": {
    ...englishMeta(),
    breadcrumb: "English",
  },
  "/mika-on-viikkonumero": {
    title: "Mikä on viikkonumero? ISO 8601 -viikkolaskenta selitettynä",
    description:
      "Viikkonumero on 1–53 välinen luku vuoden kuluvasta viikosta. Suomessa noudatetaan ISO 8601:tä: viikko alkaa maanantaista, 4. tammikuuta on aina viikolla 1.",
    breadcrumb: "Mikä on viikkonumero",
  },
  "/viikko-alkaa-maanantaista": {
    title: "Viikko alkaa maanantaista – ISO 8601 -sääntö | Viikko Nro",
    description:
      "Lue, miksi viikko alkaa maanantaista Suomessa. ISO 8601 määrää viikon ensimmäiseksi päiväksi maanantain ja viikon 1 ensimmäisen torstain perusteella.",
    breadcrumb: "Viikko alkaa maanantaista",
  },
  "/kuinka-monta-viikkoa-vuodessa": {
    title: "Kuinka monta viikkoa vuodessa on? 52 vai 53 | Viikko Nro",
    description:
      "Katso, montako viikkoa vuodessa on: tavallisesti 52, joskus 53. Vuonna 2026 on 53 viikkoa. Lue ISO 8601 -sääntö ja tarkista 53 viikon vuodet.",
    breadcrumb: "Viikkoja vuodessa",
  },
  "/suomi-vs-usa-viikkonumerot": {
    title: "Suomi vs. USA: miksi viikkonumero eroaa? | Viikko Nro",
    description:
      "Suomen ISO 8601 -viikko ja Yhdysvaltain sunnuntaista alkava viikko voivat antaa samalle päivälle eri numeron. Vertaile eroja oikeilla päivämäärillä.",
    breadcrumb: "Suomi vs. USA",
  },
  "/mika-kuukausi-nyt": {
    ...currentMonthMeta(),
    breadcrumb: "Mikä kuukausi nyt on",
  },
  "/mika-vuosi-nyt": {
    ...currentYearMeta(),
    breadcrumb: "Mikä vuosi nyt on",
  },
  "/viikonpaiva": {
    ...weekdayMeta,
    breadcrumb: "Viikonpäivälaskuri",
    breadcrumbParent: { name: "Laskurit", path: "/laskurit" },
  },
  "/ukk": {
    title: "Usein kysytyt kysymykset viikkonumeroista | Viikko Nro",
    description:
      "Vastauksia viikkonumeroista: mikä viikko nyt on, alkaako viikko maanantaista, kuinka monta viikkoa vuodessa on ja miten viikkonumero lasketaan.",
    breadcrumb: "UKK",
  },
  "/avoin-data": {
    title: "Avoin data ja JSON-rajapinta | Viikko Nro",
    description:
      "Ilmainen JSON-data Suomen viikoista, kuukausista, vuosista, vuosineljänneksistä, pyhäpäivistä ja liputuspäivistä. Ei kirjautumista, ei pyyntörajoja.",
    breadcrumb: "Avoin data",
  },
  "/tietoa-meista": {
    title: "Tietoa meistä | Viikko Nro",
    description:
      "Viikko Nro on ilmainen suomalainen viikkolaskuri. Lue lisää palvelusta ja tehtävästämme tehdä viikkonumeroiden tarkistamisesta helppoa.",
    breadcrumb: "Tietoa meistä",
  },
  "/ota-yhteytta": {
    title: "Ota yhteyttä | Viikko Nro",
    description:
      "Ota yhteyttä Viikko Nro -tiimiin verkkolomakkeella. Vastaamme palautteeseen, kysymyksiin ja kehitysehdotuksiin niin nopeasti kuin mahdollista.",
    breadcrumb: "Ota yhteyttä",
  },
  "/api-playground": {
    title: "API Playground — Free ISO Week Number API | Viikko Nro",
    description:
      "Test Viikko Nro's free ISO 8601 API in your browser. No auth or rate limit. Includes cURL, JavaScript, PHP and Python examples.",
    breadcrumb: "API Playground",
  },
  "/ajanhallinta": {
    title: "Ajanhallinta viikkonumeroiden avulla | Viikko Nro",
    description:
      "Viikko-, työpäivä-, lukukausi- ja sprinttisuunnittelu ISO 8601 -viikkonumeroiden avulla — kaikki Viikko Nron aikataulutyökalut yhdellä sivulla.",
    breadcrumb: "Ajanhallinta",
  },
  "/tietolahteet": {
    title: "Tietolähteet | Viikko Nro",
    description:
      "Mihin Viikko Nron viikkonumerot ja pyhäpäivätiedot perustuvat: ISO 8601 -standardi, Finlex-lakiviittaukset ja kuntien viralliset tiedotteet.",
    breadcrumb: "Tietolähteet",
  },
  "/menetelma": {
    title: "Menetelmä | Viikko Nro",
    description:
      "Miten viikkonumerot lasketaan: ISO 8601 -säännöt, vuodenvaihteen reunatapaukset, karkausvuodet, viikko 53 ja liikkuvien pyhäpäivien laskenta.",
    breadcrumb: "Menetelmä",
  },
  "/toimitusperiaatteet": {
    title: "Toimitusperiaatteet | Viikko Nro",
    description:
      "Miten Viikko Nro varmistaa sisällön oikeellisuuden, päivittää dataa ja korjaa virheitä.",
    breadcrumb: "Toimitusperiaatteet",
  },
  "/tietosuoja": {
    title: "Tietosuojaseloste | Viikko Nro",
    description:
      "Viikko Nro -palvelun tietosuojaseloste: mitä tietoja keräämme, miten käytämme niitä ja miten suojaamme yksityisyyttäsi.",
    breadcrumb: "Tietosuojaseloste",
  },
  "/kayttoehdot": {
    title: "Käyttöehdot | Viikko Nro",
    description:
      "Viikko Nro -palvelun käyttöehdot: palvelun käyttö, vastuunrajoitukset ja sovellettava lainsäädäntö selkeästi selitettynä ennen palvelun käyttöä.",
    breadcrumb: "Käyttöehdot",
  },
  "/laskurit": {
    title: "Viikkolaskurit ja päivämäärätyökalut | Viikko Nro",
    description:
      "Ilmaiset laskurit: päivämäärästä viikkonumeroon, viikosta päivämääräksi, työpäivät ja päivien erotus. Nopeita työkaluja ISO 8601 -viikkoihin.",
    breadcrumb: "Laskurit",
  },
  "/paivamaara-viikoksi": {
    title: "Päivämäärästä viikkonumeroon – viikkolaskuri | Viikko Nro",
    description:
      "Selvitä minkä tahansa päivämäärän viikkonumero ISO 8601 -standardin mukaan. Syötä päivä ja näe heti viikko, viikonpäivä ja viikon päivämäärät.",
    breadcrumb: "Päivämäärästä viikkoon",
    breadcrumbParent: { name: "Laskurit", path: "/laskurit" },
  },
  "/viikko-paivamaaraksi": {
    title: "Viikosta päivämääräksi – viikon päivämäärät | Viikko Nro",
    description:
      "Syötä viikkonumero ja vuosi, niin näet viikon alkamis- ja päättymispäivän sekä kaikki viikonpäivät. ISO 8601 -viikkolaskuri.",
    breadcrumb: "Viikosta päivämääräksi",
    breadcrumbParent: { name: "Laskurit", path: "/laskurit" },
  },
  "/tyopaivalaskuri": {
    title: "Työpäivälaskuri – työpäivien määrä | Viikko Nro",
    description:
      "Laske työpäivien määrä kahden päivämäärän välillä, viikonloput ja Suomen arkipyhät huomioiden. Hyödyksi palkanlaskentaan ja projektien suunnitteluun.",
    breadcrumb: "Työpäivälaskuri",
    breadcrumbParent: { name: "Laskurit", path: "/laskurit" },
  },
  "/paivien-erotus": {
    title: "Päivien erotus – montako päivää välissä | Viikko Nro",
    description:
      "Laske montako päivää, viikkoa ja työpäivää kahden päivämäärän välillä on. Ilmainen päivälaskuri.",
    breadcrumb: "Päivien erotus",
    breadcrumbParent: { name: "Laskurit", path: "/laskurit" },
  },
};

// Self-referencing canonical URL for a route ("/" keeps its trailing slash,
// subpaths have none — matching sitemap.xml).
export function canonicalFor(path) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

// Sitemap entries, generated at build time so year pages and <lastmod> stay
// current without hand-editing. `year` is the current full year.
export function sitemapEntries(year) {
  const entries = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/en", changefreq: "daily", priority: "0.4" },
    { path: "/mika-on-viikkonumero", changefreq: "monthly", priority: "0.8" },
    { path: "/viikko-alkaa-maanantaista", changefreq: "monthly", priority: "0.7" },
    { path: "/kuinka-monta-viikkoa-vuodessa", changefreq: "monthly", priority: "0.8" },
    { path: "/suomi-vs-usa-viikkonumerot", changefreq: "monthly", priority: "0.7" },
    { path: "/mika-kuukausi-nyt", changefreq: "daily", priority: "0.8" },
    { path: "/mika-vuosi-nyt", changefreq: "daily", priority: "0.8" },
    { path: "/viikonpaiva", changefreq: "monthly", priority: "0.7" },
    { path: "/ukk", changefreq: "monthly", priority: "0.8" },
    { path: "/avoin-data", changefreq: "monthly", priority: "0.6" },
    { path: "/api-playground", changefreq: "monthly", priority: "0.6" },
    { path: "/data/week", changefreq: "monthly", priority: "0.5" },
    { path: "/data/month", changefreq: "monthly", priority: "0.5" },
    { path: "/data/year", changefreq: "monthly", priority: "0.5" },
    { path: "/data/holiday", changefreq: "monthly", priority: "0.5" },
    { path: "/data/working-days", changefreq: "monthly", priority: "0.5" },
    { path: "/ajanhallinta", changefreq: "weekly", priority: "0.6" },
    { path: "/tietolahteet", changefreq: "monthly", priority: "0.6" },
    { path: "/menetelma", changefreq: "monthly", priority: "0.7" },
    { path: "/toimitusperiaatteet", changefreq: "monthly", priority: "0.5" },
    { path: "/laskurit", changefreq: "monthly", priority: "0.7" },
    { path: "/paivamaara-viikoksi", changefreq: "monthly", priority: "0.7" },
    { path: "/viikko-paivamaaraksi", changefreq: "monthly", priority: "0.7" },
    { path: "/tyopaivalaskuri", changefreq: "monthly", priority: "0.7" },
    { path: "/paivien-erotus", changefreq: "monthly", priority: "0.7" },
    { path: "/tietoa-meista", changefreq: "yearly", priority: "0.4" },
    { path: "/ota-yhteytta", changefreq: "yearly", priority: "0.4" },
    { path: "/tietosuoja", changefreq: "yearly", priority: "0.3" },
    { path: "/kayttoehdot", changefreq: "yearly", priority: "0.3" },
  ];
  // STEP 5 of the koululomat trust redesign: sitemap inclusion follows the
  // page's computed confidence tier, not just "does a page exist for this
  // year" — a Tier B (estimated) or Tier C page must never appear here, even
  // though it's still reachable/prerendered (noindex,follow, not gone).
  for (const schoolYear of schoolHolidayYears) {
    if (pageConfidenceTier(schoolYear) !== CONFIDENCE.CONFIRMED) continue;
    entries.push({
      path: `/koululomat-${schoolYear}`,
      changefreq: schoolYear >= year ? "monthly" : "yearly",
      priority: schoolYear >= year ? "0.8" : "0.6",
    });
  }
  for (const item of nameDayNames()) {
    entries.push({
      path: `/nimipaiva/${item.slug}`,
      changefreq: "yearly",
      priority: "0.6",
    });
  }
  for (const dateKey of nameDayDateKeys()) {
    entries.push({
      path: `/nimipaivat/${dateKey}`,
      changefreq: "yearly",
      priority: "0.5",
    });
  }
  if (todayNameDayPage().available) {
    entries.push({
      path: "/nimipaivat/tanaan",
      changefreq: "daily",
      priority: "0.8",
    });
  }
  // Historical floor 2020 (matches the year-picker's YEAR_MIN) through a rolling
  // +9-year horizon (≈2035 today). Every week/month/year page across that span
  // is prerendered and indexable; the top edge auto-advances on each rebuild, so
  // there's no hardcoded end year to maintain.
  const FUTURE_HORIZON = 9;
  for (let y = 2020; y <= year + FUTURE_HORIZON; y++) {
    const current = y === year;
    entries.push({
      path: `/vuosi-${y}`,
      changefreq: current ? "weekly" : "yearly",
      priority: current ? "0.7" : "0.6",
    });
    for (let w = 1; w <= weeksInIsoYear(y); w++) {
      entries.push({
        path: `/viikko-${w}-${y}`,
        changefreq: current ? "weekly" : "yearly",
        priority: current ? "0.6" : "0.4",
      });
    }
    for (let m = 1; m <= 12; m++) {
      entries.push({
        path: `/kuukausi-${m}-${y}`,
        changefreq: current ? "monthly" : "yearly",
        priority: current ? "0.6" : "0.4",
      });
    }
    for (let q = 1; q <= 4; q++) {
      entries.push({
        path: `/q${q}-${y}`,
        changefreq: current ? "monthly" : "yearly",
        priority: current ? "0.6" : "0.4",
      });
    }
    entries.push({
      path: `/pyhapaivat-${y}`,
      changefreq: current ? "monthly" : "yearly",
      priority: current ? "0.7" : "0.5",
    });
    entries.push({
      path: `/liputuspaivat-${y}`,
      changefreq: current ? "monthly" : "yearly",
      priority: current ? "0.6" : "0.4",
    });
    entries.push({
      path: `/tyopaivat-${y}`,
      changefreq: current ? "monthly" : "yearly",
      priority: current ? "0.7" : "0.5",
    });
    for (let m = 1; m <= 12; m++) {
      entries.push({
        path: `/tyopaivat-${M_SLUG[m - 1]}-${y}`,
        changefreq: current ? "monthly" : "yearly",
        priority: current ? "0.6" : "0.4",
      });
    }
    entries.push({
      path: `/tulosta-${y}`,
      changefreq: current ? "monthly" : "yearly",
      priority: current ? "0.7" : "0.5",
    });
    for (const holiday of HOLIDAY_DEFINITIONS) {
      entries.push({
        path: `/pyhat-${y}/${holiday.slug}`,
        changefreq: current ? "monthly" : "yearly",
        priority: current ? "0.7" : "0.5",
      });
    }
  }
  // Full-year calendar pages: 2020 .. year+9 (rolling) × {full, half 1, half 2,
  // print}. Auto-advances every rebuild so the indexed set never freezes.
  for (let cy = 2020; cy <= year + 9; cy++) {
    const cur = cy === year;
    entries.push({
      path: `/kalenteri-${cy}`,
      changefreq: cur ? "weekly" : "yearly",
      priority: cur ? "0.7" : "0.5",
    });
    entries.push({ path: `/kalenteri-${cy}-alkuvuosi`, changefreq: "yearly", priority: "0.3" });
    entries.push({ path: `/kalenteri-${cy}-loppuvuosi`, changefreq: "yearly", priority: "0.3" });
    entries.push({
      path: `/tulostettava-kalenteri-${cy}`,
      changefreq: "yearly",
      priority: "0.3",
    });
  }

  return entries;
}

// Resolve any route to its meta for prerendering: static pages from routeMeta,
// the homepage with the live current-week title/description, or a generated
// dynamic page (week/month/year/print). Returns null for routes not prerendered.
export function metaFor(url) {
  if (url === "/") return { ...routeMeta["/"], ...homeMeta(new Date()) };
  if (url === "/en") return { ...routeMeta[url], ...englishMeta() };
  if (url === "/mika-kuukausi-nyt") return { ...routeMeta[url], ...currentMonthMeta() };
  if (url === "/mika-vuosi-nyt") return { ...routeMeta[url], ...currentYearMeta() };
  if (routeMeta[url]) return routeMeta[url];
  let m;
  if ((m = url.match(/^\/data\/(week|month|year|holiday|working-days)$/)))
    return datasetPageMeta(m[1]);
  if (url === "/nimipaivat/tanaan") return todayNameDayMeta();
  if ((m = url.match(/^\/nimipaiva\/([a-z0-9-]+)$/))) return nameDayNameMeta(m[1]);
  if ((m = url.match(/^\/nimipaivat\/(\d{2}-\d{2})$/))) return nameDayDateMeta(m[1]);
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) return weekMeta(+m[1], +m[2]);
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) return monthMeta(+m[1], +m[2]);
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) return quarterMeta(+m[1], +m[2]);
  if ((m = url.match(/^\/vuosi-(\d+)$/))) return yearMeta(+m[1]);
  if ((m = url.match(/^\/tulosta-(\d+)$/))) return printMeta(+m[1]);
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) return holidaysMeta(+m[1]);
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) return flagDaysMeta(+m[1]);
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/)))
    return holidayPageMeta(+m[1], m[2]);
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) return workingDaysMeta(+m[1]);
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    return mi === -1 ? null : monthlyWorkingDaysMeta(mi + 1, +m[2]);
  }
  if ((m = url.match(/^\/koululomat-(\d+)$/))) return schoolHolidayMeta(+m[1]);
  if ((m = url.match(/^\/kalenteri-(\d+)-(alkuvuosi|loppuvuosi)$/)))
    return calendarMeta(+m[1], m[2] === "alkuvuosi" ? 1 : 2, false);
  if ((m = url.match(/^\/kalenteri-(\d+)$/))) return calendarMeta(+m[1], null, false);
  if ((m = url.match(/^\/tulostettava-kalenteri-(\d+)$/)))
    return calendarMeta(+m[1], null, true);
  return null;
}

// Ordered breadcrumb trail for a route (home is position 1). Powers the
// BreadcrumbList JSON-LD and mirrors the visible "Etusivu / …" breadcrumb on
// each page, including the 3-level trails on week/month pages.
export function breadcrumbTrail(url) {
  const home = { name: "Etusivu", path: "/" };
  if (routeMeta[url] && routeMeta[url].breadcrumb) {
    const parent = routeMeta[url].breadcrumbParent;
    return parent
      ? [home, parent, { name: routeMeta[url].breadcrumb, path: url }]
      : [home, { name: routeMeta[url].breadcrumb, path: url }];
  }
  let m;
  if ((m = url.match(/^\/data\/(week|month|year|holiday|working-days)$/))) {
    const p = DATASET_PAGES[m[1]];
    return [
      home,
      { name: "Avoin data", path: "/avoin-data" },
      { name: p.title, path: url },
    ];
  }
  if (url === "/nimipaivat/tanaan") {
    return [home, { name: "Nimipäivä tänään", path: url }];
  }
  if ((m = url.match(/^\/nimipaiva\/([a-z0-9-]+)$/))) {
    const page = nameDayNamePage(m[1]);
    if (!page) return null;
    return [home, { name: "Nimipäivät", path: "/nimipaivat/tanaan" }, { name: page.name, path: url }];
  }
  if ((m = url.match(/^\/nimipaivat\/(\d{2}-\d{2})$/))) {
    const page = nameDayDatePage(m[1]);
    if (!page) return null;
    return [home, { name: "Nimipäivät", path: "/nimipaivat/tanaan" }, { name: fmtFullFi(page.date), path: url }];
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return [home, { name: `Viikot ${m[1]}`, path: url }];
  }
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return [
      home,
      { name: `Viikot ${m[2]}`, path: `/vuosi-${m[2]}` },
      { name: `Viikko ${m[1]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return [
      home,
      { name: `Viikot ${m[2]}`, path: `/vuosi-${m[2]}` },
      { name: M_FULL[+m[1] - 1], path: url },
    ];
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    return [
      home,
      { name: `Viikot ${m[2]}`, path: `/vuosi-${m[2]}` },
      { name: `Q${m[1]} ${m[2]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/tulosta-(\d+)$/))) {
    return [
      home,
      { name: `Kalenteri ${m[1]}`, path: `/kalenteri-${m[1]}` },
      { name: `Tulostettava viikkolista ${m[1]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    return [
      home,
      { name: `Viikot ${m[1]}`, path: `/vuosi-${m[1]}` },
      { name: `Pyhäpäivät ${m[1]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    return [
      home,
      { name: `Viikot ${m[1]}`, path: `/vuosi-${m[1]}` },
      { name: `Liputuspäivät ${m[1]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    const page = holidayPageFor(+m[1], m[2]);
    if (!page) return null;
    return [
      home,
      { name: `Pyhäpäivät ${m[1]}`, path: `/pyhapaivat-${m[1]}` },
      { name: page.displayName, path: url },
    ];
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    return [
      home,
      { name: `Viikot ${m[1]}`, path: `/vuosi-${m[1]}` },
      { name: `Työpäivät ${m[1]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    if (mi === -1) return null;
    return [
      home,
      { name: `Viikot ${m[2]}`, path: `/vuosi-${m[2]}` },
      { name: `Työpäivät ${m[2]}`, path: `/tyopaivat-${m[2]}` },
      { name: M_FULL[mi], path: url },
    ];
  }
  if ((m = url.match(/^\/koululomat-(\d+)$/))) {
    const page = schoolHolidayPage(+m[1]);
    if (!page) return null;
    return [home, { name: `Koululomat ${m[1]}`, path: url }];
  }
  if ((m = url.match(/^\/kalenteri-(\d+)(?:-(alkuvuosi|loppuvuosi))?$/))) {
    if (!m[2]) return [home, { name: `Kalenteri ${m[1]}`, path: url }];
    const halfLabel = m[2] === "alkuvuosi" ? "1. vuosipuolisko" : "2. vuosipuolisko";
    return [
      home,
      { name: `Kalenteri ${m[1]}`, path: `/kalenteri-${m[1]}` },
      { name: `${halfLabel} ${m[1]}`, path: url },
    ];
  }
  if ((m = url.match(/^\/tulostettava-kalenteri-(\d+)$/))) {
    return [
      home,
      { name: `Kalenteri ${m[1]}`, path: `/kalenteri-${m[1]}` },
      { name: `Tulostettava A4-kuukausikalenteri ${m[1]}`, path: url },
    ];
  }
  return null;
}
