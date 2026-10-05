import { fmtDayRangeFi, mondayOf } from "../components/dateUtils.js";

// Confidence-tier vocabulary (STEP 2 of the koululomat trust redesign).
// Tier A/CONFIRMED: an official source (ministry or municipality) has
// published this exact date. Indexable, in the sitemap, gets FAQ schema.
// Tier B/ESTIMATED: a historically stable pattern, not yet officially
// confirmed for this specific year — rendered with a visible warning,
// noindex,follow, excluded from the sitemap, no FAQ schema.
// Tier C/UNKNOWN: no source at all. Never given a fabricated date — see
// autumnUnknownCities below, which lists cities by name with no date.
export const CONFIDENCE = Object.freeze({
  CONFIRMED: "confirmed",
  ESTIMATED: "estimated",
  UNKNOWN: "unknown",
});

const CONFIDENCE_LABEL = {
  [CONFIDENCE.CONFIRMED]: "✓ Vahvistettu",
  [CONFIDENCE.ESTIMATED]: "⚠ Arvio",
  [CONFIDENCE.UNKNOWN]: "— Ei vahvistettu",
};

// Visible AND machine-readable (plain text, not an icon font/image) — the
// same string is used in the rendered HTML users see and the sr-only /
// schema-adjacent text AI crawlers parse, so the two can never disagree.
export function confidenceLabel(confidence) {
  return CONFIDENCE_LABEL[confidence] ?? CONFIDENCE_LABEL[CONFIDENCE.UNKNOWN];
}

// Reusable source-metadata shape (STEP 9), attached to every school-holiday
// dataset. verifiedAt mirrors seo.js's CONTENT_UPDATED (2026-08-05) — not
// imported directly, to avoid a circular import (seo.js imports this file),
// so keep the two in sync by hand when either is next bumped.
const SOURCES_VERIFIED_AT = "2026-08-05";

export const SCHOOL_HOLIDAY_SOURCES = {
  oph2025: {
    source: "Opetushallitus",
    label: "Opetushallitus: lukuvuosi 2025–2026",
    url: "https://www.oph.fi/fi/uutiset/2025/koulujen-tyo-ja-loma-ajat-lukuvuonna-2025-2026",
    sourceUrl: "https://www.oph.fi/fi/uutiset/2025/koulujen-tyo-ja-loma-ajat-lukuvuonna-2025-2026",
    verifiedAt: SOURCES_VERIFIED_AT,
    confidence: CONFIDENCE.CONFIRMED,
  },
  oph2026: {
    source: "Opetushallitus",
    label: "Opetushallitus: lukuvuosi 2026–2027",
    url: "https://www.oph.fi/fi/uutiset/2026/koulujen-tyo-ja-loma-ajat-lukuvuonna-2026-2027",
    sourceUrl: "https://www.oph.fi/fi/uutiset/2026/koulujen-tyo-ja-loma-ajat-lukuvuonna-2026-2027",
    verifiedAt: SOURCES_VERIFIED_AT,
    confidence: CONFIDENCE.CONFIRMED,
  },
  helsinki: {
    source: "Helsingin kaupunki",
    label: "Helsingin kaupunki: koulujen työ- ja loma-ajat",
    url: "https://www.hel.fi/fi/kasvatus-ja-koulutus/koulujen-ja-oppilaitosten-tyo-ja-loma-ajat",
    sourceUrl: "https://www.hel.fi/fi/kasvatus-ja-koulutus/koulujen-ja-oppilaitosten-tyo-ja-loma-ajat",
    verifiedAt: SOURCES_VERIFIED_AT,
    confidence: CONFIDENCE.CONFIRMED,
  },
  oulu: {
    source: "Oulun kaupunki",
    label: "Oulun kaupunki: koulujen työ- ja loma-ajat",
    url: "https://www.ouka.fi/opiskelu-perusopetuksessa/koulujen-tyo-ja-loma-ajat",
    sourceUrl: "https://www.ouka.fi/opiskelu-perusopetuksessa/koulujen-tyo-ja-loma-ajat",
    verifiedAt: SOURCES_VERIFIED_AT,
    confidence: CONFIDENCE.CONFIRMED,
  },
};

