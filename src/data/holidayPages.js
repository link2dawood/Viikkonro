import {
  fmtDayRangeFi,
  fmtFullFi,
  fmtShortFi,
  isoWeek,
  isoYear,
  M_GENITIVE,
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
  WD,
  WD_ESSIVE,
} from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";

// One editorial record per holiday. Dates and official status always come
// from holidays.js; this registry only supplies stable URLs and explanatory
// copy for the programmatic landing pages.
export const HOLIDAY_DEFINITIONS = [
  {
    slug: "uudenvuodenpaiva",
    sourceName: "Uudenvuodenpäivä",
    displayName: "Uudenvuodenpäivä",
    seoName: "Uudenvuodenpäivä",
    rule: "Uudenvuodenpäivää vietetään aina 1. tammikuuta.",
    kind: "kiinteä pyhäpäivä",
  },
  {
    slug: "loppiainen",
    sourceName: "Loppiainen",
    displayName: "Loppiainen",
    seoName: "Loppiainen",
    rule: "Loppiaista vietetään aina 6. tammikuuta.",
    kind: "kiinteä pyhäpäivä",
  },
  {
    slug: "pitkaperjantai",
    sourceName: "Pitkäperjantai",
    displayName: "Pitkäperjantai",
    seoName: "Pitkäperjantai",
    rule: "Pitkäperjantai on kaksi päivää ennen pääsiäissunnuntaita.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "paasiaispaiva",
    sourceName: "1. pääsiäispäivä",
    displayName: "Pääsiäispäivä",
    seoName: "Pääsiäinen",
    rule: "Pääsiäispäivä on kevätpäiväntasausta seuraavan täydenkuun jälkeinen sunnuntai kirkollisen laskennan mukaan.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "toinen-paasiaispaiva",
    sourceName: "2. pääsiäispäivä",
    displayName: "Toinen pääsiäispäivä",
    seoName: "2. pääsiäispäivä",
    rule: "Toinen pääsiäispäivä on pääsiäissunnuntaita seuraava maanantai.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "vappu",
    sourceName: "Vappu",
    displayName: "Vappu",
    seoName: "Vappu",
    rule: "Vappua vietetään aina 1. toukokuuta.",
    kind: "kiinteä pyhäpäivä",
  },
  {
    slug: "helatorstai",
    sourceName: "Helatorstai",
    displayName: "Helatorstai",
    seoName: "Helatorstai",
    rule: "Helatorstai on 39 päivää pääsiäissunnuntain jälkeen ja osuu aina torstaille.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "helluntaipaiva",
    sourceName: "Helluntai",
    displayName: "Helluntaipäivä",
    seoName: "Helluntai",
    rule: "Helluntaipäivä on 49 päivää pääsiäissunnuntain jälkeen ja osuu aina sunnuntaille.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "juhannusaatto",
    sourceName: "Juhannusaatto",
    displayName: "Juhannusaatto",
    seoName: "Juhannusaatto",
    rule: "Juhannusaatto on juhannuspäivää edeltävä perjantai, joten se osuu 19.–25. kesäkuuta.",
    kind: "liikkuva juhlapäivä",
  },
  {
    slug: "juhannuspaiva",
    sourceName: "Juhannuspäivä",
    displayName: "Juhannuspäivä",
    seoName: "Juhannus",
    rule: "Juhannuspäivä on 20.–26. kesäkuuta väliin osuva lauantai.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "pyhainpaiva",
    sourceName: "Pyhäinpäivä",
    displayName: "Pyhäinpäivä",
    seoName: "Pyhäinpäivä",
    rule: "Pyhäinpäivä on 31. lokakuuta ja 6. marraskuuta välille osuva lauantai.",
    kind: "liikkuva pyhäpäivä",
  },
  {
    slug: "itsenaisyyspaiva",
    sourceName: "Itsenäisyyspäivä",
    displayName: "Itsenäisyyspäivä",
    seoName: "Itsenäisyyspäivä",
    rule: "Suomen itsenäisyyspäivää vietetään aina 6. joulukuuta.",
    kind: "kiinteä pyhäpäivä",
  },
  {
    slug: "jouluaatto",
    sourceName: "Jouluaatto",
    displayName: "Jouluaatto",
    seoName: "Jouluaatto",
    rule: "Jouluaattoa vietetään aina 24. joulukuuta.",
    kind: "kiinteä juhlapäivä",
  },
  {
    slug: "joulupaiva",
    sourceName: "Joulupäivä",
    displayName: "Joulupäivä",
    seoName: "Joulupäivä",
    rule: "Joulupäivää vietetään aina 25. joulukuuta.",
    kind: "kiinteä pyhäpäivä",
  },
  {
    slug: "tapaninpaiva",
    sourceName: "Tapaninpäivä",
    displayName: "Tapaninpäivä",
    seoName: "Tapaninpäivä",
    rule: "Tapaninpäivää vietetään aina 26. joulukuuta.",
    kind: "kiinteä pyhäpäivä",
  },
];

