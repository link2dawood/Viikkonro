import { useState } from "react";
import { Link } from "react-router-dom";
import { mondayOf } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import {
  ACCRUAL_TABLE,
  FACTS_CHECKED,
  LEAVE_PATH,
  LEAVE_STEPS,
  cheapWeeks,
  holidayLabel,
  leaveAccrued,
  leaveDaysUsed,
  leaveFaqs,
} from "../data/annualLeave";

const ANNUAL_HOLIDAYS_ACT_URL = "https://www.finlex.fi/fi/laki/ajantasa/2005/20050162";
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parse(str) {
  const p = (str || "").split("-").map(Number);
  if (p.length !== 3 || p.some(Number.isNaN) || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const CheapWeeks = ({ year }) => (
  <>
    <h3>Vuonna {year}</h3>
    <ul>
      {cheapWeeks(year).map((w) => (
        <li key={`${w.year}-${w.week}`}>
          <Link to={`/viikko-${w.week}-${w.year}`}>Viikko {w.week}</Link> ({dm(w.from)}-{dm(w.to)}):
          viikon loma kuluttaa <strong>{w.used} lomapäivää</strong>,{" "}
          {w.holidays.map(holidayLabel).join(", ")}
        </li>
      ))}
    </ul>
  </>
);

// Annual leave calculator (/vuosilomalaskuri). The default holiday is four
// weeks from week 27 of the coming summer, derived from useToday(), so the
// prerendered HTML and hydration agree.
const AnnualLeave = () => {
  const today = useToday();
  const summerYear = today.getMonth() < 6 ? today.getFullYear() : today.getFullYear() + 1;
  const defaultFrom = mondayOf(27, summerYear);
  const [from, setFrom] = useState(() => toInput(defaultFrom));
  const [to, setTo] = useState(() => toInput(addDays(defaultFrom, 26)));
  const [months, setMonths] = useState("12");
  const [fullYear, setFullYear] = useState(true);
  const used = leaveDaysUsed(parse(from), parse(to));
  const accrued = leaveAccrued(months, fullYear);
  const year = today.getFullYear();
  const faqs = leaveFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[LEAVE_PATH]} canonical={canonicalFor(LEAVE_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Vuosilomalaskuri
      </div>
      <h1>Vuosilomalaskuri</h1>
      <p className="lead">
        <span className="answer-sentence">
          Laske, montako lomapäivää loma kuluttaa ja montako lomapäivää sinulle
          kertyy. Vuosilomalain mukaan lauantai on lomapäivä, mutta sunnuntait ja
          arkipyhät eivät kuluta lomaa.
        </span>
      </p>

      <h2>Montako lomapäivää loma kuluttaa?</h2>
      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="l-from">Loma alkaa</label>
            <input type="date" id="l-from" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor="l-to">Loma päättyy</label>
            <input type="date" id="l-to" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {used ? (
          <div className="result" aria-live="polite">
            <div className="main-text">
              Loma kuluttaa <span className="num">{used.used} lomapäivää</span>
            </div>
            <div className="sub">
              {used.days} kalenteripäivää, joista {used.saturdays} lauantaita.
              {used.skipped.length
                ? ` Lomaa eivät kuluta: ${used.skipped.map(holidayLabel).join(", ")}.`
                : ""}
            </div>
          </div>
        ) : (
          <p className="note-soft">Valitse loman alku- ja loppupäivä.</p>
        )}
      </div>

      <h2>Montako lomapäivää kertyy?</h2>
      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="l-months">Täysiä kuukausia 1.4.-31.3.</label>
            <input
              type="number"
              id="l-months"
              min="0"
              max="12"
              inputMode="numeric"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="l-full">Työsuhde kestänyt 31.3. mennessä</label>
            <select id="l-full" value={fullYear ? "1" : "0"} onChange={(e) => setFullYear(e.target.value === "1")}>
              <option value="1">vähintään vuoden</option>
              <option value="0">alle vuoden</option>
            </select>
          </div>
        </div>
        <div className="result" aria-live="polite">
          <div className="main-text">
            Lomaa kertyy <span className="num">{accrued.days} lomapäivää</span>
          </div>
          <div className="sub">
            {accrued.months} kk × {String(accrued.rate).replace(".", ",")} päivää ={" "}
            {String(accrued.exact).replace(".", ",")}
            {accrued.exact !== accrued.days ? `, pyöristettynä ylöspäin ${accrued.days}` : ""}
          </div>
        </div>
      </div>

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Näin käytät vuosilomalaskuria</h2>
        <ol>
          {LEAVE_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>
          Lomavinkit {year} ja {year + 1}: viikot, joilla loma kuluttaa vähemmän
        </h2>
        <p>
          Tavallisesti viikon loma maanantaista lauantaihin kuluttaa kuusi
          lomapäivää. Näillä viikoilla arkipyhä tai aatto vähentää kulutusta.
        </p>
        <CheapWeeks year={year} />
        <CheapWeeks year={year + 1} />

        <h2>Lomapäivien kertyminen kuukausittain</h2>
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Täysiä kuukausia</th>
              <th scope="col">Työsuhde alle vuoden</th>
              <th scope="col">Työsuhde vähintään vuoden</th>
            </tr>
          </thead>
          <tbody>
            {ACCRUAL_TABLE.map((r) => (
              <tr key={r.months}>
                <th scope="row">{r.months}</th>
                <td>{r.under} päivää</td>
                <td>{r.full} päivää</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Vuosilomalain pääsäännöt</h2>
        <ul>
          <li>
            <strong>Lomanmääräytymisvuosi</strong> on 1.4.-31.3. Lomaa kertyy
            jokaiselta täydeltä kuukaudelta, jona on vähintään 14 työpäivää tai
            35 työtuntia.
          </li>
          <li>
            <strong>2,5 lomapäivää kuukaudessa</strong>, jos työsuhde on
            kestänyt vähintään vuoden 31.3. mennessä, muuten 2 lomapäivää. Päivän
            osa pyöristetään ylöspäin.
          </li>
          <li>
            <strong>Lomapäiviä ovat arkipäivät</strong>, myös lauantai. Lomaa
            eivät kuluta sunnuntait, kirkolliset juhlapyhät, itsenäisyyspäivä,
            jouluaatto, juhannusaatto, pääsiäislauantai ja vapunpäivä.
          </li>
          <li>
            <strong>Lomakausi on 2.5.-30.9.</strong> Kesälomaa annetaan enintään
            24 lomapäivää, ja loput pidetään talvilomana.
          </li>
        </ul>
        <p className="note-soft">
          Lähde:{" "}
          <a href={ANNUAL_HOLIDAYS_ACT_URL} target="_blank" rel="noopener noreferrer">
            vuosilomalaki 162/2005
          </a>{" "}
          (tarkistettu {FACTS_CHECKED}). Työehtosopimus voi määrätä loman
          laskemisesta toisin, esimerkiksi työpäivinä maanantaista perjantaihin.
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>,{" "}
        <Link to={`/palkkapaivat-${year}`}>palkkapäivät {year}</Link>,{" "}
        <Link to="/tuntilaskuri">tuntilaskuri</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default AnnualLeave;
