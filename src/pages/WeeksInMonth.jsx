import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  allMonthsWeekRows,
  weeksInMonthFaqs,
} from "../data/weeksInMonthContent.js";

const PATH = "/kuinka-monta-viikkoa-kuukaudessa";

export default function WeeksInMonth() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const rows = allMonthsWeekRows(currentYear);
  const faqs = weeksInMonthFaqs(currentYear);

  const [inputWeeks, setInputWeeks] = useState(4);
  const [inputMonths, setInputMonths] = useState(1);

  const calculatedMonths = (Number(inputWeeks) / 4.333).toFixed(1);
  const calculatedWeeks = (Number(inputMonths) * 4.333).toFixed(1);

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikkoja kuukaudessa
      </div>

      <h1>Kuinka monta viikkoa kuukaudessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Kuukaudessa on keskimäärin noin 4,33 viikkoa (4 viikkoa ja 2–3 päivää).
            Vain helmikuussa tavallisena vuonna on tasan 4 viikkoa (28 päivää).
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Viikkoja kuukaudessa lyhyesti</div>
          <ul>
            <li><strong>Keskimäärin:</strong> 4,33 viikkoa ($52 \div 12 \approx 4,333$).</li>
            <li><strong>Helmikuu (tavallinen vuosi):</strong> tasan 4 viikkoa (28 päivää).</li>
            <li><strong>Helmikuu (karkausvuosi):</strong> 4 viikkoa ja 1 päivä (29 päivää).</li>
            <li><strong>30 päivän kuukaudet:</strong> 4 viikkoa ja 2 päivää (4,29 viikkoa).</li>
            <li><strong>31 päivän kuukaudet:</strong> 4 viikkoa ja 3 päivää (4,43 viikkoa).</li>
            <li><strong>Palkka- ja budjettilaskenta:</strong> kuukausipalkka muunnetaan viikkopalkaksi jakamalla se luvulla 4,33.</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Kuukausien viikot vuonna {currentYear}</h2>
        <p>
          Kalenterikuukauden pituus vaihtelee 28 ja 31 päivän välillä. Alla olevasta taulukosta näet
          jokaisen kuukauden tarkan viikkomäärän ja päivien määrän vuonna {currentYear}.
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kuukausi</th>
                <th>Päiviä</th>
                <th>Tarkka viikkomäärä</th>
                <th>Viikkoina desimaalina</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.monthNumber}>
                  <td>
                    <Link to={`/kuukausi-${row.monthNumber}-${currentYear}`}>{row.name}</Link>
                  </td>
                  <td>{row.days}</td>
                  <td><strong>{row.summaryText}</strong></td>
                  <td>{row.decimalWeeks} vkoa</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="weeks-in-month-after-answer" />

        <h2>Muunna viikot ja kuukaudet</h2>
        <p>
          Kuukausi- ja viikkomäärien suoraan arviointiin käytetään keskimääräistä kerrointa <strong>4,33</strong>.
        </p>

        <div className="panel lookup" style={{ marginTop: "16px", marginBottom: "20px" }}>
          <div className="two-fields">
            <div>
              <label htmlFor="wim-calc-weeks">Viikot kuukausiksi</label>
              <input
                id="wim-calc-weeks"
                type="number"
                min="1"
                max="520"
                value={inputWeeks}
                onChange={(e) => setInputWeeks(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="note-soft" style={{ marginTop: "6px" }}>
                {inputWeeks} viikkoa = <strong>{calculatedMonths} kuukautta</strong>
              </p>
            </div>
            <div>
              <label htmlFor="wim-calc-months">Kuukaudet viikoiksi</label>
              <input
                id="wim-calc-months"
                type="number"
                min="1"
                max="120"
                value={inputMonths}
                onChange={(e) => setInputMonths(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="note-soft" style={{ marginTop: "6px" }}>
                {inputMonths} kk = <strong>{calculatedWeeks} viikkoa</strong>
              </p>
            </div>
          </div>
        </div>

        <h2>Miksi kuukaudessa ei ole tasan neljää viikkoa?</h2>
        <p>
          Neljä viikkoa on tasan $4 \times 7 = 28$ päivää. Kalenterivuodessa on kuitenkin 365 päivää
          (tai karkausvuonna 366 päivää). Jos kaikki 12 kuukautta olisivat 28 päivän pituisia, vuoteen mahtuisi
          vain 336 päivää, jolloin 29 päivää jäisi kalenterin ulkopuolelle.
        </p>
        <p>
          Tästä syystä gregoriaanisessa kalenterissa 11 kuukautta on pidennetty 30 tai 31 päivän pituisiksi.
          Vain helmikuussa on normaalina vuonna 28 päivää eli tasan neljä viikkoa.
        </p>

        <h2>Kuukausipalkan ja viikkopalkan suhde</h2>
        <p>
          Palkka- ja vuokralaskelmissa kuukautta ei pidä kertoa tai jakaa neljällä, sillä vuodessa on
          52 viikkoa mutta vain 12 kuukautta. Oikea keskiarvo saadaan kaavalla:
        </p>
        <blockquote>
          <strong>52 viikkoa / 12 kuukautta = 4,333 viikkoa kuukaudessa</strong>
        </blockquote>
        <p>
          Esimerkiksi 3 000 euron kuukausipalkka vastaa noin 692,84 euron viikkopalkkaa ($3\ 000\ € \div 4,333$),
          ei 750 euroa ($3\ 000\ € \div 4$).
        </p>

        <h2>Raskausviikot ja kuukaudet</h2>
        <p>
          Terveydenhuollossa raskauden kesto lasketaan viikoissa (täysiaikainen raskaus on 40 viikkoa eli 280 päivää).
          Kun 40 viikkoa jaetaan kuukauden keskimääräisellä pituudella 4,33, tulokseksi saadaan noin <strong>9 kuukautta ja yksi viikko</strong>.
          Voit seurata raskausviikkoja tarkemmin <Link to="/raskauslaskuri">raskauslaskurilla</Link>.
        </p>

        <h2>Usein kysyttyä viikoista kuukaudessa</h2>
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
          <Link to={`/kalenteri-${currentYear}`}>kalenteri {currentYear}</Link>,{" "}
          <Link to="/paivamaara-viikoksi">päivämäärästä viikoksi</Link> ja{" "}
          <Link to="/laskurit">kaikki laskurit</Link>.
        </p>
      </div>
    </section>
  );
}
