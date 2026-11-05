import { isoYear, isLeapYear, M_FULL } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";

// Helper to compute 5-day and 6-day working days for a whole year
export function yearWorkdayStats(year) {
  const officialHolidayDates = new Set(
    holidaysInYear(year)
      .filter((h) => h.official)
      .map((h) => h.date.toDateString()),
  );

  let workingDays5 = 0;
  let workingDays6 = 0; // Kela/annual leave arkipäivät (Mon-Sat minus arkipyhät)
  let weekendDays = 0;
  let weekdayHolidays = 0; // Arkipyhät Mon-Fri
  const totalDays = isLeapYear(year) ? 366 : 365;

  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    const dow = d.getDay(); // 0 = Sun, 6 = Sat
    const isHoliday = officialHolidayDates.has(d.toDateString());

    if (dow !== 0 && !isHoliday) {
      workingDays6 += 1;
    }

    if (dow === 0 || dow === 6) {
      weekendDays += 1;
    } else if (isHoliday) {
      weekdayHolidays += 1;
    } else {
      workingDays5 += 1;
    }

    d.setDate(d.getDate() + 1);
  }

  // Hours based on common Finnish collective agreements (TES)
  const hours75 = Math.round(workingDays5 * 7.5 * 10) / 10;
  const hours80 = workingDays5 * 8;
  const hours76 = Math.round(workingDays5 * 7.6 * 10) / 10; // 38h/week

  return {
    year,
    totalDays,
    workingDays5,
    workingDays6,
    weekendDays,
    weekdayHolidays,
    hours75,
    hours80,
    hours76,
  };
}

// Helper to compute month-by-month working days and hours
export function monthWorkdayStats(month, year) {
  // month: 1-12
  const officialHolidayDates = new Set(
    holidaysInYear(year)
      .filter((h) => h.official)
      .map((h) => h.date.toDateString()),
  );

  let workingDays5 = 0;
  let workingDays6 = 0;
  let weekendDays = 0;
  let weekdayHolidays = 0;

  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const dow = d.getDay();
    const isHoliday = officialHolidayDates.has(d.toDateString());

    if (dow !== 0 && !isHoliday) {
      workingDays6 += 1;
    }

    if (dow === 0 || dow === 6) {
      weekendDays += 1;
    } else if (isHoliday) {
      weekdayHolidays += 1;
    } else {
      workingDays5 += 1;
    }

    d.setDate(d.getDate() + 1);
  }

  const daysInMonth = workingDays5 + weekendDays + weekdayHolidays;
  const hours75 = Math.round(workingDays5 * 7.5 * 10) / 10;
  const hours80 = workingDays5 * 8;

  return {
    month,
    monthName: M_FULL[month - 1],
    year,
    daysInMonth,
    workingDays5,
    workingDays6,
    weekendDays,
    weekdayHolidays,
    hours75,
    hours80,
  };
}

export function allMonthsWorkdayRows(year) {
  return Array.from({ length: 12 }, (_, i) => monthWorkdayStats(i + 1, year));
}

export function yearComparisonWorkdayRows(startYear = 2024, endYear = 2030) {
  const rows = [];
  for (let y = startYear; y <= endYear; y++) {
    rows.push(yearWorkdayStats(y));
  }
  return rows;
}

// --- SEO Metadata Generators ---

export function workdaysInYearMeta(date) {
  const year = isoYear(date);
  const stats = yearWorkdayStats(year);
  return {
    title: `Kuinka monta työpäivää vuodessa on? | Viikko Nro`,
    description: `Katso, montako työpäivää vuodessa on: keskimäärin 251-254 työpäivää. Vuonna ${year} on ${stats.workingDays5} työpäivää. Kuukaudet, arkipyhät ja tunnit.`,
  };
}

export function workdaysInMonthMeta(date) {
  const year = isoYear(date);
  return {
    title: `Kuinka monta työpäivää kuukaudessa on? | Viikko Nro`,
    description: `Katso, montako työpäivää kuukaudessa on: keskimäärin 21 työpäivää (19-23 pv). Tarkista jokaisen kuukauden työpäivät ja arkipyhät vuonna ${year}.`,
  };
}

