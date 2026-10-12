import { CONSTRUCTION_TYPES } from "../../platform/construction/config.js";
import { constructionWeek, constructionConflicts } from "../../platform/construction/model.js";
import { dmy } from "../../data/planningDates.js";

function RecordTable({ records }) {
  return <div className="table-wrap"><table className="data-table construction-records"><thead><tr><th scope="col">Laji ja merkintä</th><th scope="col">Päivät</th><th scope="col">ISO-viikko alussa</th><th scope="col">Huomiot</th></tr></thead><tbody>
    {records.map((row) => <tr key={row.id}><th scope="row"><small>{CONSTRUCTION_TYPES[row.type]}</small><br />{row.label}</th><td>{dmy(row.from)}{row.start !== row.end && <>-{dmy(row.to)}</>}</td><td>{row.week}/{row.weekYear}</td><td>{row.note && <p>{row.note}</p>}{row.subcontractorNote && <p><strong>Aliurakoitsijahuomio:</strong> {row.subcontractorNote}</p>}{row.weatherRisk && <p><strong>Sääriski (oma huomio):</strong> {row.weatherRisk}</p>}</td></tr>)}
    {!records.length && <tr><td colSpan="4">Ei vielä merkintöjä. Lisää työvaihe tai viikkotehtävä.</td></tr>}
  </tbody></table></div>;
}
export default function ConstructionPreview({ model, weekKey }) {
  const week = constructionWeek(model, weekKey), weekly = model.config.layout === "weekly";
  const conflicts = constructionConflicts(model, weekly ? week.key : null);
  return <section className="construction-preview" aria-label="Aikataulun esikatselu" data-clarity-mask="True">
    <h2>{model.config.projectName}</h2>
    {model.config.siteName && <p className="construction-site">Työmaa: <strong>{model.config.siteName}</strong></p>}
    <p>Projektijakso {dmy(model.start)}-{dmy(model.end)}. {model.weeks.length} ISO-viikkoa, {model.availableDays} työpäivää taukojen jälkeen.</p>
    {model.config.subcontractorNotes && <p><strong>Aliurakoitsijahuomiot:</strong> {model.config.subcontractorNotes}</p>}
    {model.config.weatherNotes && <p><strong>Sääriskit (omat huomiot):</strong> {model.config.weatherNotes}</p>}
    {weekly ? <>
      <h3>Viikkoaikataulu: ISO-viikko {week.week}/{week.year}</h3>
      <p>Projektijaksoon kuuluvat päivät {dmy(week.from)}-{dmy(week.to)}. Työpäiviä ennen taukoja {week.workingDays}, taukopäiviä {week.shutdownDays}, käytettävissä {week.availableDays}.</p>
      <p>Pyhäpäivät: {week.holidays.length ? week.holidays.map((h) => `${h.name} ${dmy(h.date)}`).join(", ") : "ei pyhäpäiviä tällä viikolla"}.</p>
    </> : <>
      <h3>Projektin yleiskuva</h3>
      <div className="table-wrap"><table className="data-table construction-weeks"><thead><tr><th scope="col">ISO-viikko</th><th scope="col">Päivät</th><th scope="col">Työpäiviä</th><th scope="col">Taukopäiviä</th><th scope="col">Käytettävissä</th><th scope="col">Pyhäpäivät</th></tr></thead><tbody>{model.weeks.map((w) => <tr key={w.key}><th scope="row">{w.week}/{w.year}</th><td>{dmy(w.from)}-{dmy(w.to)}</td><td>{w.workingDays}</td><td>{w.shutdownDays}</td><td>{w.availableDays}</td><td>{w.holidays.map((h) => `${h.name} ${dmy(h.date)}`).join(", ") || "-"}</td></tr>)}</tbody></table></div>
      <h3>Kaikki projektin merkinnät</h3>
    </>}
    <RecordTable records={weekly ? week.records : model.records} />
    {conflicts.length > 0 && <p className="construction-conflicts">Tauon kanssa päällekkäin: {conflicts.map((row) => row.label).join(", ")}. Tarkista ajoitus; päivämääriä ei siirretä automaattisesti.</p>}
    <p className="note-soft">{model.disclosure} Työmaan tauot vähentävät käytettävissä olevia työpäiviä. Sääriskit ovat omia huomioita.</p>
  </section>;
}
