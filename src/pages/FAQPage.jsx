import { Link } from "react-router-dom";
import { FAQ_UPDATED, faqCategories } from "../data/faqs";
import SEO from "../components/SEO";
import { routeMeta } from "../data/seo";
import { dateFromDayKey, fmtFullFi } from "../components/dateUtils.js";

const FAQPage = () => {
  const meta = routeMeta["/ukk"];
  return (
    <>
      <section className="app">
        <SEO title={meta.title} description={meta.description} />
        <div className="breadcrumb">
          <Link to="/">Etusivu</Link> / Viikkonumero UKK
        </div>
        <h1>Viikkonumero: usein kysytyt kysymykset</h1>
        <p className="lead">
          Viikkonumero kertoo, mihin vuoden kalenteriviikkoon tietty päivä
          kuuluu. Löydä alta vastaukset viikkonumeron tarkistamiseen,
          laskemiseen ja käyttöön Suomessa.
        </p>
        <p>
          <Link to="/">Tarkista nykyinen viikkonumero</Link>, lue tarkempi
          opas siitä, <Link to="/mika-on-viikkonumero">mikä viikkonumero on</Link>,
          tai <Link to="/paivamaara-viikoksi">muunna päivämäärä viikoksi</Link>.
        </p>
        <p className="note-soft">Sisältö päivitetty {fmtFullFi(dateFromDayKey(FAQ_UPDATED))}.</p>

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
