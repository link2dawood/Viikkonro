// Project timeline arithmetic for /projektiaikataulu: from a start date and a
// length in working days (or an end date) to the end date, the ISO weeks the
// project spans, working days per week and quarter-way milestones. Plain .js
// so prerender.js can import it.
//
// Day rule: FINLAND_PROJECT in dayRules.js, the same working days as
// /tyopaivalaskuri; the two eves count as working days.
import { isoWeek, isoYear } from "../components/dateUtils.js";
import { addDays, atMidnight, dmy } from "./planningDates.js";
import { countsAsDay, dayReason } from "./dayRules.js";

export const PROJECT_PATH = "/projektiaikataulu";
export const PROJECT_UPDATED = "2026-10-06";
const MODE = "FINLAND_PROJECT";
const counts = (d) => countsAsDay(MODE, d);
export const MAX_PROJECT_DAYS = 520;
export const MILESTONES = [25, 50, 75, 100];

// First working day on or after `date`.
function firstWorkingDay(date) {
  let d = atMidnight(date);
  while (!counts(d)) d = addDays(d, 1);
  return d;
}

// The project plan, or null for unusable input. Give `workingDays` (length)
// or `end` (last day); the project starts on the first working day on or after
// `start`.
export function projectPlan(start, { workingDays, end } = {}) {
  if (!start) return null;
  const first = firstWorkingDay(start);
  const days = [];
  if (end) {
    const last = atMidnight(end);
    if (last < first) return null;
    for (let d = first; d <= last && days.length <= MAX_PROJECT_DAYS; d = addDays(d, 1)) {
      if (counts(d)) days.push(d);
    }
    if (!days.length || days.length > MAX_PROJECT_DAYS) return null;
  } else {
    const n = Math.trunc(Number(workingDays));
    if (!Number.isFinite(n) || n < 1 || n > MAX_PROJECT_DAYS) return null;
    for (let d = first; days.length < n; d = addDays(d, 1)) if (counts(d)) days.push(d);
  }
  const lastDay = days[days.length - 1];

  // One row per ISO week the project touches.
  const rows = [];
  for (let d = first; d <= lastDay; d = addDays(d, 1)) {
    const week = isoWeek(d);
    const year = isoYear(d);
    let row = rows[rows.length - 1];
    if (!row || row.week !== week || row.year !== year) {
      row = { week, year, from: d, to: d, workingDays: 0, holidays: [] };
      rows.push(row);
    }
    row.to = d;
    const reason = dayReason(MODE, d);
    if (reason === null) row.workingDays += 1;
    else if (d.getDay() >= 1 && d.getDay() <= 5) row.holidays.push({ date: d, name: reason });
  }

  const milestones = MILESTONES.map((percent) => {
    const date = days[Math.ceil((days.length * percent) / 100) - 1];
    return { percent, date, week: isoWeek(date), weekYear: isoYear(date) };
  });
  const calendarDays = Math.round((lastDay - first) / 86400000) + 1;
  return { start: first, end: lastDay, workingDays: days.length, calendarDays, rows, milestones };
}

// Fixed example, computed by the planner itself.
export function projectExample() {
  return { start: new Date(2027, 0, 11), ...projectPlan(new Date(2027, 0, 11), { workingDays: 60 }) };
}

export function projectFaqs() {
  const ex = projectExample();
  const half = ex.milestones.find((m) => m.percent === 50);
  return [
    {
      q: "Miten projektin loppupäivä lasketaan työpäivinä?",
      a: `Projekti alkaa aloituspäivästä tai sitä seuraavasta työpäivästä, ja jokainen maanantain ja perjantain välinen päivä, joka ei ole arkipyhä, on yksi työpäivä. Esimerkiksi ${ex.workingDays} työpäivän projekti, joka alkaa ${dmy(ex.start)}, päättyy ${dmy(ex.end)}.`,
    },
    {
      q: "Montako viikkoa projekti kestää?",
      a: `Laskuri näyttää projektin kattamat ISO-viikot. Esimerkin ${ex.workingDays} työpäivän projekti ${dmy(ex.start)}-${dmy(ex.end)} kestää ${ex.calendarDays} kalenteripäivää ja osuu ${ex.rows.length} viikolle, viikosta ${ex.rows[0].week} alkaen.`,
    },
    {
      q: "Mitkä päivät eivät ole työpäiviä?",
      a: "Lauantait, sunnuntait ja arkipyhät eivät ole työpäiviä. Jouluaatto ja juhannusaatto eivät ole lakisääteisiä arkipyhiä, joten laskuri pitää niitä työpäivinä, kuten työpäivälaskuri. Lisää tarvittaessa vapaat päivät käsin projektin kestoon.",
    },
    {
      q: "Mitä välitavoitteet 25, 50 ja 75 prosenttia tarkoittavat?",
      a: `Ne ovat projektin työpäiväjärjestyksen kohtia: ${half.percent} prosentin välitavoite osuu esimerkissä päivälle ${dmy(half.date)}, viikolle ${half.week}. Päivämäärät lasketaan työpäivien määrästä, eivät kalenteripäivistä.`,
    },
  ];
}

export const PROJECT_STEPS = [
  "Valitse aloituspäivä ja kirjoita projektin kesto työpäivinä, tai valitse loppupäivä.",
  "Katso projektin päättymispäivä, viikkojen määrä ja työpäivät viikoittain.",
  "Käytä 25, 50 ja 75 prosentin välitavoitteiden päivämääriä aikataulun tarkistuspisteinä.",
];
