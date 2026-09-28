// Content data for the observance-day pages: /isanpaiva-{year},
// /aitienpaiva-{year}, /ystavanpaiva-{year}, /laskiainen-{year} and
// /adventti-{year}. These are widely observed days that are NOT public
// holidays, so they are deliberately a separate family from the
// /pyhat-{year}/{slug} holiday pages. Plain .js so prerender.js can import it.
//
// Facts checked 2026-09-28:
// - Date rules, almanac history and the adventti/laskiainen wording:
//   almanakka.helsinki.fi/fi/liputus-ja-juhlapaivat (University of Helsinki
//   almanac office, the body that edits the Finnish almanac).
// - Isänpäivä became an official flag day when the Government amended the
//   flag-day decree (383/1978) on 14.3.2019; äitienpäivä already was one
//   (valtioneuvosto.fi press release "Isänpäivän liputus virallistetaan
//   asetuksella").
// - Laskiaissunnuntai is seven weeks (49 days) before Easter Sunday; checked
//   against the published 2026 dates 15.2. (sunnuntai) and 17.2. (tiistai).
// Every date below is computed; nothing is typed in per year.
import {
  fmtFullFi,
  isoWeek,
  isoYear,
  M_GENITIVE,
  PRERENDER_MAX_YEAR,
  PRERENDER_MIN_YEAR,
  WD,
  WD_ESSIVE,
} from "../components/dateUtils.js";
import { easterSunday, getLiputuspaivat } from "./juhlapaivat.js";

export const ALMANAC_URL = "https://almanakka.helsinki.fi/fi/liputus-ja-juhlapaivat/";
export const FACTS_CHECKED = "28.9.2026";

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// nth Sunday of a month (month0 is 0-based).
function nthSunday(year, month0, n) {
  const first = new Date(year, month0, 1);
  return new Date(year, month0, 1 + ((7 - first.getDay()) % 7) + (n - 1) * 7);
}

// The single Saturday of 31.10.-6.11. (pyhäinpäivä), same rule as holidays.js.
function allSaintsDay(year) {
  for (let d = 0; d < 7; d++) {
    const date = new Date(year, 9, 31 + d);
    if (date.getDay() === 6) return date;
  }
  return null;
}

// 1. adventtisunnuntai: the Sunday of 27.11.-3.12. (almanakka.helsinki.fi).
function firstAdvent(year) {
  for (let d = 0; d < 7; d++) {
    const date = new Date(year, 10, 27 + d);
    if (date.getDay() === 0) return date;
  }
  return null;
}

