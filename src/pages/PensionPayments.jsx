import pageCss from "./paymentPage.css?raw";
import { Link } from "react-router-dom";
import {
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import PaymentScheduleTable from "../components/PaymentScheduleTable";
import { canonicalFor } from "../data/seo";
import {
  KELA_SOURCE_URL,
  PENSION_BENEFITS,
  PENSION_SOURCE_URL,
  RULES_CHECKED,
  kelaPath,
  movedSummary,
  pensionPath,
  pensionPaymentFaqs,
  pensionPaymentMeta,
  pensionStats,
} from "../data/benefitPaymentPages";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";

const kerta = (n) => (n === 0 ? "ei kertaakaan" : n === 1 ? "kerran" : `${n} kertaa`);

// Pension payment calendar for a year (/elakkeen-maksupaivat-2026): työeläke
// next to Kela's pensions, so a pensioner sees every payment of the month in
// one table.
const PensionPayments = ({ year }) => {
  const y = Number(year);
  const stats = pensionStats(y);
  const faqs = pensionPaymentFaqs(y);

  return (
    <section className="app">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />
      <SEO {...pensionPaymentMeta(y)} canonical={canonicalFor(pensionPath(y))} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${y}`}>Viikot {y}</Link> / Eläkkeen maksupäivät {y}
      </div>

      <h1>Eläkkeen maksupäivät {y}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Työeläke tulee tilille useimmiten kuun{" "}
          <strong>ensimmäisenä pankkipäivänä</strong>, Kelan kansaneläke 7.
          päivänä ja takuueläke 22. päivänä.
        </span>{" "}
        Taulukosta näet jokaisen eläkkeen ja eläkkeensaajan asumistuen
        maksupäivän kuukausittain vuonna {y}.
      </p>

      <QuickFacts
        facts={[
          { label: "Vuosi", value: y },
          { label: "Työeläke siirtyy myöhemmäksi", value: kerta(stats.tyoelakeLate) },
          { label: "Kansaneläke tulee etuajassa", value: kerta(stats.kansanelakeEarly) },
          { label: "Takuueläke tulee etuajassa", value: kerta(stats.takuuelakeEarly) },
        ]}
      />

      <h2>Eläkkeiden maksupäivät {y} kuukausittain</h2>
      <PaymentScheduleTable
        year={y}
        benefits={PENSION_BENEFITS}
        caption={`Työeläkkeen ja Kelan eläkkeiden maksupäivät kuukausittain vuonna ${y}`}
      />
      <p className="note-soft">
        Työeläkkeen sarake näyttää yleisimmän maksupäivän, kuun ensimmäisen
        pankkipäivän. <em>Etuajassa</em> tarkoittaa, että Kelan maksu tulee jo
        edellisenä pankkipäivänä, koska varsinainen päivä on viikonloppu tai
        arkipyhä. Päivämäärää napsauttamalla näet koko viikon.
      </p>

      <section className="prose">
        <h2>Eläkkeen maksupäivä joulukuussa {y}</h2>
        <p>
          Joulukuussa eläkkeet maksetaan hyvissä ajoin ennen joulupyhiä, koska jouluaatto (24.12.), joulupäivä (25.12.) ja tapaninpäivä (26.12.) eivät ole pankkipäiviä. Jos eläkkeen säännöllinen maksupäivä osuu viikonlopulle tai arkipyhälle, raha maksetaan tilille sitä edeltävänä pankkipäivänä.
        </p>
        {y === 2026 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Eläke / maksaja</th>
                  <th>Maksupäivä joulukuussa 2026</th>
                  <th>Huomio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Työeläke</strong> (Varma, Ilmarinen, Elo, Veritas)</td>
                  <td>Tiistai 1.12.2026</td>
                  <td>Kuukauden 1. pankkipäivä</td>
                </tr>
                <tr>
                  <td><strong>Keva</strong> (kunta, valtio, kirkko, hyvinvointialueet)</td>
                  <td>Torstai 3.12.2026</td>
                  <td>Kuukauden 3. päivä</td>
                </tr>
                <tr>
                  <td><strong>Kelan eläkkeet</strong> (1. ryhmä, sukunimet A-K)</td>
                  <td>Perjantai 4.12.2026</td>
                  <td>Eläkkeensaajan asumistuki ja kansaneläke</td>
                </tr>
                <tr>
                  <td><strong>Kelan perhe-eläke</strong> (2. ryhmä, sukunimet L-R)</td>
                  <td>Maanantai 14.12.2026</td>
                  <td>Kuukauden 14. päivä</td>
                </tr>
                <tr>
                  <td><strong>Kelan takuueläke</strong> ja 3. ryhmä (sukunimet S-Ö)</td>
                  <td>Tiistai 22.12.2026</td>
                  <td>Maksetaan etukäteen ennen jouluaattoa</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p>
          Katso myös joulun vapaapäivät ja kauppojen aukioloajat sivulta <Link to={`/joulu-${y}`}>joulu {y}</Link>.
        </p>

        <h2>Kuka maksaa minkäkin eläkkeen?</h2>
        <p>
          <strong>Työeläkkeen</strong> maksaa se työeläkelaitos, jossa eläkkeesi
          on vakuutettu. Useimmilla yksityisen sektorin eläkelaitoksilla (kuten
          Varma, Ilmarinen ja Elo) maksupäivä on kuun ensimmäinen pankkipäivä.
          <strong>Keva</strong> maksaa kunta-alan, valtion, kirkon ja
          hyvinvointialueiden työeläkkeet kuukauden 3. päivänä (tai sitä edeltävänä
          pankkipäivänä, jos 3. päivä on viikonloppu tai pyhä).
        </p>
        <p>
          <strong>Kela</strong> maksaa kansaneläkkeen, takuueläkkeen,
          eläkkeensaajan asumistuen ja eläkettä saavan hoitotuen. Kelan eläkkeet
          maksetaan kiinteinä päivinä, ja jos päivä ei ole pankkipäivä, raha tulee
          tilille edeltävänä pankkipäivänä. Jos saat sekä työeläkettä että Kelan
          eläkettä, saat siis rahaa kuukaudessa useampana päivänä.
        </p>

        <h2>Maksusäännöt ja siirtymät {y}</h2>
        <ul>
          {PENSION_BENEFITS.map((b) => (
            <li key={b.id}>
              <strong>{b.name}:</strong> {b.rule}. {movedSummary(y, b)}
            </li>
          ))}
        </ul>
        <p>
          Muut Kelan etuudet, kuten lapsilisän, asumistuen ja opintorahan, löydät
          sivulta <Link to={kelaPath(y)}>Kelan maksupäivät {y}</Link>.
        </p>
      </section>

      <p className="note-soft">
        Maksusäännöt:{" "}
        <a href={PENSION_SOURCE_URL} target="_blank" rel="noopener noreferrer">
          Työeläke.fi, eläkkeen maksaminen
        </a>{" "}
        ja{" "}
        <a href={KELA_SOURCE_URL} target="_blank" rel="noopener noreferrer">
          Kela, maksupäivät
        </a>{" "}
        (tarkistettu {RULES_CHECKED}). Tulevien vuosien päivät on laskettu
        nykyisillä maksusäännöillä. Oman eläkkeesi tarkka maksupäivä näkyy
        eläkepäätöksessä.
      </p>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to={kelaPath(y)}>Kelan maksupäivät {y}</Link>,{" "}
        <Link to={`/palkkapaivat-${y}`}>palkkapäivät {y}</Link>,{" "}
        <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>,{" "}
        {pageConfidenceTier(y) === CONFIDENCE.CONFIRMED && (
          <>
            <Link to={`/koululomat-${y}`}>koululomat {y}</Link>,{" "}
          </>
        )}
        ja <Link to={`/kalenteri-${y}`}>kalenteri {y}</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={pensionPath(y - 1)}>
            <span className="lbl">Edellinen</span>Eläkkeen maksupäivät {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={pensionPath(y + 1)}>
            <span className="lbl">Seuraava</span>Eläkkeen maksupäivät {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default PensionPayments;
