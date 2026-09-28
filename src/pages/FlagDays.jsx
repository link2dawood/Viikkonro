import { Link, useParams } from "react-router-dom";
import {
  fmtFullFi,
  fmtShortFi,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
import { flagDayFaqs, flagDaysInYear, flagDaysMeta } from "../data/flagDayPages";
import { holidayLinkPath } from "../data/holidayPages";
import { observancePathForFlagDay } from "../data/observanceDays";

// Finland's flag-day (liputuspäivät) hub for a year (/liputuspaivat-2026).
// Distinct from /pyhapaivat-<year> (public holidays) — a flag day is not
// automatically a public holiday, and vice versa; the "Arkipyhä" column below
// makes the (usually empty) overlap explicit rather than implying one.
// Purely a function of the year (flagDaysInYear()), so SSR and hydration
// always agree.
const FlagDays = ({ year: pYear } = {}) => {
  const params = useParams();
  const year = pYear ?? params.year;
  const y = Number(year);

  const days = flagDaysInYear(y);
  const officialCount = days.filter((d) => d.category === "virallinen").length;
  const establishedCount = days.filter((d) => d.category === "vakiintunut").length;
  const internationalCount = days.filter((d) => d.category === "kansainvälinen").length;
  const suomenLipunPaiva = days.find((d) => d.altName === "Suomen lipun päivä");

  // Shared with prerender.js's FAQPage JSON-LD so the visible FAQ and the
  // schema can't drift — same discipline as every other FAQ set in this
  // codebase.
  const faqs = flagDayFaqs(y);

  const holidayLink = (name, date) => {
    const path = holidayLinkPath(name, date);
    return path ? <Link to={path}>{name}</Link> : name;
  };

  return (
    <section className="app">
      <SEO {...flagDaysMeta(y)} canonical={canonicalFor(`/liputuspaivat-${year}`)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Liputuspäivät {year}
      </div>

      <h1>Suomen liputuspäivät {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Vuonna {year} Suomessa on <strong>{days.length} liputuspäivää</strong>.
        </span>{" "}
        {suomenLipunPaiva && (
          <>
            Suomen lipun päivä (Puolustusvoimain lippujuhlan päivä) on{" "}
            {fmtFullFi(suomenLipunPaiva.date)}.
          </>
        )}
      </p>

      <QuickFacts
        facts={[
          { label: "Vuosi", value: year },
          { label: "Liputuspäiviä yhteensä", value: days.length },
          { label: "Virallisia liputuspäiviä", value: officialCount },
          { label: "Vakiintuneita liputuspäiviä", value: establishedCount },
          { label: "Kansainvälisiä merkkipäiviä", value: internationalCount },
        ]}
      />

      <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Liputuspäivä</th>
              <th>Päivämäärä</th>
              <th>Viikonpäivä</th>
              <th>Viikko</th>
              <th>Tyyppi</th>
              <th>Arkipyhä</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={`${d.name}-${d.date.toISOString()}`} id={d.slug}>
                <td>
                  {observancePathForFlagDay(d.name, y) ? (
                    <Link to={observancePathForFlagDay(d.name, y)}>{d.name}</Link>
                  ) : (
                    d.name
                  )}
                  {d.altName ? ` (${d.altName})` : ""}
                </td>
                <td>
                  <Link to={`/kuukausi-${d.month}-${year}`}>
                    {fmtShortFi(d.date)}
                  </Link>
                </td>
                <td>{d.weekday}</td>
                <td>
                  <Link to={`/viikko-${d.week}-${d.weekYear}`}>
                    Viikko {d.week}
                  </Link>
                </td>
                <td>{d.categoryLabel}</td>
                <td>
                  {d.holidayOverlap ? holidayLink(d.holidayOverlap, d.date) : "Ei"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p>
        Katso myös <Link to={`/isanpaiva-${year}`}>isänpäivä {year}</Link>,{" "}
        <Link to={`/aitienpaiva-${year}`}>äitienpäivä {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/vuosi-${year}`}>vuoden {year} viikkonumerot</Link>,{" "}
        <Link to={`/kalenteri-${year}`}>vuoden {year} kalenteri</Link> ja{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={`/liputuspaivat-${y - 1}`}>
            <span className="lbl">Edellinen</span>Liputuspäivät {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={`/liputuspaivat-${y + 1}`}>
            <span className="lbl">Seuraava</span>Liputuspäivät {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default FlagDays;
