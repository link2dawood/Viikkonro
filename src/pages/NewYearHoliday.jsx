import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import {
  PRERENDER_MIN_YEAR as YEAR_MIN,
  validateYear,
} from "../components/dateUtils";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
import {
  newYearData,
  newYearFaqs,
  newYearMeta,
} from "../data/seasonalPages";
import NotFound from "./NotFound";

const NewYearHoliday = ({ year: pYear } = {}) => {
  const params = useParams();
  const rawYear = pYear ?? params.year ?? params.slug?.match(/^uusi-vuosi-(\d{4})$/)?.[1];
  const year = Number(rawYear);

  if (!validateYear(year)) return <NotFound />;

  const data = newYearData(year);
  const meta = newYearMeta(year);
  const faqs = newYearFaqs(year);
  const path = `/uusi-vuosi-${year}`;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(path)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Uusi vuosi {year}
      </div>

      <h1>Uusi vuosi {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          <strong>
            Vuonna {year} uudenvuodenaatto on {data.eve.weekday.toLowerCase()}na 31.12.{data.previousYear} ja uudenvuodenpäivä {data.day.weekday.toLowerCase()}na 1.1.{year}.
          </strong>
        </span>{" "}
        {year === 2027 && (
          <>Uudenvuodenpäivä 1.1.2027 osuu perjantaille, mikä tuo kolmen päivän yhtenäisen viikonloppuvapaan (1.–3.1.2027).</>
        )}
      </p>

      <QuickFacts
        title={`Uuden vuoden ajankohdat ja tiedot ${year}`}
        facts={[
          {
            label: `Uudenvuodenaatto (31.12.${data.previousYear})`,
            value: (
              <>
                {data.eve.weekday} (
                <Link to={`/viikko-${data.eve.week}-${data.eve.weekYear}`}>
                  viikko {data.eve.week}
                </Link>
                )
              </>
            ),
          },
          {
            label: `Uudenvuodenpäivä (1.1.${year})`,
            value: (
              <>
                {data.day.weekday} (
                <Link to={`/viikko-${data.day.week}-${data.day.weekYear}`}>
                  viikko {data.day.week}
                </Link>
                )
              </>
            ),
          },
          {
            label: "Virallinen pyhäpäivä",
            value: `Uudenvuodenpäivä 1.1.${year} (palkallinen vapaa)`,
          },
          {
            label: "Ilotulitteiden sallittu aika",
            value: `${data.fireworksTime} (31.12.-1.1.)`,
          },
          {
            label: "Seuraava pyhä",
            value: <Link to={`/loppiainen-${year}`}>loppiainen 6.1.{year}</Link>,
          },
        ]}
      />

      <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

      <section className="prose">
        <h2>Uudenvuoden vapaapäivät {year}</h2>
        <p>
          Uudenvuodenpäivä (1. tammikuuta) on virallinen lakisääteinen kirkollinen juhlapyhä ja useimmilla työpaikoilla palkallinen vapaapäivä.
        </p>
        {year === 2027 ? (
          <>
            <p>
              Vuonna 2027 uudenvuodenpäivä osuu <strong>perjantaille 1.1.2027</strong>. Tämä muodostaa arkityötä tekeville luontevan 3 päivän viikonloppuvapaan (pe 1.1. – su 3.1.2027).
            </p>
            <p>
              Torstai 31.12.2026 (uudenvuodenaatto) on useissa työehtosopimuksissa joko lyhennetty työpäivä tai koko päivän palkallinen vapaa. Ottamalla torstain vapaaksi vuosilomalla saat 4 päivän yhtäjaksoisen loman.
            </p>
          </>
        ) : (
          <p>
            Jos uudenvuodenpäivä osuu arkipäivälle, se tuo palkallisen arkivapaan viikon alkuun tai loppuun.
          </p>
        )}

        <h2>Ilotulitteiden ampumisajat ja turvallisuus</h2>
        <p>
          Suomessa kuluttajailotulitteiden käyttö on sallittu ilman pelastusviranomaiselle tehtävää ilmoitusta ainoastaan uutenavuotena:
        </p>
        <ul>
          <li>
            <strong>Sallittu aikaväli:</strong> 31. joulukuuta klo 18.00 alkaen 1. tammikuuta klo 02.00 saakka.
          </li>
          <li>
            <strong>Suojalasit:</strong> Ilotulitteiden ampujan on lain mukaan käytettävä suojalaseja. Myös katsojille suojalasien käyttöä suositellaan voimakkaasti.
          </li>
          <li>
            <strong>Rajoitukset:</strong> Kaupunkien keskustoissa ja tietyillä taajama-alueilla pelastuslaitokset voivat asettaa paikallisia ilotulituskieltoja.
          </li>
        </ul>

        <h2>Kauppojen ja palveluiden aukioloajat uutenavuotena</h2>
        <p>
          Kauppojen aukioloaikoja ei Suomessa enää rajoiteta lailla, mutta vähittäiskaupat noudattavat uutenavuotena vakiintuneita käytäntöjä:
        </p>
        <ul>
          <li>
            <strong>Uudenvuodenaatto (31.12.):</strong> Useimmat ruokakaupat ja kauppakeskukset ovat avoinna aamusta iltaan, mutta sulkevat ovensa usein normaalia aiemmin (klo 18.00–21.00 välillä). Alko sulkee ovensa uudenvuodenaattona klo 18.00.
          </li>
          <li>
            <strong>Uudenvuodenpäivä (1.1.):</strong> Suuret hypermarketit ja tavaratalot ovat usein suljettuina tai auki supistetuin aukioloajoin. Pienemmät lähikaupat (kuten Alepat ja K-Marketit) sekä liikenneasemat ovat laajasti avoinna.
          </li>
          <li>
            <strong>Pankit ja virastot:</strong> Pankit sulkeutuvat uudenvuodenaattona jo klo 13.00, ja uudenvuodenpäivänä pankkipalvelut ja virastot ovat suljettuina.
          </li>
        </ul>

        <h2>Miksi uudenvuodenpäivä voi kuulua edellisen vuoden viikkoon?</h2>
        <p>
          Suomessa ja kansainvälisessä ISO 8601 -standardissa viikkonumerointi perustuu siihen, että vuoden ensimmäinen viikko (viikko 1) on se viikko, jolla on vähintään 4 uuden vuoden päivää eli johon vuoden ensimmäinen torstai osuu.
        </p>
        {year === 2027 && (
          <p>
            Vuonna 2027 tammikuun 1. päivä on perjantai. Koska viikolla on uuden vuoden puolella vain kolme päivää (pe 1.1., la 2.1. ja su 3.1.), se kuuluu vielä <strong>vuoden 2026 viikkoon 53</strong>. Vuoden 2027 ensimmäinen virallinen viikko (viikko 1) alkaa vasta maanantaina 4. tammikuuta 2027.
          </p>
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
        Katso myös <Link to={`/loppiainen-${year}`}>loppiainen {year}</Link>,{" "}
        {data.previousYear >= YEAR_MIN ? (
          <Link to={`/joulu-${data.previousYear}`}>joulu {data.previousYear}</Link>
        ) : (
          <Link to={`/joulu-${year}`}>joulu {year}</Link>
        )},{" "}
        <Link to={`/vuosi-${year}`}>viikkokalenteri {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link> ja{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>.
      </p>
    </section>
  );
};

export default NewYearHoliday;
