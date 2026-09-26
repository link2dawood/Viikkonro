import { useToday } from "./useToday";
import { Link } from "react-router-dom";
import { navigationYearTargets } from "./dateUtils";
const QuickLinks = () => {
  const NOW = useToday();
  const { currentYear, promotedYear } = navigationYearTargets(NOW);
  return (
    <>
      <section>
        <h2 className="mh">Pikalinkit</h2>
        <div className="quicklinks">
          <Link
            className="ql"
            to={`/kalenteri-${promotedYear}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Vuoden {promotedYear} kalenteri</b>
            <span>Kaikki viikot ja juhlapäivät yhdellä sivulla</span>
          </Link>
          <Link
            className="ql"
            to={`/tulosta-${promotedYear}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Tulostettava viikkolista</b>
            <span>Kaikki ISO-viikot riveittäin</span>
          </Link>
          <Link
            className="ql"
            to={`/pyhapaivat-${currentYear}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Suomen pyhäpäivät {currentYear}</b>
            <span>Arkipyhät, viikonpäivät ja viikkonumerot</span>
          </Link>
          <Link
            className="ql"
            to={`/tyopaivat-${currentYear}`}
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Työpäivät {currentYear}</b>
            <span>Montako työpäivää vuodessa</span>
          </Link>
          <Link
            className="ql"
            to="/mika-kuukausi-nyt"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Mikä kuukausi nyt on?</b>
            <span>Nykyinen kuukausi numerona ja kalenterina</span>
          </Link>
          <Link
            className="ql"
            to="/mika-vuosi-nyt"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Mikä vuosi nyt on?</b>
            <span>Vuoden tiedot ja eteneminen</span>
          </Link>
          <Link
            className="ql"
            to="/viikonpaiva"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Mikä viikonpäivä oli?</b>
            <span>Tarkista minkä tahansa päivämäärän viikonpäivä</span>
          </Link>
          <Link
            className="ql"
            to="/mika-on-viikkonumero"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Mikä on viikkonumero?</b>
            <span>Miten viikot lasketaan</span>
          </Link>
          <Link
            className="ql"
            to="/kuinka-monta-viikkoa-vuodessa"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Kuinka monta viikkoa vuodessa on?</b>
            <span>52 tai 53 viikkoa</span>
          </Link>
          <Link
            className="ql"
            to="/chrome-extension"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Chrome-laajennus</b>
            <span>Viikkonumero aina selaimen työkalupalkissa</span>
          </Link>
          <Link
            className="ql"
            to="/android-sovellus"
            onClick={() => window.scrollTo(0, 0)}
          >
            <b>Android-sovellus</b>
            <span>Viikot, kalenteri, laskurit ja 7 widgetiä</span>
          </Link>
          <Link className="ql" to="/ukk" onClick={() => window.scrollTo(0, 0)}>
            <b>UKK</b>
            <span>Vastauksia viikoista</span>
          </Link>
        </div>
      </section>
    </>
  );
};

export default QuickLinks;
