import { useToday } from "./useToday";
import React from "react";
import {
  isoYear,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "./dateUtils";
import { Link } from "react-router-dom";
const YearsWeek = () => {
  const years = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    years.push(y);
  }
  const Y_NOW = isoYear(useToday());

  return (
    <>
      <section>
        <h2 className="mh">Selaa vuosia</h2>
        <p className="lead">
          Kaikki viikkonumerot ja vuosikalenterit vuosi kerrallaan
          päivämäärineen.
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
        </div>
      </section>
    </>
  );
};

export default YearsWeek;
