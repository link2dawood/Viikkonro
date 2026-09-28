// Pregnancy week and due-date arithmetic for /raskauslaskuri. Plain .js so
// prerender.js can import it.
//
// This is health content, so the page states only facts checked on
// 2026-09-28 against Finnish public sources, and always says the due date set
// by the neuvola or a doctor comes first:
// - Due date (laskettu aika) = the first day of the last period (VKA) + 280
//   days (40+0 weeks); confirmed by the early-pregnancy ultrasound at weeks
//   11+0-13+6; most births start between weeks 38+0 and 41+6
//   (hyvaks.fi, Sairaala Nova: "Raskausaikana")
// - A baby born before week 37+0 is premature (Terveyskirjasto)
// - Kela: pregnancy leave starts 14-30 working days before the due date and
//   lasts 40 working days; the allowance can be applied for once the
//   pregnancy has lasted 154 days (22 weeks), with a raskaustodistus; Kela's
//   working days are Monday-Saturday except arkipyhät (kela.fi)
import { fmtFullFi, isoWeek, isoYear, WD, WD_ESSIVE } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";

export const PREGNANCY_PATH = "/raskauslaskuri";
export const FACTS_CHECKED = "28.9.2026";
export const SOURCES = {
  hospital: "https://www.hyvaks.fi/sairaala-nova/synnytykset/raskausaikana",
  kela: "https://www.kela.fi/tyonantajat-raskaus-ja-vanhempainvapaat",
  kelaCalculator: "https://laskurit.kela.fi/raskaus-ja-vanhempainrahapaivien-laskuri/",
};

const DAY = 86400000;
const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a, b) => Math.round((atMidnight(b) - atMidnight(a)) / DAY);

export const dueFromLmp = (lmp) => addDays(atMidnight(lmp), 280);
export const lmpFromDue = (due) => addDays(atMidnight(due), -280);

// "12+3" for a number of days since the last period.
export const weekNotation = (days) => `${Math.floor(days / 7)}+${days % 7}`;
// The date on which week `w`+`d` starts.
export const dateAtWeek = (lmp, w, d = 0) => addDays(atMidnight(lmp), w * 7 + d);

// Kela working day: Monday-Saturday, except official holidays (arkipyhät).
const officialCache = new Map();
export function isKelaWorkingDay(date) {
  const y = date.getFullYear();
  if (!officialCache.has(y)) {
    officialCache.set(y, new Set(holidaysInYear(y).filter((h) => h.official).map((h) => h.date.toDateString())));
  }
  return date.getDay() !== 0 && !officialCache.get(y).has(date.toDateString());
}

// The day that is `n` Kela working days before `due` (counting back from the
// day before the due date).
export function workingDaysBefore(due, n) {
  let d = atMidnight(due);
  let left = n;
  while (left > 0) {
    d = addDays(d, -1);
    if (isKelaWorkingDay(d)) left -= 1;
  }
  return d;
}

// Everything the result box shows, from either the last period or a known
// due date, as of `today`.
export function pregnancyReport({ lmp, due }, today) {
  const t = atMidnight(today);
  const start = lmp ? atMidnight(lmp) : due ? lmpFromDue(due) : null;
  if (!start) return null;
  const dueDate = due ? atMidnight(due) : dueFromLmp(start);
  const days = daysBetween(start, t);
  if (days < 0 || days > 300) return { start, due: dueDate, outOfRange: true };
  return {
    start,
    due: dueDate,
    days,
    week: weekNotation(days),
    daysToDue: daysBetween(t, dueDate),
    dueWeekday: WD[dueDate.getDay()],
    dueIsoWeek: isoWeek(dueDate),
    dueIsoYear: isoYear(dueDate),
    milestones: milestones(start, dueDate),
  };
}

