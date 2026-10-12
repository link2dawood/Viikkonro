import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import ToolDirectory from "../components/ToolDirectory";
import { useToday } from "../components/useToday";



const Calculators = () => {
  const year = useToday().getFullYear();
  return (
  <section className="app">
    <SEO {...routeMeta["/laskurit"]} canonical={canonicalFor("/laskurit")} />
    <div className="breadcrumb">
      <Link to="/">Etusivu</Link> / Laskurit
    </div>
    <h1>Viikkolaskurit ja päivämäärätyökalut</h1>
    <p className="lead">
      Löydä kalenterit, päivämäärälaskurit ja suunnittelutyökalut samasta paikasta.
      Maksuton esikatselu, lataukset ja mahdolliset ostot kuvataan kunkin työkalun sivulla.
    </p>

    <ToolDirectory />

    <p>
      Etsitkö kuluvaa viikkoa? Katso <Link to="/">mikä viikko nyt on</Link> tai
      selaa <Link to={`/vuosi-${year}`}>vuoden {year} viikkonumeroita</Link>.
    </p>
  </section>
  );
};

export default Calculators;
