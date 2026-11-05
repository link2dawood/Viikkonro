import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  hoursInYearStats,
  hoursInYearFaqs,
} from "../data/unitMathContent.js";

const PATH = "/kuinka-monta-tuntia-vuodessa";

const COMPARISON_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function HoursInYear() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const stats = hoursInYearStats(selectedYear);
  const faqs = hoursInYearFaqs(selectedYear);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Tunteja vuodessa
      </div>

      <h1>Kuinka monta tuntia vuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Tavallisessa vuodessa on tasan 8 760 tuntia (365 päivää × 24 tuntia).
            Karkausvuonna vuodessa on 8 784 tuntia (366 päivää × 24 tuntia).
            Vuonna {selectedYear} on {stats.hoursFormatted} tuntia, {stats.minutesFormatted} minuuttia ja {stats.secondsFormatted} sekuntia.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Vuoden {selectedYear} tunnit ja aikayksiköt</div>
          <ul>
            <li><strong>Tunnit yhteensä:</strong> {stats.hoursFormatted} h ({stats.isLeapYear ? "karkausvuosi" : "tavallinen vuosi"}).</li>
            <li><strong>Minuutit:</strong> {stats.minutesFormatted} min (tunnit × 60).</li>
            <li><strong>Sekunnit:</strong> {stats.secondsFormatted} s (minuutit × 60).</li>
            <li><strong>Työtunnit (7,5 h/pv):</strong> noin {stats.workHours75.toLocaleString("fi-FI")} h (n. 21,6 % vuodesta).</li>
            <li><strong>Työtunnit (8,0 h/pv):</strong> noin {stats.workHours8.toLocaleString("fi-FI")} h (n. 23,0 % vuodesta).</li>
            <li><strong>Uni (8 h/yö):</strong> {stats.sleepHours.toLocaleString("fi-FI")} h (tasan 33,3 % vuodesta).</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Tarkastele vuoden {selectedYear} aikayksiköitä</h2>
        <div style={{ margin: "14px 0" }}>
          <label htmlFor="hiy-year-select" style={{ marginRight: "10px", fontWeight: "bold" }}>
            Valitse vuosi:
          </label>
          <select
            id="hiy-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: "6px 12px" }}
          >
            {COMPARISON_YEARS.map((y) => (
              <option key={y} value={y}>
                {y} {y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? "(karkausvuosi, 8 784 h)" : "(8 760 h)"}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Aikayksikkö</th>
                <th>Määrä vuonna {selectedYear}</th>
                <th>Laskukaava</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Päivät</strong></td>
                <td>{stats.days} päivää</td>
                <td>{stats.isLeapYear ? "365 + 1 karkauspäivä" : "Kalenteripäivät"}</td>
              </tr>
              <tr>
                <td><strong>Tunnit</strong></td>
                <td><strong>{stats.hoursFormatted} tuntia</strong></td>
                <td>{stats.days} pv × 24 h</td>
              </tr>
              <tr>
                <td><strong>Minuutit</strong></td>
                <td>{stats.minutesFormatted} min</td>
                <td>{stats.hoursFormatted} h × 60 min</td>
              </tr>
              <tr>
                <td><strong>Sekunnit</strong></td>
                <td>{stats.secondsFormatted} s</td>
                <td>{stats.minutesFormatted} min × 60 s</td>
              </tr>
              <tr>
                <td><strong>Vuosityötunnit (7,5 h)</strong></td>
                <td>n. {stats.workHours75.toLocaleString("fi-FI")} h</td>
                <td>n. 252 työpäivää × 7,5 h</td>
              </tr>
              <tr>
                <td><strong>Nukkumisaika (8 h)</strong></td>
                <td>{stats.sleepHours.toLocaleString("fi-FI")} h</td>
                <td>{stats.days} pv × 8 h</td>
              </tr>
            </tbody>
          </table>
        </div>

        <AdSlot placement="hours-in-year-after-answer" />

        <h2>Miten vuoden 8 760 tuntia jakautuvat ihmisen elämässä?</h2>
        <p>
          Vuoden kokonaistuntimäärä auttaa hahmottamaan ajankäyttöä laajemmassa mittakaavassa:
        </p>
        <ul>
          <li><strong>Nukkuminen:</strong> Suositeltu 8 tunnin uni vie vuodesta 2 920 tuntia (33,3 %). Vietämme siis kolmanneksen vuodesta nukkuen.</li>
          <li><strong>Työaika:</strong> Täysipäivätyö (noin 1 890 tuntia) vie vain noin 21–22 prosenttia vuoden kaikista tunneista. Lomat, viikonloput ja arkipyhät mukaan lukien vapaata on huomattavasti enemmän kuin työaikaa.</li>
          <li><strong>Vapaa-aika ja arkiaskareet:</strong> Nukkumisen ja työajan jälkeen jäljelle jää noin 3 950 tuntia (noin 45 % koko vuodesta) perheelle, harrastuksille, syömiselle ja levolle.</li>
        </ul>

        <h2>Usein kysyttyä tunneista vuodessa</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/kuinka-monta-tyotuntia-vuodessa">kuinka monta työtuntia vuodessa on</Link>,{" "}
          <Link to="/kuinka-monta-tyotuntia-kuukaudessa">kuinka monta työtuntia kuukaudessa on</Link>,{" "}
          <Link to="/kuinka-monta-paivaa-vuodessa">kuinka monta päivää vuodessa on</Link>,{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">kuinka monta viikkoa vuodessa on</Link> ja{" "}
          <Link to="/tuntilaskuri">tuntilaskuri</Link>.
        </p>
      </div>
    </section>
  );
}