// Key dates, each with a verified meaning.
export function milestones(start, due) {
  return [
    {
      label: "Alkuraskauden ultraääni (rv 11+0-13+6)",
      from: dateAtWeek(start, 11),
      to: dateAtWeek(start, 13, 6),
    },
    { label: "Raskausrahaa voi hakea (154 päivää, rv 22+0)", from: dateAtWeek(start, 22) },
    { label: "Raskausvapaa voi alkaa aikaisintaan (30 arkipäivää ennen laskettua aikaa)", from: workingDaysBefore(due, 30) },
    { label: "Raskausvapaa alkaa viimeistään (14 arkipäivää ennen laskettua aikaa)", from: workingDaysBefore(due, 14) },
    { label: "Täysiaikaisuuden raja (rv 37+0)", from: dateAtWeek(start, 37) },
    { label: "Laskettu aika (rv 40+0)", from: due },
  ];
}

// Week-by-week calendar: rv 4-42 with the dates of each pregnancy week. A
// pregnancy week starts on the weekday the last period started, not Monday.
export function weekCalendar(start) {
  return Array.from({ length: 39 }, (_, i) => {
    const w = i + 4;
    return { week: w, from: dateAtWeek(start, w), to: dateAtWeek(start, w, 6) };
  });
}

const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;
const dmy = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

// FAQ with fixed example dates, so the answers never depend on the build day.
export function pregnancyFaqs() {
  const lmp = new Date(2027, 0, 1);
  const due = dueFromLmp(lmp);
  const leaveEarliest = workingDaysBefore(due, 30);
  const leaveLatest = workingDaysBefore(due, 14);
  return [
    {
      q: "Miten laskettu aika lasketaan?",
      a: `Laskettu aika on päivä, jolloin viimeisten kuukautisten alkamispäivästä on kulunut 40 viikkoa eli 280 päivää. Esimerkiksi jos viimeiset kuukautiset alkoivat ${dmy(lmp)}, laskettu aika on ${whenFi(due)}.`,
    },
    {
      q: "Mitä raskausviikko 12+3 tarkoittaa?",
      a: "Ensimmäinen luku on täysien raskausviikkojen määrä ja toinen niiden päälle tulevat päivät. Raskausviikko 12+3 tarkoittaa, että viimeisten kuukautisten alusta on kulunut 12 viikkoa ja 3 päivää.",
    },
    {
      q: "Voiko laskettu aika muuttua?",
      a: "Kyllä. Laskettu aika varmistetaan alkuraskauden ultraäänitutkimuksessa raskausviikolla 11+0-13+6, ja jos ultraäänen arvio poikkeaa kuukautisten mukaan lasketusta, laskettua aikaa voidaan korjata sen perusteella. Neuvolan määrittämä laskettu aika on aina ensisijainen.",
    },
    {
      q: "Milloin vauva todennäköisimmin syntyy?",
      a: "Laskettu aika on arvio. Suurimmassa osassa raskauksista synnytys käynnistyy raskausviikkojen 38+0 ja 41+6 välillä. Ennen raskausviikkoa 37+0 syntyvä lapsi on ennenaikainen.",
    },
    {
      q: "Milloin raskausvapaa alkaa?",
      a: `Raskausvapaa voi alkaa 14-30 arkipäivää ennen laskettua aikaa, ja se kestää 40 arkipäivää. Kelan arkipäiviä ovat maanantai-lauantai arkipyhiä lukuun ottamatta. Esimerkiksi kun laskettu aika on ${dmy(due)}, raskausvapaa voi alkaa aikaisintaan ${whenFi(leaveEarliest)} ja viimeistään ${whenFi(leaveLatest)}.`,
    },
    {
      q: "Milloin raskausrahaa voi hakea?",
      a: "Raskausrahaa voi hakea Kelasta, kun raskaus on kestänyt 154 päivää eli 22 viikkoa. Hakemukseen tarvitaan raskaustodistus neuvolasta tai lääkäriltä.",
    },
  ];
}

export const PREGNANCY_STEPS = [
  "Syötä viimeisten kuukautisten alkamispäivä tai neuvolasta saamasi laskettu aika.",
  "Näet raskausviikon muodossa viikot+päivät ja päivät laskettuun aikaan.",
  "Tärkeät päivät, kuten ultraääni, raskausrahan haku ja raskausvapaan alku, näkyvät listana.",
];
