import { useToday } from "../components/useToday";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import { parseIsoDate, weekdayFaqs, weekdayMeta, weekdayResult } from "../data/currentDateContent";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";

function toInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const WeekdayCalculator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState("");
  const today = weekdayResult(toInput(useToday()));

  useEffect(() => {
    const requested = searchParams.get("paiva");
    const timer = window.setTimeout(() => {
      setValue(parseIsoDate(requested) ? requested : toInput(new Date()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const result = weekdayResult(value);
  const chooseDate = (nextValue) => {
    setValue(nextValue);
    setSearchParams(nextValue ? { paiva: nextValue } : {}, { replace: true });
  };

  return (
    <section className="app">
      <SEO {...weekdayMeta} canonical={canonicalFor("/viikonpaiva")} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Viikonpäivälaskuri
      </div>
      <h1>Mikä viikonpäivä oli?</h1>
      <p className="lead">
        <strong>Tänään {today.written} on {today.weekdayLower}.</strong>{" "}
        Valitse mikä tahansa päivämäärä ja tarkista sen viikonpäivä.
      </p>
      <div className="lookup">
        <label htmlFor="weekday-date">Päivämäärä</label>
        <input id="weekday-date" type="date" value={value} onChange={(event) => chooseDate(event.target.value)} />
        {result && (
          <div className="result" aria-live="polite">
            <div className="main-text">
              <strong>{result.written}</strong> oli tai on <span className="num">{result.weekdayLower}</span>.
            </div>
            <div className="sub">
              Viikko {result.week}/{result.weekYear} ·{" "}
              <Link to={"/viikko-" + result.week + "-" + result.weekYear}>avaa viikon tiedot</Link>
            </div>
          </div>
        )}
      </div>
      <div className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>
        <h2>Näin viikonpäivälaskuri toimii</h2>
        <ol>
          <li>Valitse päivämäärä kentästä.</li>
          <li>Lue tuloksesta viikonpäivä suomeksi.</li>
          <li>Tarkista samalla päivän ISO-viikkonumero ja viikkovuosi.</li>
        </ol>
        <p>
          Valittu päivä tallentuu osoitteen <code>paiva</code>-parametriin. Voit kopioida osoitteen ja jakaa saman tuloksen.
          Sivun ensisijainen osoite on silti aina <strong>/viikonpaiva</strong>.
        </p>
        <h2>Esimerkkejä viikonpäivistä</h2>
        <ul>
          <li>1.1.2026 oli torstai.</li>
          <li>20.7.2026 oli maanantai ja kuului viikkoon 30.</li>
          <li>1.1.2027 on perjantai ja kuuluu ISO-viikkoon 53/2026.</li>
        </ul>
        <h2>Miten viikonpäivä määräytyy?</h2>
        <p>
          Laskuri käyttää gregoriaanista kalenteria. Viikkonumero lasketaan ISO 8601 -standardilla,
          jossa viikko alkaa maanantaista. Siksi vuodenvaihteen päivän viikkovuosi voi erota kalenterivuodesta.
        </p>
        <h2>Usein kysytyt kysymykset</h2>
        {weekdayFaqs.map((item, index) => (
          <details key={item.q} open={index === 0}><summary>{item.q}</summary><p>{item.a}</p></details>
        ))}
      </div>
      <p>
        Katso myös <Link to="/paivamaara-viikoksi">päivämäärän viikkonumero</Link>,{" "}
        <Link to="/">mikä viikko nyt on</Link> ja <Link to="/mika-kuukausi-nyt">mikä kuukausi nyt on</Link>.
      </p>
    </section>
  );
};

export default WeekdayCalculator;
