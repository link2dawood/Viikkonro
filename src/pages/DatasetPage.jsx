import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import "./datasetPage.css";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
import { DATASET_PAGES, datasetPageFaqs, datasetPageMeta } from "../data/datasetPages";
import { PRERENDER_MIN_YEAR, PRERENDER_MAX_YEAR } from "../components/dateUtils";

// One shared component for all 5 dataset landing pages (/data/week,
// /data/month, /data/year, /data/holiday, /data/working-days) — they share
// identical structure (per docs/downloadable-datasets.md's "shared page
// template"), differing only in content, so one component + a config
// object (src/data/datasetPages.js) is a single source of truth instead of
// 5 near-duplicate files that could drift from each other.
const DatasetPage = ({ family }) => {
  const p = DATASET_PAGES[family];
  const path = `/data/${family}`;
  const meta = datasetPageMeta(family);
  const faqs = datasetPageFaqs(family);
  const years = Array.from(
    { length: PRERENDER_MAX_YEAR - PRERENDER_MIN_YEAR + 1 },
    (_, i) => PRERENDER_MIN_YEAR + i,
  );

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(path)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/avoin-data">Avoin data</Link>{" "}
        / {p.title}
      </div>
      <h1>{p.title}</h1>

      <div className="prose">
        <p className="lead">
          <span className="answer-sentence">{p.intro}</span>
        </p>
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Formaatit</h2>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Formaatti</th>
              <th>URL-kaava</th>
              <th>Esimerkki</th>
              <th>Muoto</th>
            </tr>
          </thead>
          <tbody>
            {p.formats.map((f) => (
              <tr key={f.format}>
                <td>{f.format}</td>
                <td><code>{f.pattern}</code></td>
                <td><a href={f.example}>{f.example}</a></td>
                <td>{f.shape}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose">
        <h2>Kentät</h2>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kenttä</th>
              <th>Kuvaus</th>
            </tr>
          </thead>
          <tbody>
            {p.fields.map(([name, desc]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note-soft">
        CSV-sarakkeet: <code className="dataset-columns">{p.csvColumns}</code>
      </p>

      <div className="prose">
        <h2>Lataa vuosittain</h2>
        <p>
          {p.bulkIsAllYears
            ? "Tämä datasetti on yksi tiedosto, joka sisältää kaikki vuodet."
            : "CSV ja XML sisältävät koko vuoden datan yhdessä tiedostossa:"}
        </p>
      </div>
      {!p.bulkIsAllYears && (
        <div className="pills">
          {years.map((y) => (
            <a key={y} className="pill" href={`/data/${family}/${y}.csv`}>
              {y}
            </a>
          ))}
        </div>
      )}
      {p.bulkIsAllYears && (
        <p>
          <a className="btn" href="/data/year.csv">
            Lataa CSV
          </a>{" "}
          <a className="btn" href="/data/year.xml">
            Lataa XML
          </a>
        </p>
      )}

      <div className="prose">
        <h2>Usein kysyttyä</h2>
        <div className="faq-list">
          {faqs.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to="/avoin-data">
            <b>Avoin data</b>
            <span>Kaikkien datasettien dokumentaatio yhdellä sivulla</span>
          </Link>
          <Link className="ql" to="/api-playground">
            <b>API Playground</b>
            <span>Kokeile rajapintaa selaimessa</span>
          </Link>
          <Link className="ql" to="/tietolahteet">
            <b>Tietolähteet</b>
            <span>Mihin tämä data perustuu</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DatasetPage;
