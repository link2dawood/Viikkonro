import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NEWSLETTER_DELAY, isSnoozed, newsletterEndpoint, requestSubscription, snooze } from "../newsletter";
import "./NewsletterSignup.css";
import NewsletterChallenge from "./NewsletterChallenge";

const TEXT = {
  fi: {
    title: "Viikon numero sähköpostiisi",
    body: "Viikon numero ja tulevat Suomen pyhäpäivät kerran viikossa.",
    open: "Tilaa muistutukset", close: "Sulje muistutusten tilaus", email: "Sähköpostiosoite",
    consent: "Haluan Viikkonron viikoittaiset muistutukset sähköpostiini. Voin perua tilauksen jokaisen viestin linkistä.",
    submit: "Tilaa maksutta", sending: "Lähetetään…", privacy: "Tietosuoja",
    note: "Vahvista tilaus sähköpostiisi tulevasta linkistä.",
    success: "Tarkista sähköpostisi ja vahvista tilaus viestin linkistä.",
    error: "Tilauspyyntö ei onnistunut. Yritä uudelleen hetken kuluttua.",
  },
  en: {
    title: "Get the week number by email",
    body: "A weekly email in Finnish with the week number and upcoming Finnish holidays.",
    open: "Get reminders", close: "Close email signup", email: "Email address",
    consent: "I want Viikkonro’s weekly email reminders in Finnish. I can unsubscribe using the link in every email.",
    submit: "Subscribe for free", sending: "Sending…", privacy: "Privacy notice (Finnish)",
    note: "Confirm your subscription using the link sent to your inbox.",
    success: "Check your inbox and confirm your subscription using the email link.",
    error: "We could not submit your request. Please try again shortly.",
  },
};

function storage() {
  try { return window.localStorage; } catch { return null; }
}

export default function NewsletterSignup() {
  const { pathname } = useLocation();
  const endpoint = newsletterEndpoint();
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const card = useRef(null);
  const emailInput = useRef(null);
  const t = pathname === "/en" ? TEXT.en : TEXT.fi;
  const excluded = ["/tietosuoja", "/kayttoehdot", "/ota-yhteytta"].includes(pathname);

  useEffect(() => {
    if (!endpoint || excluded || dismissed || isSnoozed(storage())) return;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      // Observe actual visibility, including when storage is blocked or settings reopen.
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
    if (expanded) emailInput.current?.focus();
  }, [expanded]);

  function dismiss() {
    if (card.current?.contains(document.activeElement)) {
      document.getElementById("main")?.focus({ preventScroll: true });
    }
    snooze(storage());
    setDismissed(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy.current || !token) return;
    const data = new FormData(event.currentTarget);
    if (data.get("website")) return;
    busy.current = true;
    setStatus("sending");
    try {
      await requestSubscription(endpoint, data.get("email"), data.get("consent") === "yes", undefined, { token, website: data.get("website") || "" });
      // This is only a pending confirmation, not proof of subscription.
      snooze(storage());
      setStatus("success");
    } catch {
      setStatus("error");
      setToken("");
      setAttempt((value) => value + 1);
    } finally {
      busy.current = false;
    }
  }

  if (!endpoint || !import.meta.env.VITE_TURNSTILE_SITE_KEY || excluded || !ready || dismissed) return null;

  return (
    <aside ref={card} className="newsletter noprint" aria-labelledby="newsletter-title" lang={pathname === "/en" ? "en" : "fi"}
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); dismiss(); } }}>
      <button className="newsletter-close" type="button" aria-label={t.close} onClick={dismiss}>×</button>
      <h2 id="newsletter-title">{t.title}</h2>
      <p>{t.body}</p>
      {!expanded ? <button className="btn newsletter-primary" type="button" aria-expanded="false" aria-controls="newsletter-form" onClick={() => setExpanded(true)}>{t.open}</button> : (
        <form id="newsletter-form" onSubmit={submit} aria-busy={status === "sending"} data-clarity-mask="true">
          {status !== "success" && <>
            <label htmlFor="newsletter-email">{t.email}</label>
            <input ref={emailInput} id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={status === "sending"} />
            <div className="newsletter-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <label className="newsletter-consent"><input type="checkbox" name="consent" value="yes" required disabled={status === "sending"} /><span>{t.consent}</span></label>
            <NewsletterChallenge onToken={setToken} attempt={attempt} english={pathname === "/en"} />
            <button className="btn newsletter-primary" type="submit" disabled={status === "sending" || !token}>{status === "sending" ? t.sending : t.submit}</button>
            <p className="newsletter-note">{t.note}</p>
          </>}
          <p role="status" aria-live="polite">{status === "success" ? t.success : ""}</p>
          {status === "error" && <p role="alert">{t.error}</p>}
        </form>
      )}
      <Link className="newsletter-privacy" to="/tietosuoja" hrefLang={pathname === "/en" ? "fi" : undefined}>{t.privacy}</Link>
    </aside>
  );
}
