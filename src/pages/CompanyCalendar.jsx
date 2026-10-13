import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../components/planning/plannerControls.css";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { trackPlatformEvent } from "../analytics";
import { canonicalFor, routeMeta } from "../data/seo";
import {
  COMPANY_CALENDAR_PATH,
  COMPANY_CALENDAR_PRODUCT,
  COMPANY_CALENDAR_STEPS,
  companyCalendarFaqs,
  companyCalendarYears,
  exportFilename,
} from "../data/companyCalendar";
import builderCss from "../components/companyCalendar/companyCalendar.css?raw";
import Editor from "../components/companyCalendar/Editor";
import Exports from "../components/companyCalendar/Exports";
import Preview from "../components/companyCalendar/Preview";
import IcsInstructions from "../components/companyCalendar/IcsInstructions";
import IcsPreview from "../components/companyCalendar/IcsPreview";
import { COMPANY_ICS_PATH, COMPANY_ICS_STEPS, companyIcsFaqs } from "../data/companyIcs";
import { companyCalendarToIcs, newCalendarIdentity, COMPANY_ICS_MIME } from "../platform/export/companyIcs";
import {
  DRAFT_KEY,
  createForm,
  formToConfigInput,
  issueToFinnish,
  limitedPreviewInput,
  parseDraft,
  serializeDraft,
  persistDraft,
  DRAFT_MAX_CHARS,
} from "../components/companyCalendar/formModel";
import { validateCalendarConfig } from "../platform/calendar/config";
import { buildCalendarModel } from "../platform/calendar/model";
import { hasFeature } from "../platform/business/licensing";
import { clearDevLicense, resolvePaymentProvider, unavailableProvider } from "../platform/business/payment";
import { downloadBlob } from "../platform/export/download";
import Purchase from "../components/companyCalendar/Purchase";
import { commerce } from "../platform/business/commerceClient";
import { configToJson } from "../platform/calendar/config";
import { rasterizeSvgToPng } from "../platform/render/logo";

const browserStorage = () => {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined; // storage can be blocked
  }
};

