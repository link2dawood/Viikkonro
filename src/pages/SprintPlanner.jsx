import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import DayRuleNote from "../components/DayRuleNote";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta } from "../data/seo";
import { dm, dmy, nextMonday, parseIsoDate, toIsoDate } from "../data/planningDates";
import {
  MAX_SPRINTS,
  SPRINT_PATH,
  SPRINT_STEPS,
  SPRINT_UPDATED,
  SPRINT_WEEKS,
  sprintFaqs,
  sprintOn,
  sprintPlan,
  sprintWeeks,
} from "../data/sprintPlanner";

export const SprintTable = ({ plan, today }) => {
  const current = sprintOn(plan, today);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Sprintti</th>
            <th scope="col">Päivät</th>
            <th scope="col">ISO-viikot</th>
            <th scope="col">Työpäiviä</th>
            <th scope="col">Kapasiteetti</th>
            <th scope="col">Arkipyhät</th>
          </tr>
        </thead>
        <tbody>
          {plan.map((s) => (
            <tr key={s.number} aria-current={current === s ? "date" : undefined}>
              <th scope="row">{s.number}</th>
              <td>
                {dm(s.from)}-{dmy(s.to)}
              </td>
              <td>
                <Link to={`/viikko-${s.weekFrom}-${s.weekFromYear}`}>{sprintWeeks(s)}</Link>
              </td>
              <td>{s.workingDays}</td>
              <td>{s.capacity} %</td>
              <td>{s.holidays.length ? s.holidays.map((h) => `${h.name} ${dm(h.date)}`).join(", ") : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Sprint planner (/sprinttisuunnittelija). The default start is the next
// Monday from useToday(), so the prerendered HTML and hydration agree.
const SprintPlanner = () => {
  const today = useToday();
  const year = today.getFullYear();
  const [start, setStart] = useState(() => toIsoDate(nextMonday(today)));
  const [weeks, setWeeks] = useState("2");
  const [count, setCount] = useState("12");
  const plan = sprintPlan(parseIsoDate(start), weeks, count);
  const current = sprintOn(plan, today);
  const faqs = sprintFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[SPRINT_PATH]} canonical={canonicalFor(SPRINT_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Sprinttisuunnittelija
      </div>
      <h1>Sprinttisuunnittelija</h1>
      <p className="lead">
        <span className="answer-sentence">
          Valitse ensimmäisen sprintin alkupäivä ja sprintin pituus, niin saat sprinttien päivämäärät, ISO-viikkonumerot ja
          työpäivät. Arkipyhät näkyvät sprinttien kapasiteetissa.
        </span>
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="s-start">Ensimmäinen sprintti alkaa</label>
            <input type="date" id="s-start" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="s-weeks">Sprintin pituus</label>
            <select id="s-weeks" value={weeks} onChange={(e) => setWeeks(e.target.value)}>
              {SPRINT_WEEKS.map((w) => (
                <option key={w} value={w}>
                  {w} {w === 1 ? "viikko" : "viikkoa"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="s-count">Sprinttejä (1-{MAX_SPRINTS})</label>
          <input
            type="number"
            id="s-count"
            min="1"
            max={MAX_SPRINTS}
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
        {plan ? (
          <>
            <div className="result" aria-live="polite">
              <div className="main-text">
                {plan.length} sprinttiä, viimeinen päättyy <span className="num">{dmy(plan[plan.length - 1].to)}</span>
              </div>
              <div className="sub">
                {current
                  ? `Tänään on sprintti ${current.number} (${sprintWeeks(current)}).`
                  : "Tämä päivä ei kuulu näihin sprintteihin."}
              </div>
            </div>
            <SprintTable plan={plan} today={today} />
          </>
        ) : (
          <p className="note-soft">Tarkista aloituspäivä ja sprinttien määrä.</p>
        )}
      </div>

      <DayRuleNote mode="FINLAND_SPRINT" />

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {fmtFullFi(parseIsoDate(SPRINT_UPDATED))}.</p>

        <h2>Näin käytät sprinttisuunnittelijaa</h2>
        <ol>
          {SPRINT_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Näin sprintit lasketaan</h2>
        <ul>
          <li>
            Jokainen sprintti kestää valitsemasi määrän kalenteriviikkoja, ja seuraava alkaa heti edellisen päätyttyä.
          </li>
          <li>
            <strong>Työpäivä</strong> on maanantain ja perjantain välinen päivä, joka ei ole arkipyhä.{" "}
            <strong>Kapasiteetti</strong> on työpäivien osuus viikkojen mukaisesta viiden päivän viikosta.
          </li>
          <li>
            Viikkonumerot ovat ISO 8601 -viikkoja, kuten sivuston <Link to={`/vuosi-${year}`}>vuosikalenterissa</Link>.
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
        Katso myös <Link to="/projektiaikataulu">projektiaikataulu</Link>, <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>, <Link to="/ajanhallinta">ajanhallinta</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default SprintPlanner;
