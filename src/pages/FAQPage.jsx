import { Link } from "react-router-dom";
import { faqCategories } from "../data/faqs";
import SEO from "../components/SEO";
import { routeMeta } from "../data/seo";
import { dateFromDayKey, fmtFullFi } from "../components/dateUtils.js";
import { PARITY_UPDATED } from "../data/weekParity.js";

const FAQPage = () => {
  const meta = routeMeta["/ukk"];
  return (
    <>
      <section className="app">
        <SEO title={meta.title} description={meta.description} />
        <div className="breadcrumb">
          <Link to="/">Etusivu</Link> / UKK
        </div>
        <h1>Usein kysytyt kysymykset</h1>
        <p className="lead">
          Vastauksia yleisimpiin kysymyksiin viikkonumeroista, viikon
          alkamisesta ja ISO 8601 -standardista.
        </p>
        <p className="note-soft">Sisältö päivitetty {fmtFullFi(dateFromDayKey(PARITY_UPDATED))}.</p>

        {faqCategories.map((category, categoryIndex) => (
          <div key={category.title} className="faq-group">
            <h2 className="mh">{category.title}</h2>
            {category.items.map((item, itemIndex) => (
              <details
                key={item.q}
                open={categoryIndex === 0 && itemIndex === 0}
              >
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        ))}
      </section>
    </>
  );
};

export default FAQPage;