const BY_SLUG = new Map(HOLIDAY_DEFINITIONS.map((item) => [item.slug, item]));
const BY_SOURCE_NAME = new Map(
  HOLIDAY_DEFINITIONS.map((item) => [item.sourceName, item]),
);

export function holidaySlugForName(name) {
  return BY_SOURCE_NAME.get(name)?.slug ?? null;
}

// Path for linking a holiday MENTION (e.g. on a week page) to its dedicated
// page — or null when it shouldn't be linked. `date` is the holiday's own
// calendar date, not necessarily the caller's page year: a week can straddle
// a year boundary (ISO week 1 often starts in late December), so the correct
// year for the link is always the holiday's own date, not the week's ISO
// year. Bounds-checked against the prerendered horizon so a boundary week can
// never link a page that would 404 — the same discipline WeekDays.jsx's
// monthLink already applies to month links. Works uniformly for fixed dates
// (Vappu) and movable ones (pääsiäinen, juhannus, pyhäinpäivä): both resolve
// through the same holidaysInYear()-derived date, so there's no special case.
export function holidayLinkPath(name, date) {
  const slug = holidaySlugForName(name);
  if (!slug) return null;
  const year = date.getFullYear();
  if (year < PRERENDER_MIN_YEAR || year > PRERENDER_MAX_YEAR) return null;
  return `/pyhat-${year}/${slug}`;
}

export function holidayPageFor(year, slug) {
  const y = Number(year);
  const definition = BY_SLUG.get(slug);
  if (!definition || !Number.isInteger(y)) return null;
  const holiday = holidaysInYear(y).find(
    (item) => item.name === definition.sourceName,
  );
  if (!holiday) return null;
  return {
    ...definition,
    year: y,
    date: holiday.date,
    official: holiday.official,
    week: isoWeek(holiday.date),
    weekYear: isoYear(holiday.date),
    month: holiday.date.getMonth() + 1,
    weekday: WD[holiday.date.getDay()],
    weekdayEssive: WD_ESSIVE[holiday.date.getDay()],
    path: `/pyhat-${y}/${slug}`,
  };
}

// Reusable Holiday -> Week/Month/Year cross-links (bidirectional linking
// system). Takes a resolved holidayPageFor() page and returns the three
// paths plus contextual (not "click here") anchor text, so NamedHoliday.jsx
// and prerender.js's structured-data `mentions` build from the exact same
// source instead of each re-deriving the URLs by hand. The reverse
// direction (a week/month page linking back to a holiday it contains) is
// handled by holidayLinkPath() below, which takes a bare name+date rather
// than a resolved page — the two aren't merged into one function because
// they serve different call shapes, not because of overlapping logic.
export function holidayWeekLinks(page) {
  return {
    week: {
      path: `/viikko-${page.week}-${page.weekYear}`,
      label: `viikko ${page.week}`,
    },
    month: {
      path: `/kuukausi-${page.month}-${page.year}`,
      label: `${M_GENITIVE[page.month - 1]} ${page.year}`,
    },
    year: {
      path: `/vuosi-${page.year}`,
      label: `vuoden ${page.year} viikkonumerot`,
    },
  };
}

// The three official Easter holidays (pitkäperjantai, pääsiäispäivä, toinen
// pääsiäispäivä) as resolved pages, in date order. "Pääsiäinen <year>" is
// searched as the whole long weekend, not only its Sunday, so the Easter
// pages state all three dates; each date comes from holidays.js via
// holidayPageFor(), never from a separate Easter calculation.
export const EASTER_SLUGS = ["pitkaperjantai", "paasiaispaiva", "toinen-paasiaispaiva"];

