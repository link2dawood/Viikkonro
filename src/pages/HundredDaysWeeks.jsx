import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  daysToWeeksStats,
  COMMON_DAY_CONVERSIONS,
  hundredDaysWeeksFaqs,
} from "../data/unitMathContent.js";

const PATH = "/kuinka-monta-viikkoa-on-100-paivaa";

export default function HundredDaysWeeks() {
  const meta = routeMeta[PATH];
  const [daysInput, setDaysInput] = useState(100);

  const stats = daysToWeeksStats(daysInput);
  const faqs = hundredDaysWeeksFaqs();

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / 100 päivää viikkoina
      </div>

      <h1>Kuinka monta viikkoa on 100 päivää?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            100 päivää on tasan 14 viikkoa ja 2 päivää (desimaalilukuna noin 14,29 viikkoa).
            Kuukausina 100 päivää vastaa noin 3,3 kuukautta ja arkityöpäivinä (maanantai–perjantai) noin 71–72 työpäivää.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">100 päivää pähkinänkuoressa</div>
          <ul>
            <li><strong>Viikkoina:</strong> 14 viikkoa ja 2 päivää (14,29 vk).</li>
            <li><strong>Kaava:</strong> 100 / 7 = 14 kokonaista viikkoa, jakojäännös 2 päivää.</li>
            <li><strong>Kuukausina:</strong> noin 3,3 kuukautta (keskimäärin 30,44 pv/kk).</li>
            <li><strong>Työpäivinä:</strong> noin 71–72 arkipäivää (14 × 5 = 70 pv + 1–2 arkipäivää).</li>
            <li><strong>Tuntina:</strong> 2 400 tuntia (100 × 24 h).</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Muunna päivät viikoiksi -laskuri</h2>
        <div className="panel lookup" style={{ margin: "20px 0" }}>
          <label htmlFor="hdw-input" style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
            Syötä päivien määrä:
          </label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              id="hdw-input"
              type="number"
              min="0"
              max="10000"
              value={daysInput}
              onChange={(e) => setDaysInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{ padding: "8px 12px", fontSize: "1.1rem", width: "120px" }}
            />
            <span style={{ fontSize: "1.05rem" }}>päivää</span>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginLeft: "10px" }}>
              {[30, 60, 90, 100, 180, 365].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDaysInput(preset)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    background: daysInput === preset ? "var(--accent, #0066cc)" : undefined,
                    color: daysInput === preset ? "#fff" : undefined,
                  }}
                >
                  {preset} pv
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              background: "var(--bg-subtle, #f5f5f5)",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
              {stats.days} päivää = {stats.fullWeeks} viikkoa ja {stats.remainderDays} päivää
            </div>
            <div style={{ color: "#555", marginTop: "4px", fontSize: "0.95rem" }}>
              Desimaalilukuna: <strong>{stats.decimalWeeks} viikkoa</strong> • Noin <strong>{stats.monthsEstimate} kuukautta</strong> • Noin <strong>{stats.workingDaysEstimate} työpäivää</strong> (ma–pe)
            </div>
          </div>
        </div>

        <AdSlot placement="hundred-days-after-answer" />

        <h2>Yleisimpien päivämäärien muuntotaulukko viikoiksi</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Päiviä</th>
                <th>Viikot ja päivät</th>
                <th>Desimaaliviikot</th>
                <th>Kuukausina</th>
                <th>Työpäivinä (arvio)</th>
              </tr>
            </thead>
            <tbody>
              {COMMON_DAY_CONVERSIONS.map((d) => {
                const s = daysToWeeksStats(d);
                const isSelected = d === daysInput;
                return (
                  <tr key={d} style={isSelected ? { fontWeight: "bold" } : undefined}>
                    <td><strong>{d} pv</strong></td>
                    <td>{s.fullWeeks} vk {s.remainderDays > 0 ? `${s.remainderDays} pv` : ""}</td>
                    <td>{s.decimalWeeks} vk</td>
                    <td>n. {s.monthsEstimate} kk</td>
                    <td>n. {s.workingDaysEstimate} pv</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2>Mihin 100 päivän aikajaksoa käytetään?</h2>
        <p>
          100 päivää on suosittu aikaraja monissa eri yhteyksissä:
        </p>
        <ul>
          <li><strong>Projektit ja kuntohaasteet:</strong> 100 päivää (noin 14 viikkoa) on psykologisesti ihanteellinen pituus uuden tavan omaksumiseen tai määrätietoiseen harjoitteluun.</li>
          <li><strong>Uuden johtajan ensimmäiset 100 päivää:</strong> Liike-elämässä ja politiikassa puhutaan usein "ensimmäisestä 100 päivästä", jonka aikana luodaan suuntaviivat ja arvioidaan alkumenestystä.</li>
          <li><strong>Koeajat ja toimitusajat:</strong> Noin kolmen kuukauden toimitus- tai tilausajat vastaavat usein noin 90–100 päivää.</li>
        </ul>

        <h2>Usein kysyttyä 100 päivästä viikkoina</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
          <Link to="/paivien-erotus">kahden päivämäärän erotus</Link>,{" "}
          <Link to="/90-paivaa-eteenpain">90 päivää eteenpäin</Link>,{" "}
          <Link to="/kuinka-monta-viikkoa-kuukaudessa">kuinka monta viikkoa kuukaudessa on</Link> ja{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">kuinka monta viikkoa vuodessa on</Link>.
        </p>
      </div>
    </section>
  );
}
