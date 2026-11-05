import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  vacationWeeksStats,
  vacationWeeksFaqs,
} from "../data/vacationSchoolContent.js";

const PATH = "/kuinka-monta-viikkoa-vuosiloma-on";

export default function VacationWeeks() {
  const meta = routeMeta[PATH];
  const stats = vacationWeeksStats();
  const faqs = vacationWeeksFaqs();

  const [monthsWorked, setMonthsWorked] = useState(12);
  const [tenureYears, setTenureYears] = useState("over1"); // "under1" or "over1"

  const ratePerMonth = tenureYears === "over1" ? 2.5 : 2.0;
  const accruedDays = Math.min(30, Math.round(Number(monthsWorked) * ratePerMonth));
  const fullWeeks = Math.floor(accruedDays / 6);
  const extraDays = accruedDays % 6;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Vuosiloman viikot
      </div>

      <h1>Kuinka monta viikkoa vuosiloma on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Täysi vuosiloma on tasan 5 viikkoa eli 30 arkipäivää, kun työsuhde on kestänyt vähintään yhden vuoden.
            Alle vuoden kestäneessä työsuhteessa lomaa kertyy 4 viikkoa (24 arkipäivää).
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Vuosiloman viikot pähkinänkuoressa</div>
          <ul>
            <li><strong>Täysi vuosiloma (työsuhde ≥ 1 v):</strong> {stats.fullLeaveWeeks} viikkoa ({stats.fullLeaveDays} arkipäivää, 2,5 pv/kk).</li>
            <li><strong>Uuden työntekijän loma (työsuhde &lt; 1 v):</strong> {stats.partialLeaveWeeks} viikkoa ({stats.partialLeaveDays} arkipäivää, 2,0 pv/kk).</li>
            <li><strong>Kesäloma:</strong> {stats.summerHolidayWeeks} viikkoa ({stats.summerHolidayDays} arkipäivää) annettava kesäkaudella 2.5.–30.9.</li>
            <li><strong>Talviloma:</strong> {stats.winterHolidayWeeks} viikko ({stats.winterHolidayDays} arkipäivää) annettava talvikaudella 1.10.–30.4.</li>
            <li><strong>Lauantaisääntö:</strong> Yksi lomaviikko kuluttaa aina 6 lomapäivää, koska lauantai lasketaan arkipäiväksi.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Laske kertyvät vuosilomaviikkosi</h2>
        <p>
          Valitse työsuhteesi kesto ja lomanmääräytymisvuonna (1.4.–31.3.) kertyneet täydet kuukaudet:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <div className="two-fields">
            <div>
              <label htmlFor="vw-tenure-select">Työsuhteen kesto 31.3. mennessä</label>
              <select
                id="vw-tenure-select"
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              >
                <option value="over1">Vähintään 1 vuosi (2,5 pv/kk)</option>
                <option value="under1">Alle 1 vuosi (2,0 pv/kk)</option>
              </select>
            </div>
            <div>
              <label htmlFor="vw-months-worked">Täydet työssäolokuukaudet (1–12)</label>
              <input
                id="vw-months-worked"
                type="number"
                min="1"
                max="12"
                value={monthsWorked}
                onChange={(e) => setMonthsWorked(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                style={{ marginTop: "6px", width: "100%", padding: "8px" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "14px", fontSize: "1.1rem", lineHeight: "1.7" }}>
            <div>Kertynyt vuosiloma: <strong>{accruedDays} arkipäivää</strong></div>
            <div>
              Vastaa loma-aikaa: <strong>{fullWeeks} täyttä viikkoa</strong>
              {extraDays > 0 ? ` ja ${extraDays} päivää` : ""}
            </div>
            <p className="note-soft" style={{ marginTop: "6px" }}>
              Kesälomaa: enintään {Math.min(24, accruedDays)} pv | Talvilomaa: {Math.max(0, accruedDays - 24)} pv.
            </p>
          </div>
        </div>

        <AdSlot placement="vacation-weeks-after-answer" />

        <h2>Miksi viiden viikon loma on 30 päivää eikä 25?</h2>
        <p>
          Moni 5-päiväistä työviikkoa (ma–pe) tekevä ihmettelee, miksi 5 viikon vuosilomaan tarvitaan 30 lomapäivää 25 päivän sijaan.
        </p>
        <p>
          Syy on Suomen <strong>vuosilomalaki</strong>, joka määrittelee arkipäiviksi kaikki päivät maanantaista lauantaihin
          (pois lukien viralliset kirkolliset pyhät ja juhlapäivät). Tämän vuoksi:
        </p>
        <blockquote>
          <strong>1 viikko vuosilomaa = 6 lomapäivää (ma–la)</strong><br />
          <strong>5 viikkoa vuosilomaa = 5 × 6 = 30 lomapäivää</strong>
        </blockquote>
        <p>
          Jos otat vapaaksi vain yksittäisiä päiviä (esim. maanantain tai perjantain), lauantaita ei automaattisesti kulu,
          mutta työnantajalla on lain mukaan oikeus sijoittaa lauantait lomajaksoihin niin, että jokaista viittä arkipäivää kohden
          kulutetaan yksi lauantai.
        </p>

        <h2>Lomanmääräytymisvuosi: 1.4.–31.3.</h2>
        <p>
          Vuosilomaa ei kerry kalenterivuoden vaan <em>lomanmääräytymisvuoden</em> mukaan, joka alkaa vuosittain
          1. huhtikuuta ja päättyy seuraavan vuoden 31. maaliskuuta.
        </p>
        <p>
          Tänä aikana kertyneet lomapäivät pidetään seuraavana kesänä ja talvena. Esimerkiksi ajalla 1.4.2025–31.3.2026
          ansaittu loma pidetään lomakautena 2026.
        </p>

        <h2>Arkipyhät vuosiloman aikana</h2>
        <p>
          Jos vuosilomajaksollesi osuu virallinen pyhäpäivä (kuten juhannusaatto, juhannuspäivä, helatorstai tai itsenäisyyspäivä),
          se ei ole lain mukainen lomapäivä. Kyseinen päivä siirtää loman päättymistä yhdellä päivällä eteenpäin,
          jolloin lomapäiväsi säästyy pidettäväksi myöhemmin.
        </p>

        <h2>Usein kysyttyä vuosilomasta</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös <Link to="/vuosilomalaskuri">vuosilomalaskuri</Link>,{" "}
          <Link to="/lomasuunnittelija">lomasuunnittelija</Link>,{" "}
          <Link to="/kuinka-monta-arkipaivaa-kuukaudessa">kuinka monta arkipäivää kuukaudessa on</Link> ja{" "}
          <Link to="/laskurit">kaikki laskurit</Link>.
        </p>
      </div>
    </section>
  );
}