export function workhoursInYearMeta(date) {
  const year = isoYear(date);
  const stats = yearWorkdayStats(year);
  return {
    title: `Kuinka monta työtuntia vuodessa on? | Viikko Nro`,
    description: `Katso, montako työtuntia vuodessa on: 7,5 h työpäivillä noin 1 890 h ja 8 h päivillä noin 2 020 h. Vuoden ${year} tunnit (${stats.hours75} h) ja TES-vertailu.`,
  };
}

export function workhoursInMonthMeta(date) {
  const year = isoYear(date);
  return {
    title: `Kuinka monta työtuntia kuukaudessa on? | Viikko Nro`,
    description: `Katso, montako työtuntia kuukaudessa on: keskimäärin 158 tuntia (7,5 h/pv) tai 168 tuntia (8 h/pv). Kuukausien työtunnit ja laskuri vuonna ${year}.`,
  };
}

// --- FAQ Generators ---

export function workdaysInYearFaqs(year) {
  const stats = yearWorkdayStats(year);
  return [
    {
      q: "Kuinka monta työpäivää vuodessa on yleensä?",
      a: "Tavallisessa vuodessa 5-päiväistä työviikkoa tekevällä on yleensä 250–254 työpäivää. Määrä vaihtelee sen mukaan, osuvatko arkipyhät viikonlopulle vai arkipäiville.",
    },
    {
      q: `Kuinka monta työpäivää vuonna ${year} on?`,
      a: `Vuonna ${year} on tasan ${stats.workingDays5} työpäivää (maanantai–perjantai ilman arkipyhiä). Lisäksi vuoteen kuuluu ${stats.weekendDays} viikonloppupäivää ja ${stats.weekdayHolidays} arkipyhää.`,
    },
    {
      q: "Miten arkipyhät vaikuttavat vuoden työpäivien määrään?",
      a: "Suomessa on 13 virallista pyhäpäivää. Jos arkipyhä (kuten helatorstai tai pitkäperjantai) osuu maanantain ja perjantain välille, se vähentää työpäiviä. Jos pyhä osuu lauantaille tai sunnuntaille, se ei lyhennä työviikkoa.",
    },
    {
      q: "Mitä eroa on työpäivillä ja Kelan arkipäivillä?",
      a: `Työpäivät lasketaan 5-päiväisen viikon mukaan (ma–pe ilman arkipyhiä). Kelan päivärahoissa ja vuosilomalaissa arkipäiviksi lasketaan myös lauantait (6-päiväinen viikko). Vuonna ${year} on ${stats.workingDays6} Kelan arkipäivää.`,
    },
    {
      q: "Miten työpäivien määrä vaikuttaa kuukausipalkkaan?",
      a: "Kuukausipalkkaiseen työhön työpäivien vaihtelu ei vaikuta: sama kiinteä kuukausipalkka maksetaan riippumatta siitä, onko kuukaudessa 19 vai 23 työpäivää. Tuntipalkkaisilla ansio sen sijaan vaihtelee tehtyjen työpäivien mukaan.",
    },
  ];
}

export function workdaysInMonthFaqs() {
  return [
    {
      q: "Kuinka monta työpäivää kuukaudessa on keskimäärin?",
      a: "Kuukaudessa on keskimäärin tasan 21 työpäivää (252 työpäivää / 12 kk = 21,0 pv). Yksittäisinä kuukausina työpäivien määrä vaihtelee 19 ja 23 päivän välillä.",
    },
    {
      q: "Missä kuukaudessa on vähiten työpäivää?",
      a: "Helmikuussa on lyhyytensä vuoksi usein vähiten työpäiviä (19–20 pv). Myös toukokuussa ja joulukuussa arkipyhät vähentävät työpäivien määrää usein 19–20 päivään.",
    },
    {
      q: "Missä kuukaudessa on eniten työpäivää?",
      a: "Kuukausissa, joissa on 31 päivää eikä yhtään arkipyhää (kuten maalis-, heinä-, elo- ja lokakuussa), voi olla jopa 22–23 työpäivää riippuen viikonloppujen sijoittumisesta.",
    },
    {
      q: "Lasketaanko lauantai työpäiväksi kuukaudessa?",
      a: "Tavallisessa toimistotyössä ja useimmissa työehtosopimuksissa (5-päiväinen viikko) lauantai on vapaapäivä. Vuosilomalain ja Kelan laskennassa lauantai on kuitenkin arkipäivä.",
    },
    {
      q: "Miten kuukauden työpäivät vaikuttavat työajanseurantaan?",
      a: "Työaikasaldo lasketaan kertomalla kuukauden työpäivät päivittäisellä säännöllisellä työajalla (esim. 21 pv × 7,5 h = 157,5 h). Tätä verrataan todellisiin kirjattuihin tunteihin.",
    },
  ];
}

