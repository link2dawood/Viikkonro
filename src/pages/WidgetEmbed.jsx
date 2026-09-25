import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, SITE_URL } from "../data/seo";
import {
  WEEK_WIDGET_PATH,
  WIDGET_EMBED_PAGE_PATH,
  WIDGET_EMBED_STEPS,
  WIDGET_HEIGHT,
  WIDGET_THEMES,
  WIDGET_WIDTH,
  widgetEmbedCode,
  widgetEmbedMeta,
  widgetFaqs,
} from "../data/weekWidget";

// Landing page for the embeddable current-week widget. The preview iframe
// loads the real /widget/viikko document (same-origin), so what the visitor
// sees here is exactly what their own site will show.
const WidgetEmbed = () => {
  const [theme, setTheme] = useState("vaalea");
  const [copied, setCopied] = useState(false);
  const code = widgetEmbedCode(SITE_URL, theme);
  const faqs = widgetFaqs();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Kopioi upotuskoodi:", code);
    }
  };

  return (
    <section className="app">
      <SEO {...widgetEmbedMeta} canonical={canonicalFor(WIDGET_EMBED_PAGE_PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Viikkonumero-widget
      </div>

      <h1>Upota viikkonumero omalle sivullesi</h1>

      <p className="lead">
        <span className="answer-sentence">
          Näytä kuluva viikkonumero omalla verkkosivullasi ilmaisella widgetillä –
          kopioi yksi koodirivi, niin viikko päivittyy automaattisesti.
        </span>{" "}
        Ei rekisteröitymistä, ei evästeitä, ei mainoksia.
      </p>

      <div className="widget-builder">
        <div className="widget-preview">
          <iframe
            key={theme}
            src={`${WEEK_WIDGET_PATH}${theme === "tumma" ? "?teema=tumma" : ""}`}
            width={WIDGET_WIDTH}
            height={WIDGET_HEIGHT}
            loading="lazy"
            title="Viikkonumero-widgetin esikatselu"
            style={{ border: 0, maxWidth: "100%" }}
          />
        </div>
        <div className="widget-controls">
          <fieldset className="widget-themes">
            <legend>Teema</legend>
            {WIDGET_THEMES.map((t) => (
              <label key={t.id}>
                <input
                  type="radio"
                  name="widget-theme"
                  value={t.id}
                  checked={theme === t.id}
                  onChange={() => setTheme(t.id)}
                />{" "}
                {t.label}
              </label>
            ))}
          </fieldset>
          <label htmlFor="widget-code" className="widget-code-label">
            Upotuskoodi
          </label>
          <textarea id="widget-code" className="widget-code" readOnly rows={4} value={code} />
          <button type="button" className="btn" onClick={copy}>
            {copied ? "Kopioitu ✓" : "Kopioi koodi"}
          </button>
        </div>
      </div>

      <section className="prose">
        <h2>Näin lisäät widgetin</h2>
        <ol>
          {WIDGET_EMBED_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p>
        Tarvitsetko viikkonumerot kalenteriin? Katso{" "}
        <Link to="/kalenteritilaus">kalenteritilaus</Link>. Kehittäjille on
        tarjolla myös <Link to="/avoin-data">avoin JSON-rajapinta</Link>.
      </p>
    </section>
  );
};

export default WidgetEmbed;
