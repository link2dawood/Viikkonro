import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import {
  CHROME_EXTENSION_PATH,
  EXTENSION_FACTS,
  EXTENSION_FEATURES,
  INSTALL_STEPS,
  chromeExtensionFaqs,
  omniboxExamples,
} from "../data/chromeExtensionContent";
import { WD, isoWeek, isoYear, mondayOf, weeksInIsoYear } from "../components/dateUtils";

// Landing page for the Viikko Nro Chrome extension. Facts, feature list,
// install steps and FAQ all come from chromeExtensionContent.js — the same
// module prerender.js reads for this page's SoftwareApplication, HowTo and
// FAQPage JSON-LD, so the visible page and the schema can't drift.
//
// The toolbar/popup preview is drawn in HTML/CSS from the real current ISO
// week (computed in the render body, like Weekcounter.jsx, so the
// prerendered HTML already shows the right week; the nightly rebuild keeps
// it fresh).
const StoreButton = ({ children = "Lisää Chromeen – ilmainen" }) => (
  <a
    className="btn"
    href={EXTENSION_FACTS.storeUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children} <span aria-hidden="true">↗</span>
  </a>
);

const ChromeExtension = () => {
  const meta = routeMeta[CHROME_EXTENSION_PATH];
  const faqs = chromeExtensionFaqs();
  const examples = omniboxExamples();

  const now = new Date();
  const week = isoWeek(now);
  const year = isoYear(now);
  const totalWeeks = weeksInIsoYear(year);
  const monday = mondayOf(week, year);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const todayKey = now.toDateString();
  const pct = Math.round((week / totalWeeks) * 100);

  return (
    <section className="app ext-page">
      <SEO {...meta} canonical={canonicalFor(CHROME_EXTENSION_PATH)} />

      <nav className="breadcrumb" aria-label="Murupolku">
        <ol>
          <li><Link to="/">Etusivu</Link></li>
          <li aria-current="page">Chrome-laajennus</li>
        </ol>
      </nav>

      <div className="eyebrow">Selainlaajennus</div>
      <h1>Viikkonumero aina näkyvissä Chromessa</h1>
      <p className="lead">
        <span className="answer-sentence">
          <strong>Viikko Nro – viikkonumero</strong> on ilmainen Chrome-laajennus,
          joka näyttää kuluvan ISO 8601 -viikon numeron selaimen työkalupalkissa.
        </span>{" "}
        Yhdellä klikkauksella näet viikon päivämäärät, päivän liputuspäivän ja
        kaupunkisi seuraavan koululoman – ilman mainoksia ja tietojen keräämistä.
      </p>

      <div className="ext-cta">
        <StoreButton />
        <a className="ext-link" href="#asennus">
          Näin asennat →
        </a>
      </div>

      <div className="hero-card ext-hero">
        <figure className="ext-mock" aria-label={`Esikatselu: laajennus näyttää viikon ${week} työkalupalkissa`}>
          <div className="ext-bar">
            <span className="ext-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="ext-url">vk 42</span>
            <span className="ext-icon" aria-hidden="true">
              <img src="/favicon-viikkonro-20260915.svg" alt="" width="18" height="18" />
              <b>{week}</b>
            </span>
          </div>
          <div className="ext-popup">
            <div className="now-label">Viikko Nro</div>
            <div className="ext-popup-head">
              <span className="week-big">
                <span className="vk">vk</span>
                {week}
              </span>
              <span className="ext-arrows" aria-hidden="true">
                ‹ ›
              </span>
            </div>
            <ul className="ext-days">
              {days.map((d) => (
                <li key={d.toISOString()} className={d.toDateString() === todayKey ? "now" : ""}>
                  <span>{WD[d.getDay()]}</span>
                  <span className="mono">
                    {d.getDate()}.{d.getMonth() + 1}.
                  </span>
                </li>
              ))}
            </ul>
            <div className="ext-progress" role="img" aria-label={`Vuosi ${year}: viikko ${week}/${totalWeeks}`}>
              <div className="comb-foot">
                <span>Vuosi {year}</span>
                <span>
                  {week}/{totalWeeks} · {pct} %
                </span>
              </div>
              <div className="ext-track">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <figcaption className="note-soft">
            Havainnekuva laajennuksen työkalupalkista ja ponnahdusikkunasta.
          </figcaption>
        </figure>

        <div>
          <div className="stat-row ext-stats">
            <div className="stat-box">
              <div className="n">0 €</div>
              <div className="l">Ilmainen, ei mainoksia</div>
            </div>
            <div className="stat-box">
              <div className="n">{EXTENSION_FACTS.cityCount}</div>
              <div className="l">Kaupungin koululomat</div>
            </div>
            <div className="stat-box">
              <div className="n">{EXTENSION_FACTS.permissionCount}</div>
              <div className="l">Käyttöoikeutta</div>
            </div>
            <div className="stat-box">
              <div className="n">{EXTENSION_FACTS.size.replace(" KiB", "")}</div>
              <div className="l">KiB kokonaiskoko</div>
            </div>
          </div>
          <p className="note-soft">
            Versio {EXTENSION_FACTS.version} · päivitetty {EXTENSION_FACTS.updatedFi} ·{" "}
            {EXTENSION_FACTS.languagesFi}
          </p>
        </div>
      </div>

      <h2 id="ominaisuudet">Mitä laajennus tekee?</h2>
      <div className="tool-grid">
        {EXTENSION_FEATURES.map((f) => (
          <article key={f.id} className="tool-card">
            <h3 className="tool-name">{f.name}</h3>
            <p className="tool-desc">{f.desc}</p>
          </article>
        ))}
      </div>

      <div className="prose">
        <h2>Viikkonumero työkalupalkissa</h2>
        <p>
          Laajennuksen kuvakkeessa näkyy kuluvan viikon numero, esimerkiksi{" "}
          <strong>42</strong> tai <strong>vk42</strong>. Numero päivittyy
          itsestään keskiyöllä, ja kun viet hiiren kuvakkeen päälle, näet viikon
          päivämäärät. Viikkonumero lasketaan kansainvälisen{" "}
          <Link to="/mika-on-viikkonumero">ISO 8601 -standardin</Link> mukaan:
          viikko alkaa maanantaista, ja vuoden ensimmäinen viikko on se, jolle
          osuu vuoden ensimmäinen torstai. Siksi numero vastaa suomalaisia
          kalentereita, työvuorolistoja ja{" "}
          <Link to="/">viikkonro.fi-palvelun etusivua</Link>.
        </p>

        <h2>Ponnahdusikkuna: viikko, liputuspäivät ja koululomat</h2>
        <ul>
          <li>Viikon päivämäärät maanantaista sunnuntaihin ja vuoden eteneminen</li>
          <li>Nuolet edellisiin ja tuleviin viikkoihin</li>
          <li>
            Päivän <Link to={`/liputuspaivat-${year}`}>liputuspäivä</Link>,
            esimerkiksi Aleksis Kiven päivä
          </li>
          <li>
            Valitsemasi kaupungin seuraava hiihto- tai syysloma ja päivät lomaan
          </li>
        </ul>
        <p>
          <Link to={`/koululomat-${year}`}>Koululomien</Link> päivämäärät
          perustuvat Opetushallituksen ja kaupunkien virallisiin päätöksiin.
          Laajennus kattaa {EXTENSION_FACTS.cityCount} suomalaista kaupunkia. Jos
          kaupunki ei ole vielä vahvistanut lomaansa, laajennus kertoo sen eikä
          arvaa päivämäärää.
        </p>

        <h2>Hae mikä tahansa viikko osoiteriviltä</h2>
        <p>
          Kirjoita Chromen osoiteriville <code>vk</code>, välilyönti ja viikon
          numero tai päivämäärä. Enter avaa viikon sivun viikkonro.fi-palvelussa.
        </p>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kirjoita osoiteriville</th>
              <th>Tulos</th>
            </tr>
          </thead>
          <tbody>
            {examples.map((e) => (
              <tr key={e.input}>
                <td>
                  <kbd className="ext-kbd">{e.input}</kbd>
                </td>
                <td>
                  <Link to={e.href}>{e.result}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose">
        <h2 id="asennus">Näin asennat Viikko Nro -laajennuksen</h2>
        <ol className="ext-steps">
          {INSTALL_STEPS.map((s) => (
            <li key={s.name}>
              <strong>{s.name}.</strong> {s.text}
            </li>
          ))}
        </ol>
        <p>
          <StoreButton>Avaa Chrome Web Store</StoreButton>
        </p>

        <h2>Yksityisyys ja käyttöoikeudet</h2>
        <p>
          Laajennus ei kerää tietoja, eikä siinä ole analytiikkaa tai mainoksia.
          Se toimii ilman verkkoyhteyttä ja pyytää vain{" "}
          {EXTENSION_FACTS.permissionCount} käyttöoikeutta: tallennuksen
          asetuksia varten ja ajastimen keskiyön päivitystä varten. Laajennus ei
          näe avaamiesi sivujen sisältöä. Lue myös viikkonro.fi-palvelun{" "}
          <Link to="/tietosuoja">tietosuojaseloste</Link>.
        </p>

        <h2>Kenelle laajennus sopii?</h2>
        <ul>
          <li>
            <strong>Vuorotyöläisille ja esihenkilöille</strong>, joiden
            työvuorolistat ja lomat merkitään viikkonumeroina.
          </li>
          <li>
            <strong>Projektipäälliköille ja kehittäjille</strong>, jotka
            suunnittelevat sprinttejä, toimituksia ja aikatauluja viikoittain –
            katso myös <Link to="/ajanhallinta">ajanhallinta</Link>.
          </li>
          <li>
            <strong>Perheille ja opettajille</strong>, jotka seuraavat hiihto- ja
            syyslomia.
          </li>
          <li>
            <strong>Kaikille, jotka kysyvät</strong> päivittäin, mikä viikko nyt
            on.
          </li>
        </ul>

        <h2>Tekniset tiedot</h2>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <tbody>
            <tr>
              <th scope="row">Nimi</th>
              <td>{EXTENSION_FACTS.name}</td>
            </tr>
            <tr>
              <th scope="row">Selain</th>
              <td>Google Chrome (Chrome Web Store)</td>
            </tr>
            <tr>
              <th scope="row">Versio</th>
              <td>{EXTENSION_FACTS.version}</td>
            </tr>
            <tr>
              <th scope="row">Päivitetty</th>
              <td>
                <time dateTime={EXTENSION_FACTS.updated}>{EXTENSION_FACTS.updatedFi}</time>
              </td>
            </tr>
            <tr>
              <th scope="row">Koko</th>
              <td>{EXTENSION_FACTS.size}</td>
            </tr>
            <tr>
              <th scope="row">Kielet</th>
              <td>{EXTENSION_FACTS.languagesFi}</td>
            </tr>
            <tr>
              <th scope="row">Luokka</th>
              <td>{EXTENSION_FACTS.categoryFi}</td>
            </tr>
            <tr>
              <th scope="row">Hinta</th>
              <td>Ilmainen</td>
            </tr>
            <tr>
              <th scope="row">Standardi</th>
              <td>ISO 8601 -viikkonumerot</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        <div className="faq-list">
          {faqs.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="ext-cta">
          <StoreButton />
        </p>
      </div>

      <h2>Aiheeseen liittyviä sivuja</h2>
      <div className="quicklinks">
        <Link className="ql" to="/android-sovellus">
          <b>Viikkonro Androidille</b>
          <span>Sovellus ja seitsemän aloitusnäytön widgetiä</span>
        </Link>
        <Link className="ql" to="/">
          <b>Mikä viikko nyt on?</b>
          <span>Kuluva viikkonumero ja viikkohaku</span>
        </Link>
        <Link className="ql" to={`/vuosi-${year}`}>
          <b>Vuoden {year} viikot</b>
          <span>Kaikki viikkonumerot päivämäärineen</span>
        </Link>
        <Link className="ql" to={`/koululomat-${year}`}>
          <b>Koululomat {year}</b>
          <span>Hiihto- ja syyslomat kaupungeittain</span>
        </Link>
        <Link className="ql" to="/paivamaara-viikoksi">
          <b>Päivämäärästä viikkonumeroon</b>
          <span>Minkä tahansa päivän viikko</span>
        </Link>
      </div>
    </section>
  );
};

export default ChromeExtension;
