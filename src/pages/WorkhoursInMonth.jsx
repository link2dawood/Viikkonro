import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear, M_SLUG } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  allMonthsWorkdayRows,
  workhoursInMonthFaqs,
} from "../data/laborHoursContent.js";

const PATH = "/kuinka-monta-tyotuntia-kuukaudessa";

export default function WorkhoursInMonth() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const rows = allMonthsWorkdayRows(currentYear);
  const faqs = workhoursInMonthFaqs(currentYear);

  const [selectedMonth, setSelectedMonth] = useState(1);
  const [dailyHours, setDailyHours] = useState(7.5);

  const activeRow = rows[selectedMonth - 1] || rows[0];
  const calculatedHours = Math.round(activeRow.workingDays5 * Number(dailyHours) * 10) / 10;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Työtunnit kuukaudessa
      </div>

      <h1>Kuinka monta työtuntia kuukaudessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Kuukaudessa on keskimäärin noin 157,5 työtuntia 7,5 tunnin työpäivällä (37,5 h/vko)
            tai noin 168 työtuntia 8,0 tunnin työpäivällä (40 h/vko).
            Työtuntien määrä vaihtelee kuukausittain 142,5 ja 184 tunnin välillä.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Kuukauden työtunnit pähkinänkuoressa</div>
          <ul>
            <li><strong>Keskimäärin (7,5 h/pv):</strong> 157,5 tuntia kuukaudessa (21 työpäivää).</li>
            <li><strong>Keskimäärin (8,0 h/pv):</strong> 168,0 tuntia kuukaudessa (21 työpäivää).</li>
            <li><strong>Vaihteluväli (7,5 h/pv):</strong> 142,5–172,5 tuntia (19–23 työpäivää).</li>
            <li><strong>Vaihteluväli (8,0 h/pv):</strong> 152,0–184,0 tuntia (19–23 työpäivää).</li>
            <li><strong>Palkanlaskennan jakajat (TES):</strong> yleisimmin 157, 158 tai 160 kuukausipalkan muuntamiseksi tuntipalkaksi.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Kuukausikohtaiset työtunnit vuonna {currentYear}</h2>
        <p>
          Alla olevasta taulukosta näet jokaisen kuukauden työpäivät ja työtunnit eri työajoilla vuonna {currentYear}:
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kuukausi</th>
                <th>Työpäivät</th>
                <th>Tunnit (7,5 h/pv)</th>
                <th>Tunnit (8,0 h/pv)</th>
                <th>Tunnit (7,0 h/pv)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <td>
                    <Link to={`/tyopaivat-${M_SLUG[row.month - 1]}-${currentYear}`}>
                      <strong>{row.monthName}</strong>
                    </Link>
                  </td>
                  <td>{row.workingDays5} pv</td>
                  <td><strong>{row.hours75.toLocaleString("fi-FI")} h</strong></td>
                  <td>{row.hours80.toLocaleString("fi-FI")} h</td>
                  <td>{(row.workingDays5 * 7).toLocaleString("fi-FI")} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="workhours-month-after-answer" />

        <h2>Laske valitun kuukauden työtunnit</h2>
        <p>
          Valitse kuukausi ja syötä päivittäinen työaikasi:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <div className="two-fields">
            <div>
              <label htmlFor="whm-select-month">Valitse kuukausi</label>
              <select
                id="whm-select-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              >
                {rows.map((r) => (
                  <option key={r.month} value={r.month}>
                    {r.monthName} ({r.workingDays5} työpäivää)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="whm-daily-hours">Päivittäinen työaika (h)</label>
              <input
                id="whm-daily-hours"
                type="number"
                step="0.25"
                min="1"
                max="24"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value) || 0)}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              />
            </div>
          </div>
          <p className="note-soft" style={{ marginTop: "12px", fontSize: "1.05rem" }}>
            <strong>{activeRow.monthName} {currentYear}:</strong> {activeRow.workingDays5} työpäivää × {dailyHours} h ={" "}
            <strong>{calculatedHours.toLocaleString("fi-FI")} työtuntia</strong>.
          </p>
        </div>

        <h2>Miten kuukausipalkka muunnetaan tuntipalkaksi?</h2>
        <p>
          Koska kuukausien työpäivien ja työtuntien määrä vaihtelee, palkanlaskennassa tuntipalkkaa ei lasketa
          yksittäisen kuukauden todellisten tuntien mukaan. Sen sijaan työehtosopimuksissa (TES) on määritelty
          kiinteä <strong>kuukausipalkan jakaja</strong>:
        </p>
        <ul>
          <li><strong>Jakaja 158:</strong> Yleinen toimisto- ja asiantuntija-aloilla (37,5 h/viikko).</li>
          <li><strong>Jakaja 157 tai 157,5:</strong> KVTES toimistotyöajassa.</li>
          <li><strong>Jakaja 160 tai 173:</strong> Teollisuudessa ja 40 tunnin työviikoissa (173 vastaa $40 \times 4,33$).</li>
        </ul>
        <p>
          Esimerkki: Työntekijän kuukausipalkka on 3 200 euroa ja alan TES-jakaja on 158. Tuntipalkka saadaan jakamalla:
        </p>
        <blockquote>
          <strong>3 200 € / 158 = 20,25 € / tunti</strong>
        </blockquote>

        <h2>Usein kysyttyä kuukauden työtunneista</h2>
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
          <Link to="/kuinka-monta-tyopaivaa-kuukaudessa">kuinka monta työpäivää kuukaudessa on</Link>,{" "}
          <Link to="/tuntilaskuri">tuntilaskuri</Link> ja{" "}
          <Link to="/laskurit">kaikki laskurit</Link>.
        </p>
      </div>
    </section>
  );
}
