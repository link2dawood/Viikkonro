import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, routeMeta } from "../data/seo.js";
import { weeksInIsoYear } from "../components/dateUtils.js";
import {
  YEAR_INDEX_PATH,
  yearIndexFaqs,
  yearIndexStats,
} from "../data/yearIndexPages.js";

// Crawl entry point for the years outside the indexable window. See
// src/data/yearIndexPages.js for why the homepage no longer links them all.
export default function YearIndex() {
  const meta = routeMeta[YEAR_INDEX_PATH];
  const today = useToday();
  const { first, last, count, weekCount, featured, earlier, later } =
    yearIndexStats(today);
  const faqs = yearIndexFaqs(today);

  // Every group renders the same row, so a year's links can't drift between
  // the featured, earlier and later sections.
  const yearRow = (year) => (
    <tr key={year}>
      <th scope="row">
        <Link to={`/vuosi-${year}`}>{year}</Link>
      </th>
      <td>{weeksInIsoYear(year)} viikkoa</td>
      <td>
        <Link to={`/kalenteri-${year}`}>Kalenteri</Link>
        {" · "}
        <Link to={`/pyhapaivat-${year}`}>Pyhäpäivät</Link>
        {" · "}
        <Link to={`/tyopaivat-${year}`}>Työpäivät</Link>
        {" · "}
        <Link to={`/tulostettava-kalenteri-${year}`}>Tulostettava</Link>
      </td>
    </tr>
  );

  const yearTable = (years) => (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Vuosi</th>
            <th scope="col">ISO-viikot</th>
            <th scope="col">Sivut</th>
          </tr>
        </thead>
        <tbody>{years.map(yearRow)}</tbody>
      </table>
    </div>
  );

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(YEAR_INDEX_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Kaikki vuodet
      </div>

      <h1>
        Kaikki vuodet {first}-{last}
      </h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Sivustolla on viikkonumerot ja vuosikalenteri {count} vuodelle,
            vuosilta {first}-{last}. Niissä on yhteensä {weekCount} ISO 8601
            -viikkoa. Valitse vuosi alta.
          </strong>
        </p>

        <h2>
          Ajankohtaiset vuodet {featured[0]}-{featured.at(-1)}
        </h2>
        <p>
          Nämä vuodet ovat haetuimpia juuri nyt, ja ne löytyvät myös etusivulta.
        </p>
        {yearTable(featured)}

        <AdSlot placement="year-index-after-featured" />

        {later.length > 0 && (
          <>
            <h2>
              Myöhemmät vuodet {later[0]}-{later.at(-1)}
            </h2>
            <p>
              Tulevien vuosien viikkonumerot on laskettu ISO 8601 -säännöillä,
              joten ne ovat valmiita ja pysyviä. Pyhäpäivien ja koululomien
              kaltaiset tiedot vahvistetaan lähempänä kyseistä vuotta.
            </p>
            {yearTable(later)}
          </>
        )}

        {earlier.length > 0 && (
          <>
            <h2>
              Aiemmat vuodet {earlier.at(-1)}-{earlier[0]}
            </h2>
            <p>
              Menneiden vuosien sivut pysyvät verkossa, jotta vanhat
              päivämäärät ja viikkonumerot voi edelleen tarkistaa.
            </p>
            {yearTable(earlier)}
          </>
        )}

        <h2>Usein kysyttyä julkaistuista vuosista</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/mika-on-viikkonumero">mikä on viikkonumero</Link>,{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">kuinka monta viikkoa vuodessa on</Link> ja{" "}
          <Link to="/miksi-vuodessa-on-53-viikkoa">miksi vuodessa on 53 viikkoa</Link>.
        </p>
      </div>
    </section>
  );
}
