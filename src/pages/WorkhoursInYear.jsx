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
  workhoursInYearFaqs,
} from "../data/laborHoursContent.js";

const PATH = "/kuinka-monta-tyotuntia-vuodessa";

export default function WorkhoursInYear() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const stats = yearWorkdayStats(currentYear);
  const rows = yearComparisonWorkdayRows(currentYear - 1, currentYear + 5);
  const faqs = workhoursInYearFaqs(currentYear);

  const [hoursPerDay, setHoursPerDay] = useState(7.5);
  const [vacationWeeks, setVacationWeeks] = useState(5);

  const grossHours = Math.round(stats.workingDays5 * Number(hoursPerDay) * 10) / 10;
  const vacationDays = Number(vacationWeeks) * 5;
  const vacationHours = Math.round(vacationDays * Number(hoursPerDay) * 10) / 10;
  const netHours = Math.max(0, Math.round((grossHours - vacationHours) * 10) / 10);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Työtunnit vuodessa
      </div>

      <h1>Kuinka monta työtuntia vuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Vuodessa on keskimäärin noin 1 890 työtuntia 7,5 tunnin työpäivällä (37,5 h/vko)
            tai noin 2 016–2 032 työtuntia 8,0 tunnin työpäivällä (40 h/vko).
            Vuonna {currentYear} työtunteja on tasan {stats.hours75.toLocaleString("fi-FI")} h (7,5 h/pv).
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Vuosityötunnit eri työajoilla ({currentYear})</div>
          <ul>
            <li><strong>7,5 h / päivä (37,5 h/vko, toimisto/asiantuntija):</strong> {stats.hours75.toLocaleString("fi-FI")} tuntia.</li>
            <li><strong>8,0 h / päivä (40,0 h/vko, teollisuus/rakennus):</strong> {stats.hours80.toLocaleString("fi-FI")} tuntia.</li>
            <li><strong>7,6 h / päivä (38,0 h/vko, yleinen TES):</strong> {stats.hours76.toLocaleString("fi-FI")} tuntia.</li>
            <li><strong>Työpäivien määrä vuonna {currentYear}:</strong> {stats.workingDays5} työpäivää.</li>
            <li><strong>Vuosiloman vaikutus:</strong> 5 viikon loma (25 työpäivää) vähentää vuosityöaikaa noin 187,5 tuntia.</li>
            <li><strong>Todellinen tehty vuosityöaika loman jälkeen:</strong> noin 1 700–1 820 tuntia.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Työtuntien vertailu eri vuosina (2025–2031)</h2>
        <p>
          Vuosityötuntien määrä vaihtelee vuosittain arkipyhien sijoittumisen mukaan:
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vuosi</th>
                <th>Työpäivät</th>
                <th>Tunnit (7,5 h/pv)</th>
                <th>Tunnit (8,0 h/pv)</th>
                <th>Tunnit loman jälkeen (7,5 h, 5 vk)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const net = Math.round((r.hours75 - 25 * 7.5) * 10) / 10;
                return (
                  <tr key={r.year} className={r.year === currentYear ? "highlight" : ""}>
                    <td>
                      <Link to={`/tyopaivat-${r.year}`}>
                        <strong>{r.year}</strong>
                      </Link>
                      {r.year === currentYear ? " (nykyinen)" : ""}
                    </td>
                    <td>{r.workingDays5} pv</td>
                    <td><strong>{r.hours75.toLocaleString("fi-FI")} h</strong></td>
                    <td>{r.hours80.toLocaleString("fi-FI")} h</td>
                    <td>{net.toLocaleString("fi-FI")} h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AdSlot placement="workhours-year-after-answer" />

        <h2>Laske omat vuosityötunnit loman kanssa</h2>
        <p>
          Syötä päivittäinen työaikasi ja vuosilomasi viikkomäärä laskeaksesi todelliset työtunnit:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <div className="two-fields">
            <div>
              <label htmlFor="why-daily-hours">Päivittäinen työaika (h)</label>
              <input
                id="why-daily-hours"
                type="number"
                step="0.25"
                min="1"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value) || 0)}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label htmlFor="why-vacation-weeks">Vuosiloma (viikkoa)</label>
              <input
                id="why-vacation-weeks"
                type="number"
                min="0"
                max="12"
                value={vacationWeeks}
                onChange={(e) => setVacationWeeks(Number(e.target.value) || 0)}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              />
            </div>
          </div>
          <div style={{ marginTop: "14px", lineHeight: "1.6" }}>
            <div>Bruttotyötunnit ({stats.workingDays5} pv × {hoursPerDay} h): <strong>{grossHours.toLocaleString("fi-FI")} h</strong></div>
            <div>Loman vähennys ({vacationWeeks} vk = {vacationDays} pv): <strong>−{vacationHours.toLocaleString("fi-FI")} h</strong></div>
            <div style={{ fontSize: "1.15rem", fontWeight: "bold", marginTop: "6px" }}>
              Nettotyötunnit vuonna {currentYear}: {netHours.toLocaleString("fi-FI")} tuntia
            </div>
          </div>
        </div>

        <h2>Miten vuosityöaika määritellään työehtosopimuksissa?</h2>
        <p>
          Suomessa työaikalaki asettaa säännöllisen työajan enimmäismääräksi 8 tuntia vuorokaudessa ja 40 tuntia viikossa.
          Useimmissa työehtosopimuksissa (TES) on kuitenkin sovittu lyhyemmästä työajasta:
        </p>
        <ul>
          <li><strong>Toimisto- ja asiantuntijatyö:</strong> yleensä 7 tuntia 30 minuuttia päivässä (37,5 h/vko).</li>
          <li><strong>Kuntasektori (KVTES):</strong> toimistotyö 36 tuntia 15 minuuttia viikossa; yleistyöaika 38 tuntia 15 minuuttia viikossa.</li>
          <li><strong>Teollisuus ja rakennus:</strong> tyypillisesti 8 tuntia päivässä (40 h/vko), jolloin työaikaa usein lyhennetään erillisillä <em>pekkaspäivillä</em> (työajanlyhennysvapaat).</li>
        </ul>

        <h2>Usein kysyttyä vuosityötunneista</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/kuinka-monta-tyotuntia-kuukaudessa">kuinka monta työtuntia kuukaudessa on</Link>,{" "}
          <Link to="/kuinka-monta-tyopaivaa-vuodessa">kuinka monta työpäivää vuodessa on</Link>,{" "}
          <Link to="/tuntilaskuri">tuntilaskuri</Link> ja{" "}
          <Link to="/vuosilomalaskuri">vuosilomalaskuri</Link>.
        </p>
      </div>
    </section>
  );
}
