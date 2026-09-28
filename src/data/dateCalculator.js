// Date arithmetic for /paivamaaralaskuri (add or subtract days, weeks, months
// or working days) and the fixed-offset pages /{n}-paivaa-eteenpain. Plain .js
// so prerender.js can import it.
//
// Conventions (stated on the page so the answer is never ambiguous):
// - The start day is not counted: 1.1. + 1 päivä = 2.1.
// - Adding months keeps the day of month; if the target month is shorter,
//   the result is its last day (31.1. + 1 kk = 28.2. or 29.2.).
// - A working day (arkipäivä) is Monday to Friday excluding the 13 official
//   public holidays: the same definition as /tyopaivalaskuri and
//   /tyopaivat-{year}, so all three tools agree. Juhannusaatto and jouluaatto
//   are not official holidays and therefore count as working days.
// - Facts in OFFSET_NOTES were checked on 2026-09-28: the 14-day right of
//   withdrawal in distance selling (kuluttajansuojalaki 6 luku) and the
//   Schengen rule of 90 days within any 180-day period.
import {
  fmtFullFi,
  isoWeek,
  isoYear,
  M_GENITIVE,
  WD,
  WD_ESSIVE,
} from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";

export const CALCULATOR_PATH = "/paivamaaralaskuri";
export const OFFSETS = [7, 14, 30, 45, 60, 90, 100, 180];
export const offsetPath = (n) => `/${n}-paivaa-eteenpain`;
export const OFFSET_SLUG_RE = /^(\d+)-paivaa-eteenpain$/;
export const isOffset = (n) => OFFSETS.includes(Number(n));

// Local midnight, so date math never drifts across a DST change.
export const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function addMonths(date, n) {
  const first = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), lastDay));
}

const officialCache = new Map();
function officialHolidays(year) {
  if (!officialCache.has(year)) {
    officialCache.set(
      year,
      new Map(holidaysInYear(year).filter((h) => h.official).map((h) => [h.date.toDateString(), h.name])),
    );
  }
  return officialCache.get(year);
}

export function isWorkingDay(date) {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6 && !officialHolidays(date.getFullYear()).has(date.toDateString());
}

// Name of the official holiday on this date, or null.
export function officialHolidayOn(date) {
  return officialHolidays(date.getFullYear()).get(date.toDateString()) ?? null;
}

// n working days after (n > 0) or before (n < 0) the start day.
export function addWorkingDays(date, n) {
  const step = n < 0 ? -1 : 1;
  let left = Math.abs(n);
  let d = atMidnight(date);
  while (left > 0) {
    d = addDays(d, step);
    if (isWorkingDay(d)) left -= 1;
  }
  return d;
}

// Working days strictly after `from` up to and including `to`.
export function workingDaysAfter(from, to) {
  let count = 0;
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) if (isWorkingDay(d)) count += 1;
  return count;
}

export const UNITS = {
  paivaa: { label: "päivää", apply: (d, n) => addDays(d, n) },
  viikkoa: { label: "viikkoa", apply: (d, n) => addDays(d, n * 7) },
  kuukautta: { label: "kuukautta", apply: (d, n) => addMonths(d, n) },
  arkipaivaa: { label: "arkipäivää", apply: (d, n) => addWorkingDays(d, n) },
};

// One calculation, with everything the result box shows.
export function calculate(start, amount, unit, direction = 1) {
  const n = Math.trunc(Number(amount));
  if (!start || !Number.isFinite(n) || !UNITS[unit]) return null;
  const from = atMidnight(start);
  const result = UNITS[unit].apply(from, n * direction);
  const span = Math.round((atMidnight(result) - from) / 86400000);
  return {
    from,
    result,
    weekday: WD[result.getDay()],
    week: isoWeek(result),
    weekYear: isoYear(result),
    calendarDays: Math.abs(span),
    holiday: officialHolidayOn(result),
    working: isWorkingDay(result),
  };
}

// "12 viikkoa ja 6 päivää"
export function weeksAndDays(days) {
  const w = Math.floor(days / 7);
  const d = days % 7;
  const weeks = w === 1 ? "1 viikko" : `${w} viikkoa`;
  const rest = d === 1 ? "1 päivä" : `${d} päivää`;
  if (!w) return rest;
  return d ? `${weeks} ja ${rest}` : weeks;
}

const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;

// Short context for some offsets. Only verified facts; most offsets have none.
const OFFSET_NOTES = {
  14: "Etämyynnissä, kuten verkkokaupassa, kuluttajalla on yleensä 14 päivän peruuttamisoikeus. Laskurilla näet, mihin päivään asti peruutusaikaa on jäljellä.",
  90: "Schengen-alueella viisumivapaasti matkustava saa oleskella enintään 90 päivää minkä tahansa 180 päivän jakson aikana.",
  180: "Schengen-alueen 90 päivän oleskelusääntö lasketaan aina taaksepäin 180 päivän jaksolta, joten 180 päivän päähän katsominen auttaa matkojen suunnittelussa.",
};
export const offsetNote = (n) => OFFSET_NOTES[n] ?? null;

