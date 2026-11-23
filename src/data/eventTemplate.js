// Shared layer for the dated event pages (adventti, itsenäisyyspäivä, joulu,
// uusi vuosi, loppiainen, the rare week 53). Three things live here:
//
// 1. EVENT_REVIEWS - the editorial review date per event page. A build date is
//    not a review date, so these are hand-set on the day the page's copy is
//    actually reviewed, never computed from the clock.
// 2. The countdown model and its Finnish sentence.
// 3. The day-off verdict helper.
//
// Why a plain .js data module rather than logic inside the components: the
// review date has three consumers that must never disagree - the visible
// "Päivitetty" line (EventTemplate.jsx), the page's schema dateModified and
// the sitemap lastmod (both via sitemapLastmod() in sitemapMetadata.js, which
// prerender.js already feeds into every WebPage node). Same single-source
// discipline the FAQ sets use, applied to dates.
import { fmtDayWithWeekdayFi, fmtFullFi, fmtShortFi } from "../components/dateUtils.js";

// Editorial review dates, YYYY-MM-DD. Each entry records a real review of
// that page's visible copy on that day; add a row only when the copy was
// actually gone through, and raise an existing row's date on a later review.
//
// 2026-11-21: Phase 3 event-page pass. Every page below gained the shared
// event template (answer line, countdown, day-off verdict, next-year link,
// calendar CTA) and had its dates and internal links rechecked against
// src/data/seasonalPages.js, src/data/observanceDays.js and dateUtils.
export const EVENT_REVIEWS = Object.freeze({
  "/adventti-2026": "2026-11-21",
  "/itsenaisyyspaiva-2026": "2026-11-21",
  "/pyhat-2026/itsenaisyyspaiva": "2026-11-21",
  "/joulu-2026": "2026-11-21",
  "/viikko-53-2026": "2026-11-21",
  "/uusi-vuosi-2027": "2026-11-21",
  "/loppiainen-2027": "2026-11-21",
});

// The review date for a path, or null when that page has no recorded review.
export function eventReviewedAt(path) {
  return EVENT_REVIEWS[path] ?? null;
}

// The review date a build or a visitor on `dayKey` (YYYY-MM-DD) may publish:
// the recorded date once that day has arrived, otherwise null so the caller
// falls back to the site-wide editorial date. One guard, three consumers (the
// visible line, the schema nodes, the sitemap), so a future-dated review can
// never leave one of them claiming a freshness the others withhold.
export function eventReviewedFor(path, dayKey) {
  const reviewed = eventReviewedAt(path);
  return reviewed && typeof dayKey === "string" && dayKey >= reviewed ? reviewed : null;
}

// "22. marraskuuta 2026" for the visible line, built from the same string the
// schema's dateModified uses, in the long Finnish form the rest of the site's
// "Sisältö päivitetty" lines already use.
export function eventReviewedFi(path) {
  const iso = eventReviewedAt(path);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return fmtFullFi(new Date(y, m - 1, d));
}

// Whole calendar days from `from` to `to`, time of day ignored (UTC maths so
// a daylight-saving boundary inside the span cannot shift the count).
export function wholeDaysBetween(from, to) {
  return Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      86400000,
  );
}

// The countdown state for one event. `today` comes from useToday() in the
// components, so the prerendered HTML and the hydrated page agree on the day
// and an open tab rolls over at midnight.
export function eventCountdown(target, today) {
  const days = wholeDaysBetween(today, target);
  return {
    days,
    state: days > 1 ? "future" : days === 1 ? "tomorrow" : days === 0 ? "today" : "past",
  };
}

const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// The visible countdown sentence. `illative` is the "mihin" form used in the
// count ("jouluaattoon"), `nameCap` the capitalized subject ("Jouluaatto").
// Returns null once the day has passed: the component then shows the
// next-year pointer instead of a negative number.
export function countdownSentence({ nameCap, illative, target, today }) {
  const { days, state } = eventCountdown(target, today);
  if (state === "past") return null;
  if (state === "today") return `${nameCap} on tänään ${fmtShortFi(target)}.`;
  if (state === "tomorrow") return `${nameCap} on huomenna ${fmtDayWithWeekdayFi(target)}.`;
  return `${upperFirst(illative)} on ${days} päivää (${fmtDayWithWeekdayFi(target)}).`;
}

// The day-off verdict, stated the way the query asks it. `weekend` means the
// day lands on a Saturday or Sunday, which in Finland is not moved to a
// weekday, so no extra day off follows.
export function dayOffVerdict({ official, weekend }) {
  if (!official) return "Ei virallinen vapaapäivä";
  return weekend ? "Kyllä, mutta osuu viikonlopulle" : "Kyllä, palkallinen vapaapäivä";
}
