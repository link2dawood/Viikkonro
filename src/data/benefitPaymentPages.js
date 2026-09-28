// Content data for /kelan-maksupaivat-{year} and /elakkeen-maksupaivat-{year}:
// the day a Kela benefit or a pension actually reaches the bank account once
// weekends and bank holidays are accounted for. Plain .js so prerender.js can
// import it directly (same reason as paydayPages.js).
//
// Payment rules, checked 2026-09-28 against kela.fi/maksupaivat and
// tyoelake.fi/elakkeen-maksaminen:
//   yleinen asumistuki, opintoraha, toimeentulotuki: the 1st banking day of
//     the month (a 1st that is not a banking day moves FORWARD)
//   eläkkeensaajan asumistuki: the 4th, or the previous banking day
//   kansaneläke, hoitotuki, vammaistuet: the 7th, or the previous banking day
//   elatustuki: the 10th, or the previous banking day
//   takuueläke: the 22nd, or the previous banking day
//   lapsilisä: the 26th; when the 26th is not a banking day OR is the day
//     right after one (in practice usually a Monday), the previous banking
//     day. Kela's own wording: "jos 26. päivä osuu viikonlopulle tai
//     pyhäpäivälle tai näiden jälkeiselle päivälle, kuten maanantaille,
//     lapsilisän maksupäivä on edeltävä pankkipäivä". The day-after case is
//     unique to lapsilisä. Also checked against the 2024 and 2025 schedules
//     (26.2.2024 and 26.5.2025 were Mondays, paid 23.2. and 23.5.), so the
//     rule is not new and the in-window past years are correct too.
//   työeläke: "Maksupäivä vaihtelee työeläkelaitoksittain, mutta useimmilla
//     se on kuukauden ensimmäinen pankkipäivä" (tyoelake.fi)
// Every rule above reproduces all eleven February to December 2026 dates of
// the published 2026 schedule per benefit (see calendarTools.test.js), which
// is what confirms the direction (forward or back) of each rule.
//
// Banking days come from paydayPages.js's nonBankingReason(), the site's one
// implementation of the Bank of Finland's bank-holiday list.
import { isoWeek, isoYear, M_FULL, M_INESSIVE, WD, WD_ESSIVE } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";
import { nonBankingReason } from "./paydayPages.js";

export const KELA_SOURCE_URL = "https://www.kela.fi/maksupaivat";
export const PENSION_SOURCE_URL = "https://www.tyoelake.fi/elakkeen-maksaminen/";
export const RULES_CHECKED = "28.9.2026";

export const kelaPath = (year) => `/kelan-maksupaivat-${year}`;
export const pensionPath = (year) => `/elakkeen-maksupaivat-${year}`;

// One payment rule. `day` is the nominal day of month; `forward` moves a
// non-banking day to the NEXT banking day instead of the previous one;
// `afterDayOffMoves` also moves back from the day right after a non-banking day.
const RULES = {
  first: { day: 1, forward: true },
  d4: { day: 4 },
  d7: { day: 7 },
  d10: { day: 10 },
  d22: { day: 22 },
  d26: { day: 26, afterDayOffMoves: true },
};

// Kela page columns, in payment order through the month. `rule` is the short
// visible statement of the rule, word for word what the page and FAQ say.
export const KELA_BENEFITS = [
  {
    id: "asumistuki",
    ...RULES.first,
    name: "Yleinen asumistuki, opintoraha ja toimeentulotuki",
    column: "Asumistuki, opintoraha, toimeentulotuki",
    rule: "kuun ensimmäinen pankkipäivä",
  },
  {
    id: "elakkeensaajan-asumistuki",
    ...RULES.d4,
    name: "Eläkkeensaajan asumistuki",
    column: "Eläkkeensaajan asumistuki",
    rule: "4. päivä tai sitä edeltävä pankkipäivä",
  },
  {
    id: "kansanelake",
    ...RULES.d7,
    name: "Kansaneläke, hoitotuki ja vammaistuet",
    column: "Kansaneläke, vammaistuet",
    rule: "7. päivä tai sitä edeltävä pankkipäivä",
  },
  {
    id: "elatustuki",
    ...RULES.d10,
    name: "Elatustuki",
    column: "Elatustuki",
    rule: "10. päivä tai sitä edeltävä pankkipäivä",
  },
  {
    id: "takuuelake",
    ...RULES.d22,
    name: "Takuueläke",
    column: "Takuueläke",
    rule: "22. päivä tai sitä edeltävä pankkipäivä",
  },
  {
    id: "lapsilisa",
    ...RULES.d26,
    name: "Lapsilisä",
    column: "Lapsilisä",
    rule: "26. päivä, mutta jos se on viikonloppu, arkipyhä tai niiden jälkeinen päivä (yleensä maanantai), sitä edeltävä pankkipäivä",
  },
];

