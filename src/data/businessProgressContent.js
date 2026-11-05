import {
  isoWeek,
  isoYear,
  weeksInIsoYear,
  isLeapYear,
} from "../components/dateUtils.js";

// --- Quarter Weeks (Viikkoja kvartaalissa) ---

export function quarterWeekStats(year = 2026) {
  const leap = isLeapYear(year);
  const totalWeeks = weeksInIsoYear(year);

  const q1Days = leap ? 91 : 90;
  const q2Days = 91;
  const q3Days = 92;
  const q4Days = 92;

  return [
    {
      quarter: "Q1",
      name: "1. kvartaali (tammi–maaliskuu)",
      months: "Tammikuu, helmikuu, maaliskuu",
      days: q1Days,
      weeksIso: 13,
      weekRange: "Viikot 1–13",
      decimalWeeks: (q1Days / 7).toFixed(2),
    },
    {
      quarter: "Q2",
      name: "2. kvartaali (huhti–kesäkuu)",
      months: "Huhtikuu, toukokuu, kesäkuu",
      days: q2Days,
      weeksIso: 13,
      weekRange: "Viikot 14–26",
      decimalWeeks: (q2Days / 7).toFixed(2),
    },
    {
      quarter: "Q3",
      name: "3. kvartaali (heinä–syyskuu)",
      months: "Heinäkuu, elokuu, syyskuu",
      days: q3Days,
      weeksIso: 13,
      weekRange: "Viikot 27–39",
      decimalWeeks: (q3Days / 7).toFixed(2),
    },
    {
      quarter: "Q4",
      name: "4. kvartaali (loka–joulukuu)",
      months: "Lokakuu, marraskuu, joulukuu",
      days: q4Days,
      weeksIso: totalWeeks === 53 ? 14 : 13,
      weekRange: totalWeeks === 53 ? "Viikot 40–53" : "Viikot 40–52",
      decimalWeeks: (q4Days / 7).toFixed(2),
    },
  ];
}

// --- Weeks Remaining in Year (Viikkoja vuodesta jäljellä) ---

export function yearWeeksRemainingStats(today = new Date()) {
  const year = isoYear(today);
  const currentWk = isoWeek(today);
  const totalWks = weeksInIsoYear(year);
  const weeksRemaining = Math.max(0, totalWks - currentWk);

  // End of year
  const endOfYear = new Date(year, 11, 31);
  const msDiff = Math.max(0, endOfYear.getTime() - today.getTime());
  const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

  const totalDays = isLeapYear(year) ? 366 : 365;
  const startOfYear = new Date(year, 0, 1);
  const daysPassed = Math.max(1, Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const percentElapsed = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100)).toFixed(1);

  return {
    year,
    currentWeek: currentWk,
    totalWeeks: totalWks,
    weeksRemaining,
    daysRemaining,
    percentElapsed,
    percentRemaining: (100 - Number(percentElapsed)).toFixed(1),
  };
}

// --- Weekends in Year (Viikonloppuja vuodessa) ---

export function yearWeekendStats(year) {
  let saturdays = 0;
  let sundays = 0;

  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    const dow = d.getDay();
    if (dow === 6) saturdays += 1;
    if (dow === 0) sundays += 1;
    d.setDate(d.getDate() + 1);
  }

  const fullWeekends = Math.min(saturdays, sundays);
  const totalWeekendDays = saturdays + sundays;

  return {
    year,
    saturdays,
    sundays,
    fullWeekends,
    totalWeekendDays,
    extraWeekendDay: totalWeekendDays > 104 ? (saturdays > sundays ? "lauantai" : "sunnuntai") : null,
  };
}

// --- SEO Metadata Generators ---

export function weeksInQuarterMeta() {
  return {
    title: "Kuinka monta viikkoa kvartaalissa on? | Viikko Nro",
    description: "Katso, montako viikkoa kvartaalissa on: keskimäärin tasan 13 viikkoa (n. 91 päivää). Q1, Q2, Q3 ja Q4 viikkonumerot ja taloushallinnon 4-4-5-malli.",
  };
}

export function weeksRemainingMeta(date) {
  const stats = yearWeeksRemainingStats(date);
  return {
    title: "Kuinka monta viikkoa vuodesta on jäljellä? | Viikko Nro",
    description: `Katso, montako viikkoa vuodesta ${stats.year} on jäljellä: nyt on viikko ${stats.currentWeek}, jäljellä on ${stats.weeksRemaining} viikkoa ja ${stats.daysRemaining} päivää. Reaaliaikainen laskuri.`,
  };
}

