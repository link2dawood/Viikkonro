import { isLeapYear } from "../components/dateUtils.js";

// --- 100 Days to Weeks (100 päivää viikkoina) ---

export function daysToWeeksStats(days = 100) {
  const d = Math.max(0, Math.floor(Number(days) || 0));
  const fullWeeks = Math.floor(d / 7);
  const remainderDays = d % 7;
  const decimalWeeks = (d / 7).toFixed(2);
  const workingDaysEstimate = Math.round((d / 7) * 5);
  const monthsEstimate = (d / 30.4375).toFixed(1);

  return {
    days: d,
    fullWeeks,
    remainderDays,
    decimalWeeks,
    workingDaysEstimate,
    monthsEstimate,
  };
}

export const COMMON_DAY_CONVERSIONS = [7, 14, 21, 30, 45, 60, 90, 100, 120, 180, 200, 365];

// --- Hours in Year (Tuntia vuodessa) ---

export function hoursInYearStats(year = 2026) {
  const leap = isLeapYear(year);
  const days = leap ? 366 : 365;
  const hours = days * 24;
  const minutes = hours * 60;
  const seconds = minutes * 60;

  // Approximate typical Finnish working days in a year is ~252
  const workHours75 = 252 * 7.5;
  const workHours8 = 252 * 8;
  const sleepHours = days * 8;
  const leisureHours = hours - workHours75 - sleepHours;

  return {
    year,
    isLeapYear: leap,
    days,
    hours,
    minutes,
    seconds,
    workHours75,
    workHours8,
    sleepHours,
    leisureHours,
    hoursFormatted: hours.toLocaleString("fi-FI"),
    minutesFormatted: minutes.toLocaleString("fi-FI"),
    secondsFormatted: seconds.toLocaleString("fi-FI"),
  };
}

// --- SEO Metadata Generators ---

export function hundredDaysWeeksMeta() {
  return {
    title: "Kuinka monta viikkoa on 100 päivää? | Viikko Nro",
    description: "100 päivää on tasan 14 viikkoa ja 2 päivää (14,29 viikkoa). Katso muunnin mille tahansa päivämäärälle ja päivien määrälle sekä vertailutaulukko.",
  };
}

export function hoursInYearMeta() {
  return {
    title: "Kuinka monta tuntia vuodessa on? | Viikko Nro",
    description: "Vuodessa on 8 760 tuntia (karkausvuonna 8 784 tuntia). Katso myös minuutit (525 600 min), sekunnit (31,54 milj. s) ja työtuntien osuus vuodesta.",
  };
}

// --- FAQ Generators ---

export function hundredDaysWeeksFaqs() {
  return [
    {
      q: "Kuinka monta viikkoa on 100 päivää?",
      a: "100 päivää on tasan 14 viikkoa ja 2 päivää (desimaalilukuna noin 14,29 viikkoa). Tämä saadaan jakamalla 100 luvulla 7: 100 / 7 = 14 kokonaista viikkoa ja jakojäännökseksi jää 2 päivää.",
    },
    {
      q: "Kuinka monta kuukautta on 100 päivää?",
      a: "100 päivää on hieman yli kolme kuukautta (keskimäärin noin 3,3 kuukautta, kun kuukaudessa on keskimäärin 30,44 päivää).",
    },
    {
      q: "Kuinka monta työpäivää on 100 kalenteripäivässä?",
      a: "100 kalenteripäivässä on tyypillisesti noin 71–72 arkipäivää (ma–pe), sillä 14 viikkoon sisältyy 14 × 5 = 70 työpäivää plus kaksi ylimääräistä päivää riippuen siitä, minä viikonpäivänä jakso alkaa.",
    },
    {
      q: "Miksi 100 päivää on suosittu tavoitejakso?",
      a: "100 päivää vastaa noin yhtä kvartaalia (noin kolmea kuukautta). Sitä käytetään usein koeaikojen, projektien ja kuntohaasteiden aikajänteenä, koska se on tarpeeksi pitkä pysyvien tulosten saavuttamiseen mutta riittävän lyhyt motivaation ylläpitämiseen.",
    },
  ];
}

export function hoursInYearFaqs(year = 2026) {
  const stats = hoursInYearStats(year);
  return [
    {
      q: "Kuinka monta tuntia vuodessa on?",
      a: "Tavallisessa 365-päiväisessä vuodessa on tasan 8 760 tuntia (365 × 24 h). Karkausvuonna (366 päivää) on 8 784 tuntia (366 × 24 h).",
    },
    {
      q: `Kuinka monta tuntia vuonna ${year} on?`,
      a: `Vuonna ${year} on tasan ${stats.hoursFormatted} tuntia, koska kyseessä on ${stats.isLeapYear ? "karkausvuosi" : "tavallinen 365-päiväinen vuosi"}. Minuutteja vuodessa on ${stats.minutesFormatted} ja sekunteja ${stats.secondsFormatted}.`,
    },
    {
      q: "Kuinka monta työtuntia on vuodessa verrattuna kokonaistunteihin?",
      a: "Kokopäivätyössä (7,5 h/päivä) vuosityöaika on noin 1 890 tuntia, mikä on vain noin 21,6 % vuoden kaikista 8 760 tunnista. 8 tunnin työpäivällä vuosityötunteja on noin 2 016 h (n. 23,0 % vuodesta).",
    },
    {
      q: "Kuinka monta tuntia ihminen nukkuu vuodessa?",
      a: "Suositellulla 8 tunnin yöunella ihminen nukkuu vuodessa tasan 2 920 tuntia (365 × 8 h). Se vastaa tasan kolmasosaa (33,3 %) koko vuodesta.",
    },
  ];
}
