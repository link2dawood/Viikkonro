// Content data for /kesaaika-{year} — when Finland's clocks change.
// Plain .js so prerender.js can import it directly.
//
// Rule: EU summer-time directive 2000/84/EC — summer time starts on the last
// Sunday of March and ends on the last Sunday of October, both at 01:00 UTC.
// Finland is UTC+2 (EET) in winter and UTC+3 (EEST) in summer, so the spring
// change happens at 03:00 local time (clocks jump to 04:00) and the autumn
// change at 04:00 local summer time (clocks go back to 03:00). Dates for
// future years assume the directive stays in force; the page says so.
import { fmtFullFi, fmtShortFi, isoWeek, isoYear, WD_ESSIVE } from "../components/dateUtils.js";

export function lastSundayOf(year, monthIndex) {
  const d = new Date(year, monthIndex + 1, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function dstChanges(year) {
  const start = lastSundayOf(year, 2);
  const end = lastSundayOf(year, 9);
  return {
    start: {
      date: start,
      week: isoWeek(start),
      weekYear: isoYear(start),
      from: "3.00",
      to: "4.00",
      direction: "eteenpäin",
    },
    end: {
      date: end,
      week: isoWeek(end),
      weekYear: isoYear(end),
      from: "4.00",
      to: "3.00",
      direction: "taaksepäin",
    },
    // Summer-time length in days (start Sunday .. end Sunday).
    summerDays: Math.round(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        86400000,
    ),
  };
}

export function dstMeta(year) {
  const { start, end } = dstChanges(year);
  return {
    title: `Kesäaika ${year} – kellojen siirto | Viikko Nro`,
    description: `Kesäaika ${year} alkaa sunnuntaina ${fmtShortFi(start.date)} klo 3.00, kun kelloja siirretään tunti eteenpäin. Talviaika alkaa sunnuntaina ${fmtShortFi(end.date)} klo 4.00.`,
  };
}

// Shared by DaylightSaving.jsx and prerender.js's FAQPage JSON-LD.
export function dstFaqs(year) {
  const { start, end, summerDays } = dstChanges(year);
  return [
    {
      q: `Milloin kellot siirretään kesäaikaan vuonna ${year}?`,
      a: `Kesäaika ${year} alkaa ${WD_ESSIVE[start.date.getDay()]} ${fmtFullFi(start.date)} (viikko ${start.week}). Kello 3.00 kellot siirretään tunnilla eteenpäin, jolloin kello on 4.00.`,
    },
    {
      q: `Milloin kellot siirretään talviaikaan vuonna ${year}?`,
      a: `Kesäaika päättyy ${WD_ESSIVE[end.date.getDay()]} ${fmtFullFi(end.date)} (viikko ${end.week}). Kello 4.00 kellot siirretään tunnilla taaksepäin, jolloin kello on 3.00.`,
    },
    {
      q: "Kumpaan suuntaan kelloja siirretään?",
      a: "Keväällä kelloja siirretään tunti eteenpäin, joten yö on tuntia lyhyempi. Syksyllä kelloja siirretään tunti taaksepäin, joten yö on tuntia pidempi.",
    },
    {
      q: "Miten kesäajan alkamis- ja päättymispäivä määräytyy?",
      a: `EU:n kesäaikadirektiivin (2000/84/EY) mukaan kesäaika alkaa maaliskuun viimeisenä sunnuntaina ja päättyy lokakuun viimeisenä sunnuntaina kello 1.00 UTC. Suomessa se on keväällä kello 3.00 ja syksyllä kello 4.00. Vuonna ${year} kesäaikaa on ${summerDays} päivää.`,
    },
  ];
}