const KELA_BY_ID = Object.fromEntries(KELA_BENEFITS.map((b) => [b.id, b]));

// Pension page columns. The three Kela rows reuse the Kela rules above so the
// two pages can never show different dates for the same payment.
export const PENSION_BENEFITS = [
  {
    id: "tyoelake",
    ...RULES.first,
    name: "Työeläke",
    column: "Työeläke",
    rule: "kuun ensimmäinen pankkipäivä useimmissa työeläkelaitoksissa",
  },
  {
    ...KELA_BY_ID["elakkeensaajan-asumistuki"],
  },
  {
    ...KELA_BY_ID.kansanelake,
    name: "Kansaneläke ja eläkettä saavan hoitotuki",
    column: "Kansaneläke, hoitotuki",
  },
  {
    ...KELA_BY_ID.takuuelake,
  },
];

// Reason label when lapsilisä moves only because the day before the 26th was
// not a banking day: "Maanantai" for the usual case, otherwise this.
export const AFTER_DAY_OFF = "Pyhän jälkeinen päivä";

// The actual payment day of one benefit in one month.
export function benefitPaymentFor(year, month, benefit) {
  const nominal = new Date(year, month - 1, benefit.day);
  const dayBefore = new Date(year, month - 1, benefit.day - 1);
  const ownReason = nonBankingReason(nominal);
  const afterDayOff =
    !ownReason && Boolean(benefit.afterDayOffMoves) && nonBankingReason(dayBefore) !== null;
  const reason = ownReason ?? (afterDayOff ? (nominal.getDay() === 1 ? WD[1] : AFTER_DAY_OFF) : null);
  const actual = new Date(nominal);
  if (reason) {
    const step = benefit.forward ? 1 : -1;
    do actual.setDate(actual.getDate() + step);
    while (nonBankingReason(actual));
  }
  return {
    month,
    monthName: M_FULL[month - 1],
    nominal,
    actual,
    moved: reason !== null,
    early: reason !== null && !benefit.forward,
    afterDayOff,
    reason,
    weekday: WD[actual.getDay()],
    week: isoWeek(actual),
    weekYear: isoYear(actual),
  };
}

export function benefitPaymentsInYear(year, benefit) {
  return Array.from({ length: 12 }, (_, i) => benefitPaymentFor(year, i + 1, benefit));
}

// Month rows for the page tables: [{ month, monthName, cells: [row per benefit] }].
export function paymentSchedule(year, benefits) {
  const perBenefit = benefits.map((b) => benefitPaymentsInYear(year, b));
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: M_FULL[i],
    cells: perBenefit.map((rows) => rows[i]),
  }));
}

// "23.1." (day and month only; the year is in the page heading)
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
// "pe 23.1."
const wdm = (d) => `${WD[d.getDay()].slice(0, 2).toLowerCase()} ${dm(d)}`;

