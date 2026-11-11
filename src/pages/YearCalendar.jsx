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
  WD,
  fmtShortFi,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import AdSlot from "../components/AdSlot";
import YearActions from "../components/YearActions";
import { calendarPdfPath, canonicalFor, yearAnswer, yearFaqs, yearMeta, yearStats } from "../data/seo";
import { CONFIDENCE, pageConfidenceTier, schoolHolidayPage } from "../data/schoolHolidayPages";
import { getJuhlapaivat } from "../data/juhlapaivat";
import { holidaysInYear } from "../data/holidays";
import NotFound from "./NotFound";

function CalendarPreview({ year, juhla }) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const weekdays = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];

  return (
    <div className="cal-preview-wrap">
      <div className="cal-preview-grid">
        {months.map((m) => {
          const monthName = M_FULL[m];
          const firstDate = new Date(year, m, 1);
          const daysInM = new Date(year, m + 1, 0).getDate();
          const firstWeekday = (firstDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
          const firstWk = isoWeek(firstDate);
          const lastWk = isoWeek(new Date(year, m, daysInM));

          const cells = [];
          for (let i = 0; i < firstWeekday; i++) {
            cells.push({ key: `empty-${i}`, empty: true });
          }
          for (let d = 1; d <= daysInM; d++) {
            const dateObj = new Date(year, m, d);
            const wdIdx = (dateObj.getDay() + 6) % 7;
            const isWeekend = wdIdx === 5 || wdIdx === 6;
            const mmdd = `${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const holidayName = juhla.get(mmdd);
            cells.push({
              key: `day-${d}`,
              d,
              isWeekend,
              holidayName,
              isoDate: `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            });
          }

          return (
            <div key={m} className="cal-preview-month">
              <div className="cal-preview-month-header">
                <Link to={`/kuukausi-${m + 1}-${year}`} className="cal-preview-month-title">
                  {monthName}
                </Link>
                <span className="cal-preview-month-weeks">Vk {firstWk === lastWk ? firstWk : `${firstWk}-${lastWk}`}</span>
              </div>
              <div className="cal-preview-weekdays">
                {weekdays.map((wd) => (
                  <span key={wd}>{wd}</span>
                ))}
              </div>
              <div className="cal-preview-days">
                {cells.map((c) =>
                  c.empty ? (
                    <span key={c.key} className="cal-preview-day empty" aria-hidden="true" />
                  ) : (
                    <Link
                      key={c.key}
                      to={`/viikonpaiva?paiva=${c.isoDate}`}
                      className={`cal-preview-day${c.isWeekend ? " weekend" : ""}${c.holidayName ? " holiday" : ""}`}
                      title={c.holidayName ? `${c.d}.${m + 1}.${year} (${c.holidayName})` : `${c.d}.${m + 1}.${year}`}
                    >
                      {c.d}
                    </Link>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="cal-preview-legend" aria-label="Kalenterin väriselitteet">
        <span className="cal-legend-item">
          <span className="cal-legend-dot workday" aria-hidden="true" /> Arkipäivät
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot weekend" aria-hidden="true" /> Viikonloput (la, su)
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot holiday" aria-hidden="true" /> Viralliset pyhäpäivät ja arkipyhät
        </span>
      </div>
      <p>
        <Link to={`/kalenteri-${year}`} className="btn">
          Katso koko kalenteri {year} →
        </Link>
      </p>
    </div>
  );
}

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
  const juhla = getJuhlapaivat(selectedYear);
  const yearHolidays = [...holidaysInYear(selectedYear)].sort((a, b) => a.date - b.date);
  const weekdaysCount = daysInYear(selectedYear) - stats.weekend;

  function WeekCard({ w, y }) {
    const mo = mondayOf(w, y);
    const su = new Date(mo);
    su.setDate(mo.getDate() + 6);

    const isCurrent = w === W_NOW && y === Y_NOW;
    const isEven = w % 2 === 0;

    return (
      <Link
        className={`wk ${isCurrent ? "current" : ""} ${isEven ? "wk-even" : "wk-odd"}`}
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
  const dec31 = new Date(selectedYear, 11, 31);
  const jan1Week = isoWeek(jan1);
  const jan1IsoYear = isoYear(jan1);
  const startsOnPrevYearWeek = jan1IsoYear !== selectedYear;
  const dec31Week = isoWeek(dec31);
  const dec31IsoYear = isoYear(dec31);

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
        Tältä sivulta löydät kaikki vuoden {selectedYear} viikkonumerot, viikkojen päivämäärät,
        kuukausikalenterit, pyhäpäivät ja työpäivät. Voit myös tarkistaa vuoden viikkorakenteen ja
        ladata tulostettavan kalenterin.
      </p>

      <YearActions year={selectedYear} view="vuosi" />

      <h2>Vuoden {selectedYear} tärkeimmät tiedot</h2>
      <p>
        Vuoden {selectedYear} kalenterista näet helposti vuoden kokonaispäivämäärän, viikkonumerot
        ja työpäivien määrän.
      </p>

      <div className="year-overview-stats">
        <div className="stat-card">
          <span className="val">{daysInYear(selectedYear)}</span>
          <span className="label">Päiviä yhteensä</span>
          <span className="sub">Koko kalenterivuosi 1.1.-31.12.</span>
        </div>
        <div className="stat-card">
          <span className="val">{stats.weekCount}</span>
          <span className="label">ISO-viikkoja</span>
          <span className="sub">Virallista viikkoa standardin mukaan</span>
        </div>
        <div className="stat-card">
          <span className="val">{leap ? "Kyllä" : "Ei"}</span>
          <span className="label">Karkausvuosi</span>
          <span className="sub">Helmikuussa {leap ? 29 : 28} päivää</span>
        </div>
        <div className="stat-card">
          <span className="val">{weekdaysCount}</span>
          <span className="label">Arkipäiviä</span>
          <span className="sub">Maanantaista perjantaihin</span>
        </div>
        <div className="stat-card">
          <span className="val">{stats.working}</span>
          <span className="label">Työpäiviä</span>
          <span className="sub">Arkipäivät miinus arkipyhät</span>
        </div>
        <div className="stat-card">
          <span className="val">{stats.weekend}</span>
          <span className="label">Viikonloppuja</span>
          <span className="sub">{stats.weekend / 2} lauantaita ja {stats.weekend / 2} sunnuntaita</span>
        </div>
        <div className="stat-card">
          <span className="val">{stats.workdayHolidays}</span>
          <span className="label">Arkipyhiä</span>
          <span className="sub">Arkipäivälle osuvat viralliset pyhät</span>
        </div>
      </div>

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
          { label: "Arkipyhiä", value: stats.workdayHolidays },
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

      <h2>Vuoden {selectedYear} vuosikalenteri</h2>
      <p>
        Vuoden {selectedYear} vuosikalenterista näet kaikki kuukaudet, viikonpäivät ja viikkonumerot
        yhdellä silmäyksellä. Kalenteriviikko alkaa maanantaina ja päättyy sunnuntaina ISO 8601
        -standardin mukaisesti. Viikkonumerot helpottavat esimerkiksi työvuorojen, tapaamisten,
        projektien ja lomien suunnittelua.
      </p>

      <CalendarPreview year={selectedYear} juhla={juhla} />

      <section className="prose">
        <h2>Miten vuoden {selectedYear} viikkonumerot määräytyvät?</h2>
        <p>
          Vuonna {selectedYear} on {stats.weekCount} ISO-viikkoa. Viikot alkavat maanantaina ja
          päättyvät sunnuntaina.
        </p>
        <p>
          ISO 8601 -standardin mukaan vuoden ensimmäinen viikko on se viikko, johon vuoden
          ensimmäinen torstai kuuluu. Sama sääntö voidaan ilmaista myös niin, että viikko 1 sisältää
          tammikuun 4. päivän (tai vähintään neljä uuden vuoden päivää).
        </p>
        {startsOnPrevYearWeek && (
          <>
            <h3>Miksi vuosi {selectedYear} alkaa viikolla {jan1Week}?</h3>
            <p>
              Tämän vuoksi 1. tammikuuta {selectedYear} kuuluu vielä vuoden {jan1IsoYear} viimeiseen
              viikkoon eli viikkoon {jan1Week} (
              <Link to={`/viikko-${jan1Week}-${jan1IsoYear}`}>
                viikko {jan1Week}/{jan1IsoYear}
              </Link>
              ). Vuoden {selectedYear} ensimmäinen ISO-viikko alkaa maanantaina{" "}
              {fmtShortFi(mondayOf(1, selectedYear))} ja päättyy sunnuntaina{" "}
              {fmtShortFi(new Date(mondayOf(1, selectedYear).getTime() + 6 * 86400000))}.
            </p>
          </>
        )}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Päivämäärä</th>
                <th scope="col">Viikonpäivä</th>
                <th scope="col">Viikko</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1.1.{selectedYear}</td>
                <td>{WD[jan1.getDay()]}</td>
                <td>{jan1Week} / {jan1IsoYear}</td>
              </tr>
              <tr>
                <td>{fmtShortFi(mondayOf(1, selectedYear))}</td>
                <td>Maanantai</td>
                <td>1 / {selectedYear}</td>
              </tr>
              <tr>
                <td>31.12.{selectedYear}</td>
                <td>{WD[dec31.getDay()]}</td>
                <td>{dec31Week} / {dec31IsoYear}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Lisätietoja löydät sivulta{" "}
          <Link to="/mika-on-viikkonumero">Miten viikkonumero määräytyy?</Link> ja{" "}
          <Link to="/menetelma">Laskentamenetelmä</Link>.
        </p>
      </section>

      <h2>Kaikki vuoden {selectedYear} viikot</h2>
      <p>
        Alta löydät vuoden {selectedYear} kaikki {weeks.length} ISO-viikkoa päivämäärineen (Viikot {selectedYear}).
        Valitse viikko nähdäksesi sen alkamis- ja päättymispäivän sekä viikon kaikki päivämäärät.
      </p>
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

      <h2 id="mh">Vuoden {selectedYear} viikot kuukausittain</h2>
      <p>
        Valitse kuukausi nähdäksesi sen kalenterin ja kuukausiin sijoittuvat viikkonumerot.
      </p>
      <div className="pills">
        {M_FULL.map((month, index) => (
          <Link key={index} className="pill" to={`/kuukausi-${index + 1}-${year}`}>
            {month} {selectedYear}
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

      <section className="prose">
        <h2>Pyhäpäivät ja työpäivät vuonna {selectedYear}</h2>
        <p>
          Vuoden {selectedYear} pyhäpäivät vaikuttavat työpäivien määrään. Osa pyhäpäivistä osuu
          arkipäiville ja osa viikonlopuille.
        </p>
        <p>
          Työpäivien laskennassa on tärkeää erottaa toisistaan maanantaista perjantaihin osuvat
          päivät, viikonloput ja viralliset pyhäpäivät.
        </p>
        <p>
          Vuonna {selectedYear} on {weekdaysCount} arkipäivää maanantaista perjantaihin laskettuna.
          Kun niistä vähennetään {stats.workdayHolidays} arkipäivälle osuvaa virallista
          pyhäpäivää, työpäiviä jää {stats.working} tämän laskentatavan mukaan.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Päivämäärä</th>
                <th scope="col">Viikonpäivä</th>
                <th scope="col">Pyhäpäivä</th>
                <th scope="col">Vaikutus työpäiviin</th>
              </tr>
            </thead>
            <tbody>
              {yearHolidays.map((h) => {
                const d = h.date;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <tr key={h.name + d.toISOString()}>
                    <td>{d.getDate()}.{d.getMonth() + 1}.{selectedYear}</td>
                    <td>{WD[d.getDay()]}</td>
                    <td><strong>{h.name}</strong></td>
                    <td>
                      {h.official
                        ? isWeekend
                          ? "Virallinen pyhä (viikonloppuna, ei vähennä arkipäiviä)"
                          : "Virallinen arkipyhä (vähentää työpäivän)"
                        : "Aattopäivä (ei lakisääteinen pyhä, usein TES-vapaa)"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          Lopullinen laskentaperuste ja käytetty pyhäpäiväluettelo on kuvattu laskentamenetelmässä.
          Työehtosopimuksen mukaiset vapaat (kuten aatot) voivat muuttaa todellista työpäivien määrää.
        </p>
        <p>
          <Link to={`/pyhapaivat-${selectedYear}`} className="btn">
            Katso kaikki pyhäpäivät {selectedYear} →
          </Link>
          {" "}
          <Link to={`/tyopaivat-${selectedYear}`} className="btn">
            Tarkista työpäivät {selectedYear} →
          </Link>
        </p>
      </section>

      <section className="prose">
        <h2>Lataa vuoden {selectedYear} kalenteri</h2>
        <p>
          Haluatko suunnitella tulevaa vuotta paperilla tai tallentaa kalenterin omalle laitteellesi?
          Voit ladata vuoden {selectedYear} tulostettavan kalenterin ja viikkolistan. Niiden avulla
          näet päivämäärät, viikonpäivät ja viikkonumerot helposti myös ilman verkkoyhteyttä.
        </p>
        <div className="downloads-grid">
          <article className="download-card">
            <h3>Vuoden {selectedYear} PDF-kalenteri</h3>
            <p className="desc">
              Tulostettava kalenteri vuoden {selectedYear} päivämäärille ja viikkonumeroille. Sisältää
              koko vuoden A4-vaakanäkymän sekä Suomen juhla- ja liputuspäivät.
            </p>
            <div className="meta-row">
              <span>Muoto: PDF</span>
              <span>Sivukoko: A4</span>
            </div>
            <div className="actions">
              <a className="btn" href={calendarPdfPath(selectedYear)} download>
                Lataa PDF-kalenteri {selectedYear}
              </a>
            </div>
          </article>

          <article className="download-card">
            <h3>Vuoden {selectedYear} viikkolista</h3>
            <p className="desc">
              Kaikki vuoden {selectedYear} ISO-viikot alkamis- ja päättymispäivineen selkeänä,
              tulostusystävällisenä taulukkona.
            </p>
            <div className="meta-row">
              <span>Muoto: Tuloste / CSV</span>
              <span>Viikkoja: {stats.weekCount}</span>
            </div>
            <div className="actions">
              <Link className="btn" to={`/tulosta-${selectedYear}`}>
                Avaa viikkolista {selectedYear}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="prose">
        <h2>Laskennan tarkkuus ja tietolähteet</h2>
        <p>
          Viikko Nro käyttää viikkonumeroiden laskennassa kansainvälistä ISO 8601 -standardia.
          Viikko alkaa maanantaina ja päättyy sunnuntaina. Vuoden ensimmäinen viikko määräytyy vuoden
          ensimmäisen torstain perusteella.
        </p>
        <p>
          Kalenteripäivien, viikkonumeroiden ja pyhäpäivien tiedot tuotetaan dokumentoitujen
          laskentasääntöjen ja tarkistettujen tietolähteiden perusteella.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Määritys</th>
                <th scope="col">Käytetty sääntö / määritys</th>
                <th scope="col">Lähde ja viite</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Kalenterijärjestelmä</th>
                <td>Gregoriaaninen kalenteri</td>
                <td>Proleptinen gregoriaaninen kalenteri</td>
              </tr>
              <tr>
                <th scope="row">Viikkonumerointi</th>
                <td>ISO 8601 -standardi</td>
                <td>
                  <a href="https://www.iso.org/iso-8601-date-and-time-format.html" rel="external noopener">
                    ISO: Date and time format
                  </a>
                </td>
              </tr>
              <tr>
                <th scope="row">Viikon alkamispäivä</th>
                <td>Maanantai</td>
                <td>SFS-EN 28601 / ISO 8601</td>
              </tr>
              <tr>
                <th scope="row">Viikkovuoden määräytyminen</th>
                <td>Ensimmäisen torstain sääntö (viikko 1 sisältää 4.1.)</td>
                <td>ISO 8601 clause 3.2.2</td>
              </tr>
              <tr>
                <th scope="row">Työpäivämenetelmä</th>
                <td>{weekdaysCount} arkipäivää (ma-pe) - {stats.workdayHolidays} arkipyhää = {stats.working} työpäivää</td>
                <td>
                  <Link to={`/tyopaivat-${selectedYear}`}>Työpäivät {selectedYear}</Link>{" "}
                  ja <Link to="/kuinka-monta-tyopaivaa-vuodessa">laskennan määritelmä</Link>
                </td>
              </tr>
              <tr>
                <th scope="row">Lakisääteiset pyhät</th>
                <td>Kirkkolaki ja Suomen säädöskokoelma</td>
                <td>
                  <a href="https://www.finlex.fi/" rel="external noopener">Finlex</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Tarkemmat laskentamenetelmät on kuvattu sivulla <Link to="/menetelma">Laskentamenetelmä</Link> ja
          tietolähteiden taustat sivulla <Link to="/tietolahteet">Tietolähteet</Link>.
          Laskentasäännöt ja aineistot tarkistettu 11.11.2026.
        </p>
      </section>

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
        {pageConfidenceTier(selectedYear) === CONFIDENCE.CONFIRMED && (
          <>
            ,{" "}
            <Link to={`/koululomat-${year}`}>koululomat {year}</Link>
          </>
        )}{" "}
        ja{" "}
        <Link to="/kuinka-monta-viikkoa-vuodessa">
          miksi vuodessa on {weeks.length === 53 ? "tänä vuonna" : "joskus"} 53 viikkoa
        </Link>
        .
      </p>
    </section>
  );
};

export default YearCalendar;
