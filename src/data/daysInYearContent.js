import { isLeapYear, isoYear } from "../components/dateUtils.js";

export function yearDaysStats(year) {
  const leap = isLeapYear(year);
  const days = leap ? 366 : 365;
  const hours = days * 24;
  const minutes = hours * 60;
  const seconds = minutes * 60;
  const fullWeeks = 52;
  const extraDays = leap ? 2 : 1;
  return {
    year,
    leap,
    days,
    hours,
    minutes,
    seconds,
    fullWeeks,
    extraDays,
    leapReason: leap
      ? `Vuosi ${year} on karkausvuosi (jaollinen 4:llä), joten helmikuussa on 29 päivää.`
      : `Vuosi ${year} on tavallinen vuosi, joten helmikuussa on 28 päivää.`,
  };
}

export function currentYearProgress(today = new Date()) {
  const year = today.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const totalDays = isLeapYear(year) ? 366 : 365;
  const msPassed = today.getTime() - startOfYear.getTime();
  const daysPassed = Math.min(totalDays, Math.max(1, Math.floor(msPassed / (1000 * 60 * 60 * 24)) + 1));
  const daysRemaining = Math.max(0, totalDays - daysPassed);
  const percentage = Math.min(100, Math.max(0, ((daysPassed / totalDays) * 100))).toFixed(1);

  return {
    year,
    totalDays,
    daysPassed,
    daysRemaining,
    percentage,
  };
}

export function daysInYearMeta(date) {
  const year = isoYear(date);
  const days = isLeapYear(year) ? 366 : 365;
  return {
    title: "Kuinka monta päivää vuodessa on? 365 vai 366 | Viikko Nro",
    description: `Katso, montako päivää vuodessa on: tavallisesti 365, karkausvuonna 366. Vuonna ${year} on ${days} päivää. Tunnit, minuutit ja karkausvuosisääntö.`,
  };
}

export function daysInYearFaqs(year) {
  const stats = yearDaysStats(year);
  return [
    {
      q: "Kuinka monta päivää vuodessa on?",
      a: "Tavallisessa vuodessa on 365 päivää ja karkausvuodessa 366 päivää.",
    },
    {
      q: `Kuinka monta päivää vuonna ${year} on?`,
      a: `Vuonna ${year} on ${stats.days} päivää, koska vuosi ${year} on ${stats.leap ? "karkausvuosi" : "normaalivuosi"}.`,
    },
    {
      q: "Miksi karkausvuodessa on 366 päivää?",
      a: "Maan todellinen kiertoaika auringon ympäri (trooppinen vuosi) on noin 365,2422 päivää. Ilman ylimääräistä karkauspäivää 29. helmikuuta kalenteri jäisi jälkeen noin yhden vuorokauden joka neljäs vuosi.",
    },
    {
      q: "Kuinka monta tuntia ja minuuttia vuodessa on?",
      a: "Tavallisessa 365 päivän vuodessa on 8 760 tuntia, 525 600 minuuttia ja 31 536 000 sekuntia. Karkausvuodessa (366 päivää) on 8 784 tuntia ja 527 040 minuuttia.",
    },
    {
      q: "Milloin vuosi on karkausvuosi?",
      a: "Vuosi on karkausvuosi, jos se on jaollinen 4:llä. Tasavuosisadat (kuten 1900, 2100) eivät kuitenkaan ole karkausvuosia, elleivät ne ole jaollisia 400:lla (kuten 2000, 2400).",
    },
    {
      q: "Montako viikkoa 365 päivää on?",
      a: "365 päivää on 52 viikkoa ja yksi ylimääräinen päivä (52,14 viikkoa). Karkausvuoden 366 päivää on 52 viikkoa ja kaksi ylimääräistä päivää (52,29 viikkoa).",
    },
  ];
}
