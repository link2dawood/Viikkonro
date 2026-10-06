import { dWritten } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";
import { dayReason } from "./dayRules.js";

export const WORKING_DAYS_UPDATED = "2026-10-05";
export const KELA_WORKDAY_SOURCE = "https://www.kela.fi/raskausaikana";

export const DAY_COUNT_MODES = {
  work: {
    label: "Työpäivät (ma-pe)",
    resultLabel: "työpäivää",
    excludedLabel: "Viikonlopun päivää",
  },
  kela: {
    label: "Kelan arkipäivät (ma-la)",
    resultLabel: "Kelan arkipäivää",
    excludedLabel: "Sunnuntaipäivää",
  },
};

function parseInputDate(value) {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  if (
    date.getFullYear() !== parts[0] ||
    date.getMonth() !== parts[1] - 1 ||
    date.getDate() !== parts[2]
  ) return null;
  return date;
}

// Both modes include the start and end date. The normal mode counts Monday
// through Friday; the Kela mode counts Monday through Saturday. Official
// holidays are excluded in both. Kela rule checked 2026-10-05:
// https://www.kela.fi/raskausaikana
export function calculateDaysBetween(fromValue, toValue, mode = "work") {
  const from = parseInputDate(fromValue);
  const to = parseInputDate(toValue);
  if (!from || !to || from > to || !DAY_COUNT_MODES[mode]) return null;

  const officialHolidays = new Set();
  for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
    holidaysInYear(year)
      .filter((holiday) => holiday.official)
      .forEach((holiday) => officialHolidays.add(holiday.date.toDateString()));
  }

  let working = 0;
  let holidays = 0;
  let weekend = 0;
  let total = 0;
  const date = new Date(from);
  while (date <= to) {
    total += 1;
    const day = date.getDay();
    const excludedByWeek = mode === "kela" ? day === 0 : day === 0 || day === 6;
    // The work mode follows the shared FINLAND_WORKDAY rule; the Kela mode
    // (Monday-Saturday) has its own definition above.
    const isHoliday =
      mode === "work" ? dayReason("FINLAND_WORKDAY", date) !== null : officialHolidays.has(date.toDateString());
    if (excludedByWeek) weekend += 1;
    else if (isHoliday) holidays += 1;
    else working += 1;
    date.setDate(date.getDate() + 1);
  }
  return {
    working,
    holidays,
    weekend,
    total,
    from: dWritten(from),
    to: dWritten(to),
    mode,
    ...DAY_COUNT_MODES[mode],
  };
}

// Shared by visible answers and prerendered FAQPage structured data.
export const workingDaysBetweenFaqs = [
  {
    q: "Lasketaanko jouluaatto ja juhannusaatto työpäiviksi?",
    a: "Kyllä. Kumpikaan ei ole Suomen lain mukaan virallinen arkipyhä, vaikka suurin osa työpaikoista on kiinni tai lyhentää työaikaa niinä päivinä. Tämä laskuri noudattaa lain mukaista listaa virallisista arkipyhistä.",
  },
  {
    q: "Lasketaanko alku- ja loppupäivä mukaan?",
    a: "Kyllä, molemmat syöttämäsi päivämäärät sisältyvät laskentaan.",
  },
  {
    q: "Mistä arkipyhät haetaan?",
    a: "Suomen 13 virallisesta arkipyhästä, mukaan lukien liikkuvat pyhät kuten pääsiäinen, helatorstai, helluntai ja juhannuspäivä. Koko lista löytyy vuoden pyhäpäivät-sivulta.",
  },
  {
    q: "Vähennetäänkö viikonlopulle osuva pyhäpäivä kahdesti?",
    a: "Ei. Lauantait ja sunnuntait lasketaan viikonlopun päiviksi. Arkipyhien sarakkeeseen lasketaan vain maanantaille, tiistaille, keskiviikolle, torstaille tai perjantaille osuvat viralliset pyhäpäivät. Jokainen päivä kuuluu vain yhteen ryhmään.",
  },
  {
    q: "Voinko laskea työpäivät vuodenvaihteen yli?",
    a: "Kyllä. Valitse alkupäivä ja loppupäivä eri vuosilta. Laskuri huomioi jokaisen aikaväliin kuuluvan vuoden pyhäpäivät erikseen. Molemmat rajapäivät sisältyvät tulokseen.",
  },
  {
    q: "Vastaako tulos omaa työvuorolistaani?",
    a: "Tulos perustuu viisipäiväiseen työviikkoon maanantaista perjantaihin. Laskuri ei tunne työvuorojasi, osa-aikatyötäsi, vuosilomaasi eikä työpaikkasi muita vapaita. Vertaa tulosta omaan työvuorolistaasi.",
  },
  {
    q: "Mitä Kelan arkipäivät tarkoittavat?",
    a: "Kelan päivärahojen laskennassa arkipäiviä ovat maanantaista lauantaihin muut päivät kuin pyhäpäivät. Lauantai voi siis olla Kelan arkipäivä, vaikka se ei olisi työpäivä. Valitse laskurista Kelan arkipäivät, kun tarvitset tämän laskutavan.",
  },
  {
    q: "Ovatko jouluaatto ja juhannusaatto Kelan arkipäiviä?",
    a: "Kyllä, jos aatto osuu maanantain ja lauantain välille. Kelan terminologian mukaan aatot, kuten juhannusaatto, ovat arkipäiviä, elleivät ne osu sunnuntaille. Virallinen pyhäpäivä ei ole Kelan arkipäivä.",
  },
  {
    q: "Huomioiko laskuri työehtosopimuksen eli TES:n?",
    a: "Ei. Työehtosopimus tai työsopimus voi määrätä palkallisista vapaista, työvuoroista ja arkipyhien vaikutuksesta eri tavalla. Tarkista oma sopimuksesi ja työnantajasi käytäntö, kun tulosta käytetään palkan tai vapaan suunnitteluun.",
  },
];
