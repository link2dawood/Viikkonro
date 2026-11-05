import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear, M_SLUG } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  allMonthsWeekdayRows,
  weekdaysInMonthFaqs,
} from "../data/vacationSchoolContent.js";

const PATH = "/kuinka-monta-arkipaivaa-kuukaudessa";

export default function WeekdaysInMonth() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const rows = allMonthsWeekdayRows(currentYear);
  const faqs = weekdaysInMonthFaqs();

  const [selectedMonth, setSelectedMonth] = useState(1);
  const activeRow = rows[selectedMonth - 1] || rows[0];

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Arkipäivät kuukaudessa
      </div>

      <h1>Kuinka monta arkipäivää kuukaudessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Kuukaudessa on keskimäärin noin 25 arkipäivää 6-päiväisessä laskennassa (maanantai–lauantai ilman arkipyhiä),
            jota sovelletaan Kelan päivärahoissa ja vuosilomalaissa.
            Toimistotyön 5-päiväisessä viikossa (maanantai–perjantai) työpäiviä on keskimäärin 21 päivää.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Arkipäivät vs. työpäivät pähkinänkuoressa</div>
          <ul>
            <li><strong>Lainmukainen arkipäivä (6 pv/vko):</strong> maanantai–lauantai ilman virallisia arkipyhiä (keskimäärin 25 pv/kk, vaihtelu 23–26 pv).</li>
            <li><strong>Työpäivä (5 pv/vko):</strong> maanantai–perjantai ilman arkipyhiä (keskimäärin 21 pv/kk, vaihtelu 19–23 pv).</li>
            <li><strong>Kelan etuudet:</strong> sairauspäiväraha ja vanhempainpäivärahat maksetaan 6 arkipäivältä viikossa (lauantait mukaan luettuina).</li>
            <li><strong>Vuosilomalaki:</strong> lomaa kuluu 6 päivää viikossa (lauantai kuluttaa lomapäivän).</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Kuukausien arkipäivien vertailu vuonna {currentYear}</h2>
        <p>
          Alla olevasta taulukosta näet jokaisen kuukauden viralliset arkipäivät (ma–la) ja 5-päiväisen viikon työpäivät (ma–pe):
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kuukausi</th>
                <th>Päiviä</th>
                <th>Arkipäivät (ma–la, Kela/loma)</th>
                <th>Työpäivät (ma–pe)</th>
                <th>Lauantait</th>
                <th>Arkipyhät</th>
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
                  <td><strong>{row.arkipaivat6} pv</strong></td>
                  <td>{row.tyopaivat5} pv</td>
                  <td>{row.lauantait} pv</td>
                  <td>{row.arkipyhat} pv</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="weekdays-month-after-answer" />

        <h2>Tarkastele valitun kuukauden päiviä</h2>
        <p>
          Valitse kuukausi nähdäksesi tarkan erittelyn Kelan arkipäivistä ja työpäivistä:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <label htmlFor="wim-month-selector">Valitse kuukausi</label>
          <select
            id="wim-month-selector"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ marginTop: "6px", width: "100%", padding: "8px", maxWidth: "260px" }}
          >
            {rows.map((r) => (
              <option key={r.month} value={r.month}>
                {r.monthName} ({r.arkipaivat6} arkipäivää)
              </option>
            ))}
          </select>

          <div style={{ marginTop: "12px", lineHeight: "1.7" }}>
            <div>Kuukauden päiviä yhteensä: <strong>{activeRow.daysInMonth} pv</strong></div>
            <div>Kelan ja vuosilomalain arkipäivät (ma–la): <strong>{activeRow.arkipaivat6} arkipäivää</strong></div>
            <div>Työpäivät (ma–pe): <strong>{activeRow.tyopaivat5} työpäivää</strong></div>
            <div>Lauantait (arkipäiviä): <strong>{activeRow.lauantait} pv</strong> | Sunnuntait (pyhiä): <strong>{activeRow.sunnuntait} pv</strong></div>
            {activeRow.arkipyhat > 0 && (
              <div style={{ color: "var(--color-primary, #0ea5e9)" }}>
                Arkipyhiä kuukaudessa: <strong>{activeRow.arkipyhat} pv</strong> (vähentävät arkipäiviä)
              </div>
            )}
          </div>
        </div>

        <h2>Miksi lauantai on Suomen laissa arkipäivä?</h2>
        <p>
          Suomessa siirryttiin 5-päiväiseen työviikkoon 1960-luvun lopulla, mutta lainsäädäntö perustuu edelleen
          historialliseen 6-päiväiseen arkipäiväkäsitykseen.
        </p>
        <p>
          Tästä syystä lauantai on virallisesti arkipäivä kahdessa keskeisessä yhteydessä:
        </p>
        <ol>
          <li>
            <strong>Vuosilomalaki:</strong> Vuosilomaa kertyy ja kuluu 6 päivää viikossa. Yhden viikon loma
            kuluttaa 6 lomapäivää, koska lauantai lasketaan lomapäiväksi.
          </li>
          <li>
            <strong>Kelan päivärahat:</strong> Sairauspäivärahaa, vanhempainpäivärahaa ja kuntoutusrahaa
            maksetaan myös lauantailta, yhteensä 6 päivältä viikossa.
          </li>
        </ol>

        <h2>Usein kysyttyä kuukauden arkipäivistä</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/kuinka-monta-tyopaivaa-kuukaudessa">kuinka monta työpäivää kuukaudessa on</Link>,{" "}
          <Link to="/kuinka-monta-viikkoa-vuosiloma-on">kuinka monta viikkoa vuosiloma on</Link>,{" "}
          <Link to="/vuosilomalaskuri">vuosilomalaskuri</Link> ja{" "}
          <Link to={`/kalenteri-${currentYear}`}>kalenteri {currentYear}</Link>.
        </p>
      </div>
    </section>
  );
}
