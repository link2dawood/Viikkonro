import React from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import AdSlot from "../components/AdSlot";
import { canonicalFor, workingDaysFaqs, workingDaysMeta } from "../data/seo";
import { HOLIDAY_LEGAL_BASIS, holidaysInYear } from "../data/holidays";
import {
  M_INESSIVE,
  M_SLUG,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";

const M_FULL = [
  "Tammikuu",
  "Helmikuu",
  "Maaliskuu",
  "Huhtikuu",
  "Toukokuu",
  "Kesäkuu",
  "Heinäkuu",
  "Elokuu",
  "Syyskuu",
  "Lokakuu",
  "Marraskuu",
  "Joulukuu",
];

// Working-days hub for a year (/tyopaivat-2026). Targets "montako työpäivää
// vuonna <y>" and payroll/HR queries — commercial intent, and neither
// competitor covers it. A työpäivä here is Mon–Fri that is not an official
// public holiday (arkipyhä). Purely a function of the year, so SSR and client
// hydration produce identical output.
const WorkingDays = ({ year: pYear } = {}) => {
  const params = useParams();
  const year = pYear ?? params.year;
  const y = Number(year);

  const officialSet = new Set(
    holidaysInYear(y)
      .filter((h) => h.official)
      .map((h) => h.date.toDateString()),
  );

  const months = Array.from({ length: 12 }, () => ({
    working: 0,
    weekend: 0,
    holiday: 0,
  }));
  let totalWorking = 0;
  let totalWeekend = 0;
  let totalHoliday = 0;

  const d = new Date(y, 0, 1);
  while (d.getFullYear() === y) {
    const mi = d.getMonth();
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      months[mi].weekend += 1;
      totalWeekend += 1;
    } else if (officialSet.has(d.toDateString())) {
      months[mi].holiday += 1;
      totalHoliday += 1;
    } else {
      months[mi].working += 1;
      totalWorking += 1;
    }
    d.setDate(d.getDate() + 1);
  }

  // Shared with prerender.js's FAQPage JSON-LD (workingDaysFaqNodes) so the
  // visible list and the schema can't drift — same discipline as the
  // calendar page's calendarFaqs().
  const faqs = workingDaysFaqs(y);

  return (
    <section className="app">
      <SEO {...workingDaysMeta(y)} canonical={canonicalFor(`/tyopaivat-${year}`)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${year}`}>Viikot {year}</Link> / Työpäivät {year}
      </div>

      <h1>Työpäivät {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Vuonna {year} on <strong>{totalWorking} työpäivää</strong>.
        </span>{" "}
        Työpäivä tarkoittaa maanantaista perjantaihin osuvaa päivää, joka ei
        ole virallinen arkipyhä.
      </p>

      <QuickFacts
        variant="stats"
        facts={[
          { label: "Työpäivää", value: totalWorking },
          { label: "Viikonlopun päivää", value: totalWeekend },
          { label: "Arkipyhää (ma–pe)", value: totalHoliday },
        ]}
      />

      <AdSlot placement="working-days-after-result" format="rectangle" />

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kuukausi</th>
              <th className="num">Työpäivät</th>
              <th className="num">Viikonloput</th>
              <th className="num">Arkipyhät</th>
              <th>Tarkemmin</th>
            </tr>
          </thead>
          <tbody>
            {months.map((mo, i) => (
              <tr key={i}>
                <td>
                  <Link to={`/kuukausi-${i + 1}-${year}`}>{M_FULL[i]}</Link>
                </td>
                <td className="num">{mo.working}</td>
                <td className="num">{mo.weekend}</td>
                <td className="num">{mo.holiday}</td>
                <td>
                  <Link to={`/tyopaivat-${M_SLUG[i]}-${year}`}>
                    Työpäivät {M_INESSIVE[i]} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note-soft">
        Laskutapa: työpäiviksi lasketaan maanantai–perjantai, joista on
        vähennetty viralliset arkipyhät. Jouluaatto ja juhannusaatto ovat monilla
        työpaikoilla vapaita, mutta eivät ole virallisia arkipyhiä — toisin kuin
        esimerkiksi itsenäisyyspäivä, josta on erikseen säädetty lailla{" "}
        {HOLIDAY_LEGAL_BASIS["Itsenäisyyspäivä"].act} — joten jouluaatto ja
        juhannusaatto sisältyvät yllä työpäiviin.
      </p>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p>
        Katso myös <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/vuosi-${year}`}>vuoden {year} viikkonumerot</Link>,{" "}
        <Link to={`/kalenteri-${year}`}>vuoden {year} kalenteri</Link> ja{" "}
        <Link to={`/tulosta-${year}`}>tulostettava viikkolista</Link>.
      </p>

      <p>
        Laskurit: <Link to="/tyopaivalaskuri">työpäivälaskuri</Link> (työpäivät
        kahden päivämäärän välillä) ja{" "}
        <Link to="/paivien-erotus">päivien erotus</Link>. Lomasuunnitteluun:{" "}
        <Link to="/vuosilomalaskuri">vuosilomalaskuri</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={`/tyopaivat-${y - 1}`}>
            <span className="lbl">Edellinen</span>Työpäivät {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={`/tyopaivat-${y + 1}`}>
            <span className="lbl">Seuraava</span>Työpäivät {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default WorkingDays;
