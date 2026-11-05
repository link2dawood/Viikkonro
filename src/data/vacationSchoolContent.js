import { isoYear, M_FULL } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";

// --- Weekdays in Month (Arkipäivät kuukaudessa) ---

export function monthWeekdayStats(month, year) {
  // month: 1-12
  const officialHolidayDates = new Set(
    holidaysInYear(year)
      .filter((h) => h.official)
      .map((h) => h.date.toDateString()),
  );

  let arkipaivat6 = 0; // ma-la ilman arkipyhiä (Kelan ja vuosilomalain arkipäivät)
  let tyopaivat5 = 0;  // ma-pe ilman arkipyhiä
  let lauantait = 0;
  let sunnuntait = 0;
  let arkipyhat = 0;

  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const dow = d.getDay(); // 0 = Sun, 6 = Sat
    const isHoliday = officialHolidayDates.has(d.toDateString());

    if (dow === 0) {
      sunnuntait += 1;
    } else if (dow === 6) {
      lauantait += 1;
      if (!isHoliday) {
        arkipaivat6 += 1;
      } else {
        arkipyhat += 1;
      }
    } else {
      // ma-pe
      if (isHoliday) {
        arkipyhat += 1;
      } else {
        tyopaivat5 += 1;
        arkipaivat6 += 1;
      }
    }

    d.setDate(d.getDate() + 1);
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    month,
    monthName: M_FULL[month - 1],
    year,
    daysInMonth,
    arkipaivat6,
    tyopaivat5,
    lauantait,
    sunnuntait,
    arkipyhat,
  };
}

export function allMonthsWeekdayRows(year) {
  return Array.from({ length: 12 }, (_, i) => monthWeekdayStats(i + 1, year));
}

// --- Vacation Weeks (Vuosiloma viikkoina) ---

export function vacationWeeksStats() {
  return {
    fullLeaveDays: 30,
    fullLeaveWeeks: 5,
    standardRate: "2,5 päivää / täysi lomanmääräytymiskuukausi (työsuhde kestänyt vähintään vuoden)",
    partialLeaveDays: 24,
    partialLeaveWeeks: 4,
    partialRate: "2,0 päivää / kuukausi (työsuhde alle vuoden lomanmääräytymisvuoden loppuun 31.3. mennessä)",
    summerHolidayDays: 24,
    summerHolidayWeeks: 4,
    summerPeriod: "2.5.–30.9. (kesälomakausi)",
    winterHolidayDays: 6,
    winterHolidayWeeks: 1,
    winterPeriod: "1.10.–30.4. (talvilomakausi)",
    saturdayRule: "Vuosilomalain mukaan lauantait kuluttavat vuosilomaa (6 lomapäivää = 1 viikko lomaa).",
  };
}

// --- School Weeks (Lukuvuoden viikot) ---

export function schoolWeeksStats(year = 2026) {
  return {
    year,
    schoolYearLabel: `${year}–${year + 1}`,
    statutoryDays: 190,
    actualDaysApprox: "187–188 päivää (vähennetään arkipyhät, kuten itsenäisyyspäivä ja vappu)",
    totalSchoolWeeks: "38–39 viikkoa",
    autumnWeeks: "n. 18–19 viikkoa (elokuun puolivälistä jouluun)",
    springWeeks: "n. 19–20 viikkoa (tammikuun alusta kesäkuun alkuun)",
    vacations: [
      { name: "Syysloma", duration: "1 viikko (yleensä viikolla 42 tai 43)" },
      { name: "Joululoma", duration: "n. 1,5–2 viikkoa (joulu- ja uudenvuoden viikot)" },
      { name: "Talviloma / hiihtoloma", duration: "1 viikko (viikot 8, 9 tai 10 alueen mukaan)" },
      { name: "Pääsiäisloma", duration: "4 päivää (pitkäperjantaista toiseen pääsiäispäivään)" },
      { name: "Kesäloma", duration: "n. 10 viikkoa (kesäkuun alusta elokuun puoliväliin)" },
    ],
  };
}

// --- SEO Metadata Generators ---

export function weekdaysInMonthMeta(date) {
  const year = isoYear(date);
  return {
    title: "Kuinka monta arkipäivää kuukaudessa on? | Viikko Nro",
    description: `Katso, montako arkipäivää kuukaudessa on: 6-päiväisessä laskennassa (Kela ja vuosiloma) keskimäärin 25 pv, työpäiviä 21 pv. Kuukausien vertailu vuonna ${year}.`,
  };
}

export function vacationWeeksMeta() {
  return {
    title: "Kuinka monta viikkoa vuosiloma on? | Viikko Nro",
    description: "Katso, montako viikkoa vuosiloma on: täysi vuosiloma on 5 viikkoa (30 arkipäivää). Alle vuoden työsuhteessa 4 viikkoa (24 pv). Lauantaisääntö ja kesäloma.",
  };
}

export function schoolWeeksMeta(date) {
  const year = isoYear(date);
  return {
    title: "Kuinka monta viikkoa lukuvuodessa on? | Viikko Nro",
    description: `Katso, montako viikkoa lukuvuodessa on: Suomen kouluissa on 190 työpäivää eli noin 38-39 kouluviikkoa. Lomat, syys- ja kevätlukukausi vuonna ${year}.`,
  };
}

