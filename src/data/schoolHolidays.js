// Finnish school holidays (koulujen loma-ajat) — D-04.
//
// Covers the current school year plus the next: 2026–2027 and 2027–2028
// (as of 2026-07-23, the currently-running school year is mid-summer-break
// between years, so "current" is treated as the imminent 2026–2027 year).
//
// Sourced from official municipal/national records, not memory or blog
// posts, per the handoff's explicit warning — school holiday dates change
// year to year and this is exactly the kind of thing easy to get subtly
// wrong. Checked 2026-07-23:
//   - 2026–2027: Opetushallitus (oph.fi) national announcement, cross-
//     checked against Helsinki's official city decision record
//     (paatokset.hel.fi/fi/asia/hel-2025-015947) — both agree.
//   - 2027–2028: Helsinki's official decision record (same URL, which
//     covers both years) for school-year bounds, syysloma, joululoma, and
//     the Etelä-Suomi (South Finland) hiihtoloma week specifically.
//
// Confidence is NOT uniform across every field below — see the inline notes
// on hiihtoloma for 2027–2028 specifically, where two of the three regions
// are inferred rather than independently re-confirmed for that exact year.

import { mondayOf } from "../components/dateUtils.js";

function weekRange(isoYear, week) {
  const startDate = mondayOf(week, isoYear);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return { startDate, endDate };
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Hiihtoloma (talviloma) is staggered across three consecutive weeks so
// travel/resort demand doesn't all hit at once. The region->relative-week
// assignment (South earliest, Central middle, North latest) is a stable,
// long-standing convention confirmed across multiple school years — but the
// actual calendar WEEK NUMBERS shift slightly year to year, so those are
// stored per school year below, not hardcoded as "always week 8/9/10".
export const HIIHTOLOMA_REGIONS = {
  etelaSuomi: {
    name: "Etelä-Suomi",
    exampleAreas: ["Uusimaa", "Varsinais-Suomi", "Satakunta", "Ahvenanmaa"],
    exampleCities: ["Helsinki", "Espoo", "Vantaa", "Turku", "Pori"],
  },
  valiSuomi: {
    name: "Väli-Suomi",
    exampleAreas: [
      "Häme",
      "Pirkanmaa",
      "Pohjanmaa",
      "Keski-Suomi",
      "Kymenlaakso",
      "Etelä-Savo",
      "Etelä-Karjala",
    ],
    exampleCities: ["Tampere", "Lahti", "Jyväskylä", "Mikkeli", "Vaasa"],
  },
  itaPohjoisSuomi: {
    name: "Itä- ja Pohjois-Suomi",
    exampleAreas: ["Lappi", "Pohjois-Pohjanmaa", "Kainuu", "Pohjois-Savo", "Pohjois-Karjala"],
    exampleCities: ["Oulu", "Kajaani", "Rovaniemi"],
  },
};

// Pääsiäisloma varies the most by municipality of anything here — some give
// a full week, most just observe the standard public holidays. Modeled as
// coinciding with pitkäperjantai–2. pääsiäispäivä from holidays.js (the safe
// common denominator every municipality observes) rather than guessing at a
// specific extended week.
const PAASIAISLOMA_NOTE =
  "Coincides with pitkäperjantai–2. pääsiäispäivä (see holidays.js). Some municipalities extend this to a full week; that extension is municipality-specific and not modeled here.";

const RAW_SCHOOL_YEARS = {
  "2026-2027": {
    schoolYearStart: new Date(2026, 7, 12), // 12 Aug 2026, week 33
    schoolYearEnd: new Date(2027, 5, 5), // 5 Jun 2027
    syysloma: { startDate: new Date(2026, 9, 12), endDate: new Date(2026, 9, 16) }, // week 42
    joululoma: { startDate: new Date(2026, 11, 21), endDate: new Date(2027, 0, 6) },
    hiihtoloma: {
      // All three confirmed for this school year (oph.fi + Helsinki record).
      etelaSuomi: weekRange(2027, 8),
      valiSuomi: weekRange(2027, 9),
      itaPohjoisSuomi: weekRange(2027, 10),
    },
    paasiaisloma: { note: PAASIAISLOMA_NOTE },
  },
  "2027-2028": {
    schoolYearStart: new Date(2027, 7, 11), // 11 Aug 2027
    schoolYearEnd: new Date(2028, 5, 3), // 3 Jun 2028
    syysloma: { startDate: new Date(2027, 9, 18), endDate: new Date(2027, 9, 22) }, // week 42
    joululoma: { startDate: new Date(2027, 11, 23), endDate: new Date(2028, 0, 7) },
    hiihtoloma: {
      // Confirmed via Helsinki's official 2027–2028 decision record.
      etelaSuomi: weekRange(2028, 8),
      // NOT independently re-confirmed for this specific year — inferred
      // from the stable South/Central/North -> earliest/middle/latest week
      // pattern seen consistently in other years. Re-verify against an
      // official source before relying on these two for anything
      // user-facing beyond a rough estimate.
      valiSuomi: weekRange(2028, 9),
      itaPohjoisSuomi: weekRange(2028, 10),
    },
    paasiaisloma: { note: PAASIAISLOMA_NOTE },
  },
};

// kesäloma is derived, not hand-entered: it's the gap between one school
// year's end and the next one's start. For the last known school year
// (2027–2028), there's no known next start yet. Rather than leaving it
// truly unbounded (which would make every future week, including years we
// have no data for at all, incorrectly "overlap" a never-ending summer
// break), it's bounded by the average length of the summer break(s) we do
// know about, flagged `estimated: true` so callers can tell confirmed
// dates from this estimate.
function buildSchoolHolidays(raw) {
  const entries = Object.entries(raw);

  const knownSummerDays = [];
  for (let i = 0; i < entries.length - 1; i++) {
    const [, data] = entries[i];
    const [, next] = entries[i + 1];
    knownSummerDays.push((next.schoolYearStart - data.schoolYearEnd) / 86400000);
  }
  const estimatedSummerDays = knownSummerDays.length
    ? Math.round(knownSummerDays.reduce((a, b) => a + b, 0) / knownSummerDays.length)
    : 70; // fallback if this ever runs with only one school year on file

  const result = {};
  entries.forEach(([schoolYear, data], i) => {
    const next = entries[i + 1]?.[1];
    const startDate = addDays(data.schoolYearEnd, 1);
    result[schoolYear] = {
      ...data,
      kesaloma: next
        ? { startDate, endDate: addDays(next.schoolYearStart, -1), estimated: false }
        : { startDate, endDate: addDays(data.schoolYearEnd, estimatedSummerDays), estimated: true },
    };
  });
  return result;
}

export const SCHOOL_HOLIDAYS = buildSchoolHolidays(RAW_SCHOOL_YEARS);

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}