export function weekendsInYearMeta(date) {
  const year = isoYear(date);
  const stats = yearWeekendStats(year);
  return {
    title: "Kuinka monta viikonloppua vuodessa on? | Viikko Nro",
    description: `Katso, montako viikonloppua vuodessa on: 52 täyttä viikonloppua (104-106 viikonloppupäivää). Vuonna ${year} on ${stats.saturdays} lauantaita ja ${stats.sundays} sunnuntaita.`,
  };
}

// --- FAQ Generators ---

export function weeksInQuarterFaqs() {
  return [
    {
      q: "Kuinka monta viikkoa kvartaalissa on?",
      a: "Kvartaalissa (vuosineljänneksessä) on keskimäärin tasan 13 viikkoa. Tämä saadaan jakamalla vuoden 52 viikkoa neljällä (52 / 4 = 13 viikkoa).",
    },
    {
      q: "Kuinka monta päivää kvartaalissa on?",
      a: "Kvartaalin pituus vaihtelee 90 ja 92 päivän välillä: Q1:ssä on 90 päivää (karkausvuonna 91 pv), Q2:ssa 91 päivää, ja Q3:ssa sekä Q4:ssä 92 päivää.",
    },
    {
      q: "Mitkä viikkonumerot kuuluvat mihinkin kvartaaliin?",
      a: "Tavallisessa vuodessa Q1 kattaa viikot 1–13, Q2 viikot 14–26, Q3 viikot 27–39 ja Q4 viikot 40–52. 53 viikon vuonna Q4 sisältää myös viikon 53.",
    },
    {
      q: "Mikä on taloushallinnon 4-4-5-viikkomalli?",
      a: "4-4-5-kalenteri on yritystaloudessa käytetty malli, jossa jokainen kvartaali jaetaan kahteen 4 viikon kuukauteen ja yhteen 5 viikon kuukauteen (4+4+5 = 13 viikkoa = 91 päivää). Näin kaikki kvartaalit ovat täysin vertailukelpoisia.",
    },
  ];
}

export function weeksRemainingFaqs(today = new Date()) {
  const stats = yearWeeksRemainingStats(today);
  return [
    {
      q: `Kuinka monta viikkoa vuodesta ${stats.year} on jäljellä?`,
      a: `Vuodesta ${stats.year} on jäljellä tällä hetkellä ${stats.weeksRemaining} viikkoa. Nyt on meneillään viikko ${stats.currentWeek} vuoden kaikkiaan ${stats.totalWeeks} viikosta.`,
    },
    {
      q: `Kuinka monta päivää vuodesta ${stats.year} on jäljellä?`,
      a: `Vuodesta ${stats.year} on jäljellä ${stats.daysRemaining} kalenteripäivää. Vuodesta on kulunut ${stats.percentElapsed} % ja jäljellä on ${stats.percentRemaining} %.`,
    },
    {
      q: "Miten viikkojen määrä vuodenvaihteessa lasketaan?",
      a: "ISO 8601 -standardin mukaan viikot ovat aina kokonaisia maanantaista sunnuntaihin. Jos vuoden viimeiset päivät kuuluvat uuden vuoden ensimmäiseen viikkoon (viikkoon 1), viikko katsotaan jo alkaneen seuraavan vuoden osaksi.",
    },
  ];
}

export function weekendsInYearFaqs(year = 2026) {
  const stats = yearWeekendStats(year);
  return [
    {
      q: "Kuinka monta viikonloppua vuodessa on?",
      a: "Vuodessa on aina vähintään 52 täyttä viikonloppua (52 lauantaita ja 52 sunnuntaita). Yhteensä viikonloppupäiviä on 104, 105 tai 106.",
    },
    {
      q: `Kuinka monta viikonloppupäivää vuonna ${year} on?`,
      a: `Vuonna ${year} on tasan ${stats.totalWeekendDays} viikonloppupäivää: ${stats.saturdays} lauantaita ja ${stats.sundays} sunnuntaita. Täysiä viikonloppuja on ${stats.fullWeekends}.`,
    },
    {
      q: "Miksi joissakin vuosissa on 105 tai 106 viikonloppupäivää?",
      a: "Tavallisessa vuodessa on 365 päivää eli 52 viikkoa ja yksi ylimääräinen päivä. Jos vuosi alkaa lauantailla tai sunnuntailla, kyseistä viikonloppupäivää on vuodessa 53 (105 pv). Karkausvuonna ylimääräisiä päiviä on kaksi, jolloin viikonloppupäiviä voi olla jopa 106.",
    },
    {
      q: "Kuinka monta arkipäivää jää viikonloppujen jälkeen?",
      a: "Kun 365 päivästä vähennetään 104 viikonloppupäivää, arkipäiviä (ma–pe) on 260 tai 261. Tästä luvusta vähennetään vielä viralliset arkipyhät todellisten työpäivien saamiseksi.",
    },
  ];
}
