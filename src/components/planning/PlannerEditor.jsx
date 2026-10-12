import Button from "../Button";
import { useEffect, useRef, useState } from "react";
import { buildPlanner } from "../../platform/planning/model.js";
import { plannerToPdf, plannerToXlsx, plannerToIcs } from "../../platform/planning/exports.js";
import { newCalendarIdentity } from "../../platform/export/companyIcs.js";
import { downloadBlob } from "../../platform/export/download.js";
import { XLSX_MIME } from "../../platform/export/xlsx.js";
import { trackPlatformEvent } from "../../analytics.js";
import { dmy } from "../../data/planningDates.js";
import { dayKey } from "../../platform/calendar/events.js";
import "./planning.css";
import "./plannerControls.css";

export default function PlannerEditor({ kind, start, workingDays, end, weeks, count, firstNumber = 1 }) {
  const [name, setName] = useState(kind === "project" ? "Projektisuunnitelma" : "Sprinttisuunnitelma");
  const [phases, setPhases] = useState([]), [milestones, setMilestones] = useState([]);
  const [busy, setBusy] = useState(null), [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const calendarId = useRef(null), serial = useRef(0), created = useRef(false), previewed = useRef(false);
  useEffect(() => { calendarId.current = newCalendarIdentity(); setReady(true); }, []);
  let model = null, error = "";
  try { model = buildPlanner({ kind, name, start, workingDays, end, weeks, count, firstNumber, phases, milestones }); }
  catch (reason) { error = reason.message; }
  useEffect(() => {
    if (!ready || !model || !created.current || previewed.current) return;
    const timer = setTimeout(() => {
      previewed.current = true;
      trackPlatformEvent("planning_suite_preview", { source: kind });
    }, 600);
    return () => clearTimeout(timer);
  }, [ready, model, kind]);
  const changed = () => {
    if (!created.current) {
      created.current = true;
      trackPlatformEvent("planning_suite_created", { source: kind });
    }
  };
  const updatePhase = (id, values) => { changed(); setPhases((rows) => rows.map((row) => row.id === id ? { ...row, ...values } : row)); };
  const updateMilestone = (id, values) => { changed(); setMilestones((rows) => rows.map((row) => row.id === id ? { ...row, ...values } : row)); };
  const exportFile = async (format) => {
    if (!model || !calendarId.current) return;
    changed(); setBusy(format); setMessage("");
    try {
      let data, mime;
      if (format === "pdf") { data = (await plannerToPdf(model)).bytes; mime = "application/pdf"; }
      else if (format === "xlsx") { data = plannerToXlsx(model); mime = XLSX_MIME; }
      else { data = plannerToIcs(model, { calendarId: calendarId.current }); mime = "text/calendar;charset=utf-8"; }
      downloadBlob(`${kind === "project" ? "projektisuunnitelma" : "sprinttisuunnitelma"}.${format}`, data, mime);
      trackPlatformEvent("planning_suite_export", { source: kind, export_type: format, year: model.start.getFullYear() });
      setMessage("Tiedosto on valmis. ICS tuo merkinnät kalenteriin; se ei luo päivittyvää tilausta.");
    } catch { setMessage("Tiedoston luonti epäonnistui. Yritä uudelleen."); }
    finally { setBusy(null); }
  };
  return <section id={`${kind}-planner-pro`} className="planning-editor" aria-label="Suunnitelma ja lataukset" data-ready={ready} data-clarity-mask="True">
    <h2>Suunnitelma ja lataukset</h2>
    <p>Lisää suunnitelman nimi ja lataa aikataulu. Tiedot pysyvät omassa selaimessasi. Tiliä ei tarvita.</p>
    <label htmlFor={`${kind}-name`}>Suunnitelman nimi</label>
    <input id={`${kind}-name`} value={name} maxLength={80} onChange={(e) => { changed(); setName(e.target.value); }} />
    {kind === "project" && <>
      <h3>Projektin vaiheet</h3>
      <p>Riippuvainen vaihe alkaa edellisen valmistumisen jälkeisenä työpäivänä. Ilman riippuvuutta vaiheet alkavat projektin alussa. Vaiheiden pitää mahtua projektin kestoon.</p>
      {phases.map((phase) => <fieldset key={phase.id}>
        <legend>Vaihe {phases.indexOf(phase) + 1}</legend>
        <label>Nimi<input aria-label={`Vaiheen nimi ${phase.id}`} value={phase.label} maxLength={80} onChange={(e) => updatePhase(phase.id, { label: e.target.value })} /></label>
        <label>Kesto työpäivinä<input type="number" min="1" max="520" value={phase.workingDays} onChange={(e) => updatePhase(phase.id, { workingDays: e.target.value })} /></label>
        <label>Alkaa vaiheen jälkeen<select value={phase.dependsOn[0] ?? ""} onChange={(e) => updatePhase(phase.id, { dependsOn: e.target.value ? [e.target.value] : [] })}>
          <option value="">Projektin alussa</option>{phases.filter((p) => p.id !== phase.id).map((p) => <option key={p.id} value={p.id}>{p.label || "Nimetön vaihe"}</option>)}
        </select></label>
        <label>Huomautus<textarea value={phase.note} maxLength={1000} onChange={(e) => updatePhase(phase.id, { note: e.target.value })} /></label>
        <Button variant="secondary" type="button" disabled={phases.some((p) => p.dependsOn.includes(phase.id)) || milestones.some((m) => m.phaseId === phase.id)} title="Poista ensin tähän vaiheeseen viittaavat riippuvuudet ja välitavoitteet." onClick={() => { changed(); setPhases((rows) => rows.filter((p) => p.id !== phase.id)); }}>Poista vaihe</Button>
      </fieldset>)}
      <Button variant="secondary" type="button" disabled={phases.length >= 30} onClick={() => { changed(); setPhases((rows) => [...rows, { id: `phase-${++serial.current}`, label: `Vaihe ${rows.length + 1}`, workingDays: 5, dependsOn: [], note: "" }]); }}>Lisää vaihe</Button>
      <h3>Omat välitavoitteet</h3>
      {milestones.map((m) => <fieldset key={m.id}>
        <legend>Välitavoite {milestones.indexOf(m) + 1}</legend>
        <label>Nimi<input value={m.label} maxLength={80} onChange={(e) => updateMilestone(m.id, { label: e.target.value })} /></label>
        <label>Päivämäärä<input type="date" disabled={!!m.phaseId} value={m.date ?? ""} onChange={(e) => updateMilestone(m.id, { date: e.target.value })} /></label>
        <label>Vaiheen valmistuminen<select value={m.phaseId ?? ""} onChange={(e) => updateMilestone(m.id, { phaseId: e.target.value || null })}>
          <option value="">Käytä päivämäärää</option>{phases.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select></label>
        <label>Huomautus<textarea value={m.note} maxLength={1000} onChange={(e) => updateMilestone(m.id, { note: e.target.value })} /></label>
        <Button variant="secondary" type="button" onClick={() => { changed(); setMilestones((rows) => rows.filter((p) => p.id !== m.id)); }}>Poista välitavoite</Button>
      </fieldset>)}
      <Button variant="secondary" type="button" disabled={milestones.length >= 50} onClick={() => { changed(); setMilestones((rows) => [...rows, { id: `milestone-${++serial.current}`, label: `Välitavoite ${rows.length + 1}`, date: model ? dayKey(model.start) : start, phaseId: null, note: "" }]); }}>Lisää välitavoite</Button>
      {model?.phases.length > 0 && <ul>{model.phases.map((p) => <li key={p.id}><strong>{p.label}</strong>: {dmy(p.start)}-{dmy(p.end)}, {p.workingDays} työpäivää</li>)}</ul>}
      {model?.milestones.length > 0 && <ul>{model.milestones.map((m) => <li key={m.id}><strong>{m.label}</strong>: {dmy(m.date)}, ISO-viikko {m.week}/{m.weekYear}</li>)}</ul>}
    </>}
    {error && <p role="alert">{error}</p>}
    {model && <p>Suunnitelma kattaa {model.months.length} kalenterikuukautta ja {model.weeks.length} ISO-viikkoa. Excel sisältää myös kuukausikohtaiset työpäivät.</p>}
    <div className="planning-buttons">{["pdf", "xlsx", "ics"].map((format) => <Button className="btn" type="button" key={format} disabled={!ready || !model || busy !== null} onClick={() => exportFile(format)}>{busy === format ? "Luodaan..." : `Lataa ${format === "xlsx" ? "Excel" : format.toUpperCase()}`}</Button>)}</div>
    <p role="status">{message}</p>
  </section>;
}