// Flattens one school year's holidays into a uniform list of periods for
// range-overlap checking.
function periodsOf(schoolYear, data) {
  const periods = [
    { type: "syysloma", schoolYear, ...data.syysloma },
    { type: "joululoma", schoolYear, ...data.joululoma },
    { type: "kesaloma", schoolYear, ...data.kesaloma },
  ];
  for (const [region, range] of Object.entries(data.hiihtoloma)) {
    periods.push({
      type: "hiihtoloma",
      schoolYear,
      region,
      regionName: HIIHTOLOMA_REGIONS[region].name,
      ...range,
    });
  }
  // paasiaisloma has no independent date range here (see PAASIAISLOMA_NOTE)
  // — it's intentionally not included as a queryable period, since it would
  // just duplicate holidays.js's Easter-derived dates.
  return periods;
}

// School holidays whose date range overlaps ISO week `week` of ISO year
// `isoYear`. Returns [] (not an error) for any week with no matching data —
// including years outside 2026–2027/2027–2028, which is the "degrades
// cleanly when data for a year is absent" behavior the handoff asks for.
export function schoolHolidaysInWeek(isoYear, week) {
  const monday = mondayOf(week, isoYear);
  const sunday = addDays(monday, 6);

  const results = [];
  for (const [schoolYear, data] of Object.entries(SCHOOL_HOLIDAYS)) {
    for (const period of periodsOf(schoolYear, data)) {
      if (overlaps(period.startDate, period.endDate, monday, sunday)) {
        results.push(period);
      }
    }
  }
  return results;
}
