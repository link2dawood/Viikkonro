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

      <section className="prose" id="yrityskalenteri-widget">
        <h2>Yrityskalenteri omalle verkkosivulle</h2>
        <p>Uusi versioitu kalenteriwidget näyttää kuukauden tai viikon, ISO-viikkonumerot ja Suomen pyhäpäivät. Voit vaihtaa väriä ja teemaa. Kalenterissa ei ole mainoksia, analytiikkaa tai kirjautumista.</p>
        <iframe src="/widget/calendar/v1" title="Yrityskalenterin esikatselu" loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", maxWidth: 650, height: 650, border: 0 }} />
        <h3>Upotuskoodi, versio 1</h3>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{`<iframe id="yrityskalenteri" src="${SITE_URL}/widget/calendar/v1?view=month&theme=light&color=%231f7a5c" title="Yrityskalenteri" loading="lazy" referrerpolicy="no-referrer" width="650" height="650" style="border:0;width:100%;max-width:650px"></iframe>`}</pre>
        <p><code>view=week</code> näyttää viikon. <code>theme=dark</code> vaihtaa tummaan teemaan. <code>date=2028-02-29</code> avaa tietyn päivän; ilman päivää kalenteri seuraa Suomen aikaa. <code>holidays=false</code> piilottaa pyhät.</p>
        <h3>Yrityksen nimi ja tapahtumat</h3>
        <p>Lähetä tiedot upotuksen latauduttua suoraan iframeen. Tietoja ei tallenneta tai lähetetä palvelimelle. Älä lisää nimiä, tapahtumia, API-avaimia tai yksityisten kalenterien tunnisteita URL-osoitteeseen. Julkiselle verkkosivulle lisätyt tapahtumat näkyvät sen kävijöille, joten käytä vain julkaistavaksi tarkoitettuja tietoja.</p>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{`const frame = document.getElementById('yrityskalenteri');
frame.addEventListener('load', () => {
  frame.contentWindow.postMessage({
    type: 'viikkonro-calendar:configure', version: 1,
    config: {
      view: 'month', theme: 'light', color: '#1f7a5c',
      companyName: 'Yrityksen kalenteri',
      events: [{ id: 'avoin-tilaisuus', date: '2027-06-15', title: 'Avoimet ovet' }]
    }
  }, '${SITE_URL}');
});`}</pre>
        <p>Asetusviesti korvaa koko määrityksen. Enintään 100 tapahtumaa, otsikko enintään 120 merkkiä. Jakson viimeinen päivä annetaan kentässä <code>endDate</code> ja se sisältyy tapahtumaan. Upotuksen korkeus on sivun ylläpitäjän määritettävä; pitkät tapahtumat tarvitsevat enemmän tilaa.</p>
        <p>Ilmainen versio sisältää ulkoasun ja tapahtumat sekä Viikkonro.fi-lähdemerkinnän. Premium-version oma logo ja lähdemerkinnän korvaaminen odottavat varmennettua lisensointia. Maksamista tai selaimessa asetettavaa premium-avausta ei ole käytössä.</p>
        <p>Yrityskalenterin suunnitteluun voit käyttää <Link to="/yrityskalenteri">Viikkonro Yrityskalenteria</Link>. Yksityinen tiimikalenteri säilyy erillisenä eikä sitä voi julkaista tällä upotuksella.</p>
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
