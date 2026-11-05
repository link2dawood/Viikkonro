import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  yearWorkdayStats,
  yearComparisonWorkdayRows,
  workdaysInYearFaqs,
} from "../data/laborHoursContent.js";

const PATH = "/kuinka-monta-tyopaivaa-vuodessa";

export default function WorkdaysInYear() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const currentStats = yearWorkdayStats(currentYear);
  const comparisonRows = yearComparisonWorkdayRows(currentYear - 1, currentYear + 5);
  const faqs = workdaysInYearFaqs(currentYear);

  const [inputHoursPerDay, setInputHoursPerDay] = useState(7.5);
  const customTotalHours = Math.round(currentStats.workingDays5 * Number(inputHoursPerDay) * 10) / 10;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Työpäivät vuodessa
      </div>

      <h1>Kuinka monta työpäivää vuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Tavallisessa vuodessa on keskimäärin 251–254 työpäivää (maanantai–perjantai ilman arkipyhiä).
            Vuonna {currentYear} on tasan {currentStats.workingDays5} työpäivää.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Vuoden {currentYear} työpäivät pähkinänkuoressa</div>
          <ul>
            <li><strong>Työpäivät (5 pv/vko):</strong> {currentStats.workingDays5} työpäivää.</li>
            <li><strong>Kelan arkipäivät (6 pv/vko):</strong> {currentStats.workingDays6} arkipäivää (sisältää lauantait ilman arkipyhiä).</li>
            <li><strong>Viikonloppupäivät:</strong> {currentStats.weekendDays} päivää (lauantait ja sunnuntait).</li>
            <li><strong>Arkipyhät (ma–pe):</strong> {currentStats.weekdayHolidays} palkallista vapaapäivää arkipäivillä.</li>
            <li><strong>Työtunnit (7,5 h/pv):</strong> {currentStats.hours75.toLocaleString("fi-FI")} tuntia.</li>
            <li><strong>Työtunnit (8,0 h/pv):</strong> {currentStats.hours80.toLocaleString("fi-FI")} tuntia.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Työpäivien vertailu vuosittain (2025–2031)</h2>
        <p>
          Työpäivien määrä vaihtelee vuosittain 250 ja 255 päivän välillä riippuen siitä,
          kuinka moni Suomen 13 virallisesta pyhäpäivästä osuu viikonlopulle.
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vuosi</th>
                <th>Työpäivät (ma–pe)</th>
                <th>Arkipyhät (ma–pe)</th>
                <th>Kelan arkipäivät</th>
                <th>Työtunnit (7,5 h)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.year} className={row.year === currentYear ? "highlight" : ""}>
                  <td>
                    <Link to={`/tyopaivat-${row.year}`}>
                      <strong>{row.year}</strong>
                    </Link>
                    {row.year === currentYear ? " (nykyinen)" : ""}
                  </td>
                  <td><strong>{row.workingDays5} pv</strong></td>
                  <td>{row.weekdayHolidays} pv</td>
                  <td>{row.workingDays6} pv</td>
                  <td>{row.hours75.toLocaleString("fi-FI")} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="workdays-year-after-answer" />

        <h2>Laske omat vuosityötunnit</h2>
        <p>
          Syötä päivittäinen säännöllinen työaikasi laskeaksesi vuoden {currentYear} kokonaistyötunnit:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <label htmlFor="wdy-hours-input">Päivittäinen työaika (tuntia / päivä)</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "6px" }}>
            <input
              id="wdy-hours-input"
              type="number"
              step="0.25"
              min="1"
              max="24"
              value={inputHoursPerDay}
              onChange={(e) => setInputHoursPerDay(Number(e.target.value) || 0)}
              style={{ maxWidth: "120px" }}
            />
            <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
              = {customTotalHours.toLocaleString("fi-FI")} työtuntia vuonna {currentYear}
            </span>
          </div>
          <p className="note-soft" style={{ marginTop: "8px" }}>
            Laskettu: {currentStats.workingDays5} työpäivää × {inputHoursPerDay} h = {customTotalHours.toLocaleString("fi-FI")} h.
          </p>
        </div>

        <h2>Mistä työpäivien määrä muodostuu?</h2>
        <p>
          Tavallinen kalenterivuosi muodostuu 365 päivästä (tai karkausvuonna 366 päivästä).
          Kun vuodesta vähennetään 52 viikonloppua (104 päivää), jäljelle jää 260 tai 261 arkipäivää.
        </p>
        <p>
          Suomessa vietetään vuosittain 13 virallista pyhäpäivää (kuten uudenvuodenpäivä, loppiainen,
          pitkäperjantai, toinen pääsiäispäivä, vappu, helatorstai, juhannusaatto, itsenäisyyspäivä, jouluaatto, joulupäivä ja tapaninpäivä).
          Näistä keskimäärin 8–10 osuu maanantain ja perjantain välille.
        </p>
        <blockquote>
          <strong>261 arkipäivää − 9 arkipyhää = 252 työpäivää</strong>
        </blockquote>

        <h2>5-päiväinen vs. 6-päiväinen työviikko</h2>
        <p>
          Suomen lainsäädännössä käytetään kahta eri arkipäivän määritelmää:
        </p>
        <ul>
          <li>
            <strong>5-päiväinen työpäivä (ma–pe):</strong> Käytetään yleisimmissä työehtosopimuksissa,
            kuukausipalkoissa ja toimistotyöajan seurannassa.
          </li>
          <li>
            <strong>6-päiväinen arkipäivä (ma–la):</strong> Käytetään <em>vuosilomalaissa</em> ja Kelan
            päivärahoissa (sairauspäiväraha, vanhempainpäiväraha). Lauantait kuluttavat vuosilomaa, ellei
            alan työehtosopimuksessa ole sovittu toisin.
          </li>
        </ul>

        <h2>Usein kysyttyä vuoden työpäivistä</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to={`/tyopaivat-${currentYear}`}>työpäivät {currentYear}</Link>,{" "}
          <Link to="/kuinka-monta-tyopaivaa-kuukaudessa">kuinka monta työpäivää kuukaudessa on</Link>,{" "}
          <Link to="/kuinka-monta-tyotuntia-vuodessa">kuinka monta työtuntia vuodessa on</Link> ja{" "}
          <Link to="/tuntilaskuri">tuntilaskuri</Link>.
        </p>
      </div>
    </section>
  );
}
