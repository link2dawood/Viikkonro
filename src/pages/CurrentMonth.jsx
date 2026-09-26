import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { M_FULL } from "../components/dateUtils";
import { useToday } from "../components/useToday";
import { currentMonthFacts, currentMonthFaqs, currentMonthMeta } from "../data/currentDateContent";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";

const CurrentMonth = () => {
  const today = useToday();
  const fact = currentMonthFacts(today);
  const faqs = currentMonthFaqs(today);
  const previousName = M_FULL[fact.previous.month - 1].toLowerCase();
  const nextName = M_FULL[fact.next.month - 1].toLowerCase();
  return (
    <section className="app">
      <SEO {...currentMonthMeta(today)} canonical={canonicalFor("/mika-kuukausi-nyt")} />
      <div className="breadcrumb"><Link to="/">Etusivu</Link> / Mikä kuukausi nyt on?</div>
      <h1>Mikä kuukausi nyt on?</h1>
      <p className="lead"><strong>Nyt on {fact.nameLower} {fact.year}, vuoden {fact.month}. kuukausi.</strong></p>
      <div className="result">
        <div className="main-text">{fact.name} {fact.year}</div>
        <div className="sub">
          Kuukausi {fact.month}/12 · {fact.days} päivää · nyt viikko{" "}
          <Link to={"/viikko-" + fact.currentWeek + "-" + fact.currentWeekYear}>{fact.currentWeek}</Link>
        </div>
      </div>
      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>
        <h2>Monesko kuukausi nyt on?</h2>
        <p>{fact.name} on vuoden <strong>{fact.month}. kuukausi</strong>. Vuodessa on 12 kuukautta, joten tämän jälkeen jäljellä on {12 - fact.month} kuukautta.</p>
        <h2>Kuinka monta päivää nykyisessä kuukaudessa on?</h2>
        <p>{fact.nameLower}ssa {fact.year} on <strong>{fact.days} päivää</strong>. Kuukauden kalenterista näet jokaisen päivän viikonpäivän, viikkonumeron, pyhäpäivät ja saatavilla olevat varmennetut nimipäivät.</p>
        <h2>Mitkä viikot kuuluvat tähän kuukauteen?</h2>
        <p>
          Nyt on viikko {fact.currentWeek}. Katso{" "}
          <Link to={"/kuukausi-" + fact.month + "-" + fact.year}>{fact.nameLower}n {fact.year} kaikki viikot</Link>.
          Kuukauden ensimmäinen ja viimeinen kalenteriviikko voivat sisältää päiviä viereisestä kuukaudesta.
        </p>
        <h2>Edellinen ja seuraava kuukausi</h2>
        <p>
          Siirry <Link to={"/kuukausi-" + fact.previous.month + "-" + fact.previous.year}>{previousName}n {fact.previous.year} kalenteriin</Link>
          {" "}tai <Link to={"/kuukausi-" + fact.next.month + "-" + fact.next.year}>{nextName}n {fact.next.year} kalenteriin</Link>.
        </p>
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}><summary>{item.q}</summary><p>{item.a}</p></details>
        ))}
      </div>
      <p>
        Katso myös <Link to="/">mikä viikko nyt on</Link>,{" "}
        <Link to={"/kalenteri-" + fact.year}>vuoden {fact.year} kalenteri</Link> ja{" "}
        <Link to="/mika-vuosi-nyt">mikä vuosi nyt on</Link>.
      </p>
    </section>
  );
};

export default CurrentMonth;
