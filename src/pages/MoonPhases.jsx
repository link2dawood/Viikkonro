import { Link } from "react-router-dom";
import {
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
  fmtFullFi,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { useToday } from "../components/useToday";
import { canonicalFor } from "../data/seo";
import {
  NASA_PHASES_URL,
  PHASES,
  PHASES_CHECKED,
  blueMoons,
  monthTable,
  moonFaqs,
  moonMeta,
  moonPath,
  moonToday,
  phaseList,
} from "../data/moonPhases";

const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const WeekLink = ({ e }) => <Link to={`/viikko-${e.week}-${e.weekYear}`}>viikko {e.week}</Link>;

// "Kuu tänään": only on the current year's page, from useToday() (the
// prerendered day during hydration, the live day right after).
const MoonNow = ({ today }) => {
  const now = moonToday(today);
  return (
    <div className="result" aria-live="polite">
      <div className="main-text">
        {now.onToday ? (
          <>
            Tänään on <span className="num">{now.onToday.name.toLowerCase()}</span> klo {now.onToday.time}
          </>
        ) : (
          <>
            Kuu on nyt <span className="num">{now.waxing ? "kasvava" : "vähenevä"}</span>
          </>
        )}
      </div>
      <div className="sub">
        Seuraava täysikuu: {now.nextFull.weekdayEssive} {fmtFullFi(now.nextFull.date)} klo{" "}
        {now.nextFull.time}. Seuraava uusikuu: {dm(now.nextNew.date)} klo {now.nextNew.time}.
      </div>
    </div>
  );
};

// Moon phases for a year (/kuun-vaiheet-2026): every phase in Finnish time,
// full moons and new moons as their own lists, and a month table.
const MoonPhases = ({ year }) => {
  const y = Number(year);
  const today = useToday();
  const full = phaseList(y, "taysikuu");
  const nw = phaseList(y, "uusikuu");
  const blue = blueMoons(y);
  const months = monthTable(y);
  const faqs = moonFaqs(y);

  return (
    <section className="app">
      <SEO {...moonMeta(y)} canonical={canonicalFor(moonPath(y))} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${y}`}>Viikot {y}</Link> / Kuun vaiheet {y}
      </div>

      <h1>Kuun vaiheet {y}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Vuonna {y} on <strong>{full.length} täysikuuta</strong>. Ensimmäinen
          täysikuu on {full[0].weekdayEssive} {fmtFullFi(full[0].date)} klo{" "}
          {full[0].time} ja viimeinen {dm(full[full.length - 1].date)} klo{" "}
          {full[full.length - 1].time}.
        </span>{" "}
        Kaikki ajat ovat Suomen aikaa.
      </p>

      {today.getFullYear() === y && (
        <section className="lookup" aria-labelledby="moon-now">
          <h2 id="moon-now">Kuu tänään</h2>
          <MoonNow today={today} />
        </section>
      )}

      <QuickFacts
        facts={[
          { label: "Täysikuita", value: full.length },
          { label: "Uusiakuita", value: nw.length },
          { label: "Sininen kuu", value: blue.length ? blue.map((e) => dm(e.date)).join(", ") : "Ei" },
          { label: "Ensimmäinen täysikuu", value: dm(full[0].date) },
        ]}
      />

      <section className="prose">
        <h2>Täysikuut {y}</h2>
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Päivämäärä</th>
              <th scope="col">Viikonpäivä</th>
              <th scope="col">Kellonaika</th>
              <th scope="col">Viikko</th>
            </tr>
          </thead>
          <tbody>
            {full.map((e) => (
              <tr key={e.instant.getTime()}>
                <th scope="row">
                  {fmtFullFi(e.date)}
                  {blue.includes(e) ? " (sininen kuu)" : ""}
                </th>
                <td>{e.weekday}</td>
                <td>klo {e.time}</td>
                <td>
                  <WeekLink e={e} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Uudetkuut {y}</h2>
        <p>
          {nw.map((e, i) => (
            <span key={e.instant.getTime()}>
              {e.weekday.toLowerCase()} {dm(e.date)} klo {e.time}
              {i < nw.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>

        <h2>Kuun vaiheet kuukausittain {y}</h2>
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Kuukausi</th>
              {PHASES.map((p) => (
                <th scope="col" key={p.id}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <th scope="row">
                  <Link to={`/kuukausi-${m.month}-${y}`}>{m.monthName}</Link>
                </th>
                {PHASES.map((p) => (
                  <td key={p.id}>
                    {m.byPhase[p.id].length
                      ? m.byPhase[p.id].map((e) => `${dm(e.date)} ${e.time}`).join(", ")
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Mitä kuun vaiheet tarkoittavat?</h2>
        <ul>
          <li>
            <strong>Uusikuu:</strong> Kuu on Auringon suunnassa, eikä sen
            valaistua puolta näy.
          </li>
          <li>
            <strong>Ensimmäinen neljännes:</strong> puolikuu, jossa Kuu on
            kasvava. Suomesta katsottuna valaistu puoli on oikealla.
          </li>
          <li>
            <strong>Täysikuu:</strong> Kuu on Maasta katsottuna Aurinkoa
            vastapäätä, ja koko näkyvä puoli on valaistu.
          </li>
          <li>
            <strong>Viimeinen neljännes:</strong> puolikuu, jossa Kuu on
            vähenevä. Valaistu puoli on vasemmalla.
          </li>
        </ul>
        <p>
          Vaiheiden väliin jäävät kasvava ja vähenevä sirppi sekä kupera kuu.
          Suomi siirtyy kesäaikaan ja takaisin talviaikaan vuosittain, mikä näkyy
          kellonajoissa: katso <Link to={`/kesaaika-${y}`}>kesäaika {y}</Link>.
        </p>
      </section>

      <p className="note-soft">
        Ajat on laskettu Jean Meeusin tähtitieteellisellä menetelmällä ja
        tarkistettu{" "}
        <a href={NASA_PHASES_URL} target="_blank" rel="noopener noreferrer">
          NASAn kuun vaiheiden luetteloa
        </a>{" "}
        vasten ({PHASES_CHECKED}). Tarkkuus on noin minuutti.
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

      <p className="hub-links">
        Katso myös <Link to={`/vuosi-${y}`}>vuoden {y} viikkonumerot</Link>,{" "}
        <Link to={`/kalenteri-${y}`}>kalenteri {y}</Link>,{" "}
        <Link to={`/kesaaika-${y}`}>kesäaika {y}</Link> ja{" "}
        <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={moonPath(y - 1)}>
            <span className="lbl">Edellinen</span>Kuun vaiheet {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={moonPath(y + 1)}>
            <span className="lbl">Seuraava</span>Kuun vaiheet {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default MoonPhases;
