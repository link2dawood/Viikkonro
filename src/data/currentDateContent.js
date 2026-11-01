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

export const weekdayFaqs = [
  { q: "Miten selvitän, mikä viikonpäivä jokin päivämäärä oli?", a: "Syötä päivämäärä viikonpäivälaskuriin. Tulos näyttää viikonpäivän sekä saman päivän ISO-viikon ja viikkovuoden." },
  { q: "Voiko laskurilla tarkistaa tulevan päivämäärän?", a: "Kyllä. Laskuri toimii sekä menneille että tuleville kalenteripäiville." },
  { q: "Miksi tuloksessa näkyy myös viikkovuosi?", a: "ISO-viikkovuosi voi vuodenvaihteessa erota kalenterivuodesta. Esimerkiksi tammikuun ensimmäinen päivä voi kuulua edellisen vuoden viimeiseen ISO-viikkoon." },
  { q: "Säilyykö valittu päivämäärä linkissä?", a: "Kyllä. Valinta tallentuu osoitteen paiva-parametriin, joten tuloksen voi jakaa toiselle käyttäjälle." },
  { q: "Mistä viikonpäivien nimet tulevat?", a: "Laskuri käyttää gregoriaanista kalenteria ja näyttää viikonpäivän suomeksi." },
];
