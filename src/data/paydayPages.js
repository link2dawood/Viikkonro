// Content data for /palkkapaivat-{year} — when a monthly payday actually
// lands once weekends and bank holidays are accounted for. Plain .js so
// prerender.js can import it directly (same reason as flagDayPages.js).
//
// The rule (checked 2026-09-25): "Jos sovittu palkanmaksupäivä ei ole
// pankkipäivä, palkka on maksettava edellisenä pankkipäivänä" — the
// Employment Contracts Act rule as restated by Tehy's työelämäopas and the
// Helsinki Chamber of Commerce. Collective agreements can set their own
// payday, which is why the page lets the reader pick the day of month.
//
// Non-banking days (checked 2026-09-25 against the Bank of Finland's own
// bank-holiday list, suomenpankki.fi/en/money-and-payments/bank-holidays):
// Saturdays, Sundays, and New Year's Day, Epiphany, Good Friday, Easter
// Monday, May Day, Ascension Day, Midsummer Eve, Independence Day, Christmas
// Eve, Christmas Day and Boxing Day. Every one of those is already in
// holidaysInYear() (including the two unofficial eves, which banks close
// for), and the remaining entries of that list (Easter Sunday, Pentecost,
// Midsummer Day, All Saints' Day) always fall on a weekend — so "weekend or
// any holidaysInYear() date" is exactly the Bank of Finland's list.
import { fmtShortFi, isoWeek, isoYear, M_FULL, WD, WD_ESSIVE } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";

export const PAYDAY_LAST = "last";
export const DEFAULT_PAYDAY = 15;

function bankHolidayNames(year) {
  const map = new Map();
  for (const h of holidaysInYear(year)) map.set(h.date.toDateString(), h.name);
  return map;
}

// Why a date is not a banking day ("Lauantai", "Loppiainen", …), or null
// when it is one.
export function nonBankingReason(date) {
  const holiday = bankHolidayNames(date.getFullYear()).get(date.toDateString());
  if (holiday) return holiday;
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return WD[dow];
  return null;
}

// `day` is 1–31 or PAYDAY_LAST. A day past the month's end (e.g. 31 in
// April) means that month's last day.
export function paydayFor(year, month, day) {
  const lastDay = new Date(year, month, 0).getDate();
  const nominal = new Date(year, month - 1, day === PAYDAY_LAST ? lastDay : Math.min(day, lastDay));
  const actual = new Date(nominal);
  const reason = nonBankingReason(nominal);
  while (nonBankingReason(actual)) actual.setDate(actual.getDate() - 1);
  return {
    month,
    monthName: M_FULL[month - 1],
    nominal,
    actual,
    moved: reason !== null,
    reason,
    weekday: WD[actual.getDay()],
    week: isoWeek(actual),
    weekYear: isoYear(actual),
  };
}

export function paydaysInYear(year, day) {
  return Array.from({ length: 12 }, (_, i) => paydayFor(year, i + 1, day));
}

function movedList(rows) {
  return rows
    .filter((r) => r.moved)
    .map((r) => `${r.monthName.toLowerCase()} (${r.reason.toLowerCase()} → ${r.weekday.toLowerCase()} ${fmtShortFi(r.actual)})`);
}

export function paydayMeta(year) {
  const moved15 = paydaysInYear(year, DEFAULT_PAYDAY).filter((r) => r.moved).length;
  return {
    title: `Palkkapäivät ${year} – milloin palkka tulee | Viikko Nro`,
    description: `Palkkapäivät ${year} kuukausittain. Kun palkkapäivä osuu viikonloppuun tai arkipyhään, palkka maksetaan edellisenä pankkipäivänä – 15. päivä siirtyy ${moved15} kertaa.`,
  };
}

// Shared by Paydays.jsx (visible <details>) and prerender.js (FAQPage) —
// every answer computed for this exact year.
export function paydayFaqs(year) {
  const moved15 = movedList(paydaysInYear(year, DEFAULT_PAYDAY));
  const movedLast = movedList(paydaysInYear(year, PAYDAY_LAST));
  const bankHolidays = holidaysInYear(year)
    .filter((h) => h.date.getDay() !== 0 && h.date.getDay() !== 6)
    .map((h) => `${h.name} ${fmtShortFi(h.date)}`);
  const december = paydayFor(year, 12, DEFAULT_PAYDAY);
  return [
    {
      q: "Milloin palkka maksetaan, jos palkkapäivä on lauantai, sunnuntai tai arkipyhä?",
      a: "Jos sovittu palkanmaksupäivä ei ole pankkipäivä, palkka on työsopimuslain mukaan maksettava edellisenä pankkipäivänä. Palkka ei siis myöhästy, vaan tulee tilille aiemmin.",
    },
    {
      q: `Mitkä 15. päivän palkkapäivät siirtyvät vuonna ${year}?`,
      a: moved15.length
        ? `Vuonna ${year} kuun 15. päivän palkka siirtyy ${moved15.length} kertaa: ${moved15.join(", ")}.`
        : `Vuonna ${year} kuun 15. päivä on joka kuukausi pankkipäivä, joten palkkapäivä ei siirry kertaakaan.`,
    },
    {
      q: `Mitkä kuun viimeisen päivän palkkapäivät siirtyvät vuonna ${year}?`,
      a: movedLast.length
        ? `Vuonna ${year} kuun viimeisen päivän palkka siirtyy ${movedLast.length} kertaa: ${movedLast.join(", ")}.`
        : `Vuonna ${year} kuun viimeinen päivä on joka kuukausi pankkipäivä.`,
    },
    {
      q: `Mitkä arkipäivät eivät ole pankkipäiviä vuonna ${year}?`,
      a: `Viikonloppujen lisäksi pankit ovat vuonna ${year} kiinni näinä arkipäivinä: ${bankHolidays.join(", ")}.`,
    },
    {
      q: `Milloin joulukuun ${year} palkka maksetaan, jos palkkapäivä on 15. päivä?`,
      a: december.moved
        ? `Joulukuun 15. päivä ${year} on ${december.reason.toLowerCase()}, joten palkka maksetaan ${WD_ESSIVE[december.actual.getDay()]} ${fmtShortFi(december.actual)}.`
        : `Joulukuun 15. päivä ${year} on pankkipäivä (${december.weekday.toLowerCase()}), joten palkka maksetaan normaalisti ${fmtShortFi(december.actual)}.`,
    },
  ];
}
