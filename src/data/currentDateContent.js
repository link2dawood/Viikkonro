import {
  M_FULL,
  WD,
  dateFromDayKey,
  dayOfYear,
  daysInYear,
  fmtFullFi,
  fmtShortFi,
  helsinkiDayKey,
  isLeapYear,
  isoWeek,
  isoYear,
  quarterOf,
  weeksInIsoYear,
} from "../components/dateUtils.js";

export function currentMonthFacts(now = dateFromDayKey(helsinkiDayKey())) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    year,
    month,
    name: M_FULL[month - 1],
    nameLower: M_FULL[month - 1].toLowerCase(),
    days: new Date(year, month, 0).getDate(),
    currentWeek: isoWeek(date),
    currentWeekYear: isoYear(date),
    previous:
      month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year },
    next:
      month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year },
  };
}

export function currentYearFacts(now = dateFromDayKey(helsinkiDayKey())) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = date.getFullYear();
  const totalDays = daysInYear(year);
  const elapsed = dayOfYear(date);
  return {
    year,
    leap: isLeapYear(year),
    days: totalDays,
    weeks: weeksInIsoYear(year),
    quarter: quarterOf(date),
    dayOfYear: elapsed,
    daysRemaining: totalDays - elapsed,
    progress: Math.round((elapsed / totalDays) * 100),
    currentWeek: isoWeek(date),
    currentWeekYear: isoYear(date),
  };
}

export function parseIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function weekdayResult(value) {
  const date = parseIsoDate(value);
  if (!date) return null;
  return {
    date,
    input: value,
    weekday: WD[date.getDay()],
    weekdayLower: WD[date.getDay()].toLowerCase(),
    written: fmtFullFi(date),
    short: fmtShortFi(date),
    week: isoWeek(date),
    weekYear: isoYear(date),
  };
}

export function currentMonthMeta(now = dateFromDayKey(helsinkiDayKey())) {
  const fact = currentMonthFacts(now);
  return {
    title: `Mikä kuukausi nyt on? ${fact.name} (${fact.month}/${fact.year}) | Viikko Nro`,
    description: `Nyt on ${fact.nameLower} ${fact.year}, vuoden ${fact.month}. kuukausi. Kuukaudessa on ${fact.days} päivää. Katso kuluva viikko, ${fact.nameLower}n viikkonumerot sekä viereisten kuukausien kalenterit.`,
  };
}

export function currentYearMeta(now = dateFromDayKey(helsinkiDayKey())) {
  const fact = currentYearFacts(now);
  return {
    title: `Mikä vuosi nyt on? ${fact.year} - vuoden tiedot | Viikko Nro`,
    description: `Nyt on vuosi ${fact.year}. Vuodessa on ${fact.days} päivää ja ${fact.weeks} ISO-viikkoa. Katso vuoden kuluminen, nykyinen neljännes sekä kaikki viikkonumerot ja kalenterikuukaudet.`,
  };
}

export const weekdayMeta = {
  title: "Mikä viikonpäivä oli? Viikonpäivälaskuri | Viikko Nro",
  description:
    "Selvitä, mikä viikonpäivä jokin päivämäärä oli tai tulee olemaan. Syötä päivä ja näe viikonpäivä, viikkonumero, viikkovuosi sekä suomalainen päivämäärä.",
};

export function currentMonthFaqs(now = dateFromDayKey(helsinkiDayKey())) {
  const fact = currentMonthFacts(now);
  return [
    { q: "Mikä kuukausi nyt on?", a: `Nyt on ${fact.nameLower} ${fact.year}.` },
    { q: "Monesko kuukausi nyt on?", a: `${fact.name} on vuoden ${fact.month}. kuukausi.` },
    { q: `Kuinka monta päivää ${fact.nameLower}ssa on?`, a: `${fact.name}ssa ${fact.year} on ${fact.days} päivää.` },
    { q: "Mikä viikko nyt on?", a: `Nyt on ISO-viikko ${fact.currentWeek} vuonna ${fact.currentWeekYear}.` },
    { q: "Mistä näen kuukauden kaikki viikkonumerot?", a: `Sivulta ${fact.nameLower}n viikot ${fact.year} näet kuukauden päivämäärät ja ISO-viikkonumerot.` },
  ];
}

