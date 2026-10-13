import "../components/planning/plannerControls.css";
import Button from "../components/Button";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor } from "../data/seo";
import { HR_PATH, HR_UPDATED, HR_STEPS, hrMeta, hrFaqs } from "../data/hrCalendar";
import { HR_EVENT_TYPES, HR_ORIGINS, HR_AGREEMENT_WARNING } from "../platform/hr/eventTypes";
import { HR_LEGAL_SOURCE, HR_LEGAL_SCOPE } from "../platform/hr/statutory";
import { newHrDraft, MAX_HR_RECORDS } from "../platform/hr/config";
import { buildHrModel } from "../platform/hr/model";
import { hrToPdf, hrToXlsx, hrToIcs } from "../platform/hr/exports";
import { newCalendarIdentity } from "../platform/export/companyIcs";
import { downloadBlob } from "../platform/export/download";
import { XLSX_MIME } from "../platform/export/xlsx";
import { toDate } from "../platform/calendar/events";
import { isoWeek, isoYear } from "../components/dateUtils";
import { dmy } from "../data/planningDates";
import { trackPlatformEvent } from "../analytics";
import "../components/hr/hr.css";
export default function HrCalendar() {
  const today = useToday();
  const [draft, setDraft] = useState(() => newHrDraft(today.getFullYear()));
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(null), [message, setMessage] = useState("");
  const identity = useRef(null), sequence = useRef(0), started = useRef(false);
  useEffect(() => { identity.current = newCalendarIdentity(); setReady(true); }, []);
  const { model, error } = useMemo(() => { try { return { model: buildHrModel(draft), error: "" }; } catch (e) { return { model: null, error: e.message }; } }, [draft]);
  const change = () => { if (!started.current) { started.current = true; trackPlatformEvent("hr_calendar_started", { source: "editor" }); } };
  const update = (values) => { change(); setDraft((d) => ({ ...d, ...values })); };
  const rowUpdate = (id, values) => { change(); setDraft((d) => ({ ...d, records: d.records.map((r) => r.id === id ? { ...r, ...values } : r) })); };
  useEffect(() => { if (!ready || !model || !started.current) return; const timer = setTimeout(() => trackPlatformEvent("hr_calendar_preview", { source: "editor", year: model.config.year }), 500); return () => clearTimeout(timer); }, [ready, model]);
  const add = (type) => { const id = `row-${++sequence.current}`; update({ records: [...draft.records, { id, type, label: HR_EVENT_TYPES[type], start: `${draft.year}-01-01`, end: `${draft.year}-01-01`, origin: "company", note: "", reference: "" }] }); };
  const exportFile = async (format) => {
    if (!model || !ready || busy) return;
    change(); setBusy(format); setMessage("");
    try {
      const data = format === "pdf" ? (await hrToPdf(model)).bytes : format === "xlsx" ? hrToXlsx(model) : hrToIcs(model, { calendarId: identity.current });
      downloadBlob(`hr-kalenteri-${draft.year}.${format}`, data, format === "pdf" ? "application/pdf" : format === "xlsx" ? XLSX_MIME : "text/calendar;charset=utf-8");
      trackPlatformEvent("hr_calendar_export", { source: "editor", year: draft.year, export_type: format }); setMessage("Tiedosto on valmis. Tarkista soveltuvuus ja omat määräpäivät ennen käyttöä.");
    } catch { setMessage("Tiedoston luonti epäonnistui. Yritä uudelleen."); } finally { setBusy(null); }
  };
  return <section className="app hr-page">
    <SEO {...hrMeta} canonical={canonicalFor(HR_PATH)} />
    <div className="breadcrumb"><Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / HR-kalenteri</div>
    <h1>HR-kalenteri ja henkilöstön vuosikello</h1>
    <p className="lead">Kokoa palkkapäivät, palkanlaskennan määräpäivät, viestintä ja lomajaksot samaan vuosikelloon. Tarkista ISO-viikot ja lataa PDF, Excel tai ICS ilman tiliä.</p>
    <aside className="hr-warning"><strong>Tarkista päivien perusteet.</strong><p>{model?.warning ?? "Kalenteri ei takaa lainmukaisuutta. Tarkista työnantajan käytännöt, sopimukset ja palkkapalvelun määräpäivät."}</p></aside>
    <div className="hr-editor" data-clarity-mask="True" data-ready={ready}>
      <h2>Tee HR:n vuosikello</h2><p>Tiedot pysyvät selaimessa ja tyhjenevät sivun uudelleenlatauksessa. Käytä yhteisiä suunnittelumerkintöjä, älä henkilötietoja.</p>
      <fieldset disabled={!ready}><legend>Kalenterin asetukset</legend><div className="hr-fields">
        <label>Yrityksen nimi (valinnainen)<input id="hr-company" maxLength={80} value={draft.companyName} onChange={(e) => update({ companyName: e.target.value })} /></label>
        <label>Vuosi<input id="hr-year" type="number" min={2000} max={2100} value={draft.year} onChange={(e) => update({ year: Number(e.target.value), statutory: draft.statutory && HR_LEGAL_SOURCE.years.includes(Number(e.target.value)) })} /></label>
      </div><label><input type="checkbox" checked={draft.holidays} onChange={(e) => update({ holidays: e.target.checked })} /> Suomen pyhäpäivät</label>
      <label><input id="hr-statutory" type="checkbox" disabled={!HR_LEGAL_SOURCE.years.includes(draft.year)} checked={draft.statutory} onChange={(e) => update({ statutory: e.target.checked })} /> Lähteestä tarkistetut vuosilomalain muistutukset (2026-2028)</label></fieldset>
      <div className="hr-add">{Object.entries(HR_EVENT_TYPES).map(([type, label]) => <Button variant="secondary" key={type} disabled={!ready || draft.records.length >= MAX_HR_RECORDS} onClick={() => add(type)}>Lisää {label.toLowerCase()}</Button>)}</div>
      {draft.records.map((r, i) => <fieldset className="hr-row" key={r.id} disabled={!ready}><legend>{HR_EVENT_TYPES[r.type]} {i + 1}</legend><div className="hr-fields">
        <label>Nimi<input maxLength={120} value={r.label} onChange={(e) => rowUpdate(r.id, { label: e.target.value })} /></label>
        <label>{["closure", "vacation"].includes(r.type) ? "Alku" : "Päivämäärä"}<input type="date" value={r.start} onChange={(e) => rowUpdate(r.id, { start: e.target.value, ...(!["closure", "vacation"].includes(r.type) ? { end: e.target.value } : {}) })} /></label>
        {["closure", "vacation"].includes(r.type) && <label>Loppu<input type="date" value={r.end} onChange={(e) => rowUpdate(r.id, { end: e.target.value })} /></label>}
        <label>Alkuperä<select value={r.origin} onChange={(e) => rowUpdate(r.id, { origin: e.target.value })}><option value="company">Yrityksen oma päivä</option><option value="agreement">TES-kohtainen oma merkintä</option></select></label>
      </div><label>{r.origin === "agreement" ? "Sopimus, voimassaolo ja kohta (pakollinen)" : "Peruste tai palkkapalvelun ohje (valinnainen)"}<input maxLength={300} value={r.reference} onChange={(e) => rowUpdate(r.id, { reference: e.target.value })} /></label>
      {r.origin === "agreement" && <p className="hr-warning">{HR_AGREEMENT_WARNING}</p>}
      <label>Huomautus<textarea maxLength={1000} value={r.note} onChange={(e) => rowUpdate(r.id, { note: e.target.value })} /></label>
      <Button variant="secondary" onClick={() => update({ records: draft.records.filter((v) => v.id !== r.id) })}>Poista merkintä {i + 1}</Button></fieldset>)}
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="planner-card hr-downloads">
      <div className="hr-actions">{["pdf", "xlsx", "ics"].map((format) => <Button key={format} disabled={!ready || !model || !!busy} onClick={() => exportFile(format)}>Lataa {format === "xlsx" ? "Excel" : format.toUpperCase()}</Button>)}<Button disabled={!ready || !model} onClick={() => window.print()}>Tulosta</Button></div><p role="status">{busy ? "Tiedostoa luodaan..." : message}</p></div>
    {model && <div className="hr-preview" data-clarity-mask="True"><h2>{draft.companyName || "HR-kalenteri"} {draft.year}: esikatselu</h2><p>{model.warning}</p>
      {Object.entries(HR_ORIGINS).map(([origin, label]) => <section key={origin}><h3>{label}</h3><div className="hr-table"><table><thead><tr><th>Päivät</th><th>ISO-viikko</th><th>Merkintä</th><th>Peruste ja huomiot</th></tr></thead><tbody>{model.records.filter((r) => r.origin === origin).map((r) => <tr key={r.id}><td>{dmy(toDate(r.start))}{r.end !== r.start && `-${dmy(toDate(r.end))}`}</td><td>{isoWeek(toDate(r.start))}/{isoYear(toDate(r.start))}</td><td>{r.label}</td><td>{r.reference} {r.url && <a href={r.url}>Finlex</a>} {r.reviewed && `Tarkistettu ${r.reviewed}.`} {r.note}</td></tr>)}</tbody></table></div>{!model.records.some((r) => r.origin === origin) && <p>Ei merkintöjä.</p>}</section>)}
      <details><summary>Vuoden ISO-viikot</summary><div className="hr-table"><table><thead><tr><th>ISO-viikko</th><th>Päivät</th><th>Merkinnät</th></tr></thead><tbody>{model.weeks.map((w) => <tr key={`${w.weekYear}-${w.week}`}><td>{w.week}/{w.weekYear}</td><td>{dmy(w.from)}-{dmy(w.to)}</td><td>{w.events.map((e) => e.title).join("; ")}</td></tr>)}</tbody></table></div></details>
    </div>}
    <div className="hr-help"><h2>Näin käytät HR-kalenteria</h2><ol>{HR_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
      <h2>Palkanlaskennan ja lomien suunnittelu</h2><p>Kirjaa palkkapalvelun aineistopäivä omaksi määräpäiväkseen ja palkkapäivä erilliseksi tapahtumaksi. Lisää henkilöstöviestintä ja HR:n vuosittaiset tapaamiset sovittuina päivinä. Yrityksen vapaapäivät ja lomajaksot kuvaavat omaa suunnitelmaasi, eivät laskettua lomaoikeutta.</p>
      <h2>Lakimuistutusten lähde ja rajaus</h2><p>{HR_LEGAL_SCOPE}</p><p><a href={HR_LEGAL_SOURCE.url}>{HR_LEGAL_SOURCE.name}</a>. Tarkistettu {HR_LEGAL_SOURCE.reviewed}. Muistutukset ovat valinnaisia ja saatavilla vuosille 2026, 2027 ja 2028.</p>
      <h2>Vie vuosikello kalenterisovellukseen</h2><p>Lataa ICS ja tuo tiedosto Outlookin, Google Kalenterin tai Apple Kalenterin tuontitoiminnolla. Tapahtumat ovat kokopäiväisiä. Tiedosto ei päivity automaattisesti; tarkista muutokset ennen uutta tuontia. Älä julkaise yrityksen yksityistä tiedostoa avoimena kalenterilinkkinä.</p>
      <h2>Usein kysyttyä HR-kalenterista</h2>{hrFaqs().map(({ q, a }) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}<p>Päivitetty <time dateTime={HR_UPDATED}>10.10.2026</time>.</p>
      <p><Link to="/yrityskalenteri">Yrityskalenteri</Link> | <Link to="/lomasuunnittelija">Lomasuunnittelija</Link> | <Link to="/kalenteripohjat/hr-ja-palkkapaivien-vuosikello">HR:n Excel-pohja</Link> | <Link to="/tyopaivalaskuri">Työpäivälaskuri</Link></p>
    </div>
  </section>;
}
