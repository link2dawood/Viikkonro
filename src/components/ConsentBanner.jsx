import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONSENT_OPEN_EVENT, chooseConsent, readConsent } from "../consent";

const TEXT = {
  fi: {
    label: "Evästeasetukset",
    title: "Evästeet ja analytiikka.",
    body: "Käytämme Microsoft Claritya ja Google Analyticsia sivuston parantamiseen. Valitse, saako analytiikka käyttää evästeitä. Ilman suostumusta analytiikka toimii ilman evästeitä ja kaikki työkalut ovat käytettävissä.",
    more: "Lue lisää",
    deny: "Vain välttämättömät",
    allow: "Salli analytiikkaevästeet",
  },
};

// Analytics cookie banner. The markup is in the prerendered HTML and in the
// first client render (so hydration always matches), but CSS keeps it hidden
// until either the inline script in index.html marks the document
// [data-consent=ask] — no stored choice, before the first paint — or the
// footer's cookie settings link re-opens it. Shipping it with the page keeps
// its paragraph out of the post-hydration paint that used to decide LCP.
// Both choices are equally prominent buttons, and declining keeps every
// feature of the site working.
const ConsentBanner = () => {
  const [open, setOpen] = useState(false);
  const t = TEXT.fi;

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const choose = (analytics) => {
    chooseConsent(analytics);
    setOpen(false);
  };

  return (
    <section
      className="consent noprint"
      data-open={open ? "true" : "false"}
      data-nosnippet=""
      role="region"
      aria-label={t.label}
    >
      <p>
        <strong>{t.title}</strong> {t.body}{" "}
        <Link to="/tietosuoja">
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
