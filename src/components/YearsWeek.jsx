import { useToday } from "./useToday";
import React from "react";
import { isoYear } from "./dateUtils";
import { Link } from "react-router-dom";
import { YEAR_INDEX_PATH, featuredYears, yearIndexStats } from "../data/yearIndexPages.js";

// Homepage year browser. It lists only the years inside the indexable window
// (featuredYears) rather than the whole PRERENDER_MIN_YEAR..PRERENDER_MAX_YEAR
// horizon: the wider list spent the homepage's link equity on ~11 pruned year
// pages per row. The remaining years keep a crawl path through
// /kaikki-vuodet, which is one click from here. See yearIndexPages.js.
const YearsWeek = () => {
  const today = useToday();
  const years = featuredYears(today);
  const { first, last } = yearIndexStats(today);
  const Y_NOW = isoYear(today);

  return (
    <>
      <section>
        <h2 className="mh">Selaa vuosia</h2>
        <p className="lead">
          Haetuimmat vuodet yhdellä klikkauksella. Kaikki julkaistut vuodet{" "}
          {first}-{last} löytyvät{" "}
          <Link to={YEAR_INDEX_PATH}>vuosihakemistosta</Link>.
        </p>

        <h3 className="dir-h">Viikkonumerot vuosittain</h3>
        <div className="pills">
          {years.map((year) => (
            <Link
              key={`v-${year}`}
              to={`/vuosi-${year}`}
              className={`pill ${year === Y_NOW ? "active" : ""}`}
              aria-label={`Viikkonumerot ${year}`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {year}
            </Link>
          ))}
          <Link
            key="v-all"
            to={YEAR_INDEX_PATH}
            className="pill"
            aria-label={`Kaikki vuodet ${first}-${last}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            Kaikki vuodet
          </Link>
        </div>

        <h3 className="dir-h">Vuosikalenterit</h3>
        <div className="pills">
          {years.map((year) => (
            <Link
              key={`k-${year}`}
              to={`/kalenteri-${year}`}
              className={`pill ${year === Y_NOW ? "active" : ""}`}
              aria-label={`Vuoden ${year} kalenteri`}
              onClick={() => window.scrollTo(0, 0)}
            >
              {year}
            </Link>
          ))}
          <Link
            key="k-all"
            to={YEAR_INDEX_PATH}
            className="pill"
            aria-label={`Kaikki vuosikalenterit ${first}-${last}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            Kaikki vuodet
          </Link>
        </div>
      </section>
    </>
  );
};

export default YearsWeek;