export function currentYearFaqs(now = dateFromDayKey(helsinkiDayKey())) {
  const fact = currentYearFacts(now);
  return [
    { q: "Mikä vuosi nyt on?", a: `Nyt on vuosi ${fact.year}.` },
    { q: `Onko ${fact.year} karkausvuosi?`, a: fact.leap ? `Kyllä, ${fact.year} on karkausvuosi.` : `Ei, ${fact.year} ei ole karkausvuosi.` },
    { q: `Kuinka monta päivää vuodessa ${fact.year} on?`, a: `Vuodessa ${fact.year} on ${fact.days} päivää.` },
    { q: `Kuinka monta viikkoa vuodessa ${fact.year} on?`, a: `Vuodessa ${fact.year} on ${fact.weeks} ISO-viikkoa.` },
    { q: "Mikä vuosineljännes nyt on?", a: `Nyt on vuoden ${fact.quarter}. neljännes.` },
  ];
}

export const WEEKDAY_VERIFIED_DATE = "11.11.2026";

export const VERIFIED_CALCULATION_EXAMPLES = [
  {
    dateStr: "1.1.2026",
    titleFi: "1. tammikuuta 2026",
    titleEn: "1 January 2026",
    isoDate: "2026-01-01",
    weekdayFi: "Torstai",
    weekdayEn: "Thursday",
    isoWeekStr: "ISO-viikko 1 / 2026",
    isoWeekEn: "ISO week 1 / 2026",
    badge: "Uusi vuosi",
    description:
      "Koska vuoden 2026 ensimmäinen päivä on torstai, se aloittaa virallisen ISO-viikon 1. ISO 8601 -säännön mukaan vuoden ensimmäinen viikko on aina se, johon kuuluu uuden vuoden ensimmäinen torstai.",
  },
  {
    dateStr: "1.1.2027",
    titleFi: "1. tammikuuta 2027",
    titleEn: "1 January 2027",
    isoDate: "2027-01-01",
    weekdayFi: "Perjantai",
    weekdayEn: "Friday",
    isoWeekStr: "ISO-viikko 53 / 2026",
    isoWeekEn: "ISO week 53 / 2026",
    badge: "ISO-viikkovuoden ero",
    description:
      "Havainnollinen esimerkki viikkovuoden poikkeamasta: 1.1.2027 on perjantai, ja kyseisen viikon torstai (31.12.) sijoittui vuodelle 2026. Standardin mukaan päivä kuuluu vielä edellisen vuoden viikkoon 53/2026 eikä uuden vuoden viikkoon 1.",
  },
  {
    dateStr: "29.2.2024",
    titleFi: "29. helmikuuta 2024",
    titleEn: "29 February 2024",
    isoDate: "2024-02-29",
    weekdayFi: "Torstai",
    weekdayEn: "Thursday",
    isoWeekStr: "ISO-viikko 9 / 2024",
    isoWeekEn: "Leap-year example",
    badge: "Karkausvuosi (Leap year)",
    description:
      "Karkausvuosiesimerkki. Koska 2024 oli neljällä jaollinen karkausvuosi, helmikuussa oli 29 päivää. Laskuri laskee karkauspäivän oikein torstaiksi, mutta hylkää virheelliset karkauspäivät tavallisina vuosina (kuten 29.2.2025).",
  },
  {
    dateStr: "31.12.2029",
    titleFi: "31. joulukuuta 2029",
    titleEn: "31 December 2029",
    isoDate: "2029-12-31",
    weekdayFi: "Maanantai",
    weekdayEn: "Monday",
    isoWeekStr: "ISO-viikko 1 / 2030",
    isoWeekEn: "ISO week 1 / 2030",
    badge: "Seuraavan vuoden viikko 1",
    description:
      "Kalenterivuoden 2029 viimeinen päivä on maanantai. Koska viikon torstai on 3.1.2030, tämä maanantai kuuluu jo seuraavan kalenterivuoden ensimmäiseen ISO-viikkoon 1/2030.",
  },
];