// Everything a /{n}-paivaa-eteenpain page shows for a given "today".
export function offsetPage(n, today) {
  const from = atMidnight(today);
  const result = addDays(from, n);
  return {
    n,
    from,
    result,
    weekday: WD[result.getDay()],
    weekdayEssive: WD_ESSIVE[result.getDay()],
    week: isoWeek(result),
    weekYear: isoYear(result),
    weekPath: `/viikko-${isoWeek(result)}-${isoYear(result)}`,
    monthPath: `/kuukausi-${result.getMonth() + 1}-${result.getFullYear()}`,
    monthLabel: `${M_GENITIVE[result.getMonth()]} ${result.getFullYear()} viikot`,
    workingDays: workingDaysAfter(from, result),
    weeksAndDays: weeksAndDays(n),
    holiday: officialHolidayOn(result),
    back: addDays(from, -n),
    path: offsetPath(n),
  };
}

// n days from the 1st of every month of `year`: a stable reference table
// that does not depend on today.
export function monthlyTable(n, year) {
  return Array.from({ length: 12 }, (_, i) => {
    const from = new Date(year, i, 1);
    const result = addDays(from, n);
    return { from, result, weekday: WD[result.getDay()], week: isoWeek(result), weekYear: isoYear(result) };
  });
}

export function offsetMeta(n, today) {
  const p = offsetPage(n, today);
  return {
    title: `${n} päivää eteenpäin: mikä päivä se on? | Viikko Nro`,
    description: `${n} päivää tästä päivästä on ${whenFi(p.result)}, viikolla ${p.week}. Näet myös arkipäivät, viikot ja ${n} päivää taaksepäin.`,
  };
}

// Shared by DateOffset.jsx (visible <details>) and prerender.js (FAQPage).
export function offsetFaqs(n, today) {
  const p = offsetPage(n, today);
  return [
    {
      q: `Mikä päivä on ${n} päivän päästä?`,
      a: `${n} päivää tästä päivästä (${dm(p.from)}) on ${whenFi(p.result)}. Päivä kuuluu viikkoon ${p.week}.`,
    },
    {
      q: `Montako viikkoa on ${n} päivää?`,
      a: `${n} päivää on ${p.weeksAndDays}.`,
    },
    {
      q: `Montako arkipäivää on seuraavan ${n} päivän aikana?`,
      a: `Tästä päivästä ${n} päivää eteenpäin on ${p.workingDays} arkipäivää, kun viikonloput ja viralliset arkipyhät jätetään pois.`,
    },
    {
      q: `Mikä päivä oli ${n} päivää sitten?`,
      a: `${n} päivää sitten oli ${whenFi(p.back)}.`,
    },
    {
      q: "Lasketaanko aloituspäivä mukaan?",
      a: `Ei. Aloituspäivä on päivä nolla, joten esimerkiksi 1.1. + ${n} päivää on ${dm(addDays(new Date(p.from.getFullYear(), 0, 1), n))}.`,
    },
  ];
}

// Calculator page FAQ (not date-dependent).
export function dateCalculatorFaqs() {
  return [
    {
      q: "Lasketaanko aloituspäivä mukaan?",
      a: "Ei. Aloituspäivä on päivä nolla, joten 1.1. + 1 päivä on 2.1. Samoin 1.1. + 1 viikko on 8.1.",
    },
    {
      q: "Mitä tapahtuu, jos kuukaudessa ei ole samaa päivää?",
      a: "Kun lisäät kuukausia, laskuri pitää saman kuukaudenpäivän. Jos kohdekuukausi on lyhyempi, tulos on sen viimeinen päivä: esimerkiksi 31.1. + 1 kuukausi on 28.2. tai karkausvuonna 29.2.",
    },
    {
      q: "Mitkä päivät lasketaan arkipäiviksi?",
      a: "Arkipäiviä ovat maanantai-perjantai, paitsi Suomen 13 virallista arkipyhää. Juhannus- ja jouluaatto eivät ole virallisia pyhäpäiviä, joten ne lasketaan arkipäiviksi, kuten työpäivälaskurissakin.",
    },
    {
      q: "Voiko laskurilla laskea taaksepäin?",
      a: "Kyllä. Valitse suunnaksi taaksepäin, niin laskuri vähentää päivät, viikot, kuukaudet tai arkipäivät annetusta päivästä.",
    },
    {
      q: "Miten lasken päivien määrän kahden päivämäärän välillä?",
      a: "Käytä päivien erotus -laskuria. Tämä laskuri toimii toisin päin: annat aloituspäivän ja määrän, ja saat tuloksena päivämäärän.",
    },
  ];
}

export const DATE_CALCULATOR_STEPS = [
  "Valitse aloituspäivä. Oletuksena on tämä päivä.",
  "Kirjoita määrä ja valitse yksikkö: päivää, viikkoa, kuukautta tai arkipäivää.",
  "Valitse suunta: eteenpäin tai taaksepäin.",
  "Tulos näyttää päivämäärän, viikonpäivän ja viikkonumeron.",
];
