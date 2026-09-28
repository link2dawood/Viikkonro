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
  KELA_BENEFITS,
  KELA_SOURCE_URL,
  RULES_CHECKED,
  kelaPath,
  kelaPaymentFaqs,
  kelaPaymentMeta,
  kelaStats,
  movedSummary,
  pensionPath,
  weekdayBankHolidays,
} from "../data/benefitPaymentPages";

const kerta = (n) => (n === 0 ? "ei kertaakaan" : n === 1 ? "kerran" : `${n} kertaa`);

// Kela payment calendar for a year (/kelan-maksupaivat-2026): every Kela
// benefit's real payment day per month, the rule behind it, and how often the
// day moves because of a weekend or bank holiday.
const KelaPayments = ({ year }) => {
  const y = Number(year);
  const stats = kelaStats(y);
  const faqs = kelaPaymentFaqs(y);
  const bankHolidays = weekdayBankHolidays(y);

  return (
    <section className="app">
      <SEO {...kelaPaymentMeta(y)} canonical={canonicalFor(kelaPath(y))} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${y}`}>Viikot {y}</Link> / Kelan maksupäivät {y}
      </div>

      <h1>Kelan maksupäivät {y}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Kela maksaa lapsilisän kuun 26. päivänä, kansaneläkkeen 7. päivänä ja
          yleisen asumistuen sekä opintorahan kuun{" "}
          <strong>ensimmäisenä pankkipäivänä</strong>.
        </span>{" "}
        Alla näet jokaisen Kelan etuuden todellisen maksupäivän kuukausittain
        vuonna {y}, kun viikonloput ja arkipyhät on otettu huomioon.
      </p>

      <QuickFacts
        facts={[
          { label: "Vuosi", value: y },
          { label: "Lapsilisä tulee etuajassa", value: kerta(stats.lapsilisaEarly) },
          { label: "Asumistuki ja opintoraha siirtyvät myöhemmäksi", value: kerta(stats.asumistukiLate) },
        ]}
      />

      <h2>Kelan maksupäivät {y} kuukausittain</h2>
      <PaymentScheduleTable
        year={y}
        benefits={KELA_BENEFITS}
        caption={`Kelan etuuksien maksupäivät kuukausittain vuonna ${y}`}
      />
      <p className="note-soft">
        Merkintä <em>etuajassa</em> tarkoittaa, että varsinainen maksupäivä on
        viikonloppu tai arkipyhä (lapsilisän kohdalla myös niiden jälkeinen
        päivä, yleensä maanantai), joten raha tulee
        tilille jo edellisenä pankkipäivänä. <em>Siirtyy</em> tarkoittaa, että
        kuun alun maksu tulee vasta seuraavana pankkipäivänä. Päivämäärää
        napsauttamalla näet koko viikon.
      </p>

      <section className="prose">
        <h2>Maksusäännöt etuuksittain</h2>
        <ul>
          {KELA_BENEFITS.map((b) => (
            <li key={b.id}>
              <strong>{b.name}:</strong> {b.rule}. {movedSummary(y, b)}
            </li>
          ))}
        </ul>

        <h2>Miksi Kelan maksupäivä siirtyy?</h2>
        <p>
          Kela maksaa etuudet vain pankkipäivinä. Pankkipäiviä ovat arkipäivät
          maanantaista perjantaihin, paitsi Suomen Pankin pankkivapaapäivät.
          Suurin osa etuuksista maksetaan silloin <strong>edeltävänä</strong>{" "}
          pankkipäivänä, jolloin raha tulee tilille etuajassa. Kuun alussa
          maksettavat asumistuki, opintoraha ja toimeentulotuki sen sijaan
          siirtyvät <strong>seuraavaan</strong> pankkipäivään.
        </p>
        <p>
          Vuonna {y} arkipäivälle osuvia pankkivapaapäiviä ovat{" "}
          {bankHolidays.join(", ")}. Kaikki vuoden pyhät löydät sivulta{" "}
          <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>.
        </p>
        <p>
          Eläkeläisen kannattaa katsoa myös{" "}
          <Link to={pensionPath(y)}>eläkkeen maksupäivät {y}</Link>, jossa
          työeläkkeen ja Kelan eläkkeiden päivät ovat samassa taulukossa.
        </p>
      </section>

      <p className="note-soft">
        Maksusäännöt:{" "}
        <a href={KELA_SOURCE_URL} target="_blank" rel="noopener noreferrer">
          Kela, maksupäivät
        </a>{" "}
        (tarkistettu {RULES_CHECKED}). Tulevien vuosien päivät on laskettu
        Kelan nykyisillä maksusäännöillä. Oman etuutesi tarkka maksupäivä näkyy
        aina Kelan päätöksessä ja OmaKelassa.
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
        Katso myös <Link to={pensionPath(y)}>eläkkeen maksupäivät {y}</Link>,{" "}
        <Link to={`/palkkapaivat-${y}`}>palkkapäivät {y}</Link>,{" "}
        <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>,{" "}
        <Link to={`/tyopaivat-${y}`}>työpäivät {y}</Link> ja{" "}
        <Link to={`/kalenteri-${y}`}>kalenteri {y}</Link>. Odottaville:{" "}
        <Link to="/raskauslaskuri">raskauslaskuri</Link> näyttää raskausvapaan
        alun ja raskausrahan hakupäivän.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={kelaPath(y - 1)}>
            <span className="lbl">Edellinen</span>Kelan maksupäivät {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={kelaPath(y + 1)}>
            <span className="lbl">Seuraava</span>Kelan maksupäivät {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default KelaPayments;
