import { useToday } from "../components/useToday";
import { Link } from "react-router-dom";
import { isoYear } from "../components/dateUtils";
import SEO from "../components/SEO";
import { weekStartsMondayFaqs } from "../data/isoWeekContent";
import {
  canonicalFor,
  CONTENT_UPDATED_FI,
  routeMeta,
} from "../data/seo";

const PATH = "/viikko-alkaa-maanantaista";

const WeekStartsMonday = () => {
  const meta = routeMeta[PATH];
  const currentYear = isoYear(useToday());

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikko alkaa maanantaista
      </div>

      <h1>Miksi viikko alkaa maanantaista?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Viikko alkaa maanantaista Suomessa, koska käytämme kansainvälistä
            ISO 8601 -standardia.
          </strong>{" "}
          Standardissa maanantai on viikon ensimmäinen päivä ja sunnuntai
          seitsemäs päivä.
        </p>

        <div className="panel">
          <div className="now-label">Viikon alku lyhyesti</div>
          <ul>
            <li><strong>Viikon ensimmäinen päivä:</strong> maanantai.</li>
            <li><strong>Viikon viimeinen päivä:</strong> sunnuntai.</li>
            <li><strong>Suomen käytäntö:</strong> ISO 8601.</li>
            <li><strong>Viikko 1:</strong> sisältää vuoden ensimmäisen torstain.</li>
            <li><strong>Muistisääntö:</strong> 4. tammikuuta kuuluu aina viikkoon 1.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Alkaako viikko Suomessa aina maanantaista?</h2>
        <p>
          Suomalaisissa viikkonumeroissa kyllä. ISO-viikko kestää maanantaista
          sunnuntaihin, joten työviikon ja viikkonumeron vaihto tapahtuu
          maanantaina. Kalenterisovellus voi silti näyttää sunnuntain
          ensimmäisessä sarakkeessa, jos sen alueasetuksena on esimerkiksi
          Yhdysvallat.
        </p>

        <h2>Mitä ISO 8601 määrää viikon alusta?</h2>
        <p>
          ISO 8601 numeroi viikonpäivät maanantaista sunnuntaihin: maanantai on
          päivä 1 ja sunnuntai päivä 7. Tästä seuraa, että jokainen numeroitu
          viikko on yksi yhtenäinen seitsemän päivän jakso. Lue myös laajempi
          selitys siitä, <Link to="/mika-on-viikkonumero">mikä viikkonumero on</Link>.
        </p>

        <h2>Miksi ensimmäinen viikko määräytyy torstain mukaan?</h2>
        <p>
          ISO-viikko kuuluu sille viikkovuodelle, jonka puolella viikon torstai
          on. Vuoden viikko 1 on siis viikko, johon vuoden ensimmäinen torstai
          osuu. Sama sääntö voidaan ilmaista näin: viikko 1 sisältää aina 4.
          tammikuuta.
        </p>
        <p>
          Esimerkiksi <strong>viikko 1 vuonna 2026</strong> alkaa maanantaina
          29.12.2025 ja päättyy sunnuntaina 4.1.2026, koska viikon torstai on
          1.1.2026. <Link to="/viikko-1-2026">Katso viikon 1/2026 päivämäärät</Link>.
        </p>

        <h2>Mitä vuodenvaihteessa tapahtuu viikkonumerolle?</h2>
        <p>
          Kalenterivuosi ja viikkovuosi eivät aina vaihdu samana päivänä.
          Joulukuun viimeiset päivät voivat kuulua seuraavan vuoden viikkoon 1,
          ja tammikuun ensimmäiset päivät voivat kuulua edellisen vuoden
          viikkoon 52 tai 53. Esimerkiksi 1.1.2027 kuuluu vuoden 2026 viikkoon
          53. Voit tarkistaa minkä tahansa päivän{" "}
          <Link to="/paivamaara-viikoksi">päivämäärästä viikkonumeroon -laskurilla</Link>.
        </p>

        <h2>Missä viikko alkaa sunnuntaista?</h2>
        <p>
          Viikon esitystapa vaihtelee maittain ja kalenterisovelluksittain.
          Esimerkiksi yhdysvaltalaisissa kalentereissa sunnuntai on usein
          ensimmäinen sarake. Se ei ole sama laskentatapa kuin Suomessa käytetty
          ISO 8601 -viikkonumerointi, joten eri asetuksilla varustetut kalenterit
          voivat näyttää vuodenvaihteessa eri viikkonumeron. Katso oikeilla
          päivämäärillä laskettu{" "}
          <Link to="/suomi-vs-usa-viikkonumerot">
            vertailu Suomen ja Yhdysvaltain viikkonumeroista
          </Link>
          .
        </p>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to="/mika-on-viikkonumero">
            <b>Mikä on viikkonumero?</b>
            <span>ISO 8601 -viikkolaskenta kokonaisuudessaan</span>
          </Link>
          <Link className="ql" to="/suomi-vs-usa-viikkonumerot">
            <b>Suomi vs. USA</b>
            <span>Miksi viikkonumero eroaa — oikeat esimerkit</span>
          </Link>
          <Link className="ql" to="/paivamaara-viikoksi">
            <b>Päivämäärästä viikkonumeroon</b>
            <span>Tarkista minkä tahansa päivän ISO-viikko</span>
          </Link>
          <Link className="ql" to="/kuinka-monta-viikkoa-vuodessa">
            <b>Kuinka monta viikkoa vuodessa?</b>
            <span>Milloin vuodessa on viikko 53</span>
          </Link>
          <Link className="ql" to={"/kalenteri-" + currentYear}>
            <b>Viikkokalenteri {currentYear}</b>
            <span>Viikkonumerot ja päivämäärät yhdellä sivulla</span>
          </Link>
        </div>

        <h2>Usein kysytyt kysymykset</h2>
        {weekStartsMondayFaqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default WeekStartsMonday;
