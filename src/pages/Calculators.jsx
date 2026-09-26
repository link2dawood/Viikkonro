import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import { COUNTDOWNS } from "../data/countdownPages";
import { useToday } from "../components/useToday";

const TOOLS = [
  {
    to: "/viikonpaiva",
    name: "Viikonpäivälaskuri",
    desc: "Syötä päivämäärä ja selvitä, mikä viikonpäivä se oli tai tulee olemaan.",
  },
  {
    to: "/paivamaara-viikoksi",
    name: "Päivämäärästä viikkonumeroon",
    desc: "Syötä päivä ja näe sen viikkonumero, viikonpäivä ja viikon päivämäärät.",
  },
  {
    to: "/viikko-paivamaaraksi",
    name: "Viikosta päivämääräksi",
    desc: "Syötä viikko ja vuosi, näe viikon alkamis- ja päättymispäivä sekä viikonpäivät.",
  },
  {
    to: "/tyopaivalaskuri",
    name: "Työpäivälaskuri",
    desc: "Työpäivät kahden päivän välillä, viikonloput ja arkipyhät huomioiden.",
  },
  {
    to: "/paivien-erotus",
    name: "Päivien erotus",
    desc: "Montako päivää ja viikkoa kahden päivämäärän välillä on.",
  },
  ...COUNTDOWNS.map((c) => ({
    to: c.path,
    name: `Päivää ${c.illative}`,
    desc: `Montako päivää, viikkoa ja työpäivää on jäljellä: ${c.targetName}.`,
  })),
];

const Calculators = () => {
  const year = useToday().getFullYear();
  const tools = [
    ...TOOLS,
    {
      to: `/palkkapaivat-${year}`,
      name: "Palkkapäivät",
      desc: "Milloin palkka tulee, kun palkkapäivä osuu viikonloppuun tai arkipyhään.",
    },
  ];
  return (
  <section className="app">
    <SEO {...routeMeta["/laskurit"]} canonical={canonicalFor("/laskurit")} />
    <div className="breadcrumb">
      <Link to="/">Etusivu</Link> / Laskurit
    </div>
    <h1>Viikkolaskurit ja päivämäärätyökalut</h1>
    <p className="lead">
      Ilmaisia, nopeita työkaluja viikkonumeroihin ja päivämääriin. Kaikki
      laskennat ISO 8601 -standardin ja Suomen arkipyhien mukaan.
    </p>

    <div className="tool-grid">
      {tools.map((t) => (
        <Link key={t.to} className="tool-card" to={t.to}>
          <span className="tool-name">{t.name}</span>
          <span className="tool-desc">{t.desc}</span>
        </Link>
      ))}
    </div>

    <p>
      Etsitkö kuluvaa viikkoa? Katso <Link to="/">mikä viikko nyt on</Link> tai
      selaa <Link to={`/vuosi-${year}`}>vuoden {year} viikkonumeroita</Link>.
    </p>
  </section>
  );
};

export default Calculators;