// Preview/drafts stay local. Purchased files are rendered privately on the
// server after checking Polar's authoritative order. Analytics gets enums only.
const CompanyCalendar = ({ icsOnly = false }) => {
  const today = useToday();
  const { years, defaultYear } = companyCalendarYears(today);
  const [form, setForm] = useState(() => createForm(defaultYear));
  const [logoError, setLogoError] = useState(null);
  const [license, setLicense] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [draftSaved, setDraftSaved] = useState(true);
  const touched = useRef(false);
  const seen = useRef({ started: false, previews: new Set() });
  const paidYears = useRef(new Set());
  const receivePurchase = useCallback(result => {
    setPurchase(result);
    if (result?.paid && new URLSearchParams(globalThis.location?.search).get("payment") === "return" && !paidYears.current.has(result.year)) {
      paidYears.current.add(result.year);
      trackPlatformEvent("purchase",{ product:COMPANY_CALENDAR_PRODUCT,year:result.year });
    }
  },[]);
  // import.meta.env.DEV is a build-time constant: in a production build this is
  // `unavailableProvider` and the development unlock code is pruned from the bundle.
  const provider = useMemo(
    () => (import.meta.env.DEV ? resolvePaymentProvider(import.meta.env, { storage: browserStorage(), hostname: globalThis.location?.hostname }) : unavailableProvider),
    [],
  );
  const faqs = icsOnly ? companyIcsFaqs() : companyCalendarFaqs();
  const devUnlock = import.meta.env.DEV && provider.id === "dev-unlock";
  const pagePath = icsOnly ? COMPANY_ICS_PATH : COMPANY_CALENDAR_PATH;

  // After hydration: restore the draft and any licence (never during render).
  useEffect(() => {
    let draft;
    try {
      draft = parseDraft(browserStorage()?.getItem(DRAFT_KEY), { years, fallbackYear: defaultYear });
    } catch {
      /* Blocked storage must not prevent the editor from opening. */
    }
    const params = new URLSearchParams(globalThis.location?.search);
    const returnYear = Number(params.get("year"));
    const restored = params.get("payment") === "return" && years.includes(returnYear)
      ? draft?.year === returnYear ? draft : createForm(returnYear)
      : draft ?? createForm(defaultYear);
    restored.calendarId ??= newCalendarIdentity();
    setForm(restored);
    setDraftSaved(persistDraft(browserStorage(), restored));
    setLicense(provider.restoreLicense());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The two routes share this mounted editor: do not restore an older draft on
  // navigation while its most recent edit is waiting for the save timer.
  useEffect(() => {
    trackPlatformEvent("company_calendar_view", { source: "page" });
    if (icsOnly) trackPlatformEvent("company_ics_view", { source: "page" });
  }, [icsOnly]);

  const change = useCallback((updater) => {
    touched.current = true;
    setForm(updater);
    if (!seen.current.started) {
      seen.current.started = true;
      trackPlatformEvent("company_calendar_started", {});
    }
  }, []);

  useEffect(() => {
    if (!touched.current) return undefined;
    const id = setTimeout(() => {
      setDraftSaved(persistDraft(browserStorage(), form));
    }, 500);
    return () => clearTimeout(id);
  }, [form]);

  const serverPaid = purchase?.paid === true && purchase.year === form.year;
  const unlocked = serverPaid || hasFeature(COMPANY_CALENDAR_PRODUCT, icsOnly ? "ics-export" : "pdf-export", license, today);
  const { input, issues: formIssues } = useMemo(() => formToConfigInput(form), [form]);
  const result = useMemo(() => validateCalendarConfig(input), [input]);
  const config = result.config;
  const previewModel = useMemo(() => {
    if (!config) return null;
    const shown = unlocked ? config : validateCalendarConfig(limitedPreviewInput(input)).config;
    return shown ? buildCalendarModel(shown) : null;
  }, [config, input, unlocked]);

  // One "preview" event per layout and visit, after the visitor has edited something.
  useEffect(() => {
    if (!touched.current || !previewModel || seen.current.previews.has(form.layout)) return undefined;
    const id = setTimeout(() => {
      seen.current.previews.add(form.layout);
      trackPlatformEvent("company_calendar_preview", { layout: form.layout, year: form.year });
      if (icsOnly) trackPlatformEvent("company_ics_preview", { year: form.year });
    }, 1000);
    return () => clearTimeout(id);
  }, [previewModel, form.layout, form.year, icsOnly]);

  const notes = [
    ...formIssues,
    ...result.issues.map(issueToFinnish),
  ];

  async function handleExport(kind) {
    trackPlatformEvent("company_calendar_export_attempt", { export_type: kind, layout: form.layout, year: form.year });
    if (kind === "ics") trackPlatformEvent("company_ics_export_attempt", { year: form.year });
    if (!config || notes.length || logoError) {
      setMessage("Tarkista merkityt kohdat ennen lataamista. Keskeneräisiä merkintöjä ei jätetä pois valmiista kalenterista.");
      document.getElementById("cc-issues")?.focus();
      return;
    }
    if (!serverPaid && !hasFeature(COMPANY_CALENDAR_PRODUCT, `${kind}-export`, license, today)) {
      setUnlockOpen(true);
      document.getElementById("cc-purchase")?.scrollIntoView({ behavior:"smooth",block:"start" });
      return;
    }
    setBusy(kind);
    setMessage("");
    setWarnings([]);
    try {
      const model = buildCalendarModel(config);
      const name = exportFilename(config, kind);
      if (serverPaid) {
        const serialized = configToJson(config);
        if (serialized.branding.logo?.dataUri.startsWith("data:image/svg+xml")) {
          serialized.branding.logo = { dataUri:await rasterizeSvgToPng(serialized.branding.logo.dataUri) };
        }
        const response = await fetch("/api/billing/export",{ method:"POST",credentials:"same-origin",cache:"no-store",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ year:form.year,format:kind,config:serialized,calendarId:form.calendarId,paydayRows:form.paydayDates }) });
        if (!response.ok) { if (response.status === 403) setPurchase(null); throw new Error("export_failed"); }
        downloadBlob(name,await response.blob(),response.headers.get("content-type"));
      } else if (kind === "pdf") {
        const { exportCalendarPdf } = await import("../platform/render/browserPdf");
        const pdf = await exportCalendarPdf(model, { logo: config.branding.logo, generatedOn: new Date() });
        downloadBlob(name, pdf.bytes, "application/pdf");
        setWarnings(pdf.warnings);
      } else if (kind === "ics") {
        downloadBlob(name, companyCalendarToIcs(model, { calendarId: form.calendarId, paydayRows: form.paydayDates }), COMPANY_ICS_MIME);
      } else {
        // The spreadsheet and calendar writers load only when a file is requested.
        const files = await import("../platform/export/calendar");
        if (kind === "xlsx") downloadBlob(name, files.calendarToXlsx(model), files.XLSX_MIME);
        else if (kind === "csv") downloadBlob(name, files.calendarToCsv(model), "text/csv;charset=utf-8");
      }
      trackPlatformEvent(`company_calendar_${kind}_export`, { layout: form.layout, year: form.year });
      if (kind === "ics") trackPlatformEvent("company_ics_export", { year: form.year });
      setMessage("Tiedosto on ladattu.");
    } catch {
      setMessage("Tiedoston luominen epäonnistui. Yritä uudelleen.");
    } finally {
      setBusy(null);
    }
  }

  async function handleUnlock({ marketingConsent = false } = {}) {
    trackPlatformEvent("company_calendar_cta_click", { source: "unlock" });
    if (!devUnlock) {
      setBusy("checkout");setMessage("");
      try {
        // Draft persistence is optional; blocked/full storage must not block pay.
        setDraftSaved(persistDraft(browserStorage(), form));
        const outcome = await commerce("checkout",{ year:form.year,marketingConsent,returnTo:icsOnly ? "company-ics" : "company-calendar" });
        if (outcome.paid) receivePurchase(await commerce("status",{ year:form.year }));
        else { trackPlatformEvent("checkout_start",{ product:COMPANY_CALENDAR_PRODUCT,year:form.year }); window.location.assign(outcome.url); }
      } catch { setMessage("Maksusivua ei voitu avata. Yritä uudelleen. Voit tallentaa luonnoksen tiedostona ennen maksamista."); }
      finally { setBusy(null); }
      return;
    }
    const outcome = await provider.startCheckout({ productId: COMPANY_CALENDAR_PRODUCT, tier: "paid", today });
    if (outcome.status === "granted") {
      setLicense(outcome.license);
      setUnlockOpen(false);
    } else if (outcome.status === "redirect") window.location.assign(outcome.url);
  }

  const relock = () => {
    const storage = browserStorage();
    if (storage) clearDevLicense(storage);
    setLicense(null);
  };
  const clearDraft = () => {
    try {
      browserStorage()?.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to clear */
    }
    touched.current = false;
    const fresh = { ...createForm(defaultYear), calendarId: newCalendarIdentity() };
    setForm(fresh);
    setDraftSaved(persistDraft(browserStorage(), fresh));
    setLogoError(null);
    setMessage("");
    setWarnings([]);
    setUnlockOpen(false);
  };

  const saveDraftFile = () => downloadBlob(`yrityskalenteri-${form.year}-luonnos.json`, serializeDraft(form), "application/json;charset=utf-8");
  const restoreDraftFile = async (file) => {
    try {
      if (!file || file.size > DRAFT_MAX_CHARS) throw new Error("invalid_draft");
      const draft = parseDraft(await file.text(), { years,fallbackYear:defaultYear });
      if (!draft) throw new Error("invalid_draft");
      draft.calendarId ??= newCalendarIdentity();
      change(draft);
      setDraftSaved(persistDraft(browserStorage(), draft));
      setLogoError(null);
      setMessage("Luonnos on avattu. Latausoikeus tarkistetaan erikseen.");
    } catch { setMessage("Luonnosta ei voitu avata. Valitse tästä työkalusta tallennettu JSON-tiedosto (enintään 1,2 Mt)."); }
  };

  return (
    <section className="app cc-page">
      {/* Builder-only styles are rendered with this page, not added to the stylesheet
          that is inlined into every other page. The CSS is our own static text. */}
      <style dangerouslySetInnerHTML={{ __html: builderCss }} />
      <SEO {...routeMeta[pagePath]} canonical={canonicalFor(pagePath)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / {icsOnly ? <><Link to={COMPANY_CALENDAR_PATH}>Yrityskalenteri</Link> / ICS-kalenteri</> : "Yrityskalenteri"}
      </div>
      <p className="cc-product">Viikkonro Yrityskalenteri</p>
      <h1>{icsOnly ? `Yrityksen ICS-kalenteri ${form.year}` : `Luo yrityksellesi oma kalenteri ${form.year}`}</h1>
      <p className="lead">
        <span className="answer-sentence">
          {icsOnly ? "Lisää yrityksen sulkupäivät, tapahtumat ja palkkapäivät samaan kalenteriin Suomen pyhäpäivien kanssa. Vie kokopäiväiset merkinnät Google-kalenteriin, Outlookiin tai Apple Kalenteriin." : "Lisää logo, yrityksen vapaapäivät, palkkapäivät ja tärkeät päivät. Saat valmiin yrityskalenterin PDF-, Excel- ja ICS-muodossa."}
        </span>
      </p>

      {!devUnlock && <p className="cc-buttons"><a className="btn" href="#cc-purchase">Hinta ja ostaminen</a><a className="btn btn-ghost" href="#cc-editor">Tee maksuton esikatselu</a></p>}
      {!draftSaved && <p className="cc-banner" role="status">Selaimen tallennustila ei ole käytettävissä. Tallenna luonnos JSON-tiedostona ennen maksua ja avaa se palattuasi. Muuten uudelleenlataus voi tyhjentää kalenterin.</p>}

      <div className="cc-layout" data-clarity-mask="True">
        <Editor icsOnly={icsOnly} form={form} setForm={change} years={years} logoError={logoError} setLogoError={setLogoError} notes={notes} onClearDraft={clearDraft} onSaveDraft={saveDraftFile} onRestoreDraft={restoreDraftFile} />
        <aside className="cc-side" aria-label="Esikatselu">
          <h2>Esikatselu</h2>
          {!unlocked && (
            <p className="cc-banner">
              {icsOnly ? "Ilmainen esikatselu. Valmiin ICS-tiedoston lataus kuuluu yrityskalenterin maksullisiin vientimuotoihin." : "Ilmainen esikatselu: vesileima, ei logoa eikä omaa väriä. Ne tulevat mukaan ladattuun kalenteriin."}
            </p>
          )}
          {previewModel ? (
            icsOnly ? <IcsPreview model={previewModel} locked={!unlocked} calendarId={form.calendarId} paydayRows={form.paydayDates} /> : <Preview model={previewModel} locked={!unlocked} hasLogo={Boolean(form.logo)} logo={unlocked ? config.branding.logo : null} />
          ) : (
            <p className="cc-error" role="alert">Korjaa merkityt kohdat, niin esikatselu näkyy.</p>
          )}
          <Exports
            paymentAvailable={!devUnlock}
            icsOnly={icsOnly}
            unlocked={unlocked}
            busy={busy}
            message={message}
            warnings={warnings}
            unlockOpen={unlockOpen}
            devPanel={
              import.meta.env.DEV && provider.id === "dev-unlock" ? (
                <>
                  <p><b>Kehitystila.</b> Tämä painike ohittaa maksun, ja se on käytössä vain paikallisessa testauksessa.</p>
                  <button type="button" className="btn" onClick={handleUnlock}>Avaa lataukset (testi)</button>
                </>
              ) : null
            }
            devNote={
              import.meta.env.DEV && provider.id === "dev-unlock" ? (
                <p className="note-soft">Kehitystila: lataukset on avattu testausta varten. <button type="button" className="btn-link" onClick={relock}>Lukitse uudelleen</button></p>
              ) : null
            }
            onExport={handleExport}
            onContactClick={() => trackPlatformEvent("company_calendar_cta_click", { source: "contact" })}
          />
          {!devUnlock && <Purchase year={form.year} status={purchase?.year === form.year ? purchase : null} onStatus={receivePurchase} onCheckout={handleUnlock} busy={busy} />}
          {!icsOnly && <p><Link to={COMPANY_ICS_PATH} onClick={() => trackPlatformEvent("company_ics_cta", { source: "builder" })}>Yrityksen ICS-kalenteri ja tuontiohjeet</Link></p>}
        </aside>
      </div>

      {icsOnly && <IcsInstructions />}
      <section className="prose">
        <h2>Näin teet yrityskalenterin</h2>
        <ol>
          {(icsOnly ? COMPANY_ICS_STEPS : COMPANY_CALENDAR_STEPS).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Mitä yrityskalenteriin voi lisätä</h2>
        <ul>
          <li><strong>ISO-viikkonumerot</strong> {icsOnly ? "maanantaisin erillisinä kokopäiväisinä merkintöinä." : "jokaiselle viikolle, kaikissa kolmessa asettelussa."}</li>
          <li><strong>Suomen pyhäpäivät ja liputuspäivät</strong> samasta tiedosta kuin sivuston muut kalenterit.</li>
          <li><strong>Sulkupäivät ja omat päivät</strong>, kuten kesäsulku, yhtiökokous tai kehityspäivä.</li>
          <li><strong>Palkkapäivät</strong> yksittäisinä päivinä tai toistuvan säännön mukaan. Toistuvat päivät siirtyvät tarvittaessa edelliseen pankkipäivään.</li>
          <li><strong>Lomakausi ja koululomat</strong>, kun haluat näyttää ne yhdellä silmäyksellä.</li>
        </ul>
        <p className="note-soft">
          Työpäivä on maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Jouluaatto ja juhannusaatto lasketaan kalenterissa vapaapäiviksi.
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
        Katso myös <Link to={`/kalenteri-${defaultYear}`}>kalenteri {defaultYear}</Link>,{" "}
        <Link to={`/tulostettava-kalenteri-${defaultYear}`}>tulostettava kalenteri {defaultYear}</Link>,{" "}
        <Link to={`/pyhapaivat-${defaultYear}`}>pyhäpäivät {defaultYear}</Link>,{" "}
        <Link to={`/palkkapaivat-${defaultYear}`}>palkkapäivät {defaultYear}</Link>,{" "}
        <Link to={`/koululomat-${defaultYear}`}>koululomat {defaultYear}</Link>,{" "}
        <Link to={`/tyopaivat-${defaultYear}`}>työpäivät {defaultYear}</Link> ja{" "}
        <Link to="/laskurit">kaikki laskurit</Link>.
      </p>
    </section>
  );
};

export default CompanyCalendar;
