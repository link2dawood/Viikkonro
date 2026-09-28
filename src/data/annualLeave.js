// Annual leave (vuosiloma) arithmetic for /vuosilomalaskuri. Plain .js so
// prerender.js can import it.
//
// Rules, checked 2026-09-28 against the Annual Holidays Act (vuosilomalaki
// 162/2005) as restated by Procountor, Erto and Suomen Fysioterapeutit:
// - Leave accrues in the holiday credit year 1.4.-31.3. (lomanmääräytymisvuosi)
// - 2.5 days per full month if the employment has lasted at least a year by
//   31.3.; otherwise 2 days per full month; a fraction rounds UP to a day
// - A full month has at least 14 working days (or 35 working hours)
// - Leave is spent in arkipäivät: every day except Sundays, the church
//   holidays, itsenäisyyspäivä, jouluaatto, juhannusaatto, pääsiäislauantai
//   and vappu. Saturdays count, so a week of leave uses 6 days
// - Holiday season 2.5.-30.9.: up to 24 days of summer leave, the rest as
//   winter leave
// The church holidays plus itsenäisyyspäivä and vappu are exactly the 13
// official holidays in holidays.js; adding its two eves and pääsiäislauantai
// gives the full list of weekdays that do not use leave. Collective
// agreements can count leave in working days instead, which the page says.
import { fmtFullFi, isoWeek, isoYear, mondayOf, weeksInIsoYear, WD, WD_ESSIVE } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";
import { easterSunday } from "./juhlapaivat.js";

export const LEAVE_PATH = "/vuosilomalaskuri";
export const FACTS_CHECKED = "28.9.2026";

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Days in `year` (other than Sundays) that never use a leave day, name by date.
const freeCache = new Map();
function leaveFreeDays(year) {
  if (!freeCache.has(year)) {
    const map = new Map(holidaysInYear(year).map((h) => [h.date.toDateString(), h.name]));
    map.set(addDays(easterSunday(year), -1).toDateString(), "Pääsiäislauantai");
    freeCache.set(year, map);
  }
  return freeCache.get(year);
}

// Why a date does not use a leave day ("Sunnuntai", "Helatorstai"), or null.
export function leaveFreeReason(date) {
  const holiday = leaveFreeDays(date.getFullYear()).get(date.toDateString());
  if (holiday) return holiday;
  return date.getDay() === 0 ? WD[0] : null;
}

// Leave days used by a holiday from `from` to `to` inclusive.
export function leaveDaysUsed(from, to) {
  if (!from || !to || to < from) return null;
  let used = 0;
  let saturdays = 0;
  let days = 0;
  const skipped = [];
  for (let d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); d <= to; d = addDays(d, 1)) {
    days += 1;
    const reason = leaveFreeReason(d);
    if (reason) {
      if (d.getDay() !== 0) skipped.push({ date: d, name: reason });
    } else {
      used += 1;
      if (d.getDay() === 6) saturdays += 1;
    }
  }
  return { used, days, saturdays, skipped };
}

// Days earned from full months; `fullYear` = employment lasted a year by 31.3.
export function leaveAccrued(fullMonths, fullYear) {
  const months = Math.max(0, Math.min(12, Math.trunc(Number(fullMonths) || 0)));
  const rate = fullYear ? 2.5 : 2;
  return { months, rate, exact: months * rate, days: Math.ceil(months * rate) };
}

// Did the employment last at least a year by 31.3. of `endYear`?
export function lastedFullYear(start, endYear) {
  return start <= new Date(endYear - 1, 3, 1);
}

// Accrual table, 1-12 months at both rates.
export const ACCRUAL_TABLE = Array.from({ length: 12 }, (_, i) => ({
  months: i + 1,
  under: leaveAccrued(i + 1, false).days,
  full: leaveAccrued(i + 1, true).days,
}));

