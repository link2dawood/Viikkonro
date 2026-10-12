import "../components/planning/plannerControls.css";
import Button from "../components/Button";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import ConstructionPreview from "../components/construction/ConstructionPreview";
import { canonicalFor } from "../data/seo";
import { CONSTRUCTION_PATH, CONSTRUCTION_UPDATED, CONSTRUCTION_STEPS, constructionFaqs, constructionMeta } from "../data/constructionCalendar";
import { dmy, nextMonday } from "../data/planningDates";
import { CONSTRUCTION_TYPES, CONSTRUCTION_LAYOUTS, MAX_CONSTRUCTION_ROWS, isConstructionPoint, newConstructionDraft } from "../platform/construction/config";
import { buildConstructionModel, constructionWeek } from "../platform/construction/model";
import { constructionToCsv, constructionToIcs, constructionToPdf, constructionToXlsx } from "../platform/construction/exports";
import { newCalendarIdentity } from "../platform/export/companyIcs";
import { dayKey, toDate } from "../platform/calendar/events";
import { downloadBlob } from "../platform/export/download";
import { XLSX_MIME } from "../platform/export/xlsx";
import { trackPlatformEvent } from "../analytics";
import "../components/construction/construction.css";

export default function ConstructionCalendar() {
  const today = useToday(), year = today.getFullYear();
  const [draft, setDraft] = useState(() => newConstructionDraft(nextMonday(today)));
  const [ready, setReady] = useState(false), [weekKey, setWeekKey] = useState("");
  const [busy, setBusy] = useState(null), [message, setMessage] = useState("");
  const calendarId = useRef(null), sequence = useRef(0), started = useRef(false), created = useRef(false);
  useEffect(() => { calendarId.current = newCalendarIdentity(); setReady(true); }, []);
  const { model, error } = useMemo(() => {
    try { return { model: buildConstructionModel(draft), error: "" }; }
    catch (reason) { return { model: null, error: reason.message }; }
  }, [draft]);
  useEffect(() => {
    if (!ready || !model || !started.current || created.current) return;
    const timer = setTimeout(() => { if (created.current) return; created.current = true; trackPlatformEvent("construction_planner_created", { source: "editor", year: model.start.getFullYear(), layout: model.config.layout }); }, 500);
    return () => clearTimeout(timer);
  }, [ready, model, weekKey]);
  const change = () => { if (!started.current) { started.current = true; trackPlatformEvent("construction_planner_started", { source: "editor" }); } };
  const update = (values) => { change(); setDraft((current) => ({ ...current, ...values })); };
  const updateRow = (id, values) => { change(); setDraft((current) => ({ ...current, records: current.records.map((row) => row.id === id ? { ...row, ...values } : row) })); };
  const add = (type) => {
    change();
    const week = model ? constructionWeek(model, weekKey) : null;
    const start = type === "task" && week ? dayKey(week.from) : draft.start;
    const id = `row-${++sequence.current}`;
    setDraft((current) => ({ ...current, records: [...current.records, { id, type, label: CONSTRUCTION_TYPES[type], start, end: type === "task" && week ? dayKey(week.to) : start, note: "", subcontractorNote: "", weatherRisk: "" }] }));
  };
  const exportFile = async (format) => {
    if (!ready || !model) return;
    change(); setBusy(format); setMessage("");
    if (!created.current) { created.current = true; trackPlatformEvent("construction_planner_created", { source: "editor", year: model.start.getFullYear(), layout: model.config.layout }); }
    try {
      let data, mime;
      if (format === "pdf") { data = (await constructionToPdf(model, { weekKey })).bytes; mime = "application/pdf"; }
      else if (format === "xlsx") { data = constructionToXlsx(model); mime = XLSX_MIME; }
      else if (format === "csv") { data = constructionToCsv(model); mime = "text/csv;charset=utf-8"; }
      else { data = constructionToIcs(model, { calendarId: calendarId.current }); mime = "text/calendar;charset=utf-8"; }
      downloadBlob(`rakennuskalenteri.${format}`, data, mime);
      trackPlatformEvent("construction_planner_export", { source: "editor", export_type: format, year: model.start.getFullYear(), layout: model.config.layout });
      setMessage("Tiedosto on valmis. Excel, CSV ja ICS sisältävät koko projektin; PDF seuraa valittua näkymää.");
    } catch { setMessage("Tiedoston luonti epäonnistui. Yritä uudelleen."); }
    finally { setBusy(null); }
  };
  const selected = model ? constructionWeek(model, weekKey) : null;
  return <section className="app construction-page">
    <SEO {...constructionMeta} canonical={canonicalFor(CONSTRUCTION_PATH)} />
    <div className="breadcrumb"><Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Rakennuskalenteri</div>
    <h1>Rakennuskalenteri ja työmaan viikkoaikataulu</h1>
    <p className="lead">Suunnittele työvaiheet, viikkotehtävät, toimitukset ja tarkastukset ISO-viikoittain. Tulosta aikataulu tai lataa PDF, Excel, CSV ja ICS maksutta ilman tiliä.</p>
    <div className="construction-editor" data-clarity-mask="True" data-ready={ready}>
      <h2>Tee työmaan aikataulu</h2>
      <p>Kirjaa yrityksiä ja työvaiheita, älä työntekijöiden henkilötietoja. Suunnitelma pysyy tässä selaimessa ja tyhjenee, kun lataat sivun uudelleen.</p>
      <fieldset disabled={!ready}><legend>Projekti ja työmaa</legend><div className="construction-fields">
        <label htmlFor="c-project">Projektin nimi<input id="c-project" maxLength={100} value={draft.projectName} onChange={(e) => update({ projectName: e.target.value })} /></label>
        <label htmlFor="c-site">Työmaan nimi<input id="c-site" maxLength={100} value={draft.siteName} onChange={(e) => update({ siteName: e.target.value })} /></label>
        <label htmlFor="c-start">Projektin alku<input id="c-start" type="date" value={draft.start} onChange={(e) => update({ start: e.target.value })} /></label>
        <label htmlFor="c-end">Projektin loppu<input id="c-end" type="date" value={draft.end} onChange={(e) => update({ end: e.target.value })} /></label>
      </div>
      <label htmlFor="c-subcontractors">Aliurakoitsijahuomiot<textarea id="c-subcontractors" maxLength={1000} value={draft.subcontractorNotes} onChange={(e) => update({ subcontractorNotes: e.target.value })} /></label>
      <label htmlFor="c-weather">Sääriskit (omat huomiot)<textarea id="c-weather" maxLength={1000} value={draft.weatherNotes} onChange={(e) => update({ weatherNotes: e.target.value })} /></label>
      </fieldset>
      <h3>Työvaiheet ja merkinnät</h3>
      <div className="construction-add">{Object.entries(CONSTRUCTION_TYPES).map(([type, label]) => <Button variant="secondary" key={type} type="button" disabled={!ready || draft.records.length >= MAX_CONSTRUCTION_ROWS} onClick={() => add(type)}>Lisää {label.toLowerCase()}</Button>)}</div>
      {draft.records.map((row, index) => <fieldset key={row.id} className="construction-row" disabled={!ready}><legend>{CONSTRUCTION_TYPES[row.type]} {index + 1}</legend><div className="construction-fields">
        <label>Nimi<input value={row.label} maxLength={100} onChange={(e) => updateRow(row.id, { label: e.target.value })} /></label>
        <label>{isConstructionPoint(row.type) ? "Päivämäärä" : "Alku"}<input type="date" value={row.start} onChange={(e) => updateRow(row.id, { start: e.target.value, ...(isConstructionPoint(row.type) ? { end: e.target.value } : {}) })} /></label>
        {!isConstructionPoint(row.type) && <label>Loppu<input type="date" value={row.end} onChange={(e) => updateRow(row.id, { end: e.target.value })} /></label>}
      </div>
        <label>Huomautus<textarea value={row.note} maxLength={1000} onChange={(e) => updateRow(row.id, { note: e.target.value })} /></label>
        <details><summary>Aliurakoitsija- ja sääriskihuomiot</summary><label>Aliurakoitsijahuomio<textarea value={row.subcontractorNote} maxLength={1000} onChange={(e) => updateRow(row.id, { subcontractorNote: e.target.value })} /></label><label>Sääriski (oma huomio)<textarea value={row.weatherRisk} maxLength={1000} onChange={(e) => updateRow(row.id, { weatherRisk: e.target.value })} /></label></details>
        <Button variant="secondary" type="button" onClick={() => update({ records: draft.records.filter((item) => item.id !== row.id) })}>Poista merkintä</Button>
      </fieldset>)}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className="construction-actions"><label htmlFor="c-layout">Näkymä<select id="c-layout" disabled={!ready} value={draft.layout} onChange={(e) => update({ layout: e.target.value })}>{Object.entries(CONSTRUCTION_LAYOUTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {model && draft.layout === "weekly" && <label htmlFor="c-week">ISO-viikko<select id="c-week" disabled={!ready} value={selected.key} onChange={(e) => { change(); setWeekKey(e.target.value); }}>{model.weeks.map((w) => <option key={w.key} value={w.key}>{w.week}/{w.year}: {dmy(w.from)}-{dmy(w.to)}</option>)}</select></label>}
      <div className="construction-downloads"><Button type="button" className="btn" disabled={!ready || !model} onClick={() => window.print()}>Tulosta aikataulu</Button>{["pdf", "xlsx", "csv", "ics"].map((format) => <Button type="button" className="btn" key={format} disabled={!ready || !model || busy !== null} onClick={() => exportFile(format)}>{busy === format ? "Luodaan..." : `Lataa ${format === "xlsx" ? "Excel" : format.toUpperCase()}`}</Button>)}</div>
      <p>PDF ja tulostus seuraavat valittua näkymää. Excel, CSV ja ICS sisältävät koko projektin. ICS on tiedostotuonti, ei päivittyvä tilaus.</p>
      <p role="status">{message}</p>
    </div>
    {model && <ConstructionPreview model={model} weekKey={weekKey} />}
    <section className="prose construction-help">
      <p className="note-soft">Sisältö päivitetty {dmy(toDate(CONSTRUCTION_UPDATED))}.</p>
      <h2>Työmaan viikkosuunnittelu yhdellä aikataululla</h2>
      <p>Työmaan viikkopalaverissa tarvitaan selkeä kuva siitä, mitä tehdään seuraavaksi ja mitä pitää olla valmiina ennen työn aloitusta. Merkitse työvaiheen jakso ja lisää sen rinnalle tarkemmat viikkotehtävät. Toimituspäivä ja tarkastuspäivä näkyvät omana merkintänään samalla viikolla, jolloin niitä voi verrata työn etenemiseen.</p>
      <p>Rakennuskalenteri on tarkoitettu rakennusyrityksille, työnjohdolle, aliurakoitsijoille ja projektikoordinaattoreille. Se kokoaa sovitut päivät helposti tulostettavaksi viikkoaikatauluksi. Työvaiheen, tehtävän tai toimituksen nimi voi kuvata työn sisältöä; henkilöluetteloa ei tarvita.</p>
      <h2>Näin teet rakennuskalenterin</h2><ol>{CONSTRUCTION_STEPS.map((step) => <li key={step}>{step}</li>)}</ol>
      <h2>Toimitukset, tarkastukset ja tauot</h2>
      <p>Kirjaa materiaalin toimitus ja työvaiheen tarkastus erikseen. Aliurakoitsijahuomioon voit lisätä esimerkiksi työjärjestyksen, kalustotarpeen tai sovitun aloitusedellytyksen. Työmaan taukojaksot vähentävät viikon käytettävissä olevia työpäiviä. Jos merkintä osuu tauolle, ajoitus jää sinun tarkistettavaksesi.</p>
      <p>Sääriskikenttään voit kirjata oman huomion, kuten betonoinnin lämpötilariskin tai ulkotyön varapäivän. Kenttä on muistiinpano: työkalu ei hae ennustetta eikä arvioi työn turvallisuutta. Tarkastusmerkinnät ovat sovittuja päivämääriä, eikä työkalu päättele vaadittavia tarkastuksia tai lupia.</p>
      <h2>Viikkoaikataulu työmaalle, yleiskuva projektille</h2>
      <p>Valitse ISO-viikko, kun tarvitset yhden viikon tehtävät työmaakokoukseen tai tulosteeksi. Projektin yleiskuva näyttää koko jakson viikot ja merkinnät. Excel sopii jatkomuokkaukseen; CSV sisältää viikkokohtaiset rivit. ICS tuo koko projektin kokopäiväiset merkinnät omaan kalenteriohjelmaasi.</p>
      <h2>Usein kysytyt kysymykset</h2>{constructionFaqs().map((faq, index) => <details key={faq.q} open={index === 0}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}
    </section>
    <p className="hub-links construction-links">Katso myös <Link to="/projektiaikataulu">projektiaikataulu</Link>, <Link to="/kalenteripohjat/rakennustyomaan-viikkoaikataulu">tyhjä rakennustyömaan Excel-pohja</Link>, <Link to={`/kalenteri-${year}`}>kalenteri {year}</Link> ja <Link to="/tyopaivalaskuri">työpäivälaskuri</Link>.</p>
  </section>;
}
