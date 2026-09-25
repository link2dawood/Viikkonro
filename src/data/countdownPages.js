// Content data for the countdown pages (/kuinka-monta-paivaa-jouluun etc.).
// Plain .js so prerender.js can import it directly. Each target date comes
// from a module the rest of the site already uses: holidays.js for
// Midsummer Eve, schoolHolidays.js for the school summer break, fixed dates
// for Christmas Eve and New Year's Day.
import { fmtFullFi, fmtShortFi, isoWeek, isoYear, WD, WD_ESSIVE } from "../components/dateUtils.js";
import { holidaysInYear, juhannusaatto } from "./holidays.js";
import { SCHOOL_HOLIDAYS } from "./schoolHolidays.js";

const summerStarts = Object.values(SCHOOL_HOLIDAYS)
  .map((sy) => ({ start: sy.kesaloma.startDate, lastSchoolDay: sy.schoolYearEnd }))
  .sort((a, b) => a.start - b.start);

export const COUNTDOWNS = [
  {
    key: "joulu",
    path: "/kuinka-monta-paivaa-jouluun",
    label: "Jouluun",
    targetName: "jouluaatto",
    targetNameCap: "Jouluaatto",
    illative: "jouluun",
    dateFor: (y) => new Date(y, 11, 24),
    rule: "Suomessa joulua vietetään jouluaattona 24. joulukuuta. Jouluaatto ei ole virallinen arkipyhä, mutta pankit ovat kiinni ja useimmilla työpaikoilla se on vapaapäivä.",
  },
  {
    key: "juhannus",
    path: "/kuinka-monta-paivaa-juhannukseen",
    label: "Juhannukseen",
    targetName: "juhannusaatto",
    targetNameCap: "Juhannusaatto",
    illative: "juhannukseen",
    dateFor: (y) => juhannusaatto(y),
    rule: "Juhannusaatto on aina 19.–25. kesäkuuta välille osuva perjantai, ja juhannuspäivä on sitä seuraava lauantai.",
  },
  {
    key: "kesaloma",
    path: "/kuinka-monta-paivaa-kesalomaan",
    label: "Kesälomaan",
    targetName: "koulujen kesäloma",
    targetNameCap: "Koulujen kesäloma",
    illative: "kesälomaan",
    verb: "alkaa",
    // Only school years with published dates (see schoolHolidays.js) — no
    // guessed future dates.
    dateFor: (y) => summerStarts.find((s) => s.start.getFullYear() === y)?.start ?? null,
    rule: "Peruskoulujen lukuvuosi päättyy kesäkuun alussa, ja kesäloma alkaa lukuvuoden viimeisen koulupäivän jälkeen. Päivämäärät perustuvat Opetushallituksen ja Helsingin kaupungin julkaisemiin lukuvuosiaikatauluihin; oman kunnan ajankohta voi poiketa.",
  },
  {
    key: "uusivuosi",
    path: "/kuinka-monta-paivaa-uuteenvuoteen",
    label: "Uuteenvuoteen",
    targetName: "uudenvuodenpäivä",
    targetNameCap: "Uudenvuodenpäivä",
    illative: "uuteenvuoteen",
    dateFor: (y) => new Date(y, 0, 1),
    rule: "Uudenvuodenpäivä 1. tammikuuta on virallinen arkipyhä. Uudenvuodenaatto 31. joulukuuta on tavallinen arkipäivä.",
  },
];

export const COUNTDOWN_BY_PATH = Object.fromEntries(COUNTDOWNS.map((c) => [c.path, c]));

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiff(a, b) {
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86400000,
  );
}

// Next occurrence on or after `now` (today counts), or null when no
// published date exists yet.
export function nextTarget(countdown, now) {
  const today = startOfDay(now);
  for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) {
    const date = countdown.dateFor(y);
    if (date && date >= today) return date;
  }
  return null;
}

// Upcoming dates for the "seuraavat vuodet" table (skips years without data).
export function upcomingTargets(countdown, now, count = 5) {
  const first = nextTarget(countdown, now);
  if (!first) return [];
  const rows = [];
  for (let y = first.getFullYear(); rows.length < count && y <= first.getFullYear() + count; y++) {
    const date = countdown.dateFor(y);
    if (date) rows.push({ date, weekday: WD[date.getDay()], week: isoWeek(date), weekYear: isoYear(date) });
  }
  return rows;
}

// Working days strictly between today and the target (Mon–Fri minus
// official holidays), matching the site's working-day definition.
function workingDaysBetween(today, target) {
  const official = new Set(
    [today.getFullYear(), target.getFullYear()]
      .flatMap((y) => holidaysInYear(y))
      .filter((h) => h.official)
      .map((h) => h.date.toDateString()),
  );
  let count = 0;
  const d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (d < target) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !official.has(d.toDateString())) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function countdownStats(countdown, now) {
  const target = nextTarget(countdown, now);
  if (!target) return null;
  const today = startOfDay(now);
  const days = dayDiff(today, target);
  return {
    target,
    days,
    weeks: Math.floor(days / 7),
    extraDays: days % 7,
    workingDays: workingDaysBetween(today, target),
    week: isoWeek(target),
    weekYear: isoYear(target),
  };
}

export function countdownMeta(countdown, now) {
  const target = nextTarget(countdown, now);
  const when = target
    ? ` ${countdown.targetNameCap} ${countdown.verb ?? "on"} ${WD_ESSIVE[target.getDay()]} ${fmtShortFi(target)}.`
    : "";
  return {
    title: `Kuinka monta päivää ${countdown.illative}? | Viikko Nro`,
    description: `Päivälaskuri ${countdown.illative}: näe heti montako päivää, viikkoa ja työpäivää on jäljellä.${when}`,
  };
}

// Shared by Countdown.jsx and prerender.js. Answers depend only on the
// target dates (not on today's day count), so the build-time FAQPage and
// the visible FAQ agree all day, every day.
export function countdownFaqs(countdown, now) {
  const upcoming = upcomingTargets(countdown, now, 4);
  if (!upcoming.length) {
    return [{ q: `Miten ${countdown.targetName} määräytyy?`, a: countdown.rule }];
  }
  const [next, ...later] = upcoming;
  const y = next.date.getFullYear();
  const verb = countdown.verb ?? "on";
  const faqs = [
    {
      q: verb === "on" ? `Milloin on ${countdown.targetName} ${y}?` : `Milloin ${countdown.targetName} ${verb} ${y}?`,
      a: `${countdown.targetNameCap} ${y} ${verb} ${WD_ESSIVE[next.date.getDay()]} ${fmtFullFi(next.date)}, viikolla ${next.week}.`,
    },
    { q: `Miten ${countdown.targetName} määräytyy?`, a: countdown.rule },
  ];
  if (later.length) {
    faqs.push({
      q: `Milloin ${countdown.targetName} on seuraavina vuosina?`,
      a: later
        .map((r) => `${r.date.getFullYear()}: ${r.weekday.toLowerCase()} ${fmtShortFi(r.date)} (viikko ${r.week})`)
        .join("; ") + ".",
    });
  }
  return faqs;
}
