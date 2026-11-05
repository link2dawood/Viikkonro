import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  yearWeeksRemainingStats,
  weeksRemainingFaqs,
} from "../data/businessProgressContent.js";

const PATH = "/kuinka-monta-viikkoa-jaljella";

export default function WeeksRemaining() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const [customDateStr, setCustomDateStr] = useState("");

  const activeDate = customDateStr ? new Date(`${customDateStr}T12:00:00`) : today;
  const stats = yearWeeksRemainingStats(activeDate);
  const faqs = weeksRemainingFaqs(activeDate);
  const currentYear = isoYear(today);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikkoja vuodesta jäljellä
      </div>

      <h1>Kuinka monta viikkoa vuodesta on jäljellä?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Vuodesta {stats.year} on jäljellä tällä hetkellä {stats.weeksRemaining} viikkoa ja {stats.daysRemaining} kalenteripäivää.
            Nyt on meneillään viikko {stats.currentWeek} vuoden kaikkiaan {stats.totalWeeks} viikosta.
            Vuodesta on kulunut {stats.percentElapsed} % ja jäljellä on {stats.percentRemaining} %.
          </strong>
        </p>

        <div className="panel lookup" style={{ margin: "20px 0", textAlign: "center" }}>
          <div className="now-label">Vuoden {stats.year} tilanne ja edistyminen</div>
          
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", margin: "18px 0" }}>
            <div style={{ padding: "10px" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent, #0066cc)" }}>
                {stats.weeksRemaining}
              </div>
              <div style={{ fontSize: "0.95rem" }}>viikkoa jäljellä</div>
            </div>
            <div style={{ padding: "10px" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent, #0066cc)" }}>
                {stats.daysRemaining}
              </div>
              <div style={{ fontSize: "0.95rem" }}>päivää jäljellä</div>
            </div>
            <div style={{ padding: "10px" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                vk {stats.currentWeek} / {stats.totalWeeks}
              </div>
              <div style={{ fontSize: "0.95rem" }}>kuluva viikko</div>
            </div>
          </div>

          <div style={{ margin: "14px auto", maxWidth: "480px" }}>
            <div
              style={{
                background: "#e0e0e0",
                borderRadius: "8px",
                height: "22px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  background: "var(--accent, #0066cc)",
                  width: `${stats.percentElapsed}%`,
                  height: "100%",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginTop: "4px" }}>
              <span>Kulunut: {stats.percentElapsed} %</span>
              <span>Jäljellä: {stats.percentRemaining} %</span>
            </div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <label htmlFor="wr-custom-date" style={{ marginRight: "10px", fontSize: "0.95rem" }}>
              Tarkista tilanne toisena päivänä:
            </label>
            <input
              id="wr-custom-date"
              type="date"
              value={customDateStr}
              onChange={(e) => setCustomDateStr(e.target.value)}
              style={{ padding: "6px 10px" }}
            />
            {customDateStr && (
              <button
                type="button"
                onClick={() => setCustomDateStr("")}
                style={{ marginLeft: "8px", padding: "6px 12px" }}
              >
                Palauta tämä päivä
              </button>
            )}
          </div>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <AdSlot placement="weeks-remaining-after-answer" />

        <h2>Miten jäljellä olevat viikot lasketaan?</h2>
        <p>
          Suomessa ja kansainvälisessä ISO 8601 -standardissa viikot lasketaan aina maanantaista sunnuntaihin.
          Tavallisessa vuodessa on 52 viikkoa ja joinakin vuosina (kuten 2026 ja 2032) 53 viikkoa.
        </p>
        <p>
          Jäljellä olevat viikot lasketaan vähentämällä kuluvan viikon numero vuoden kokonaisviikkomäärästä.
          Koska vuoden viimeiset päivät voivat kalenterista riippuen kuulua jo seuraavan vuoden ensimmäiseen viikkoon,
          päivälaskuri ottaa huomioon todelliset kalenteripäivät joulukuun 31. päivään saakka.
        </p>

        <h2>Usein kysyttyä jäljellä olevista viikoista</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/kuinka-monta-viikkoa-vuodessa">kuinka monta viikkoa vuodessa on</Link>,{" "}
          <Link to="/miksi-vuodessa-on-53-viikkoa">miksi vuodessa on 53 viikkoa</Link>,{" "}
          <Link to="/kuinka-monta-paivaa-vuodessa">kuinka monta päivää vuodessa on</Link>,{" "}
          <Link to="/paivien-erotus">päivien erotus -laskuri</Link> ja{" "}
          <Link to={`/kalenteri-${currentYear}`}>kalenteri {currentYear}</Link>.
        </p>
      </div>
    </section>
  );
}