const WINTER_CITIES = {
  8: ["Helsinki", "Espoo", "Vantaa", "Pori", "Turku"],
  9: [
    "Hämeenlinna",
    "Jyväskylä",
    "Kokkola",
    "Kotka",
    "Kouvola",
    "Lahti",
    "Lappeenranta",
    "Mikkeli",
    "Seinäjoki",
    "Tampere",
    "Vaasa",
  ],
  10: ["Joensuu", "Kajaani", "Kuopio", "Oulu", "Rovaniemi"],
};

// confidence defaults to CONFIRMED because every weekGroup() call site today
// cites a named official source (see sourceKey / SCHOOL_HOLIDAY_SOURCES) —
// it is not a blanket assumption. A future call site representing a
// historically-stable-but-unconfirmed pattern should pass
// CONFIDENCE.ESTIMATED explicitly; see schoolHolidayPages.test.js for a
// worked example of what that does to metadata/sitemap/schema.
function weekGroup(year, week, cities, sourceKey, endOnSunday = false, confidence = CONFIDENCE.CONFIRMED) {
  const startDate = mondayOf(week, year);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (endOnSunday ? 6 : 4));
  return { week, startDate, endDate, cities, sourceKey, confidence, coverage: "city-comparison" };
}

const PAGES = {
  2026: {
    year: 2026,
    winter: [
      weekGroup(2026, 8, WINTER_CITIES[8], "oph2025"),
      weekGroup(2026, 9, WINTER_CITIES[9], "oph2025"),
      weekGroup(2026, 10, WINTER_CITIES[10], "oph2025"),
    ],
    autumn: [
      weekGroup(
        2026,
        42,
        [
          "Helsinki",
          "Espoo",
          "Vantaa",
          "Hämeenlinna",
          "Joensuu",
          "Jyväskylä",
          "Kajaani",
          "Kokkola",
          "Kuopio",
          "Rovaniemi",
          "Seinäjoki",
          "Tampere",
          "Turku",
          "Vaasa",
        ],
        "oph2026",
      ),
      weekGroup(
        2026,
        43,
        ["Kotka", "Kouvola", "Lahti", "Lappeenranta", "Mikkeli", "Oulu", "Pori"],
        "oph2026",
        true,
      ),
    ],
    otherPeriods: [
      "Lukuvuosi 2025–2026 päättyi peruskouluissa lauantaina 30.5.2026.",
      "Lukuvuosi 2026–2027 alkoi useimmissa kunnissa 12.–13.8.2026.",
      "Joululoma 2026 alkoi kunnasta riippuen yleensä 20.–23.12. ja päättyi useimmiten 6.1.2027.",
    ],
    coverageNote:
      "Taulukko vertaa Manner-Suomen maakuntien pääkaupunkien perusopetusta. Oman koulun päivät voivat poiketa kunnan yleisistä päivistä.",
    sourceKeys: ["oph2025", "oph2026"],
  },
  2027: {
    year: 2027,
    winter: [
      weekGroup(2027, 8, WINTER_CITIES[8], "oph2026"),
      weekGroup(2027, 9, WINTER_CITIES[9], "oph2026"),
      weekGroup(2027, 10, WINTER_CITIES[10], "oph2026"),
    ],
    autumn: [
      {
        ...weekGroup(2027, 42, ["Helsinki"], "helsinki"),
        coverage: "confirmed-city",
      },
    ],
    // Tier C (STEP 2): these cities are known to exist and will eventually
    // publish an autumn 2027 date, but nothing is sourced for them yet. Named
    // explicitly, with no date attached, rather than either inventing a date
    // or silently omitting them — the same comparison-city set as 2026's
    // autumn table, minus Helsinki (which has its own confirmed row above).
    autumnUnknownCities: [
      "Espoo", "Vantaa", "Hämeenlinna", "Joensuu", "Jyväskylä", "Kajaani",
      "Kokkola", "Kotka", "Kouvola", "Kuopio", "Lahti", "Lappeenranta",
      "Mikkeli", "Oulu", "Pori", "Rovaniemi", "Seinäjoki", "Tampere",
      "Turku", "Vaasa",
    ],
    otherPeriods: [
      "Lukuvuosi 2026–2027 päättyy peruskouluissa lauantaina 5.6.2027.",
      "Helsingin lukuvuosi 2027–2028 alkaa 11.8.2027; muiden kuntien aloituspäivät tarkistetaan niiden omista päätöksistä.",
      "Helsingin joululoma on 23.12.2027–7.1.2028. Tätä ajankohtaa ei pidä yleistää kaikkiin kuntiin.",
    ],
    coverageNote:
      "Talvilomavertailu kattaa Manner-Suomen maakuntien pääkaupunkeja. Syksyn 2027 taulukossa näytetään vain erikseen vahvistettu Helsinki; tarkista muut kunnat niiden omilta sivuilta.",
    sourceKeys: ["oph2026", "helsinki", "oulu"],
  },
};

