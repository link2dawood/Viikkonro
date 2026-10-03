// Content data for /liputuspaivat-{year} — Finland's flag days (liputuspäivät).
// Plain .js (not .jsx) so prerender.js can import it directly, same reason
// dateUtils.js/seo.js are plain JS (see CLAUDE.md). All date math is
// deterministic (no bare `new Date()`), so SSR and hydration always agree.
//
// Classifies and enriches the flag days juhlapaivat.js's getLiputuspaivat()
// returns (the site's one flag-day source), so nothing here can drift from
// what CalendarYear.jsx renders as flag markers.
import { fmtFullFi, isoWeek, isoYear, getWeekdayName, WD_ESSIVE } from "../components/dateUtils.js";
import { getJuhlapaivat, getLiputuspaivat } from "./juhlapaivat.js";

// Category per name, checked 2026-09-28 against almanakka.helsinki.fi,
// fi.wikipedia.org/wiki/Luettelo_Suomen_liputuspäivistä and the
// valtioneuvosto.fi press release on isänpäivä. "virallinen" = in the
// flag-day decree 383/1978 (isänpäivä since the amendment of 14.3.2019);
// "vakiintunut" = customary flag day on the University of Helsinki list;
// Eurooppa-päivä and YK:n päivä are customary too but keep their own
// "kansainvälinen" label.
const FLAG_DAY_CATEGORY = {
  "J. L. Runebergin päivä": "vakiintunut",
  "Kalevalan päivä": "virallinen",
  "Minna Canthin päivä": "vakiintunut",
  "Mikael Agricolan päivä / Suomen kielen päivä": "vakiintunut",
  "Kansallinen veteraanipäivä": "vakiintunut",
  "Vappu": "virallinen",
  "Eurooppa-päivä": "kansainvälinen",
  "J. V. Snellmanin päivä": "vakiintunut",
  "Äitienpäivä": "virallinen",
  "Kaatuneitten muistopäivä": "vakiintunut",
  "Puolustusvoimain lippujuhlan päivä": "virallinen",
  "Juhannuspäivä": "virallinen",
  "Eino Leinon päivä": "vakiintunut",
  "Suomen luonnon päivä": "vakiintunut",
  "Miina Sillanpään päivä": "vakiintunut",
  "Aleksis Kiven päivä": "vakiintunut",
  "YK:n päivä": "kansainvälinen",
  "Ruotsalaisuuden päivä": "vakiintunut",
  "Isänpäivä": "virallinen",
  "Lapsen oikeuksien päivä": "vakiintunut",
  "Itsenäisyyspäivä": "virallinen",
  "Jean Sibeliuksen päivä": "vakiintunut",
};

const CATEGORY_LABEL = {
  virallinen: "Virallinen liputuspäivä",
  vakiintunut: "Vakiintunut liputuspäivä",
  kansainvälinen: "Kansainvälinen merkkipäivä",
};

// ASCII slugs, used as anchor ids on the /liputuspaivat-<year> table rows (so
// month pages and the ICS feed can deep-link to one flag day). "Suomen lipun
// päivä" is juhannuspäivä, not 4.6., so that slug now points at juhannus.
const FLAG_DAY_SLUGS = {
  "J. L. Runebergin päivä": "runebergin-paiva",
  "Kalevalan päivä": "kalevalan-paiva",
  "Minna Canthin päivä": "minna-canthin-paiva",
  "Mikael Agricolan päivä / Suomen kielen päivä": "suomen-kielen-paiva",
  "Kansallinen veteraanipäivä": "veteraanipaiva",
  "Vappu": "vappu",
  "Eurooppa-päivä": "eurooppa-paiva",
  "J. V. Snellmanin päivä": "snellmanin-paiva",
  "Äitienpäivä": "aitienpaiva",
  "Kaatuneitten muistopäivä": "kaatuneitten-muistopaiva",
  "Puolustusvoimain lippujuhlan päivä": "puolustusvoimain-lippujuhla",
  "Juhannuspäivä": "suomen-lipun-paiva",
  "Eino Leinon päivä": "eino-leinon-paiva",
  "Suomen luonnon päivä": "suomen-luonnon-paiva",
  "Miina Sillanpään päivä": "miina-sillanpaan-paiva",
  "Aleksis Kiven päivä": "aleksis-kiven-paiva",
  "YK:n päivä": "ykn-paiva",
  "Ruotsalaisuuden päivä": "ruotsalaisuuden-paiva",
  "Isänpäivä": "isanpaiva",
  "Lapsen oikeuksien päivä": "lapsen-oikeuksien-paiva",
  "Itsenäisyyspäivä": "itsenaisyyspaiva",
  "Jean Sibeliuksen päivä": "sibeliuksen-paiva",
};

// The day's second official name (almanakka.helsinki.fi), shown in brackets
// so either phrasing finds the one real, computed date.
const ALT_NAME = {
  "Kalevalan päivä": "suomalaisen kulttuurin päivä",
  "Minna Canthin päivä": "tasa-arvon päivä",
  "Vappu": "suomalaisen työn päivä",
  "J. V. Snellmanin päivä": "suomalaisuuden päivä",
  "Juhannuspäivä": "Suomen lipun päivä",
  "Eino Leinon päivä": "runon ja suven päivä",
  "Miina Sillanpään päivä": "kansalaisvaikuttamisen päivä",
  "Aleksis Kiven päivä": "suomalaisen kirjallisuuden päivä",
  "Jean Sibeliuksen päivä": "suomalaisen musiikin päivä",
};

