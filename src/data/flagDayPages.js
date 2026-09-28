// Content data for /liputuspaivat-{year} — Finland's flag days (liputuspäivät).
// Plain .js (not .jsx) so prerender.js can import it directly, same reason
// dateUtils.js/seo.js are plain JS (see CLAUDE.md). All date math is
// deterministic (no bare `new Date()`), so SSR and hydration always agree.
//
// This does NOT define a new list of flag days — it classifies and enriches
// the 14 names juhlapaivat.js's getLiputuspaivat() already returns (the
// site's one existing, already-shipped flag-day source), so nothing here can
// drift from what CalendarYear.jsx already renders as flag markers.
import { fmtFullFi, isoWeek, isoYear, getWeekdayName } from "../components/dateUtils.js";
import { getJuhlapaivat, getLiputuspaivat } from "./juhlapaivat.js";

// Category label per name, corrected 2026-09-28. "virallinen" means the day is
// in the flag-day decree 383/1978: of the names below that is Kalevalan päivä,
// Äitienpäivä, Puolustusvoimain lippujuhlan päivä and Isänpäivä (isänpäivä
// since the amendment of 14.3.2019; valtioneuvosto.fi press release,
// almanakka.helsinki.fi and intermin.fi agree). Every other day is a
// "vakiintunut" (customary) flag day on the list the University of Helsinki
// publishes, with Eurooppa-päivä and YK:n päivä kept under their own
// "kansainvälinen" label. This labels the existing 14 names; it does not add
// or remove any.
const FLAG_DAY_CATEGORY = {
  "J. L. Runebergin päivä": "vakiintunut",
  "Kalevalan päivä": "virallinen",
  "Minna Canthin päivä": "vakiintunut",
  "Mikael Agricolan päivä / Suomen kielen päivä": "vakiintunut",
  "J. V. Snellmanin päivä": "vakiintunut",
  "Puolustusvoimain lippujuhlan päivä": "virallinen",
  "Eino Leinon päivä": "vakiintunut",
  "Aleksis Kiven päivä": "vakiintunut",
  "Ruotsalaisuuden päivä": "vakiintunut",
  "Jean Sibeliuksen päivä": "vakiintunut",
  "Äitienpäivä": "virallinen",
  "Isänpäivä": "virallinen",
  "Eurooppa-päivä": "kansainvälinen",
  "YK:n päivä": "kansainvälinen",
};

const CATEGORY_LABEL = {
  virallinen: "Virallinen liputuspäivä",
  vakiintunut: "Vakiintunut liputuspäivä",
  kansainvälinen: "Kansainvälinen merkkipäivä",
};

// ASCII slugs — used as anchor ids on the /liputuspaivat-<year> table rows
// (so e.g. Month pages can deep-link to one flag day) and reserved for a
// possible future /liputuspaivat/<slug> route family (STEP 2's "optional
// future routes" — not built in this pass).
const FLAG_DAY_SLUGS = {
  "J. L. Runebergin päivä": "runebergin-paiva",
  "Kalevalan päivä": "kalevalan-paiva",
  "Minna Canthin päivä": "minna-canthin-paiva",
  "Mikael Agricolan päivä / Suomen kielen päivä": "suomen-kielen-paiva",
  "J. V. Snellmanin päivä": "snellmanin-paiva",
  "Puolustusvoimain lippujuhlan päivä": "suomen-lipun-paiva",
  "Eino Leinon päivä": "eino-leinon-paiva",
  "Aleksis Kiven päivä": "aleksis-kiven-paiva",
  "Ruotsalaisuuden päivä": "ruotsalaisuuden-paiva",
  "Jean Sibeliuksen päivä": "sibeliuksen-paiva",
  "Äitienpäivä": "aitienpaiva",
  "Isänpäivä": "isanpaiva",
  "Eurooppa-päivä": "eurooppa-paiva",
  "YK:n päivä": "ykn-paiva",
};

