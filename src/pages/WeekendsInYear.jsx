import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  yearWeekendStats,
  weekendsInYearFaqs,
} from "../data/businessProgressContent.js";

const PATH = "/kuinka-monta-viikonloppua-vuodessa";

const COMPARISON_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function WeekendsInYear() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const stats = yearWeekendStats(selectedYear);
  const faqs = weekendsInYearFaqs(selectedYear);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikonloppuja vuodessa
      </div>

      <h1>Kuinka monta viikonloppua vuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Vuodessa on aina vähintään 52 täyttä viikonloppua eli yhteensä 104 viikonloppupäivää (52 lauantaita ja 52 sunnuntaita).
            Vuodesta ja karkauspäivistä riippuen vuodessa voi olla 104, 105 tai jopa 106 viikonloppupäivää.
            Vuonna {selectedYear} on {stats.saturdays} lauantaita ja {stats.sundays} sunnuntaita, yhteensä {stats.totalWeekendDays} viikonloppupäivää.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Vuoden {selectedYear} viikonloput pähkinänkuoressa</div>
          <ul>
            <li><strong>Täydet viikonloput:</strong> {stats.fullWeekends} kpl (lauantai + sunnuntai).</li>
            <li><strong>Lauantait:</strong> {stats.saturdays} kpl.</li>
            <li><strong>Sunnuntait:</strong> {stats.sundays} kpl.</li>
            <li><strong>Viikonloppupäivät yhteensä:</strong> {stats.totalWeekendDays} päivää.</li>
            <li>
              <strong>Osuus koko vuodesta:</strong>{" "}
              {((stats.totalWeekendDays / (selectedYear % 4 === 0 ? 366 : 365)) * 100).toFixed(1)} % vuoden kaikista päivistä.
            </li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Tarkista minkä tahansa vuoden viikonloput</h2>
        <div style={{ margin: "14px 0" }}>
          <label htmlFor="wiy-year-select" style={{ marginRight: "10px", fontWeight: "bold" }}>
            Valitse vuosi:
          </label>
          <select
            id="wiy-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: "6px 12px" }}
          >
            {COMPARISON_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vuosi</th>
                <th>Täydet viikonloput</th>
                <th>Lauantait</th>
                <th>Sunnuntait</th>
                <th>Yhteensä pv</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_YEARS.map((y) => {
                const s = yearWeekendStats(y);
                const isSelected = y === selectedYear;
                return (
                  <tr key={y} style={isSelected ? { fontWeight: "bold" } : undefined}>
                    <td>
                      <Link to={`/vuosi-${y}`}>{y}</Link>
                      {isSelected ? " (valittu)" : ""}
                    </td>
                    <td>{s.fullWeekends}</td>
                    <td>{s.saturdays}</td>
                    <td>{s.sundays}</td>
                    <td><strong>{s.totalWeekendDays} pv</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AdSlot placement="weekends-in-year-after-answer" />

        <h2>Miksi viikonloppupäivien määrä vaihtelee (104, 105 vai 106)?</h2>
        <p>
          Tavallisessa vuodessa on 365 päivää. Koska 52 viikkoa on 52 × 7 = 364 päivää, vuoteen jää aina yksi "ylimääräinen" päivä yli täysien viikkojen:
        </p>
        <ul>
          <li><strong>104 viikonloppupäivää (tavallisin):</strong> Jos vuosi alkaa maanantaina, tiistaina, keskiviikkona, torstaina tai perjantaina, kyseinen ylimääräinen päivä on arkipäivä. Tällöin lauantaita ja sunnuntaita on kumpaakin tasan 52.</li>
          <li><strong>105 viikonloppupäivää:</strong> Jos 365-päiväinen vuosi alkaa lauantaina tai sunnuntaina, kyseistä viikonloppupäivää on vuodessa 53 kappaletta.</li>
          <li><strong>106 viikonloppupäivää (harvinainen):</strong> Karkausvuonna ylimääräisiä päiviä on kaksi (366 päivää = 52 vk + 2 pv). Jos karkausvuosi alkaa lauantaina, sekä lauantai että sunnuntai toistuvat 53 kertaa (esim. vuosi 2028).</li>
        </ul>

        <h2>Usein kysyttyä viikonlopuista vuodessa</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/kuinka-monta-tyopaivaa-vuodessa">kuinka monta työpäivää vuodessa on</Link>,{" "}
          <Link to="/kuinka-monta-arkipaivaa-kuukaudessa">kuinka monta arkipäivää kuukaudessa on</Link>,{" "}
          <Link to="/kuinka-monta-paivaa-vuodessa">kuinka monta päivää vuodessa on</Link> ja{" "}
          <Link to={`/kalenteri-${selectedYear}`}>kalenteri {selectedYear}</Link>.
        </p>
      </div>
    </section>
  );
}
