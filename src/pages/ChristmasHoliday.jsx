import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import EventTemplate from "../components/EventTemplate";
import {
  PRERENDER_MAX_YEAR as YEAR_MAX,
  WD_ALLATIVE,
  validateYear,
} from "../components/dateUtils";
import { canonicalFor } from "../data/seo";
import {
  christmasData,
  christmasFaqs,
  christmasMeta,
} from "../data/seasonalPages";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";
import NotFound from "./NotFound";

const ChristmasHoliday = ({ year: pYear } = {}) => {
  const params = useParams();
  const rawYear = pYear ?? params.year ?? params.slug?.match(/^joulu-(\d{4})$/)?.[1];
  const year = Number(rawYear);

  if (!validateYear(year)) return <NotFound />;

  const data = christmasData(year);
  const meta = christmasMeta(year);
  const faqs = christmasFaqs(year);
  const path = `/joulu-${year}`;
  const nextYear = year + 1 <= YEAR_MAX ? year + 1 : null;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(path)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Joulu {year}
      </div>

      <h1>Joulu {year}</h1>

      <EventTemplate
        path={path}
        answer={
          <>
            Vuonna {year} jouluaatto on {data.eve.weekday.toLowerCase()}na 24.12., joulupäivä {data.day.weekday.toLowerCase()}na 25.12. ja tapaninpäivä {data.boxing.weekday.toLowerCase()}na 26.12. (viikko {data.week}).
          </>
        }
        answerTail={
          year === 2026
            ? "Päivätyötä tekeville joulusta muodostuu 4 peräkkäistä vapaapäivää ilman vuosiloman käyttöä."
            : null
        }
        target={data.eve.date}
        nameCap="Jouluaatto"
        illative="jouluaattoon"
        dayOff={data.dayOff}
        nextYear={
          nextYear ? { to: `/joulu-${nextYear}`, label: `Joulu ${nextYear}` } : null
        }
        calendar={
          nextYear
            ? { to: `/kalenteri-${nextYear}`, label: `Katso kalenteri ${nextYear}` }
            : { to: `/kalenteri-${year}`, label: `Katso kalenteri ${year}` }
        }
      />

      <QuickFacts
        title={`Joulun päivät ${year}`}
        facts={[
          {
            label: "Jouluaatto (24.12.)",
            value: `${data.eve.weekday} (viikko ${data.week})`,
          },
          {
            label: "Joulupäivä (25.12.)",
            value: `${data.day.weekday} (virallinen pyhäpäivä)`,
          },
          {
            label: "Tapaninpäivä (26.12.)",
            value: `${data.boxing.weekday} (virallinen pyhäpäivä)`,
          },
          {
            label: "Vapaapäivät",
            value: `${data.freeDaysCount} peräkkäistä vapaata (${data.freeDaysRange})`,
          },
          {
            label: "Viikkonumero",
            value: <Link to={`/viikko-${data.week}-${year}`}>viikko {data.week}</Link>,
          },
        ]}
      />

      <section className="prose">
        <h2>Montako vapaapäivää joulusta {year} tulee?</h2>
        <p>
          Vuonna {year} jouluaatto osuu {WD_ALLATIVE[data.eve.date.getDay()]} (24.12.) ja joulupäivä {WD_ALLATIVE[data.day.date.getDay()]} (25.12.).
          Tapaninpäivää vietetään {data.boxing.weekday.toLowerCase()}na (26.12.).
        </p>
        <p>
          Normaalissa maanantaista perjantaihin tehtävässä päivätyössä joulun vapaat jakautuvat seuraavasti:
        </p>
        <ul>
          <li><strong>Torstai 24.12. (jouluaatto):</strong> Useimmissa suomalaisissa työehtosopimuksissa (TES) koko päivän palkallinen vapaapäivä.</li>
          <li><strong>Perjantai 25.12. (joulupäivä):</strong> Lakisääteinen kirkollinen pyhäpäivä ja palkallinen arkivapaa.</li>
          <li><strong>Lauantai 26.12. (tapaninpäivä):</strong> Virallinen pyhäpäivä, joka osuu viikonlopulle.</li>
          <li><strong>Sunnuntai 27.12.:</strong> Normaali viikonloppuvapaa.</li>
        </ul>
        <p>
          Yhteensä saat siis <strong>4 peräkkäistä vapaapäivää</strong> (torstaista sunnuntaihin) kuluttamatta yhtäkään vuosilomapäivää.
        </p>

        <h2>Lomapäivien optimointi jouluna {year}</h2>
        <p>
          Joulun pyhät sijoittuvat loppuviikolle, mikä tarjoaa erinomaisen tilaisuuden pidentää vapaata tehokkaasti:
        </p>
        <ul>
          <li>
            <strong>9 päivän loma 3 lomapäivällä:</strong> Ottamalla lomaa maanantaista keskiviikkoon (21.-23.12.) saat yhtäjaksoisen vapaan lauantaista 19.12. sunnuntaihin 27.12.
          </li>
          <li>
            <strong>Jopa 16 päivän loma 7 lomapäivällä:</strong> Jos otat lisäksi välipäivät vapaaksi (ma 28.12. - to 31.12.), lomasi jatkuu loppiaiseen (ke 6.1.2027) saakka.
          </li>
        </ul>

        <h2>Kauppojen aukioloajat jouluna {year}</h2>
        <p>
          Vaikka kauppojen aukioloajat ovat Suomessa vapautetut lailla, vähittäiskaupat noudattavat joulun aikaan vakiintuneita perinteitä:
        </p>
        <ul>
          <li>
            <strong>Jouluaatto (24.12.):</strong> Useimmat ruokakaupat ja kauppakeskukset palvelevat aamusta puolillepäivin ja sulkevat ovensa klo 12.00-14.00, jotta henkilökunta pääsee joulunviettoon. Pienemmät lähikaupat ja huoltoasemat voivat olla auki pidempään.
          </li>
          <li>
            <strong>Joulupäivä (25.12.):</strong> Suuri osa kaupoista ja tavarataloista on kokonaan kiinni. Vain tietyt pienet lähikaupat (kuten Alepa, K-Market) ja huoltoasemien myymälät palvelevat supistetuin aukioloajoin.
          </li>
          <li>
            <strong>Tapaninpäivä (26.12.):</strong> Kaupat avaavat jälleen ovensa sunnuntaiaukioloaikojen mukaisesti (esimerkiksi klo 10.00-18.00 tai 12.00-21.00), ja perinteiset tapaninpäivän alennusmyynnit alkavat monissa liikkeissä.
          </li>
        </ul>
        <p>
          Tarkat myymäläkohtaiset aukioloajat kannattaa aina tarkistaa kauppaketjujen verkkosivuilta ennen asiointia.
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
        Katso myös{" "}
        {year + 1 <= YEAR_MAX && (
          <>
            <Link to={`/uusi-vuosi-${year + 1}`}>uusi vuosi {year + 1}</Link>,{" "}
            <Link to={`/loppiainen-${year + 1}`}>loppiainen {year + 1}</Link>,{" "}
          </>
        )}
        <Link to={`/vuosi-${year}`}>viikkokalenteri {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/joululoma-${year}`}>koulujen joululoma {year}</Link>,{" "}
        {pageConfidenceTier(year) === CONFIDENCE.CONFIRMED && (
          <>
            <Link to={`/koululomat-${year}`}>
              {year === 2027 ? "talviloma ja koululomat 2027" : `koululomat ${year}`}
            </Link>,{" "}
          </>
        )}
        <Link to={`/itsenaisyyspaiva-${year}`}>itsenäisyyspäivä {year}</Link> ja{" "}
        <Link to={`/adventti-${year}`}>adventti {year}</Link>.
      </p>
    </section>
  );
};

export default ChristmasHoliday;
