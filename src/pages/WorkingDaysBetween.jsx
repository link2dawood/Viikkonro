import { useToday } from "../components/useToday";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dWritten, isoYear } from "../components/dateUtils";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import { holidaysInYear } from "../data/holidays";

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
function toInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parse(str) {
  if (!str) return null;
  const p = str.split("-");
  if (p.length !== 3) return null;
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Working days (Mon–Fri minus official Finnish public holidays) between two
// dates, inclusive. Deterministic given the two inputs.
function compute(fromStr, toStr) {
  const a = parse(fromStr);
  const b = parse(toStr);
  if (!a || !b || a > b) return null;

  const officialSet = new Set();
  for (let y = a.getFullYear(); y <= b.getFullYear(); y++) {
    holidaysInYear(y)
      .filter((h) => h.official)
      .forEach((h) => officialSet.add(h.date.toDateString()));
  }

  let working = 0;
  let holidays = 0;
  let weekend = 0;
  let total = 0;
  const d = new Date(a);
  while (d <= b) {
    total += 1;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) weekend += 1;
    else if (officialSet.has(d.toDateString())) holidays += 1;
    else working += 1;
    d.setDate(d.getDate() + 1);
  }
  return { working, holidays, weekend, total, from: dWritten(a), to: dWritten(b) };
}

const WorkingDaysBetween = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    setFrom(toInput(now));
    setTo(toInput(end));
  }, []);
  const r = compute(from, to);
  const Y_NOW = isoYear(useToday());

  return (
    <section className="app">
      <SEO
        {...routeMeta["/tyopaivalaskuri"]}
        canonical={canonicalFor("/tyopaivalaskuri")}
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> /
        Työpäivälaskuri
      </div>
      <h1>Työpäivälaskuri</h1>
      <p className="lead">
        Laske työpäivien määrä kahden päivämäärän välillä. Viikonloput ja Suomen
        viralliset arkipyhät vähennetään automaattisesti.
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="from">Alkupäivä</label>
            <input
              type="date"
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="to">Loppupäivä</label>
            <input
              type="date"
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        {r && (
          <>
            <div className="result">
              <div className="main-text">
                Aikavälillä on <span className="num">{r.working} työpäivää</span>.
              </div>
              <div className="sub">
                {r.from} – {r.to}
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-box">
                <div className="n">{r.working}</div>
                <div className="l">Työpäivää</div>
              </div>
              <div className="stat-box">
                <div className="n">{r.weekend}</div>
                <div className="l">Viikonlopun päivää</div>
              </div>
              <div className="stat-box">
                <div className="n">{r.holidays}</div>
                <div className="l">Arkipyhää (ma–pe)</div>
              </div>
              <div className="stat-box">
                <div className="n">{r.total}</div>
                <div className="l">Päivää yhteensä</div>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="note-soft">
        Työpäivä = maanantai–perjantai, joista on vähennetty viralliset
        arkipyhät. Molemmat päivämäärät lasketaan mukaan.
      </p>

      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Esimerkki: joulukuu 2026</h2>
        <p>
          Joulukuussa 2026 (1.–31.12., 31 päivää) on{" "}
          <strong>22 työpäivää</strong>, 8 viikonlopun päivää ja 1 arkipyhä,
          joka osuu arkipäivälle (Joulupäivä, perjantai 25.12.).
          Itsenäisyyspäivä (6.12.) osuu sunnuntaille ja Tapaninpäivä (26.12.)
          lauantaille, joten ne eivät vähennä työpäivien määrää enää erikseen —
          ne on jo laskettu mukaan viikonloppuun.
        </p>

        <h2>Jouluaatto ja juhannusaatto eivät vähennä työpäiviä</h2>
        <p>
          Jouluaatto ja juhannusaatto eivät ole Suomen lain mukaan virallisia
          arkipyhiä, vaikka suurin osa työpaikoista on kiinni tai lyhentää
          työaikaa niinä päivinä. Tämä laskuri noudattaa lain mukaista listaa
          — jos jompikumpi osuu arkipäivälle, se lasketaan tässä työpäiväksi.
          Katso koko ero virallisten ja laajasti vietettyjen vapaapäivien
          välillä <Link to={`/pyhapaivat-${Y_NOW}`}>Suomen pyhäpäivät -sivulta</Link>.
        </p>

        <h2>Usein kysytyt kysymykset</h2>

        <details open>
          <summary>Lasketaanko jouluaatto ja juhannusaatto työpäiviksi?</summary>
          <p>
            Kyllä. Kumpikaan ei ole Suomen lain mukaan virallinen arkipyhä,
            vaikka suurin osa työpaikoista on kiinni tai lyhentää työaikaa
            niinä päivinä. Tämä laskuri noudattaa lain mukaista listaa
            virallisista arkipyhistä.
          </p>
        </details>

        <details>
          <summary>Lasketaanko alku- ja loppupäivä mukaan?</summary>
          <p>
            Kyllä, molemmat syöttämäsi päivämäärät sisältyvät laskentaan.
          </p>
        </details>

        <details>
          <summary>Mistä arkipyhät haetaan?</summary>
          <p>
            Suomen 13 virallisesta arkipyhästä, mukaan lukien liikkuvat pyhät
            kuten pääsiäinen, helatorstai, helluntai ja juhannuspäivä. Koko
            lista löytyy vuoden{" "}
            <Link to={`/pyhapaivat-${Y_NOW}`}>pyhäpäivät-sivulta</Link>.
          </p>
        </details>
      </div>

      <p>
        Katso myös <Link to="/paivien-erotus">päivien erotus</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default WorkingDaysBetween;
