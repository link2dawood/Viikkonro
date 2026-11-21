// The next holidays and observances after a given day, each paired with the
// page that answers it. Dates and names come from the same modules as the
// pages themselves (holidays.js, observanceDays.js), so the list cannot
// disagree with them. Only pages that are indexable today are returned, so a
// link from here never points at a noindex page.
import { addDays, atMidnight } from "./dateCalculator.js";
import { holidaysInYear } from "./holidays.js";
import { holidayLinkPath } from "./holidayPages.js";
import { OBSERVANCES, observancePage } from "./observanceDays.js";
import { isIndexable } from "./seo.js";
import { isoWeek, WD } from "../components/dateUtils.js";

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