// Puolustusvoimain lippujuhlan päivä (4 June) is also widely known as "Suomen
// lipun päivä" — same day, two names. Kept as an explicit alt-name mapping
// (not a second flag day) so the FAQ can answer either phrasing with the one
// real, computed date.
const ALT_NAME = {
  "Puolustusvoimain lippujuhlan päivä": "Suomen lipun päivä",
};

// All of a year's flag days, in date order, each carrying the same
// week/weekday/holiday-overlap facts the rest of the site already exposes —
// computed from getLiputuspaivat()/getJuhlapaivat() (juhlapaivat.js) and
// isoWeek()/getWeekdayName() (dateUtils.js), not re-derived here.
export function flagDaysInYear(year) {
  const flagMap = getLiputuspaivat(year);
  const holidayMap = getJuhlapaivat(year);
  const rows = [];
  for (const [mmdd, names] of flagMap) {
    const [mm, dd] = mmdd.split("-").map(Number);
    const date = new Date(year, mm - 1, dd);
    const holidayOverlap = holidayMap.get(mmdd) ?? null;
    for (const name of names) {
      rows.push({
        name,
        altName: ALT_NAME[name] ?? null,
        slug: FLAG_DAY_SLUGS[name],
        category: FLAG_DAY_CATEGORY[name],
        categoryLabel: CATEGORY_LABEL[FLAG_DAY_CATEGORY[name]],
        date,
        month: mm,
        week: isoWeek(date),
        weekYear: isoYear(date),
        weekday: getWeekdayName(date),
        holidayOverlap,
      });
    }
  }
  return rows.sort((a, b) => a.date - b.date);
}

export function flagDaysMeta(year) {
  const days = flagDaysInYear(year);
  const suomenLipunPaiva = days.find((d) => d.altName === "Suomen lipun päivä");
  const highlights = [days[0].name, suomenLipunPaiva?.altName].filter(Boolean);
  return {
    title: `Liputuspäivät ${year} | Viikko Nro`,
    description: `Vuonna ${year} Suomessa on ${days.length} liputuspäivää, muun muassa ${highlights.join(" ja ")}. Katso kaikki päivämäärät, viikonpäivät ja viikkonumerot.`,
  };
}

// Shared by FlagDays.jsx (visible <details> list) and prerender.js's FAQPage
// JSON-LD — same visible/schema-parity discipline as every other FAQ set in
// this codebase. Exactly 4 questions (within the 3–5 cap), every answer
// computed from flagDaysInYear() so nothing here can drift from the visible
// table or the CollectionPage schema.
export function flagDayFaqs(year) {
  const days = flagDaysInYear(year);
  const nameList = days
    .map((d) => (d.altName ? `${d.name} (${d.altName})` : d.name))
    .join(", ");
  const suomenLipunPaiva = days.find((d) => d.altName === "Suomen lipun päivä");
  const overlapping = days.filter((d) => d.holidayOverlap);

  return [
    {
      q: `Mitkä ovat vuoden ${year} liputuspäivät?`,
      a: `Vuoden ${year} liputuspäivät ovat: ${nameList}.`,
    },
    {
      q: `Kuinka monta liputuspäivää Suomessa on vuonna ${year}?`,
      a: `Vuonna ${year} Suomessa on ${days.length} liputuspäivää.`,
    },
    {
      q: `Milloin Suomen lipun päivä on vuonna ${year}?`,
      a: `Suomen lipun päivä (Puolustusvoimain lippujuhlan päivä) on ${fmtFullFi(suomenLipunPaiva.date)}.`,
    },
    {
      q: "Onko liputuspäivä aina arkipyhä?",
      a:
        overlapping.length > 0
          ? `Ei aina, mutta joskus kyllä: vuonna ${year} ${overlapping.map((d) => d.name).join(", ")} osuu samalle päivälle kuin ${overlapping.map((d) => d.holidayOverlap).join(", ")}. Suurin osa liputuspäivistä ei kuitenkaan ole virallisia arkipyhiä.`
          : `Ei. Vuonna ${year} yksikään liputuspäivä ei osu samalle päivälle kuin virallinen arkipyhä.`,
    },
  ];
}
