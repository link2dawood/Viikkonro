// Project timeline arithmetic for /projektiaikataulu: from a start date and a
// length in working days (or an end date) to the end date, the ISO weeks the
// project spans, working days per week and quarter-way milestones. Plain .js
// so prerender.js can import it.
//
// Day rule: FINLAND_PROJECT in dayRules.js, the same working days as
// /tyopaivalaskuri; the two eves count as working days.
import { dmy } from "./planningDates.js";
import { buildProjectTimeline, MAX_PROJECT_DAYS, MILESTONES } from "../platform/planning/dates.js";
export { MAX_PROJECT_DAYS, MILESTONES };
import { plannerMode, plannerPath } from "../platform/planners.js";

export const PROJECT_PATH = plannerPath("project");
export const PROJECT_UPDATED = "2026-10-10";

export const projectPlan = (start, options = {}) => buildProjectTimeline(start, { ...options, mode: plannerMode("project") });

// Fixed example, computed by the planner itself.
export function projectExample() {
  return { start: new Date(2027, 0, 11), ...projectPlan(new Date(2027, 0, 11), { workingDays: 60 }) };
}

export function projectFaqs() {
  const ex = projectExample();
  const half = ex.milestones.find((m) => m.percent === 50);
  return [
    { q: "Voinko lisätä vaiheita ja omia välitavoitteita?", a: "Voit lisätä enintään 30 vaihetta ja 50 omaa välitavoitetta. Riippuvainen vaihe alkaa edellisen valmistumisen jälkeisenä työpäivänä. Vaiheiden pitää mahtua projektin alku- ja loppupäivän välille. Välitavoite voi olla tietty päivämäärä tai vaiheen valmistuminen." },
    { q: "Voinko ladata projektisuunnitelman?", a: "Voit ladata PDF:n, Excel-tiedoston ja ICS-kalenteritiedoston maksutta ilman tiliä. Excel sisältää viikot, kuukaudet, vaiheet ja välitavoitteet. Tiedot käsitellään omassa selaimessasi eikä suunnitelmaa tallenneta palvelimelle. ICS on tuotava tiedosto, ei päivittyvä tilaus." },
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
