import { Link } from "react-router-dom";
import { useToday } from "./useToday";
import { helsinkiDayKey, homepageSeasonYear } from "./dateUtils";
import { calendarPdfPath, yearStats } from "../data/seo";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";

// Homepage season block, placed right under the hero: the featured year's
// calendar, PDF and most-visited pages. From September it features next year
// (see homepageSeasonYear), when searches for next year's calendar start
// climbing towards their Nov–Jan peak; Jan–Aug it features the current year.
const SeasonYear = () => {
  const today = useToday();
  const y = homepageSeasonYear(today);
  const isNextYear = y > Number(helsinkiDayKey(today).slice(0, 4));
  const stats = yearStats(y);

  const tiles = [
    { to: `/vuosi-${y}`, name: `Viikkonumerot ${y}`, desc: `${stats.weekCount} ISO-viikkoa` },
    { to: `/pyhapaivat-${y}`, name: `Pyhäpäivät ${y}`, desc: `${stats.officialHolidayCount} arkipyhää` },
    { to: `/tyopaivat-${y}`, name: `Työpäivät ${y}`, desc: `${stats.working} työpäivää` },
    ...(pageConfidenceTier(y) === CONFIDENCE.CONFIRMED
      ? [{ to: `/koululomat-${y}`, name: `Koululomat ${y}`, desc: "Syys-, joulu- ja hiihtolomat" }]
      : []),
    { to: `/palkkapaivat-${y}`, name: `Palkkapäivät ${y}`, desc: "Milloin palkka tulee" },
    { to: `/tulostettava-kalenteri-${y}`, name: "Tulostettava A4", desc: "Koko vuosi yhdellä sivulla" },
  ];

  return (
    <section className="season-year" aria-labelledby="season-year-h">
      <div className="season-year-head">
        <div>
          <div className="eyebrow">{isNextYear ? "Ensi vuosi" : "Tämä vuosi"}</div>
          <h2 id="season-year-h">Kalenteri {y}</h2>
          <p>
            {isNextYear
              ? `Suunnittele jo ensi vuotta: vuoden ${y} viikot, pyhäpäivät ja työpäivät ovat valmiina.`
              : `Vuoden ${y} viikot, pyhäpäivät ja työpäivät yhdestä paikasta.`}
          </p>
        </div>
        <div className="season-year-cta">
          <Link className="btn" to={`/kalenteri-${y}`}>
            Avaa kalenteri {y}
          </Link>
          <a className="btn btn-ghost" href={calendarPdfPath(y)} download>
            Lataa PDF {y}
          </a>
        </div>
      </div>
      <div className="season-year-tiles">
        {tiles.map((t) => (
          <Link key={t.to} className="ql" to={t.to}>
            <b>{t.name}</b>
            <span>{t.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SeasonYear;
