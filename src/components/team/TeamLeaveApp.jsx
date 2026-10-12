import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTeamClient, teamRpc } from "../../platform/team/client";
import { buildTeamModel, canEditTeamLeave, teamLeaveLabel, TEAM_STATUSES, validateTeamSnapshot } from "../../platform/team/model";
import { teamToXlsx, teamToIcs, teamToPdf } from "../../platform/team/exports";
import { downloadBlob } from "../../platform/export/download";
import { XLSX_MIME } from "../../platform/export/xlsx";
import TeamCalendar from "./TeamCalendar";
import TeamSettings from "./TeamSettings";
import TeamRecovery from "./TeamRecovery";
import ShiftPlanner from "./ShiftPlanner";
import BusinessWorkspace from "./BusinessWorkspace";
import "./team.css";
import "../planning/plannerControls.css";
const blankLeave = (s) => ({ id: "", member_id: s.member_id ?? "", type_id: s.types[0]?.id ?? "", start_date: `${s.organization.calendar_year}-01-01`, end_date: `${s.organization.calendar_year}-01-01`, status: s.role === "employee" ? "pending" : "approved", expected_version: s.organization.version });
export default function TeamLeaveApp({ client: injectedClient }) {
  const [client] = useState(() => { try { return injectedClient === undefined ? createTeamClient() : injectedClient; } catch { return null; } });
  const [session, setSession] = useState(null), [organizations, setOrganizations] = useState([]), [orgId, setOrgId] = useState("");
  const [snapshot, setSnapshot] = useState(null), [leave, setLeave] = useState(null), [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false), [inviteToken, setInviteToken] = useState("");
  const [workspace, setWorkspace] = useState("leave");
  const [businessOpen, setBusinessOpen] = useState(false);
  const [view, setView] = useState("month"), [month, setMonth] = useState(new Date().getMonth()), [departmentId, setDepartmentId] = useState(""), [includePending, setIncludePending] = useState(true);
  const generation = useRef(0), live = useRef({ user: null, org: "" });
  const latestVersion = useRef(0);
  const acceptSnapshot = useCallback((next) => {
    validateTeamSnapshot(next);
    if (next.organization.id !== live.current.org || next.organization.version < latestVersion.current) return false;
    latestVersion.current = next.organization.version; setSnapshot(next); return true;
  }, []);
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      if (live.current.user !== (next?.user?.id ?? null)) {
        generation.current += 1; live.current = { user: next?.user?.id ?? null, org: "" };
        latestVersion.current = 0;
        setSnapshot(null); setOrganizations([]); setOrgId(""); setInviteToken(""); setLeave(null);
      }
      setSession(next);
    });
    return () => { data.subscription.unsubscribe(); generation.current += 1; };
  }, [client]);
  useEffect(() => {
    if (!client || !userId) return;
    let current = true;
    teamRpc(client, "team_list_organizations").then((rows) => { if (current) setOrganizations(rows); }).catch(() => { if (current) setMessage("Organisaatioiden lataus epäonnistui."); });
    return () => { current = false; };
  }, [client, userId]);
  const selectOrganization = useCallback((id) => {
    generation.current += 1; live.current.org = id; setSnapshot(null); setLeave(null); setInviteToken(""); setDepartmentId(""); setMessage(""); setOrgId(id);
    latestVersion.current = 0;
  }, []);
  useEffect(() => {
    if (!client || !userId || !orgId) return;
    const epoch = generation.current; let active = true;
    const refresh = () => teamRpc(client, "team_snapshot", { p_org: orgId }).then((next) => {
      if (active && epoch === generation.current && acceptSnapshot(next)) setLeave((previous) => previous ?? blankLeave(next));
    }).catch((error) => { if (active && epoch === generation.current) { if (error.code === "42501") selectOrganization(""); else { setSnapshot(null); setLeave(null); } setMessage(error.message); } });
    refresh(); const timer = setInterval(refresh, 30000); window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [client, userId, orgId, acceptSnapshot, selectOrganization]);
  const { model, modelError } = useMemo(() => { try { return { model: snapshot ? buildTeamModel(snapshot, { departmentId, includePending }) : null, modelError: "" }; } catch { return { model: null, modelError: "Kalenterin tiedot ovat virheelliset. Päivitä tiedot." }; } }, [snapshot, departmentId, includePending]);
  const authenticate = async (event, signup) => {
    event.preventDefault(); const form = event.currentTarget, fields = Object.fromEntries(new FormData(form));
    setBusy(true); setMessage("");
    try {
      const result = await (signup ? client.auth.signUp({ email: fields.email, password: fields.password, options: { emailRedirectTo: `${window.location.origin}/tiimin-lomat/suunnittelu` } }) : client.auth.signInWithPassword({ email: fields.email, password: fields.password }));
      if (result.error) throw new Error();
      if (signup) setMessage("Tarkista sähköpostisi ja vahvista osoite. Kirjaudu tämän jälkeen sisään. Jos osoite on jo käytössä, käytä kirjautumista.");
    } catch { setMessage("Kirjautuminen tai rekisteröinti epäonnistui. Tarkista tiedot ja sähköpostin vahvistus."); }
    finally { form.reset(); setBusy(false); }
  };
  const run = async (operation) => { if (busy) return; setBusy(true); setMessage(""); try { await operation(); } catch (error) { if (error.code === "42501") selectOrganization(""); setMessage(error.message); } finally { setBusy(false); } };
  const command = (action, data) => run(async () => {
    const epoch = generation.current;
    const result = await teamRpc(client, "team_command", { p_org: orgId, p_action: action, p_data: { ...data, expected_version: data.expected_version ?? snapshot.organization.version } });
    if (epoch !== generation.current) return;
    if (action === "delete_organization") { selectOrganization(""); const listEpoch = generation.current, rows = await teamRpc(client, "team_list_organizations"); if (listEpoch === generation.current) setOrganizations(rows); return; }
    const next = await teamRpc(client, "team_snapshot", { p_org: orgId });
    if (epoch !== generation.current) return;
    if (!acceptSnapshot(next)) return;
    if (result.token) setInviteToken(result.token); setLeave(blankLeave(next)); setMessage("Muutos tallennettu.");
  });
  const forbidden = useCallback(() => selectOrganization(""), [selectOrganization]);
  const refreshNow = () => run(async () => {
    const epoch = generation.current;
    try { const next = await teamRpc(client, "team_snapshot", { p_org: orgId }); if (epoch === generation.current && acceptSnapshot(next)) setLeave(blankLeave(next)); }
    catch (error) { if (epoch === generation.current) { setSnapshot(null); setLeave(null); } throw error; }
  });
  const exportFile = (format) => run(async () => {
    const epoch = generation.current; let next;
    try { next = await teamRpc(client, "team_snapshot", { p_org: orgId }); }
    catch (error) { if (epoch === generation.current) setSnapshot(null); throw error; }
    if (epoch !== generation.current) return;
    if (!acceptSnapshot(next)) throw new Error("Kalenteri muuttui. Päivitä tiedot ennen vientiä.");
    const fresh = buildTeamModel(next, { departmentId, includePending });
    const data = format === "pdf" ? (await teamToPdf(fresh)).bytes : format === "xlsx" ? teamToXlsx(fresh) : teamToIcs(fresh);
    if (epoch !== generation.current) return;
    if (latestVersion.current !== fresh.snapshot.organization.version) { setMessage("Suunnitelma muuttui viennin aikana. Päivitä tiedot ja yritä uudelleen."); return; }
    downloadBlob(`tiimin-lomat-${fresh.calendar.year}.${format}`, data, format === "pdf" ? "application/pdf" : format === "xlsx" ? XLSX_MIME : "text/calendar;charset=utf-8"); setMessage("Yksityinen tiedosto on valmis. Jaa vain valtuutetuille henkilöille.");
  });
  const signOut = async () => {
    generation.current += 1; live.current = { user: null, org: "" }; setSnapshot(null); setSession(null); setOrgId(""); setOrganizations([]); setLeave(null); setInviteToken(""); setMessage("");
    latestVersion.current = 0;
    await client.auth.signOut({ scope: "local" });
  };
  return <div className="team-app" data-clarity-mask="True"><header><a href="/tiimin-lomat">Viikkonro Tiimin lomasuunnittelija</a><h1>Tiimin lomasuunnitelma</h1><p>Yksityinen yhteinen kalenteri. Ei palkanlaskentaa, terveystietoja, mainontaa tai analytiikkaa.</p>{session && <button onClick={signOut}>Kirjaudu ulos</button>}</header>
    {!client ? <section><h2>Palvelua ei ole vielä kytketty käyttöön</h2><p>Supabase-yhteys ja tietokannan käyttöoikeussäännöt on otettava käyttöön ennen yhteistä suunnittelua. Kirjautumista tai jaettua tallennusta ei simuloida.</p><a href="/lomasuunnittelija">Avaa maksuton henkilökohtainen lomasuunnittelija</a></section> : !session ? <section className="team-auth"><h2>Kirjaudu sisään</h2><p>Tarvitset vahvistetun sähköpostiosoitteen. Istunto säilyy vain tässä välilehdessä; sivun uudelleenlataus vaatii uuden kirjautumisen.</p><form onSubmit={(e) => authenticate(e, false)}><fieldset disabled={busy}><label>Sähköposti<input name="email" type="email" required autoComplete="username" /></label><label>Salasana<input name="password" type="password" minLength={12} required autoComplete="current-password" /></label><button>Kirjaudu</button></fieldset></form>
    <details><summary>Luo uusi tili</summary><form onSubmit={(e) => authenticate(e, true)}><fieldset disabled={busy}><label>Sähköposti<input name="email" type="email" required autoComplete="email" /></label><label>Salasana (vähintään 12 merkkiä)<input name="password" type="password" minLength={12} required autoComplete="new-password" /></label><button>Luo tili</button></fieldset></form></details><TeamRecovery client={client} /><p>Keräämme vain kirjautumisen sähköpostin ja organisaation suunnittelussa tarvittavat tiedot. Älä kirjaa henkilötunnuksia, terveystietoja tai vapaan yksityisiä perusteita.</p></section> : <>
      <details onToggle={(event) => setBusinessOpen(event.currentTarget.open)}><summary>Tilitoimiston asiakasyritykset</summary>{businessOpen && <BusinessWorkspace key={userId} client={client} userId={userId} organizations={organizations} />}</details>
      <section className="team-org"><h2>Valitse organisaatio</h2><label>Organisaatio<select value={orgId} onChange={(e) => selectOrganization(e.target.value)}><option value="">Valitse organisaatio</option>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
      <details><summary>Luo organisaatio</summary><form onSubmit={(e) => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); run(async () => { const epoch = generation.current; const id = await teamRpc(client, "team_create_organization", { p_name: data.name, p_year: Number(data.year), p_label: data.label }); if (epoch !== generation.current) return; const rows = await teamRpc(client, "team_list_organizations"); if (epoch !== generation.current) return; setOrganizations(rows); selectOrganization(id); }); }}><fieldset disabled={busy}><label>Yrityksen nimi<input name="name" required maxLength={80} /></label><label>Kalenterivuosi<input name="year" type="number" min={2000} max={2100} required defaultValue={new Date().getFullYear()} /></label><label>Oma nimi tai tiimitunniste<input name="label" maxLength={80} required /></label><button>Luo organisaatio</button></fieldset></form></details>
      <details><summary>Liity kutsukoodilla</summary><form onSubmit={(e) => { e.preventDefault(); const token = new FormData(e.currentTarget).get("token"); e.currentTarget.reset(); run(async () => { const epoch = generation.current; const id = await teamRpc(client, "team_accept_invite", { p_token: token }); if (epoch !== generation.current) return; const rows = await teamRpc(client, "team_list_organizations"); if (epoch !== generation.current) return; setOrganizations(rows); selectOrganization(id); }); }}><fieldset disabled={busy}><label>Kutsukoodi<input name="token" required minLength={64} maxLength={64} autoComplete="off" /></label><button>Liity organisaatioon</button></fieldset></form></details>
      </section>
      {snapshot && model && <><nav className="team-actions" aria-label="Suunnittelutyökalu"><button aria-pressed={workspace === "leave"} onClick={() => { setWorkspace("leave"); setLeave(blankLeave(snapshot)); }}>Lomasuunnittelu</button><button aria-pressed={workspace === "shifts"} onClick={() => setWorkspace("shifts")}>Työvuorosuunnittelu</button></nav>{workspace === "shifts" ? <ShiftPlanner key={`${orgId}-${snapshot.role}-${snapshot.organization.calendar_year}`} client={client} organization={snapshot.organization} onForbidden={forbidden} onSnapshot={acceptSnapshot} /> : <><section className="team-controls"><h2>Yhteinen kalenteri</h2><p>Käyttöoikeus: {snapshot.role === "owner" ? "Omistaja" : snapshot.role === "manager" ? "Esihenkilö" : "Työntekijä"}. Tiedot päivittyvät 30 sekunnin välein ja välilehteen palattaessa.</p><div className="team-fields"><label>Näkymä<select value={view} onChange={(e) => setView(e.target.value)}><option value="month">Kuukausi</option><option value="year">Vuosi</option></select></label>{view === "month" && <label>Kuukausi<select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{model.calendar.months.map((m) => <option key={m.index} value={m.index}>{m.name}</option>)}</select></label>}<label>Osasto<select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}><option value="">Koko tiimi</option>{snapshot.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div><label><input type="checkbox" checked={includePending} onChange={(e) => setIncludePending(e.target.checked)} /> Mukaan hyväksyntää odottavat pyynnöt</label><button disabled={busy} onClick={refreshNow}>Päivitä tiedot</button><div className="team-actions">{["pdf", "xlsx", "ics"].map((format) => <button key={format} disabled={busy} onClick={() => exportFile(format)}>Lataa {format === "xlsx" ? "Excel" : format.toUpperCase()}</button>)}</div><p>Lataukset sisältävät valitun osaston tai koko tiimin koko kalenterivuoden. Kuukausivalinta rajaa vain näytön esikatselua.</p></section>
      <TeamCalendar model={model} view={view} month={month} />
      {leave && <section className="team-leave-editor"><h2>{leave.id ? "Muokkaa poissaoloa" : "Lisää poissaolo"}</h2><form onSubmit={(e) => { e.preventDefault(); command("leave", { ...leave, status: snapshot.role === "employee" ? "pending" : leave.status }); }}><fieldset disabled={busy}><div className="team-fields"><label>Tiimin jäsen<select required value={leave.member_id} onChange={(e) => setLeave({ ...leave, member_id: e.target.value })}>{snapshot.members.filter((m) => m.active && (snapshot.role !== "employee" || m.id === snapshot.member_id)).map((m) => <option value={m.id} key={m.id}>{m.label}</option>)}</select></label><label>Poissaololaji<select required value={leave.type_id} onChange={(e) => setLeave({ ...leave, type_id: e.target.value })}>{snapshot.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Alku<input type="date" required value={leave.start_date} onChange={(e) => setLeave({ ...leave, start_date: e.target.value })} /></label><label>Loppu<input type="date" required value={leave.end_date} onChange={(e) => setLeave({ ...leave, end_date: e.target.value })} /></label>{snapshot.role !== "employee" && <label>Tila<select value={leave.status} onChange={(e) => setLeave({ ...leave, status: e.target.value })}>{Object.entries(TEAM_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}</div><p>Jakso voi ylittää vuodenvaihteen ja olla enintään 400 päivää. Työntekijän pyyntö odottaa esihenkilön hyväksyntää.</p><button disabled={!leave.member_id || !leave.type_id}>Tallenna poissaolo</button>{leave.id && <button type="button" onClick={() => setLeave(blankLeave(snapshot))}>Peru muokkaus</button>}</fieldset></form></section>}
      <section className="team-leaves"><h2>Vuoden poissaolot ja pyynnöt</h2><div className="team-scroll"><table><thead><tr><th>Jäsen</th><th>Jakso</th><th>Laji</th><th>Tila</th><th>Toiminnot</th></tr></thead><tbody>{snapshot.leaves.map((l) => <tr key={l.id}><td>{snapshot.members.find((m) => m.id === l.member_id)?.label}</td><td>{l.start_date}-{l.end_date}</td><td>{teamLeaveLabel(snapshot, l)}</td><td>{TEAM_STATUSES[l.status]}</td><td>{canEditTeamLeave(snapshot, l) && <><button disabled={busy} onClick={() => setLeave({ ...l, expected_version: snapshot.organization.version })}>Muokkaa</button><button disabled={busy} onClick={() => { if (window.confirm("Poistetaanko poissaolo?")) command("remove_leave", { id: l.id }); }}>Poista</button></>}</td></tr>)}</tbody></table></div></section>
      </>}{snapshot.role !== "employee" && <details><summary>Organisaation hallinta</summary><TeamSettings key={`${orgId}-${snapshot.organization.version}`} snapshot={snapshot} command={command} busy={busy} inviteToken={inviteToken} /></details>}
      </>}
    </>}
    {(message || modelError) && <p role="status">{message || modelError}</p>}
    <footer><p>Pidä käyttöoikeudet ajan tasalla. Ladattuja tiedostoja ei voi perua jälkikäteen. Organisaatio vastaa tietojen tarpeellisuudesta ja säilytysajoista.</p><a href="/tiimin-lomat">Tuotteen tiedot ja käyttöoikeudet</a></footer>
  </div>;
}
