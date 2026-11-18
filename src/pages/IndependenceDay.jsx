import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { fmtFullFi, validateYear } from "../components/dateUtils";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
import {
  itsenaisyyspaivaData,
  itsenaisyyspaivaFaqs,
  itsenaisyyspaivaMeta,
} from "../data/seasonalPages";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";
import NotFound from "./NotFound";

const IndependenceDay = ({ year: pYear } = {}) => {
  const params = useParams();
  const rawYear = pYear ?? params.year ?? params.slug?.match(/^itsenaisyyspaiva-(\d{4})$/)?.[1];
  const year = Number(rawYear);

  if (!validateYear(year)) return <NotFound />;

  const data = itsenaisyyspaivaData(year);
  const meta = itsenaisyyspaivaMeta(year);
  const faqs = itsenaisyyspaivaFaqs(year);
  const path = `/itsenaisyyspaiva-${year}`;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(path)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> ›{" "}
        <Link to={`/vuosi-${year}`}>{year}</Link> › Itsenäisyyspäivä {year}
      </div>

      <h1>Itsenäisyyspäivä {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          <strong>{data.answerLead}</strong>
        </span>{" "}
        Itsenäisyyspäivä kuuluu ISO-viikkoon {data.week} ja on Suomen virallinen liputuspäivä.
      </p>

      <QuickFacts
        title={`Itsenäisyyspäivä ${year} lyhyesti`}
        facts={[
          { label: "Päivämäärä", value: fmtFullFi(data.date) },
          { label: "Viikonpäivä", value: data.weekday },
          {
            label: "Viikkonumero",
            value: <Link to={`/viikko-${data.week}-${data.weekYear}`}>viikko {data.week}</Link>,
          },
          {
            label: "Vapaapäivä",
            value: data.isWeekend ? "Ei ylimääräistä vapaata (viikonloppu)" : "Kyllä (arkipyhä)",
          },
          {
            label: "Liputus",
            value: `Virallinen liputuspäivä (klo ${data.flagTime})`,
          },
          {
            label: "Itsenäisyydestä",
            value: `${data.yearsSinceIndependence} vuotta`,
          },
        ]}
      />

      <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

      <section className="prose">
        <h2>Vaikutus vapaapäiviin ja työaikaan</h2>
        {data.isWeekend ? (
          <p>
            Koska itsenäisyyspäivä {year} osuu {data.weekday.toLowerCase()}lle ({data.date.getDate()}.{data.date.getMonth() + 1}.), se ei tuo
            maanantaista perjantaihin työskenteleville ylimääräistä arkivapaata. Suomen lainsäädäntö ja työehtosopimukset
            eivät tunne viikonloppupyhien siirtämistä seuraavalle arkipäivälle (kuten esimerkiksi Isossa-Britanniassa tai Yhdysvalloissa).
            Työntekijöille, jotka työskentelevät sunnuntaisin, itsenäisyyspäivältä maksetaan työehtosopimuksen mukainen pyhätyökorvaus.
          </p>
        ) : (
          <p>
            Itsenäisyyspäivä {year} osuu {data.weekday.toLowerCase()}lle ({data.date.getDate()}.{data.date.getMonth() + 1}.), joten se on
            palkallinen arkivapaa päivätyötä tekeville. Itsenäisyyspäivän palkallisuus perustuu lakiin itsenäisyyspäivän
            viettämisestä yleisenä juhla- ja vapaapäivänä (388/1937).
          </p>
        )}

        <h2>Itsenäisyyspäivän liputus</h2>
        <p>
          Itsenäisyyspäivä on Suomen virallinen liputuspäivä. Liputus alkaa aamulla klo 8.00 ja päättyy poikkeuksellisesti
          vasta kello 20.00. Poiketen useimmista muista liputuspäivistä, lippu pidetään salossa klo 20.00 saakka myös silloin,
          kun aurinko on jo laskenut eikä lippusalkoa ole erikseen valaistu.
        </p>

        <h2>Perinteet ja juhlistaminen</h2>
        <p>
          Itsenäisyyspäivän perinteet ovat Suomessa vahvat:
        </p>
        <ul>
          <li><strong>Sinivalkoiset kynttilät:</strong> Ikkunalle sytytetään perinteisesti kaksi kynttilää klo 18.00-20.00 väliseksi ajaksi.</li>
          <li><strong>Linnan juhlat:</strong> Tasavallan presidentin itsenäisyyspäivän juhlavastaanotto kerää vuosittain miljoonayleisön television ääreen.</li>
          <li><strong>Tuntematon sotilas:</strong> Yle esittää Edvin Laineen ohjaaman klassikkoelokuvan perinteisesti itsenäisyyspäivänä.</li>
          <li><strong>Kunnianosoitukset:</strong> Ylioppilaiden soihtukulkueet ja seppeleenlaskut sankarihaudoille järjestetään useissa kaupungeissa.</li>
        </ul>

        {year === 2026 && (
          <>
            <h2>Itsenäisyyspäivä ja 2. adventti samana päivänä</h2>
            <p>
              Vuonna 2026 itsenäisyyspäivä (sunnuntai 6.12.2026) osuu samalle päivälle kirkkovuoden toisen adventtisunnuntain kanssa.
              Katso myös kaikki <Link to="/adventti-2026">adventtisunnuntait 2026</Link>.
            </p>
          </>
        )}

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((faq) => (
          <details key={faq.q} className="faq-item">
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to={`/vuosi-${year}`}>viikkokalenteri {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/liputuspaivat-${year}`}>liputuspäivät {year}</Link>,{" "}
        {pageConfidenceTier(year) === CONFIDENCE.CONFIRMED && (
          <>
            <Link to={`/koululomat-${year}`}>
              {year === 2027 ? "talviloma ja koululomat 2027" : `koululomat ${year}`}
            </Link>,{" "}
          </>
        )}
        <Link to={`/adventti-${year}`}>adventti {year}</Link> ja{" "}
        <Link to={`/joulu-${year}`}>joulu {year}</Link>.
      </p>
    </section>
  );
};

export default IndependenceDay;