// "8.11." and "su 8.11."
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const wdm = (d) => `${WD[d.getDay()].slice(0, 2).toLowerCase()} ${dm(d)}`;
function joinFi(parts) {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} ja ${parts[parts.length - 1]}`;
}
const daysBetween =(a, b) => Math.round((b - a) / 86400000);
const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;

// One record per page family. `date(year)` is the headline date; `extra`
// dates are shown alongside it (laskiaistiistai, the other advent Sundays).
export const OBSERVANCES = [
  {
    slug: "isanpaiva",
    name: "Isänpäivä",
    genitive: "isänpäivän",
    isFlagDay: true,
    date: (y) => nthSunday(y, 10, 2),
    rule: "Isänpäivää vietetään marraskuun toisena sunnuntaina, joten se osuu aina 8. ja 14. marraskuuta välille.",
    flagDay: "Isänpäivä on virallinen liputuspäivä. Almanakassa se on ollut vuodesta 1987 vakiintuneena liputuspäivänä, ja valtioneuvosto muutti sen viralliseksi liputuspäiväksi vuonna 2019.",
    history: "Isänpäivä on ollut suomalaisessa almanakassa vuodesta 1987. Vuodesta 2019 alkaen isänpäivän liputus on ollut yhtä virallista kuin äitienpäivän.",
  },
  {
    slug: "aitienpaiva",
    name: "Äitienpäivä",
    genitive: "äitienpäivän",
    isFlagDay: true,
    date: (y) => nthSunday(y, 4, 2),
    rule: "Äitienpäivää vietetään toukokuun toisena sunnuntaina, joten se osuu aina 8. ja 14. toukokuuta välille.",
    flagDay: "Äitienpäivä on virallinen liputuspäivä, jolloin Suomen lippu nostetaan salkoon.",
    history: "Suomessa äitienpäivää on juhlittu 1910-luvulta lähtien, ja kalenteriin se on merkitty vuodesta 1947.",
  },
  {
    slug: "ystavanpaiva",
    name: "Ystävänpäivä",
    genitive: "ystävänpäivän",
    date: (y) => new Date(y, 1, 14),
    rule: "Ystävänpäivää vietetään joka vuosi 14. helmikuuta, joten päivämäärä ei muutu, vain viikonpäivä vaihtuu.",
    flagDay: "Ystävänpäivä ei ole liputuspäivä eikä virallinen vapaapäivä.",
    history: "Suomalaisissa kalentereissa ystävänpäivä on ollut vuodesta 1996. Almanakkatoimiston mukaan se on sekä rakastavaisten että ystävyyden päivä.",
  },
  {
    slug: "laskiainen",
    name: "Laskiainen",
    dayLabel: "Laskiaissunnuntai",
    genitive: "laskiaisen",
    date: (y) => addDays(easterSunday(y), -49),
    extrasHeading: "Laskiaissunnuntai ja laskiaistiistai",
    extra: (y) => [{ label: "Laskiaistiistai", date: addDays(easterSunday(y), -47) }],
    rule: "Laskiaissunnuntai on seitsemän viikkoa ennen pääsiäissunnuntaita, ja laskiaistiistai on sitä seuraava tiistai. Koska pääsiäinen vaihtelee, laskiainen osuu vuodesta riippuen helmi- tai maaliskuulle.",
    flagDay: "Laskiainen ei ole liputuspäivä eikä virallinen vapaapäivä.",
    history: "Laskiainen on paastonajan alkajaisjuhla. Laskiaistiistai on laskiaissunnuntain jälkeinen tiistai, jolloin paasto varsinaisesti alkaa.",
  },
  {
    slug: "adventti",
    name: "1. adventti",
    genitive: "1. adventin",
    date: (y) => firstAdvent(y),
    extrasHeading: "Kaikki adventtisunnuntait",
    extra: (y) => [2, 3, 4].map((n) => ({ label: `${n}. adventti`, date: addDays(firstAdvent(y), (n - 1) * 7) })),
    rule: "Ensimmäinen adventtisunnuntai on 27.11. ja 3.12. välinen sunnuntai. Toinen, kolmas ja neljäs adventti ovat sitä seuraavat sunnuntait ennen joulua.",
    flagDay: "Adventtisunnuntait eivät ole liputuspäiviä eivätkä virallisia vapaapäiviä, mutta ne ovat kirkkovuoden juhlapyhiä.",
    history: "Evankelis-luterilaisen kirkon kirkkovuosi alkaa ensimmäisenä adventtisunnuntaina, ja adventti on joulun odotuksen aikaa.",
  },
];

const BY_SLUG = new Map(OBSERVANCES.map((o) => [o.slug, o]));

export const observancePath = (slug, year) => `/${slug}-${year}`;
export const OBSERVANCE_SLUG_RE = new RegExp(`^(${OBSERVANCES.map((o) => o.slug).join("|")})-(\\d{4})$`);

const inRange = (y) => y >= PRERENDER_MIN_YEAR && y <= PRERENDER_MAX_YEAR;

// Link target for a flag-day name that has its own observance page, or null.
export function observancePathForFlagDay(name, year) {
  const slug = { Isänpäivä: "isanpaiva", Äitienpäivä: "aitienpaiva" }[name];
  return slug && inRange(year) ? observancePath(slug, year) : null;
}

export function observancePage(slug, year) {
  const def = BY_SLUG.get(slug);
  const y = Number(year);
  if (!def || !Number.isInteger(y)) return null;
  const date = def.date(y);
  return {
    ...def,
    year: y,
    date,
    extras: def.extra ? def.extra(y) : [],
    weekday: WD[date.getDay()],
    weekdayEssive: WD_ESSIVE[date.getDay()],
    week: isoWeek(date),
    weekYear: isoYear(date),
    month: date.getMonth() + 1,
    path: observancePath(slug, y),
    weekPath: `/viikko-${isoWeek(date)}-${isoYear(date)}`,
    monthPath: `/kuukausi-${date.getMonth() + 1}-${y}`,
    monthLabel: `${M_GENITIVE[date.getMonth()]} ${y} viikot`,
  };
}

// The same day in the following years, for the "tulevina vuosina" table.
export function upcomingYears(slug, year, count = 6) {
  return Array.from({ length: count }, (_, i) => year + i)
    .filter(inRange)
    .map((y) => observancePage(slug, y));
}

// Facts that only this day has, computed for this year. Each entry is one
// sentence (plus an optional internal link) for the "Hyvä tietää" section.
export function observanceHighlights(page) {
  const y = page.year;
  const out = [];
  if (page.slug === "isanpaiva") {
    const allSaints = allSaintsDay(y);
    out.push({
      text: `Isänpäivä on aina kahdeksan päivää pyhäinpäivän jälkeen. Vuonna ${y} pyhäinpäivä on ${whenFi(allSaints)}.`,
      link: { to: `/pyhat-${y}/pyhainpaiva`, label: `Pyhäinpäivä ${y}` },
    });
  }
  if (page.slug === "aitienpaiva") {
    const mmdd = `05-${String(page.date.getDate()).padStart(2, "0")}`;
    const shared = (getLiputuspaivat(y).get(mmdd) || []).filter((n) => n !== "Äitienpäivä");
    out.push({
      text: shared.length
        ? `Vuonna ${y} äitienpäivä osuu samalle päivälle kuin ${shared.join(" ja ")}, joten päivänä liputetaan kahden liputuspäivän vuoksi.`
        : `Vuonna ${y} äitienpäivä ei osu samalle päivälle minkään muun liputuspäivän kanssa.`,
      link: { to: `/liputuspaivat-${y}`, label: `Liputuspäivät ${y}` },
    });
  }
  if (page.slug === "ystavanpaiva") {
    const laskiainen = observancePage("laskiainen", y);
    const gap = daysBetween(page.date, laskiainen.date);
    out.push({
      text:
        gap === 0
          ? `Vuonna ${y} ystävänpäivä ja laskiaissunnuntai osuvat samalle päivälle.`
          : gap > 0
            ? `Vuonna ${y} laskiaissunnuntai on ${gap} päivää ystävänpäivän jälkeen, ${whenFi(laskiainen.date)}.`
            : `Vuonna ${y} laskiaissunnuntai on jo ${-gap} päivää ennen ystävänpäivää, ${whenFi(laskiainen.date)}.`,
      link: { to: laskiainen.path, label: `Laskiainen ${y}` },
    });
  }
  if (page.slug === "laskiainen") {
    const easter = easterSunday(y);
    out.push({
      text: `Vuonna ${y} pääsiäispäivä on ${whenFi(easter)}, joten laskiaissunnuntai on ${whenFi(page.date)} ja laskiaistiistai ${whenFi(page.extras[0].date)}.`,
      link: { to: `/pyhat-${y}/paasiaispaiva`, label: `Pääsiäinen ${y}` },
    });
  }
  if (page.slug === "adventti") {
    const christmasEve = new Date(y, 11, 24);
    const fourth = page.extras[2].date;
    out.push({
      text: `Ensimmäisestä adventista on ${daysBetween(page.date, christmasEve)} päivää jouluaattoon. Neljäs adventti on ${whenFi(fourth)}, ${daysBetween(fourth, christmasEve) === 0 ? "samana päivänä kuin jouluaatto" : `${daysBetween(fourth, christmasEve)} päivää ennen jouluaattoa`}.`,
      link: { to: "/kuinka-monta-paivaa-jouluun", label: "Kuinka monta päivää jouluun" },
    });
  }
  return out;
}

// Well-known customs of each day, one paragraph for the "Perinteet" section.
export const TRADITIONS = {
  isanpaiva:
    "Isänpäivänä muistetaan isiä, isoisiä ja muita isähahmoja esimerkiksi korteilla, lahjoilla ja yhteisellä aamiaisella tai kakkukahveilla. Päiväkodeissa ja kouluissa lapset askartelevat isänpäiväkortteja usein jo edeltävällä viikolla.",
  aitienpaiva:
    "Äitienpäivänä äideille ja isoäideille viedään kukkia ja kortteja, ja perhe valmistaa usein aamiaisen tai kakkukahvit. Perinteinen äitienpäivän kukka on valkovuokko, jota lapset ovat keränneet kevään ensimmäisistä kukista.",
  ystavanpaiva:
    "Ystävänpäivänä lähetetään kortteja, viestejä ja pieniä lahjoja ystäville, ei vain puolisolle. Kouluissa ja työpaikoilla päivää vietetään usein pienillä yhteisillä hetkillä.",
  laskiainen:
    "Laskiaisen tunnetuimpia perinteitä ovat mäenlasku, laskiaispullat ja hernekeitto. Vanhan kansanperinteen mukaan pitkä mäenlasku laskiaisena ennusti pitkiä pellavia seuraavana kesänä.",
  adventti:
    "Ensimmäisenä adventtisunnuntaina kirkoissa lauletaan perinteisesti Hoosianna-hymniä, ja kotona sytytetään ensimmäinen neljästä adventtikynttilästä. Jokaisena adventtisunnuntaina sytytetään yksi kynttilä lisää, kunnes neljäntenä adventtina kaikki palavat.",
};

const LOOKAHEAD = 40;

// Calendar facts computed over the coming years, for the "... kalenterissa"
// section: when the day next hits its earliest and latest possible date, or
// (for the fixed-date ystävänpäivä) which coming years put it on a weekend.
export function calendarFacts(page) {
  const y = page.year;
  const def = BY_SLUG.get(page.slug);
  const lower = page.name.charAt(0).toLowerCase() + page.name.slice(1);
  const day = page.dayLabel ?? page.name;
  const years = Array.from({ length: LOOKAHEAD }, (_, i) => y + 1 + i).map((yy) => ({
    year: yy,
    date: def.date(yy),
  }));
  const md = (d) => d.getMonth() * 100 + d.getDate();

  if (page.slug === "ystavanpaiva") {
    const weekend = years.filter((r) => [0, 6].includes(r.date.getDay())).slice(0, 4);
    return [
      `${day} on joka vuosi 14. helmikuuta, mutta viikonpäivä vaihtuu. Vuonna ${y} se on ${page.weekdayEssive}.`,
      `Seuraavan kerran ystävänpäivä osuu viikonloppuun vuosina ${joinFi(weekend.map((r) => `${r.year} (${WD[r.date.getDay()].toLowerCase()})`))}.`,
    ];
  }

  // Extremes over the coming years only, so "next" always exists.
  const minMd = Math.min(...years.map((r) => md(r.date)));
  const maxMd = Math.max(...years.map((r) => md(r.date)));
  const nextMin = years.find((r) => md(r.date) === minMd);
  const nextMax = years.find((r) => md(r.date) === maxMd);
  const fmtMd = (d) => fmtFullFi(d).replace(/ \d{4}$/, "");
  const facts = [];
  // The Sunday-rule days cycle through all seven possible dates within a few
  // years, so the future range is also the full possible range.
  if (page.slug !== "laskiainen") {
    if (md(page.date) <= minMd) facts.push(`Vuonna ${y} ${lower} on aikaisimmassa mahdollisessa päivässään, ${fmtMd(page.date)}.`);
    else if (md(page.date) >= maxMd) facts.push(`Vuonna ${y} ${lower} on myöhäisimmässä mahdollisessa päivässään, ${fmtMd(page.date)}.`);
  }
  if (page.slug === "laskiainen") {
    facts.push(
      `Seuraavien ${LOOKAHEAD} vuoden aikana laskiaissunnuntai on aikaisimmillaan ${fmtMd(nextMin.date)} vuonna ${nextMin.year} ja myöhäisimmillään ${fmtMd(nextMax.date)} vuonna ${nextMax.year}.`,
    );
  } else {
    facts.push(
      `Seuraavan kerran ${lower} on aikaisimmassa mahdollisessa päivässään, ${fmtMd(nextMin.date)}, vuonna ${nextMin.year} ja myöhäisimmässä, ${fmtMd(nextMax.date)}, vuonna ${nextMax.year}.`,
    );
  }
  return facts;
}

export function observanceMeta(slug, year) {
  const page = observancePage(slug, year);
  if (!page) return null;
  const extra = page.extras[0];
  const title =
    page.slug === "laskiainen"
      ? `Laskiainen ${page.year}: ${wdm(page.date)} ja ${wdm(extra.date)} | Viikko Nro`
      : `${page.name} ${page.year}: ${wdm(page.date)}, viikko ${page.week} | Viikko Nro`;
  const lead =
    page.slug === "laskiainen"
      ? `Laskiaissunnuntai ${page.year} on ${wdm(page.date)} ja laskiaistiistai ${wdm(extra.date)}`
      : `${page.name} ${page.year} on ${whenFi(page.date)}, viikolla ${page.week}.`;
  return {
    title,
    description: `${lead} Katso päivän määräytyminen, liputus ja päivämäärät tuleville vuosille.`,
  };
}

// Shared by ObservanceDay.jsx (visible <details>) and prerender.js (FAQPage).
export function observanceFaqs(page) {
  const y = page.year;
  const name = page.name;
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  // The headline day's own name: "Laskiaissunnuntai" rather than "Laskiainen".
  const day = page.dayLabel ?? name;
  const next = inRange(y + 1) ? observancePage(page.slug, y + 1) : null;
  const faqs = [
    {
      q: `Milloin on ${lower} ${y}?`,
      a: `${day} ${y} on ${whenFi(page.date)}.${page.extras.length ? ` ${joinFi(page.extras.map((e) => `${e.label} on ${whenFi(e.date)}`))}.` : ""}`,
    },
    {
      q: `Millä viikolla ${lower} ${y} on?`,
      a: `${day} ${y} on ISO-viikolla ${page.week}. Suomessa viikko alkaa maanantaina, joten se on viikon ${page.week} ${page.date.getDay() === 0 ? "viimeinen päivä" : WD[page.date.getDay()].toLowerCase()}.`,
    },
    {
      q: `Miten ${page.genitive} päivämäärä määräytyy?`,
      a: page.rule,
    },
    {
      q: `Onko ${lower} liputuspäivä tai vapaapäivä?`,
      a: page.flagDay,
    },
  ];
  if (next) {
    faqs.push({
      q: `Milloin on ${lower} ${y + 1}?`,
      a: `${day} ${y + 1} on ${whenFi(next.date)}, viikolla ${next.week}.`,
    });
  }
  return faqs;
}

// Other observance pages of the same year, for the sibling links.
export function siblingObservances(slug, year) {
  return OBSERVANCES.filter((o) => o.slug !== slug).map((o) => ({
    to: observancePath(o.slug, year),
    label: `${o.name} ${year}`,
  }));
}
