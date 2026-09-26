import { useToday } from "../components/useToday";
import { Link } from "react-router-dom";
import { fmtShortFi, isoYear } from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import {
  finlandVsUsaExamples,
  finlandVsUsaFaqs,
} from "../data/finlandVsUsaContent";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo";

const PATH = "/suomi-vs-usa-viikkonumerot";

// Standalone explainer, not a duplicate of /mika-on-viikkonumero (general
// definition) or /viikko-alkaa-maanantaista (why Monday) — both of those only
// mention the US convention in passing. This page is the one dedicated,
// computed side-by-side comparison, which is what the "why does Finland show
// a different week number than the US" search intent actually wants.
const FinlandVsUsa = () => {
  const meta = routeMeta[PATH];
  const currentYear = isoYear(useToday());

  // Shared with prerender.js's FAQPage JSON-LD so the visible FAQ and the
  // schema can't drift — same discipline as every other FAQ set in this
  // codebase.
  const faqs = finlandVsUsaFaqs();
  const examples = finlandVsUsaExamples();

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Suomi vs. USA
      </div>

      <h1>Suomi vs. USA: miksi viikkonumero eroaa?</h1>

      <div className="prose">
        <p className="lead">
          <span className="answer-sentence">
            Suomen ja Yhdysvaltain viikkonumerot voivat erota samalle
            päivälle, koska maat käyttävät eri viikkonumerointijärjestelmää.
          </span>{" "}
          Suomessa käytetään <strong>ISO 8601 -standardia</strong> (viikko
          alkaa maanantaista, viikko 1 sisältää vuoden ensimmäisen torstain),
          kun taas <strong>Yhdysvaltain yleisin käytäntö</strong> aloittaa
          viikon sunnuntaista ja asettaa viikon 1 aina 1. tammikuuta
          sisältäväksi viikoksi. Kumpikaan sääntö ei ole "väärä" — ne vain
          vastaavat eri kysymykseen.
        </p>

        <QuickFacts
          title="Kaksi järjestelmää lyhyesti"
          facts={[
            { label: "Suomi — viikon alku", value: "Maanantai" },
            {
              label: "Suomi — viikko 1 -sääntö",
              value: "Sisältää vuoden ensimmäisen torstain (aina 4.1.)",
            },
            { label: "Suomi — standardi", value: "ISO 8601 (kansainvälinen)" },
            { label: "USA — viikon alku", value: "Sunnuntai" },
            {
              label: "USA — viikko 1 -sääntö",
              value: "Sisältää aina 1. tammikuuta",
            },
            {
              label: "USA — standardi",
              value: "Ei virallista, yleinen käytäntö (esim. Excel)",
            },
          ]}
        />

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Vertailu oikeilla päivämäärillä</h2>
        <p>
          Alla jokainen rivi on todellinen päivämäärä — ei oletettu esimerkki.
          "Eri" tarkoittaa, että Suomen ISO-viikko ja Yhdysvaltain viikko eivät
          ole sama viikko/vuosi-pari samalle päivälle.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Päivämäärä</th>
                <th>Viikonpäivä</th>
                <th>Suomi (ISO 8601)</th>
                <th>USA</th>
                <th>Tulos</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((row) => (
                <tr key={row.date.toISOString()}>
                  <td>{fmtShortFi(row.date)}</td>
                  <td>{row.weekday}</td>
                  <td>
                    <Link to={`/viikko-${row.isoWeek}-${row.isoYear}`}>
                      Viikko {row.isoWeek}/{row.isoYear}
                    </Link>
                  </td>
                  <td>
                    Viikko {row.usWeek}/{row.usYear}
                  </td>
                  <td>{row.differs ? "Eri" : "Sama"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Miksi järjestelmät eroavat toisistaan?</h2>
        <p>
          Ero syntyy kahdesta itsenäisestä säännöstä. Ensinnäkin viikon
          ensimmäinen päivä on eri: ISO 8601:ssä maanantai, yhdysvaltalaisessa
          käytännössä sunnuntai. Toiseksi viikko 1 määräytyy eri perusteella:
          ISO 8601:ssä viikko 1 on se, johon vuoden ensimmäinen torstai osuu
          (käytännössä aina 4. tammikuuta), kun taas yhdysvaltalaisessa
          käytännössä viikko 1 on aina se, joka sisältää 1. tammikuuta —
          riippumatta siitä, mille viikonpäivälle 1. tammikuuta osuu. Lue myös
          laajempi selitys{" "}
          <Link to="/viikko-alkaa-maanantaista">
            miksi viikko alkaa maanantaista
          </Link>
          .
        </p>

        <h2>Milloin numerot eroavat toisistaan?</h2>
        <p>
          Numerot eroavat aina, kun 1. tammikuuta ei ole maanantai. Jos 1.
          tammikuuta on esimerkiksi sunnuntai (kuten vuonna 2023), Yhdysvaltain
          järjestelmä aloittaa heti viikon 1, kun taas ISO 8601:ssä sama päivä
          kuuluu vielä edellisen vuoden viimeiseen viikkoon. Vastaavasti
          joulukuun lopun päivät voivat kuulua ISO 8601:ssä jo seuraavan vuoden
          viikkoon 1, vaikka yhdysvaltalaisittain ne ovat vielä kuluvan vuoden
          viimeistä viikkoa. Katso myös{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">
            miksi vuodessa on välillä 53 viikkoa
          </Link>
          .
        </p>

        <h2>Onko Yhdysvalloissa virallinen viikkonumerostandardi?</h2>
        <p>
          Ei samalla tavalla kuin ISO 8601 Suomessa ja Euroopassa. ISO 8601 on
          Kansainvälisen standardisoimisjärjestön (ISO) julkaisema standardi,
          jota sovelletaan sellaisenaan liike-elämässä, ohjelmistoissa ja
          julkishallinnossa ympäri Eurooppaa. Yhdysvalloissa yleisin
          sunnuntaista alkava viikkonumerointi on ohjelmistojen (esimerkiksi
          Microsoft Excelin oletusarvoinen <code>WEEKNUM</code>-funktio) ja
          kalenterisovellusten käytäntö, ei lakisääteinen standardi.
        </p>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to="/mika-on-viikkonumero">
            <b>Mikä on viikkonumero?</b>
            <span>ISO 8601 -viikkolaskenta kokonaisuudessaan</span>
          </Link>
          <Link className="ql" to="/viikko-alkaa-maanantaista">
            <b>Miksi viikko alkaa maanantaista?</b>
            <span>Viikon alku ja torstaisääntö selitettynä</span>
          </Link>
          <Link className="ql" to="/kuinka-monta-viikkoa-vuodessa">
            <b>Kuinka monta viikkoa vuodessa?</b>
            <span>Milloin vuodessa on viikko 53</span>
          </Link>
          <Link className="ql" to="/paivamaara-viikoksi">
            <b>Päivämäärästä viikkonumeroon</b>
            <span>Tarkista minkä tahansa päivän ISO-viikko</span>
          </Link>
          <Link className="ql" to={`/vuosi-${currentYear}`}>
            <b>Vuoden {currentYear} viikot</b>
            <span>Kaikki viikkonumerot päivämäärineen</span>
          </Link>
        </div>

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

export default FinlandVsUsa;
