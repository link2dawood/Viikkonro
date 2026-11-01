import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { validateYear } from "../components/dateUtils";
import { computeDateToWeek } from "../data/dateToWeek";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
function toInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DateToWeek = ({ initialDate } = {}) => {
  const [str, setStr] = useState(initialDate ?? "");
  useEffect(() => {
    if (initialDate != null) return;
    setStr(toInput(new Date()));
  }, [initialDate]);
  const r = computeDateToWeek(str);

  return (
    <section className="app">
      <SEO
        {...routeMeta["/paivamaara-viikoksi"]}
        canonical={canonicalFor("/paivamaara-viikoksi")}
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> /
        Päivämäärästä viikkoon
      </div>
      <h1>Päivämäärästä viikkonumeroon</h1>
      <p className="lead">
        Valitse päivämäärä, niin näet mihin viikkonumeroon se kuuluu ISO 8601
        -standardin mukaan.
      </p>

      <div className="lookup">
        <label htmlFor="dpick">Päivämäärä</label>
        <input
          type="date"
          id="dpick"
          min="1000-01-01"
          max="9999-12-31"
          value={str}
          onChange={(e) => setStr(e.target.value)}
        />
        {r && (
          <div className="result">
            <div className="main-text">
              <strong>{r.written}</strong> ({r.weekday}) on{" "}
              <span className="num">viikolla {r.w}</span>.
            </div>
            <div className="sub">
              Viikko {r.w}/{r.y} · {r.range}
              {validateYear(r.y) && (
                <>
                  {" · "}
                  <Link className="open-link" to={`/viikko-${r.w}-${r.y}`}>
                    avaa viikko {r.w}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Miten viikkonumero määräytyy?</h2>
        <p>
          Suomessa ja koko Euroopassa viikot numeroidaan ISO 8601 -standardin
          mukaan: viikko alkaa maanantaista ja vuoden ensimmäinen viikko on se,
          johon osuu vuoden ensimmäinen torstai. Siksi alkuvuoden päivä voi vielä
          kuulua edellisen vuoden viimeiseen viikkoon — ja joulukuun viimeiset
          päivät voivat kuulua jo seuraavan vuoden viikkoon 1.
        </p>

        <h2>Esimerkkejä eri vuodenajoilta</h2>
        <ul>
          <li>
            <strong>4.1.2026</strong> (sunnuntai) → viikko 1/2026 — 4. tammikuuta
            kuuluu ISO 8601:n mukaan aina viikkoon 1, olipa se minä
            viikonpäivänä tahansa.
          </li>
          <li>
            <strong>29.12.2025</strong> (maanantai) → viikko 1/2026, ei viikko
            53/2025. Tämä on yleisin syy, miksi laskurin tulos yllättää.{" "}
            <Link to="/viikko-1-2026">Avaa viikko 1/2026 →</Link>
          </li>
          <li>
            <strong>20.7.2026</strong> (maanantai) → viikko 30/2026, tavallinen
            keskikesän viikko. <Link to="/viikko-30-2026">Avaa viikko 30/2026 →</Link>
          </li>
          <li>
            <strong>31.12.2023</strong> (sunnuntai) → viikko 52/2023.
          </li>
        </ul>

        <h2>Usein kysytyt kysymykset</h2>

        <details open>
          <summary>
            Miksi 29.–31. joulukuuta voi kuulua ensi vuoden viikkoon 1?
          </summary>
          <p>
            ISO 8601 -standardin mukaan vuoden ensimmäinen viikko on se, johon
            vuoden ensimmäinen torstai osuu. Jos esimerkiksi 1. tammikuuta on
            torstai, myös sitä edeltävä maanantai (29. joulukuuta) kuuluu jo
            uuden vuoden viikkoon 1.
          </p>
        </details>

        <details>
          <summary>Toimiiko laskuri myös menneille päivämäärille?</summary>
          <p>
            Kyllä, laskuri laskee viikkonumeron mille tahansa päivämäärälle.
            "Avaa viikko" -linkki vie tarkempiin tietoihin vuosilta 2020–2035;
            tätä väliä vanhemmat tai uudemmat päivämäärät saavat silti oikean
            viikkonumeron, mutta ilman omaa tietosivua.
          </p>
        </details>

        <details>
          <summary>Mistä standardista viikkonumero lasketaan?</summary>
          <p>
            ISO 8601 -standardista, jota käytetään Suomessa ja koko Euroopassa.
            Katso tarkempi selitys sivulta{" "}
            <Link to="/mika-on-viikkonumero">Mikä on viikkonumero</Link>.
          </p>
        </details>
      </div>

      <p>
        Katso myös{" "}
        <Link to="/viikko-paivamaaraksi">viikosta päivämääräksi</Link>,{" "}
        <Link to="/paivien-erotus">päivien erotus</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default DateToWeek;
