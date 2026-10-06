import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
import Editor from "../components/companyCalendar/Editor";
import Exports from "../components/companyCalendar/Exports";
import Preview from "../components/companyCalendar/Preview";
import {
  DRAFT_KEY,
  createForm,
  formToConfigInput,
  limitedPreviewInput,
  parseDraft,
  serializeDraft,
} from "../components/companyCalendar/formModel";
import { validateCalendarConfig } from "../platform/calendar/config";
import { buildCalendarModel } from "../platform/calendar/model";
import { hasFeature } from "../platform/business/licensing";
import { clearDevLicense, resolvePaymentProvider } from "../platform/business/payment";
import { calendarToCsv, calendarToIcs, calendarToXlsx } from "../platform/export/calendar";
import { downloadBlob } from "../platform/export/download";
import { XLSX_MIME } from "../platform/export/xlsx";

const browserStorage = () => {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined; // storage can be blocked
  }
};
const icsStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// Company calendar builder (/yrityskalenteri). Everything runs in the browser:
// the logo and the company's days never leave it, and analytics gets only
// layout, year and file type.
const CompanyCalendar = () => {
  const today = useToday();
  const { years, defaultYear } = companyCalendarYears(today);
  const [form, setForm] = useState(() => createForm(defaultYear));
  const [logoError, setLogoError] = useState(null);
  const [license, setLicense] = useState(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState([]);
  const touched = useRef(false);
  const seen = useRef({ started: false, previews: new Set() });
  const provider = useMemo(() => resolvePaymentProvider(import.meta.env, { storage: browserStorage() }), []);
  const faqs = companyCalendarFaqs();

  // After hydration: restore the draft and any licence (never during render).
  useEffect(() => {
    const draft = parseDraft(browserStorage()?.getItem(DRAFT_KEY), { years, fallbackYear: defaultYear });
    if (draft) setForm(draft);
    setLicense(provider.restoreLicense());
    trackPlatformEvent("company_calendar_view", { source: "page" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      try {
        browserStorage()?.setItem(DRAFT_KEY, serializeDraft(form));
      } catch {
        /* a full or blocked store only costs the draft */
      }
    }, 500);
    return () => clearTimeout(id);
  }, [form]);

  const unlocked = hasFeature(COMPANY_CALENDAR_PRODUCT, "pdf-export", license, today);
  const { input, skipped } = useMemo(() => formToConfigInput(form), [form]);
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
    }, 1000);
    return () => clearTimeout(id);
  }, [previewModel, form.layout, form.year]);

  const notes = [
    ...(skipped > 0 ? [`${skipped} riviä jätettiin pois, koska ne ovat keskeneräisiä tai päivä ei ole vuodessa ${form.year}.`] : []),
    ...result.issues,
  ];

  async function handleExport(kind) {
    trackPlatformEvent("company_calendar_export_attempt", { export_type: kind, layout: form.layout, year: form.year });
    if (!config) return;
    if (!hasFeature(COMPANY_CALENDAR_PRODUCT, `${kind}-export`, license, today)) {
      setUnlockOpen(true);
      return;
    }
    setBusy(kind);
    setMessage("");
    setWarnings([]);
    try {
      const model = buildCalendarModel(config);
      const name = exportFilename(config, kind);
      if (kind === "pdf") {
        const { exportCalendarPdf } = await import("../platform/render/browserPdf");
        const pdf = await exportCalendarPdf(model, { logo: config.branding.logo, generatedOn: new Date() });
        downloadBlob(name, pdf.bytes, "application/pdf");
        setWarnings(pdf.warnings);
      } else if (kind === "xlsx") downloadBlob(name, calendarToXlsx(model), XLSX_MIME);
      else if (kind === "csv") downloadBlob(name, calendarToCsv(model), "text/csv;charset=utf-8");
      else downloadBlob(name, calendarToIcs(model, { stamp: icsStamp(new Date()) }), "text/calendar;charset=utf-8");
      trackPlatformEvent(`company_calendar_${kind}_export`, { layout: form.layout, year: form.year });
      setMessage("Tiedosto on ladattu.");
    } catch {
      setMessage("Tiedoston luominen epäonnistui. Yritä uudelleen.");
    } finally {
      setBusy(null);
    }
  }

  async function handleUnlock() {
    trackPlatformEvent("company_calendar_cta_click", { source: "unlock" });
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
    setForm(createForm(defaultYear));
    setLogoError(null);
  };

  return (
    <section className="app cc-page">
      <SEO {...routeMeta[COMPANY_CALENDAR_PATH]} canonical={canonicalFor(COMPANY_CALENDAR_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Yrityskalenteri
      </div>
      <h1>Luo yrityksellesi oma kalenteri {defaultYear}</h1>
      <p className="lead">
        <span className="answer-sentence">
          Lisää logo, yrityksen vapaapäivät, palkkapäivät ja tärkeät päivät. Saat valmiin yrityskalenterin PDF-, Excel- ja ICS-muodossa.
        </span>
      </p>

      <div className="cc-layout">
        <Editor form={form} setForm={change} years={years} logoError={logoError} setLogoError={setLogoError} notes={notes} onClearDraft={clearDraft} />
        <aside className="cc-side" aria-label="Esikatselu">
          <h2>Esikatselu</h2>
          {!unlocked && (
            <p className="cc-banner">
              Ilmainen esikatselu: vesileima, ei logoa eikä omaa väriä. Ne tulevat mukaan ladattuun kalenteriin.
            </p>
          )}
          {previewModel ? (
            <Preview model={previewModel} locked={!unlocked} hasLogo={Boolean(form.logo)} logo={unlocked ? config.branding.logo : null} />
          ) : (
            <p className="cc-error" role="alert">Korjaa merkityt kohdat, niin esikatselu näkyy.</p>
          )}
          <Exports
            unlocked={unlocked}
            busy={busy}
            message={message}
            warnings={warnings}
            unlockOpen={unlockOpen}
            canPurchase={provider.canPurchase}
            devProvider={provider.id === "dev-unlock"}
            onExport={handleExport}
            onUnlock={handleUnlock}
            onRelock={relock}
            onContactClick={() => trackPlatformEvent("company_calendar_cta_click", { source: "contact" })}
          />
        </aside>
      </div>

      <section className="prose">
        <h2>Näin teet yrityskalenterin</h2>
        <ol>
          {COMPANY_CALENDAR_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Mitä yrityskalenteriin voi lisätä</h2>
        <ul>
          <li><strong>ISO-viikkonumerot</strong> jokaiselle viikolle, kaikissa kolmessa asettelussa.</li>
          <li><strong>Suomen pyhäpäivät ja liputuspäivät</strong> samasta tiedosta kuin sivuston muut kalenterit.</li>
          <li><strong>Sulkupäivät ja omat päivät</strong>, kuten kesäsulku, yhtiökokous tai kehityspäivä.</li>
          <li><strong>Palkkapäivät</strong>, jotka siirtyvät tarvittaessa edelliseen pankkipäivään.</li>
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