function joinFi(parts) {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} ja ${parts[parts.length - 1]}`;
}

const dateList = (rows) => joinFi(rows.map((r) => dm(r.actual)));
const movedRows = (rows) => rows.filter((r) => r.moved);
const movedList = (rows) =>
  joinFi(
    movedRows(rows).map(
      (r) => `${M_INESSIVE[r.month - 1]} (${dm(r.nominal)} on ${r.reason.toLowerCase()}, maksu ${WD_ESSIVE[r.actual.getDay()]} ${dm(r.actual)})`,
    ),
  );

// A date list like "23.12." already ends in a period, so a sentence that ends
// with one would otherwise read "23.12..".
const tidy = (items) => items.map(({ q, a }) => ({ q, a: a.replaceAll("..", ".") }));

const kerta = (n) => (n === 1 ? "kerran" : `${n} kertaa`);

// One sentence per benefit for the page's rule list: how often, and in which
// months, the payment moves in this year.
export function movedSummary(year, benefit) {
  const rows = benefitPaymentsInYear(year, benefit);
  const n = movedRows(rows).length;
  if (!n) return `Vuonna ${year} maksupäivä ei siirry kertaakaan.`;
  const how = benefit.forward ? "siirtyy seuraavaan pankkipäivään" : "tulee etuajassa";
  return `Vuonna ${year} maksu ${how} ${kerta(n)}: ${movedList(rows)}.`;
}

// Bank holidays that fall on a weekday this year, e.g. "Loppiainen ti 6.1."
// (a weekend holiday never moves a payment on its own).
export function weekdayBankHolidays(year) {
  return holidaysInYear(year)
    .filter((h) => h.date.getDay() !== 0 && h.date.getDay() !== 6)
    .map((h) => `${h.name} ${wdm(h.date)}`);
}

export function kelaStats(year) {
  const lapsilisa = benefitPaymentsInYear(year, KELA_BY_ID.lapsilisa);
  const asumistuki = benefitPaymentsInYear(year, KELA_BY_ID.asumistuki);
  return {
    lapsilisaEarly: movedRows(lapsilisa).length,
    lapsilisaAfterDayOff: lapsilisa.filter((r) => r.afterDayOff).length,
    asumistukiLate: movedRows(asumistuki).length,
  };
}

export function pensionStats(year) {
  const [tyoelake, , kansanelake, takuuelake] = PENSION_BENEFITS.map((b) =>
    benefitPaymentsInYear(year, b),
  );
  return {
    tyoelakeLate: movedRows(tyoelake).length,
    kansanelakeEarly: movedRows(kansanelake).length,
    takuuelakeEarly: movedRows(takuuelake).length,
  };
}

export function kelaPaymentMeta(year) {
  const { lapsilisaEarly } = kelaStats(year);
  return {
    title: `Kelan maksupäivät ${year}: lapsilisä ja asumistuki | Viikko Nro`,
    description: `Kelan maksupäivät ${year} kuukausittain: lapsilisä, asumistuki, opintoraha, kansaneläke, takuueläke ja elatustuki. Lapsilisä tulee etuajassa ${kerta(lapsilisaEarly)}.`,
  };
}

export function pensionPaymentMeta(year) {
  return {
    title: `Eläkkeen maksupäivät ${year}, työ- ja kansaneläke | Viikko Nro`,
    description: `Milloin eläke tulee tilille ${year}? Työeläke tulee yleensä kuun 1. pankkipäivänä, kansaneläke 7. ja takuueläke 22. päivä. Kaikki päivät kuukausittain.`,
  };
}

// December payments of the given benefits as one sentence fragment:
// "yleinen asumistuki, opintoraha ja toimeentulotuki ti 1.12.; ...; lapsilisä ke 23.12."
function decemberSentence(year, benefits) {
  return benefits
    .map((b) => `${b.name.toLowerCase()} ${wdm(benefitPaymentFor(year, 12, b).actual)}`)
    .join("; ");
}

// Shared by KelaPayments.jsx (visible <details>) and prerender.js (FAQPage).
// Every answer is computed for this exact year.
export function kelaPaymentFaqs(year) {
  const lapsilisa = benefitPaymentsInYear(year, KELA_BY_ID.lapsilisa);
  const asumistuki = benefitPaymentsInYear(year, KELA_BY_ID.asumistuki);
  const afterDayOff = lapsilisa.filter((r) => r.afterDayOff);
  const lateAsumistuki = movedRows(asumistuki);
  const nextJanuary = benefitPaymentFor(year + 1, 1, KELA_BY_ID.asumistuki);
  return tidy([
    {
      q: `Milloin lapsilisä maksetaan vuonna ${year}?`,
      a: `Lapsilisä maksetaan kuun 26. päivänä. Jos 26. päivä on viikonloppu, arkipyhä tai niiden jälkeinen päivä, kuten maanantai, Kela maksaa lapsilisän sitä edeltävänä pankkipäivänä. Vuonna ${year} lapsilisän maksupäivät ovat ${dateList(lapsilisa)}.`,
    },
    {
      q: `Milloin asumistuki ja opintoraha tulevat tilille vuonna ${year}?`,
      a: `Yleinen asumistuki ja opintoraha maksetaan kuun ensimmäisenä pankkipäivänä. Vuonna ${year} maksupäivät ovat ${dateList(asumistuki)}. ${
        lateAsumistuki.length
          ? `Maksu siirtyy seuraavaan pankkipäivään ${kerta(lateAsumistuki.length)}, koska kuun 1. päivä on viikonloppu tai arkipyhä.`
          : "Kuun 1. päivä on joka kuukausi pankkipäivä, joten maksu ei siirry kertaakaan."
      }`,
    },
    {
      q: "Maksetaanko lapsilisä etuajassa, jos 26. päivä on maanantai?",
      a: `Kyllä. Toisin kuin muut Kelan etuudet, lapsilisä maksetaan edeltävänä pankkipäivänä myös silloin, kun 26. päivä on viikonlopun tai arkipyhän jälkeinen päivä, käytännössä useimmiten maanantai. ${
        afterDayOff.length
          ? `Vuonna ${year} näin käy ${kerta(afterDayOff.length)}: ${joinFi(afterDayOff.map((r) => `${M_INESSIVE[r.month - 1]} lapsilisä tulee ${WD_ESSIVE[r.actual.getDay()]} ${dm(r.actual)}`))}.`
          : `Vuonna ${year} näin ei käy kertaakaan.`
      }`,
    },
    {
      q: "Siirtyykö Kelan maksupäivä aiemmaksi vai myöhemmäksi, jos se osuu viikonloppuun?",
      a: "Se riippuu etuudesta. Kuun alussa maksettavat yleinen asumistuki, opintoraha ja toimeentulotuki siirtyvät seuraavaan pankkipäivään. Eläkkeensaajan asumistuki, kansaneläke, elatustuki, takuueläke ja lapsilisä maksetaan sen sijaan edeltävänä pankkipäivänä, joten ne tulevat tilille etuajassa.",
    },
    {
      q: `Milloin Kelan tuet maksetaan joulukuussa ${year}?`,
      a: `Joulukuun ${year} maksupäivät: ${decemberSentence(year, KELA_BENEFITS)}. Jouluaatto, joulupäivä ja tapaninpäivä eivät ole pankkipäiviä.`,
    },
    {
      q: `Milloin tammikuun ${year + 1} asumistuki ja opintoraha maksetaan?`,
      a: `Uudenvuodenpäivä 1.1. ei ole pankkipäivä, joten tammikuun ${year + 1} asumistuki ja opintoraha maksetaan ${WD_ESSIVE[nextJanuary.actual.getDay()]} ${dm(nextJanuary.actual)}${year + 1}.`,
    },
    {
      q: "Milloin toimeentulotuki maksetaan?",
      a: "Perustoimeentulotuki maksetaan yleensä kuun ensimmäisenä pankkipäivänä, samana päivänä kuin yleinen asumistuki. Jos päätös valmistuu kesken kuukauden, tuki maksetaan yleensä kahden pankkipäivän kuluessa päätöksestä. Oma maksupäiväsi näkyy Kelan päätöksessä ja OmaKelassa.",
    },
  ]);
}

// Shared by PensionPayments.jsx and prerender.js, same as kelaPaymentFaqs().
export function pensionPaymentFaqs(year) {
  const [tyoelake, eakt, kansanelake, takuuelake] = PENSION_BENEFITS.map((b) =>
    benefitPaymentsInYear(year, b),
  );
  const early = (rows) =>
    movedRows(rows).length
      ? ` Maksu tulee etuajassa ${kerta(movedRows(rows).length)}: ${movedList(rows)}.`
      : "";
  return tidy([
    {
      q: `Milloin työeläke maksetaan vuonna ${year}?`,
      a: `Useimmat työeläkelaitokset maksavat työeläkkeen kuun ensimmäisenä pankkipäivänä. Vuonna ${year} se tarkoittaa päiviä ${dateList(tyoelake)}. Maksupäivä vaihtelee eläkelaitoksittain, joten tarkista oma päiväsi eläkepäätöksestä tai eläkelaitoksesi verkkopalvelusta.`,
    },
    {
      q: `Milloin kansaneläke maksetaan vuonna ${year}?`,
      a: `Kela maksaa kansaneläkkeen kuun 7. päivänä tai sitä edeltävänä pankkipäivänä. Vuonna ${year} maksupäivät ovat ${dateList(kansanelake)}.${early(kansanelake)}`,
    },
    {
      q: `Milloin takuueläke maksetaan vuonna ${year}?`,
      a: `Takuueläke maksetaan kuun 22. päivänä tai sitä edeltävänä pankkipäivänä. Vuonna ${year} maksupäivät ovat ${dateList(takuuelake)}.${early(takuuelake)}`,
    },
    {
      q: `Milloin eläkkeensaajan asumistuki maksetaan vuonna ${year}?`,
      a: `Eläkkeensaajan asumistuki maksetaan kuun 4. päivänä tai sitä edeltävänä pankkipäivänä. Vuonna ${year} maksupäivät ovat ${dateList(eakt)}.`,
    },
    {
      q: "Miksi työeläke ja kansaneläke tulevat tilille eri päivinä?",
      a: "Työeläkkeen maksaa oma työeläkelaitoksesi, ja useimmilla laitoksilla maksupäivä on kuun ensimmäinen pankkipäivä. Kansaneläkkeen ja takuueläkkeen maksaa Kela omina maksupäivinään, 7. ja 22. päivä. Jos saat sekä työeläkettä että Kelan eläkettä, rahaa tulee siis kuukaudessa kahtena eri päivänä.",
    },
    {
      q: `Milloin eläkkeet maksetaan joulukuussa ${year}?`,
      a: `Joulukuun ${year} maksupäivät: ${decemberSentence(year, PENSION_BENEFITS)}.`,
    },
    {
      q: "Milloin Kelan perhe-eläke maksetaan?",
      a: "Kelan perhe-eläkkeet maksetaan edunsaajan sukunimen ensimmäisen kirjaimen mukaan: 4. päivä, kun sukunimi alkaa kirjaimilla A-K, 14. päivä kirjaimilla L-R ja 22. päivä kirjaimilla S-Ö.",
    },
  ]);
}
