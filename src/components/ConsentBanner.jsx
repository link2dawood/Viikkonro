import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CONSENT_OPEN_EVENT, chooseConsent, readConsent } from "../consent";

const TEXT = {
  fi: {
    label: "Evästeasetukset",
    title: "Evästeet ja analytiikka.",
    body: "Käytämme Microsoft Clarity -analytiikkaa sivuston parantamiseen. Suostumuksellasi Clarity voi käyttää analytiikkaevästeitä, joiden avulla näemme esimerkiksi palaavat kävijät. Ilman suostumusta analytiikka toimii ilman evästeitä, eikä valinta vaikuta sivuston toimintaan.",
    more: "Lue lisää",
    deny: "Vain välttämättömät",
    allow: "Salli analytiikkaevästeet",
  },
  en: {
    label: "Cookie settings",
    title: "Cookies and analytics.",
    body: "We use Microsoft Clarity analytics to improve the site. With your consent, Clarity may use analytics cookies, for example to recognise returning visitors. Without consent, analytics runs without cookies and the site works the same.",
    more: "Privacy notice (Finnish)",
    deny: "Necessary only",
    allow: "Allow analytics cookies",
  },
};

// Analytics cookie banner. Hidden in the prerendered HTML and on the first
// client render (so hydration always matches); shown after mount only when
// the visitor hasn't chosen yet, or when re-opened from the footer's cookie
// settings link. Both choices are equally prominent buttons, and declining
// keeps every feature of the site working.
const ConsentBanner = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const t = pathname === "/en" ? TEXT.en : TEXT.fi;

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (analytics) => {
    chooseConsent(analytics);
    setOpen(false);
  };

  return (
    <section
      className="consent noprint"
      role="region"
      aria-label={t.label}
      lang={pathname === "/en" ? "en" : undefined}
    >
      <p>
        <strong>{t.title}</strong> {t.body}{" "}
        <Link to="/tietosuoja" hrefLang={pathname === "/en" ? "fi" : undefined}>
          {t.more}
        </Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn" onClick={() => choose(false)}>
          {t.deny}
        </button>
        <button type="button" className="btn" onClick={() => choose(true)}>
          {t.allow}
        </button>
      </div>
    </section>
  );
};

export default ConsentBanner;
