import { Link } from "react-router-dom";
import { fmtFullFi, M_FULL } from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { useToday } from "../components/useToday";
import { canonicalFor } from "../data/seo";
import {
  CALCULATOR_PATH,
  OFFSETS,
  monthlyTable,
  offsetFaqs,
  offsetMeta,
  offsetNote,
  offsetPage,
  offsetPath,
} from "../data/dateCalculator";

// "N päivää eteenpäin" (/90-paivaa-eteenpain): the answer for today via
// useToday() (prerendered day during hydration, live day after), plus a
// table of N days from the 1st of every month, which does not depend on today.
const DateOffset = ({ n }) => {
  const today = useToday();
  const p = offsetPage(n, today);
  const faqs = offsetFaqs(n, today);
  const year = p.from.getFullYear();
  const table = monthlyTable(n, year);
  const note = offsetNote(n);

  return (
    <section className="app">
      <SEO {...offsetMeta(n, today)} canonical={canonicalFor(p.path)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / {n} päivää eteenpäin
      </div>

      <h1>{n} päivää eteenpäin</h1>

      <p className="lead">
        <span className="answer-sentence">
          <strong>
            {n} päivää tästä päivästä on {p.weekdayEssive} {fmtFullFi(p.result)}
          </strong>{" "}
          ja kuuluu viikkoon {p.week}.
        </span>{" "}
        Laskettu päivästä {fmtFullFi(p.from)}; aloituspäivä on päivä nolla.
      </p>

      <QuickFacts
        title={`${n} päivää lyhyesti`}
        facts={[
          { label: "Päivämäärä", value: fmtFullFi(p.result) },
          { label: "Viikonpäivä", value: p.weekday },
          { label: "Viikkonumero", value: <Link to={p.weekPath}>viikko {p.week}</Link> },
          { label: "Viikkoina", value: p.weeksAndDays },
          { label: "Arkipäiviä välissä", value: p.workingDays },
          { label: `${n} päivää sitten`, value: fmtFullFi(p.back) },
        ]}
      />

      <section className="prose">
        <h2>Mikä päivä on {n} päivän päästä?</h2>
        <p>
          {n} päivää tästä päivästä on {p.weekdayEssive} {fmtFullFi(p.result)}.
          {p.holiday ? ` Päivä on arkipyhä (${p.holiday}).` : ""} Väliin mahtuu{" "}
          {p.workingDays} arkipäivää, kun viikonloput ja viralliset arkipyhät
          jätetään pois. Katso koko <Link to={p.weekPath}>viikko {p.week}</Link> ja{" "}
          <Link to={p.monthPath}>{p.monthLabel}</Link>.
        </p>
        {note && <p>{note}</p>}
        <p>
          Jos tarvitset toisen määrän, toisen aloituspäivän tai pelkät arkipäivät,
          käytä <Link to={CALCULATOR_PATH}>päivämäärälaskuria</Link>.
        </p>

        <h2>
          {n} päivää kunkin kuukauden alusta vuonna {year}
        </h2>
      </section>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Alkaen</th>
              <th scope="col">{n} päivän päästä</th>
              <th scope="col">Viikonpäivä</th>
              <th scope="col">Viikko</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => (
              <tr key={i}>
                <th scope="row">1. {M_FULL[i].toLowerCase()}ta</th>
                <td>{fmtFullFi(row.result)}</td>
                <td>{row.weekday}</td>
                <td>
                  <Link to={`/viikko-${row.week}-${row.weekYear}`}>viikko {row.week}</Link>
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

      <p className="hub-links">
        Muut valmiit laskut:{" "}
        {OFFSETS.filter((o) => o !== n).map((o, i, arr) => (
          <span key={o}>
            <Link to={offsetPath(o)}>{o} päivää eteenpäin</Link>
            {i < arr.length - 1 ? ", " : "."}
          </span>
        ))}{" "}
        Katso myös <Link to="/paivien-erotus">päivien erotus</Link> ja{" "}
        <Link to="/tyopaivalaskuri">työpäivälaskuri</Link>.
      </p>
    </section>
  );
};

export default DateOffset;
