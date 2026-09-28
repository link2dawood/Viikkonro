import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi, WD_ESSIVE } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import {
  CALCULATOR_PATH,
  DATE_CALCULATOR_STEPS,
  OFFSETS,
  UNITS,
  calculate,
  dateCalculatorFaqs,
  offsetPath,
} from "../data/dateCalculator";

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parse(str) {
  const p = (str || "").split("-").map(Number);
  if (p.length !== 3 || p.some(Number.isNaN)) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;

// Worked examples, computed by the same calculate() the tool uses, on fixed
// dates so the text never depends on the build day.
const EXAMPLES = [
  {
    text: "31.1.2027 + 1 kuukausi",
    r: calculate(new Date(2027, 0, 31), 1, "kuukautta"),
    note: "Helmikuussa ei ole 31. päivää, joten tulos on kuun viimeinen päivä.",
  },
  {
    text: "22.12.2026 + 5 arkipäivää",
    r: calculate(new Date(2026, 11, 22), 5, "arkipaivaa"),
    note: "Jouluaatto lasketaan arkipäiväksi, mutta joulupäivä, tapaninpäivä ja viikonloppu ohitetaan.",
  },
  {
    text: "1.3.2027 - 90 päivää",
    r: calculate(new Date(2027, 2, 1), 90, "paivaa", -1),
    note: "Taaksepäin laskiessa aloituspäivä on edelleen päivä nolla.",
  },
];

// Date calculator (/paivamaaralaskuri): add or subtract days, weeks, months or
// working days. The default start is useToday(), so the prerendered HTML and
// the first client render agree (see useToday.js).
const DateCalculator = () => {
  const today = useToday();
  const [start, setStart] = useState(() => toInput(today));
  const [amount, setAmount] = useState("30");
  const [unit, setUnit] = useState("paivaa");
  const [direction, setDirection] = useState(1);
  const r = calculate(parse(start), amount, unit, direction);
  const faqs = dateCalculatorFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[CALCULATOR_PATH]} canonical={canonicalFor(CALCULATOR_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Päivämäärälaskuri
      </div>
      <h1>Päivämäärälaskuri</h1>
      <p className="lead">
        <span className="answer-sentence">
          Laske, mikä päivämäärä on tietyn määrän päiviä, viikkoja, kuukausia tai
          arkipäiviä eteen- tai taaksepäin mistä tahansa päivästä.
        </span>
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="dc-start">Aloituspäivä</label>
            <input type="date" id="dc-start" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="dc-amount">Määrä</label>
            <input
              type="number"
              id="dc-amount"
              min="0"
              max="10000"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="two-fields">
          <div>
            <label htmlFor="dc-unit">Yksikkö</label>
            <select id="dc-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {Object.entries(UNITS).map(([key, u]) => (
                <option key={key} value={key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dc-dir">Suunta</label>
            <select id="dc-dir" value={direction} onChange={(e) => setDirection(Number(e.target.value))}>
              <option value={1}>eteenpäin</option>
              <option value={-1}>taaksepäin</option>
            </select>
          </div>
        </div>
        {r && (
          <div className="result" aria-live="polite">
            <div className="main-text">
              Tulos: <span className="num">{fmtFullFi(r.result)}</span>
            </div>
            <div className="sub">
              {r.weekday},{" "}
              <Link to={`/viikko-${r.week}-${r.weekYear}`}>viikko {r.week}</Link> ·{" "}
              {r.calendarDays} kalenteripäivää aloituspäivästä
              {r.holiday ? ` · ${r.holiday} (arkipyhä)` : ""}
            </div>
          </div>
        )}
      </div>

      <p className="pills" aria-label="Valmiit laskut">
        {OFFSETS.map((n) => (
          <Link key={n} className="pill" to={offsetPath(n)}>
            {n} päivää eteenpäin
          </Link>
        ))}
      </p>

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Näin käytät päivämäärälaskuria</h2>
        <ol>
          {DATE_CALCULATOR_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Näin laskuri laskee</h2>
        <ul>
          <li>
            <strong>Aloituspäivä on päivä nolla.</strong> 1.1. + 1 päivä on 2.1.
          </li>
          <li>
            <strong>Viikko on seitsemän päivää.</strong> Tulos osuu samalle
            viikonpäivälle kuin aloituspäivä.
          </li>
          <li>
            <strong>Kuukausi pitää kuukaudenpäivän.</strong> Jos kohdekuukausi on
            lyhyempi, tulos on sen viimeinen päivä.
          </li>
          <li>
            <strong>Arkipäivät</strong> ovat maanantai-perjantai ilman virallisia
            arkipyhiä, samoin kuin <Link to="/tyopaivalaskuri">työpäivälaskurissa</Link>.
          </li>
        </ul>

        <h2>Esimerkkejä</h2>
        <ul>
          {EXAMPLES.map((ex) => (
            <li key={ex.text}>
              <strong>{ex.text}</strong> = {whenFi(ex.r.result)}. {ex.note}
            </li>
          ))}
        </ul>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to="/paivien-erotus">päivien erotus</Link>,{" "}
        <Link to="/tyopaivalaskuri">työpäivälaskuri</Link>,{" "}
        <Link to="/paivamaara-viikoksi">päivämäärästä viikkonumeroon</Link>,{" "}
        <Link to="/viikonpaiva">viikonpäivälaskuri</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default DateCalculator;
