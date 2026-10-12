import {
  fmtFullFi,
  fmtShortFi,
  isoWeek,
  isoYear,
  WD_ESSIVE,
} from "../components/dateUtils.js";
import {
  dateFromNameDayKey,
  nameDayForSlug,
  nameDaysForDateKey,
} from "./nameDays.js";

const NAME_GENITIVES = {
  Aapeli: "Aapelin",
  Elmer: "Elmerin",
  Elmeri: "Elmerin",
};

export function todayInFinland(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(value.year), Number(value.month) - 1, Number(value.day));
}

export function dateKeyFor(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function nameDayNamePage(slug, year = todayInFinland().getFullYear()) {
  const record = nameDayForSlug(slug);
  if (!record) return null;
  const dates = record.dateKeys
    .map((dateKey) => dateFromNameDayKey(dateKey, year))
    .filter(Boolean);
  return {
    ...record,
    genitive: NAME_GENITIVES[record.name] ?? `${record.name}-nimen`,
    year,
    dates,
    path: `/nimipaiva/${record.slug}`,
  };
}

export function nameDayDatePage(dateKey, year = todayInFinland().getFullYear()) {
  const date = dateFromNameDayKey(dateKey, year);
  const names = nameDaysForDateKey(dateKey);
  if (!date || names.length === 0) return null;
  return {
    dateKey,
    date,
    year,
    names,
    week: isoWeek(date),
    weekYear: isoYear(date),
    weekdayEssive: WD_ESSIVE[date.getDay()],
    path: `/nimipaivat/${dateKey}`,
  };
}

export function todayNameDayPage(now = new Date()) {
  const date = todayInFinland(now);
  const dateKey = dateKeyFor(date);
  const names = nameDaysForDateKey(dateKey);
  return {
    date,
    dateKey,
    names,
    available: names.length > 0,
    week: isoWeek(date),
    weekYear: isoYear(date),
    weekdayEssive: WD_ESSIVE[date.getDay()],
    path: "/nimipaivat/tanaan",
  };
}

function fitDescription(description) {
  return description.length > 158
    ? description.replace(" sekä nimien omat nimipäiväsivut", "")
    : description;
}

export function nameDayNameMeta(slug) {
  const page = nameDayNamePage(slug);
  if (!page) return null;
  const first = page.dates[0];
  const qualifier = page.name === "Aapeli" ? "" : ` (${page.name})`;
  return {
    title: `${page.genitive} nimipäivä${qualifier} – ${fmtShortFi(first)} | Viikko Nro`,
    description: `Katso, milloin ${page.name} viettää nimipäivää. Nimipäivä on ${fmtFullFi(first)}. Tarkista päivämäärä, viikonpäivä ja kalenteriviikko sekä saman päivän muut nimet.`,
  };
}

export function nameDayDateMeta(dateKey) {
  const page = nameDayDatePage(dateKey);
  if (!page) return null;
  return {
    title: `Nimipäivät ${fmtShortFi(page.date)} – ${page.names.join(", ")} | Viikko Nro`,
    description: fitDescription(
      `Katso päivän ${fmtFullFi(page.date)} nimipäivät: ${page.names.join(", ")}. Päivä on ${page.weekdayEssive} ja kuuluu viikkoon ${page.week}. Avaa päivän tiedot sekä nimien omat nimipäiväsivut.`,
    ),
  };
}

export function todayNameDayMeta(now = new Date()) {
  const page = todayNameDayPage(now);
  const names = page.names.join(", ");
  return {
    title: `Nimipäivä tänään – ${fmtShortFi(page.date)} | Viikko Nro`,
    description: page.available
      ? fitDescription(`Katso nimipäivä tänään ${fmtFullFi(page.date)}: ${names}. Tänään on ${page.weekdayEssive} ja viikko ${page.week}. Avaa päivän tiedot sekä nimien omat nimipäiväsivut.`)
      : `Päivälle ${fmtFullFi(page.date)} ei ole julkaistu nimipäivätietoa Viikko Nron varmennetussa aineistossa. Tarkista päivän viikonpäivä ja viikkonumero.`,
    robots: page.available ? "index, follow" : "noindex, follow",
  };
}

export function nameDayFaqs(page, type) {
  if (type === "name") {
    const date = page.dates[0];
    return [
      { q: `${page.genitive} nimipäivä yhdellä lauseella?`, a: `${page.genitive} nimipäivää vietetään ${fmtFullFi(date)}.` },
      { q: `Milloin ${page.genitive} nimipäivä on?`, a: `${page.genitive} nimipäivä on ${fmtFullFi(date)}.` },
      { q: `Mikä viikonpäivä ${page.genitive} nimipäivä on vuonna ${page.year}?`, a: `Vuonna ${page.year} nimipäivä on ${WD_ESSIVE[date.getDay()]}.` },
      { q: `Mille viikolle ${page.genitive} nimipäivä osuu vuonna ${page.year}?`, a: `Päivä kuuluu viikkoon ${isoWeek(date)} vuonna ${isoYear(date)}.` },
    ];
  }
  if (type === "today") {
    const answer = page.available
      ? `Tänään ${fmtFullFi(page.date)} nimipäivää ${page.names.length === 1 ? "viettää" : "viettävät"} ${page.names.join(", ")}.`
      : `Päivälle ${fmtFullFi(page.date)} ei ole julkaistu nimipäivätietoa Viikko Nron varmennetussa aineistossa.`;
    return [
      { q: "Nimipäivä tänään yhdellä lauseella?", a: answer },
      { q: "Mikä päivä tänään on?", a: `Tänään on ${page.weekdayEssive} ${fmtFullFi(page.date)}.` },
      { q: "Mille viikolle tämä päivä kuuluu?", a: `Päivä kuuluu viikkoon ${page.week} vuonna ${page.weekYear}.` },
      { q: "Miten päivän nimipäivät määräytyvät?", a: "Nimipäivät määräytyvät kalenteripäivän mukaan ja toistuvat samana päivänä joka vuosi." },
    ];
  }
  return [
    { q: `Päivän ${fmtFullFi(page.date)} nimipäivät yhdellä lauseella?`, a: `Nimipäivää viettävät ${page.names.join(", ")}.` },
    { q: `Keillä on nimipäivä ${fmtFullFi(page.date)}?`, a: `Nimipäivää viettävät ${page.names.join(", ")}.` },
    { q: `Mikä viikonpäivä ${fmtFullFi(page.date)} on?`, a: `Päivä on ${page.weekdayEssive}.` },
    { q: `Mille viikolle ${fmtFullFi(page.date)} osuu?`, a: `Päivä kuuluu viikkoon ${page.week} vuonna ${page.weekYear}.` },
  ];
}
