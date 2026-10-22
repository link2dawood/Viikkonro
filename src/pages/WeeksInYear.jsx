import { useToday } from "../components/useToday";
import { Link } from "react-router-dom";
import {
  fmtFullFi,
  isoYear,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
  weeksInIsoYear,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import {
  canonicalFor,
  CONTENT_UPDATED_FI,
  routeMeta,
} from "../data/seo";
import {
  currentYearWeekSummary,
  weeksInYearFaqs,
  yearWeekRows,
} from "../data/weeksInYearContent";

const PATH = "/kuinka-monta-viikkoa-vuodessa";

const WeeksInYear = () => {
  const meta = routeMeta[PATH];
  const currentYear = isoYear(useToday());
  const currentWeeks = weeksInIsoYear(currentYear);
  const rows = yearWeekRows(YEAR_MIN, YEAR_MAX);
  const longYears = rows.filter((row) => row.weeks === 53);
  const faqs = weeksInYearFaqs(currentYear);
  // The current year's answer is computed, not written: this page's headline
  // query ("kuinka monta viikkoa on vuodessa") needs a live answer, and 2026
  // has 53 weeks while 2027 has 52.
  const summary = currentYearWeekSummary(currentYear);
  const nextLongYear = longYears.find((row) => row.year > currentYear)?.year;
  const exampleLongYears = longYears.slice(0, 3).map((row) => row.year);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikkoja vuodessa
      </div>

      <h1>Kuinka monta viikkoa vuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Vuodessa on 52 tai 53 ISO-viikkoa. Useimmissa vuosissa on 52
            viikkoa, mutta vuonna {currentYear} on {currentWeeks} viikkoa.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Viikkoja vuodessa lyhyesti</div>
          <ul>
            <li><strong>Tavallinen määrä:</strong> 52 ISO-viikkoa.</li>
            <li><strong>Poikkeus:</strong> joissakin vuosissa on viikko 53.</li>
            <li><strong>Vuosi {currentYear}:</strong> {currentWeeks} viikkoa.</li>
            <li><strong>Tavallinen vuosi:</strong> 365 päivää eli 52 viikkoa ja yksi päivä.</li>
            <li><strong>Karkausvuosi:</strong> 366 päivää eli 52 viikkoa ja kaksi päivää.</li>
            <li><strong>Standardi:</strong> Suomessa käytetään ISO 8601 -viikkonumerointia.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Monta viikkoa on vuodessa?</h2>
        <p>
          Kalenterivuodessa on 365 päivää, tai karkausvuonna 366 päivää.
          Kun 365 jaetaan seitsemällä, tulokseksi saadaan 52 täyttä viikkoa
          ja yksi ylimääräinen päivä. Karkausvuodessa ylimääräisiä päiviä on
          kaksi. Siksi kalenterivuosi ei jakaudu tasan 52 viikkoon.
        </p>
        <p>
          ISO-viikkonumerointi kokoaa päivät kokonaisiksi maanantaista
          sunnuntaihin jatkuviksi viikoiksi. Tämän vuoksi ISO-viikkovuodessa on
          joko 52 tai 53 numeroitua viikkoa.
        </p>

        <h2>Milloin vuodessa on 53 viikkoa?</h2>
        <p>
          <strong>Vuodessa on 53 viikkoa kahdessa tapauksessa:</strong>
        </p>
        <ol>
          <li>Vuosi alkaa torstaina.</li>
          <li>Vuosi on karkausvuosi ja alkaa keskiviikkona.</li>
        </ol>
        <p>
          Näissä tapauksissa vuoden loppuun mahtuu vielä kokonainen viikko 53.
          Esimerkiksi <strong>{exampleLongYears.join(", ")}</strong> ovat 53
          viikon vuosia. Vuoden {currentYear} kaikki päivämäärät näkyvät
          sivulla{" "}
          <Link to={`/vuosi-${currentYear}`}>viikkonumerot {currentYear}</Link>.
        </p>

        <h2>Kuinka monta viikkoa vuonna {currentYear} on?</h2>
        <p>
          <strong>
            Vuonna {currentYear} on {currentWeeks} viikkoa.
          </strong>{" "}
          {summary.cause} Vuoden viimeinen ISO-viikko on{" "}
          <Link to={`/viikko-${currentWeeks}-${currentYear}`}>
            viikko {currentWeeks}
          </Link>, joka alkaa maanantaina {fmtFullFi(summary.lastWeekMonday)} ja
          päättyy sunnuntaina {fmtFullFi(summary.lastWeekSunday)}.
          {currentWeeks !== 53 && nextLongYear
            ? ` Seuraava 53 viikon vuosi on ${nextLongYear}.`
            : ""}
        </p>

        <h2>Miksi ISO-viikkovuosi voi ylittää vuodenvaihteen?</h2>
        <p>
          ISO 8601 -standardissa viikko kuuluu sille vuodelle, jonka puolella
          viikon torstai on. Vuoden ensimmäinen viikko sisältää aina 4.
          tammikuuta. Siksi joulukuun viimeiset päivät voivat kuulua seuraavan
          vuoden viikkoon 1, ja tammikuun ensimmäiset päivät voivat kuulua
          edellisen vuoden viikkoon 52 tai 53.
        </p>
        <p>
          Katso perusteellinen selitys sivulta{" "}
          <Link to="/mika-on-viikkonumero">mikä on viikkonumero</Link> tai
          tarkista yksittäinen päivä{" "}
          <Link to="/paivamaara-viikoksi">päivämäärästä viikkonumeroon</Link>
          -laskurilla.
        </p>

        <h2>Mitkä vuodet sisältävät viikon 53?</h2>
        <p>
          Alla ovat sivustolla selattavat vuodet. Taulukon tiedot lasketaan
          suoraan samalla ISO-viikkolaskennalla kuin vuoden ja viikon omat sivut.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vuosi</th>
                <th>Viikkoja</th>
                <th>Vuosi alkaa</th>
                <th>Selitys</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year}>
                  <td><Link to={`/vuosi-${row.year}`}>{row.year}</Link></td>
                  <td><strong>{row.weeks}</strong></td>
                  <td>{row.startsOn.toLowerCase()}</td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Seuraavat 53 viikon vuodet</h2>
        <div className="pills">
          {longYears.map((row) => (
            <Link
              key={row.year}
              to={`/vuosi-${row.year}`}
              className={`pill ${row.year === currentYear ? "active" : ""}`}
            >
              {row.year}
            </Link>
          ))}
        </div>

        <h2>Usein kysyttyä viikkojen määrästä vuodessa</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p>
          Katso myös <Link to={`/kalenteri-${currentYear}`}>viikkokalenteri {currentYear}</Link>,{" "}
          <Link to="/viikko-paivamaaraksi">viikosta päivämääräksi</Link> ja{" "}
          <a href="https://www.iso.org/iso-8601-date-and-time-format.html" target="_blank" rel="noopener noreferrer">
            ISO 8601 -standardin yleiskuvaus
          </a>.
        </p>
      </div>
    </section>
  );
};

export default WeeksInYear;