export const schoolHolidayYears = Object.keys(PAGES).map(Number);

export function schoolHolidayPage(year) {
  return PAGES[Number(year)] || null;
}

// The page's overall trust tier (STEP 2), computed from its data rather than
// hand-set per year, so a future entry that passes CONFIDENCE.ESTIMATED to
// weekGroup() automatically demotes the whole page — nobody has to remember
// to also flip a separate "is this page trustworthy" flag. autumnUnknownCities
// (Tier C) never affects this: naming a city with no date attached is honest
// transparency, not a claim that could turn out wrong, so it doesn't drag a
// page below CONFIRMED the way a presented ESTIMATED date would.
// Pure, exported separately from pageConfidenceTier() so the tier-rollup
// rule itself (any ESTIMATED group demotes the whole page) is unit-testable
// against a synthetic fixture — without needing to add a real, unconfirmed
// year to PAGES just to exercise this path (see schoolHolidayPages.test.js).
export function tierFromGroups(groups) {
  return groups.some((group) => group.confidence === CONFIDENCE.ESTIMATED)
    ? CONFIDENCE.ESTIMATED
    : CONFIDENCE.CONFIRMED;
}

export function pageConfidenceTier(year) {
  const page = schoolHolidayPage(year);
  if (!page) return CONFIDENCE.UNKNOWN;
  return tierFromGroups([...page.winter, ...page.autumn]);
}

// "Syysloma 2026 on viikolla 42 (12.-16.10.) tai 43 (19.-25.10.) kunnasta
// riippuen." Built from the page's own autumn groups, so the snippet can only
// state weeks and dates the visible table also shows. A single confirmed city
// (2027: Helsinki only) is named rather than generalized to every municipality.
export function autumnSummary(page) {
  const groups = page.autumn;
  if (groups.length === 0) {
    return `Syysloma ${page.year} ajoittuu yleensä lokakuulle, viikolle 42 tai 43.`;
  }
  const part = (g) => `${g.week} (${fmtDayRangeFi(g.startDate, g.endDate)})`;
  if (groups.length === 1 && groups[0].cities.length === 1) {
    return `Syysloma ${page.year}: ${groups[0].cities[0]} viikolla ${part(groups[0])}, muut kunnat ilmoittavat omansa.`;
  }
  const weeks = groups.map(part);
  const list =
    weeks.length === 1 ? weeks[0] : `${weeks.slice(0, -1).join(", ")} tai ${weeks[weeks.length - 1]}`;
  return `Syysloma ${page.year} on viikolla ${list} kunnasta riippuen.`;
}

export function schoolHolidayMeta(year) {
  const page = schoolHolidayPage(year);
  if (!page) return null;
  const tier = pageConfidenceTier(year);
  // Leads with "Syysloma <year>", the page's largest query, and states the
  // real autumn weeks and dates from page.autumn instead of generic copy.
  const base = {
    title: `Syysloma ${year} ja hiihtoloma ${year}: koululomat | Viikko Nro`,
    description: `${autumnSummary(page)} Hiihtoloma ${year} on viikoilla 8-10. Katso koululomat alueittain.`,
  };
  // STEP 4: Tier B pages must noindex,follow and their description must
  // carry the exact required disclaimer — not a paraphrase, so it reads
  // identically everywhere it appears (meta description, visible banner).
  if (tier === CONFIDENCE.ESTIMATED) {
    return {
      ...base,
      description: `${base.description} Tiedot perustuvat aiempien vuosien käytäntöihin eikä niitä ole vielä vahvistettu.`,
      robots: "noindex, follow",
    };
  }
  return base;
}

