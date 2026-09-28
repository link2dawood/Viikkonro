// Moon phases for /kuun-vaiheet-{year}. Plain .js so prerender.js can import it.
//
// Algorithm: Jean Meeus, Astronomical Algorithms (2nd ed.), chapter 49 (the
// periodic terms for new moon, full moon and the quarters, plus the 14
// planetary terms), giving the instant in Dynamical Time; ΔT from the
// Espenak & Meeus polynomial for 2005-2050 converts it to UT. Checked
// 2026-09-28 against NASA's "Six Millennium Catalog of Phases of the Moon"
// (eclipse.gsfc.nasa.gov/phase/phases2001.html): all 2026 phases agree to
// within a couple of minutes (see calendarTools.test.js). Times are shown in
// Finnish time (Europe/Helsinki), so summer time is handled by the platform's
// time-zone data, and rounded to the minute.
import { fmtFullFi, isoWeek, isoYear, M_FULL, WD, WD_ESSIVE } from "../components/dateUtils.js";

export const moonPath = (year) => `/kuun-vaiheet-${year}`;
export const SYNODIC_MONTH = 29.530588861;
export const NASA_PHASES_URL = "https://eclipse.gsfc.nasa.gov/phase/phases2001.html";
export const PHASES_CHECKED = "28.9.2026";

export const PHASES = [
  { id: "uusikuu", name: "Uusikuu", plural: "Uudetkuut", offset: 0 },
  { id: "ensimmainen-neljannes", name: "Ensimmäinen neljännes", plural: "Ensimmäiset neljännekset", offset: 0.25 },
  { id: "taysikuu", name: "Täysikuu", plural: "Täysikuut", offset: 0.5 },
  { id: "viimeinen-neljannes", name: "Viimeinen neljännes", plural: "Viimeiset neljännekset", offset: 0.75 },
];

const rad = (deg) => (deg * Math.PI) / 180;
const sin = (deg) => Math.sin(rad(deg));
const cos = (deg) => Math.cos(rad(deg));

// Julian Ephemeris Day of the phase with lunation index k (k integer for new
// moon, +0.25 first quarter, +0.5 full moon, +0.75 last quarter).
function phaseJde(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
  const frac = Math.round((k - Math.floor(k)) * 4) / 4;

  let c;
  if (frac === 0 || frac === 0.5) {
    const full = frac === 0.5;
    c =
      (full ? -0.40614 : -0.4072) * sin(Mp) +
      (full ? 0.17302 : 0.17241) * E * sin(M) +
      (full ? 0.01614 : 0.01608) * sin(2 * Mp) +
      (full ? 0.01043 : 0.01039) * sin(2 * F) +
      (full ? 0.00734 : 0.00739) * E * sin(Mp - M) -
      (full ? 0.00515 : 0.00514) * E * sin(Mp + M) +
      (full ? 0.00209 : 0.00208) * E * E * sin(2 * M) -
      0.00111 * sin(Mp - 2 * F) -
      0.00057 * sin(Mp + 2 * F) +
      0.00056 * E * sin(2 * Mp + M) -
      0.00042 * sin(3 * Mp) +
      0.00042 * E * sin(M + 2 * F) +
      0.00038 * E * sin(M - 2 * F) -
      0.00024 * E * sin(2 * Mp - M) -
      0.00017 * sin(Om) -
      0.00007 * sin(Mp + 2 * M) +
      0.00004 * sin(2 * Mp - 2 * F) +
      0.00004 * sin(3 * M) +
      0.00003 * sin(Mp + M - 2 * F) +
      0.00003 * sin(2 * Mp + 2 * F) -
      0.00003 * sin(Mp + M + 2 * F) +
      0.00003 * sin(Mp - M + 2 * F) -
      0.00002 * sin(Mp - M - 2 * F) -
      0.00002 * sin(3 * Mp + M) +
      0.00002 * sin(4 * Mp);
  } else {
    c =
      -0.62801 * sin(Mp) +
      0.17172 * E * sin(M) -
      0.01183 * E * sin(Mp + M) +
      0.00862 * sin(2 * Mp) +
      0.00804 * sin(2 * F) +
      0.00454 * E * sin(Mp - M) +
      0.00204 * E * E * sin(2 * M) -
      0.0018 * sin(Mp - 2 * F) -
      0.0007 * sin(Mp + 2 * F) -
      0.0004 * sin(3 * Mp) -
      0.00034 * E * sin(2 * Mp - M) +
      0.00032 * E * sin(M + 2 * F) +
      0.00032 * E * sin(M - 2 * F) -
      0.00028 * E * E * sin(Mp + 2 * M) +
      0.00027 * E * sin(2 * Mp + M) -
      0.00017 * sin(Om) -
      0.00005 * sin(Mp - M - 2 * F) +
      0.00004 * sin(2 * Mp + 2 * F) -
      0.00004 * sin(Mp + M + 2 * F) +
      0.00004 * sin(Mp - 2 * M) +
      0.00003 * sin(Mp + M - 2 * F) +
      0.00003 * sin(3 * M) +
      0.00002 * sin(2 * Mp - 2 * F) +
      0.00002 * sin(Mp - M + 2 * F) -
      0.00002 * sin(3 * Mp + M);
    const W =
      0.00306 -
      0.00038 * E * cos(M) +
      0.00026 * cos(Mp) -
      0.00002 * cos(Mp - M) +
      0.00002 * cos(Mp + M) +
      0.00002 * cos(2 * F);
    c += frac === 0.25 ? W : -W;
  }

  const A = [
    [0.000325, 299.77 + 0.107408 * k - 0.009173 * T2],
    [0.000165, 251.88 + 0.016321 * k],
    [0.000164, 251.83 + 26.651886 * k],
    [0.000126, 349.42 + 36.412478 * k],
    [0.00011, 84.66 + 18.206239 * k],
    [0.000062, 141.74 + 53.303771 * k],
    [0.00006, 207.14 + 2.453732 * k],
    [0.000056, 154.84 + 7.30686 * k],
    [0.000047, 34.52 + 27.261239 * k],
    [0.000042, 207.19 + 0.121824 * k],
    [0.00004, 291.34 + 1.844379 * k],
    [0.000037, 161.72 + 24.198154 * k],
    [0.000035, 239.56 + 25.513099 * k],
    [0.000023, 331.55 + 3.592518 * k],
  ];
  for (const [coef, arg] of A) c += coef * sin(arg);
  return jde + c;
}

