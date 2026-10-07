import { useEffect, useRef, useState } from "react";

let loading;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        loading = null;
        reject(new Error("Verification unavailable"));
      }
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        if (window.turnstile) resolve(window.turnstile); else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }
  return loading;
}

export default function NewsletterChallenge({ onToken, attempt, english }) {
  const container = useRef(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let widget;
    setFailed(false);
    onToken("");
    loadTurnstile().then((api) => {
      if (cancelled) return;
      widget = api.render(container.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
        action: "newsletter", size: "flexible", language: english ? "en" : "fi",
        callback: (token) => { if (!cancelled) { setFailed(false); onToken(token); } },
        "expired-callback": () => { if (!cancelled) onToken(""); },
        "error-callback": () => { if (!cancelled) { onToken(""); setFailed(true); } },
      });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, [onToken, attempt, english, retry]);
  return <div>
    <div ref={container} />
    {failed && <p role="alert">
      {english ? "Verification could not load. " : "Varmennusta ei voitu ladata. "}
      <button type="button" className="btn" onClick={() => setRetry((n) => n + 1)}>{english ? "Retry" : "Yritä uudelleen"}</button>
    </p>}
  </div>;
}
