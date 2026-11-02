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
import YearActions from "../components/YearActions";
import { calendarPdfPath, canonicalFor, yearAnswer, yearFaqs, yearMeta, yearStats } from "../data/seo";
import { CONFIDENCE, pageConfidenceTier, schoolHolidayPage } from "../data/schoolHolidayPages";
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
          {dShort(mo)} - {dShort(su)}
        </div>
      </Link>
    );
  }

  const schoolPage = schoolHolidayPage(selectedYear);
  const winterWeeks = schoolPage?.winter?.map((w) => w.week) || [];
  const jan1 = new Date(selectedYear, 0, 1);
  const jan1Week = isoWeek(jan1);
  const jan1IsoYear = isoYear(jan1);
  const startsOnPrevYearWeek = jan1IsoYear !== selectedYear;

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

      <h1>Viikkokalenteri {year}: viikkonumerot ja viikot</h1>

      <p className="lead">
        <strong className="answer-sentence">{yearAnswer(selectedYear)}</strong>{" "}
        Napsauta viikkoa nähdäksesi sen päivämäärät.
      </p>

      <YearActions year={selectedYear} view="vuosi" />

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

      <h2>Viikot {selectedYear}</h2>
      <div className="grid">
        {weeks.map((w) => (
          <WeekCard key={w} w={w} y={selectedYear} />
        ))}
      </div>

      {winterWeeks.length > 0 && (
        <section className="prose">
          <h2>Hiihtolomaviikot {selectedYear}: {winterWeeks.slice(0, -1).join(", ")} ja {winterWeeks[winterWeeks.length - 1]}</h2>
          <p>
            Koulujen talvilomat ja hiihtolomat vuonna {selectedYear} jakautuvat
            eri kunnissa viikoille {winterWeeks.slice(0, -1).join(", ")} ja {winterWeeks[winterWeeks.length - 1]}.
            Katso tarkat tiedot sivulta{" "}
            <Link to={`/koululomat-${selectedYear}`}>koululomat {selectedYear}</Link>.
          </p>
          <ul>
            {schoolPage.winter.map((group) => (
              <li key={group.week}>
                <Link to={`/viikko-${group.week}-${selectedYear}`}>Viikko {group.week}</Link>: {group.cities.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {startsOnPrevYearWeek && (
        <section className="prose">
          <h2>Miksi vuosi {selectedYear} alkaa viikolla {jan1Week}?</h2>
          <p>
            Vuoden {selectedYear} ensimmäinen päivä 1.1.{selectedYear} kuuluu vielä
            edellisen vuoden viimeiseen viikkoon,{" "}
            <Link to={`/viikko-${jan1Week}-${jan1IsoYear}`}>viikko {jan1Week}/{jan1IsoYear}</Link>.
            ISO 8601 -standardin mukaan viikon vuosi määräytyy sen torstain mukaan:
            jos vuoden ensimmäinen päivä on perjantai, lauantai tai sunnuntai, se
            kuuluu edellisen vuoden viimeiseen viikkoon.
          </p>
        </section>
      )}
      <section className="prose" id="parilliset-ja-parittomat-viikot">
        <h2>Parilliset ja parittomat viikot {year}</h2>
        <p>
          Vuonna {year} on {weeks.filter((w) => w % 2 === 0).length} parillista ja{" "}
          {weeks.filter((w) => w % 2 !== 0).length} paritonta ISO-viikkoa.
          Viikot alkavat maanantaina ja päättyvät sunnuntaina.
        </p>
        {[0, 1].map((remainder) => (
          <div key={remainder}>
            <h3>{remainder === 0 ? "Parilliset viikot" : "Parittomat viikot"}</h3>
            <div className="pills">
              {weeks.filter((w) => w % 2 === remainder).map((w) => (
                <Link className="pill" key={w} to={`/viikko-${w}-${selectedYear}`}>
                  Viikko {w}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <p>
          Viikon 53 jälkeen alkava viikko 1 on myös pariton.
          <Link to="/parillinen-pariton-viikko"> Tarkista kuluvan viikon parillisuus</Link>.
        </p>
      </section>
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
        <Link to={`/kelan-maksupaivat-${year}`}>Kelan maksupäivät {year}</Link>,{" "}
        <Link to={`/elakkeen-maksupaivat-${year}`}>eläkkeen maksupäivät {year}</Link>,{" "}
        <Link to={`/isanpaiva-${year}`}>isänpäivä {year}</Link>,{" "}
        <Link to={`/aitienpaiva-${year}`}>äitienpäivä {year}</Link>,{" "}
        <Link to={`/laskiainen-${year}`}>laskiainen {year}</Link>,{" "}
        <Link to={`/adventti-${year}`}>adventti {year}</Link>,{" "}
        <Link to={`/kuun-vaiheet-${year}`}>kuun vaiheet {year}</Link>,{" "}
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
