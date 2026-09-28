import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor, routeMeta, CONTENT_UPDATED_FI } from "../data/seo";
import {
  FACTS_CHECKED,
  PREGNANCY_PATH,
  PREGNANCY_STEPS,
  SOURCES,
  pregnancyFaqs,
  pregnancyReport,
  weekCalendar,
} from "../data/pregnancyCalculator";

function parse(str) {
  const p = (str || "").split("-").map(Number);
  if (p.length !== 3 || p.some(Number.isNaN) || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

// Key dates and the week calendar for a report. Renders nothing for a date
// outside the pregnancy (a future last period, or a due date long past):
// such a report has no milestones, and rendering them crashed the page.
export const PregnancyDetails = ({ r }) => {
  if (!r || r.outOfRange) return null;
  return (
    <section className="prose">
      <h2>Tärkeät päivät</h2>
      <ul>
        {r.milestones.map((m) => (
          <li key={m.label}>
            <strong>{m.label}:</strong> {fmtFullFi(m.from)}
            {m.to ? ` - ${fmtFullFi(m.to)}` : ""}
          </li>
        ))}
      </ul>
      <p className="note-soft">
        Tarkista raskausvapaan päivät{" "}
        <a href={SOURCES.kelaCalculator} target="_blank" rel="noopener noreferrer">
          Kelan laskurista
        </a>
        .
      </p>

      <h2>Raskausviikot kalenterissa</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Raskausviikko</th>
              <th scope="col">Alkaa</th>
              <th scope="col">Päättyy</th>
            </tr>
          </thead>
          <tbody>
            {weekCalendar(r.start).map((w) => (
              <tr key={w.week}>
                <th scope="row">rv {w.week}</th>
                <td>{dm(w.from)}{w.from.getFullYear()}</td>
                <td>{dm(w.to)}{w.to.getFullYear()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// Pregnancy calculator (/raskauslaskuri). Inputs start empty, so nothing
// personal is prerendered; "today" comes from useToday().
const PregnancyCalculator = () => {
  const today = useToday();
  const [mode, setMode] = useState("lmp");
  const [date, setDate] = useState("");
  const input = parse(date);
  const r = input ? pregnancyReport(mode === "lmp" ? { lmp: input } : { due: input }, today) : null;
  const faqs = pregnancyFaqs();

  return (
    <section className="app">
      <SEO {...routeMeta[PREGNANCY_PATH]} canonical={canonicalFor(PREGNANCY_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Raskauslaskuri
      </div>
      <h1>Raskauslaskuri: raskausviikot ja laskettu aika</h1>
      <p className="lead">
        <span className="answer-sentence">
          Laskettu aika on 280 päivää eli 40 viikkoa viimeisten kuukautisten
          alkamispäivästä.
        </span>{" "}
        Laskurilla näet raskausviikon, lasketun ajan ja tärkeät päivät, kuten
        raskausrahan haun ja raskausvapaan alun.
      </p>

      <div className="lookup">
        <div className="two-fields">
          <div>
            <label htmlFor="p-mode">Lähtötieto</label>
            <select id="p-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="lmp">Viimeisten kuukautisten alku</option>
              <option value="due">Laskettu aika (neuvolasta)</option>
            </select>
          </div>
          <div>
            <label htmlFor="p-date">Päivämäärä</label>
            <input type="date" id="p-date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        {r && !r.outOfRange ? (
          <div className="result" aria-live="polite">
            <div className="main-text">
              Raskausviikko <span className="num">{r.week}</span>
            </div>
            <div className="sub">
              Laskettu aika: {r.dueWeekday.toLowerCase()} {fmtFullFi(r.due)} (
              <Link to={`/viikko-${r.dueIsoWeek}-${r.dueIsoYear}`}>viikko {r.dueIsoWeek}</Link>)
              {r.daysToDue > 0 ? `, ${r.daysToDue} päivää jäljellä` : r.daysToDue === 0 ? ", tänään" : ""}
            </div>
          </div>
        ) : r?.outOfRange ? (
          <p className="note-soft">
            Laskettu aika: {fmtFullFi(r.due)}. Raskausviikko näytetään, kun
            päivämäärä on raskauden ajalta.
          </p>
        ) : (
          <p className="note-soft">Valitse päivämäärä, niin tulos näkyy tässä.</p>
        )}
      </div>

      <p className="note-soft">
        Laskuri antaa arvion. Neuvolan tai lääkärin määrittämä laskettu aika on
        aina ensisijainen, eikä laskuri korvaa terveydenhuollon ammattilaisen
        arviota.
      </p>

      <PregnancyDetails r={r} />

      <section className="prose">
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Näin käytät raskauslaskuria</h2>
        <ol>
          {PREGNANCY_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Miten raskausviikot lasketaan?</h2>
        <p>
          Raskausviikot lasketaan viimeisten kuukautisten alkamispäivästä. Viikot
          merkitään muodossa viikot+päivät: raskausviikko 12+3 tarkoittaa 12
          viikkoa ja 3 päivää. Laskettu aika on raskausviikko 40+0.
        </p>
        <p>
          Laskettu aika varmistetaan alkuraskauden ultraäänitutkimuksessa
          raskausviikolla 11+0-13+6. Suurimmassa osassa raskauksista synnytys
          käynnistyy raskausviikkojen 38+0 ja 41+6 välillä, ja ennen
          raskausviikkoa 37+0 syntyvä lapsi on ennenaikainen.
        </p>

        <h2>Raskausvapaa ja raskausraha</h2>
        <ul>
          <li>
            Raskausrahaa voi hakea Kelasta, kun raskaus on kestänyt 154 päivää
            (rv 22+0). Hakemukseen tarvitaan raskaustodistus.
          </li>
          <li>
            Raskausvapaa alkaa 14-30 arkipäivää ennen laskettua aikaa ja kestää
            40 arkipäivää.
          </li>
          <li>
            Kelan arkipäiviä ovat maanantai-lauantai arkipyhiä lukuun ottamatta.
            Katso myös <Link to={`/kelan-maksupaivat-${today.getFullYear()}`}>Kelan maksupäivät</Link>.
          </li>
        </ul>
        <p className="note-soft">
          Lähteet:{" "}
          <a href={SOURCES.hospital} target="_blank" rel="noopener noreferrer">
            Sairaala Nova, raskausaikana
          </a>{" "}
          ja{" "}
          <a href={SOURCES.kela} target="_blank" rel="noopener noreferrer">
            Kela, raskaus- ja vanhempainvapaat
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
        Katso myös <Link to="/paivamaaralaskuri">päivämäärälaskuri</Link>,{" "}
        <Link to="/paivien-erotus">päivien erotus</Link>,{" "}
        <Link to="/ikalaskuri">ikälaskuri</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default PregnancyCalculator;
