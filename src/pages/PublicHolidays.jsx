import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  isoWeek,
  isoYear,
  getWeekdayName,
  dWritten,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import { canonicalFor, holidaysMeta } from "../data/seo";
import { holidayDateRuleKey, holidaysInYear } from "../data/holidays";
import { holidaySlugForName } from "../data/holidayPages";

// Finnish public-holidays hub for a year (/pyhapaivat-2026). Content-rich page
// targeting "pyhäpäivät <vuosi>" searches — a higher-volume query cluster than
// pure week-number lookups. Props come from the /:slug dispatcher; useParams is
// the fallback. Fully deterministic (no `new Date()`), so hydration is safe.
const PublicHolidays = ({ year: pYear } = {}) => {
  const params = useParams();
  const year = pYear ?? params.year;
  const y = Number(year);
  const holidays = holidaysInYear(y);
  const officialCount = holidays.filter((h) => h.official).length;
  // Every holiday falls into exactly one of three date rules (see
  // holidayDateRuleKey() in holidays.js, which derives this from the same
  // computation holidaysInYear() itself uses — not a second, hand-maintained
  // classification). Aggregated once here, rather than repeating the rule
  // type per row: the "Miten päivämäärä määräytyy?" section on each
  // individual holiday page already states its own precise rule in more
  // detail than a one-word category would add.
  const fixedCount = holidays.filter((h) => holidayDateRuleKey(h.name) === "fixed").length;
  const easterCount = holidays.filter((h) => holidayDateRuleKey(h.name) === "easter").length;
  const windowCount = holidays.filter((h) => holidayDateRuleKey(h.name) === "saturday-window").length;

  return (
    <section className="app">
      <SEO {...holidaysMeta(y)} canonical={canonicalFor(`/pyhapaivat-${year}`)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Pyhäpäivät {year}
      </div>

      <h1>Suomen pyhäpäivät {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Vuonna {year} Suomessa on{" "}
          <strong>{officialCount} virallista pyhäpäivää</strong>.
        </span>{" "}
        Lisäksi muutama laajasti vietetty vapaapäivä. Alla kaikki pyhäpäivät
        päivämäärineen, viikonpäivineen ja viikkonumeroineen.
      </p>

      <p className="note-soft">
        Näistä {fixedCount} on kiinteitä kalenteripäiviä (esim. 1. tammikuuta),
        {" "}{easterCount} lasketaan pääsiäisestä ja {windowCount} on lain
        mukaan tietylle viikolle osuvia lauantaita — siksi vain osa
        pyhäpäivistä siirtyy eri päivälle vuodesta toiseen.
      </p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pyhäpäivä</th>
              <th>Päivämäärä</th>
              <th>Viikonpäivä</th>
              <th>Viikko</th>
              <th>Tyyppi</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => {
              const wk = isoWeek(h.date);
              const wkY = isoYear(h.date);
              const holidaySlug = holidaySlugForName(h.name);
              return (
                <tr key={h.name}>
                  <td>
                    <Link to={`/pyhat-${year}/${holidaySlug}`}>{h.name}</Link>
                  </td>
                  <td>{dWritten(h.date)}</td>
                  <td>{getWeekdayName(h.date)}</td>
                  <td>
                    <Link to={`/viikko-${wk}-${wkY}`}>Viikko {wk}</Link>
                  </td>
                  <td>
                    {h.official ? (
                      <span className="tag">Virallinen arkipyhä</span>
                    ) : (
                      <span className="tag observed">Vietetään</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p>
        Muut juhlapäivät: <Link to={`/ystavanpaiva-${year}`}>ystävänpäivä {year}</Link>,{" "}
        <Link to={`/laskiainen-${year}`}>laskiainen {year}</Link>,{" "}
        <Link to={`/aitienpaiva-${year}`}>äitienpäivä {year}</Link>,{" "}
        <Link to={`/isanpaiva-${year}`}>isänpäivä {year}</Link> ja{" "}
        <Link to={`/adventti-${year}`}>adventti {year}</Link>.{" "}
        Katso myös <Link to={`/liputuspaivat-${year}`}>liputuspäivät {year}</Link>,{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät vuonna {year}</Link>,{" "}
        <Link to={`/vuosi-${year}`}>vuoden {year} viikkonumerot</Link>,{" "}
        <Link to={`/kalenteri-${year}`}>vuoden {year} kalenteri</Link> ja{" "}
        <Link to={`/tulosta-${year}`}>tulostettava viikkolista</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={`/pyhapaivat-${y - 1}`}>
            <span className="lbl">Edellinen</span>Pyhäpäivät {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={`/pyhapaivat-${y + 1}`}>
            <span className="lbl">Seuraava</span>Pyhäpäivät {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default PublicHolidays;
