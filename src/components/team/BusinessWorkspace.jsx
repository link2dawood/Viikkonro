import { useEffect, useMemo, useRef, useState } from "react";
import { teamRpc } from "../../platform/team/client.js";
import { BUSINESS_ACTION_LABELS, BUSINESS_ROLE_LABELS, canEditCompanyCalendar, canManageClientAccess, createBusinessScope, initialCompanyConfiguration, reusableCompanyTemplate, companyCalendarModel } from "../../platform/businessWorkspace/model.js";
import { BUSINESS_BILLING } from "../../platform/businessWorkspace/billing.js";
import { artifactHash, exportCompanyCalendar } from "../../platform/businessWorkspace/exports.js";
import { configFromJson, configToJson } from "../../platform/calendar/config.js";
import { dayKey } from "../../platform/calendar/events.js";
import { downloadBlob } from "../../platform/export/download.js";
import { XLSX_MIME } from "../../platform/export/xlsx.js";
import { DAY_RULES } from "../../data/dayRules.js";
const ruleNames={FINLAND_WORKDAY:"Suomen työpäivät",FINLAND_PROJECT:"Projektin työpäivät",FINLAND_SPRINT:"Sprintin työpäivät",FINLAND_PLANNER:"Lomasuunnittelu, viisipäiväinen viikko",FINLAND_BANKING:"Pankkipäivät",FINLAND_STATUTORY_LEAVE:"Vuosilomalain lomapäivät"};