// --- FAQ Generators ---

export function weekdaysInMonthFaqs() {
  return [
    {
      q: "Mitä eroa on arkipäivällä ja työpäivällä kuukaudessa?",
      a: "Suomen laissa (vuosilomalaki ja Kelan etuudet) arkipäiviä ovat kaikki päivät maanantaista lauantaihin pois lukien viralliset arkipyhät (6 pv/viikko). Työpäiviksi lasketaan useimmiten vain maanantai–perjantai (5 pv/viikko).",
    },
    {
      q: "Kuinka monta arkipäivää kuukaudessa on keskimäärin?",
      a: "6-päiväisen viikon mukaan arkipäiviä on kuukaudessa keskimäärin noin 25 päivää (vaihteluväli 23–26 pv). 5-päiväisen viikon mukaan työpäiviä on keskimäärin 21 päivää (19–23 pv).",
    },
    {
      q: "Onko lauantai aina arkipäivä?",
      a: "Kyllä, lainsäädännössä lauantai on aina arkipäivä, ellei se satu olemaan virallinen kirkollinen pyhäpäivä (kuten juhannuspäivä tai pyhäinpäivä). Työehtosopimuksissa lauantai on kuitenkin useimmiten palkaton vapaapäivä.",
    },
    {
      q: "Miten arkipäivien määrä vaikuttaa Kelan sairaus- ja vanhempainpäivärahaan?",
      a: "Kela maksaa päivärahoja kuudelta arkipäivältä viikossa (maanantaista lauantaihin). Siksi Kelan päivärahakausi kuluu nopeammin kuin 5-päiväinen työviikko.",
    },
  ];
}

export function vacationWeeksFaqs() {
  const stats = vacationWeeksStats();
  return [
    {
      q: "Kuinka monta viikkoa täysi vuosiloma on?",
      a: `Täysi vuosiloma on tasan ${stats.fullLeaveWeeks} viikkoa eli ${stats.fullLeaveDays} arkipäivää, kun työsuhde on kestänyt lomanmääräytymisvuoden loppuun (31.3.) mennessä vähintään yhden vuoden.`,
    },
    {
      q: "Kuinka monta viikkoa lomaa kertyy alle vuoden työsuhteessa?",
      a: `Alle vuoden kestäneessä työsuhteessa lomaa kertyy 2 arkipäivää kuukaudessa, mikä tekee täydeltä lomanmääräytymisvuodelta ${stats.partialLeaveDays} arkipäivää eli tasan ${stats.partialLeaveWeeks} viikkoa.`,
    },
    {
      q: "Miksi lauantait kuluttavat vuosilomaa?",
      a: "Vuosilomalaki perustuu 6-päiväiseen arkipäiväjärjestelmään. Yhden täyden lomaviikon pitäminen kuluttaa 6 lomapäivää (maanantaista lauantaihin), vaikka työntekijä tekisi 5-päiväistä työviikkoa.",
    },
    {
      q: "Miten vuosiloma jakautuu kesä- ja talvilomaan?",
      a: `Lomasta ${stats.summerHolidayDays} päivää (4 viikkoa) on annettava kesälomakaudella (2.5.–30.9.) ja loput ${stats.winterHolidayDays} päivää (1 viikko) talvilomakaudella (1.10.–30.4.).`,
    },
    {
      q: "Kuluttaako arkipyhä vuosilomapäiviä?",
      a: "Ei kuluta. Jos vuosilomajaksolle osuu virallinen pyhäpäivä (kuten juhannusaatto, juhannuspäivä, helatorstai tai itsenäisyyspäivä), se ei kuluta työntekijän vuosilomapäiviä.",
    },
  ];
}

export function schoolWeeksFaqs(year = 2026) {
  const stats = schoolWeeksStats(year);
  return [
    {
      q: "Kuinka monta viikkoa koulua on vuodessa?",
      a: `Peruskoulussa ja lukiossa lukuvuosi kestää noin ${stats.totalSchoolWeeks}. Perusopetuslain mukaan lukuvuodessa on ${stats.statutoryDays} työpäivää, joista vähennetään arkipäiville osuvat itsenäisyyspäivä, loppiainen ja vappu.`,
    },
    {
      q: "Kuinka monta viikkoa kesäloma kestää?",
      a: "Koululaisten kesäloma kestää Suomessa noin 10 viikkoa. Se alkaa viikon 22 lopussa (kesäkuun ensimmäisenä lauantaina) ja päättyy elokuun puolivälin tienoilla viikolla 32 tai 33.",
    },
    {
      q: "Miten kouluviikot jakautuvat syys- ja kevätlukukauteen?",
      a: `Syyslukukaudessa on yleensä ${stats.autumnWeeks} ja kevätlukukaudessa ${stats.springWeeks}. Kevätlukukausi on hieman syyslukukautta pidempi.`,
    },
    {
      q: "Milloin koulujen lomat pidetään?",
      a: "Syysloma pidetään loka-marraskuussa (viikko 42 tai 43), joululoma joulu-tammikuun vaihteessa (n. 2 viikkoa), talviloma helmi-maaliskuussa (viikot 8–10 alueittain) ja kesäloma kesä-elokuussa.",
    },
  ];
}
