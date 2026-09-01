import { useParams, Link } from "react-router-dom";
import {
  isoWeek,
  isoYear,
  weeksInIsoYear,
  mondayOf,
  dFull,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import AdSlot from "../components/AdSlot";
import { canonicalFor, printMeta } from "../data/seo";
import {
  downloadCalendarCsv,
  printListFaqs,
} from "../data/printCalendarContent";

const PrintCalendar = ({ year: pYear } = {}) => {
  const params = useParams();
  const selectedYear = Number(pYear ?? params.year);

  const years = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    years.push(y);
  }

  const NOW = new Date();
  const W_NOW = isoWeek(NOW);
  const Y_NOW = isoYear(NOW);

  const total = weeksInIsoYear(selectedYear);
  const faqs = printListFaqs(selectedYear);

  const weeks = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <section className="app">
      <SEO
        {...printMeta(selectedYear)}
        canonical={canonicalFor(`/tulosta-${selectedYear}`)}
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/kalenteri-${selectedYear}`}>Kalenteri {selectedYear}</Link> /{" "}
        Tulostettava viikkolista {selectedYear}
      </div>

      <h1>Tulostettava viikkolista {selectedYear}</h1>

      <p className="lead">
        <strong>
          Tulostettava viikkolista {selectedYear} sisältää vuoden kaikki {total}
          {" "}ISO-viikkoa sekä niiden alkamis- ja päättymispäivät.
        </strong>{" "}
        Tulosta lista, tallenna se PDF-muodossa tai lataa tiedot
        Excel-yhteensopivana CSV-tiedostona.
      </p>
      <div className="panel noprint">
        <div className="now-label">Tulostettavat viikot lyhyesti</div>
        <ul>
          <li><strong>Vuosi:</strong> {selectedYear}</li>
          <li><strong>Viikkoja:</strong> {total}</li>
          <li><strong>Viikon alku:</strong> maanantai</li>
          <li><strong>Muodot:</strong> tuloste, PDF ja Excel-yhteensopiva CSV</li>
        </ul>
      </div>
      <div className="noprint">
        <div className="pills">
          {years.map((y) => (
            <Link
              key={y}
              to={`/tulosta-${y}`}
              className={`pill ${y === selectedYear ? "active" : ""}`}
            >
              {y}
            </Link>
          ))}
        </div>
        <p className="print-actions">
          <button className="btn" onClick={() => window.print()}>
            Tulosta / tallenna PDF
          </button>
          {" "}
          <button
            className="btn"
            onClick={() => downloadCalendarCsv(selectedYear)}
          >
            Lataa Excel-CSV
          </button>
        </p>
      </div>
      <AdSlot placement="print-list-before-preview" />
      <table className="ptable">
        <thead>
          <tr>
            <th>Viikko</th>
            <th>Alkaa (ma)</th>
            <th>Päättyy (su)</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => {
            const mo = mondayOf(w, selectedYear);
            const su = new Date(mo);
            su.setDate(mo.getDate() + 6);

            const isCurrent = w === W_NOW && selectedYear === Y_NOW;

            return (
              <tr key={w} className={isCurrent ? "now" : ""}>
                <td>
                  <b>Viikko {w}</b>
                </td>

                <td>{dFull(mo)}</td>

                <td>{dFull(su)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="prose noprint">
        <h2>Viikkolista PDF- tai Excel-muodossa</h2>
        <p>
          PDF sopii tulostamiseen ja jakamiseen. CSV sisältää vuoden jokaisen
          päivämäärän, viikonpäivän, ISO-viikon, viikkovuoden sekä juhla- ja
          liputuspäivät, ja sen voi avata Excelissä.
        </p>
        <p>
          Jos tarvitset kuukausinäkymän, avaa{" "}
          <Link to={"/tulostettava-kalenteri-" + selectedYear}>
            tulostettava viikkokalenteri {selectedYear}
          </Link>
          . Tavallinen selattava näkymä löytyy sivulta{" "}
          <Link to={"/kalenteri-" + selectedYear}>
            viikkokalenteri {selectedYear}
          </Link>
          .
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default PrintCalendar;