export function workhoursInYearFaqs(year) {
  const stats = yearWorkdayStats(year);
  return [
    {
      q: "Kuinka monta työtuntia vuodessa on keskimäärin?",
      a: "Keskimäärin 5-päiväistä työviikkoa tekevä työskentelee vuodessa noin 1 890 tuntia (7,5 h/päivä) tai noin 2 016 tuntia (8,0 h/päivä).",
    },
    {
      q: `Kuinka monta työtuntia vuonna ${year} on?`,
      a: `Vuonna ${year} on ${stats.workingDays5} työpäivää, mikä vastaa 7,5 tunnin päivittäisellä työajalla ${stats.hours75.toLocaleString("fi-FI")} tuntia ja 8 tunnin päivittäisellä työajalla ${stats.hours80.toLocaleString("fi-FI")} tuntia.`,
    },
    {
      q: "Mikä on normaali vuosityöaika eri TES-sopimuksissa?",
      a: "Toimistotyössä normaali työaika on usein 7,5 h/pv (37,5 h/vko, n. 1 890 h/vuosi). Kuntasektorilla ja teollisuudessa käytetään usein 7,63–8 h/pv (38,25–40 h/vko, n. 1 920–2 020 h/vuosi).",
    },
    {
      q: "Miten vuosiloma vaikuttaa todellisiin tehtyihin työtunteihin?",
      a: "Täysi 4–5 viikon vuosiloma (20–25 työpäivää) vähentää tehtyjä työtunteja noin 150–187,5 tunnilla, jolloin todellinen vuosityöaika on noin 1 700–1 740 tuntia.",
    },
    {
      q: "Miten arkipyhäkorvaus vaikuttaa työtunteihin?",
      a: "Työehtosopimuksesta riippuen arkipyhiltä maksetaan usein palkka säännöllisen työajan mukaan, vaikka työtä ei tehdä, tai arkipyhä lyhentää kyseisen viikon säännöllistä työaikaa.",
    },
  ];
}

export function workhoursInMonthFaqs() {
  return [
    {
      q: "Kuinka monta työtuntia kuukaudessa on keskimäärin?",
      a: "Kuukaudessa on keskimäärin noin 157,5 työtuntia (7,5 h/pv × 21 pv) tai noin 168 työtuntia (8 h/pv × 21 pv).",
    },
    {
      q: "Mikä on kuukausituntien vaihteluväli eri kuukausina?",
      a: "7,5 tunnin työajalla kuukausitunnit vaihtelevat tyypillisesti 142,5 tunnin (19 työpäivää) ja 172,5 tunnin (23 työpäivää) välillä.",
    },
    {
      q: "Miten kuukausipalkka muunnetaan tuntipalkaksi?",
      a: "Yleisimmin käytetty virallinen jakaja kuukausipalkan muuntamiseksi tuntipalkaksi on työehtosopimuksesta riippuen 157, 158 tai 160 (esim. 3 000 € / 158 ≈ 18,99 €/tunti).",
    },
    {
      q: "Miten osa-aikatyön kuukausitunnit lasketaan?",
      a: "Osa-aikatyön tunnit saadaan kertomalla kuukauden työpäivät sovitulla päivittäisellä tuntimäärällä (esim. 21 pv × 6 h = 126 tuntia).",
    },
  ];
}
