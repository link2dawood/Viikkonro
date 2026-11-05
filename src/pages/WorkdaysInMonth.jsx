import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear, M_SLUG } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  allMonthsWorkdayRows,
  workdaysInMonthFaqs,
} from "../data/laborHoursContent.js";

const PATH = "/kuinka-monta-tyopaivaa-kuukaudessa";

export default function WorkdaysInMonth() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const rows = allMonthsWorkdayRows(currentYear);
  const faqs = workdaysInMonthFaqs(currentYear);

  const [selectedMonth, setSelectedMonth] = useState(1);
  const [hourlyWage, setHourlyWage] = useState(20);

  const activeRow = rows[selectedMonth - 1] || rows[0];
  const monthlySalaryEstimate = Math.round(activeRow.hours75 * Number(hourlyWage));

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Työpäivät kuukaudessa
      </div>

      <h1>Kuinka monta työpäivää kuukaudessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Kuukaudessa on keskimäärin tasan 21 työpäivää (252 työpäivää / 12 kuukautta).
            Todellinen työpäivien määrä vaihtelee kuukausittain 19 ja 23 päivän välillä.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Kuukauden työpäivät pähkinänkuoressa</div>
          <ul>
            <li><strong>Keskiarvo:</strong> 21,0 työpäivää kuukaudessa (5 pv/vko).</li>
            <li><strong>Vaihteluväli:</strong> 19–23 työpäivää kuukaudesta riippuen.</li>
            <li><strong>Vähiten työpäiviä:</strong> usein helmikuussa (19–20 pv) sekä touko- ja joulukuussa arkipyhien vuoksi.</li>
            <li><strong>Eniten työpäiviä:</strong> 31-päiväisissä kuukausissa ilman arkipyhiä (kuten maalis-, heinä- ja lokakuu, 22–23 pv).</li>
            <li><strong>Työtunnit keskimäärin (7,5 h/pv):</strong> 157,5 tuntia kuukaudessa.</li>
            <li><strong>Työtunnit keskimäärin (8,0 h/pv):</strong> 168,0 tuntia kuukaudessa.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Kuukausikohtaiset työpäivät vuonna {currentYear}</h2>
        <p>
          Alla olevasta taulukosta näet jokaisen kuukauden työpäivät, viikonloput ja arkipyhät vuonna {currentYear}:
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kuukausi</th>
                <th>Päiviä</th>
                <th>Työpäivät (ma–pe)</th>
                <th>Arkipyhät</th>
                <th>Viikonloppupäivät</th>
                <th>Työtunnit (7,5 h)</th>
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
                  <td>{row.daysInMonth}</td>
                  <td><strong>{row.workingDays5} pv</strong></td>
                  <td>{row.weekdayHolidays} pv</td>
                  <td>{row.weekendDays} pv</td>
                  <td>{row.hours75.toLocaleString("fi-FI")} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="workdays-month-after-answer" />

        <h2>Laske valitun kuukauden työtunnit ja palkka</h2>
        <p>
          Valitse kuukausi ja syötä tuntipalkkasi nähdäksesi kyseisen kuukauden työtunnit ja bruttoansion:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <div className="two-fields">
            <div>
              <label htmlFor="wdm-select-month">Valitse kuukausi</label>
              <select
                id="wdm-select-month"
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
              <label htmlFor="wdm-hourly-wage">Tuntipalkka (€ / tunti)</label>
              <input
                id="wdm-hourly-wage"
                type="number"
                min="0"
                step="0.5"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(Number(e.target.value) || 0)}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              />
            </div>
          </div>
          <p className="note-soft" style={{ marginTop: "12px", fontSize: "1.05rem" }}>
            <strong>{activeRow.monthName} {currentYear}:</strong> {activeRow.workingDays5} työpäivää × 7,5 h ={" "}
            <strong>{activeRow.hours75} työtuntia</strong>. Bruttopalkka:{" "}
            <strong>{monthlySalaryEstimate.toLocaleString("fi-FI")} €</strong>.
          </p>
        </div>

        <h2>Miksi työpäivien määrä vaihtelee kuukausittain?</h2>
        <p>
          Työpäivien määrään kuukaudessa vaikuttavat kolme tekijää:
        </p>
        <ol>
          <li><strong>Kuukauden kalenteripituus:</strong> Helmikuussa on vain 28 tai 29 päivää, kun taas useimmissa muissa kuukausissa on 30 tai 31 päivää.</li>
          <li><strong>Viikonloppujen määrä:</strong> Kuukauteen voi mahtua 4 tai 5 viikonloppua (8–10 viikonloppupäivää).</li>
          <li><strong>Arkipyhät:</strong> Suomen viralliset arkipyhät (kuten vappu, helatorstai, itsenäisyyspäivä tai joulu) vähentävät kyseisen kuukauden työpäiviä aina silloin, kun ne osuvat maanantain ja perjantain välille.</li>
        </ol>

        <h2>Vaikutus kuukausipalkkaan ja palkanlaskentaan</h2>
        <p>
          Kuukausipalkkaiselle työntekijälle maksetaan sama kiinteä kuukausipalkka joka kuukausi riippumatta siitä,
          onko kuukaudessa 19 työpäivää (kuten helmikuussa) vai 23 työpäivää (kuten maaliskuussa).
        </p>
        <p>
          Tuntipalkkaisilla työntekijöillä sekä työaikasaldoja seuraavilla asiantuntijoilla kuukausittainen työaikavelvoite
          kuitenkin vaihtelee suoraan kyseisen kuukauden työpäivien mukaan.
        </p>

        <h2>Usein kysyttyä kuukauden työpäivistä</h2>
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
          <Link to="/kuinka-monta-tyotuntia-kuukaudessa">kuinka monta työtuntia kuukaudessa on</Link>,{" "}
          <Link to={`/kalenteri-${currentYear}`}>kalenteri {currentYear}</Link> ja{" "}
          <Link to="/tuntilaskuri">tuntilaskuri</Link>.
        </p>
      </div>
    </section>
  );
}
