import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi, WD } from "../components/dateUtils";
import SEO from "../components/SEO";
import DayRuleNote from "../components/DayRuleNote";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta } from "../data/seo";
import { dm, dmy, nextMonday, parseIsoDate, toIsoDate } from "../data/planningDates";
import {
  MAX_PROJECT_DAYS,
  PROJECT_PATH,
  PROJECT_STEPS,
  PROJECT_UPDATED,
  projectFaqs,
  projectPlan,
} from "../data/projectTimeline";

const wd = (d) => WD[d.getDay()].slice(0, 2).toLowerCase();

export const ProjectResult = ({ plan }) => (
  <>
    <div className="result" aria-live="polite">
      <div className="main-text">
        Projekti päättyy{" "}
        <span className="num">
          {wd(plan.end)} {dmy(plan.end)}
        </span>
      </div>
      <div className="sub">
        {plan.workingDays} työpäivää, {plan.calendarDays} kalenteripäivää, {plan.rows.length} ISO-viikkoa. Alkaa{" "}
        {wd(plan.start)} {dmy(plan.start)}.
      </div>
    </div>
    <h3>Välitavoitteet</h3>
    <ul>
      {plan.milestones.map((m) => (
        <li key={m.percent}>
          <strong>{m.percent} %</strong>: {wd(m.date)} {dmy(m.date)}, <Link to={`/viikko-${m.week}-${m.weekYear}`}>viikko {m.week}</Link>
        </li>
      ))}
    </ul>
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Viikko</th>
            <th scope="col">Päivät</th>
            <th scope="col">Työpäiviä</th>
            <th scope="col">Arkipyhät</th>
          </tr>
        </thead>
        <tbody>
          {plan.rows.map((r) => (
            <tr key={`${r.year}-${r.week}`}>
              <th scope="row">
                <Link to={`/viikko-${r.week}-${r.year}`}>{r.week}</Link>
              </th>
              <td>
                {dm(r.from)}-{dm(r.to)}
              </td>
              <td>{r.workingDays}</td>
              <td>{r.holidays.length ? r.holidays.map((h) => `${h.name} ${dm(h.date)}`).join(", ") : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// Project timeline calculator (/projektiaikataulu). The default start is the
// next Monday from useToday(), so the prerendered HTML and hydration agree.
const ProjectTimeline = () => {
  const today = useToday();
  const year = today.getFullYear();
  const defaultStart = nextMonday(today);
  const [start, setStart] = useState(() => toIsoDate(defaultStart));
  const [mode, setMode] = useState("days");
  const [days, setDays] = useState("60");
  const [end, setEnd] = useState(() =>
    toIsoDate(new Date(defaultStart.getFullYear(), defaultStart.getMonth() + 3, defaultStart.getDate())),
  );
  const plan = projectPlan(parseIsoDate(start), mode === "days" ? { workingDays: days } : { end: parseIsoDate(end) });
  const faqs = projectFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[PROJECT_PATH]} canonical={canonicalFor(PROJECT_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Projektiaikataulu
      </div>
      <h1>Projektiaikataulu</h1>
      <p className="lead">
        <span className="answer-sentence">
          Laske projektin päättymispäivä työpäivinä tai työpäivien määrä alku- ja loppupäivän välillä. Saat viikkokohtaisen
          aikataulun ISO-viikkonumeroineen ja välitavoitteet.
        </span>
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="p-start">Aloituspäivä</label>
            <input type="date" id="p-start" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-mode">Syötän</label>
            <select id="p-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="days">keston työpäivinä</option>
              <option value="end">loppupäivän</option>
            </select>
          </div>
        </div>
        {mode === "days" ? (
          <div>
            <label htmlFor="p-days">Kesto työpäivinä (1-{MAX_PROJECT_DAYS})</label>
            <input
              type="number"
              id="p-days"
              min="1"
              max={MAX_PROJECT_DAYS}
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="p-end">Loppupäivä</label>
            <input type="date" id="p-end" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        )}
        {plan ? <ProjectResult plan={plan} /> : <p className="note-soft">Tarkista päivämäärät ja kesto.</p>}
      </div>

      <DayRuleNote mode="FINLAND_PROJECT" />

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {fmtFullFi(parseIsoDate(PROJECT_UPDATED))}.</p>

        <h2>Näin käytät projektiaikataulua</h2>
        <ol>
          {PROJECT_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Näin aikataulu lasketaan</h2>
        <ul>
          <li>
            <strong>Työpäivä</strong> on maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Sama sääntö on
            <Link to="/tyopaivalaskuri"> työpäivälaskurissa</Link>.
          </li>
          <li>
            <strong>Alkupäivä</strong>, joka ei ole työpäivä, siirtyy seuraavaan työpäivään.
          </li>
          <li>
            <strong>Viikot</strong> ovat ISO 8601 -viikkoja: viikko alkaa maanantaina ja viikon 1 sisältää
            vuoden ensimmäisen torstain.
          </li>
          <li>
            Jouluaatto ja juhannusaatto lasketaan työpäiviksi, koska ne eivät ole lakisääteisiä arkipyhiä.
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
        Katso myös <Link to="/sprinttisuunnittelija">sprinttisuunnittelija</Link>, <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>, <Link to={`/q1-${year}`}>Q1 {year}</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default ProjectTimeline;
