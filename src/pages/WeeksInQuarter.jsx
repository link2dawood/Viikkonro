import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  quarterWeekStats,
  weeksInQuarterFaqs,
} from "../data/businessProgressContent.js";

const PATH = "/kuinka-monta-viikkoa-kvartaalissa";

export default function WeeksInQuarter() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const quarters = quarterWeekStats(selectedYear);
  const faqs = weeksInQuarterFaqs();

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikkoja kvartaalissa
      </div>

      <h1>Kuinka monta viikkoa kvartaalissa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Kvartaalissa (vuosineljänneksessä) on keskimäärin tasan 13 viikkoa (noin 91 päivää).
            Koska tavallisessa vuodessa on 52 viikkoa ja neljä kvartaalia, viikkoja on 52 / 4 = 13 viikkoa per kvartaali.
            Poikkeuksellisena 53 viikon vuonna neljännessä kvartaalissa (Q4) on 14 viikkoa.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Kvartaalit pähkinänkuoressa</div>
          <ul>
            <li><strong>Q1 (tammi–maaliskuu):</strong> 13 viikkoa (viikot 1–13, 90 tai karkausvuonna 91 päivää).</li>
            <li><strong>Q2 (huhti–kesäkuu):</strong> 13 viikkoa (viikot 14–26, 91 päivää).</li>
            <li><strong>Q3 (heinä–syyskuu):</strong> 13 viikkoa (viikot 27–39, 92 päivää).</li>
            <li><strong>Q4 (loka–joulukuu):</strong> 13 viikkoa (viikot 40–52, 92 päivää) tai 53 viikon vuonna 14 viikkoa (viikot 40–53).</li>
            <li><strong>Taloushallinnon 4-4-5-malli:</strong> kvartaalin kuukaudet jaetaan 4 + 4 + 5 = 13 viikon jaksoihin.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Kvartaalien viikot ja päivät vuonna {selectedYear}</h2>
        <div style={{ margin: "14px 0" }}>
          <label htmlFor="wiq-year-select" style={{ marginRight: "10px", fontWeight: "bold" }}>
            Valitse vuosi:
          </label>
          <select
            id="wiq-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: "6px 12px" }}
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>
                {y} {y === 2026 ? "(53 viikkoa)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kvartaali</th>
                <th>Kuukaudet</th>
                <th>ISO-viikot</th>
                <th>Viikot (kpl)</th>
                <th>Päiviä</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q) => (
                <tr key={q.quarter}>
                  <td>
                    <Link to={`/${q.quarter.toLowerCase()}-${selectedYear}`}>
                      <strong>{q.quarter}</strong>
                    </Link>
                  </td>
                  <td>{q.months}</td>
                  <td>{q.weekRange}</td>
                  <td><strong>{q.weeksIso} vk</strong> ({q.decimalWeeks} vk)</td>
                  <td>{q.days} pv</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="weeks-in-quarter-after-answer" />

        <h2>Mikä on taloushallinnon 4-4-5-viikkomalli?</h2>
        <p>
          Monet vähittäiskaupan, ravintola-alan ja teollisuuden yritykset käyttävät kalenterikuukausien sijaan{" "}
          <strong>4-4-5-kalenteria</strong>. Tässä mallissa jokainen 13 viikon kvartaali jaetaan kolmeen jaksoon:
        </p>
        <ul>
          <li><strong>1. jakso:</strong> 4 viikkoa (28 päivää)</li>
          <li><strong>2. jakso:</strong> 4 viikkoa (28 päivää)</li>
          <li><strong>3. jakso:</strong> 5 viikkoa (35 päivää)</li>
        </ul>
        <p>
          Yhteensä kvartaaliin kertyy tasan 4 + 4 + 5 = 13 viikkoa ja 91 päivää. Etuna on, että jokainen jakso päättyy aina samaan viikonpäivään (esimerkiksi sunnuntaihin) ja viikonloppujen määrä on täysin ennakoitavissa, mikä tekee myynti- ja tulosvertailuista tarkempia kuin eri pituisilla kalenterikuukausilla.
        </p>

        <h2>Usein kysyttyä kvartaalin viikoista</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös kvartaalikohtaiset sivut <Link to={`/q1-${selectedYear}`}>Q1 {selectedYear}</Link>,{" "}
          <Link to={`/q2-${selectedYear}`}>Q2 {selectedYear}</Link>,{" "}
          <Link to={`/q3-${selectedYear}`}>Q3 {selectedYear}</Link>,{" "}
          <Link to={`/q4-${selectedYear}`}>Q4 {selectedYear}</Link>,{" "}
          <Link to="/kuinka-monta-viikkoa-kuukaudessa">kuinka monta viikkoa kuukaudessa on</Link> ja{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">kuinka monta viikkoa vuodessa on</Link>.
        </p>
      </div>
    </section>
  );
}
