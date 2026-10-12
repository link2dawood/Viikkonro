import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { trackPlatformEvent } from "../../analytics";
import Button from "../Button";
import Preview from "../companyCalendar/Preview";
import Exports from "../companyCalendar/Exports";
import calendarCss from "../companyCalendar/companyCalendar.css?raw";
import proCss from "./vacationPro.css?raw";
import { newCalendarIdentity } from "../../platform/export/companyIcs";
import { VACATION_DRAFT_KEY, VACATION_LIMITS, VACATION_PRODUCT, newVacationDraft, validateVacationConfig, vacationConfigFromJson, vacationConfigToJson } from "../../platform/vacation/config";
import { buildVacationModel } from "../../platform/vacation/model";
import { hasFeature } from "../../platform/business/licensing";
import { clearDevLicense, resolvePaymentProvider, unavailableProvider } from "../../platform/business/payment";
import { downloadBlob } from "../../platform/export/download";
import { DAY_RULES } from "../../data/dayRules";

const storage = () => { try { return window.localStorage; } catch { return undefined; } };
const rowId = () => `r${newCalendarIdentity()}`;

export default function VacationPro({ today }) {
  const [draft, setDraft] = useState(() => newVacationDraft(today.getFullYear()));
  const [license, setLicense] = useState(null), [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(null), [message, setMessage] = useState(""), [unlockOpen, setUnlockOpen] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const started = useRef(false), previewSeen = useRef(new Set());
  const provider = useMemo(() => import.meta.env.DEV ? resolvePaymentProvider(import.meta.env, { storage: storage(), hostname: globalThis.location?.hostname }) : unavailableProvider, []);
  useEffect(() => {
    let restored;
    try { restored = vacationConfigFromJson(storage()?.getItem(VACATION_DRAFT_KEY)).config; } catch { /* Blocked storage keeps plans session-local. */ }
    setDraft({ ...(restored ?? newVacationDraft(today.getFullYear())), calendarId: restored?.calendarId ?? newCalendarIdentity() });
    setLicense(provider.restoreLicense()); setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const change = (update) => {
    setDraft((previous) => typeof update === "function" ? update(previous) : { ...previous, ...update });
    if (!started.current) { started.current = true; trackPlatformEvent("vacation_planner_started", { source: "annual-editor" }); }
  };
  const validation = useMemo(() => validateVacationConfig(draft), [draft]);
  const model = useMemo(() => validation.config ? buildVacationModel(validation.config) : null, [validation]);
  useEffect(() => {
    if (!ready || !model || !started.current || previewSeen.current.has(draft.year)) return undefined;
    const timer = setTimeout(() => { previewSeen.current.add(draft.year); trackPlatformEvent("vacation_planner_preview", { year: draft.year, source: "annual-editor" }); }, 600);
    return () => clearTimeout(timer);
  }, [ready, model, draft.year]);
  const unlocked = hasFeature(VACATION_PRODUCT, "pdf-export", license, today);
  const setRow = (key, id, patch) => change((previous) => ({ ...previous, [key]: previous[key].map((row) => row.id === id ? { ...row, ...patch } : row) }));
  const removeRow = (key, id) => change((previous) => ({ ...previous, [key]: previous[key].filter((row) => row.id !== id) }));
  const addPeriod = (closure = false) => change((previous) => ({ ...previous, [closure ? "closures" : "periods"]: [...previous[closure ? "closures" : "periods"],
    { id: rowId(), label: closure ? "Yrityksen sulku" : "Loma", start: "", end: "", note: "", ...(!closure ? { personId: previous.people[0].id, type: "vacation" } : {}) }] }));
  const save = () => {
    if (!validation.config) { setMessage("Korjaa merkityt kohdat ennen tallennusta."); return; }
    try {
      const store = storage(); if (!store) throw new Error("Storage unavailable");
      store.setItem(VACATION_DRAFT_KEY, vacationConfigToJson(validation.config));
      setMessage("Luonnos tallennettiin tähän selaimeen.");
    } catch { setMessage("Selaimen tallennustila ei ole käytettävissä. Voit jatkaa suunnittelua tässä näkymässä."); }
  };
  const reset = () => {
    try { storage()?.removeItem(VACATION_DRAFT_KEY); } catch { /* Keep the editor usable. */ }
    change({ ...newVacationDraft(today.getFullYear()), calendarId: newCalendarIdentity() });
    setMessage("Luonnos tyhjennettiin.");
  };
  async function exportFile(kind) {
    if (!model || !ready) { setMessage("Korjaa merkityt kohdat ennen lataamista."); return; }
    if (!hasFeature(VACATION_PRODUCT, `${kind}-export`, license, today)) { setUnlockOpen(true); return; }
    setBusy(kind); setMessage(""); setWarnings([]);
    try {
      const filename = `lomasuunnitelma-${model.config.year}.${kind}`;
      if (kind === "pdf") {
        const { exportVacationPdf } = await import("../../platform/vacation/pdf");
        const result = await exportVacationPdf(model);
        downloadBlob(filename, result.bytes, "application/pdf"); setWarnings(result.warnings);
      } else {
        const { vacationToXlsx, vacationToIcs } = await import("../../platform/vacation/exports");
        downloadBlob(filename, kind === "xlsx" ? vacationToXlsx(model) : vacationToIcs(model), kind === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/calendar;charset=utf-8");
      }
      trackPlatformEvent("vacation_planner_export", { year: draft.year, export_type: kind, source: "annual-editor" });
      setMessage("Tiedosto on ladattu.");
    } catch { setMessage("Tiedoston luominen epäonnistui. Yritä uudelleen."); }
    finally { setBusy(null); }
  }
  async function unlock() {
    const result = await provider.startCheckout({ productId: VACATION_PRODUCT, tier: "paid", today });
    if (result.status === "granted") { setLicense(result.license); setUnlockOpen(false); }
    else if (result.status === "redirect") window.location.assign(result.url);
  }
  return <section id="vuosisuunnitelma" className="vp-pro">
    <style dangerouslySetInnerHTML={{ __html: calendarCss + proCss }} />
    <h2>Lomasuunnittelija Pro: vuoden lomasuunnitelma</h2>
    <p>Suunnittele lomat, muut poissaolot ja yrityksen sulkupäivät samaan kalenteriin. Henkilöiden nimet voivat olla omia tunnisteita. Yhteinen näkymä toimii tässä selaimessa ilman tilejä.</p>
    <p>Esikatselu on ilmainen. PDF-, Excel- ja ICS-lataukset kuuluvat Pro-vientiin. Maksaminen ei ole vielä käytössä.</p>
    <div className="cc-layout" data-clarity-mask="True">
      <div className="cc-editor">
        <fieldset className="lookup" disabled={!ready}>
          <legend>Vuosi ja laskentatapa</legend>
          <label htmlFor="vp-year">Suunnitelman vuosi</label><input id="vp-year" type="number" min="2000" max="2100" value={draft.year} onChange={(event) => change({ year: event.target.value })} />
          <label htmlFor="vp-rule">Loman laskentatapa</label><select id="vp-rule" value={draft.leaveRule} onChange={(event) => change({ leaveRule: event.target.value })}>
            <option value="FINLAND_PLANNER">Suunnittelu: viisipäiväinen viikko</option><option value="FINLAND_STATUTORY_LEAVE">Vuosilomalain mukainen kulutus</option>
          </select>
          <p className="note-soft">{DAY_RULES[draft.leaveRule].disclosure}</p>
          <p className="note-soft">Työpäivät ja käytettävyys lasketaan aina viisipäiväisen suunnitteluviikon mukaan. Sulkupäivät vähentävät niitä. Lakisääteisessä laskennassa sulku ei automaattisesti vähennä loman kulutusta. Muut poissaolot eivät kuluta lomapäiviä tässä suunnitelmassa.</p>
          <label htmlFor="vp-layout">Kalenterin asettelu</label><select id="vp-layout" value={draft.layout} onChange={(event) => change({ layout: event.target.value })}>
            <option value="year-glance">Koko vuosi</option><option value="month-page">Kuukausittain</option>
          </select>
          <label htmlFor="vp-notes">Suunnitelman huomautus</label><textarea id="vp-notes" maxLength={1000} value={draft.notes} onChange={(event) => change({ notes: event.target.value })} />
        </fieldset>
        <fieldset className="lookup" disabled={!ready}><legend>Henkilöt ja tunnisteet</legend>
          {draft.people.map((person) => <div className="vp-person" key={person.id}>
            <label htmlFor={`vp-person-${person.id}`}>Henkilön nimi tai tunniste</label>
            <input id={`vp-person-${person.id}`} maxLength={60} value={person.label} onChange={(event) => setRow("people", person.id, { label: event.target.value })} />
            <Button type="button" variant="secondary" disabled={draft.people.length === 1 || draft.periods.some((period) => period.personId === person.id)} onClick={() => removeRow("people", person.id)}>Poista henkilö</Button>
          </div>)}
          <Button type="button" variant="secondary" disabled={draft.people.length >= VACATION_LIMITS.people} onClick={() => change((previous) => ({ ...previous, people: [...previous.people, { id: rowId(), label: `Henkilö ${previous.people.length + 1}` }] }))}>+ Lisää henkilö</Button>
          <p className="note-soft">Poista henkilön jaksot ennen henkilön poistamista.</p>
        </fieldset>
        {[false, true].map((closure) => <fieldset className="lookup" disabled={!ready} key={String(closure)}><legend>{closure ? "Yrityksen sulkupäivät" : "Lomat ja muut poissaolot"}</legend>
          {draft[closure ? "closures" : "periods"].map((period) => {
            const key = closure ? "closures" : "periods";
            return <fieldset className="vp-period" key={period.id}><legend>{closure ? "Sulkupäiväjakso" : "Loma- tai poissaolojakso"}</legend>
              {!closure && <><label htmlFor={`vp-owner-${period.id}`}>Henkilö</label><select id={`vp-owner-${period.id}`} value={period.personId} onChange={(event) => setRow(key, period.id, { personId: event.target.value })}>{draft.people.map((person) => <option value={person.id} key={person.id}>{person.label}</option>)}</select>
                <label htmlFor={`vp-type-${period.id}`}>Jakson laji</label><select id={`vp-type-${period.id}`} value={period.type} onChange={(event) => setRow(key, period.id, { type: event.target.value })}><option value="vacation">Loma</option><option value="absence">Muu poissaolo</option></select></>}
              <label htmlFor={`vp-label-${period.id}`}>Jakson nimi</label><input id={`vp-label-${period.id}`} maxLength={closure ? 120 : 50} value={period.label} onChange={(event) => setRow(key, period.id, { label: event.target.value })} />
              <div className="two-fields"><div><label htmlFor={`vp-start-${period.id}`}>Jakso alkaa</label><input id={`vp-start-${period.id}`} type="date" value={period.start} onChange={(event) => setRow(key, period.id, { start: event.target.value })} /></div>
                <div><label htmlFor={`vp-end-${period.id}`}>Jakso päättyy</label><input id={`vp-end-${period.id}`} type="date" min={period.start || undefined} value={period.end} onChange={(event) => setRow(key, period.id, { end: event.target.value })} /></div></div>
              <label htmlFor={`vp-note-${period.id}`}>Jakson huomautus</label><textarea id={`vp-note-${period.id}`} maxLength={1000} value={period.note} onChange={(event) => setRow(key, period.id, { note: event.target.value })} />
              <Button type="button" variant="secondary" onClick={() => removeRow(key, period.id)}>Poista jakso</Button>
            </fieldset>;
          })}
          <Button type="button" variant="secondary" disabled={draft[closure ? "closures" : "periods"].length >= (closure ? VACATION_LIMITS.closures : VACATION_LIMITS.periods)} onClick={() => addPeriod(closure)}>{closure ? "+ Lisää sulkupäiväjakso" : "+ Lisää loma tai poissaolo"}</Button>
        </fieldset>)}
        {validation.issues.length > 0 && <ul role="alert">{[...new Set(validation.issues)].map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        <p className="note-soft">Tietoja ei lähetetä palvelimelle. Luonnos tallentuu tähän selaimeen vain tallennuspainikkeella. Tallennus voi jäädä myös muiden saman selaimen käyttäjien nähtäväksi.</p>
        <button type="button" className="btn" disabled={!ready} onClick={save}>Tallenna luonnos tähän selaimeen</button>{" "}
        <Button type="button" variant="secondary" disabled={!ready} onClick={reset}>Tyhjennä Pro-luonnos</Button>
      </div>
      <aside className="cc-side" aria-label="Yhteinen lomasuunnitelma">
        <h3>Yhteinen kalenterinäkymä</h3>
        {model ? <><div className="table-wrap"><table className="data-table vp-summary"><thead><tr><th>Henkilö</th><th>Loman laskentapäiviä</th><th>Käytettävissä olevia työpäiviä</th></tr></thead><tbody>{model.summaries.map((person) => <tr key={person.id}><th scope="row">{person.label}</th><td>{person.vacationDays}</td><td>{person.availableDays}</td></tr>)}</tbody></table></div>
          {model.summaries.some((person) => person.overlapDays > 0) && <p className="note-soft">Samalla henkilöllä on päällekkäisiä jaksoja. Vuosiyhteenveto laskee saman päivän vain kerran; tarkista merkinnät.</p>}
          <Preview model={model.calendar} locked={!unlocked} hasLogo={false} logo={null} />
          <p className="note-soft">Kalenterin työpäivät koskevat suunnitteluviikkoa. Vuosiyhteenveto huomioi sulut ja poissaolot. Lomasuunnitelma ei ole lomapäätös eikä palkkalaskelma.</p>
        </> : <p>Korjaa merkityt kohdat, niin esikatselu näkyy.</p>}
        <Exports unavailableMessage="Lomasuunnittelija Pron maksullisia latauksia ei vielä myydä. Maksuton lomasuunnittelija toimii normaalisti. Yrityskalenterin osto avaa vain yrityskalenterin lataukset." formats={["pdf", "xlsx", "ics"]} unlocked={unlocked} busy={busy} message={message} warnings={warnings} unlockOpen={unlockOpen} onExport={exportFile}
          devPanel={import.meta.env.DEV && provider.id === "dev-unlock" ? <><p>Kehitystila: lataukset avataan vain paikallista testausta varten.</p><button type="button" className="btn" onClick={unlock}>Avaa Pro-lataukset (testi)</button></> : null}
          devNote={import.meta.env.DEV && provider.id === "dev-unlock" ? <button type="button" className="btn-link" onClick={() => { if (storage()) clearDevLicense(storage()); setLicense(null); }}>Lukitse Pro-lataukset</button> : null} />
        <p><Link to="/yrityskalenteri/ics">ICS-tiedoston tuontiohjeet</Link>. Tuo yksityinen suunnitelma erilliseen kalenteriin. Tiedostotuonti ei päivity automaattisesti.</p>
      </aside>
    </div>
  </section>;
}
