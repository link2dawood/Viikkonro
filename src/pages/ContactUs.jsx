import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import SocialLinks from "../components/SocialLinks";
import { routeMeta } from "../data/seo";
import { validateContact, LIMITS } from "../contactValidation";
import { captureError } from "../sentry";

// ── Web3Forms setup ─────────────────────────────────────────────────────────
// 1. Go to https://web3forms.com and enter your email: dawood.dixeam@gmail.com
// 2. Open that inbox and click the verification link Web3Forms sends you.
// 3. Copy your Access Key and paste it below (replace the placeholder), OR set
//    VITE_WEB3FORMS_ACCESS_KEY in a .env.local file.
// This key is SAFE to expose in frontend code — it can ONLY deliver email to
// your verified address, so no backend is required.
const WEB3FORMS_ACCESS_KEY =
  import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || "YOUR_WEB3FORMS_ACCESS_KEY";

// ── Anti-spam / rate-limit tuning (all client-side, no backend) ─────────────
const RATE_LIMIT_KEY = "vn_contact_submits"; // localStorage bucket of send timestamps
const COOLDOWN_MS = 30 * 1000; // min gap between two sends
const WINDOW_MS = 60 * 60 * 1000; // rolling window for the cap below
const MAX_IN_WINDOW = 3; // max sends allowed inside WINDOW_MS
const MIN_FILL_TIME_MS = 3000; // faster than this = almost certainly a bot

// Read the list of past-send timestamps, dropping anything outside the window.
function readRecentSubmits(now) {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((t) => typeof t === "number" && now - t < WINDOW_MS);
  } catch {
    return [];
  }
}

function writeSubmits(list) {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable (private mode) — silently skip persistence */
  }
}

function ContactUs() {
  //  One unified state object to hold all form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Honeypot field — real users never see or fill this; bots usually do.
  const [honeypot, setHoneypot] = useState("");

  // Timestamp of when the form mounted (used for the time-trap). Starts at 0 so
  // it "fails open" for real users if the effect hasn't run yet.
  const loadTimeRef = useRef(0);
  useEffect(() => {
    loadTimeRef.current = Date.now();
  }, []);

  // State to track status notifications (success or error messages)
  const [status, setStatus] = useState({ type: "", message: "" });

  // Disables the button and prevents double-submits while a request is in flight
  const [isSubmitting, setIsSubmitting] = useState(false);

  //  The universal input handler logic
  // This updates the exact field being typed into using the HTML 'name' attribute
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear a field's error as soon as the user edits it
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  // Validate one field when the user leaves it
  const handleBlur = (e) => {
    const { name } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: validateContact(formData)[name] }));
  };

  //  Form submission handler logic
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing

    if (isSubmitting) return;

    const now = Date.now();

    // ── Bot fighting ────────────────────────────────────────────────────────
    // 1. Honeypot: if the hidden field has any value, treat as a bot. We fake a
    //    success so the bot gets no signal to adapt, but nothing is sent.
    if (honeypot) {
      setStatus({ type: "success", message: "Kiitos! Viestisi on lähetetty." });
      setFormData({ name: "", email: "", message: "" });
      return;
    }

    // 2. Time-trap: a human can't read + fill this form in under 3 seconds.
    if (now - loadTimeRef.current < MIN_FILL_TIME_MS) {
      setStatus({
        type: "error",
        message: "Lomake lähetettiin liian nopeasti. Yritä hetken kuluttua uudelleen.",
      });
      return;
    }

    // ── Rate limiting (per browser, via localStorage) ───────────────────────
    const recent = readRecentSubmits(now);
    if (recent.length >= MAX_IN_WINDOW) {
      setStatus({
        type: "error",
        message: "Olet lähettänyt liian monta viestiä. Yritä myöhemmin uudelleen.",
      });
      return;
    }
    const last = recent[recent.length - 1];
    if (last && now - last < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
      setStatus({
        type: "error",
        message: `Odota ${wait} sekuntia ennen uuden viestin lähettämistä.`,
      });
      return;
    }

    // ── Validation ──────────────────────────────────────────────────────────
    const errors = validateContact(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatus({ type: "error", message: "Tarkista lomakkeen kentät ja yritä uudelleen." });
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }
    setFieldErrors({});

    if (WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
      setStatus({
        type: "error",
        message: "Lomaketta ei ole vielä määritetty. Yritä myöhemmin uudelleen.",
      });
      captureError(new Error("Web3Forms access key missing (VITE_WEB3FORMS_ACCESS_KEY)"));
      return;
    }

    // ── Send via Web3Forms (no backend needed) ──────────────────────────────
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "Uusi yhteydenotto – Viikko Nro",
          from_name: "Viikko Nro -yhteydenottolomake",
          name: formData.name,
          email: formData.email,
          message: formData.message,
          botcheck: "", // Web3Forms' own honeypot — must stay empty
        }),
      });

      // A non-JSON body (proxy error page etc.) must not look like a network failure
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Record this successful send for the rate limiter
        writeSubmits([...recent, now]);
        setStatus({ type: "success", message: "Kiitos! Viestisi on lähetetty." });
        setFormData({ name: "", email: "", message: "" });
      } else {
        captureError(new Error("Web3Forms rejected submission"), {
          httpStatus: res.status,
          apiMessage: data.message,
        });
        setStatus({
          type: "error",
          message:
            res.status === 429
              ? "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen."
              : "Viestin lähettäminen epäonnistui. Yritä uudelleen myöhemmin.",
        });
      }
    } catch (err) {
      captureError(err, { stage: "contact-form-fetch" });
      setStatus({
        type: "error",
        message:
          "Viestin lähettäminen epäonnistui. Tarkista verkkoyhteytesi ja yritä uudelleen.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const meta = routeMeta["/ota-yhteytta"];

  return (
    <section className="app">
      <SEO title={meta.title} description={meta.description} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Ota yhteyttä
      </div>
      <div className="contact-container">
        <div className="contact-card">
          <h1>Ota yhteyttä</h1>
          <p className="contact-subtitle">
            Kuulemme mielellämme sinusta. Jätä meille viesti!
          </p>

          {/* Status Notification Banner */}
          {status.message && (
            <div className={`status-banner ${status.type}`} role={status.type === "error" ? "alert" : "status"}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form" noValidate>
            {/* Honeypot field — visually hidden, ignored by humans, filled by bots */}
            <input
              type="text"
              name="botField"
              tabIndex="-1"
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                opacity: 0,
              }}
            />

            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name">Koko nimi</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Syötä nimesi"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={LIMITS.name}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                required
              />
              {fieldErrors.name && (
                <p id="name-error" className="field-error">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Sähköpostiosoite</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Syötä sähköpostiosoitteesi"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={LIMITS.email}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                required
              />
              {fieldErrors.email && (
                <p id="email-error" className="field-error">{fieldErrors.email}</p>
              )}
            </div>

            {/* Message Field */}
            <div className="form-group">
              <label htmlFor="message">Viestisi</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                placeholder="Kirjoita viestisi tähän..."
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={LIMITS.message}
                aria-invalid={!!fieldErrors.message}
                aria-describedby={fieldErrors.message ? "message-error" : undefined}
                required
              ></textarea>
              {fieldErrors.message && (
                <p id="message-error" className="field-error">{fieldErrors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Lähetetään…" : "Lähetä viesti"}
            </button>
          </form>

          <div className="contact-social">
            <p>Löydät meidät myös sosiaalisessa mediassa:</p>
            <SocialLinks />
          </div>
        </div>
      </div>
    </section>
  );
}
export default ContactUs;
