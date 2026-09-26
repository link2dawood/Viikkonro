import { useToday } from "../components/useToday";
import { Link, useParams } from "react-router-dom";
import {
  isoWeek,
  isoYear,
  dShort,
  daysInYear,
  isLeapYear,
  mondayOf,
  M_FULL,
  validateYear,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import AdSlot from "../components/AdSlot";
import { calendarPdfPath, canonicalFor, yearFaqs, yearMeta, yearStats } from "../data/seo";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";
import NotFound from "./NotFound";

const YearCalendar = ({ year: pYear } = {}) => {
  const params = useParams();
  const year = pYear ?? params.year;
  const selectedYear = Number(year);
  // Before the early return: hooks must run on every render.
  const NOW = useToday();

  if (!validateYear(selectedYear)) return <NotFound />;

  const years = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    years.push(y);
  }

  const W_NOW = isoWeek(NOW);
  const Y_NOW = isoYear(NOW);

  function weeksInIsoYear(y) {
    return isoWeek(new Date(y, 11, 28));
  }

  const weeks = Array.from(
    { length: weeksInIsoYear(selectedYear) },
    (_, i) => i + 1,
  );

  // Shared with prerender.js's yearFaqNodes() (FAQPage JSON-LD) so the
  // visible FAQ and the schema can't drift — same discipline as
  // monthFaqs()/workingDaysFaqs().
  const faqs = yearFaqs(selectedYear);
  const stats = yearStats(selectedYear);
  const leap = isLeapYear(selectedYear);

  function WeekCard({ w, y }) {
    const mo = mondayOf(w, y);
    const su = new Date(mo);
    su.setDate(mo.getDate() + 6);

    const isCurrent = w === W_NOW && y === Y_NOW;

    return (
      <Link
        className={`wk ${isCurrent ? "current" : ""}`}
        to={`/viikko-${w}-${y}`}
      >
        <div className="n">Viikko {w}</div>
        <div className="r">
          {dShort(mo)} – {dShort(su)}
        </div>
      </Link>
    );
  }

  return (
    <section className="app">
      <SEO
        {...yearMeta(selectedYear)}
        lang="fi"
        canonical={canonicalFor(`/vuosi-${year}`)}
      />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikot {year}
      </div>

      <h1>Viikkonumerot {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Vuodessa {year} on <strong>{weeks.length} viikkoa</strong>.
        </span>{" "}
        Napsauta viikkoa nähdäksesi sen päivämäärät.
      </p>

      <QuickFacts
        facts={[
          { label: "Vuosi", value: selectedYear },
          { label: "Päiviä yhteensä", value: daysInYear(selectedYear) },
          { label: "Karkausvuosi", value: leap ? "Kyllä" : "Ei" },
          { label: "Viikkoja", value: stats.weekCount },
          {
            label: "Ensimmäinen viikko",
            value: `viikko ${stats.firstWeek} (${stats.firstWeekYear})`,
          },
          {
            label: "Viimeinen viikko",
            value: `viikko ${stats.lastWeek} (${stats.lastWeekYear})`,
          },
          { label: "Työpäiviä", value: stats.working },
          { label: "Arkipyhiä", value: stats.officialHolidayCount },
        ]}
      />

      <AdSlot placement="year-summary-after-facts" />

      <div className="pills">
        {years.map((y) => (
          <Link
            key={y}
            to={`/vuosi-${y}`}
            className={`pill ${y === selectedYear ? "active" : ""}`}
          >
            {y}
          </Link>
        ))}
      </div>

      <div className="grid">
        {weeks.map((w) => (
          <WeekCard key={w} w={w} y={selectedYear} />
        ))}
      </div>
      <h2 id="mh">Viikot kuukausittain {year} </h2>
      <div className="pills">
        {M_FULL.map((month, index) => (
          <Link key={index} className="pill" to={`/kuukausi-${index + 1}-${year}`}>
            {month}
          </Link>
        ))}
      </div>
      <h2>Vuosineljännekset {year}</h2>
      <div className="pills">
        {[1, 2, 3, 4].map((q) => (
          <Link key={q} className="pill" to={`/q${q}-${year}`}>
            Q{q} {year}
          </Link>
        ))}
      </div>
      <div className="prevnext">
        {selectedYear - 1 >= YEAR_MIN && (
          <Link to={`/vuosi-${selectedYear - 1}`}>
            <span className="lbl">Edellinen</span>Viikot {selectedYear - 1}
          </Link>
        )}
        {selectedYear + 1 <= YEAR_MAX && (
          <Link className="nx" to={`/vuosi-${selectedYear + 1}`}>
            <span className="lbl">Seuraava</span>Viikot {selectedYear + 1}
          </Link>
        )}
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

      <p>
        <Link
          to={`/tulosta-${year}`}
          className="btn"
          onClick={() => window.scrollTo(0, 0)}
        >
          Tulostettava viikkolista {selectedYear}
        </Link>
        {" "}
        <a className="btn" href={calendarPdfPath(selectedYear)} download>
          Lataa PDF-kalenteri {selectedYear}
        </a>
      </p>
      <p className="hub-links">
        Katso myös <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link>,{" "}
        <Link to={`/liputuspaivat-${year}`}>liputuspäivät {year}</Link>,{" "}
        <Link to={`/tyopaivat-${year}`}>työpäivät {year}</Link>,{" "}
        <Link to={`/palkkapaivat-${year}`}>palkkapäivät {year}</Link>,{" "}
        <Link to={`/kesaaika-${year}`}>kesäaika {year}</Link>
        {/* STEP 6: Year Page → Confirmed School Holiday Page only. */}
        {pageConfidenceTier(selectedYear) === CONFIDENCE.CONFIRMED && (
          <>
            ,{" "}
            <Link to={`/koululomat-${year}`}>koululomat {year}</Link>
          </>
        )}{" "}
        ja{" "}
        <Link to="/kuinka-monta-viikkoa-vuodessa">
          miksi vuodessa on {weeks.length === 53 ? "tänä vuonna" : "joskus"} 53
          viikkoa
        </Link>
        .
      </p>
    </section>
  );
};

export default YearCalendar;
