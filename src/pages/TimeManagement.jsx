import { useToday } from "../components/useToday";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import { isoWeek, isoYear, weeksInIsoYear } from "../components/dateUtils";

const PATH = "/ajanhallinta";

// A navigational hub, not a bid to rank for generic "time management" —
// see docs/ links from that discussion. Every link below is real and
// live; where a themed subtopic (time blocking, team planning, production
// schedules) doesn't have a matching feature yet, it's named honestly as
// planned rather than pointed at a page that doesn't exist. Week numbers
// used throughout are the real ISO week-year, computed live — never
// hardcoded, so this page doesn't go stale or link to a 404 once the
// year rolls over.
const TimeManagement = () => {
  const meta = routeMeta[PATH];
  const now = useToday();
  const year = isoYear(now);
  const currentWeek = isoWeek(now);
  const totalWeeks = weeksInIsoYear(year);
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Ajanhallinta
      </div>
      <h1>Ajanhallinta viikkonumeroiden avulla</h1>

      <div className="prose">
        <p className="lead">
          <span className="answer-sentence">
            Tämä sivu kokoaa yhteen Viikko Nron viikko-, työpäivä- ja
            aikataulutyökalut <strong>ISO 8601 -viikkonumeroiden
            näkökulmasta</strong> — ei yleisenä ajanhallintaoppaana, vaan
            karttana siihen, mitä sivustolla jo on tarjolla eri
            suunnittelutarpeisiin.
          </span>
        </p>

        <h2>Viikkosuunnittelu</h2>
        <p>
          Katso mikä tahansa viikko vuodesta {year}, sen päivämäärät,
          työpäivät ja pyhäpäivät. Juuri nyt meneillään on{" "}
          <Link to={`/viikko-${currentWeek}-${year}`}>
            viikko {currentWeek}
          </Link>
          . Muunna päivämäärä viikoksi laskurilla{" "}
          <Link to="/paivamaara-viikoksi">Päivämäärästä viikoksi</Link> tai
          viikko päivämääriksi laskurilla{" "}
          <Link to="/viikko-paivamaaraksi">Viikosta päivämääräksi</Link>.
        </p>

        <h2>Työaikataulutus</h2>
        <p>
          Työpäivien määrä vuodelle, kuukaudelle tai kahden päivämäärän
          välille:{" "}
          <Link to={`/tyopaivat-${year}`}>Työpäivät {year}</Link>,{" "}
          <Link to="/tyopaivalaskuri">Työpäivälaskuri</Link>.
        </p>

        <h2>Lukukausisuunnittelu</h2>
        <p>
          Suomalaisten koulujen loma-ajat kaupungeittain:{" "}
          <Link to={`/koululomat-${year}`}>Koululomat {year}</Link>.
          Yliopistojen opetusviikkojen numerointia käsittelevä sisältö on
          suunnitteilla.
        </p>

        <h2>Tiimien ja projektien suunnittelu</h2>
        <p>
          Jaettava, tulostettava vuosikalenteri koko tiimin käyttöön:{" "}
          <Link to={`/kalenteri-${year}`}>Kalenteri {year}</Link>{" "}
          (myös PDF- ja CSV-muodossa). Erillinen tiimiaikataulutyökalu on
          suunnitteilla.
        </p>

        <h2>Sprinttisuunnittelu</h2>
        <p>
          Vuosineljännesten viikkovälit ja työpäivät:{" "}
          <Link to={`/q1-${year}`}>Q1</Link>,{" "}
          <Link to={`/q2-${year}`}>Q2</Link>,{" "}
          <Link to={`/q3-${year}`}>Q3</Link>,{" "}
          <Link to={`/q4-${year}`}>Q4 {year}</Link>. Oma
          sprinttilaskuri (aloituspäivä + kesto viikkoina → ISO-viikot) on
          suunnitteilla.
        </p>

        <h2>Tuotantoaikataulut</h2>
        <p>
          Tulostettava, viikkotasoinen kalenteri aikataulupohjaksi:{" "}
          <Link to={`/tulosta-${year}`}>Tulosta {year}</Link>. Rakennusalan
          viikkoaikataulu-tyyppinen laskuri on suunnitteilla.
        </p>

        <h2>Selaa viikkoa numerolla — {year}</h2>
        <p>
          Kaikki vuoden {year} {totalWeeks} viikkoa suoraan linkkeinä:
        </p>
        <div className="pills">
          {weeks.map((w) => (
            <Link
              key={w}
              to={`/viikko-${w}-${year}`}
              className={`pill ${w === currentWeek ? "active" : ""}`}
            >
              {w}
            </Link>
          ))}
        </div>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to="/mika-on-viikkonumero">
            <b>Mikä on viikkonumero?</b>
            <span>ISO 8601 -viikkolaskenta kokonaisuudessaan</span>
          </Link>
          <Link className="ql" to="/laskurit">
            <b>Laskurit</b>
            <span>Kaikki viikko- ja päivämäärälaskurit</span>
          </Link>
          <Link className="ql" to="/menetelma">
            <b>Menetelmä</b>
            <span>Miten viikkonumerot lasketaan</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TimeManagement;
