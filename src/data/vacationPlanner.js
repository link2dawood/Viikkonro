// Vacation planner arithmetic for /lomasuunnittelija: how long a break a given
// number of leave days buys when it is placed between weekends and public
// holidays. Plain .js so prerender.js can import it.
//
// Day rule: FINLAND_PLANNER in dayRules.js (a five-day week; the two eves are
// days off). Under the Annual Holidays Act a Saturday is also a leave day;
// /vuosilomalaskuri counts leave that way (FINLAND_STATUTORY_LEAVE).
// - A break starts on the first day of a run of days off and ends on a day off,
//   so leave days are never spent at the edge of a break.
import { dayReason } from "./dayRules.js";
import { addDays, dm } from "./planningDates.js";

export const PLANNER_PATH = "/lomasuunnittelija";
export const PLANNER_UPDATED = "2026-10-06";
export const PLANNER_BUDGETS = [1, 2, 3, 4, 5, 7, 10];
export const MAX_LEAVE_DAYS = 30;
const EXAMPLE_YEAR = 2027;
const EXAMPLE_BUDGET = 4;

const MODE = "FINLAND_PLANNER";

// Why a date is a day off ("Lauantai", "Helatorstai"), or null for a workday.
export const dayOffReason = (date) => dayReason(MODE, date);

// Leave days a break from `from` to `to` (inclusive) needs under the
// five-day-week rule.
export function leaveDaysNeeded(from, to) {
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (dayOffReason(d) === null) n += 1;
  return n;
}

// Public holidays inside the break that fall on Monday-Friday: these are the
// days that make the break cheap.
function weekdayHolidays(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const reason = dayOffReason(d);
    if (reason && reason !== "Lauantai" && reason !== "Sunnuntai" && d.getDay() >= 1 && d.getDay() <= 5) {
      out.push({ date: d, name: reason });
    }
  }
  return out;
}

// The longest breaks that start in `year` and use at most `leaveDays` leave
// days, best first, none overlapping. A break may run into early January of
// the next year (Christmas to Epiphany).
export function bestBreaks(year, leaveDays, limit = 3) {
  const budget = Math.max(0, Math.min(MAX_LEAVE_DAYS, Math.trunc(Number(leaveDays) || 0)));
  const start = addDays(new Date(year, 0, 1), -1);
  const end = new Date(year + 1, 0, 14);
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ date: d, off: dayOffReason(d) !== null });

  const candidates = [];
  for (let i = 1; i < days.length; i += 1) {
    if (days[i].date.getFullYear() !== year) continue;
    if (!days[i].off || days[i - 1].off) continue; // only the first day of a run of days off
    let used = 0;
    let last = i;
    for (let j = i; j < days.length; j += 1) {
      if (days[j].off) last = j;
      else {
        used += 1;
        if (used > budget) break;
      }
    }
    const from = days[i].date;
    const to = days[last].date;
    candidates.push({ from, to, days: last - i + 1, used: leaveDaysNeeded(from, to) });
  }
  candidates.sort((a, b) => b.days - a.days || a.used - b.used || a.from - b.from);

  const picked = [];
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (picked.some((p) => c.from <= p.to && p.from <= c.to)) continue;
    picked.push({ ...c, holidays: weekdayHolidays(c.from, c.to) });
  }
  return picked.sort((a, b) => a.from - b.from);
}

// The single best break for each budget in PLANNER_BUDGETS.
export function breakTable(year) {
  return PLANNER_BUDGETS.map((leave) => {
    const [best] = bestBreaks(year, leave, 1);
    return { leave, ...best };
  });
}

// "uudenvuodenpäivä ja loppiainen", "a, b ja c"
const holidayList = (list) => {
  const names = list.map((h) => h.name.toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} ja ${names[names.length - 1]}` : names.join("");
};

// Fixed example, computed by the planner itself.
export function plannerExample() {
  const [best] = bestBreaks(EXAMPLE_YEAR, EXAMPLE_BUDGET, 1);
  return { year: EXAMPLE_YEAR, budget: EXAMPLE_BUDGET, ...best };
}

export function plannerFaqs() {
  const ex = plannerExample();
  return [
    {
      q: "Miten saa pitkän loman vähillä lomapäivillä?",
      a: `Viikonloput ja arkipyhät ovat jo vapaata, joten lomapäiviä tarvitaan vain niiden väliin jääville työpäiville. Esimerkiksi vuonna ${ex.year} ${ex.used} lomapäivällä saa ${ex.days} päivän tauon ${dm(ex.from)}-${dm(ex.to)}${ex.to.getFullYear()}, johon kuuluvat ${holidayList(ex.holidays)}.`,
    },
    {
      q: "Miten suunnittelija laskee lomapäivät?",
      a: "Lomapäivä on maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Lauantait, sunnuntait ja arkipyhät ovat vapaata. Vuosilomalain mukaan lauantai on kuitenkin lomapäivä, joten vuosiloman kulutus lasketaan erikseen vuosilomalaskurilla.",
    },
    {
      q: "Ovatko jouluaatto ja juhannusaatto vapaapäiviä?",
      a: "Ne eivät ole lakisääteisiä arkipyhiä, mutta useimmat työpaikat ovat silloin kiinni. Suunnittelija käsittelee molemmat vapaapäivinä. Tarkista oman työpaikkasi käytäntö työehtosopimuksesta tai työnantajalta.",
    },
    {
      q: "Mistä arkipyhät tulevat?",
      a: "Arkipyhät lasketaan samasta suomalaisesta pyhäpäivälaskennasta, jota käyttävät sivuston pyhäpäivä- ja työpäiväsivut. Liikkuvat pyhät, kuten pääsiäinen, helatorstai ja juhannus, lasketaan jokaiselle vuodelle erikseen.",
    },
  ];
}

export const PLANNER_STEPS = [
  "Valitse vuosi ja kirjoita, montako lomapäivää aiot käyttää.",
  "Katso pisimmät tauot, jotka alkavat valittuna vuonna ja mahtuvat lomapäiviisi.",
  "Valitse taukoon sopiva ajankohta ja tarkista lomapäivien kulutus vuosilomalaskurilla.",
];
