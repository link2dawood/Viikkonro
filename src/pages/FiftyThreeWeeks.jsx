import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import {
  isoYear,
  weeksInIsoYear,
  isLeapYear,
  WD,
} from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  fiftyThreeWeekYears,
  fiftyThreeWeeksFaqs,
} from "../data/fiftyThreeWeeksContent.js";

const PATH = "/miksi-vuodessa-on-53-viikkoa";

export default function FiftyThreeWeeks() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const currentWeeks = weeksInIsoYear(currentYear);
  const all53Years = fiftyThreeWeekYears(1990, 2060);
  const faqs = fiftyThreeWeeksFaqs(currentYear);

  const [testYear, setTestYear] = useState(currentYear);

  const testYearWeeks = weeksInIsoYear(testYear);
  const testYearLeap = isLeapYear(testYear);
  const testYearStartDay = WD[new Date(testYear, 0, 1).getDay()];

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / 53 viikkoa vuodessa
      </div>

      <h1>Miksi vuodessa on 53 viikkoa?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Vuodessa on 53 ISO-viikkoa aina silloin, kun tavallinen 365-päiväinen vuosi alkaa torstaina,
            tai kun karkausvuosi alkaa keskiviikkona tai torstaina. Muina vuosina viikkoja on 52.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">53 viikon sääntö pähkinänkuoressa</div>
          <ul>
            <li><strong>Tavallinen määrä:</strong> 52 viikkoa (364 päivää).</li>
            <li><strong>Miksi 53 viikkoa syntyy:</strong> vuodessa on 365 päivää (52 vkoa + 1 pv) tai karkausvuonna 366 päivää (52 vkoa + 2 pv). Nämä ylimääräiset päivät kasautuvat.</li>
            <li><strong>ISO 8601 -torstaisääntö:</strong> viikko 1 on aina se viikko, johon kuuluu vuoden ensimmäinen torstai.</li>
            <li><strong>Esiintymistiheys:</strong> 53-viikkoinen vuosi toistuu keskimäärin 5–6 vuoden välein (tarkalleen 71 kertaa 400 vuodessa).</li>
            <li><strong>Vuosi {currentYear}:</strong> {currentWeeks} viikkoa {currentWeeks === 53 ? "(53 viikon vuosi!)" : "(normaali 52 viikon vuosi)"}.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Tarkista minkä tahansa vuoden viikkomäärä</h2>
        <p>
          Kirjoita vuosiluku nähdäksesi, onko siinä 52 vai 53 viikkoa ja miksi:
        </p>

        <div className="panel lookup" style={{ marginTop: "16px", marginBottom: "20px" }}>
          <label htmlFor="year-53-checker">Vuosiluku</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px" }}>
            <input
              id="year-53-checker"
              type="number"
              min="1900"
              max="2100"
              value={testYear}
              onChange={(e) => setTestYear(Number(e.target.value) || currentYear)}
              style={{ maxWidth: "140px" }}
            />
            <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
              = {testYearWeeks} viikkoa {testYearWeeks === 53 ? "✓ (53 viikkoa)" : "(52 viikkoa)"}
            </span>
          </div>
          <p className="note-soft" style={{ marginTop: "8px" }}>
            Vuosi {testYear} alkaa päivänä <strong>{testYearStartDay}</strong> ja on{" "}
            <strong>{testYearLeap ? "karkausvuosi" : "tavallinen vuosi"}</strong>.{" "}
            {testYearWeeks === 53
              ? "Koska se täyttää torstaisäännön ehdot, vuodessa on 53 täyttä ISO-viikkoa."
              : "Koska se ei täytä 53 viikon ehtoja, vuoteen kuuluu normaalit 52 viikkoa."}
          </p>
        </div>

        <AdSlot placement="why-53-weeks-after-answer" />

        <h2>Kansainvälinen ISO 8601 -torstaisääntö</h2>
        <p>
          Suomessa ja useimmissa Euroopan maissa viikkonumerointi noudattaa virallista{" "}
          <strong>SFS-EN 28601 / ISO 8601</strong> -standardia. Sen mukaan:
        </p>
        <ol>
          <li>Viikko alkaa aina <strong>maanantaina</strong> ja päättyy <strong>sunnuntaina</strong>.</li>
          <li>Viikkoja ei koskaan katkaista kuukauden tai vuoden vaihtuessa, vaan ne ovat aina 7 päivän pituisia.</li>
          <li>
            <strong>Vuoden ensimmäinen viikko (viikko 1)</strong> on se viikko, johon kuuluu vuoden ensimmäinen torstai.
            Tämä vastaa sääntöä, että viikolla 1 on oltava vähintään neljä uuden vuoden päivää.
          </li>
        </ol>
        <p>
          Jos vuosi alkaa perjantaina, lauantaina tai sunnuntaina, uudenvuodenpäivät lasketaan edellisen vuoden
          viimeisen viikon (viikon 52 tai 53) osaksi, ja uusi viikko 1 alkaa vasta seuraavana maanantaina.
        </p>

        <h2>Matemaattinen syy: 365 päivää ei jakaudu tasan</h2>
        <p>
          Yhdessä täydessä viikossa on 7 päivää. 52 täyttä viikkoa on:
        </p>
        <blockquote>
          <strong>52 viikkoa × 7 päivää = 364 päivää</strong>
        </blockquote>
        <p>
          Tavallisessa vuodessa on 365 päivää, eli <strong>yksi ylimääräinen päivä</strong>.
          Karkausvuodessa päiviä on 366 eli <strong>kaksi ylimääräistä päivää</strong>.
        </p>
        <p>
          Nämä ylimääräiset päivät siirtävät viikonpäiviä eteenpäin yhdellä tai kahdella päivällä joka vuosi.
          Noin joka viides tai kuudes vuosi nämä kertyneet päivät muodostavat kokonaisen 53. viikon ISO-kalenteriin.
        </p>

        <h2>Kaikki 53 viikon vuodet (1990–2060)</h2>
        <p>
          Alla olevasta taulukosta näet kaikki vuodet, joissa on 53 viikkoa vuosien 1990 ja 2060 välillä:
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vuosi</th>
                <th>Vuoden 1. päivä</th>
                <th>Karkausvuosi</th>
                <th>Syy viikolle 53</th>
              </tr>
            </thead>
            <tbody>
              {all53Years.map((row) => (
                <tr key={row.year} className={row.year === currentYear ? "highlight" : ""}>
                  <td>
                    {row.year >= 2020 && row.year <= 2035 ? (
                      <Link to={`/vuosi-${row.year}`}>
                        <strong>{row.year}</strong>
                      </Link>
                    ) : (
                      <strong>{row.year}</strong>
                    )}
                    {row.year === currentYear ? " (nykyinen vuosi)" : ""}
                  </td>
                  <td>{row.startsOn}</td>
                  <td>{row.leap ? "Kyllä" : "Ei"}</td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Miten viikko 53 vaikuttaa palkanlaskentaan ja budjetointiin?</h2>
        <p>
          53 viikon vuosi on merkittävä ilmiö taloushallinnossa ja palkanlaskennassa:
        </p>
        <ul>
          <li>
            <strong>Tunti- ja viikkopalkat:</strong> Jos yritys maksaa palkan kerran viikossa tai kahden viikon välein,
            53 viikon vuodessa kalenteriin mahtuu usein 53 viikkopalkkaa tai 27 kahden viikon palkkakautta tavanomaisen 26 sijaan.
          </li>
          <li>
            <strong>Kuukausipalkat:</strong> Kuukausipalkkaisiin viikko 53 ei suoraan vaikuta, koska kuukausipalkka
            maksetaan 12 kertaa vuodessa riippumatta viikkojen määrästä.
          </li>
          <li>
            <strong>Yritysten tilikaudet:</strong> 52/53 viikon tilikautta (4-4-5- tai 13-jaksoinen malli) käyttävät
            vähittäiskaupat lisäävät ylimääräisen viikon 53 raportointiinsa kyseisinä vuosina.
          </li>
        </ul>

        <h2>Usein kysyttyä 53 viikon vuosista</h2>
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
          <Link to="/kuinka-monta-viikkoa-kuukaudessa">kuinka monta viikkoa kuukaudessa on</Link>,{" "}
          <Link to={`/vuosi-${currentYear}`}>viikkonumerot {currentYear}</Link> ja{" "}
          <Link to="/laskurit">kaikki laskurit</Link>.
        </p>
      </div>
    </section>
  );
}
