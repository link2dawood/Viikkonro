import { useToday } from "../components/useToday";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dateFromDayKey, fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import {
  DAY_COUNT_MODES,
  KELA_WORKDAY_SOURCE,
  WORKING_DAYS_UPDATED,
  calculateDaysBetween,
  workingDaysBetweenFaqs,
} from "../data/workingDaysContent.js";

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
function toInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const WorkingDaysBetween = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("work");
  useEffect(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    setFrom(toInput(now));
    setTo(toInput(end));
  }, []);
  const r = calculateDaysBetween(from, to, mode);
  const Y_NOW = useToday().getFullYear();
  const examples = [
    { label: "Tavallinen työviikko", from: "2026-10-05", to: "2026-10-11" },
    { label: "Joulukuu", from: "2026-12-01", to: "2026-12-31" },
    { label: "Vuodenvaihde", from: "2026-12-28", to: "2027-01-03" },
    { label: "Yksi arkipäivä", from: "2026-10-05", to: "2026-10-05" },
  ].map((example) => ({
    ...example,
    result: calculateDaysBetween(example.from, example.to),
  }));
  const decemberWork = calculateDaysBetween("2026-12-01", "2026-12-31", "work");
  const decemberKela = calculateDaysBetween("2026-12-01", "2026-12-31", "kela");

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
        Laske työpäivät tai Kelan arkipäivät kahden päivämäärän välillä.
        Laskuri huomioi valitun viikkosäännön ja Suomen viralliset pyhäpäivät.
      </p>

      <div className="lookup">
        <div>
          <label htmlFor="day-count-mode">Laskutapa</label>
          <select
            id="day-count-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            {Object.entries(DAY_COUNT_MODES).map(([value, option]) => (
              <option key={value} value={value}>{option.label}</option>
            ))}
          </select>
        </div>
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
                Aikavälillä on <span className="num">{r.working} {r.resultLabel}</span>.
              </div>
              <div className="sub">
                {r.from} – {r.to}
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-box">
                <div className="n">{r.working}</div>
                <div className="l">{r.resultLabel}</div>
              </div>
              <div className="stat-box">
                <div className="n">{r.weekend}</div>
                <div className="l">{r.excludedLabel}</div>
              </div>
              <div className="stat-box">
                <div className="n">{r.holidays}</div>
                <div className="l">Pyhäpäivää ({mode === "kela" ? "ma-la" : "ma-pe"})</div>
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
        {mode === "kela"
          ? "Kelan arkipäivä = maanantai-lauantai, pois lukien pyhäpäivät."
          : "Työpäivä = maanantai-perjantai, pois lukien viralliset pyhäpäivät."}{" "}
        Molemmat päivämäärät lasketaan mukaan.
      </p>

      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {fmtFullFi(dateFromDayKey(WORKING_DAYS_UPDATED))}.</p>

        <h2>Miten työpäivien määrä lasketaan?</h2>
        <p>
          Laskuri käy aikavälin läpi alkupäivästä loppupäivään. Lauantait ja
          sunnuntait kuuluvat viikonloppuun. Muista päivistä vähennetään viralliset
          pyhäpäivät. Jäljelle jäävät päivät ovat tämän laskurin työpäiviä.
          Työpäivien, viikonlopun päivien ja arkipyhien summa on koko aikavälin
          kalenteripäivien määrä.
        </p>
        <p>
          Jos alku- ja loppupäivä ovat sama päivä, tulos on yksi työpäivä vain,
          jos päivä on maanantain ja perjantain välillä eikä ole pyhäpäivä.
          Lauantaista sunnuntaihin ulottuvalla aikavälillä työpäiviä on nolla.
          Oma työvuorolistasi voi poiketa tästä viisipäiväisen työviikon mallista.
        </p>

        <h2>Työpäivä, arkipäivä ja Kelan arkipäivä</h2>
        <p>
          Tässä laskurissa työpäivä tarkoittaa maanantaita, tiistaita,
          keskiviikkoa, torstaita tai perjantaita, joka ei ole pyhäpäivä.
          Kelan päivärahojen arkipäivään voi kuulua myös lauantai. Kelan
          laskutavassa sunnuntait ja pyhäpäivät jäävät pois.
        </p>
        <p>
          Esimerkiksi joulukuussa 2026 on <strong>{decemberWork.working} työpäivää</strong>{" "}
          tavallisella ma-pe-laskutavalla ja <strong>{decemberKela.working} Kelan
          arkipäivää</strong> ma-la-laskutavalla. Tarkista etuuden omat ehdot ja
          päätöksen päivät Kelasta. Laskutavan määritelmä on tarkistettu{" "}
          <a href={KELA_WORKDAY_SOURCE}>Kelan raskausaikana-sivulta</a>.
        </p>

        <h2>Miten TES vaikuttaa työpäivien määrään?</h2>
        <p>
          Työehtosopimus eli TES tai työsopimus voi määrätä työvuoroista,
          palkallisista vapaista ja arkipyhien vaikutuksesta eri tavalla kuin
          tämä yleinen kalenterilaskuri. Laskuri ei päättele sopimusalaasi tai
          työvuorojasi. Käytä tulosta kalenteripohjana ja tarkista palkkaan tai
          vapaaseen vaikuttavat ehdot omasta sopimuksestasi tai työnantajalta.
        </p>

        <h2>Esimerkkejä työpäivälaskurista</h2>
        <div className="table-wrap">
          <table>
            <caption>Molemmat rajapäivät sisältyvät jokaiseen esimerkkiin.</caption>
            <thead>
              <tr>
                <th scope="col">Aikaväli</th>
                <th scope="col">Työpäiviä</th>
                <th scope="col">Viikonlopun päiviä</th>
                <th scope="col">Arkipyhiä</th>
                <th scope="col">Yhteensä</th>
              </tr>
            </thead>
            <tbody>
              {examples.map(({ label, from, result }) => (
                <tr key={`${label}-${from}`}>
                  <th scope="row">{label}: {result.from} - {result.to}</th>
                  <td>{result.working}</td><td>{result.weekend}</td>
                  <td>{result.holidays}</td><td>{result.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

        {workingDaysBetweenFaqs.map(({ q, a }, index) => (
          <details key={q} open={index === 0}>
            <summary>{q}</summary><p>{a}</p>
          </details>
        ))}
        <p>
          <Link to={`/tyopaivat-${Y_NOW}`}>Työpäivät {Y_NOW} kuukausittain</Link>{" "}
          ja <Link to={`/pyhapaivat-${Y_NOW}`}>vuoden {Y_NOW} pyhäpäivät</Link>.
          Jos haluat lisätä päivämäärään tietyn määrän työpäiviä, käytä{" "}
          <Link to="/paivamaaralaskuri">päivämäärälaskuria</Link>.
        </p>
      </div>

      <p>
        Katso myös <Link to="/tuntilaskuri">tuntilaskuri</Link>,{" "}
        <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
        <Link to="/paivien-erotus">päivien erotus</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default WorkingDaysBetween;