export const TIER_B_NOTICE =
  "Tiedot perustuvat aiempien vuosien käytäntöihin eikä niitä ole vielä vahvistettu.";

export function schoolHolidayFaqs(year) {
  // STEP 7: FAQPage JSON-LD (and the visible FAQ block, which reads from
  // this same function) only ever exist for Tier A — never amplify an
  // estimate or an unknown into a structured "answer".
  if (pageConfidenceTier(year) !== CONFIDENCE.CONFIRMED) return [];
  const page = schoolHolidayPage(year);
  if (!page) return [];
  const winter = page.winter
    .map((group) => `viikko ${group.week}: ${group.cities.join(", ")}`)
    .join("; ");
  return [
    {
      q: `Milloin hiihtoloma ${year} on?`,
      a: `Hiihtoloma ${year} pidetään alueittain viikoilla 8–10. Kaupunkivertailu: ${winter}.`,
    },
    {
      q: `Milloin syysloma ${year} on?`,
      a:
        year === 2026
          ? `${autumnSummary(page)} ${page.autumn.map((g) => `Viikolla ${g.week} lomailevat esimerkiksi ${g.cities.slice(0, 3).join(", ")}.`).join(" ")} Tarkka päivämäärä riippuu kunnasta ja koulusta.`
          : "Helsingin vahvistettu syysloma 2027 on viikolla 42 eli 18.–22.10. Muiden kuntien päivät on tarkistettava kunnan omalta sivulta.",
    },
    {
      q: "Onko hiihtoloma samaan aikaan koko Suomessa?",
      a: "Ei. Talvi- eli hiihtoloma porrastetaan tavallisesti viikoille 8, 9 ja 10, ja opetuksen järjestäjä päättää tarkat loma-ajat.",
    },
    {
      q: "Ovatko taulukon koululomat voimassa kaikissa kouluissa?",
      a: "Eivät välttämättä. Vertailu koskee pääasiassa kaupunkien perusopetusta. Esiopetuksen, lukioiden, ammatillisten oppilaitosten ja yksittäisten koulujen ajat voivat poiketa.",
    },
    {
      q: "Mistä koululomien päivämäärät on tarkistettu?",
      a: "Päivämäärät perustuvat Opetushallituksen kuntavertailuihin sekä Helsingin ja Oulun kaupunkien virallisiin työ- ja loma-aikoihin.",
    },
    {
      q: "Mistä löydän oman kouluni varmasti ajantasaiset loma-ajat?",
      a: "Tarkista oman kunnan tai koulun verkkosivu ja Wilma. Kunnan yleiseen kalenteriin voi tulla koulu- tai oppilaitoskohtaisia poikkeuksia.",
    },
  ];
}

// STEP 6: week pages must not surface (and therefore not link to) an
// estimated school-holiday period as if it were settled fact — only
// CONFIRMED groups are ever returned here, regardless of what the
// school-holiday page itself additionally shows with its own visible caveat.
export function schoolHolidayPeriodsInWeek(year, week) {
  const page = schoolHolidayPage(year);
  if (!page) return [];
  return [
    ...page.winter.map((group) => ({ ...group, type: "hiihtoloma" })),
    ...page.autumn.map((group) => ({ ...group, type: "syysloma" })),
  ]
    .filter((group) => group.week === Number(week) && group.confidence === CONFIDENCE.CONFIRMED)
    .map((group) => ({
      ...group,
      schoolYear: String(year),
      regionName: group.cities.join(", "),
      sourceUrl: SCHOOL_HOLIDAY_SOURCES[group.sourceKey].url,
    }));
}
