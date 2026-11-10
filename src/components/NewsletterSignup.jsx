import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NEWSLETTER_DELAY,
  isSnoozed,
  isSubscribed,
  markSubscribed,
  newsletterEndpoint,
  requestSubscription,
  snooze,
} from "../newsletter";
import "./NewsletterSignup.css";
import NewsletterChallenge from "./NewsletterChallenge";

const TEXT = {
  fi: {
    badge: "Viikkomuistutus",
    title: "Viikon numero ja ajankohtaiset vinkit sähköpostiisi",
    body: "Saat tiedon aina kun viikkonumero vaihtuu (maanantaisin) sekä ajankohtaiset kalenterivinkit ja tarjoukset.",
    email: "Sähköpostiosoite",
    placeholder: "Syötä sähköpostiosoite...",
    submit: "Tilaa maksutta",
    sending: "Lähetetään…",
    privacy: "Tietosuoja",
    disclaimer: "Ei roskapostia. Voit perua tilauksen milloin tahansa.",
    successTitle: "Kiitos tilauksesta!",
    success: "Ensimmäinen viesti on lähetetty sähköpostiisi.",
    error: "Tilaus ei onnistunut. Tarkista sähköpostiosoite ja yritä uudelleen.",
    close: "Sulje muistutusten tilaus",
    dismiss: "Ei kiitos, ehkä myöhemmin",
  },
};

function storage() {
  try { return window.localStorage; } catch { return null; }
}

export default function NewsletterSignup() {
  const { pathname } = useLocation();
  const endpoint = newsletterEndpoint();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const card = useRef(null);
  const emailInput = useRef(null);
  const t = TEXT.fi;
  const excluded = ["/tietosuoja", "/kayttoehdot", "/ota-yhteytta"].includes(pathname) || pathname.startsWith("/tiimi");
  const hasTurnstile = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (!endpoint || excluded || dismissed || isSnoozed(storage()) || isSubscribed(storage())) return;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      if (document.querySelector(".consent") || document.hidden) {
        setReady(false);
        return;
      }
      timer = setTimeout(() => setReady(true), NEWSLETTER_DELAY);
    };
    const observer = new MutationObserver((changes) => {
      const bannerChanged = changes.some((change) => [...change.addedNodes, ...change.removedNodes]
        .some((node) => node.nodeType === 1 && (node.matches(".consent") || node.querySelector(".consent"))));
      if (bannerChanged) schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("load", schedule);
    document.addEventListener("visibilitychange", schedule);
    if (document.readyState === "complete") schedule();
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("load", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [endpoint, excluded, dismissed]);

  useEffect(() => {
    if (ready && status === "idle") {
      emailInput.current?.focus();
    }
  }, [ready, status]);

  function dismiss() {
    if (card.current?.contains(document.activeElement)) {
      document.getElementById("main")?.focus({ preventScroll: true });
    }
    snooze(storage());
    setDismissed(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy.current || (hasTurnstile && !token)) return;
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    if (data.get("website") || !email) return;
    busy.current = true;
    setStatus("sending");
    try {
      await requestSubscription(
        endpoint,
        email,
        true,
        undefined,
        { token, website: data.get("website") || "" }
      );
      markSubscribed(storage());
      snooze(storage(), 365);
      setStatus("success");
      setTimeout(() => {
        setDismissed(true);
      }, 4000);
    } catch {
      setStatus("error");
      setToken("");
      setAttempt((value) => value + 1);
    } finally {
      busy.current = false;
    }
  }

  if (!endpoint || excluded || !ready || dismissed) return null;

  return (
    <aside
      ref={card}
      className="newsletter noprint"
      aria-labelledby="newsletter-title"
      lang="fi"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          dismiss();
        }
      }}
    >
      <button
        className="newsletter-close"
        type="button"
        aria-label={t.close}
        onClick={dismiss}
      >
        ×
      </button>

      <div className="newsletter-badge">{t.badge}</div>
      <h2 id="newsletter-title">{t.title}</h2>
      <p className="newsletter-desc">{t.body}</p>

      {status !== "success" ? (
        <form
          id="newsletter-form"
          onSubmit={submit}
          aria-busy={status === "sending"}
          data-clarity-mask="true"
        >
          <div className="newsletter-input-wrap">
            <input
              ref={emailInput}
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder={t.placeholder}
              aria-label={t.email}
              required
              disabled={status === "sending"}
            />
            <div className="newsletter-trap" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {hasTurnstile && (
              <NewsletterChallenge onToken={setToken} attempt={attempt} />
            )}
            <button
              className="btn newsletter-primary"
              type="submit"
              disabled={status === "sending" || (hasTurnstile && !token)}
            >
              {status === "sending" ? t.sending : t.submit}
            </button>
          </div>
          <p className="newsletter-note">{t.disclaimer}</p>
          {status === "error" && (
            <p className="newsletter-error" role="alert">
              {t.error}
            </p>
          )}
        </form>
      ) : (
        <div className="newsletter-success-box" role="status" aria-live="polite">
          <span className="newsletter-success-icon" aria-hidden="true">✓</span>
          <div>
            <strong>{t.successTitle}</strong>
            <p>{t.success}</p>
          </div>
        </div>
      )}

      <div className="newsletter-foot">
        <Link className="newsletter-privacy" to="/tietosuoja">
          {t.privacy}
        </Link>
        <button
          type="button"
          className="newsletter-dismiss-link"
          onClick={dismiss}
        >
          {t.dismiss}
        </button>
      </div>
    </aside>
  );
}
