import { dmy } from "../../data/planningDates";
import { TEAM_STATUSES, teamLeaveLabel } from "../../platform/team/model";
export default function TeamCalendar({ model, view, month }) {
  const months = view === "year" ? model.calendar.months : [model.calendar.months[month]];
  return <section className="team-preview"><h2>{model.snapshot.organization.name}: {model.calendar.year}</h2><p>{model.disclosure}</p>
    <p>{model.includePending ? "Mukana myös hyväksyntää odottavat pyynnöt." : "Saatavuudessa vain hyväksytyt poissaolot."} {model.members.length} aktiivista jäsentä. {model.departmentId ? "Osaston saatavuus, ei organisaation tavoitevertailua." : `Vähintään ${model.snapshot.organization.min_coverage} henkilöä saatavilla.`}</p>
    <div className={`team-months team-${view}`}>{months.map((m) => <section className="team-month" key={m.index}><h3>{m.name}</h3><div className="team-scroll"><table><thead><tr>{["Vk", "Ma", "Ti", "Ke", "To", "Pe", "La", "Su"].map((l) => <th key={l}>{l}</th>)}</tr></thead><tbody>{m.rows.map((w, i) => <tr key={i}><th title={`ISO-viikkovuosi ${w.weekYear}`}>{w.week}/{w.weekYear}</th>{w.days.map((cell, j) => {
      if (!cell) return <td key={j} />;
      const d = model.dayMap.get(cell.key), leaves = model.leaves.filter((l) => l.start_date <= d.key && l.end_date >= d.key);
      return <td key={j} className={d.closed ? "team-closed" : d.lowCoverage ? "team-low" : !d.working ? "team-off" : ""}><strong>{d.day}</strong><small>{d.closed ? "Suljettu" : d.working ? `${d.available}/${model.members.length} saatavilla` : "Vapaa"}</small>{d.events.filter((e) => e.kind !== "leave").map((e) => <small key={e.id}>{e.title}</small>)}{view === "month" && leaves.map((l) => <small key={l.id}>{model.members.find((m) => m.id === l.member_id)?.label}: {teamLeaveLabel(model.snapshot, l)} ({TEAM_STATUSES[l.status]})</small>)}{d.duplicates.length > 0 && <small>Päällekkäisiä jaksoja</small>}</td>;
    })}</tr>)}</tbody></table></div></section>)}</div>
    <h3>Saatavuushuomiot</h3><p>{model.days.filter((d) => d.lowCoverage).length} suunnittelutyöpäivänä saatavuus alittaa organisaation tavoitteen. Saman henkilön päällekkäiset poissaolot vähennetään vain kerran.</p>
    <ul>{model.days.filter((d) => d.duplicates.length > 0).slice(0, 15).map((d) => <li key={d.key}>{dmy(d.date)}: {d.duplicates.map((id) => model.members.find((m) => m.id === id)?.label).join(", ")}, päällekkäisiä jaksoja.</li>)}</ul>
  </section>;
}
