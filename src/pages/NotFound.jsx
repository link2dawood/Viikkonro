import { useToday } from "../components/useToday";
import React from "react";
import { Link } from "react-router-dom";
import { isoYear } from "../components/dateUtils";
import SEO from "../components/SEO";

const NotFound = () => {
  const NOW = useToday();
  const Y_NOW = isoYear(NOW);

  return (
    <section className="app">
      {/* Unknown URLs are served the prerendered home HTML (HTTP 200) before
          React swaps in this view, so flip robots to noindex while this page
          is shown — preventing thin/duplicate pages from being indexed. */}
      <SEO
        title="Sivua ei löytynyt (404) | Viikko Nro"
        robots="noindex, follow"
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / 404
      </div>
      <div className="eyebrow">Virhe 404</div>
      <h1>Sivua ei löytynyt</h1>
      <p className="lead">
        Valitettavasti etsimääsi sivua ei ole olemassa, se on poistettu tai
        osoite on kirjoitettu väärin.
      </p>
      <div className="prose">
        <p>
          Tarkista osoite tai palaa etusivulle jatkaaksesi. Voit myös katsoa{" "}
          <Link to={`/vuosi-${Y_NOW}`} onClick={() => window.scrollTo(0, 0)}>
            vuoden {Y_NOW} viikot
          </Link>
          .
        </p>
      </div>
      <p>
        <Link className="btn" to="/" onClick={() => window.scrollTo(0, 0)}>
          Palaa etusivulle
        </Link>
      </p>
    </section>
  );
};

export default NotFound;
