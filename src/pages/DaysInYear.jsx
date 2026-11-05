import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  currentYearProgress,
  daysInYearFaqs,
  yearDaysStats,
} from "../data/daysInYearContent.js";

const PATH = "/kuinka-monta-paivaa-vuodessa";

export default function DaysInYear() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const stats = yearDaysStats(currentYear);
  const progress = currentYearProgress(today);
  const faqs = daysInYearFaqs(currentYear);

  const [inputYear, setInputYear] = useState(currentYear);
  const inputStats = yearDaysStats(inputYear);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Päiviä vuodessa
      </div>

      <h1>Kuinka monta päivää vuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Tavallisessa vuodessa on 365 päivää ja karkausvuodessa 366 päivää.
            Vuonna {currentYear} on {stats.days} päivää, koska se on {stats.leap ? "karkausvuosi" : "tavallinen vuosi"}.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Vuoden päivät pähkinänkuoressa</div>
          <ul>
            <li><strong>Tavallinen vuosi:</strong> 365 päivää (52 viikkoa ja 1 päivä).</li>
            <li><strong>Karkausvuosi:</strong> 366 päivää (52 viikkoa ja 2 päivää).</li>
            <li><strong>Vuosi {currentYear}:</strong> {stats.days} päivää ({stats.leap ? "karkausvuosi" : "normaalivuosi"}).</li>
            <li><strong>Tunteina (365 pv):</strong> 8 760 tuntia (karkausvuonna 8 784 tuntia).</li>
            <li><strong>Minuutteina (365 pv):</strong> 525 600 minuuttia (karkausvuonna 527 040 min).</li>
            <li><strong>Sekunteina (365 pv):</strong> 31 536 000 sekuntia (karkausvuonna 31 622 400 s).</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Vuoden {currentYear} kuluminen reaaliajassa</h2>
        <p>
          Vuodesta {currentYear} on kulunut <strong>{progress.daysPassed}</strong> päivää ({progress.percentage} %)
          ja jäljellä on <strong>{progress.daysRemaining}</strong> päivää.
        </p>

        <div className="panel" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "600" }}>
            <span>Kulunut: {progress.daysPassed} pv</span>
            <span>{progress.percentage} %</span>
            <span>Jäljellä: {progress.daysRemaining} pv</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "22px",
              backgroundColor: "var(--color-bg-alt, #e2e8f0)",
              borderRadius: "11px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress.percentage}%`,
                height: "100%",
                backgroundColor: "var(--color-primary, #0ea5e9)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        <AdSlot placement="days-in-year-after-answer" />

        <h2>Tarkista minkä tahansa vuoden päivät</h2>
        <p>
          Haluatko tietää tietyn vuoden päivä- ja tuntimäärän? Syötä vuosiluku alle:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <label htmlFor="diy-input-year">Vuosiluku</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "6px" }}>
            <input
              id="diy-input-year"
              type="number"
              min="1900"
              max="2100"
              value={inputYear}
              onChange={(e) => setInputYear(Number(e.target.value) || currentYear)}
              style={{ maxWidth: "140px" }}
            />
            <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
              = {inputStats.days} päivää ({inputStats.leap ? "Karkausvuosi" : "Normaalivuosi"})
            </span>
          </div>
          <p className="note-soft" style={{ marginTop: "10px" }}>
            Vuonna {inputYear} on <strong>{inputStats.hours.toLocaleString("fi-FI")}</strong> tuntia,{" "}
            <strong>{inputStats.minutes.toLocaleString("fi-FI")}</strong> minuuttia ja{" "}
            {inputStats.leapReason}
          </p>
        </div>

        <h2>Miksi vuodessa on 365 päivää?</h2>
        <p>
          Yksi kalenterivuosi kuvaa aikaa, jossa Maa kiertää kerran Auringon ympäri suhteessa kevätpäiväntasaukseen.
          Tätä tähtitieteellistä jaksoa kutsutaan <strong>trooppiseksi vuodeksi</strong>.
        </p>
        <p>
          Trooppisen vuoden tarkka pituus on noin <strong>365,2422 vuorokautta</strong> (eli noin 365 päivää, 5 tuntia, 48 minuuttia ja 45 sekuntia).
          Koska kalenteripäivän on oltava kokonainen vuorokausi, kalenterivuoden peruspituudeksi on valittu tasan 365 päivää.
        </p>

        <h2>Miksi karkausvuosi tarvitaan?</h2>
        <p>
          Koska trooppinen vuosi on noin 0,2422 päivää (lähes 6 tuntia) pidempi kuin 365 päivää, kalenteri jäisi
          joka vuosi noin neljännesvuorokauden jälkeen auringon kierrosta.
        </p>
        <p>
          Ilman karkauspäiviä kalenterivuosi siirtyisi yhden kuukauden taaksepäin noin 128 vuodessa, jolloin lopulta
          juhannusta vietettäisiin lumihangessa ja joulua keskellä hellettä. Karkauspäivä 29. helmikuuta korjaa
          tämän eron ja pitää vuodenajat samoilla paikoillaan.
        </p>

        <h2>Mistä tietää, onko vuosi karkausvuosi?</h2>
        <p>
          Gregoriaanisen kalenterin karkausvuosisääntö on kolmiosainen:
        </p>
        <ol>
          <li>Vuosi on karkausvuosi, jos se on <strong>jaollinen 4:llä</strong> (esim. 2024, 2028, 2032).</li>
          <li>Poikkeus: jos vuosi on <strong>jaollinen 100:lla</strong>, se <em>ei</em> ole karkausvuosi (esim. 1800, 1900, 2100).</li>
          <li>Poikkeuksen poikkeus: jos vuosi on <strong>jaollinen 400:lla</strong>, se <em>on</em> karkausvuosi (esim. 1600, 2000, 2400).</li>
        </ol>

        <h2>Kuukausien päivät vuoden aikana</h2>
        <p>
          Vuoden 365 (tai 366) päivää jakautuvat 12 kuukaudelle seuraavasti:
        </p>
        <ul>
          <li><strong>31 päivää (7 kuukautta):</strong> tammikuu, maaliskuu, toukokuu, heinäkuu, elokuu, lokakuu, joulukuu.</li>
          <li><strong>30 päivää (4 kuukautta):</strong> huhtikuu, kesäkuu, syyskuu, marraskuu.</li>
          <li><strong>28 tai 29 päivää (1 kuukausi):</strong> helmikuu (28 tavallisena vuonna, 29 karkausvuonna).</li>
        </ul>

        <h2>Usein kysyttyä vuoden päivistä</h2>
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
          <Link to="/kuinka-monta-viikkoa-kuukaudessa">kuinka monta viikkoa kuukaudessa on</Link> ja{" "}
          <Link to={`/kalenteri-${currentYear}`}>kalenteri {currentYear}</Link>.
        </p>
      </div>
    </section>
  );
}
