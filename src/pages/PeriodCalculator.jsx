import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi, WD_ESSIVE } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import {
  DEFAULT_BLEEDING,
  DEFAULT_CYCLE,
  FACTS_CHECKED,
  INPUT_CYCLE,
  PERIOD_PATH,
  PERIOD_STEPS,
  SOURCES,
  periodFaqs,
  periodReport,
} from "../data/periodCalculator";

function parse(str) {
  const p = (str || "").split("-").map(Number);
  if (p.length !== 3 || p.some(Number.isNaN) || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const range = (a, b) => `${dm(a)}-${dm(b)}${b.getFullYear()}`;

// The next six cycles. Renders nothing without a usable report.
export const PeriodDetails = ({ r }) => {
  if (!r || r.future) return null;
  return (
    <section className="prose">
      <h2>Seuraavat kuusi kiertoa</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Kuukautiset alkavat</th>
              <th scope="col">Arvioitu ovulaatio</th>
              <th scope="col">Hedelmälliset päivät</th>
            </tr>
          </thead>
          <tbody>
            {r.upcoming.map((c) => (
              <tr key={c.start.getTime()}>
                <th scope="row">
                  {dm(c.start)}
                  {c.start.getFullYear()} (
                  <Link to={`/viikko-${c.week}-${c.weekYear}`}>vk {c.week}</Link>)
                </th>
                <td>{range(c.ovulationFrom, c.ovulationTo)}</td>
                <td>{range(c.fertileFrom, c.fertileTo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// Period calculator (/kuukautislaskuri). The start date starts empty, so
// nothing personal is prerendered; "today" comes from useToday().
const PeriodCalculator = () => {
  const today = useToday();
  const [date, setDate] = useState("");
  const [cycle, setCycle] = useState(String(DEFAULT_CYCLE));
  const [bleeding, setBleeding] = useState(String(DEFAULT_BLEEDING));
  const r = periodReport({ lastStart: parse(date), cycle, bleeding }, today);
  const faqs = periodFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[PERIOD_PATH]} canonical={canonicalFor(PERIOD_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Kuukautislaskuri
      </div>
      <h1>Kuukautislaskuri: seuraavat kuukautiset ja ovulaatio</h1>
      <p className="lead">
        <span className="answer-sentence">
          Seuraavat kuukautiset alkavat arviolta kierron pituuden verran
          edellisten alusta, ja ovulaatio on noin 12-14 päivää ennen seuraavia
          kuukautisia.
        </span>{" "}
        Laskuri näyttää seuraavien kuukautisten päivän, arvioidun ovulaation ja
        hedelmälliset päivät.
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="k-date">Viimeisten kuukautisten 1. päivä</label>
            <input type="date" id="k-date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="k-cycle">Kierron pituus (päivää)</label>
            <input
              type="number"
              id="k-cycle"
              min={INPUT_CYCLE.min}
              max={INPUT_CYCLE.max}
              inputMode="numeric"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="k-bleeding">Vuodon kesto (päivää)</label>
            <input
              type="number"
              id="k-bleeding"
              min="1"
              max="10"
              inputMode="numeric"
              value={bleeding}
              onChange={(e) => setBleeding(e.target.value)}
            />
          </div>
        </div>
        {r && !r.future ? (
          <div className="result" aria-live="polite">
            <div className="main-text">
              Seuraavat kuukautiset: <span className="num">{fmtFullFi(r.next)}</span>
            </div>
            <div className="sub">
              {WD_ESSIVE[r.next.getDay()]},{" "}
              {r.daysToNext === 0 ? "tänään" : `${r.daysToNext} päivän päästä`} · tänään on
              kierron {r.cycleDay}. päivä
            </div>
            <div className="sub">
              Arvioitu ovulaatio {range(r.current.ovulationFrom, r.current.ovulationTo)} ·
              hedelmälliset päivät {range(r.current.fertileFrom, r.current.fertileTo)}
            </div>
            {!r.normal && (
              <div className="sub">
                Normaali kuukautiskierron pituus on 21-35 vuorokautta. Syöttämäsi
                kierto on tämän ulkopuolella, joten arvio on epävarmempi.
              </div>
            )}
          </div>
        ) : r?.future ? (
          <p className="note-soft">Valitse päivä, joka on tänään tai aiemmin.</p>
        ) : (
          <p className="note-soft">Valitse viimeisten kuukautisten ensimmäinen päivä.</p>
        )}
      </div>

      <p className="note-soft">
        Laskuri antaa arvion keskimääräisen kierron perusteella. Ovulaation
        ajankohta vaihtelee kierrosta toiseen, eikä laskuri sovellu ehkäisyyn.
      </p>

      <PeriodDetails r={r} />

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Näin käytät kuukautislaskuria</h2>
        <ol>
          {PERIOD_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Näin laskuri laskee</h2>
        <ul>
          <li>
            <strong>Kierron pituus</strong> lasketaan ensimmäisestä vuotopäivästä
            seuraavan vuodon alkamispäivään. Normaali kierto on 21-35 vuorokautta.
          </li>
          <li>
            <strong>Ovulaatio</strong> tapahtuu noin 12-14 päivää ennen seuraavan
            kuukautisvuodon alkua, joten laskuri näyttää sen päivämäärävälinä.
          </li>
          <li>
            <strong>Hedelmälliset päivät</strong> ovat viisi päivää ennen
            arvioitua ovulaatiota sekä ovulaatiopäivät, koska siittiöt elävät
            noin 3-4 vuorokautta ja raskaus voi alkaa jopa 5-6 päivää ennen
            ovulaatiota tapahtuneista yhdynnöistä.
          </li>
          <li>
            Syöttämääsi päivää ei tallenneta mihinkään: laskenta tapahtuu vain
            omassa selaimessasi.
          </li>
        </ul>
        <p className="note-soft">
          Lähteet: Terveyskylä,{" "}
          <a href={SOURCES.cycle} target="_blank" rel="noopener noreferrer">
            normaali kuukautiskierto
          </a>{" "}
          ja{" "}
          <a href={SOURCES.fertile} target="_blank" rel="noopener noreferrer">
            hedelmällinen aika kuukautiskierrossa
          </a>{" "}
          (tarkistettu {FACTS_CHECKED}).
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös <Link to="/raskauslaskuri">raskauslaskuri</Link>,{" "}
        <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
        <Link to="/paivien-erotus">päivien erotus</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default PeriodCalculator;
