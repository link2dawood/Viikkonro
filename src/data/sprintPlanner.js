// Sprint calendar arithmetic for /sprinttisuunnittelija: consecutive sprints
// of N calendar weeks from a start date, with their ISO weeks, working days
// and the public holidays that cut a sprint's capacity. Plain .js so
// prerender.js can import it.
//
// The page states no methodology rules. It only lays out consecutive date
// ranges, so the sprint length and start weekday are the user's choice. Day
// rule: FINLAND_SPRINT in dayRules.js (the same working days as
// /tyopaivalaskuri; the two eves count as working days).
import { atMidnight, dm, dmy } from "./planningDates.js";
import { buildSprintTimeline, SPRINT_WEEKS, MAX_SPRINTS } from "../platform/planning/dates.js";
export { SPRINT_WEEKS, MAX_SPRINTS };
import { plannerMode, plannerPath } from "../platform/planners.js";

export const SPRINT_PATH = plannerPath("sprint");
export const SPRINT_UPDATED = "2026-10-10";

export const sprintPlan = (start, weeks, count, firstNumber = 1) => buildSprintTimeline(start, weeks, count, firstNumber, plannerMode("sprint"));

// The sprint a date falls in, or null.
export function sprintOn(plan, date) {
  const d = atMidnight(date);
  return plan?.find((s) => d >= s.from && d <= s.to) ?? null;
}

// "viikko 12" / "viikot 12-13" / "viikot 52/2026-1/2027"
export function sprintWeeks(s) {
  if (s.weekFromYear !== s.weekToYear) return `viikot ${s.weekFrom}/${s.weekFromYear}-${s.weekTo}/${s.weekToYear}`;
  return s.weekFrom === s.weekTo ? `viikko ${s.weekFrom}` : `viikot ${s.weekFrom}-${s.weekTo}`;
}

// Fixed example, computed by the planner itself: six two-week sprints from
// Monday 22 March 2027, the weeks around Easter.
export function sprintExample() {
  const plan = sprintPlan(new Date(2027, 2, 22), 2, 6);
  return { plan, easter: plan[0], last: plan[plan.length - 1] };
}

export function sprintFaqs() {
  const { plan, easter, last } = sprintExample();
  const names = easter.holidays.map((h) => `${h.name.toLowerCase()} ${dm(h.date)}`);
  return [
    { q: "Voinko jatkaa olemassa olevaa sprinttinumerointia?", a: "Voit valita ensimmäisen sprintin numeron. Seuraavat sprintit numeroidaan peräkkäin, ja sama numerointi näkyy PDF-, Excel- ja ICS-tiedostoissa." },
    { q: "Voinko ladata sprinttisuunnitelman?", a: "Voit ladata PDF:n, Excel-tiedoston ja ICS-kalenteritiedoston maksutta ilman tiliä. Excel sisältää sprintit sekä viikko- ja kuukausikohtaiset työpäivät. Tiedot käsitellään omassa selaimessasi. ICS tuo sprintit kalenteriin eikä luo päivittyvää tilausta." },
    {
      q: "Miten sprinttien päivämäärät lasketaan?",
      a: `Ensimmäinen sprintti alkaa valitsemastasi päivästä, ja jokainen sprintti kestää valitsemasi määrän kalenteriviikkoja. Seuraava sprintti alkaa heti edellisen päätyttyä. Esimerkiksi kahden viikon sprintit ${dmy(easter.from)} alkaen päättyvät ${dmy(easter.to)}, ${dmy(plan[1].to)} ja niin edelleen, kuudes sprintti ${dmy(last.to)}.`,
    },
    {
      q: "Miten arkipyhät vaikuttavat sprintin kapasiteettiin?",
      a: `Arkipyhä vähentää sprintin työpäiviä. Esimerkin ensimmäisessä sprintissä ${dmy(easter.from)}-${dmy(easter.to)} on ${easter.workingDays} työpäivää kymmenestä (${easter.capacity} prosenttia), koska ${names.join(" ja ")} ovat arkipyhiä.`,
    },
    {
      q: "Mikä viikkonumero sprintin alussa on?",
      a: `Taulukko näyttää jokaisen sprintin ISO 8601 -viikkonumerot. Esimerkin ensimmäinen sprintti kattaa ${sprintWeeks(easter)}. Viikkonumerot noudattavat samaa laskentaa kuin muut sivuston viikkosivut.`,
    },
    {
      q: "Lasketaanko jouluaatto ja juhannusaatto työpäiviksi?",
      a: "Kyllä, koska ne eivät ole lakisääteisiä arkipyhiä. Jos tiimisi on niinä päivinä vapaalla, vähennä ne sprintin kapasiteetista käsin.",
    },
  ];
}
export const SPRINT_STEPS = [
  "Valitse ensimmäisen sprintin aloituspäivä ja sprintin pituus viikkoina.",
  "Valitse, montako sprinttiä haluat nähdä.",
  "Katso jokaisen sprintin päivämäärät, ISO-viikot, työpäivät ja arkipyhät, jotka pienentävät kapasiteettia.",
];
