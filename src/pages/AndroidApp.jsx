import { useToday } from "../components/useToday";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import {
  ANDROID_APP_FACTS,
  ANDROID_APP_FEATURES,
  ANDROID_APP_PATH,
  ANDROID_INSTALL_STEPS,
  ANDROID_WIDGETS,
  androidAppFaqs,
} from "../data/androidAppContent";

const PlayStoreButton = () => (
  <a
    className="android-store-link"
    href={ANDROID_APP_FACTS.storeUrl}
    target="_blank"
    rel="noopener noreferrer external"
    aria-label="Saatavilla Google Playsta – avautuu uuteen välilehteen"
  >
    <img
      src="/mobile/android/google-play-logo.png"
      alt="Google Play"
      width="388"
      height="432"
    />
  </a>
);

const AndroidApp = () => {
  const meta = routeMeta[ANDROID_APP_PATH];
  const year = useToday().getFullYear();

  return (
    <section className="app android-page">
      <SEO {...meta} canonical={canonicalFor(ANDROID_APP_PATH)} />

      <nav className="breadcrumb" aria-label="Murupolku">
        <ol>
          <li><Link to="/">Etusivu</Link></li>
          <li aria-current="page">Android-sovellus</li>
        </ol>
      </nav>

      <div className="android-hero">
        <div className="android-hero-copy">
          <div className="android-app-heading">
            <img
              src="/mobile/android/app-icon.png"
              width="88"
              height="88"
              alt=""
              aria-hidden="true"
            />
            <div>
              <div className="eyebrow">Android-sovellus</div>
              <h1>Viikkonro Android-sovellus ja widgetit</h1>
            </div>
          </div>
          <p className="lead">
            <span className="answer-sentence">
              <strong>Viikkonro</strong> tuo kuluvan viikon, suomalaisen
              kalenterin ja hyödylliset päivämäärälaskurit Android-puhelimeesi.
            </span>{" "}
            Seitsemän aloitusnäytön widgetiä pitää tärkeimmät tiedot näkyvissä
            avaamatta sovellusta.
          </p>
          <div className="ext-cta">
            <PlayStoreButton />
            <a className="ext-link" href="#widgetit">Katso widgetit →</a>
          </div>
          <p className="note-soft">
            Maksuton · ei rekisteröitymistä · {ANDROID_APP_FACTS.minimumAndroid}
          </p>
        </div>

        <figure className="android-phone-feature">
          <div className="android-phone-frame">
            <img
              src="/mobile/android/app-weeks.png"
              alt="Viikkonro-sovelluksen Viikot-näkymä, jossa viikko 38 on korostettu"
              width="1080"
              height="1920"
            />
          </div>
          <figcaption>Kaikki vuoden viikot selkeänä listana.</figcaption>
        </figure>
      </div>

      <div
        className="stat-row android-stats"
        role="group"
        aria-label="Sovelluksen perustiedot"
      >
        <div className="stat-box"><div className="n">{ANDROID_APP_FACTS.price}</div><div className="l">Maksuton lataus</div></div>
        <div className="stat-box"><div className="n">{ANDROID_APP_FACTS.widgetCount}</div><div className="l">Android-widgetiä</div></div>
        <div className="stat-box"><div className="n">{ANDROID_APP_FACTS.languageCount}</div><div className="l">Käyttöliittymäkieltä</div></div>
        <div className="stat-box"><div className="n">Offline</div><div className="l">Kalenteri mukana</div></div>
      </div>

      <h2 id="ominaisuudet">Kalenteri ja laskurit samassa sovelluksessa</h2>
      <p className="lead android-section-lead">
        Sovellus laskee <Link to="/mika-on-viikkonumero">ISO 8601 -viikkonumerot</Link>
        {" "}samalla tavalla kuin suomalaiset kalenterit. Voit tarkistaa
        {" "}<Link to={`/vuosi-${year}`}>vuoden {year} kaikki viikot</Link>, selata
        kuukausia ja käyttää samoja <Link to="/laskurit">päivämäärälaskureita</Link>
        {" "}myös puhelimella.
      </p>
      <div className="tool-grid">
        {ANDROID_APP_FEATURES.map((feature) => (
          <article key={feature.id} className="tool-card">
            <h3 className="tool-name">{feature.name}</h3>
            <p className="tool-desc">{feature.desc}</p>
          </article>
        ))}
      </div>

      <div
        className="android-screen-gallery"
        role="group"
        aria-label="Kuvia Viikkonro-sovelluksesta"
      >
        <figure>
          <div className="android-phone-frame">
            <img
              src="/mobile/android/app-weeks.png"
              alt="Vuoden viikot Viikkonro-sovelluksessa"
              width="1080"
              height="1920"
              loading="lazy"
            />
          </div>
          <figcaption>Viikot</figcaption>
        </figure>
        <figure>
          <div className="android-phone-frame">
            <img
              src="/mobile/android/app-calendar.png"
              alt="Syyskuun 2026 kalenteri viikkonumeroineen"
              width="1080"
              height="1920"
              loading="lazy"
            />
          </div>
          <figcaption>Kalenteri</figcaption>
        </figure>
        <figure>
          <div className="android-phone-frame">
            <img
              src="/mobile/android/app-tools.png"
              alt="Päivien erotus -laskuri Viikkonro-sovelluksessa"
              width="1080"
              height="1920"
              loading="lazy"
            />
          </div>
          <figcaption>Laskurit</figcaption>
        </figure>
      </div>

      <div className="prose">
        <h2 id="widgetit">Seitsemän widgetiä aloitusnäytölle</h2>
        <p>
          Lisää aloitusnäytölle juuri tarvitsemasi näkymä: pieni viikkonumero,
          koko viikon päivät, kuukausikalenteri, oma laskuri, seuraavat pyhä- ja
          liputuspäivät tai kaupungin koululomat. Widgetit laskevat viikon
          Androidissa ja päivittyvät myös silloin, kun sovellus ei ole käynnissä.
        </p>
      </div>

      <div className="android-widget-grid">
        {ANDROID_WIDGETS.map((widget) => (
          <figure key={widget.id} className="android-widget-card">
            <div className="android-widget-preview">
              <img
                src={widget.image}
                alt={widget.alt}
                width={widget.width}
                height={widget.height}
                loading="lazy"
              />
            </div>
            <figcaption>
              <strong>{widget.name}</strong>
              <span>{widget.desc}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="prose">
        <h2 id="asennus">Näin asennat Viikkonro-sovelluksen</h2>
        <ol className="ext-steps">
          {ANDROID_INSTALL_STEPS.map((step) => (
            <li key={step.name}>
              <strong>{step.name}.</strong> {step.text}
            </li>
          ))}
        </ol>
        <p><PlayStoreButton /></p>

        <h2>Yksityisyys Android-sovelluksessa</h2>
        <p>
          Sovellus ei vaadi käyttäjätiliä eikä synkronoi asetuksiasi pilveen.
          Asetukset ja widget-valinnat säilyvät laitteellasi. Android-versio
          käyttää Google Mobile Adsia, Google Analytics for Firebasea ja
          Firebase Crashlyticsia; mainosten suostumusvalintoja voi hallita
          sovelluksen asetuksista. Tarkat tiedot löytyvät päivitetyltä{" "}
          <Link to="/tietosuoja">tietosuojasivulta</Link>.
        </p>

        <h2>Tekniset tiedot</h2>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr><th scope="row">Sovellus</th><td>{ANDROID_APP_FACTS.storeName}</td></tr>
              <tr><th scope="row">Versio</th><td>{ANDROID_APP_FACTS.version}</td></tr>
              <tr><th scope="row">Android</th><td>{ANDROID_APP_FACTS.minimumAndroid}</td></tr>
              <tr><th scope="row">Kielet</th><td>{ANDROID_APP_FACTS.languageCount} käyttöliittymäkieltä</td></tr>
              <tr><th scope="row">Widgetit</th><td>{ANDROID_APP_FACTS.widgetCount} aloitusnäytön widgetiä</td></tr>
              <tr><th scope="row">Hinta</th><td>Maksuton lataus</td></tr>
              <tr><th scope="row">Paketin tunnus</th><td><code>{ANDROID_APP_FACTS.packageId}</code></td></tr>
            </tbody>
          </table>
        </div>

        <h2 id="usein-kysyttya">Usein kysytyt kysymykset</h2>
        <div className="faq-list">
          {androidAppFaqs.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <div className="android-final-cta">
          <img src="/mobile/android/app-icon.png" alt="" width="72" height="72" aria-hidden="true" />
          <div>
            <h2>Lataa Viikkonro Androidille</h2>
            <p>Viikkonumerot, kalenteri, laskurit ja widgetit yhdessä sovelluksessa.</p>
          </div>
          <PlayStoreButton />
        </div>
      </div>

      <h2>Aiheeseen liittyviä sivuja</h2>
      <div className="quicklinks">
        <Link className="ql" to="/">
          <b>Mikä viikko nyt on?</b>
          <span>Kuluva viikkonumero ja viikon päivämäärät</span>
        </Link>
        <Link className="ql" to={`/vuosi-${year}`}>
          <b>Vuoden {year} viikot</b>
          <span>Kaikki ISO-viikot päivämäärineen</span>
        </Link>
        <Link className="ql" to="/laskurit">
          <b>Päivämäärälaskurit</b>
          <span>Viikko-, päivä- ja työpäivälaskurit verkossa</span>
        </Link>
        <Link className="ql" to="/chrome-extension">
          <b>Chrome-laajennus</b>
          <span>Viikkonumero myös selaimen työkalupalkkiin</span>
        </Link>
      </div>
    </section>
  );
};

export default AndroidApp;
