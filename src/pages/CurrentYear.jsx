import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { currentYearFacts, currentYearFaqs, currentYearMeta } from "../data/currentDateContent";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";

const CurrentYear = () => {
  const today = useToday();
  const fact = currentYearFacts(today);
  const faqs = currentYearFaqs(today);
  return (
    <section className="app">
      <SEO {...currentYearMeta(today)} canonical={canonicalFor("/mika-vuosi-nyt")} />
      <div className="breadcrumb"><Link to="/">Etusivu</Link> / Mikä vuosi nyt on?</div>
      <h1>Mikä vuosi nyt on?</h1>
      <p className="lead"><strong>Nyt on vuosi {fact.year}.</strong></p>
      <div className="result">
        <div className="main-text">{fact.year}</div>
        <div className="sub">{fact.days} päivää · {fact.weeks} ISO-viikkoa · {fact.quarter}. vuosineljännes</div>
      </div>
      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>
        <h2>Vuoden {fact.year} tiedot lyhyesti</h2>
        <ul>
          <li>Vuodessa on {fact.days} päivää.</li>
          <li>Vuodessa on {fact.weeks} ISO-viikkoa.</li>
          <li>Vuosi {fact.year} {fact.leap ? "on" : "ei ole"} karkausvuosi.</li>
          <li>Nyt on vuoden {fact.dayOfYear}. päivä ja viikko {fact.currentWeek}.</li>
          <li>Vuotta on kulunut noin {fact.progress} %.</li>
        </ul>
        <h2>Onko {fact.year} karkausvuosi?</h2>
        <p>
          {fact.leap
            ? <>Kyllä. {fact.year} on karkausvuosi, joten helmikuussa on 29 päivää ja vuodessa yhteensä 366 päivää.</>
            : <>Ei. {fact.year} on tavallinen vuosi, joten helmikuussa on 28 päivää ja vuodessa yhteensä 365 päivää.</>}
        </p>
        <h2>Kuinka monta viikkoa vuodessa {fact.year} on?</h2>
        <p>
          Vuodessa {fact.year} on <strong>{fact.weeks} ISO-viikkoa</strong>. Tarkista{" "}
          <Link to={"/vuosi-" + fact.year}>kaikki vuoden {fact.year} viikkonumerot päivämäärineen</Link> tai lue,{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">miksi vuodessa on 52 tai 53 viikkoa</Link>.
        </p>
        <h2>Kuinka paljon vuotta on jäljellä?</h2>
        <p>Tänään on vuoden {fact.dayOfYear}. päivä. Vuoden jälkeen on jäljellä <strong>{fact.daysRemaining} kokonaista päivää</strong>, ja nyt on {fact.quarter}. vuosineljännes.</p>
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}><summary>{item.q}</summary><p>{item.a}</p></details>
        ))}
      </div>
      <p>
        Avaa <Link to={"/kalenteri-" + fact.year}>kalenteri {fact.year}</Link>,{" "}
        <Link to={"/viikko-" + fact.currentWeek + "-" + fact.currentWeekYear}>kuluva viikko</Link> tai katso{" "}
        <Link to="/mika-kuukausi-nyt">mikä kuukausi nyt on</Link>.
      </p>
    </section>
  );
};

export default CurrentYear;
