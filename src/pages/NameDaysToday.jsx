import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { fmtFullFi } from "../components/dateUtils";
import { useToday } from "../components/useToday";
import { nameDayFaqs, todayNameDayMeta, todayNameDayPage } from "../data/nameDayPages";
import { nameDaySlug } from "../data/nameDays";
import { canonicalFor } from "../data/seo";

const NameDaysToday = () => {
  const today = useToday();
  const page = todayNameDayPage(today);
  const meta = todayNameDayMeta(today);
  const faqs = nameDayFaqs(page, "today");

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(page.path)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Nimipäivä tänään
      </div>
      <h1>Nimipäivä tänään</h1>
      <div className="prose">
        <p className="lead">
          {page.available ? (
            <strong>
              Tänään {fmtFullFi(page.date)} nimipäivää {page.names.length === 1 ? "viettää" : "viettävät"}{" "}
              {page.names.join(", ")}.
            </strong>
         ) : (
           <strong>
              Tänään on {page.weekdayEssive} {fmtFullFi(page.date)} ja päivä
              kuuluu viikkoon {page.week}.
           </strong>
          )}
        </p>

        {page.available ? (
          <>
            <h2>Kuka viettää nimipäivää tänään?</h2>
            <ul>
              {page.names.map((name) => (
                <li key={name}><Link to={`/nimipaiva/${nameDaySlug(name)}`}>{name}</Link></li>
              ))}
            </ul>
            <p>
              Tänään on {page.weekdayEssive} ja päivä kuuluu{" "}
              <Link to={`/viikko-${page.week}-${page.weekYear}`}>viikkoon {page.week}</Link>.
            </p>
          </>
       ) : (
          <details>
            <summary>Tietoa nimipäiväaineistosta</summary>
           <p>
              Tälle päivälle ei ole julkaistu nimipäivätietoa Viikko Nron
              varmennetussa aineistossa. Tyhjiä nimipäiväkortteja tai
              paikkamerkkejä ei näytetä.
           </p>
          </details>
       )}

        <h2>Usein kysyttyä tämän päivän nimipäivistä</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p>
          Katso myös <Link to={`/kalenteri-${page.weekYear}`}>kalenteri {page.weekYear}</Link>{" "}
          ja <Link to={`/viikko-${page.week}-${page.weekYear}`}>kuluva viikko {page.week}</Link>.
        </p>
      </div>
    </section>
  );
};

export default NameDaysToday;
