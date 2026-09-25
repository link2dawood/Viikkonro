import { Link } from "react-router-dom";
import { CHROME_EXTENSION_PATH, EXTENSION_FACTS } from "../data/chromeExtensionContent";
import { ANDROID_APP_FACTS, ANDROID_APP_PATH } from "../data/androidAppContent";

// Homepage promo for the Chrome extension and Android app. Store URLs and
// facts come from the same content modules as their landing pages
// (/chrome-extension, /android-sovellus), so a store-link change is made once.
const AppsPromo = () => (
  <section>
    <h2 className="mh">Viikkonumero myös selaimessa ja puhelimessa</h2>
    <div className="apps-promo">
      <article className="apps-card">
        <div className="eyebrow">Chrome-laajennus</div>
        <h3>Viikkonumero aina työkalupalkissa</h3>
        <p>
          Kuluvan viikon numero näkyy Chromen työkalupalkissa ja päivittyy
          itsestään keskiyöllä. Yhdellä klikkauksella näet viikon päivämäärät,
          liputuspäivät ja kaupunkisi seuraavan koululoman.
        </p>
        <div className="apps-actions">
          <a
            className="btn"
            href={EXTENSION_FACTS.storeUrl}
            target="_blank"
            rel="noopener noreferrer external"
          >
            Lisää Chromeen – ilmainen <span aria-hidden="true">↗</span>
          </a>
          <Link className="ext-link" to={CHROME_EXTENSION_PATH}>
            Lue lisää →
          </Link>
        </div>
      </article>

      <article className="apps-card">
        <div className="apps-card-head">
          <img
            src="/mobile/android/app-icon.png"
            width="48"
            height="48"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <div>
            <div className="eyebrow">Android-sovellus</div>
            <h3>Viikot, kalenteri ja {ANDROID_APP_FACTS.widgetCount} widgetiä</h3>
          </div>
        </div>
        <p>
          Kuluva viikko, vuoden viikot, pyhäpäivät, koululomat ja laskurit
          puhelimessa. Widgetit näyttävät viikkonumeron suoraan
          aloitusnäytöllä.
        </p>
        <div className="apps-actions">
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
              loading="lazy"
            />
          </a>
          <Link className="ext-link" to={ANDROID_APP_PATH}>
            Lue lisää →
          </Link>
        </div>
      </article>
    </div>
  </section>
);

export default AppsPromo;
