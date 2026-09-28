import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import {
  AGE_PATH,
  AGE_STEPS,
  ageFaqs,
  ageReport,
  ageText,
  birthYearTable,
} from "../data/ageCalculator";

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parse(str) {
  const p = (str || "").split("-").map(Number);
  if (p.length !== 3 || p.some(Number.isNaN) || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
const nf = new Intl.NumberFormat("fi-FI");

// Age calculator (/ikalaskuri). The "on" date defaults to useToday(), so the
// prerendered HTML and the first client render agree; the birth date starts
// empty, so nothing personal is ever prerendered.
const AgeCalculator = () => {
  const today = useToday();
  const [birth, setBirth] = useState("");
  const [on, setOn] = useState(() => toInput(today));
  const onDate = parse(on) ?? today;
  const r = ageReport(parse(birth), onDate);
  const year = today.getFullYear();
  const faqs = ageFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[AGE_PATH]} canonical={canonicalFor(AGE_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Ikälaskuri
      </div>
      <h1>Ikälaskuri: kuinka vanha olen?</h1>
      <p className="lead">
        <span className="answer-sentence">
          Syötä syntymäpäiväsi, niin näet tarkan ikäsi vuosina, kuukausina ja
          päivinä, seuraavan syntymäpäiväsi ja tulevat merkkipäiväsi.
        </span>
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="age-birth">Syntymäpäivä</label>
            <input
              type="date"
              id="age-birth"
              value={birth}
              max={on}
              onChange={(e) => setBirth(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="age-on">Ikä päivänä</label>
            <input type="date" id="age-on" value={on} onChange={(e) => setOn(e.target.value)} />
          </div>
        </div>
        {r ? (
          <div className="result" aria-live="polite">
            <div className="main-text">
              Ikä: <span className="num">{ageText(r.age)}</span>
            </div>
            <div className="sub">
              {nf.format(r.age.totalDays)} päivää · {nf.format(r.age.totalWeeks)} viikkoa ·{" "}
              {nf.format(r.age.totalMonths)} kuukautta
            </div>
            <div className="sub">
              {r.next.isToday
                ? `Hyvää syntymäpäivää! Täytät tänään ${r.next.turns} vuotta.`
                : `Seuraava syntymäpäivä: ${r.next.weekdayEssive} ${fmtFullFi(r.next.date)}, täytät ${r.next.turns} vuotta (${r.next.daysLeft} päivän päästä).`}
            </div>
            <div className="sub">
              Synnyit {r.bornWeekday.toLowerCase()}na, viikolla{" "}
              <Link to={`/viikko-${r.bornWeek}-${r.bornWeekYear}`}>{r.bornWeek}</Link>.
            </div>
          </div>
        ) : (
          <p className="note-soft">Valitse syntymäpäivä, niin tulos näkyy tässä.</p>
        )}
      </div>

      {r && (
        <section className="prose">
          <h2>Merkkipäiväsi</h2>
          <ul>
            {r.milestones.map((m) => (
              <li key={m.label}>
                <strong>{m.label}:</strong> {m.weekday.toLowerCase()} {fmtFullFi(m.date)}
                {m.past ? " (mennyt)" : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Näin käytät ikälaskuria</h2>
        <ol>
          {AGE_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Näin ikä lasketaan</h2>
        <ul>
          <li>
            <strong>Täydet vuodet:</strong> uusi ikävuosi täyttyy syntymäpäivänä.
          </li>
          <li>
            <strong>Kuukaudet ja päivät</strong> lasketaan viimeisimmästä
            syntymäpäivästä eteenpäin.
          </li>
          <li>
            <strong>Karkauspäivänä 29.2. syntyneen</strong> vuodet täyttyvät
            laskurissa muina vuosina 1.3.
          </li>
          <li>
            Syntymäpäivää ei tallenneta mihinkään: laskenta tapahtuu vain omassa
            selaimessasi.
          </li>
        </ul>

        <h2>Ikä syntymävuoden mukaan vuonna {year}</h2>
        <p>
          Taulukko näyttää, montako vuotta kunkin vuoden syntyneet täyttävät
          vuonna {year}. Ennen tämän vuoden syntymäpäivää ikä on yhtä vuotta
          pienempi.
        </p>
      </section>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Syntymävuosi</th>
              <th scope="col">Täyttää vuonna {year}</th>
              <th scope="col">Ikä ennen syntymäpäivää</th>
            </tr>
          </thead>
          <tbody>
            {birthYearTable(year).map((row) => (
              <tr key={row.born}>
                <th scope="row">{row.born}</th>
                <td>{row.turns} vuotta</td>
                <td>{row.turns - 1} vuotta</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to="/viikonpaiva">viikonpäivälaskuri</Link>,{" "}
        <Link to="/paivien-erotus">päivien erotus</Link>,{" "}
        <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
        <Link to="/nimipaivat/tanaan">tämän päivän nimipäivät</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default AgeCalculator;
