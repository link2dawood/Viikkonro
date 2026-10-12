import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { teamRpc } from "../../platform/team/client.js";
import { buildShiftModel, validateShiftSnapshot, canManageShifts, canEditAvailability, SHIFT_KINDS, SHIFT_DISCLOSURE } from "../../platform/shifts/model.js";
import { helsinkiInstant, helsinkiLocal, nextLocalDate, shiftInterval } from "../../platform/shifts/time.js";
import { shiftsToPdf, shiftsToXlsx, shiftsToIcs } from "../../platform/shifts/exports.js";
import { downloadBlob } from "../../platform/export/download.js";
import { XLSX_MIME } from "../../platform/export/xlsx.js";
const presets = { morning: { name: "Aamuvuoro", start_time: "06:00", end_time: "14:00", end_day: 0 }, evening: { name: "Iltavuoro", start_time: "14:00", end_time: "22:00", end_day: 0 }, night: { name: "Yövuoro", start_time: "22:00", end_time: "06:00", end_day: 1 }, custom: { name: "Oma vuoro", start_time: "09:00", end_time: "17:00", end_day: 0 } };
const rangeDraft = (s) => ({ id: "", member_id: s.member_id ?? s.members.find((m) => m.active)?.id ?? "", start: `${s.organization.calendar_year}-01-01T09:00`, end: `${s.organization.calendar_year}-01-01T17:00`, notes: "", occurrence: "earlier", endOccurrence: "earlier", expected_version: s.organization.version });
const templateDraft = () => ({ id: "", kind: "morning", ...presets.morning });
export default function ShiftPlanner({ client, organization, onForbidden, onSnapshot }) {
  const orgId = organization.id;
  const [snapshot, setSnapshot] = useState(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [view, setView] = useState("week"), [selected, setSelected] = useState(`${organization.calendar_year}-01-01`), [departmentId, setDepartmentId] = useState("");
  const [shift, setShift] = useState(null), [availability, setAvailability] = useState(null), [template, setTemplate] = useState(templateDraft);
  const alive = useRef(false), version = useRef(0), mutation = useRef(false);
  const lastRole = useRef(null);
  const accept = useCallback((next) => {
    validateShiftSnapshot(next);
    if (!alive.current || next.organization.id !== orgId || next.organization.version < version.current) return false;
    // The shift RPC includes a boundary margin for conflict checks. Keep the
    // leave workspace's existing annual snapshot contract unchanged.
    const y = next.organization.calendar_year;
    const inYear = (row) => row.start_date <= `${y}-12-31` && row.end_date >= `${y}-01-01`;
    if (onSnapshot({ ...next, leaves: next.leaves.filter(inYear), closures: next.closures.filter(inYear) }) === false) return false;
    const roleChanged = lastRole.current !== null && lastRole.current !== next.role;
    lastRole.current = next.role;
    version.current = next.organization.version; setSnapshot(next);
    setShift((s) => !s || roleChanged ? { ...rangeDraft(next), template_id: next.shift_templates[0]?.id ?? "" } : s);
    setAvailability((s) => !s || roleChanged ? rangeDraft(next) : s);
    if (roleChanged) setTemplate(templateDraft());
    return true;
  }, [orgId, onSnapshot]);
  useEffect(() => {
    alive.current = true;
    const refresh = async () => {
      try { accept(await teamRpc(client, "shift_snapshot", { p_org: orgId })); }
      catch (error) { if (alive.current) { setSnapshot(null); setMessage(error.message); if (error.code === "42501") onForbidden(); } }
    };
    refresh(); const timer = setInterval(refresh, 30000); window.addEventListener("focus", refresh);
    return () => { alive.current = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [client, orgId, accept, onForbidden]);
  const { model, modelError } = useMemo(() => {
    if (!snapshot) return { model: null, modelError: "" };
    try {
      const full = buildShiftModel(snapshot, { departmentId }), day = full.days.find((d) => d.key === selected) ?? full.days[0];
      const days = full.days.filter((d) => view === "week" ? d.week === day.week && d.weekYear === day.weekYear : d.key.slice(0, 7) === day.key.slice(0, 7));
      return { model: buildShiftModel(snapshot, { departmentId, from: days[0].key, to: days.at(-1).key }), modelError: "" };
    } catch { return { model: null, modelError: "Työvuorokalenterin tiedot ovat virheelliset. Päivitä tiedot." }; }
  }, [snapshot, departmentId, selected, view]);
  const run = async (operation) => {
    if (mutation.current) return; mutation.current = true; setBusy(true); setMessage("");
    try { await operation(); }
    catch (error) { if (alive.current) { setMessage(error.message); if (error.code === "42501") { setSnapshot(null); onForbidden(); } } }
    finally { mutation.current = false; if (alive.current) setBusy(false); }
  };
  const command = (action, data) => run(async () => {
    await teamRpc(client, "shift_command", { p_org: orgId, p_action: action, p_data: { ...data, expected_version: data.expected_version ?? snapshot.organization.version } });
    if (!alive.current) return;
    const next = await teamRpc(client, "shift_snapshot", { p_org: orgId });
    if (!accept(next)) return;
    setShift({ ...rangeDraft(next), template_id: next.shift_templates[0]?.id ?? "" }); setAvailability(rangeDraft(next)); setTemplate(templateDraft()); setMessage("Muutos tallennettu.");
  });
  const exportFile = (format) => run(async () => {
    const next = await teamRpc(client, "shift_snapshot", { p_org: orgId });
    if (!accept(next)) return;
    const fresh = buildShiftModel(next, { departmentId, from: model.from, to: model.to });
    const data = format === "pdf" ? (await shiftsToPdf(fresh)).bytes : format === "xlsx" ? shiftsToXlsx(fresh) : shiftsToIcs(fresh);
    if (!alive.current) return;
    if (version.current !== next.organization.version) throw new Error("Suunnitelma muuttui viennin aikana. Päivitä ja yritä uudelleen.");
    downloadBlob(`tyovuorot-${fresh.from}-${fresh.to}.${format}`, data, format === "pdf" ? "application/pdf" : format === "xlsx" ? XLSX_MIME : "text/calendar;charset=utf-8"); setMessage("Yksityinen tiedosto on valmis. Jaa vain valtuutetuille henkilöille.");
  });
  const submitPeriod = (event, draft, action) => {
    event.preventDefault();
    try {
      const times = action === "shift" ? shiftInterval(draft.start, draft.end, draft.occurrence, draft.endOccurrence) : { starts_at: helsinkiInstant(draft.start, draft.occurrence), ends_at: helsinkiInstant(draft.end, draft.endOccurrence) };
      const duration = Date.parse(times.ends_at) - Date.parse(times.starts_at);
      if (duration <= 0 || duration > 400 * 86400000) throw new Error("Jakson on kestettävä yli 0 ja enintään 400 päivää.");
      command(action, { ...draft, ...times });
    } catch (error) { setMessage(error.message); }
  };
  const periodFields = (draft, update, ownOnly) => <div className="team-fields"><label>Henkilö<select required value={draft.member_id} onChange={(e) => update({ ...draft, member_id: e.target.value })}>{snapshot.members.filter((m) => m.active && (!ownOnly || m.id === snapshot.member_id)).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label><label>Alku (Suomen aika)<input type="datetime-local" required value={draft.start} onChange={(e) => update({ ...draft, start: e.target.value })} /></label><label>Loppu (Suomen aika)<input type="datetime-local" required value={draft.end} onChange={(e) => update({ ...draft, end: e.target.value })} /></label><label>Toistuva kellonaika talviaikaan siirryttäessä<select value={draft.occurrence} onChange={(e) => update({ ...draft, occurrence: e.target.value })}><option value="earlier">Ensimmäinen esiintymä</option><option value="later">Toinen esiintymä</option></select></label><label>Lopun toistuva kellonaika<select value={draft.endOccurrence} onChange={(e) => update({ ...draft, endOccurrence: e.target.value })}><option value="earlier">Ensimmäinen esiintymä</option><option value="later">Toinen esiintymä</option></select></label><label>Muistiinpano (vain työjärjestelyt)<textarea value={draft.notes} maxLength={500} onChange={(e) => update({ ...draft, notes: e.target.value })} /></label></div>;
  const editPeriod = (row) => ({ ...row, start: helsinkiLocal(row.starts_at), end: helsinkiLocal(row.ends_at), occurrence: helsinkiInstant(helsinkiLocal(row.starts_at)) === new Date(row.starts_at).toISOString() ? "earlier" : "later", endOccurrence: helsinkiInstant(helsinkiLocal(row.ends_at)) === new Date(row.ends_at).toISOString() ? "earlier" : "later", expected_version: snapshot.organization.version });
  const remove = (action, row) => { if (window.confirm("Poistetaanko merkintä?")) command(action, { id: row.id }); };
  return <section aria-label="Työvuorosuunnittelija"><h2>Viikkonro Työvuorosuunnittelija</h2><p>Luo selkeä suomalainen työvuorolista nopeasti. Henkilöt ja tiimit ovat yhteisiä lomasuunnittelijan kanssa.</p><p>{SHIFT_DISCLOSURE}</p>
    {!snapshot ? <p>Työvuorokalenteria ladataan. Jos palvelua ei ole otettu käyttöön, ylläpitäjän on asennettava myös työvuorosuunnittelijan tietokantamigraatio.</p> : model && <>
      <div className="team-fields"><label>Työvuorolistan näkymä<select value={view} onChange={(e) => setView(e.target.value)}><option value="week">Viikko</option><option value="month">Kuukausi</option></select></label><label>Jakson päivä<input type="date" required min={`${model.year}-01-01`} max={`${model.year}-12-31`} value={selected} onChange={(e) => setSelected(e.target.value)} /></label><label>Tiimi / osasto<select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}><option value="">Koko organisaatio</option>{snapshot.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div>
      <p>Jakso {model.from} - {model.to}. Vuodenvaihteen viikko näyttää tämän kalenterivuoden päivät. Vaihda organisaation kalenterivuotta hallinnassa nähdäksesi viereisen vuoden.</p>
      <div className="team-actions"><button disabled={busy} onClick={() => run(async () => { const next = await teamRpc(client, "shift_snapshot", { p_org: orgId }); if (accept(next)) { setShift({ ...rangeDraft(next), template_id: next.shift_templates[0]?.id ?? "" }); setAvailability(rangeDraft(next)); setTemplate(templateDraft()); } })}>Päivitä työvuorot</button>{["pdf", "xlsx", "ics"].map((format) => <button key={format} disabled={busy} onClick={() => exportFile(format)}>Lataa työvuorot {format === "xlsx" ? "Excel" : format.toUpperCase()}</button>)}</div><p>Lataukset sisältävät näkyvän viikon tai kuukauden ja valitun tiimin. Vuodenvaihteen yli jatkuva vuoro säilyttää koko kestonsa. Pyhäpäivät eivät automaattisesti estä vuoron suunnittelua.</p>
      <div className="team-scroll"><table><caption>Työvuorolista ja päiväkattavuus</caption><thead><tr><th>Päivä / ISO</th><th>Pyhä / sulku</th><th>Vuorot</th><th>Kattavuus</th></tr></thead><tbody>{model.days.map((d) => <tr key={d.key}><th>{d.key}<br />{d.week}/{d.weekYear}</th><td>{d.closed ? "Yrityksen sulku" : d.events.filter((h) => h.kind === "holiday").map((h) => h.title).join(", ")}</td><td>{d.shifts.length ? d.shifts.map((s) => <div key={s.id}>{s.member.label}: {s.template.name} {helsinkiLocal(s.starts_at).replace("T", " ")} - {helsinkiLocal(s.ends_at).replace("T", " ")}{s.notes && <p>{s.notes}</p>}{s.conflicts.length > 0 && <strong className="shift-warning">{s.conflicts.join(", ")}</strong>}{canManageShifts(snapshot) && <><button disabled={busy} onClick={() => setShift(editPeriod(s))}>Muokkaa vuoroa</button><button disabled={busy} onClick={() => remove("remove_shift", s)}>Poista vuoro</button></>}</div>) : "Ei vuoroja"}</td><td>{d.scheduled} henkilöä päivän aikana{d.lowShiftCoverage && <strong className="shift-warning">Alle päivätavoitteen {snapshot.organization.min_coverage}</strong>}</td></tr>)}</tbody></table></div>
      <p>Päivät ilman vuoroja eivät tuota kattavuushälytystä. Tiimirajauksessa organisaation päivätavoitetta ei käytetä. Kattavuus ei arvioi palvelutarvetta tai yhtäaikaista miehitystä.</p>
      {canManageShifts(snapshot) && <><section><h3>{shift?.id ? "Muokkaa vuoroa" : "Lisää työvuoro"}</h3>{snapshot.shift_templates.length === 0 ? <p>Luo ensin vuoromalli alla.</p> : shift && <form aria-label="Vuorolomake" onSubmit={(e) => submitPeriod(e, shift, "shift")}><fieldset disabled={busy}>{periodFields(shift, setShift, false)}<label>Vuoromalli<select required value={shift.template_id} onChange={(e) => setShift({ ...shift, template_id: e.target.value })}>{snapshot.shift_templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Mallin päivämäärä<input type="date" defaultValue={`${model.year}-01-01`} onChange={(e) => { const t = snapshot.shift_templates.find((r) => r.id === shift.template_id); if (t && e.target.value) setShift({ ...shift, start: `${e.target.value}T${t.start_time.slice(0, 5)}`, end: `${t.end_day ? nextLocalDate(e.target.value) : e.target.value}T${t.end_time.slice(0, 5)}` }); }} /></label><p>Mallin päivämäärä täyttää kellonajat. Voit muuttaa aikoja ennen tallennusta. Mallin muokkaaminen ei muuta tallennettujen vuorojen aikoja.</p><button disabled={!shift.member_id || !shift.template_id}>Tallenna vuoro</button><button type="button" onClick={() => setShift({ ...rangeDraft(snapshot), template_id: snapshot.shift_templates[0]?.id ?? "" })}>Tyhjennä vuorolomake</button></fieldset></form>}</section>
      <details><summary>Vuoromallit</summary><form aria-label="Vuoromallilomake" onSubmit={(e) => { e.preventDefault(); command("template", template); }}><fieldset disabled={busy}><label>Vuoron tyyppi<select value={template.kind} onChange={(e) => setTemplate({ ...template, kind: e.target.value, ...presets[e.target.value] })}>{Object.entries(SHIFT_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Mallin nimi<input required maxLength={60} value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} /></label><label>Alkukello<input required type="time" value={template.start_time.slice(0, 5)} onChange={(e) => setTemplate({ ...template, start_time: e.target.value })} /></label><label>Loppukello<input required type="time" value={template.end_time.slice(0, 5)} onChange={(e) => setTemplate({ ...template, end_time: e.target.value })} /></label><label>Loppupäivä<select value={template.end_day} onChange={(e) => setTemplate({ ...template, end_day: Number(e.target.value) })}><option value={0}>Sama päivä</option><option value={1}>Seuraava päivä</option></select></label><button>Tallenna vuoromalli</button><button type="button" onClick={() => setTemplate(templateDraft())}>Tyhjennä mallilomake</button></fieldset></form><ul>{snapshot.shift_templates.map((t) => <li key={t.id}>{t.name}: {t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}{t.end_day ? " (seuraava päivä)" : ""} <button disabled={busy} onClick={() => setTemplate({ ...t, expected_version: snapshot.organization.version })}>Muokkaa mallia</button><button disabled={busy} onClick={() => remove("remove_template", t)}>Poista malli</button></li>)}</ul><p>Käytössä olevaa mallia ei voi poistaa. Esimerkkiajat eivät ole suositus lain tai työehtosopimuksen mukaisista vuoroista.</p></details></>}
      <section><h3>Ei käytettävissä</h3><p>Merkitse aika, jolloin vuoroa ei voi suunnitella. Muu aika tarkoittaa vain, ettei estettä ole kirjattu. Hyväksytyt lomat ja yrityksen sulut huomioidaan erikseen. Työntekijä muokkaa vain omia merkintöjään.</p>{availability && <form aria-label="Estelomake" onSubmit={(e) => submitPeriod(e, availability, "availability")}><fieldset disabled={busy}>{periodFields(availability, setAvailability, !canManageShifts(snapshot))}<button disabled={!availability.member_id}>Tallenna este</button><button type="button" onClick={() => setAvailability(rangeDraft(snapshot))}>Tyhjennä estelomake</button></fieldset></form>}<ul>{model.availability.map((a) => <li key={a.id}>{snapshot.members.find((m) => m.id === a.member_id)?.label}: {helsinkiLocal(a.starts_at)} - {helsinkiLocal(a.ends_at)} {a.notes}{canEditAvailability(snapshot, a) && <><button disabled={busy} onClick={() => setAvailability(editPeriod(a))}>Muokkaa estettä</button><button disabled={busy} onClick={() => remove("remove_availability", a)}>Poista este</button></>}</li>)}</ul></section>
    </>}{(message || modelError) && <p role="status">{message || modelError}</p>}
  </section>;
}
