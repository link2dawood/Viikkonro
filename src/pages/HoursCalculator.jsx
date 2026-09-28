import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import {
  EXAMPLES,
  FACTS_CHECKED,
  HOURS_PATH,
  HOURS_STEPS,
  MINUTE_TABLE,
  WEEKDAYS_FI,
  WORKING_TIME_ACT_URL,
  decimalToMinutes,
  fmtHM,
  hoursFaqs,
  shiftMinutes,
  toDecimal,
  weekTotal,
} from "../data/hoursCalculator";

const EMPTY_WEEK = WEEKDAYS_FI.map(() => ({ start: "", end: "", break: "" }));

// Hours calculator (/tuntilaskuri). Everything interactive starts from fixed
// defaults (no "now"), so the prerendered HTML and hydration always agree.
const HoursCalculator = () => {
  const [start, setStart] = useState("8.00");
  const [end, setEnd] = useState("16.30");
  const [brk, setBrk] = useState("30");
  const [week, setWeek] = useState(EMPTY_WEEK);
  const [decimal, setDecimal] = useState("7,75");
  const shift = shiftMinutes(start, end, brk);
  const total = weekTotal(week);
  const fromDecimal = decimalToMinutes(decimal);
  const faqs = hoursFaqs();

  const setDay = (i, key, value) =>
    setWeek((w) => w.map((row, j) => (j === i ? { ...row, [key]: value } : row)));

  return (
    <section className="app">
      <SEO {...routeMeta[HOURS_PATH]} canonical={canonicalFor(HOURS_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Tuntilaskuri
      </div>
      <h1>Tuntilaskuri ja työaikalaskuri</h1>
      <p className="lead">
        <span className="answer-sentence">
          Laske työtunnit kellonajoista taukoineen, viikon tunnit yhteensä ja
          minuutit desimaalitunteina, esimerkiksi 7 h 45 min = 7,75 h.
        </span>
      </p>

      <h2>Kellonaikojen erotus</h2>
      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="h-start">Alkaa</label>
            <input id="h-start" inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} placeholder="8.00" />
          </div>
          <div>
            <label htmlFor="h-end">Päättyy</label>
            <input id="h-end" inputMode="decimal" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="16.30" />
          </div>
          <div>
            <label htmlFor="h-break">Tauko (min)</label>
            <input id="h-break" type="number" min="0" inputMode="numeric" value={brk} onChange={(e) => setBrk(e.target.value)} />
          </div>
        </div>
        {shift ? (
          <div className="result" aria-live="polite">
            <div className="main-text">
              Työaika: <span className="num">{fmtHM(shift.worked)}</span> = {toDecimal(shift.worked)} h
            </div>
            <div className="sub">
              Kesto ilman taukoa {fmtHM(shift.span)}
              {shift.overnight ? " · vuoro päättyy seuraavana päivänä" : ""}
            </div>
          </div>
        ) : (
          <p className="note-soft">Kirjoita kellonajat muodossa 8.00 tai 8:00.</p>
        )}
      </div>

      <h2>Viikon työtunnit</h2>
      <div className="table-wrap">
        <table className="data-table hours-week">
          <thead>
            <tr>
              <th scope="col">Päivä</th>
              <th scope="col">Alkaa</th>
              <th scope="col">Päättyy</th>
              <th scope="col">Tauko (min)</th>
              <th scope="col">Työaika</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS_FI.map((day, i) => (
              <tr key={day}>
                <th scope="row">{day}</th>
                {["start", "end", "break"].map((key) => (
                  <td key={key}>
                    <input
                      aria-label={`${day}: ${key === "start" ? "alkaa" : key === "end" ? "päättyy" : "tauko minuutteina"}`}
                      inputMode={key === "break" ? "numeric" : "decimal"}
                      value={week[i][key]}
                      onChange={(e) => setDay(i, key, e.target.value)}
                    />
                  </td>
                ))}
                <td>{total.perDay[i] ? fmtHM(total.perDay[i].worked) : "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4}>
                Yhteensä
              </th>
              <td>
                {fmtHM(total.worked)} ({toDecimal(total.worked)} h)
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {total.days > 0 && (
        <p className="note-soft">
          {total.diffTo40 === 0
            ? "Viikon tunnit ovat täsmälleen 40 tuntia, eli säännöllisen työajan enimmäismäärä."
            : total.diffTo40 > 0
              ? `Viikon tunnit ylittävät 40 tuntia ${fmtHM(total.diffTo40)}.`
              : `40 tuntiin on vielä ${fmtHM(-total.diffTo40)}.`}
        </p>
      )}

      <h2>Desimaalitunnit tunneiksi ja minuuteiksi</h2>
      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="h-dec">Tunnit desimaalina</label>
            <input id="h-dec" inputMode="decimal" value={decimal} onChange={(e) => setDecimal(e.target.value)} />
          </div>
        </div>
        {fromDecimal !== null && (
          <div className="result" aria-live="polite">
            <div className="main-text">
              {decimal} h = <span className="num">{fmtHM(fromDecimal)}</span>
            </div>
          </div>
        )}
      </div>

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Näin käytät tuntilaskuria</h2>
        <ol>
          {HOURS_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Esimerkkejä</h2>
        <ul>
          {EXAMPLES.map((e) => (
            <li key={e.label}>
              <strong>{e.label}:</strong> {fmtHM(e.r.worked)} = {toDecimal(e.r.worked)} h
            </li>
          ))}
        </ul>

        <h2>Minuutit desimaalitunteina</h2>
        <p>
          Minuutit muutetaan tunneiksi jakamalla ne 60:llä. Taulukon luvut on
          pyöristetty kahteen desimaaliin, kuten palkanlaskennassa yleensä.
        </p>
      </section>
      <div className="table-wrap">
        <table className="data-table minute-table">
          <thead>
            <tr>
              {[0, 1, 2, 3].map((c) => (
                <th key={c} scope="col" colSpan={2}>
                  {c * 15 + 1}-{c * 15 + 15} min
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 15 }, (_, r) => (
              <tr key={r}>
                {[0, 1, 2, 3].map((c) => {
                  const row = MINUTE_TABLE[c * 15 + r];
                  return [
                    <th key={`m${c}`} scope="row">
                      {row.min} min
                    </th>,
                    <td key={`d${c}`}>{row.dec} h</td>,
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Työaikalain perusrajat</h2>
        <ul>
          <li>
            <strong>Säännöllinen työaika</strong> on enintään 8 tuntia
            vuorokaudessa ja 40 tuntia viikossa.
          </li>
          <li>
            <strong>Lepoaika:</strong> jos työpäivä on yli kuusi tuntia,
            työntekijälle on annettava vähintään tunnin lepoaika, jonka voi
            sopimalla lyhentää vähintään puoleen tuntiin.
          </li>
          <li>
            <strong>Vuorokausilepo:</strong> vähintään 11 tunnin keskeytymätön
            lepo vuorokaudessa.
          </li>
        </ul>
        <p className="note-soft">
          Lähde:{" "}
          <a href={WORKING_TIME_ACT_URL} target="_blank" rel="noopener noreferrer">
            työaikalaki 872/2019
          </a>{" "}
          (tarkistettu {FACTS_CHECKED}). Työehtosopimus voi määrätä toisin.
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
        Katso myös <Link to="/tyopaivalaskuri">työpäivälaskuri</Link>,{" "}
        <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
        <Link to="/paivien-erotus">päivien erotus</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default HoursCalculator;
