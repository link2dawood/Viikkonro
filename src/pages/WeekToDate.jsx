import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  isoWeek,
  isoYear,
} from "../components/dateUtils";
import { computeWeekToDate } from "../data/weekToDate";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";

const WeekToDate = () => {
  const [week, setWeek] = useState("");
  const [year, setYear] = useState("");
  useEffect(() => {
    const now = new Date();
    setWeek(String(isoWeek(now)));
    setYear(String(isoYear(now)));
  }, []);
  const r = computeWeekToDate(week, year);

  return (
    <section className="app">
      <SEO
        {...routeMeta["/viikko-paivamaaraksi"]}
        canonical={canonicalFor("/viikko-paivamaaraksi")}
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> /
        Viikosta päivämääräksi
      </div>
      <h1>Viikosta päivämääräksi</h1>
      <p className="lead">
        Syötä viikkonumero ja vuosi, niin näet viikon alkamis- ja
        päättymispäivän sekä kaikki viikonpäivät.
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="wk">Viikko</label>
            <input
              type="number"
              id="wk"
              min="1"
              max="53"
              step="1"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="yr">Vuosi</label>
            <input
              type="number"
              id="yr"
              min="2000"
              max="2100"
              step="1"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>
        {r && (
          <div className="result">
            <div className="main-text">
              <span className="num">Viikko {r.w}/{r.y}</span> alkaa{" "}
              <strong>{r.start}</strong> ja päättyy <strong>{r.end}</strong>.
            </div>
            <div className="sub">
              <Link className="open-link" to={`/viikko-${r.w}-${r.y}`}>
                avaa viikko {r.w} kaikkine tietoineen
              </Link>
            </div>
            <div className="table-wrap" style={{ marginTop: "14px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Viikonpäivä</th>
                    <th>Päivämäärä</th>
                  </tr>
                </thead>
                <tbody>
                  {r.days.map((d) => (
                    <tr key={d.name}>
                      <td>{d.name}</td>
                      <td>{d.written}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Esimerkkejä</h2>
        <ul>
          <li>
            <strong>Viikko 1/2026</strong>: 29.12.2025 (ma) – 4.1.2026 (su) —
            viikko alkaa jo edellisen kalenterivuoden puolella.{" "}
            <Link to="/viikko-1-2026">Avaa viikko 1/2026 →</Link>
          </li>
          <li>
            <strong>Viikko 30/2026</strong>: 20.7.2026 (ma) – 26.7.2026 (su),
            tavallinen keskikesän viikko.{" "}
            <Link to="/viikko-30-2026">Avaa viikko 30/2026 →</Link>
          </li>
          <li>
            <strong>Viikko 53/2026</strong>: 28.12.2026 (ma) – 3.1.2027 (su) —
            harvinainen 53. viikko, joka esiintyy vain 53 viikon vuosina.{" "}
            <Link to="/viikko-53-2026">Avaa viikko 53/2026 →</Link>
          </li>
        </ul>

        <h2>Kun viikkoa ei löydy</h2>
        <p>
          Jos syötät viikon, jota kyseisessä vuodessa ei ole — esimerkiksi
          viikko 53 vuonna, jossa on vain 52 viikkoa — laskuri ei näytä
          tulosta. Tarkista ensin{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">
            kuinka monta viikkoa kyseisessä vuodessa on
          </Link>
          .
        </p>

        <h2>Usein kysytyt kysymykset</h2>

        <details open>
          <summary>Miksi viikko 1 voi alkaa jo edellisenä joulukuuna?</summary>
          <p>
            Koska vuoden ensimmäinen viikko määräytyy vuoden ensimmäisen
            torstain mukaan, sen maanantai voi olla vielä edellisen
            kalenterivuoden puolella. Esimerkiksi viikko 1/2026 alkaa
            maanantaina 29.12.2025.
          </p>
        </details>

        <details>
          <summary>Onko joka vuodessa viikko 53?</summary>
          <p>
            Ei. Useimmissa vuosissa on 52 viikkoa; viikko 53 esiintyy vain noin
            joka viidennessä tai kuudennessa vuodessa. Katso,{" "}
            <Link to="/kuinka-monta-viikkoa-vuodessa">
              mitkä vuodet ovat 53 viikon vuosia
            </Link>
            .
          </p>
        </details>

        <details>
          <summary>
            Mitä tapahtuu, jos syötän viikon, jota kyseisessä vuodessa ei ole?
          </summary>
          <p>
            Laskuri ei näytä tulosta, koska sellaista viikkoa ei ole olemassa
            kyseiselle vuodelle. Tarkista ensin, onko vuodessa 52 vai 53
            viikkoa.
          </p>
        </details>
      </div>

      <p>
        Katso myös{" "}
        <Link to="/paivamaara-viikoksi">päivämäärästä viikkonumeroon</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default WeekToDate;