export function easterHolidays(year) {
  const pages = EASTER_SLUGS.map((slug) => holidayPageFor(year, slug));
  return pages.every(Boolean) ? pages : null;
}

// "Pitkäperjantai 26.3., pääsiäispäivä 28.3. ja toinen pääsiäispäivä 29.3.2027"
function easterDatesText(easter) {
  const [friday, sunday, monday] = easter;
  const short = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
  return `pitkäperjantai ${short(friday.date)}, pääsiäispäivä ${short(sunday.date)} ja toinen pääsiäispäivä ${short(monday.date)}${monday.date.getFullYear()}`;
}

function easterWeeksText(easter) {
  const [friday, , monday] = easter;
  return friday.week === monday.week
    ? `viikolla ${friday.week}`
    : `viikoilla ${friday.week}-${monday.week}`;
}

export function holidayPageMeta(year, slug) {
  const page = holidayPageFor(year, slug);
  if (!page) return null;
  const easter = slug === "paasiaispaiva" ? easterHolidays(page.year) : null;
  if (easter) {
    const [friday, , monday] = easter;
    const weeks = friday.week === monday.week ? `viikko ${friday.week}` : `viikot ${friday.week}-${monday.week}`;
    let description = `Pääsiäinen ${page.year}: ${easterDatesText(easter)}. Pääsiäisen pyhät ovat ${easterWeeksText(easter)}. Katso päivämäärät ja viikonpäivät.`;
    if (description.length > 158) {
      description = description.replace(" ja viikonpäivät", "");
    }
    return {
      title: `Pääsiäinen ${page.year}: ${fmtDayRangeFi(friday.date, monday.date)}, ${weeks} | Viikko Nro`,
      description,
    };
  }
  let description = `${page.displayName} vuonna ${page.year} on ${page.weekdayEssive} ${fmtFullFi(page.date)} ja kuuluu viikkoon ${page.week}. Katso päivämäärä, viikonpäivä, viikkonumero, asema ja määräytymissääntö.`;
  if (description.length > 158) {
    description = description.replace(", asema ja", " ja");
  }
  return {
    title: `${page.seoName} ${page.year} – ${fmtShortFi(page.date)}, viikko ${page.week} | Viikko Nro`,
    description,
  };
}

export function holidayFaqs(page) {
  const status = page.official
    ? `${page.displayName} on Suomessa virallinen pyhäpäivä.`
    : `${page.displayName} ei ole Suomessa virallinen pyhäpäivä, vaikka sitä vietetään laajasti vapaapäivänä.`;
  return [
    {
      q: `Milloin ${page.displayName.toLowerCase()} on vuonna ${page.year}?`,
      a: `${page.displayName} on ${page.weekdayEssive} ${fmtFullFi(page.date)}.`,
    },
    {
      q: `Mille viikolle ${page.displayName.toLowerCase()} ${page.year} osuu?`,
      a: `${page.displayName} kuuluu viikkoon ${page.week} vuonna ${page.weekYear}.`,
    },
    {
      q: `Mikä viikonpäivä ${page.displayName.toLowerCase()} ${page.year} on?`,
      a: `${fmtFullFi(page.date)} on ${page.weekdayEssive}.`,
    },
    {
      q: `Onko ${page.displayName.toLowerCase()} virallinen pyhäpäivä?`,
      a: status,
    },
    {
      q: `Miten ${page.displayName.toLowerCase()} päivämäärä määräytyy?`,
      a: page.rule,
    },
    ...easterFaq(page),
  ];
}

// Extra FAQ for the three Easter pages only: when the whole Easter weekend
// falls. Part of holidayFaqs(), so the visible FAQ and FAQPage JSON-LD stay
// identical (NamedHoliday.jsx and prerender.js both read holidayFaqs()).
function easterFaq(page) {
  if (!EASTER_SLUGS.includes(page.slug)) return [];
  const easter = easterHolidays(page.year);
  if (!easter) return [];
  const text = easterDatesText(easter);
  return [
    {
      q: `Milloin pääsiäinen ${page.year} on?`,
      a: `Pääsiäisen pyhät ${page.year} ovat ${text}. Ne ovat ${easterWeeksText(easter)}, ja pääsiäispäivä on aina sunnuntai.`,
    },
  ];
}
