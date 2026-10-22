import {
  isLeapYear,
  isoYear,
  mondayOf,
  WD_ESSIVE,
  weeksInIsoYear,
  WD,
} from "../components/dateUtils.js";

export function yearWeekFact(year) {
  const weeks = weeksInIsoYear(year);
  const startsOn = WD[new Date(year, 0, 1).getDay()];
  return {
    year,
    weeks,
    startsOn,
    leap: isLeapYear(year),
    reason:
      weeks === 53
        ? isLeapYear(year) && startsOn === "Keskiviikko"
          ? "Karkausvuosi alkaa keskiviikkona"
          : "Vuosi alkaa torstaina"
        : "ISO-viikkovuodessa on 52 viikkoa",
  };
}

export function yearWeekRows(startYear, endYear) {
  return Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => yearWeekFact(startYear + index),
  );
}

// The visible "how many weeks does {year} have" answer, computed so the
// 52-week wording takes over on its own in January. Kept here rather than in
// the page so both branches are testable: 2026 has 53 weeks, 2027 has 52, and
// only one of them is ever on screen.
export function currentYearWeekSummary(year) {
  const fact = yearWeekFact(year);
  const startsOnEssive = WD_ESSIVE[new Date(year, 0, 1).getDay()];
  const lastWeekMonday = mondayOf(fact.weeks, year);
  const lastWeekSunday = new Date(
    lastWeekMonday.getFullYear(),
    lastWeekMonday.getMonth(),
    lastWeekMonday.getDate() + 6,
  );
  // Both routes to 53 weeks, so a leap year starting Wednesday is not
  // described as though any Wednesday start were enough.
  const cause =
    fact.weeks === 53
      ? `${
          fact.leap && fact.startsOn === "Keskiviikko"
            ? `Vuosi on karkausvuosi ja alkaa ${startsOnEssive}`
            : `Vuosi alkaa ${startsOnEssive}`
        }, joten vuoden loppuun mahtuu kokonainen viikko 53.`
      : `Vuosi alkaa ${startsOnEssive}, joten viikkoja on 52.`;
  return { year, weeks: fact.weeks, cause, lastWeekMonday, lastWeekSunday };
}

// Build-time-fresh metadata for /kuinka-monta-viikkoa-vuodessa. The current
// year's week count has to be computed: this page's own top query asks how
// many weeks "a year" has, and a hardcoded answer silently goes stale on
// 1 January (2026 has 53 weeks, 2027 has 52). Resolved again in metaFor().
export function weeksInYearMeta(date) {
  const year = isoYear(date);
  const weeks = weeksInIsoYear(year);
  return {
    title: "Kuinka monta viikkoa vuodessa on? 52 vai 53 | Viikko Nro",
    description: `Katso, montako viikkoa vuodessa on: tavallisesti 52, joskus 53. Vuonna ${year} on ${weeks} viikkoa. Lue ISO 8601 -sääntö ja tarkista 53 viikon vuodet.`,
  };
}

export function weeksInYearFaqs(currentYear) {
  const currentWeeks = weeksInIsoYear(currentYear);
  return [
    {
      q: "Kuinka monta viikkoa vuodessa on yhdellä lauseella?",
      a: "Vuodessa on ISO 8601 -viikkonumeroinnin mukaan 52 tai 53 viikkoa; useimmissa vuosissa on 52 viikkoa.",
    },
    {
      q: `Kuinka monta viikkoa vuonna ${currentYear} on?`,
      a: `Vuonna ${currentYear} on ${currentWeeks} ISO-viikkoa.`,
    },
    {
      q: "Milloin vuodessa on 53 viikkoa?",
      a: "Vuodessa on 53 ISO-viikkoa, kun vuosi alkaa torstaina tai kun keskiviikkona alkava vuosi on karkausvuosi.",
    },
    {
      q: "Miksi vuodessa ei ole tasan 52 viikkoa?",
      a: "Tavallisessa vuodessa on 365 päivää eli 52 täyttä viikkoa ja yksi päivä. Karkausvuodessa on 366 päivää eli 52 viikkoa ja kaksi päivää.",
    },
    {
      q: "Voiko vuodessa olla 54 viikkoa?",
      a: "Ei. ISO 8601 -järjestelmässä viikkovuodessa on aina joko 52 tai 53 viikkoa.",
    },
    {
      q: "Miksi tammikuun ensimmäiset päivät voivat kuulua edelliseen viikkovuoteen?",
      a: "ISO-viikko kuuluu sille vuodelle, jonka puolella viikon torstai on. Siksi tammikuun alku voi kuulua edellisen vuoden viikkoon 52 tai 53.",
    },
    {
      q: "Miten tarkistan tietyn vuoden viikkojen määrän?",
      a: "Avaa kyseisen vuoden viikkonumerosivu. Sivulla näkyvät kaikki vuoden ISO-viikot päivämäärineen sekä tieto siitä, onko viimeinen viikko 52 vai 53.",
    },
  ];
}