// ISO weeks of `year` where a Monday-Saturday week of leave uses fewer than
// 6 days, because a holiday or eve falls on it.
export function cheapWeeks(year) {
  const out = [];
  for (let w = 1; w <= weeksInIsoYear(year); w += 1) {
    const mon = mondayOf(w, year);
    const sat = addDays(mon, 5);
    const r = leaveDaysUsed(mon, sat);
    if (r.used < 6) out.push({ week: w, year, from: mon, to: sat, used: r.used, holidays: r.skipped });
  }
  return out;
}

const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

// Worked example with fixed dates, computed by the calculator itself.
export function leaveExample() {
  const from = new Date(2027, 4, 3);
  const to = new Date(2027, 4, 16);
  return { from, to, ...leaveDaysUsed(from, to) };
}

export function leaveFaqs() {
  const ex = leaveExample();
  return [
    {
      q: "Montako lomapäivää kertyy?",
      a: "Jokaiselta täydeltä lomanmääräytymiskuukaudelta kertyy 2,5 lomapäivää, jos työsuhde on kestänyt vähintään vuoden maaliskuun loppuun mennessä, ja muuten 2 lomapäivää. Koko vuodelta kertyy siis 30 tai 24 lomapäivää. Päivän osa pyöristetään ylöspäin täydeksi lomapäiväksi.",
    },
    {
      q: "Mikä on täysi lomanmääräytymiskuukausi?",
      a: "Kuukausi, jona työntekijä on ollut työssä vähintään 14 päivää. Jos työpäiviä on sopimuksen mukaan niin vähän, ettei 14 päivää täyty, täysi kuukausi on sellainen, jona työtunteja on vähintään 35. Lomanmääräytymisvuosi on 1.4.-31.3.",
    },
    {
      q: "Kuluttaako lauantai lomapäiviä?",
      a: "Kyllä. Vuosilomalain mukaan lauantai on arkipäivä, joten viikon loma maanantaista lauantaihin kuluttaa kuusi lomapäivää. Jotkin työehtosopimukset laskevat loman työpäivinä, jolloin viikko kuluttaa viisi päivää.",
    },
    {
      q: "Mitkä päivät eivät kuluta lomaa?",
      a: "Sunnuntait, kirkolliset juhlapyhät (esimerkiksi loppiainen, pitkäperjantai, 2. pääsiäispäivä, helatorstai ja joulupäivä), itsenäisyyspäivä, jouluaatto, juhannusaatto, pääsiäislauantai ja vapunpäivä. Jos loman aikana on arkipyhä, loma kuluttaa vähemmän päiviä.",
    },
    {
      q: "Montako lomapäivää kahden viikon loma kuluttaa?",
      a: `Tavallisesti 12 lomapäivää. Arkipyhät vähentävät määrää: esimerkiksi loma ${dm(ex.from)}-${dm(ex.to)}2027 kuluttaa ${ex.used} lomapäivää, koska ${ex.skipped.map((s) => s.name.toLowerCase()).join(" ja ")} ${ex.skipped.length === 1 ? "ei kuluta" : "eivät kuluta"} lomaa.`,
    },
    {
      q: "Milloin kesäloma pidetään?",
      a: "Lomakausi on 2.5.-30.9. Sen aikana annetaan kesälomana enintään 24 lomapäivää, ja loput lomapäivät pidetään talvilomana lomakauden ulkopuolella, viimeistään ennen seuraavan lomakauden alkua.",
    },
  ];
}

export const LEAVE_STEPS = [
  "Syötä loman ensimmäinen ja viimeinen päivä, niin näet montako lomapäivää loma kuluttaa.",
  "Laske kertyneet lomapäivät syöttämällä täysien lomanmääräytymiskuukausien määrä ja työsuhteen alkamispäivä.",
  "Katso vuoden viikot, joilla viikon loma kuluttaa vähemmän kuin kuusi lomapäivää.",
];

// "ti 14.5. Helatorstai" labels for the cheap-weeks list.
export const holidayLabel = (h) => `${WD[h.date.getDay()].slice(0, 2).toLowerCase()} ${dm(h.date)} ${h.name}`;
export const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;
export { isoWeek, isoYear };
