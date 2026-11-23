// What is coming next, in two shapes.
//
// `upcomingEvents()` answers the homepage block: every holiday and observance
// after a given day, each paired with the page that answers it. Dates and names
// come from the same modules as the pages themselves (holidays.js,
// observanceDays.js), so the list cannot disagree with them. Only pages that are
// indexable today are returned, so a link from here never points at a
// page.
//
// `upcomingEventPages()` answers the sitewide rotating block. Why it exists: the
// seasonal landing pages (/joulu-{y}, /itsenaisyyspaiva-{y}, /joululoma-{y},
// /uusi-vuosi-{y}, /loppiainen-{y}) were reachable only from /vuosi-{y}, and
// Search Console confirmed the consequence on 2026-11-21: /joulu-2026 was
// unknown to Google and /itsenaisyyspaiva-2026, /itsenaisyyspaiva-2027 and
// /joululoma-2026 sat in "Discovered, currently not indexed". /adventti-2026 was
// the one seasonal page with sitewide placement (a hardcoded QuickLinks slot) and
// the only one indexed, ranking at position 1.5. This module generalises that
// single slot into a rotating block so every seasonal page earns the same
// internal links as its event approaches.
//
// Every date here is computed by the page's own data function, never restated,
// so neither list can drift from the page it links to.
import { addDays, atMidnight } from "./dateCalculator.js";
import { holidaysInYear } from "./holidays.js";
import { holidayLinkPath } from "./holidayPages.js";
import { OBSERVANCES, observancePage } from "./observanceDays.js";
import { CONFIDENCE, pageConfidenceTier } from "./schoolHolidayPages.js";
import {
  christmasBreakData,
  christmasData,
  epiphanyData,
  itsenaisyyspaivaData,
  newYearData,
} from "./seasonalPages.js";
import { isIndexable } from "./seo.js";
import { helsinkiDayKey, isoWeek, WD } from "../components/dateUtils.js";

// Holidays that have their own, richer page than /pyhat-{year}/{slug}.
const DEDICATED_PAGE = {
  "Uudenvuodenpäivä": (y) => `/uusi-vuosi-${y}`,
  Loppiainen: (y) => `/loppiainen-${y}`,
  Itsenäisyyspäivä: (y) => `/itsenaisyyspaiva-${y}`,
  Jouluaatto: (y) => `/joulu-${y}`,
};

/**
 * @param {Date} today any time on the Helsinki day that counts as "today"
 * @param {number} [limit]
 * @returns {{name:string, date:Date, weekday:string, week:number, path:string}[]}
 */
export function upcomingEvents(today, limit = 8) {
  const from = atMidnight(today);
  const horizon = addDays(from, 400);
  const found = new Map();
  const add = (name, date, path) => {
    if (!path || date < from || date > horizon || found.has(path)) return;
    if (!isIndexable(path, from.getFullYear())) return;
    found.set(path, { name, date, weekday: WD[date.getDay()], week: isoWeek(date), path });
  };
  for (let y = from.getFullYear(); y <= from.getFullYear() + 1; y++) {
    for (const holiday of holidaysInYear(y)) {
      const dedicated = DEDICATED_PAGE[holiday.name]?.(y);
      add(holiday.name, holiday.date, dedicated ?? holidayLinkPath(holiday.name, holiday.date));
    }
    for (const { slug } of OBSERVANCES) {
      const page = observancePage(slug, y);
      add(page.name, page.date, page.path);
    }
  }
  return [...found.values()].sort((a, b) => a.date - b.date).slice(0, limit);
}

// Mirrors the dated-family window in isIndexable(): linking to a pruned year
// would spend internal links on a page that cannot rank.
const indexableYear = (y, currentYear) => y >= currentYear - 1 && y <= currentYear + 2;

// "23.12.2026" -> Date. christmasBreakData() publishes its start as the display
// string, so parse that rather than recomputing the date independently.
function parseFiDate(text) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(text).trim());
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// One entry per seasonal page, for a single calendar year.
function seasonalCandidates(y) {
  const out = [];

  const independence = itsenaisyyspaivaData(y);
  out.push({
    path: `/itsenaisyyspaiva-${y}`,
    name: `Itsenäisyyspäivä ${y}`,
    desc: "Vapaapäivä, liputus ja viikko",
    date: independence.date,
    year: y,
  });

  const breakData = christmasBreakData(y);
  const breakStart = parseFiDate(breakData.generalStart);
  if (breakStart && pageConfidenceTier(y) === CONFIDENCE.CONFIRMED) {
    out.push({
      path: `/joululoma-${y}`,
      name: `Joululoma ${y}`,
      desc: "Koulujen joululoma kaupungeittain",
      date: breakStart,
      year: y,
    });
  }

  const christmas = christmasData(y);
  out.push({
    path: `/joulu-${y}`,
    name: `Joulu ${y}`,
    desc: "Jouluaatto, joulupäivä ja tapaninpäivä",
    date: christmas.eve.date,
    year: y,
  });

  // newYearData(y) describes the turn of the year INTO y: its eve falls on
  // 31.12.(y-1), which is what makes it the next upcoming event in December.
  const newYear = newYearData(y);
  out.push({
    path: `/uusi-vuosi-${y}`,
    name: `Uusi vuosi ${y}`,
    desc: "Uudenvuodenaatto ja uudenvuodenpäivä",
    date: newYear.eve.date,
    year: y,
  });

  const epiphany = epiphanyData(y);
  out.push({
    path: `/loppiainen-${y}`,
    name: `Loppiainen ${y}`,
    desc: "Päivämäärä, viikko ja vapaapäivä",
    date: epiphany.date,
    year: y,
  });

  for (const observance of OBSERVANCES) {
    const page = observancePage(observance.slug, y);
    if (!page) continue;
    out.push({
      path: page.path,
      name: `${observance.name} ${y}`,
      desc: page.weekday ? `${page.weekday} ${page.date.getDate()}.${page.date.getMonth() + 1}.` : "",
      date: page.date,
      year: y,
    });
  }

  return out;
}

/**
 * The next `count` seasonal event pages, soonest first.
 *
 * An event stays listed through its own day (people search "joulu 2026" on
 * 24.12.) and drops out the day after, which is what keeps the block from
 * pointing at pages whose query demand has already collapsed.
 */
export function upcomingEventPages(today = new Date(), count = 5) {
  const dayKey = helsinkiDayKey(today);
  const currentYear = Number(dayKey.slice(0, 4));
  const todayStart = new Date(
    currentYear,
    Number(dayKey.slice(5, 7)) - 1,
    Number(dayKey.slice(8, 10)),
  );

  // Three calendar years of candidates so the block still fills in late
  // December, when everything left is in January.
  const candidates = [currentYear, currentYear + 1, currentYear + 2]
    .filter((y) => indexableYear(y, currentYear))
    .flatMap(seasonalCandidates)
    .filter((e) => e.date instanceof Date && !Number.isNaN(e.date.getTime()))
    .filter((e) => e.date >= todayStart)
    .filter((e) => indexableYear(e.year, currentYear));

  const seen = new Set();
  return candidates
    .sort((a, b) => a.date - b.date || a.path.localeCompare(b.path))
    .filter((e) => (seen.has(e.path) ? false : seen.add(e.path)))
    .slice(0, count);
}

export default upcomingEventPages;
