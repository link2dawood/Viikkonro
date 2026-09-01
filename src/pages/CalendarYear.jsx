import { Link } from "react-router-dom";
import {
  isoWeek,
  isoYear,
  M_FULL,
  weeksInIsoYear,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import { getJuhlapaivat, getLiputuspaivat } from "../data/juhlapaivat";
import nimipaivat from "../data/nimipaivat.json";
import { hasNameDayPage, nameDaySlug } from "../data/nameDays";
import SEO from "../components/SEO";
import AdSlot from "../components/AdSlot";
import { calendarFaqs, calendarPdfPath, canonicalFor, calendarMeta } from "../data/seo";
import {
  downloadCalendarCsv,
  printableCalendarFaqs,
} from "../data/printCalendarContent";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";

// Year horizon (YEAR_MIN/YEAR_MAX) is imported from dateUtils so the pills,
// cross-links, and every page's prev/next nav share one rolling source of truth.
// getDay()-indexed Finnish weekday initials (Su, Mo, Tu, We, Th, Fr, Sa).
const WD_INITIAL = ["S", "M", "T", "K", "T", "P", "L"];

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

const CalendarYear = ({ year, half = null, print = false } = {}) => {
  const y = Number(year);
  const juhla = getJuhlapaivat(y);
  const liputus = getLiputuspaivat(y);
  const totalWeeks = weeksInIsoYear(y);
  const faqs = !half && !print ? calendarFaqs(y) : [];
  const printFaqs = print ? printableCalendarFaqs(y) : [];

  // "Today" in Europe/Helsinki. Server-rendered at build (the same current-date
  // pattern Home.jsx uses); the daily rebuild keeps it fresh and hydration
  // reconciles it to the viewer's day. Highlight only applies in the current year.
  const todayISO = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Helsinki",
  });
  const currentYear = Number(todayISO.slice(0, 4));
  const isCurrentYear = y === currentYear;
  const todayParts = todayISO.split("-").map(Number);
  const helsinkiToday = new Date(
    todayParts[0],
    todayParts[1] - 1,
    todayParts[2],
  );
  const currentWeek = isoWeek(helsinkiToday);
  const currentWeekYear = isoYear(helsinkiToday);

  const monthStart = half === 2 ? 6 : 0;
  const monthEnd = half === 1 ? 6 : 12; // exclusive
  const months = [];
  for (let m = monthStart; m < monthEnd; m++) months.push(m);

  const todayNames = isCurrentYear
    ? (nimipaivat[todayISO.slice(5)] || []).filter(
        (n) => n && !/^[A-Z]{2,}-\d/.test(n),
      )
    : [];

  const years = [];
  for (let yy = YEAR_MIN; yy <= YEAR_MAX; yy++) years.push(yy);

  const halfLabel =
    half === 1 ? ", 1. vuosipuolisko" : half === 2 ? ", 2. vuosipuolisko" : "";
  // Unambiguous half-year slugs (was -1/-2, which read as "page 2" next to
  // /kalenteri-YYYY). alkuvuosi = Jan–Jun, loppuvuosi = Jul–Dec.
  const halfSlug = half === 1 ? "alkuvuosi" : half === 2 ? "loppuvuosi" : null;
  const canonicalPath = half
    ? `/kalenteri-${y}-${halfSlug}`
    : print
      ? `/tulostettava-kalenteri-${y}`
      : `/kalenteri-${y}`;

  const buildMonth = (m) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      const mmdd = `${pad(m + 1)}-${pad(d)}`;
      const holiday = juhla.get(mmdd);
      const flag = liputus.get(mmdd);
      const isMon = dow === 1;
      const isToday = `${y}-${mmdd}` === todayISO;
      const isCurrentWeek =
        isoWeek(date) === currentWeek && isoYear(date) === currentWeekYear;
      const startsCurrentWeekSegment = isCurrentWeek && (isMon || d === 1);
      const endsCurrentWeekSegment =
        isCurrentWeek && (dow === 0 || d === daysInMonth);
      const cls = ["cal-day"];
      if (dow === 0) cls.push("sun");
      if (dow === 6) cls.push("sat");
      if (holiday) cls.push("hol");
      if (isCurrentWeek) cls.push("current-week");
      if (startsCurrentWeekSegment) cls.push("current-week-start");
      if (endsCurrentWeekSegment) cls.push("current-week-end");
      if (isToday) cls.push("today");
      rows.push(
        <div
          key={d}
          className={cls.join(" ")}
          {...(isToday ? { "aria-current": "date" } : {})}
        >
          <span className="cal-wi">{WD_INITIAL[dow]}</span>
          <span className="cal-dn">{d}</span>
          {isMon &&
            (isoYear(date) >= YEAR_MIN && isoYear(date) <= YEAR_MAX ? (
              <Link
                className="cal-wk"
                to={`/viikko-${isoWeek(date)}-${isoYear(date)}`}
              >
                vk {isoWeek(date)}
              </Link>
            ) : (
              // Boundary week whose ISO year is past the horizon (e.g. Dec 2035
              // → week 1 2036): show the number, but don't link a 404.
              <span className="cal-wk">vk {isoWeek(date)}</span>
            ))}
          {isMon && isCurrentWeek && (
            <span className="cal-current-label" aria-label="Kuluva viikko">
              Nyt
            </span>
          )}
          {holiday && (
            <span className="cal-hol" title={holiday}>
              {holiday}
            </span>
          )}
          {flag && (
            <span
              className="cal-flag"
              title={flag.join(" / ")}
              role="img"
              aria-label={flag.join(" / ")}
            >
              🇫🇮
            </span>
          )}
        </div>,
      );
    }
    return (
      <div key={m} className="cal-month">
        <Link className="cal-month-h" to={`/kuukausi-${m + 1}-${y}`}>
          {M_FULL[m]} {y}
        </Link>
        <div className="cal-days">{rows}</div>
      </div>
    );
  };

  return (
    <section className={`app cal-page${print ? " cal-print" : ""}`}>
      <SEO {...calendarMeta(y, half, print)} canonical={canonicalFor(canonicalPath)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        {half || print ? (
          <>
            <Link to={`/kalenteri-${y}`}>Kalenteri {y}</Link> /{" "}
            {print
              ? `Tulostettava A4-kuukausikalenteri ${y}`
              : `${half === 1 ? "1. vuosipuolisko" : "2. vuosipuolisko"} ${y}`}
          </>
        ) : (
          `Kalenteri ${y}`
        )}
      </div>

      <h1>
        {print
          ? `Tulostettava A4-kuukausikalenteri ${y}`
          : `Viikkokalenteri ${y}${halfLabel}`}
      </h1>

      {!half && !print ? (
        <p className="lead">
          <strong>
            Viikkokalenteri {y} näyttää vuoden kaikki {totalWeeks} viikkoa,
            viikkonumerot, päivämäärät ja Suomen juhlapäivät yhdessä näkymässä.
          </strong>{" "}
          Kalenterin voi tulostaa tai tallentaa PDF-muodossa.
          {isCurrentYear
            ? " Kuluva viikko on rajattu vihreällä ja tämä päivä korostettu."
            : ""}
        </p>
      ) : (
        <p className={print ? "lead print-support" : "lead"}>
          {print
            ? `A4-kuukausikalenteri näyttää vuoden ${y} kaikki 12 kuukautta ja ${totalWeeks} ISO-viikkoa yhdellä vaakasivulla. `
            : `Vuoden ${y} ${half === 1 ? "ensimmäinen" : "toinen"} vuosipuolisko sisältää kuusi kuukautta. `}
          Kalenteri noudattaa ISO 8601 -standardia: viikko alkaa maanantaista
          ja päättyy sunnuntaihin. Juhlapäivät ja viikkonumerot on merkitty.
          {isCurrentYear
            ? " Kuluva viikko on rajattu vihreällä ja tämä päivä korostettu."
            : ""}
        </p>
      )}

      {print && (
        <section className="print-support">
          <div className="panel">
            <div className="now-label">Tulostettava kalenteri lyhyesti</div>
            <ul>
              <li><strong>Muoto:</strong> yksi A4-vaakasivu.</li>
              <li><strong>Sisältö:</strong> 12 kuukautta ja {totalWeeks} ISO-viikkoa.</li>
              <li><strong>Merkinnät:</strong> Suomen juhla- ja liputuspäivät.</li>
              <li><strong>Tallennus:</strong> PDF tai Excel-yhteensopiva CSV.</li>
            </ul>
          </div>
          <p className="print-actions">
            <button className="btn" onClick={() => window.print()}>
              Tulosta / tallenna PDF
            </button>
            {" "}
            <button className="btn" onClick={() => downloadCalendarCsv(y)}>
              Lataa Excel-CSV
            </button>
            {" "}
            <a className="btn" href={calendarPdfPath(y)} download>
              Lataa valmis PDF ({y})
            </a>
            {" "}
            <Link className="btn" to={"/kalenteri-" + y}>
              Avaa selattava kalenteri
            </Link>
          </p>
        </section>
      )}

      {!half && !print && (
        <div className="panel noprint">
          <div className="now-label">Viikkokalenteri {y} lyhyesti</div>
          <ul className="clean">
            <li>Vuodessa {y} on {totalWeeks} ISO-viikkoa.</li>
            <li>Kalenterissa näkyvät kaikki 12 kuukautta ja viikkonumerot.</li>
            <li>Viikko alkaa maanantaina ja päättyy sunnuntaina.</li>
            <li>Suomen juhla- ja liputuspäivät on merkitty päivien yhteyteen.</li>
            <li>Kalenterin voi tulostaa tai tallentaa PDF-muodossa.</li>
          </ul>
        </div>
      )}

      <div className="pills">
        {years.map((yy) => (
          <Link
            key={yy}
            to={`/kalenteri-${yy}`}
            className={`pill ${yy === y ? "active" : ""}`}
          >
            {yy}
          </Link>
        ))}
      </div>

      <div className="pills cal-halves">
        <Link to={`/kalenteri-${y}`} className={`pill ${!half ? "active" : ""}`}>
          Koko vuosi
        </Link>
        <Link
          to={`/kalenteri-${y}-alkuvuosi`}
          className={`pill ${half === 1 ? "active" : ""}`}
        >
          1. vuosipuolisko (tammi–kesäkuu)
        </Link>
        <Link
          to={`/kalenteri-${y}-loppuvuosi`}
          className={`pill ${half === 2 ? "active" : ""}`}
        >
          2. vuosipuolisko (heinä–joulukuu)
        </Link>
      </div>

      {!print && <AdSlot placement="calendar-before-preview" />}

      <div className={`cal-grid${half ? " cal-grid-half" : ""}`}>
        {months.map(buildMonth)}
      </div>

      {todayNames.length > 0 && (
        <p className="cal-nimi">
          Tänään on nimipäivä:{" "}
          <strong>
            {todayNames.map((name, index) => (
              <span key={name}>
                {index > 0 && ", "}
                {hasNameDayPage(name) ? (
                  <Link to={`/nimipaiva/${nameDaySlug(name)}`}>{name}</Link>
                ) : name}
              </span>
            ))}
          </strong>
        </p>
      )}

      <p className="noprint">
        <button className="btn" onClick={() => window.print()}>
          Tulosta / tallenna PDF
        </button>
        {" "}
        <a className="btn" href={calendarPdfPath(y)} download>
          {half ? `Lataa koko vuoden PDF (${y})` : `Lataa valmis PDF (${y})`}
        </a>
        {!half && (
          <>
            {" "}
            <button className="btn" onClick={() => downloadCalendarCsv(y)}>
              Lataa Excel-CSV
            </button>
          </>
        )}
      </p>

      {!half && !print && (
        <section className="prose noprint">
          <h2>Miten viikkokalenteria {y} käytetään?</h2>
          <ol>
            <li>Etsi kuukausi ja päivämäärä koko vuoden viikkonäkymästä.</li>
            <li>
              Avaa viikkonumerosta viikon tarkat päivämäärät, juhlapäivät ja
              saatavilla olevat varmennetut nimipäivät. Esimerkiksi{" "}
              <Link to={`/viikko-1-${y}`}>viikko 1/{y}</Link>.
            </li>
            <li>
              Katso kaikki <Link to={`/vuosi-${y}`}>vuoden {y} viikkonumerot</Link>{" "}
              luettelona tai avaa{" "}
              <Link to={`/tulostettava-kalenteri-${y}`}>
                tulostettava A4-kalenteri
              </Link>.
            </li>
            <li>Tulosta näkymä tai tallenna se PDF-tiedostoksi painikkeesta.</li>
          </ol>

          <h2>Usein kysytyt kysymykset viikkokalenterista {y}</h2>
          {faqs.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      )}

      {print && (
        <section className="prose print-support">
          <h2>Kalenteri PDF- ja Excel-muodossa</h2>
          <p>
            Tulostuspainike avaa selaimen tulostusikkunan, jossa kalenterin voi
            tulostaa tai tallentaa PDF-tiedostoksi. CSV-lataus sisältää vuoden
            päivämäärät, ISO-viikot sekä juhla- ja liputuspäivät Exceliä,
            Numbersia ja Google Sheetsia varten.
          </p>
          <h2>Usein kysytyt kysymykset</h2>
          {printFaqs.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      )}

      <div className="cal-seealso">
        <h2 id="mh">Katso myös</h2>
        <ul className="clean">
          <li>
            <Link to={`/vuosi-${y}`}>Kaikki viikot vuonna {y}</Link>
          </li>
          <li>
            <Link to={`/pyhapaivat-${y}`}>Pyhäpäivät ja liputuspäivät {y}</Link>
          </li>
          <li>
            <Link to={`/tyopaivat-${y}`}>Työpäivät ja arkipäivät {y}</Link>
          </li>
          {/* STEP 6: link only to a CONFIRMED school-holiday page — never a
              hardcoded year check, so this can't drift out of sync with the
              actual confidence tier. */}
          {pageConfidenceTier(y) === CONFIDENCE.CONFIRMED && (
            <li>
              <Link to={`/koululomat-${y}`}>Koululomat {y} alueittain</Link>
            </li>
          )}
          <li>
            <Link to={`/tulosta-${y}`}>Tulostettava viikkolista {y}</Link>
          </li>
          {!print && (
            <li>
              <Link to={`/tulostettava-kalenteri-${y}`}>
                Tulostettava kalenteri A4 ({y})
              </Link>
            </li>
          )}
          {y - 1 >= YEAR_MIN && (
            <li>
              <Link to={`/kalenteri-${y - 1}`}>Vuoden {y - 1} kalenteri</Link>
            </li>
          )}
          {y + 1 <= YEAR_MAX && (
            <li>
              <Link to={`/kalenteri-${y + 1}`}>Vuoden {y + 1} kalenteri</Link>
            </li>
          )}
          {!half && (
            <li>
              <Link to={`/kalenteri-${y}-alkuvuosi`}>1. vuosipuolisko</Link> ·{" "}
              <Link to={`/kalenteri-${y}-loppuvuosi`}>2. vuosipuolisko</Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
};

export default CalendarYear;