// English and Swedish names, for consumers that render in those languages
// (the viikkonro-extension popup). Every key in FLAG_DAY_CATEGORY has one;
// calendarTools.test.js checks the lists stay in step.
export const FLAG_DAY_NAMES = {
  "J. L. Runebergin päivä": { en: "J. L. Runeberg Day", sv: "J. L. Runebergs dag" },
  "Kalevalan päivä": { en: "Kalevala Day", sv: "Kalevaladagen" },
  "Minna Canthin päivä": { en: "Minna Canth Day", sv: "Minna Canths dag" },
  "Mikael Agricolan päivä / Suomen kielen päivä": {
    en: "Mikael Agricola Day / Day of the Finnish Language",
    sv: "Mikael Agricolas dag / Finska språkets dag",
  },
  "Kansallinen veteraanipäivä": { en: "National Veterans' Day", sv: "Nationella veterandagen" },
  "Vappu": { en: "May Day", sv: "Första maj" },
  "Eurooppa-päivä": { en: "Europe Day", sv: "Europadagen" },
  "J. V. Snellmanin päivä": { en: "J. V. Snellman Day", sv: "J. V. Snellmans dag" },
  "Äitienpäivä": { en: "Mother's Day", sv: "Mors dag" },
  "Kaatuneitten muistopäivä": { en: "Remembrance Day for the Fallen", sv: "De stupades minnesdag" },
  "Puolustusvoimain lippujuhlan päivä": { en: "Flag Day of the Finnish Defence Forces", sv: "Försvarsmaktens fanfest" },
  "Juhannuspäivä": { en: "Midsummer Day", sv: "Midsommardagen" },
  "Eino Leinon päivä": { en: "Eino Leino Day", sv: "Eino Leinos dag" },
  "Suomen luonnon päivä": { en: "Day of Finnish Nature", sv: "Finska naturens dag" },
  "Miina Sillanpään päivä": { en: "Miina Sillanpää Day", sv: "Miina Sillanpääs dag" },
  "Aleksis Kiven päivä": { en: "Aleksis Kivi Day", sv: "Aleksis Kivis dag" },
  "YK:n päivä": { en: "United Nations Day", sv: "FN-dagen" },
  "Ruotsalaisuuden päivä": { en: "Finnish Swedish Heritage Day", sv: "Svenska dagen" },
  "Isänpäivä": { en: "Father's Day", sv: "Fars dag" },
  "Lapsen oikeuksien päivä": { en: "Day of Children's Rights", sv: "Barnets rättigheters dag" },
  "Itsenäisyyspäivä": { en: "Independence Day", sv: "Självständighetsdagen" },
  "Jean Sibeliuksen päivä": { en: "Jean Sibelius Day", sv: "Jean Sibelius dag" },
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
        nameEn: FLAG_DAY_NAMES[name].en,
        nameSv: FLAG_DAY_NAMES[name].sv,
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

function joinFi(parts) {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} ja ${parts[parts.length - 1]}`;
}

// Shared by FlagDays.jsx (visible <details> list) and prerender.js's FAQPage
// JSON-LD: the same visible/schema-parity discipline as every other FAQ set in
// this codebase. Every answer is computed from flagDaysInYear(), so nothing
// here can drift from the visible table or the CollectionPage schema.
export function flagDayFaqs(year) {
  const days = flagDaysInYear(year);
  const nameList = days
    .map((d) => (d.altName ? `${d.name} (${d.altName})` : d.name))
    .join(", ");
  const official = days.filter((d) => d.category === "virallinen");
  const suomenLipunPaiva = days.find((d) => d.altName === "Suomen lipun päivä");
  const puolustusvoimat = days.find((d) => d.name === "Puolustusvoimain lippujuhlan päivä");
  const overlapping = days.filter((d) => d.holidayOverlap);

  return [
    {
      q: `Mitkä ovat vuoden ${year} liputuspäivät?`,
      a: `Vuoden ${year} liputuspäivät ovat: ${nameList}.`,
    },
    {
      q: `Kuinka monta liputuspäivää Suomessa on vuonna ${year}?`,
      a: `Vuonna ${year} Suomessa on ${days.length} kiinteää tai kalenterin mukaan määräytyvää liputuspäivää, joista ${official.length} on virallisia. Lisäksi vaalipäivät ja tasavallan presidentin virkaanastujaispäivä ovat virallisia liputuspäiviä.`,
    },
    {
      q: "Mitkä ovat viralliset liputuspäivät?",
      a: `Virallisia liputuspäiviä ovat ${joinFi(official.map((d) => d.name))} sekä vaalipäivät ja presidentin virkaanastujaispäivä. Muut liputuspäivät ovat vakiintuneita liputuspäiviä, joita ei ole säädetty, mutta joina liputetaan samalla tavalla.`,
    },
    {
      q: `Milloin Suomen lipun päivä on vuonna ${year}?`,
      a: `Suomen lipun päivä on juhannuspäivä, joka on vuonna ${year} ${WD_ESSIVE[suomenLipunPaiva.date.getDay()]} ${fmtFullFi(suomenLipunPaiva.date)}. Puolustusvoimain lippujuhlan päivä on eri päivä: joka vuosi ${puolustusvoimat.date.getDate()}. kesäkuuta.`,
    },
    {
      q: "Onko liputuspäivä aina arkipyhä?",
      a:
        overlapping.length > 0
          ? `Ei. Vuonna ${year} arkipyhälle osuvat ${joinFi(overlapping.map((d) => (d.name === d.holidayOverlap ? d.name : `${d.name} (${d.holidayOverlap})`)))}. Suurin osa liputuspäivistä on tavallisia arki- tai sunnuntaipäiviä.`
          : `Ei. Vuonna ${year} yksikään liputuspäivä ei osu samalle päivälle kuin virallinen arkipyhä.`,
    },
  ];
}
