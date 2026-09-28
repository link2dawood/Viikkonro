import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor } from "../data/seo";
import {
  SUN_HUB_PATH,
  fmtDaylight,
  fmtTime,
  sunAllToday,
  sunCityPath,
  sunHubFaqs,
  sunHubMeta,
} from "../data/sunCities";

const cell = (r, key) => (r.sunrise ? fmtTime(r[key]) : r.polarDay ? "ei laske" : "ei nouse");

// Hub (/auringonlasku): today's sunrise and sunset in every city, south to
// north, each linking to its own page.
const SunHub = () => {
  const today = useToday();
  const rows = sunAllToday(today);
  const faqs = sunHubFaqs(today);

  return (
    <section className="app">
      <SEO {...sunHubMeta()} canonical={canonicalFor(SUN_HUB_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Auringonnousu ja -lasku
      </div>

      <h1>Auringonnousu ja -lasku tänään</h1>
      <p className="lead">
        <span className="answer-sentence">
          Auringonnousu- ja laskuajat tänään, {fmtFullFi(today)}, Suomen
          kaupungeissa etelästä pohjoiseen.
        </span>{" "}
        Valitse kaupunki nähdäksesi koko vuoden ajat, pisimmän ja lyhyimmän
        päivän sekä Lapissa keskiyön auringon ja kaamoksen.
      </p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Kaupunki</th>
              <th scope="col">Nousu</th>
              <th scope="col">Lasku</th>
              <th scope="col">Valoisaa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.city.slug}>
                <th scope="row">
                  <Link to={sunCityPath(r.city.slug)}>{r.city.name}</Link>
                </th>
                <td>{cell(r, "sunrise")}</td>
                <td>{cell(r, "sunset")}</td>
                <td>{fmtDaylight(r.daylight)}</td>
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
        Katso myös <Link to={`/kesaaika-${today.getFullYear()}`}>kesäaika {today.getFullYear()}</Link>{" "}
        ja <Link to={`/kuun-vaiheet-${today.getFullYear()}`}>kuun vaiheet {today.getFullYear()}</Link>.
      </p>
    </section>
  );
};

export default SunHub;
