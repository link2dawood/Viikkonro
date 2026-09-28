import { Link } from "react-router-dom";
import {
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
  fmtFullFi,
  isoWeek,
  isoYear,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { canonicalFor } from "../data/seo";
import {
  ALMANAC_URL,
  FACTS_CHECKED,
  TRADITIONS,
  calendarFacts,
  observanceFaqs,
  observanceHighlights,
  observanceMeta,
  observancePage,
  observancePath,
  siblingObservances,
  upcomingYears,
} from "../data/observanceDays";
import NotFound from "./NotFound";

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// One observance day for one year (/isanpaiva-2026, /laskiainen-2027, ...):
// the date and week, how the date is set, flag-day status, a fact unique to
// that day and year, and the same day in the coming years.
const ObservanceDay = ({ slug, year }) => {
  const page = observancePage(slug, year);
  if (!page) return <NotFound />;
  const y = page.year;
  const lower = lowerFirst(page.name);
  const day = page.dayLabel ?? page.name;
  const faqs = observanceFaqs(page);
  const highlights = observanceHighlights(page);
  const upcoming = upcomingYears(slug, y);
  const allDays = [{ label: day, date: page.date }, ...page.extras];

  return (
    <section className="app">
      <SEO {...observanceMeta(slug, y)} canonical={canonicalFor(page.path)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${y}`}>Viikot {y}</Link> / {page.name} {y}
      </div>

      <h1>
        {page.name} {y}
      </h1>

      <p className="lead">
        <span className="answer-sentence">
          <strong>
            {day} {y} on {page.weekdayEssive} {fmtFullFi(page.date)}
          </strong>{" "}
          ja kuuluu viikkoon {page.week}.
        </span>{" "}
        {page.extras.length === 1 &&
          `${page.extras[0].label} on ${fmtFullFi(page.extras[0].date)}.`}
      </p>

      <QuickFacts
        title={`${page.name} ${y} lyhyesti`}
        facts={[
          { label: "Päivämäärä", value: fmtFullFi(page.date) },
          { label: "Viikonpäivä", value: page.weekday },
          {
            label: "Viikkonumero",
            value: <Link to={page.weekPath}>viikko {page.week}</Link>,
          },
          {
            label: "Kuukausi",
            value: <Link to={page.monthPath}>{page.monthLabel}</Link>,
          },
          {
            label: "Liputuspäivä",
            value: page.isFlagDay ? "Kyllä, virallinen" : "Ei",
          },
        ]}
      />

      <section className="prose">
        <h2>
          Milloin {lower} on vuonna {y}?
        </h2>
        <p>
          {day} on {page.weekdayEssive} {fmtFullFi(page.date)}. {page.rule}
        </p>

        {page.extrasHeading && (
          <>
            <h2>
              {page.extrasHeading} {y}
            </h2>
            <ul>
              {allDays.map((d) => (
                <li key={d.label}>
                  <strong>{d.label}:</strong> {fmtFullFi(d.date)} (
                  <Link to={`/viikko-${isoWeek(d.date)}-${isoYear(d.date)}`}>
                    viikko {isoWeek(d.date)}
                  </Link>
                  )
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Hyvä tietää</h2>
        {highlights.map((h) => (
          <p key={h.text}>
            {h.text} Katso myös <Link to={h.link.to}>{lowerFirst(h.link.label)}</Link>.
          </p>
        ))}

        <h2>
          Onko {lower} liputuspäivä?
        </h2>
        <p>
          {page.flagDay} Kaikki vuoden liputuspäivät löydät sivulta{" "}
          <Link to={`/liputuspaivat-${y}`}>liputuspäivät {y}</Link> ja viralliset
          vapaapäivät sivulta <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>.
        </p>

        <h2>
          {page.name} kalenterissa
        </h2>
        {calendarFacts(page).map((fact) => (
          <p key={fact}>{fact}</p>
        ))}

        <h2>Taustaa</h2>
        <p>{page.history}</p>

        <h2>
          {upperFirst(page.genitive)} perinteet
        </h2>
        <p>{TRADITIONS[slug]}</p>

        <h2>
          {page.name} tulevina vuosina
        </h2>
      </section>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Vuosi</th>
              <th scope="col">Päivämäärä</th>
              <th scope="col">Viikonpäivä</th>
              <th scope="col">Viikko</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((u) => (
              <tr key={u.year}>
                <th scope="row">
                  {u.year === y ? (
                    u.year
                  ) : (
                    <Link to={u.path}>
                      {page.name} {u.year}
                    </Link>
                  )}
                </th>
                <td>{fmtFullFi(u.date)}</td>
                <td>{u.weekday}</td>
                <td>
                  <Link to={u.weekPath}>viikko {u.week}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note-soft">
        Päivämäärät on laskettu almanakan sääntöjen mukaan. Lähde:{" "}
        <a href={ALMANAC_URL} target="_blank" rel="noopener noreferrer">
          Helsingin yliopiston almanakkatoimisto
        </a>{" "}
        (tarkistettu {FACTS_CHECKED}).
      </p>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Muut juhlapäivät {y}:{" "}
        {siblingObservances(slug, y).map((s, i, arr) => (
          <span key={s.to}>
            <Link to={s.to}>{s.label}</Link>
            {i < arr.length - 1 ? ", " : "."}
          </span>
        ))}{" "}
        Katso myös <Link to={`/kalenteri-${y}`}>kalenteri {y}</Link> ja{" "}
        <Link to={`/vuosi-${y}`}>vuoden {y} viikkonumerot</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={observancePath(slug, y - 1)}>
            <span className="lbl">Edellinen</span>
            {page.name} {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={observancePath(slug, y + 1)}>
            <span className="lbl">Seuraava</span>
            {page.name} {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default ObservanceDay;
