import { isoYear, isLeapYear } from "../components/dateUtils.js";

export const MONTH_NAMES_FI = [
  "Tammikuu",
  "Helmikuu",
  "Maaliskuu",
  "Huhtikuu",
  "Toukokuu",
  "Kesäkuu",
  "Heinäkuu",
  "Elokuu",
  "Syyskuu",
  "Lokakuu",
  "Marraskuu",
  "Joulukuu",
];

export function monthDaysCount(monthNumber, year) {
  // monthNumber: 1-12
  if (monthNumber === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(monthNumber)) {
    return 30;
  }
  return 31;
}

export function monthWeekStats(monthNumber, year) {
  const days = monthDaysCount(monthNumber, year);
  const fullWeeks = Math.floor(days / 7);
  const extraDays = days % 7;
  const decimalWeeks = (days / 7).toFixed(2);
  return {
    monthNumber,
    name: MONTH_NAMES_FI[monthNumber - 1],
    days,
    fullWeeks,
    extraDays,
    decimalWeeks,
    summaryText: extraDays === 0 ? "Tasan 4 viikkoa" : `4 viikkoa ja ${extraDays} ${extraDays === 1 ? "päivä" : "päivää"}`,
  };
}

export function allMonthsWeekRows(year) {
  return Array.from({ length: 12 }, (_, i) => monthWeekStats(i + 1, year));
}

export function weeksInMonthMeta(date) {
  const year = isoYear(date);
  return {
    title: "Kuinka monta viikkoa kuukaudessa on? | Viikko Nro",
    description: `Katso, montako viikkoa kuukaudessa on: keskimäärin 4,33 viikkoa (4 viikkoa ja 2-3 päivää). Kuukausien viikot, päivät ja laskuri vuonna ${year}.`,
  };
}

export function weeksInMonthFaqs() {
  return [
    {
      q: "Kuinka monta viikkoa kuukaudessa on keskimäärin?",
      a: "Kuukaudessa on keskimäärin noin 4,33 viikkoa. Tämä saadaan jakamalla vuoden 52 viikkoa 12 kuukaudella (52 / 12 = 4,333).",
    },
    {
      q: "Missä kuukaudessa on tasan 4 viikkoa?",
      a: "Vain helmikuussa tavallisena vuonna on tasan 4 viikkoa (4 × 7 = 28 päivää). Karkausvuonna helmikuussa on 29 päivää eli 4 viikkoa ja 1 päivä.",
    },
    {
      q: "Montako viikkoa on 30 ja 31 päivän kuukausissa?",
      a: "30-päiväisissä kuukausissa (huhti-, kesä-, syys- ja marraskuu) on 4 viikkoa ja 2 päivää (n. 4,29 viikkoa). 31-päiväisissä kuukausissa on 4 viikkoa ja 3 päivää (n. 4,43 viikkoa).",
    },
    {
      q: "Miten kuukausipalkka muunnetaan viikkopalkaksi?",
      a: "Kuukausipalkka muunnetaan viikkopalkaksi jakamalla se luvulla 4,33 (tai kertomalla 12:lla ja jakamalla 52:lla: kuukausipalkka × 12 / 52).",
    },
    {
      q: "Kuinka monta kuukautta on 40 raskausviikkoa?",
      a: "40 raskausviikkoa (280 päivää) vastaa noin 9 kalenterikuukautta ja yhtä viikkoa, koska kalenterikuukaudessa on keskimäärin 4,33 viikkoa (40 / 4,333 ≈ 9,23 kuukautta).",
    },
    {
      q: "Miksi kuukauden viikkonumero voi kuulua osittain kahteen kuukauteen?",
      a: "ISO 8601 -standardin mukaan viikot ovat aina kokonaisia maanantaista sunnuntaihin. Jos kuukausi alkaa esimerkiksi keskiviikkona, kyseinen viikko sisältää sekä edellisen että uuden kuukauden päiviä.",
    },
  ];
}
