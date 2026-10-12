import { dateFromDayKey, helsinkiDayKey, isoWeek, isoYear, mondayOf } from "../components/dateUtils.js";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatEnglishDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const renderDate = () => dateFromDayKey(globalThis.__VIIKKONRO_RENDER_DAY__ ?? helsinkiDayKey());

export function englishWeekFacts(now = renderDate()) {
  const week = isoWeek(now);
  const year = isoYear(now);
  const monday = mondayOf(week, year);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { week, year, monday, sunday };
}

export function englishMeta(now = renderDate()) {
  const fact = englishWeekFacts(now);
  return {
    title: `Week Number Today: Week ${fact.week} of ${fact.year} | Viikko Nro`,
    description: `The current week number is ${fact.week} of ${fact.year}. It runs from ${formatEnglishDate(fact.monday)} to ${formatEnglishDate(fact.sunday)} under the ISO 8601 week-date system, Monday through Sunday.`,
  };
}

export const englishFaqs = [
  { q: "What is the current week number?", a: "The answer at the top of this page is calculated from the current date using the ISO 8601 week-date system." },
  { q: "When does the week start?", a: "Under ISO 8601, each week starts on Monday and ends on Sunday." },
  { q: "How is week 1 determined?", a: "Week 1 is the week containing the year's first Thursday. Equivalently, it is the week containing 4 January." },
  { q: "Can an early-January date belong to the previous week-year?", a: "Yes. Around New Year, an ISO week-year can differ from the calendar year." },
];