// ΔT in seconds, Espenak & Meeus polynomial valid 2005-2050.
function deltaT(year) {
  const t = year - 2000;
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

// The phase instant as a JS Date (UTC), rounded to the minute.
export function phaseInstant(k) {
  const jde = phaseJde(k);
  const approxYear = 2000 + k / 12.3685;
  const ms = (jde - 2440587.5) * 86400000 - deltaT(approxYear) * 1000;
  return new Date(Math.round(ms / 60000) * 60000);
}

const helsinkiFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Helsinki",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Finnish local calendar date and clock time of an instant.
export function helsinkiParts(instant) {
  const p = Object.fromEntries(helsinkiFmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return {
    date: new Date(Number(p.year), Number(p.month) - 1, Number(p.day)),
    time: `${p.hour}.${p.minute}`,
  };
}

function eventFor(k, phase) {
  const instant = phaseInstant(k);
  const { date, time } = helsinkiParts(instant);
  return {
    phase: phase.id,
    name: phase.name,
    instant,
    date,
    time,
    month: date.getMonth() + 1,
    weekday: WD[date.getDay()],
    weekdayEssive: WD_ESSIVE[date.getDay()],
    week: isoWeek(date),
    weekYear: isoYear(date),
  };
}

// Every phase whose Finnish local date falls in `year`, in time order.
export function moonPhasesInYear(year) {
  const k0 = Math.floor((year - 2000) * 12.3685) - 2;
  const out = [];
  for (let k = k0; k < k0 + 17; k += 1) {
    for (const phase of PHASES) {
      const e = eventFor(k + phase.offset, phase);
      if (e.date.getFullYear() === year) out.push(e);
    }
  }
  return out.sort((a, b) => a.instant - b.instant);
}

export const phaseList = (year, id) => moonPhasesInYear(year).filter((e) => e.phase === id);

// Months with two full moons (the popular "sininen kuu" / blue moon).
export function blueMoons(year) {
  const full = phaseList(year, "taysikuu");
  return full.filter((e, i) => i > 0 && full[i - 1].month === e.month);
}

// Where the Moon is on `today`: the last phase event on or before today and
// the next one after it (Finnish local dates).
export function moonToday(today) {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const events = [...moonPhasesInYear(day.getFullYear() - 1), ...moonPhasesInYear(day.getFullYear()), ...moonPhasesInYear(day.getFullYear() + 1)];
  const next = events.find((e) => e.date > day);
  const onToday = events.find((e) => e.date.getTime() === day.getTime()) ?? null;
  const prev = [...events].reverse().find((e) => e.date <= day);
  const waxing = prev.phase === "uusikuu" || prev.phase === "ensimmainen-neljannes";
  const nextFull = events.find((e) => e.date > day && e.phase === "taysikuu");
  const nextNew = events.find((e) => e.date > day && e.phase === "uusikuu");
  return { onToday, waxing, next, nextFull, nextNew };
}

const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const joinFi = (parts) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} ja ${parts[parts.length - 1]}`;
const whenFi = (e) => `${e.weekdayEssive} ${fmtFullFi(e.date)} klo ${e.time}`;

// Shortest and longest gap between consecutive full moons in the year.
function fullMoonGaps(year) {
  const full = [...phaseList(year - 1, "taysikuu").slice(-1), ...phaseList(year, "taysikuu")];
  const gaps = full.slice(1).map((e, i) => (e.instant - full[i].instant) / 3600000);
  const fmt = (h) => `${Math.floor(h / 24)} vrk ${Math.round(h % 24)} h`;
  return { min: fmt(Math.min(...gaps)), max: fmt(Math.max(...gaps)) };
}

export function moonMeta(year) {
  const full = phaseList(year, "taysikuu");
  return {
    title: `Kuun vaiheet ${year}: täysikuu ja uusikuu | Viikko Nro`,
    description: `Kuun vaiheet ${year} Suomen aikaan: ${full.length} täysikuuta, uudetkuut ja puolikuut päivämäärineen ja kellonaikoineen. Ensimmäinen täysikuu on ${dm(full[0].date)}`,
  };
}

// Shared by MoonPhases.jsx (visible <details>) and prerender.js (FAQPage).
export function moonFaqs(year) {
  const full = phaseList(year, "taysikuu");
  const nw = phaseList(year, "uusikuu");
  const blue = blueMoons(year);
  const gaps = fullMoonGaps(year);
  return [
    {
      q: `Milloin on täysikuu vuonna ${year}?`,
      a: `Vuoden ${year} täysikuut Suomen aikaan ovat ${joinFi(full.map((e) => `${dm(e.date)} klo ${e.time}`))}.`,
    },
    {
      q: `Montako täysikuuta vuonna ${year} on?`,
      a: `Vuonna ${year} on ${full.length} täysikuuta.${full.length === 13 ? " Tavallisesti vuodessa on 12 täysikuuta, mutta koska kuun kierto on vähän alle 30 päivää, joskus niitä mahtuu vuoteen 13." : ""}`,
    },
    {
      q: `Onko vuonna ${year} sininen kuu?`,
      a: blue.length
        ? `Kyllä. Sinisellä kuulla tarkoitetaan yleisesti saman kalenterikuukauden toista täysikuuta. Vuonna ${year} se on ${joinFi(blue.map((e) => whenFi(e)))}.`
        : `Ei. Sinisellä kuulla tarkoitetaan yleisesti saman kalenterikuukauden toista täysikuuta, eikä vuonna ${year} yhdessäkään kuukaudessa ole kahta täysikuuta Suomen ajassa.`,
    },
    {
      q: `Milloin on uusikuu vuonna ${year}?`,
      a: `Vuoden ${year} uudetkuut Suomen aikaan ovat ${joinFi(nw.map((e) => `${dm(e.date)} klo ${e.time}`))}.`,
    },
    {
      q: "Kuinka pitkä on kuun kierto?",
      a: `Kuun vaiheet toistuvat keskimäärin 29,53 päivän välein (synodinen kuukausi). Kuun radan soikeuden vuoksi väli vaihtelee: vuonna ${year} täysikuiden väli on lyhimmillään ${gaps.min} ja pisimmillään ${gaps.max}.`,
    },
    {
      q: "Tapahtuuko täysikuu samaan aikaan koko Suomessa?",
      a: "Kyllä. Kuun vaihe on hetki, joka on sama kaikkialla maailmassa, ja koko Suomi on samalla aikavyöhykkeellä. Tämän sivun ajat on annettu Suomen aikaan, kesäaikana UTC+3 ja talviaikana UTC+2.",
    },
  ];
}

// Month rows for the page table: { month, monthName, byPhase: { id: [events] } }.
export function monthTable(year) {
  const events = moonPhasesInYear(year);
  return M_FULL.map((monthName, i) => ({
    month: i + 1,
    monthName,
    byPhase: Object.fromEntries(PHASES.map((p) => [p.id, events.filter((e) => e.month === i + 1 && e.phase === p.id)])),
  }));
}
