import { Link, Navigate, useParams } from "react-router-dom";
import {
  isoWeek,
  isoWeekDateLabel,
  isoYear,
  fmtFullFi,
  fmtShortFi,
  M_GENITIVE,
  mondayOf,
  dFull,
  weeksInIsoYear,
  dayOfYear,
  daysRemainingInYear,
  quarterOf,
  seasonIndexOf,
  validateWeek,
  validateYear,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { canonicalFor, weekMeta, weekPdfPath } from "../data/seo";
import NotFound from "./NotFound";
import { holidaysInWeek } from "../data/holidays";
import { holidayLinkPath } from "../data/holidayPages";
import { flagDaysInYear } from "../data/flagDayPages";
import { hasNameDayPage, nameDaySlug, nameDaysForWeek } from "../data/nameDays";
import { schoolHolidayPeriodsInWeek } from "../data/schoolHolidayPages";
import { sunTimesForWeek, formatHelsinkiTime, HELSINKI } from "../data/sunTimes";
import { dateKeyFor } from "../data/nameDayPages";

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const SCHOOL_PERIOD_LABELS = {
  syysloma: "Syysloma",
  joululoma: "Joululoma",
  hiihtoloma: "Hiihtoloma",
  kesaloma: "Kesäloma",
};

function schoolPeriodLabel(p) {
  const region = p.regionName ? ` (${p.regionName})` : "";
  const estimate = p.estimated ? " (arvioitu ajankohta)" : "";
  return `${SCHOOL_PERIOD_LABELS[p.type]}${region}${estimate}`;
}

// Meteorological season of the ISO week's Thursday (its canonical month), in
// the illative case for the phrase "viikko ajoittuu ___". Both this and
// seasonNominative() below derive their season from dateUtils.js's
// seasonIndexOf() (also used by the public JSON feeds' English "season"
// field), so the boundary months can never disagree between the two.
const SEASON_ILLATIVE = ["talveen", "kevääseen", "kesään", "syksyyn"];
function seasonIllative(monthIndex) {
  return SEASON_ILLATIVE[seasonIndexOf(monthIndex)];
}

// Same season, nominative form — for the Quick Facts fact block, where a
// case-inflected word ("kesään") would read as a fragment rather than a fact.
const SEASON_NOMINATIVE = ["Talvi", "Kevät", "Kesä", "Syksy"];
function seasonNominative(monthIndex) {
  return SEASON_NOMINATIVE[seasonIndexOf(monthIndex)];
}

// Props come from the /:slug dispatcher (parsed "/viikko-30-2026"); the
// useParams fallback keeps the component usable under a plain param route too.
const WeekDays = ({ week: pWeek, year: pYear } = {}) => {
  const params = useParams();
  const week = pWeek ?? params.week;
  const year = pYear ?? params.year;
  const w = Number(week);
  const y = Number(year);

  if (!validateYear(y)) return <NotFound />;

  const total = weeksInIsoYear(y);

  // Week 53 only exists in a 53-week year — redirect anything out of range
  // to the nearest real week rather than rendering nonsense dates.
  if (!validateWeek(w, y)) {
    const clamped = Math.min(Math.max(w, 1), total);
    return <Navigate to={`/viikko-${clamped}-${y}`} replace />;
  }

  const mo = mondayOf(w, y);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);

  // Distinguishing per-week facts (so each of the ~835 week bodies reads
  // differently, not just the shared template): the week's season, taken from
  // its Thursday's month, and how many weeks of the year remain after it.
  const thursday = new Date(mo);
  thursday.setDate(mo.getDate() + 3);
  const season = seasonIllative(thursday.getMonth());
  const weeksLeft = total - w;

  var WD = [
    "Sunnuntai",
    "Maanantai",
    "Tiistai",
    "Keskiviikko",
    "Torstai",
    "Perjantai",
    "Lauantai",
  ];

  // Link a month only when it's inside the prerendered range; otherwise render
  // the name as plain text. Guards the Dec-2019 half of week 1 2020 (whose
  // Monday lives in an out-of-range year) from linking a page that 404s.
  const monthLink = (date, label) =>
    date.getFullYear() >= YEAR_MIN && date.getFullYear() <= YEAR_MAX ? (
      <Link to={`/kuukausi-${date.getMonth() + 1}-${date.getFullYear()}`}>
        {label}
      </Link>
    ) : (
      label
    );

  // ISO week 1 can begin in the previous calendar year. Keep the quarter
  // fact accurate, but don't link it when that calendar year falls outside
  // the prerendered horizon (for example Q4 2019 from week 1 of 2020).
  const quarterYear = mo.getFullYear();
  const quarterLabel = `Q${quarterOf(mo)} ${quarterYear}`;
  const quarterFact =
    quarterYear >= YEAR_MIN && quarterYear <= YEAR_MAX ? (
      <Link to={`/q${quarterOf(mo)}-${quarterYear}`}>{quarterLabel}</Link>
    ) : (
      quarterLabel
    );

  // Link a holiday mention to its dedicated /pyhat-{year}/{slug} page — falls
  // back to plain text for the rare case holidayLinkPath declines to link
  // (unmapped name, or its date falls outside the prerendered horizon), same
  // "never link a 404" discipline as monthLink below.
  const holidayLink = (h) => {
    const path = holidayLinkPath(h.name, h.date);
    return path ? <Link to={path}>{h.name}</Link> : h.name;
  };

  // Deep-link a flag day to its row on /liputuspaivat-{year} — plain text when
  // that year is outside the prerendered horizon.
  const flagDayLink = (f) => {
    const fy = f.date.getFullYear();
    return fy >= YEAR_MIN && fy <= YEAR_MAX ? (
      <Link to={`/liputuspaivat-${fy}#${f.slug}`}>{f.name}</Link>
    ) : (
      f.name
    );
  };

  let monthLinks;

  if (mo.getMonth() === su.getMonth()) {
    monthLinks = monthLink(
      mo,
      `${M_GENITIVE[mo.getMonth()]} ${mo.getFullYear()}`,
    );
  } else {
    monthLinks = (
      <>
        {monthLink(mo, M_GENITIVE[mo.getMonth()])} ja{" "}
        {monthLink(su, M_GENITIVE[su.getMonth()])}
      </>
    );
  }

  var prevW = w - 1,
    prevY = y;
  if (prevW < 1) {
    prevY = y - 1;
    prevW = weeksInIsoYear(prevY);
  }
  var nextW = w + 1,
    nextY = y;
  if (nextW > total) {
    nextY = y + 1;
    nextW = 1;
  }

  // Same week number, previous/next year (D-06) — only linked when that
  // year actually has that many weeks. Week 53 doesn't exist in every year,
  // so blindly linking /week/53/(y-1) or /week/53/(y+1) could point at a
  // year with only 52 weeks, forcing a redirect on click — exactly what D-06
  // rules out ("zero internal links to... redirect chains").
  // ...and only when that adjacent year is itself within the prerendered range,
  // so we never link a page that would 404 at the floor/ceiling of the horizon.
  const sameWeekPrevYearValid =
    y - 1 >= YEAR_MIN && w <= weeksInIsoYear(y - 1);
  const sameWeekNextYearValid =
    y + 1 <= YEAR_MAX && w <= weeksInIsoYear(y + 1);

  // D-01–D-04 data for this week. nameDaysForWeek/sunTimesForWeek return
  // exactly 7 entries Monday–Sunday, aligned index-for-index with the `days`
  // loop below (both built from the same mondayOf(w, y) start). Holidays and
  // school periods are sparse (not every day has one), so those are matched
  // to each day explicitly instead of by index.
  const weekNameDays = nameDaysForWeek(y, w);
  const weekHolidays = holidaysInWeek(y, w);
  const weekSchoolPeriods = schoolHolidayPeriodsInWeek(y, w);
  const weekSunTimes = sunTimesForWeek(y, w, HELSINKI);
  // Flag days are calendar-year dates, so (like holidaysInWeek) check both the
  // Monday's and the Sunday's year for a week straddling New Year.
  const weekFlagDays = [...new Set([mo.getFullYear(), su.getFullYear()])]
    .flatMap((fy) => flagDaysInYear(fy))
    .filter((f) => f.date >= mo && f.date <= su);

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(mo);
    d.setDate(mo.getDate() + i);
    return {
      date: d,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      names: weekNameDays[i]?.names ?? [],
      holidays: weekHolidays.filter((h) => sameDay(h.date, d)),
      schoolPeriods: weekSchoolPeriods.filter((p) => d >= p.startDate && d <= p.endDate),
      flagDays: weekFlagDays.filter((f) => sameDay(f.date, d)),
      sun: weekSunTimes[i],
      dayOfYear: dayOfYear(d),
      daysRemaining: daysRemainingInYear(d),
      quarter: quarterOf(d),
    };
  });

  const officialHolidays = weekHolidays.filter((h) => h.official);
  const observedOnlyHolidays = weekHolidays.filter((h) => !h.official);

  // Same days[] loop the day panel below already renders — a working day is
  // Mon–Fri with no official holiday on it, matching workingDaySplit()'s
  // definition in seo.js.
  const workingDaysCount = days.filter(
    (d) => !d.isWeekend && !d.holidays.some((h) => h.official),
  ).length;

  // Sibling weeks of this week's (Monday's) month — a topical mesh so each of
  // the ~835 week pages links to its month-neighbours, not just prev/next.
  // Each week keeps its OWN ISO year (a boundary week can belong to an adjacent
  // year, e.g. early-January days in week 52/53 of the previous year), matching
  // WeeksOfMonth's approach. Out-of-range years and this page itself are skipped.
  const anchorMonth = mo.getMonth();
  const anchorYear = mo.getFullYear();
  const monthWeeks = [];
  const seenWeeks = {};
  const daysInAnchorMonth = new Date(anchorYear, anchorMonth + 1, 0).getDate();
  for (let dd = 1; dd <= daysInAnchorMonth; dd++) {
    const d2 = new Date(anchorYear, anchorMonth, dd);
    const wk2 = isoWeek(d2);
    const yr2 = isoYear(d2);
    const key = `${yr2}-${wk2}`;
    if (seenWeeks[key]) continue;
    seenWeeks[key] = true;
    if (yr2 < YEAR_MIN || yr2 > YEAR_MAX) continue; // never link a 404
    if (wk2 === w && yr2 === y) continue; // this page itself
    monthWeeks.push({ week: wk2, year: yr2 });
  }

  return (
    <section className="app">
      <SEO
        {...weekMeta(w, y)}
        lang="fi"
        canonical={canonicalFor(`/viikko-${week}-${year}`)}
      />
      <div className="breadcrumb">
        <Link to={"/"}>Etusivu </Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Viikko {week}
      </div>
      <h1>
        Viikko {week} vuonna {year}
      </h1>

      {w === 53 && (
        <div className="notice">
          <strong>Harvinainen viikko 53.</strong> Vuonna {y} on poikkeuksellisesti
          53 viikkoa — useimmissa vuosissa niitä on vain 52. Viikko 53 on vuoden{" "}
          {y} viimeinen viikko ennen seuraavan vuoden viikkoa 1.
        </div>
      )}

      <p className="lead">
        <span className="answer-sentence">
          Viikko {week} alkaa <strong>maanantaina {fmtFullFi(mo)}</strong> ja
          päättyy <strong>sunnuntaina {fmtFullFi(su)}.</strong>
        </span>{" "}
        Se kuuluu {monthLinks} kalenteriin ja ajoittuu {season}.{" "}
        {weeksLeft === 0
          ? `Viikko ${w} on vuoden ${y} viimeinen viikko.`
          : `Vuodessa ${y} on ${total} viikkoa, joten viikon ${w} jälkeen niitä on jäljellä ${weeksLeft}.`}
      </p>

      <p className="note-soft">
        Viikko {w} merkitään suomeksi myös lyhyesti <strong>vk {w}</strong> tai{" "}
        <strong>vko {w}</strong>. ISO 8601 -merkintä on{" "}
        <code>{isoWeekDateLabel(w, y)}</code>.
      </p>

      <QuickFacts
        facts={[
          { label: "Viikko", value: w },
          {
            label: "ISO 8601 -merkintä",
            value: <code>{isoWeekDateLabel(w, y)}</code>,
          },
          { label: "Alkaa", value: fmtShortFi(mo) },
          { label: "Päättyy", value: fmtShortFi(su) },
          {
            label: "Vuosineljännes",
            value: quarterFact,
          },
          { label: "Vuodenaika", value: seasonNominative(thursday.getMonth()) },
          { label: "Työpäiviä", value: workingDaysCount },
          { label: "Juhlapäiviä", value: officialHolidays.length },
          { label: "Liputuspäiviä", value: weekFlagDays.length },
          {
            label: "Vuodesta kulunut viikon lopussa",
            value: `${Math.round((w / total) * 100)} %`,
          },
          { label: "Viikkoja jäljellä vuonna", value: weeksLeft },
        ]}
      />

      {officialHolidays.length > 0 && (
        <p className="lead">
          Tällä viikolla vietetään:{" "}
          {officialHolidays.map((h, i) => (
            <span key={h.name}>
              {i > 0 && ", "}
              {holidayLink(h)}
            </span>
          ))}
          .
        </p>
      )}
      {observedOnlyHolidays.length > 0 && (
        <p className="lead">
          {observedOnlyHolidays.map((h, i) => (
            <span key={h.name}>
              {i > 0 && " ja "}
              {holidayLink(h)}
            </span>
          ))}{" "}
          {observedOnlyHolidays.length === 1 ? "ei ole virallinen arkipyhä" : "eivät ole virallisia arkipyhiä"}, mutta
          {observedOnlyHolidays.length === 1 ? " sitä" : " niitä"} vietetään laajasti.
        </p>
      )}
      {weekFlagDays.length > 0 && (
        <p className="lead">
          {weekFlagDays.length === 1 ? "Liputuspäivä" : "Liputuspäivät"} tällä
          viikolla:{" "}
          {weekFlagDays.map((f, i) => (
            <span key={f.name}>
              {i > 0 && ", "}
              {flagDayLink(f)} ({f.weekday.toLowerCase()} {fmtShortFi(f.date)})
            </span>
          ))}
          .
        </p>
      )}
      {weekSchoolPeriods.length > 0 && (
        <p className="lead">
          Koululoma tällä viikolla: {weekSchoolPeriods.map(schoolPeriodLabel).join(", ")}.{" "}
          <Link to={`/koululomat-${y}`}>Katso koululomat {y} alueittain</Link>.
        </p>
      )}

      <div className="panel">
        <div className="now-label">Viikonpäivät</div>
        <div className="days">
          {days.map((day, i) => (
            <div key={i} className={`day ${day.isWeekend ? "weekend" : ""}`}>
              <div className="day-head">
                <span className="wd">{WD[day.date.getDay()]}</span>
                <span className="dt">
                  {day.names.some(hasNameDayPage) ? (
                    <Link to={`/nimipaivat/${dateKeyFor(day.date)}`}>{dFull(day.date)}</Link>
                  ) : dFull(day.date)}
                </span>
              </div>
              <div className="day-extra">
                <div>
                  Vuoden {day.dayOfYear}. päivä · {day.daysRemaining} päivää vuoden
                  loppuun · {day.quarter}. neljännes
                </div>
                {day.names.length > 0 && (
                  <div>
                    {day.names.length === 1 ? "Nimipäivä" : "Nimipäivät"}:{" "}
                    {day.names.map((name, nameIndex) => (
                      <span key={name}>
                        {nameIndex > 0 && ", "}
                        {hasNameDayPage(name) ? (
                          <Link to={`/nimipaiva/${nameDaySlug(name)}`}>{name}</Link>
                        ) : name}
                      </span>
                    ))}
                  </div>
                )}
                {day.holidays.map((h) => (
                  <div key={h.name}>
                    {holidayLink(h)}
                    {!h.official && " (ei virallinen arkipyhä)"}
                  </div>
                ))}
                {day.flagDays.map((f) => (
                  <div key={f.name}>Liputuspäivä: {flagDayLink(f)}</div>
                ))}
                {day.schoolPeriods.map((p) => (
                  <div key={p.type + p.week}>{schoolPeriodLabel(p)}</div>
                ))}
                <div>
                  {day.sun.polarNight
                    ? "Aurinko ei nouse Helsingissä tänään (kaamos)."
                    : day.sun.polarDay
                      ? "Aurinko ei laske Helsingissä tänään (yötön yö)."
                      : `Aurinko Helsingissä: ${formatHelsinkiTime(day.sun.sunrise)}–${formatHelsinkiTime(day.sun.sunset)} (${Math.floor(day.sun.daylightMinutes / 60)} h ${day.sun.daylightMinutes % 60} min valoisaa${
                          day.sun.deltaMinutesFromPreviousDay !== 0
                            ? `, ${day.sun.deltaMinutesFromPreviousDay > 0 ? "+" : "−"}${Math.abs(day.sun.deltaMinutesFromPreviousDay)} min edelliseen päivään verrattuna`
                            : ""
                        })`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="note-soft">
        Ajat lasketaan Helsingin sijainnin mukaan.
      </p>

      <p>
        <a className="btn" href={weekPdfPath(w, y)} download>
          Lataa viikko {w}/{y} PDF-tiedostona
        </a>
      </p>

      <div className="prevnext" onClick={() => window.scrollTo(0, 0)}>
        {prevY >= YEAR_MIN && (
          <Link to={`/viikko-${prevW}-${prevY}`}>
            <span className="lbl">Edellinen</span>Viikko {prevW}, {prevY}
          </Link>
        )}
        {nextY <= YEAR_MAX && (
          <Link to={`/viikko-${nextW}-${nextY}`}>
            <span className="lbl">Seuraava</span>Viikko {nextW}, {nextY}
          </Link>
        )}
      </div>

      {(sameWeekPrevYearValid || sameWeekNextYearValid) && (
        <div className="prevnext" onClick={() => window.scrollTo(0, 0)}>
          {sameWeekPrevYearValid && (
            <Link to={`/viikko-${w}-${y - 1}`}>
              <span className="lbl">Viikko {w} viime vuonna</span>Viikko {w}, {y - 1}
            </Link>
          )}
          {sameWeekNextYearValid && (
            <Link to={`/viikko-${w}-${y + 1}`}>
              <span className="lbl">Viikko {w} ensi vuonna</span>Viikko {w}, {y + 1}
            </Link>
          )}
        </div>
      )}

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        <details open>
          <summary>Mikä viikko on {fmtShortFi(mo)}?</summary>
          <p>
            {fmtShortFi(mo)} kuuluu viikkoon {w} vuonna {y}.
          </p>
        </details>
        <details>
          <summary>
            Milloin viikko {w} vuonna {y} alkaa ja päättyy?
          </summary>
          <p>
            Viikko {w} vuonna {y} alkaa maanantaina {fmtShortFi(mo)} ja päättyy
            sunnuntaina {fmtShortFi(su)}.
          </p>
        </details>
        {officialHolidays.length > 0 && (
          <details>
            <summary>
              Mitä juhlapäiviä viikolla {w} vuonna {y} on?
            </summary>
            <p>
              Viikolla {w} vuonna {y} vietetään:{" "}
              {officialHolidays.map((h) => h.name).join(", ")}.
            </p>
          </details>
        )}
      </section>

      <section className="related">
        <h2>Katso myös</h2>

        {monthWeeks.length > 0 && (
          <>
            <h3>
              Muut {M_GENITIVE[anchorMonth]} {anchorYear} viikot
            </h3>
            <div className="pills">
              {monthWeeks.map((mw) => (
                <Link
                  key={`${mw.year}-${mw.week}`}
                  className="pill"
                  to={`/viikko-${mw.week}-${mw.year}`}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Viikko {mw.week}
                  {mw.year !== y ? ` / ${mw.year}` : ""}
                </Link>
              ))}
            </div>
          </>
        )}

        <h3>Vuosi {y}</h3>
        <ul className="links">
          <li>
            <Link to={`/vuosi-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Kaikki viikot vuonna {y}
            </Link>
          </li>
          <li>
            <Link to={`/kalenteri-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Vuoden {y} kalenteri
            </Link>
          </li>
          <li>
            <Link to={`/pyhapaivat-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Pyhäpäivät ja liputuspäivät {y}
            </Link>
          </li>
          <li>
            <Link to={`/liputuspaivat-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Liputuspäivät {y}
            </Link>
          </li>
          <li>
            <Link to={`/tyopaivat-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Työpäivät ja arkipäivät {y}
            </Link>
          </li>
          <li>
            <Link to={`/tulosta-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Tulostettava viikkolista {y}
            </Link>
          </li>
        </ul>

        <h3>ISO 8601</h3>
        <ul className="links">
          <li>
            <Link to="/mika-on-viikkonumero" onClick={() => window.scrollTo(0, 0)}>
              Mikä on viikkonumero?
            </Link>
          </li>
          <li>
            <Link to="/suomi-vs-usa-viikkonumerot" onClick={() => window.scrollTo(0, 0)}>
              Suomi vs. USA — miksi viikkonumero eroaa?
            </Link>
          </li>
        </ul>

        <h3>Laskurit</h3>
        <ul className="links">
          <li>
            <Link to="/paivamaara-viikoksi" onClick={() => window.scrollTo(0, 0)}>
              Muunna päivämäärä viikkonumeroksi
            </Link>
          </li>
          <li>
            <Link to="/viikko-paivamaaraksi" onClick={() => window.scrollTo(0, 0)}>
              Muunna viikkonumero päivämääräksi
            </Link>
          </li>
        </ul>
      </section>
    </section>
  );
};

export default WeekDays;
