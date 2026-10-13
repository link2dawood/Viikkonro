import pageCss from "./calendarPage.css?raw";
import { Link, useParams } from "react-router-dom";
import {
  M_FULL,
  M_INESSIVE,
  M_SLUG,
  fmtShortFi,
  validateQuarter,
  validateYear,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import {
  canonicalFor,
  quarterFaqs,
  quarterMeta,
  quarterStats,
} from "../data/seo";
import { holidayLinkPath } from "../data/holidayPages";
import NotFound from "./NotFound";

// Fiscal-quarter hub (/q1-2026 .. /q4-2026) — targets "Q1 2026 viikot",
// "Q2 2026 työpäivät" style queries, a search intent none of the existing
// week/month/year pages own directly. Purely a function of quarter/year (via
// quarterStats(), itself built from the same monthStats() the month pages
// already use), so SSR and hydration always agree.
const QuarterPage = ({ quarter: pQuarter, year: pYear } = {}) => {
  const params = useParams();
  const quarter = pQuarter ?? params.quarter;
  const year = pYear ?? params.year;
  const q = Number(quarter);
  const y = Number(year);

  // Must run before quarterStats(): an out-of-range quarter indexes
  // QUARTER_MONTHS out of bounds and throws inside seo.js, not renders
  // NotFound, if this check isn't first.
  if (!validateYear(y) || !validateQuarter(q)) return <NotFound />;

  const stats = quarterStats(y, q);
  const officialHolidays = stats.holidays.filter((h) => h.official);
  const firstWeek = stats.weeks[0].week;
  const lastWeek = stats.weeks[stats.weeks.length - 1].week;

  // Shared with prerender.js's quarterNodes() (FAQPage JSON-LD) so the
  // visible FAQ and the schema can't drift — same discipline as
  // monthFaqs()/yearFaqs().
  const faqs = quarterFaqs(q, y);

  const holidayLink = (h) => {
    const path = holidayLinkPath(h.name, h.date);
    return path ? <Link to={path}>{h.name}</Link> : h.name;
  };

  var prevQ = q - 1,
    prevY = y;
  if (prevQ < 1) {
    prevQ = 4;
    prevY = y - 1;
  }
  var nextQ = q + 1,
    nextY = y;
  if (nextQ > 4) {
    nextQ = 1;
    nextY = y + 1;
  }

  return (
    <section className="app">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />
      <SEO
        {...quarterMeta(q, y)}
        canonical={canonicalFor(`/q${quarter}-${year}`)}
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Q{quarter} {year}
      </div>

      <h1>
        Q{quarter} {year}
      </h1>

      <p className="lead">
        <span className="answer-sentence">
          Q{quarter} {year} sisältää{" "}
          <strong>
            viikot {firstWeek}–{lastWeek}
          </strong>{" "}
          ja yhteensä <strong>{stats.working} työpäivää</strong>.
        </span>{" "}
        Vuosineljännes kattaa {stats.months.map((m) => M_FULL[m - 1]).join(", ")}.
      </p>

      <QuickFacts
        facts={[
          { label: "Vuosineljännes", value: `Q${quarter}` },
          { label: "Vuosi", value: year },
          { label: "Alkaa", value: fmtShortFi(stats.firstDay) },
          { label: "Päättyy", value: fmtShortFi(stats.lastDay) },
          {
            label: "Kuukaudet",
            value: `${M_FULL[stats.months[0] - 1]} – ${M_FULL[stats.months[2] - 1]}`,
          },
          {
            label: "Viikot",
            value: firstWeek === lastWeek ? `${firstWeek}` : `${firstWeek}–${lastWeek}`,
          },
          { label: "Työpäiviä", value: stats.working },
          { label: "Viikonlopun päiviä", value: stats.weekend },
          { label: "Arkipyhiä", value: officialHolidays.length },
        ]}
      />

      <section className="related">
        <h2>Kuukaudet</h2>
        <div className="pills">
          {stats.months.map((m) => (
            <Link
              key={m}
              className="pill"
              to={`/kuukausi-${m}-${year}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {M_FULL[m - 1]}
            </Link>
          ))}
        </div>

        <h2>Viikot</h2>
        <div className="pills">
          {stats.weeks.map((w) => (
            <Link
              key={`${w.year}-${w.week}`}
              className="pill"
              to={`/viikko-${w.week}-${w.year}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              Viikko {w.week}
              {w.year !== y ? ` / ${w.year}` : ""}
            </Link>
          ))}
        </div>
      </section>

      {officialHolidays.length > 0 && (
        <p className="lead">
          Arkipyhät Q{quarter} {year}:{" "}
          {officialHolidays.map((h, i) => (
            <span key={h.name}>
              {i > 0 && ", "}
              {holidayLink(h)}
            </span>
          ))}
          .
        </p>
      )}

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="related">
        <h2>Katso myös</h2>
        <ul className="links">
          <li>
            <Link to={`/vuosi-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Kaikki viikot vuonna {y}
            </Link>
          </li>
          <li>
            <Link to={`/tyopaivat-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Työpäivät koko vuonna {y}
            </Link>
          </li>
          {stats.months.map((m) => (
            <li key={m}>
              <Link
                to={`/tyopaivat-${M_SLUG[m - 1]}-${y}`}
                onClick={() => window.scrollTo(0, 0)}
              >
                Työpäivät {M_INESSIVE[m - 1]} {y}
              </Link>
            </li>
          ))}
          <li>
            <Link to={`/pyhapaivat-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Pyhäpäivät ja liputuspäivät {y}
            </Link>
          </li>
          <li>
            <Link to={`/kalenteri-${y}`} onClick={() => window.scrollTo(0, 0)}>
              Vuoden {y} kalenteri
            </Link>
          </li>
        </ul>
      </section>

      <div className="prevnext">
        {prevY >= YEAR_MIN && (
          <Link to={`/q${prevQ}-${prevY}`}>
            <span className="lbl">Edellinen</span>Q{prevQ} {prevY}
          </Link>
        )}
        {nextY <= YEAR_MAX && (
          <Link className="nx" to={`/q${nextQ}-${nextY}`}>
            <span className="lbl">Seuraava</span>Q{nextQ} {nextY}
          </Link>
        )}
      </div>
    </section>
  );
};

export default QuarterPage;