export default function BusinessWorkspace({ client, userId, organizations }) {
  const [list, setList] = useState({ firms: [], clients: [] }), [clientId, setClientId] = useState(""), [year, setYear] = useState(new Date().getFullYear());
  const [snapshot, setSnapshot] = useState(null), [draft, setDraft] = useState(null), [templates, setTemplates] = useState([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const guard = useRef(createBusinessScope()), epoch = useRef(0), latest = useRef(null), draftVersion = useRef(0);
  const clear = () => { guard.current.reset(); epoch.current += 1; latest.current = null; setSnapshot(null); setDraft(null); setTemplates([]); setMessage(""); };
  const selected = list.clients.find((row) => row.id === clientId);
  useEffect(() => {
    const currentGuard = guard.current;
    let active = true;
    teamRpc(client,"business_list").then((rows) => { if (active) setList(rows); }).catch(() => { if (active) setMessage("Asiakasyritysten tietokantamigraatio tai käyttöoikeus puuttuu."); });
    return () => { active = false; currentGuard.reset(); epoch.current += 1; latest.current = null; };
  }, [client, userId]);
  useEffect(() => {
    const currentGuard = guard.current;
    setSnapshot(null); setDraft(null); setTemplates([]); latest.current = null;
    const token = guard.current.reset(`${clientId}:${year}`); epoch.current += 1;
    if (!clientId) return;
    let active = true;
    const refresh = async () => {
      try {
        const next = await teamRpc(client,"business_snapshot",{p_client:clientId,p_year:year});
        if (!active || !guard.current.accept(next,token,clientId,year)) return;
        const previous = latest.current; latest.current = next; setSnapshot(next);
        if (!previous || previous.role !== next.role) { setDraft(next.calendar?.configuration ?? initialCompanyConfiguration(next.client.name,year)); draftVersion.current = next.calendar?.version ?? 0; }
        if (previous && (previous.role !== next.role || previous.firmVersion !== next.firmVersion)) {
          setTemplates([]); setList({firms:[],clients:[{id:next.client.id,firmId:next.client.firmId,name:next.client.name,role:next.role}]});
          let rows;
          try { rows=await teamRpc(client,"business_list"); } catch { rows=null; }
          if(rows && active && guard.current.current(token) && latest.current===next)setList(rows);
        }
        if (["firm_owner","firm_manager"].includes(next.role)) {
          let rows;
          try { rows=await teamRpc(client,"business_templates_list",{p_org:next.client.firmId}); } catch { rows=[]; }
          if (active && guard.current.current(token) && latest.current === next) setTemplates(rows);
        } else setTemplates([]);
      } catch {
        if (active && guard.current.current(token)) { clear(); setClientId(""); setMessage("Yrityksen tietoja ei voi avata. Tarkista käyttöoikeutesi."); teamRpc(client,"business_list").then((rows) => { if (active) setList(rows); }).catch(() => {}); }
      }
    };
    refresh(); const timer = setInterval(refresh,30000); window.addEventListener("focus",refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus",refresh); currentGuard.reset(); epoch.current += 1; latest.current = null; };
  }, [client,clientId,year]);
  const model = useMemo(() => { try { return draft ? companyCalendarModel({ ...snapshot, calendar: { id:snapshot.calendar?.id ?? snapshot.client.id, version:Math.max(1,snapshot.calendar?.version ?? 0),configuration:draft } }) : null; } catch { return null; } },[draft,snapshot]);
  const run = async (operation) => { if (busy) return; const token = epoch.current; setBusy(true); setMessage(""); try { await operation(token); } catch (error) { if (token === epoch.current) { if (error.code === "42501") { clear(); setClientId(""); setList({firms:[],clients:[]}); } setMessage("Toiminto epäonnistui. Tarkista oikeudet tai lataa uusin tallennettu kalenteri."); } } finally { setBusy(false); } };
  const reload = async (token, resetDraft = true) => {
    const next = await teamRpc(client,"business_snapshot",{p_client:clientId,p_year:year});
    if (token !== epoch.current || !guard.current.accept(next,guard.current.token(),clientId,year)) return null;
    latest.current = next; setSnapshot(next);
    if (resetDraft) { setDraft(next.calendar?.configuration ?? initialCompanyConfiguration(next.client.name,year)); draftVersion.current = next.calendar?.version ?? 0; }
    return next;
  };
  const command = (action,data) => run(async (token) => {
    await teamRpc(client,"business_client_command",{p_client:clientId,p_action:action,p_data:data});
    if (token !== epoch.current) return;
    if (action === "delete_client") { setList(current=>({...current,clients:current.clients.filter(c=>c.id!==clientId)}));clear();setClientId(""); }
    else { await reload(token); if (token === epoch.current) setMessage("Muutos tallennettu."); }
  });
  const firmCommand = (firm,action,data) => run(async (token) => {
    await teamRpc(client,"business_firm_command",{p_org:firm,p_action:action,p_data:data});
    const listScope=latest.current;
    const rows = await teamRpc(client,"business_list");
    if (token !== epoch.current || latest.current!==listScope) return; setList(rows);
    if (snapshot && firm === snapshot.client.firmId) { const scope=latest.current;const rows = await teamRpc(client,"business_templates_list",{p_org:firm}); if (token === epoch.current && latest.current===scope && ["firm_owner","firm_manager"].includes(scope.role)) setTemplates(rows); }
    if (token === epoch.current) setMessage("Muutos tallennettu.");
  });
  const change = (patch) => setDraft((current) => ({...current,...patch}));
  const readLogo = async (event) => {
    const element=event.currentTarget,file=element.files[0],token=epoch.current,scope=latest.current;
    if(!file)return;
    try {
      if(file.size>512*1024 || !["image/png","image/svg+xml"].includes(file.type))throw new Error();
      const dataUri=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      const next=configToJson(configFromJson({...draft,branding:{...draft.branding,logo:{dataUri}}}));
      if(token===epoch.current && latest.current===scope && canEditCompanyCalendar(scope.role))setDraft(next);
    } catch { if(token===epoch.current && latest.current===scope)setMessage("Logo ei kelpaa. Käytä turvallista PNG- tai SVG-tiedostoa, enintään 512 KB."); }
    finally { element.value=""; }
  };
  const exportFile = (format) => run(async (token) => {
    const fresh = await reload(token, false); if (!fresh?.calendar) return;
    const data = await exportCompanyCalendar(fresh,format), sha256 = await artifactHash(data);
    if (token !== epoch.current || latest.current?.client.version !== fresh.client.version || latest.current?.firmVersion !== fresh.firmVersion) return;
    await teamRpc(client,"business_client_command",{p_client:clientId,p_action:"export_record",p_data:{year,expected_version:fresh.calendar.version,format,sha256}});
    if (token !== epoch.current) return;
    downloadBlob(`yrityskalenteri-${year}.${format}`,data,format === "pdf" ? "application/pdf" : format === "xlsx" ? XLSX_MIME : format === "ics" ? "text/calendar;charset=utf-8" : "text/csv;charset=utf-8");
    await reload(token,false); if (token === epoch.current) setMessage("Yksityinen tiedosto valmisteltu. Vientihistoria ei todista tiedoston myöhempää vastaanottoa.");
  });
  return <section aria-label="Asiakasyritysten kalenterit"><h2>Tilitoimiston ja HR-palvelun asiakaskalenterit</h2><p>Valitse asiakasyritys. Tiedot ovat yksityisiä ja yritysten käyttöoikeudet erillisiä. {BUSINESS_BILLING.chargingEnabled ? "" : "Esikatselukäyttö, ei veloituksia."}</p>
    <details><summary>Ota organisaatio käyttöön tilitoimistona</summary>{organizations.filter((o)=>o.role === "owner").map((o)=><button key={o.id} disabled={busy} onClick={()=>firmCommand(o.id,"enable",{})}>Ota käyttöön: {o.name}</button>)}</details>
    {list.firms.length > 0 && <form onSubmit={(e)=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));firmCommand(values.firm,"create_client",{name:values.name});}}><fieldset disabled={busy}><legend>Lisää asiakasyritys</legend><label>Tilitoimisto<select name="firm">{list.firms.map((f)=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label>Asiakasyrityksen nimi<input name="name" maxLength={80} required /></label><button>Lisää yritys</button></fieldset></form>}
    <label>Asiakasyritys<select aria-label="Asiakasyritys" value={clientId} disabled={busy} onChange={(e)=>{clear();setClientId(e.target.value);}}><option value="">Valitse yritys</option>{list.clients.map((c)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
    <button disabled={busy} onClick={()=>run(async(token)=>{const scope=latest.current;const rows=await teamRpc(client,"business_list");if(token===epoch.current && latest.current===scope)setList(rows);})}>Päivitä asiakasluettelo</button>
    <label>Asiakaskalenterin vuosi<input type="number" min={2000} max={2100} value={year} disabled={busy} onChange={(e)=>{const y=Number(e.target.value);if(Number.isInteger(y)&&y>=2000&&y<=2100){clear();setYear(y);}}}/></label>
    {snapshot && draft && <><p data-business-role={snapshot.role}>Käyttöoikeus: {BUSINESS_ROLE_LABELS[snapshot.role]}. Tallennettu versio: {snapshot.calendar?.version ?? 0}.</p><button disabled={busy} onClick={()=>run((token)=>reload(token))}>Lataa tallennettu kalenteri</button>
      {canEditCompanyCalendar(snapshot.role) && <form onSubmit={(e)=>{e.preventDefault();try{const configuration=configToJson(configFromJson(draft));command("save_calendar",{year,expected_version:draftVersion.current,configuration});}catch{setMessage("Kalenterin asetukset eivät kelpaa.");}}}><fieldset disabled={busy}><legend>Yrityksen kalenteriasetukset</legend>
        <label>Kalenterin yritysnimi<input maxLength={80} value={draft.branding.companyName} onChange={(e)=>change({branding:{...draft.branding,companyName:e.target.value}})}/></label>
        <label>Pääväri<input type="color" value={draft.branding.primaryColor ?? "#1f7a5c"} onChange={(e)=>change({branding:{...draft.branding,primaryColor:e.target.value}})}/></label>
        <label>Logo (PNG tai SVG)<input type="file" accept="image/png,image/svg+xml" onChange={readLogo}/></label><button type="button" onClick={()=>change({branding:{...draft.branding,logo:null}})}>Poista logo</button>
        <label>Ulkoasu<select value={typeof draft.layout === "string" ? draft.layout : draft.layout.id} onChange={(e)=>change({layout:e.target.value})}><option value="year-glance">Vuosi yhdellä sivulla</option><option value="month-page">Kuukausi sivulla</option><option value="week-list">Viikkoluettelo</option></select></label>
        <label>Päivien laskentasääntö<select value={draft.dayRuleMode} onChange={(e)=>change({dayRuleMode:e.target.value})}>{Object.values(DAY_RULES).map(rule=><option key={rule.id} value={rule.id}>{ruleNames[rule.id]}</option>)}</select></label><p>{DAY_RULES[draft.dayRuleMode]?.disclosure}</p>
        <label><input type="checkbox" checked={draft.include.holidays} onChange={(e)=>change({include:{...draft.include,holidays:e.target.checked}})}/> Suomen pyhäpäivät</label><label><input type="checkbox" checked={draft.include.flagDays} onChange={(e)=>change({include:{...draft.include,flagDays:e.target.checked}})}/> Liputuspäivät</label>
        <label>Yrityksen tapahtumat (päivä, otsikko){draft.events.map((event,i)=><div key={event.id}><input aria-label={`Tapahtuman ${i+1} päivä`} type="date" value={event.date} onChange={(e)=>change({events:draft.events.map((row,j)=>j===i?{...row,date:e.target.value}:row)})}/><input aria-label={`Tapahtuman ${i+1} otsikko`} maxLength={120} value={event.title} onChange={(e)=>change({events:draft.events.map((row,j)=>j===i?{...row,title:e.target.value}:row)})}/><button type="button" onClick={()=>change({events:draft.events.filter((_,j)=>j!==i)})}>Poista tapahtuma</button></div>)}</label>
        <button type="button" disabled={draft.events.length>=500} onClick={()=>change({events:[...draft.events,{id:crypto.randomUUID(),date:`${year}-01-01`,title:"Uusi tapahtuma"}]})}>Lisää tapahtuma</button>
        <label>Sulkupäivät{draft.periods.map((period,i)=><div key={period.id}><input aria-label={`Sulkupäivän ${i+1} nimi`} value={period.label} maxLength={120} onChange={(e)=>change({periods:draft.periods.map((row,j)=>j===i?{...row,label:e.target.value}:row)})}/><input aria-label={`Sulkupäivän ${i+1} alku`} type="date" value={period.start} onChange={(e)=>change({periods:draft.periods.map((row,j)=>j===i?{...row,start:e.target.value}:row)})}/><input aria-label={`Sulkupäivän ${i+1} loppu`} type="date" value={period.end} onChange={(e)=>change({periods:draft.periods.map((row,j)=>j===i?{...row,end:e.target.value}:row)})}/><button type="button" onClick={()=>change({periods:draft.periods.filter((_,j)=>j!==i)})}>Poista sulkupäivä</button></div>)}</label>
        <button type="button" disabled={draft.periods.length>=100} onClick={()=>change({periods:[...draft.periods,{id:crypto.randomUUID(),kind:"closure",label:"Suljettu",start:`${year}-01-01`,end:`${year}-01-01`}]})}>Lisää sulkupäivä</button>
        <label>Palkkapäivät (pilkulla erotetut ISO-päivät)<input value={draft.paydayDates.join(",")} onChange={(e)=>change({paydayDates:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})}/></label>
        <button disabled={!model}>Tallenna asiakaskalenteri</button></fieldset></form>}
      {templates.length>0 && canEditCompanyCalendar(snapshot.role) && <label>Käytä tilitoimiston pohjaa<select defaultValue="" disabled={busy} onChange={(e)=>{const t=templates.find((t)=>t.id===e.target.value);if(t)setDraft(reusableCompanyTemplate(t.configuration,snapshot.client.name,year));e.target.value="";}}><option value="">Valitse pohja</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
      {["firm_owner","firm_manager"].includes(snapshot.role) && <form onSubmit={(e)=>{e.preventDefault();firmCommand(snapshot.client.firmId,"save_template",{name:new FormData(e.currentTarget).get("name"),configuration:configToJson(configFromJson(draft))});}}><label>Pohjan nimi<input name="name" maxLength={80} required /></label><button disabled={busy || !model}>Tallenna ulkoasu ja säännöt pohjaksi</button><p>Pohjaan ei kopioida yritysnimeä, logoa, tapahtumia, sulkuja tai palkkapäiviä.</p></form>}
      {model ? <div className="team-scroll"><table><caption>Kalenterin esikatselu, ISO-viikot</caption><thead><tr><th>Päivä</th><th>Viikko</th><th>Tapahtumat</th></tr></thead><tbody>{model.months.flatMap(m=>m.rows.flatMap(r=>r.days.filter(Boolean).filter(d=>d.events.some(e=>e.kind!=="week")).map(d=><tr key={dayKey(d.date)}><td>{dayKey(d.date)}</td><td>{r.week}/{r.weekYear}</td><td>{d.events.filter(e=>e.kind!=="week").map(e=>e.title).join("; ")}</td></tr>)))}</tbody></table></div> : <p role="alert">Tarkista kalenterin päivät ja logo.</p>}
      <div className="team-actions">{["pdf","xlsx","csv","ics"].map(format=><button key={format} disabled={busy || !snapshot.calendar} onClick={()=>exportFile(format)}>Vie {format.toUpperCase()}</button>)}</div><p>Vienti käyttää viimeisintä tallennettua versiota. ICS on yksityinen ladattava tiedosto, ei julkinen tilausosoite.</p>
      {canManageClientAccess(snapshot.role) && <details><summary>Asiakasyrityksen käyttöoikeudet</summary><form onSubmit={(e)=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));command("grant_access",values);}}><label>Vahvistetun käyttäjän sähköposti<input name="email" type="email" required /></label><label>Asiakasrooli<select name="role"><option value="viewer">Katselija</option><option value="editor">Muokkaaja</option>{snapshot.role==="firm_owner"&&<option value="client_admin">Asiakkaan ylläpitäjä</option>}</select></label><button disabled={busy}>Anna asiakaskohtainen oikeus</button></form>{snapshot.access.map(a=><p key={a.userId}>{a.email ?? a.userId}: {BUSINESS_ROLE_LABELS[a.role]}<button disabled={busy} onClick={()=>command("revoke_access",{userId:a.userId})}>Peru oikeus</button></p>)}</details>}
      <details><summary>Asiakkaan tapahtumaloki ja vientihistoria</summary><ul>{snapshot.audit.map(a=><li key={a.id}>{a.recorded_at}: {BUSINESS_ACTION_LABELS[a.action] ?? "Muu muutos"}, tekijä {a.actor_id}</li>)}</ul><ul>{snapshot.exports.map(e=><li key={e.id}>{e.recorded_at}: {e.format.toUpperCase()}, versio {e.calendar_version}, valmisteltu</li>)}</ul></details>
      {["firm_owner","firm_manager"].includes(snapshot.role) && <details><summary>Tilitoimiston tapahtumaloki</summary><ul>{(snapshot.firmAudit ?? []).map(a=><li key={a.id}>{a.recorded_at}: {BUSINESS_ACTION_LABELS[a.action] ?? "Muu muutos"}, tekijä {a.actor_id ?? "ylläpito"}</li>)}</ul><p>Lokissa on tunnisteet ja toiminnot, ei tapahtumien sisältöjä tai sähköpostiosoitteita.</p></details>}
      {snapshot.role==="firm_owner"&&<details><summary>Poista asiakasyritys</summary><p>Poisto hävittää asiakkaan kalenterit, oikeudet ja asiakashistorian.</p><button disabled={busy} onClick={()=>{if(window.confirm("Poistetaanko asiakasyritys ja sen kalenterit pysyvästi?"))command("delete_client",{});}}>Poista {selected?.name}</button></details>}
    </>}{message && <p role="status">{message}</p>}</section>;
}