export const weekdayFaqs = [
  {
    q: "Miten viikonpäivä lasketaan?",
    a: "Viikonpäivä lasketaan gregoriaanisen kalenterin matemaattisella algoritmilla. Laskenta perustuu siihen, että tavallisessa vuodessa on 365 päivää eli 52 täyttä seitsemän päivän viikkoa ja yksi ylimääräinen päivä, ja karkausvuosina kaksi ylimääräistä päivää.",
  },
  {
    q: "Miksi viikonpäivä vaihtuu joka vuosi?",
    a: "Koska kalenterivuodessa on 365 päivää (52 viikkoa ja 1 päivä), tietty päivämäärä siirtyy seuraavana vuonna aina yhdellä viikonpäivällä eteenpäin. Karkausvuosina, jolloin vuodessa on 366 päivää, päivät siirtyvät karkauspäivän (29.2.) jälkeen kaksi viikonpäivää eteenpäin.",
  },
  {
    q: "Miten karkausvuosi vaikuttaa viikonpäiviin?",
    a: "Karkausvuosi lisää kalenteriin ylimääräisen päivän, 29. helmikuuta. Tämä siirtää kaikkia maaliskuusta joulukuuhun sijoittuvia päivämääriä kahdella viikonpäivällä eteenpäin suhteessa edelliseen vuoteen.",
  },
  {
    q: "Miksi 1. tammikuuta voi kuulua edellisen vuoden viikkoon?",
    a: "Kansainvälisen ISO 8601 -standardin mukaan viikon vuosi määräytyy sen torstain perusteella. Jos tammikuun 1. päivä osuu perjantaille, lauantaille tai sunnuntaille, kyseisen viikon torstai on sijoittunut vielä edellisen vuoden puolelle. Tällöin viikko katsotaan edellisen vuoden viimeiseksi ISO-viikoksi (viikko 52 tai 53).",
  },
  {
    q: "Miten voin tarkistaa historiallisen päivämäärän?",
    a: "Voit syöttää laskuriin minkä tahansa historiallisen päivämäärän. Laskuri käyttää proleptista gregoriaanista kalenteria. Suomessa ja Ruotsissa siirryttiin vanhasta juliaanisesta kalenterista gregoriaaniseen vuonna 1753 (17.2. seurasi suoraan 1.3.1753).",
  },
  {
    q: "Onko viikonpäivälaskuri aina tarkka?",
    a: "Kyllä. Laskuri suorittaa täysin deterministisen matemaattisen kalenterilaskennan suoraan selaimessa ilman arviointeja. Toiminta on varmistettu laajalla yli 1 300 automaattisen testin kokonaisuudella.",
  },
  {
    q: "Mitä kalenterijärjestelmää Suomessa käytetään?",
    a: "Suomessa virallinen kalenterijärjestelmä on gregoriaaninen kalenteri, ja viikkonumerointi noudattaa kansainvälistä ISO 8601 -standardia (SFS-EN 28601). Standardin mukaan viikko alkaa aina maanantaina.",
  },
  {
    q: "Miten selvitän, mikä viikonpäivä jokin päivämäärä oli?",
    a: "Syötä päivämäärä viikonpäivälaskuriin. Tulos näyttää viikonpäivän sekä saman päivän ISO-viikon ja viikkovuoden.",
  },
  {
    q: "Voiko laskurilla tarkistaa tulevan päivämäärän?",
    a: "Kyllä. Laskuri toimii sekä menneille että tuleville kalenteripäiville samalla täsmällisellä logiikalla.",
  },
  {
    q: "Säilyykö valittu päivämäärä linkissä?",
    a: "Kyllä. Valinta tallentuu osoitteen paiva-parametriin, joten tuloksen voi jakaa suoraan toiselle käyttäjälle.",
  },
];
