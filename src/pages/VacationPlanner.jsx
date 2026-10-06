import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta } from "../data/seo";
import { dm, dmy, parseIsoDate, weekRangeLabel } from "../data/planningDates";
import {
  MAX_LEAVE_DAYS,
  PLANNER_PATH,
  PLANNER_STEPS,
  PLANNER_UPDATED,
  bestBreaks,
  breakTable,
  plannerFaqs,
} from "../data/vacationPlanner";

const holidayNames = (b) => (b.holidays.length ? b.holidays.map((h) => `${h.name} ${dm(h.date)}`).join(", ") : "ei arkipyhiä");

const BreakList = ({ breaks }) => (
  <ul>
    {breaks.map((b) => (
      <li key={b.from.getTime()}>
        <strong>
          {dm(b.from)}-{dmy(b.to)}
        </strong>{" "}
        ({weekRangeLabel(b.from, b.to)}): <strong>{b.days} päivää vapaata</strong>, lomapäiviä {b.used}. Mukana:{" "}
        {holidayNames(b)}.
      </li>
    ))}
  </ul>
);

const BreakTable = ({ year }) => (
  <>
    <h3>Vuonna {year}</h3>
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Lomapäiviä</th>
            <th scope="col">Pisin tauko</th>
            <th scope="col">Vapaata</th>
            <th scope="col">Mukana</th>
          </tr>
        </thead>
        <tbody>
          {breakTable(year).map((r) => (
            <tr key={r.leave}>
              <th scope="row">{r.leave}</th>
              <td>
                {dm(r.from)}-{dmy(r.to)}
              </td>
              <td>{r.days} päivää</td>
              <td>{holidayNames(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// Vacation planner (/lomasuunnittelija). Years and the default state come from
// useToday(), so the prerendered HTML and hydration agree.
const VacationPlanner = () => {
  const today = useToday();
  const year = today.getFullYear();
  const [selected, setSelected] = useState(String(year));
  const [leave, setLeave] = useState("4");
  const leaveDays = Math.trunc(Number(leave));
  const valid = Number.isFinite(leaveDays) && leaveDays >= 0 && leaveDays <= MAX_LEAVE_DAYS;
  const breaks = valid ? bestBreaks(Number(selected), leaveDays, 3) : [];
  const faqs = plannerFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[PLANNER_PATH]} canonical={canonicalFor(PLANNER_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Lomasuunnittelija
      </div>
      <h1>Lomasuunnittelija</h1>
      <p className="lead">
        <span className="answer-sentence">
          Kirjoita, montako lomapäivää aiot käyttää, niin näet pisimmät tauot, jotka niillä saa kun lomapäivät
          sijoitetaan viikonloppujen ja arkipyhien väliin.
        </span>
      </p>

      <h2>Pisimmät tauot lomapäivillesi</h2>
      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="v-year">Vuosi</label>
            <select id="v-year" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {[year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="v-leave">Lomapäiviä käytettävissä</label>
            <input
              type="number"
              id="v-leave"
              min="0"
              max={MAX_LEAVE_DAYS}
              inputMode="numeric"
              value={leave}
              onChange={(e) => setLeave(e.target.value)}
            />
          </div>
        </div>
        {valid && breaks.length ? (
          <div className="result" aria-live="polite">
            <div className="main-text">
              {leaveDays} lomapäivällä saat <span className="num">{breaks[0].days} päivän tauon</span> parhaimmillaan
            </div>
            <div className="sub">Kolme parasta taukoa vuonna {selected}:</div>
            <BreakList breaks={breaks} />
          </div>
        ) : (
          <p className="note-soft">Kirjoita lomapäivien määrä, 0-{MAX_LEAVE_DAYS}.</p>
        )}
      </div>

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {fmtFullFi(parseIsoDate(PLANNER_UPDATED))}.</p>

        <h2>Näin käytät lomasuunnittelijaa</h2>
        <ol>
          {PLANNER_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>
          Pisin tauko lomapäivien mukaan {year} ja {year + 1}
        </h2>
        <p>
          Taulukko näyttää kullekin lomapäivien määrälle vuoden pisimmän tauon. Tauko alkaa tänä vuonna, mutta se voi
          jatkua seuraavan vuoden alkuun.
        </p>
        <BreakTable year={year} />
        <BreakTable year={year + 1} />

        <h2>Näin suunnittelija laskee</h2>
        <ul>
          <li>
            <strong>Vapaata</strong> ovat lauantait, sunnuntait ja arkipyhät sekä jouluaatto ja juhannusaatto, jotka
            eivät ole lakisääteisiä arkipyhiä mutta joina useimmat työpaikat ovat kiinni.
          </li>
          <li>
            <strong>Lomapäivä</strong> on maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Tauko alkaa ja
            päättyy vapaapäivään.
          </li>
          <li>
            <strong>Vuosiloman kulutus</strong> lasketaan eri tavalla: vuosilomalain mukaan lauantai on lomapäivä.
            Tarkista kulutus <Link to="/vuosilomalaskuri">vuosilomalaskurilla</Link>.
          </li>
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
        Katso myös <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>, <Link to={`/koululomat-${year}`}>koululomat {year}</Link>,{" "}
        <Link to="/vuosilomalaskuri">vuosilomalaskuri</Link> ja <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default VacationPlanner;
