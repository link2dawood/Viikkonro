import {
  isoWeek,
  isoYear,
  mondayOf,
  weeksInIsoYear,
} from "../components/dateUtils.js";

export const PARITY_UPDATED = "2026-10-05";
export const PARITY_PATH = "/parillinen-pariton-viikko";

export const weekParity = (week) => week % 2 === 0 ? "parillinen" : "pariton";

export function currentWeekParity(date) {
  const week = isoWeek(date);
  const year = isoYear(date);
  const nextMonday = mondayOf(week, year);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextWeek = isoWeek(nextMonday);
  return {
    week, year, parity: weekParity(week),
    nextWeek, nextYear: isoYear(nextMonday), nextParity: weekParity(nextWeek),
  };
}

export function parityWeeks(year) {
  const weeks = Array.from({ length: weeksInIsoYear(year) }, (_, index) => index + 1);
  return {
    year,
    even: weeks.filter((week) => week % 2 === 0),
    odd: weeks.filter((week) => week % 2 !== 0),
  };
}

export function parityMeta(date) {
  const fact = currentWeekParity(date);
  const parityLabel = fact.parity[0].toUpperCase() + fact.parity.slice(1);
  return {
    title: `Parillinen vai pariton viikko ${fact.week}? ${parityLabel} | Viikko Nro`,
    description: `Nyt on ${fact.parity} viikko ${fact.week}/${fact.year}. Katso parilliset ja parittomat viikot, vuoroviikot sekä vuodenvaihteen viikkojen 53 ja 1 tärkeä käytännön poikkeus.`,
  };
}

export function parityPageFaqs(date) {
  const fact = currentWeekParity(date);
  const currentYear = parityWeeks(fact.year);
  return [
    {
      q: "Onko nyt parillinen vai pariton viikko?",
      a: `Nyt on ${fact.parity} viikko: viikko ${fact.week}/${fact.year}. Ensi viikko on ${fact.nextParity} viikko ${fact.nextWeek}/${fact.nextYear}.`,
    },
    {
      q: "Miten tiedän, onko viikko parillinen vai pariton?",
      a: "Parillisen viikon numero on jaollinen kahdella, kuten 2, 4 tai 42. Parittoman viikon numero ei ole jaollinen kahdella, kuten 1, 3 tai 41.",
    },
    {
      q: "Vaihtuuko parillinen ja pariton viikko aina vuorotellen?",
      a: "Tavallisesti kyllä. Poikkeus on 53 viikon vuoden vaihde: viikko 53 ja seuraavan vuoden viikko 1 ovat molemmat parittomia.",
    },
    {
      q: "Mihin parillisia ja parittomia viikkoja käytetään?",
      a: "Niitä käytetään esimerkiksi vuoroviikkoasumisessa, työvuoroissa, harrastusryhmissä, tapaamisissa ja muissa joka toinen viikko toistuvissa aikatauluissa.",
    },
    {
      q: `Montako parillista ja paritonta viikkoa vuonna ${fact.year} on?`,
      a: `Vuonna ${fact.year} on ${currentYear.even.length} parillista ja ${currentYear.odd.length} paritonta ISO-viikkoa.`,
    },
    {
      q: "Perustuuko viikkojen parillisuus ISO 8601 -viikkonumeroon?",
      a: "Kyllä. Suomessa viikkonumero lasketaan ISO 8601 -standardin mukaan. Parillisuus määräytyy tämän viikkonumeron perusteella.",
    },
  ];
}

export const parityFaq = {
  featured: true,
  q: "Mistä tiedän, onko viikko parillinen vai pariton?",
  a: "Parillisen viikon numero on jaollinen kahdella, kuten 2, 4 tai 42. Parittoman viikon numero on esimerkiksi 1, 3 tai 41. Parillisuutta käytetään esimerkiksi vuoroviikoissa ja joka toinen viikko toistuvissa työvuoroissa. Etusivu näyttää kuluvan ja seuraavan viikon tiedot. Vuodenvaihteessa viikot 53 ja 1 ovat molemmat parittomia, joten parillisuus ei aina vaihdu seuraavalla viikolla.",
};
