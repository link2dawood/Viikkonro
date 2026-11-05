import {
  isLeapYear,
  isoYear,
  weeksInIsoYear,
  WD,
} from "../components/dateUtils.js";

export function fiftyThreeWeekYears(startYear = 1980, endYear = 2060) {
  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    if (weeksInIsoYear(y) === 53) {
      const startsOn = WD[new Date(y, 0, 1).getDay()];
      const leap = isLeapYear(y);
      years.push({
        year: y,
        startsOn,
        leap,
        reason: leap && startsOn === "Keskiviikko"
          ? "Karkausvuosi alkaa keskiviikkona"
          : "Vuosi alkaa torstaina",
      });
    }
  }
  return years;
}

export function fiftyThreeWeeksMeta(date) {
  const year = isoYear(date);
  return {
    title: "Miksi vuodessa on 53 viikkoa? Selitys ja vuodet | Viikko Nro",
    description: `Katso, miksi vuodessa on 53 ISO-viikkoa 52 sijaan. Lue torstaisääntö, tarkista kaikki 53 viikon vuodet ja katso vuoden ${year} viikkomäärä.`,
  };
}

export function fiftyThreeWeeksFaqs(currentYear) {
  const currentWeeks = weeksInIsoYear(currentYear);
  return [
    {
      q: "Miksi vuodessa on 53 viikkoa?",
      a: "Vuodessa on 53 viikkoa, koska tavallisessa vuodessa on 365 päivää eli 52 viikkoa ja yksi ylimääräinen päivä (karkausvuonna kaksi). Kun vuosi alkaa torstaina tai kun keskiviikkona alkava vuosi on karkausvuosi, vuoden loppuun mahtuu kokonainen 53. viikko.",
    },
    {
      q: "Mikä on ISO 8601 -torstaisääntö?",
      a: "Kansainvälisessä ISO 8601 -standardissa viikkovuoden ensimmäinen viikko (viikko 1) on se, johon kuuluu vuoden ensimmäinen torstai. Toisin sanoen viikon 1 on sisällettävä vähintään neljä uuden vuoden päivää.",
    },
    {
      q: `Onko vuosi ${currentYear} 53 viikon vuosi?`,
      a: `Vuonna ${currentYear} on ${currentWeeks} viikkoa.${currentWeeks === 53 ? " Kyllä, kyseessä on 53 viikon vuosi." : " Ei, vuodessa on tavanomaiset 52 viikkoa."}`,
    },
    {
      q: "Kuinka usein vuodessa on 53 viikkoa?",
      a: "53 viikon vuosi toistuu keskimäärin joka 5.–6. vuosi. 400 vuoden gregoriaanisessa syklissä on tasan 71 vuotta, joissa on 53 viikkoa.",
    },
    {
      q: "Mitkä ovat seuraavat 53 viikon vuodet?",
      a: "Vuoden 2026 jälkeen seuraavat 53 viikon vuodet ovat 2032, 2038, 2044 ja 2048.",
    },
    {
      q: "Miten viikko 53 vaikuttaa palkanlaskentaan ja työaikaan?",
      a: "Viikko- tai kaksiviikkopalkkaa saaville työntekijöille 53 viikon vuosi voi tuoda yhden ylimääräisen palkkakauden kalenterivuoteen. Kuukausipalkkaisille työntekijöille palkka säilyy samana.",
    },
  ];
}
