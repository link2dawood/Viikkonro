import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import EventTemplate from "../components/EventTemplate";
import {
  PRERENDER_MAX_YEAR as YEAR_MAX,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  validateYear,
} from "../components/dateUtils";
import { canonicalFor } from "../data/seo";
import {
  epiphanyData,
  epiphanyFaqs,
  epiphanyMeta,
} from "../data/seasonalPages";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";
import NotFound from "./NotFound";

const EpiphanyHoliday = ({ year: pYear } = {}) => {
  const params = useParams();
  const rawYear = pYear ?? params.year ?? params.slug?.match(/^loppiainen-(\d{4})$/)?.[1];
  const year = Number(rawYear);

  if (!validateYear(year)) return <NotFound />;

  const data = epiphanyData(year);
  const meta = epiphanyMeta(year);
  const faqs = epiphanyFaqs(year);
  const path = `/loppiainen-${year}`;
  const nextYear = year + 1 <= YEAR_MAX ? year + 1 : null;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(path)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Loppiainen {year}
      </div>

      <h1>Loppiainen {year}</h1>

      <EventTemplate
        path={path}
        answer={
          <>
            Loppiainen {year} on {data.weekday.toLowerCase()}na 6.1.{year} (viikko {data.week}).
          </>
        }
        answerTail={
          data.isWeekend
            ? "Koska loppiainen osuu viikonlopulle, se ei tuo ylimääräistä arkivapaata."
            : "Se on virallinen lakisääteinen kirkollinen juhlapyhä ja palkallinen arkivapaa."
        }
        target={data.date}
        nameCap="Loppiainen"
        illative="loppiaiseen"
        dayOff={data.dayOff}
        nextYear={
          nextYear
            ? { to: `/loppiainen-${nextYear}`, label: `Loppiainen ${nextYear}` }
            : null
        }
        calendar={{ to: `/kalenteri-${year}`, label: `Katso kalenteri ${year}` }}
      />

      <QuickFacts
        title={`Loppiaisen tiedot ${year}`}
        facts={[
          {
            label: "Päivämäärä",
            value: `6. tammikuuta ${year}`,
          },
          {
            label: "Viikonpäivä",
            value: data.weekday,
          },
          {
            label: "Viikkonumero",
            value: (
              <Link to={`/viikko-${data.week}-${data.weekYear}`}>
                viikko {data.week}
              </Link>
            ),
          },
          {
            label: "Pyhäpäivän luonne",
            value: data.isWeekend ? "Kirkollinen pyhä (viikonloppuna)" : "Lakisääteinen palkallinen arkipyhä",
          },
          {
            label: "Edellinen pyhä",
            value: <Link to={`/uusi-vuosi-${year}`}>uusi vuosi {year}</Link>,
          },
        ]}
      />

      <section className="prose">
        <h2>Onko loppiainen {year} vapaapäivä?</h2>
        <p>
          Kyllä, loppiainen on Suomessa virallinen kirkollinen ja lakisääteinen pyhäpäivä. Se on useimmilla aloilla ja virastoissa palkallinen vapaapäivä.
        </p>
        {year === 2027 && (
          <p>
            Vuonna 2027 loppiainen osuu <strong>keskiviikolle 6.1.2027</strong>. Keskelle viikkoa sijoittuva arkipyhä katkaisee työviikon ja antaa erinomaisen mahdollisuuden loman optimointiin.
          </p>
        )}

        <h2>Lomapäivien optimointi ja siltapäivät</h2>
        <p>
          Loppiaisen sijoittuminen viikonpäiville vaikuttaa siihen, miten vuosilomapäiviä kannattaa käyttää:
        </p>
        {year === 2027 ? (
          <ul>
            <li>
              <strong>5 päivän loma 2 lomapäivällä:</strong> Ottamalla lomaa maanantain ja tiistain (4.-5.1.) saat vapaaputken lauantaista 2.1. keskiviikkoon 6.1. asti. Vaihtoehtoisesti ottamalla torstain ja perjantain (7.-8.1.) vapaaksi loma jatkuu keskiviikosta 6.1. sunnuntaihin 10.1.
            </li>
            <li>
              <strong>9 päivän loma 4 lomapäivällä:</strong> Ottamalla lomaa ma-ti (4.-5.1.) ja to-pe (7.-8.1.) saat 9 peräkkäistä vapaapäivää (2.-10.1.2027) käyttämällä vain neljä vuosilomapäivää.
            </li>
          </ul>
        ) : (
          <p>
            Käyttämällä vuosilomalaskuria voit helposti testata, kuinka paljon vapaata saat loppiaisen yhteyteen.
          </p>
        )}
        <p>
          Voit suunnitella lomat ja tarkistaa vapaat <Link to="/vuosilomalaskuri">vuosilomalaskurilla</Link>.
        </p>

        <h2>Kauppojen aukioloajat loppiaisena</h2>
        <p>
          Kauppojen aukioloajat ovat Suomessa vapautetut lailla. Loppiaisena noudatetaan yleensä sunnuntaiaukioloaikoja:
        </p>
        <ul>
          <li>
            <strong>Ruokakaupat ja kauppakeskukset:</strong> Useimmat suuret supermarketit ja kauppakeskukset palvelevat sunnuntain aukioloaikojen mukaan (esimerkiksi klo 10.00-21.00 tai 11.00-18.00). Pienemmät lähikaupat palvelevat normaalisti.
          </li>
          <li>
            <strong>Alko:</strong> Alkon myymälät ovat lakisääteisenä pyhäpäivänä loppiaisena suljettuina.
          </li>
          <li>
            <strong>Julkiset palvelut:</strong> Pankit, postit, virastot ja kirjastot ovat pääsääntöisesti kiinni.
          </li>
          <li>
            <strong>Joukkoliikenne:</strong> Bussi-, juna- ja metroliikenne kulkee yleensä sunnuntaiaikataulujen mukaisesti.
          </li>
        </ul>

        <h2>Miksi loppiaista vietetään?</h2>
        <p>
          Loppiaista (ruots. <em>trettondedag jul</em> eli kolmastoista joulupäivä) vietetään 6. tammikuuta. Se päättää perinteisen 12-päiväisen joulunajan.
        </p>
        <p>
          Kirkollisessa perinteessä loppiaisen aiheena on itämaan tietäjien (kolmen viisaan miehen: Kaspar, Melkior ja Baltasar) saapuminen Betlehemiin kumartamaan vastasyntynyttä Jeesus-lasta ja tuomaan hänelle kultaa, suitsuketta ja mirhaa. Se muistuttaa myös Jeesuksen kasteesta ja siitä, että kristillinen sanoma levisi kaikille kansoille.
        </p>
        <p>
          Suomalaisessa kansanperinteessä loppiainen on ollut merkki joulun päättymisestä ja arkeen palaamisesta. Joulukuusi ja koristeet puretaan usein joko loppiaisena tai viikkoa myöhemmin Nuutin päivänä (13. tammikuuta).
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((faq) => (
          <details key={faq.q} className="faq-item">
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to={`/uusi-vuosi-${year}`}>uusi vuosi {year}</Link>,{" "}
        <Link to={`/joulu-${year - 1 >= YEAR_MIN ? year - 1 : year}`}>
          joulu {year - 1 >= YEAR_MIN ? year - 1 : year}
        </Link>,{" "}
        {pageConfidenceTier(year) === CONFIDENCE.CONFIRMED && (
          <>
            <Link to={`/koululomat-${year}`}>
              {year === 2027 ? "talviloma ja koululomat 2027" : `koululomat ${year}`}
            </Link>,{" "}
          </>
        )}
        <Link to={`/vuosi-${year}`}>viikkokalenteri {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link> ja{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>.
      </p>
    </section>
  );
};

export default EpiphanyHoliday;
