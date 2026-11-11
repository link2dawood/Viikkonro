import { useToday } from "../components/useToday";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import {
  parseIsoDate,
  VERIFIED_CALCULATION_EXAMPLES,
  WEEKDAY_VERIFIED_DATE,
  weekdayFaqs,
  weekdayMeta,
  weekdayResult,
} from "../data/currentDateContent";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";

function toInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const WeekdayCalculator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState("");
  const today = weekdayResult(toInput(useToday()));

  useEffect(() => {
    const requested = searchParams.get("paiva");
    const timer = window.setTimeout(() => {
      setValue(parseIsoDate(requested) ? requested : toInput(new Date()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const result = weekdayResult(value);
  const chooseDate = (nextValue) => {
    setValue(nextValue);
    setSearchParams(nextValue ? { paiva: nextValue } : {}, { replace: true });
  };

  return (
    <section className="app">
      <SEO {...weekdayMeta} canonical={canonicalFor("/viikonpaiva")} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> / Viikonpäivälaskuri
      </div>
      <h1>Mikä viikonpäivä oli?</h1>
      <p className="lead">
        <span data-nosnippet><strong>Tänään {today.written} on {today.weekdayLower}.</strong> </span>
        Valitse mikä tahansa mennyt tai tuleva päivämäärä ja tarkista sen viikonpäivä, ISO-viikkonumero sekä kalenteritiedot.
      </p>

      <div className="calculator-status-card" role="region" aria-label="Laskurin tila ja tarkistus">
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Laskurin tila</span>
            <span className="status-val status-badge-live">
              <span className="status-dot-pulse" aria-hidden="true" /> Toiminnassa
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Laskentamenetelmä</span>
            <span className="status-val">
              <Link to="/menetelma">ISO 8601</Link>
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Kalenterijärjestelmä</span>
            <span className="status-val">Gregoriaaninen</span>
          </div>
          <div className="status-item">
            <span className="status-label">Viimeksi tarkistettu</span>
            <span className="status-val">{WEEKDAY_VERIFIED_DATE}</span>
          </div>
        </div>
      </div>

      <div className="lookup">
        <label htmlFor="weekday-date">Päivämäärä</label>
        <input
          id="weekday-date"
          type="date"
          value={value}
          onChange={(event) => chooseDate(event.target.value)}
        />
        {result && (
          <div className="result" aria-live="polite">
            <div className="main-text">
              <strong>{result.written}</strong> oli tai on <span className="num">{result.weekdayLower}</span>.
            </div>
            <div className="sub">
              ISO-viikko {result.week}/{result.weekYear} ·{" "}
              <Link to={"/viikko-" + result.week + "-" + result.weekYear}>
                avaa viikon {result.week} tiedot
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="prose">
        <p className="note-soft">
          Sisältö päivitetty {CONTENT_UPDATED_FI} · Laskentasäännöt ja testit tarkistettu {WEEKDAY_VERIFIED_DATE}.
        </p>

        <h2>Näin viikonpäivälaskuri toimii</h2>
        <ol>
          <li>Valitse päivämäärä valitsimesta tai kirjoita se muodossa YYYY-MM-DD.</li>
          <li>Laskuri ilmoittaa välittömästi viikonpäivän suomen kielellä.</li>
          <li>Näet samalla päivän virallisen ISO 8601 -viikkonumeron ja viikkovuoden.</li>
        </ol>
        <p>
          Valittu päivä tallentuu selaimesi osoiteriville <code>paiva</code>-parametriin (esimerkiksi{" "}
          <code>/viikonpaiva?paiva=2026-07-20</code>). Voit kopioida osoitteen ja jakaa saman laskelmatuloksen suoraan kollegalle tai kaverille.
          Sivuston ensisijainen kanoninen osoite on silti aina <strong>/viikonpaiva</strong>.
        </p>

        <h2>Todennettavat esimerkit (Calculation examples)</h2>
        <p>
          Pelkkien sääntöjen kuvaamisen sijaan voit todentaa laskurin toiminnan käytännössä. Alla olevat esimerkit
          havainnollistavat haastavia kalenteritapauksia, kuten aitoja karkauspäiviä ja vuodenvaihteita, joissa ISO-viikkovuosi
          eroaa kalenterivuodesta. Voit klikata mitä tahansa esimerkkiä testataksesi sen välittömästi laskurissa:
        </p>

        <div className="verified-examples-grid" role="region" aria-label="Todennettavat laskentaesimerkit">
          {VERIFIED_CALCULATION_EXAMPLES.map((ex) => (
            <article key={ex.isoDate} className="verified-example-card">
              <div className="verified-example-header">
                <div>
                  <h3 className="verified-example-date">{ex.titleFi}</h3>
                  <span className="verified-example-sub">{ex.titleEn}</span>
                </div>
                <span className="verified-example-badge">{ex.badge}</span>
              </div>
              <div className="verified-example-results">
                <div className="verified-example-row">
                  <span className="label">Viikonpäivä:</span>
                  <span className="val">{ex.weekdayFi} ({ex.weekdayEn})</span>
                </div>
                <div className="verified-example-row">
                  <span className="label">ISO-viikko:</span>
                  <span className="val">{ex.isoWeekStr}</span>
                </div>
              </div>
              <p className="verified-example-desc">{ex.description}</p>
              <button
                type="button"
                className="verified-example-btn"
                onClick={() => {
                  chooseDate(ex.isoDate);
                  if (typeof document !== "undefined") {
                    document.getElementById("weekday-date")?.focus();
                    document.getElementById("weekday-date")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              >
                Kokeile laskurissa ({ex.dateStr}) →
              </button>
            </article>
          ))}
        </div>

        <h2>Laskennan luotettavuus (Calculation reliability)</h2>
        <p>
          Viikonpäivälaskuri käyttää kansainvälisesti standardoitua gregoriaanista kalenteria ja
          virallista ISO 8601 -viikkojärjestelmää. Jokainen päivämäärä, viikonpäivä ja viikkonumero
          lasketaan deterministisellä matemaattisella algoritmilla. Laskenta ei perustu satunnaisiin
          tai käsin ylläpidettyihin listoihin, vaan täsmällisiin kalenterisääntöihin, jotka ovat
          julkisesti todennettavissa.
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Laskentaparametri</th>
                <th scope="col">Käytetty sääntö / määritys</th>
                <th scope="col">Standardi ja viite</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Kalenteri</th>
                <td>Gregoriaaninen kalenteri (Gregorian calendar)</td>
                <td>Proleptinen gregoriaaninen kalenteri</td>
              </tr>
              <tr>
                <th scope="row">Viikon alkamispäivä</th>
                <td>Maanantai (Monday)</td>
                <td>ISO 8601 / SFS-EN 28601</td>
              </tr>
              <tr>
                <th scope="row">Viikkonumerointi</th>
                <td>ISO 8601 -viikkojärjestelmä</td>
                <td>Kansainvälinen standardi ISO 8601:2004 / 8601-1:2019</td>
              </tr>
              <tr>
                <th scope="row">Päivämäärälaskenta</th>
                <td>Deterministinen kalenterialgoritmi</td>
                <td>Matemaattisesti todennettava kalenterilaskenta</td>
              </tr>
              <tr>
                <th scope="row">Aikavyöhyke</th>
                <td>Suomen virallinen aika (Europe/Helsinki)</td>
                <td>Normaaliaikana UTC+2 (EET), kesäaikana UTC+3 (EEST)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Tietolähteet ja tarkistusviitteet</h3>
        <p>
          Voit tarkistaa ja todentaa palvelun käyttämät standardit ja aineistot seuraavista lähteistä:
        </p>
        <ul>
          <li>
            <a
              href="https://www.iso.org/iso-8601-date-and-time-format.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>ISO – International Organization for Standardization (ISO 8601)</strong>
            </a>: Virallinen kansainvälinen standardi päivämäärien, kellonaikojen ja viikkonumeroiden esittämiseen.
          </li>
          <li>
            <Link to="/menetelma">
              <strong>Viikko Nro – Laskentamenetelmä</strong>
            </Link>: Yksityiskohtainen tekninen kuvaus siitä, miten viikkonumerot, vuodenvaihteet ja kalenterikaavat toteutetaan sivuston koodissa.
          </li>
          <li>
            <Link to="/tietolahteet">
              <strong>Viikko Nro – Tietolähteet</strong>
            </Link>: Kattava katsaus palvelun hyödyntämiin standardeihin, virallisiin pyhäpäivälakeihin ja aineistoihin.
          </li>
          <li>
            <Link to="/toimitusperiaatteet">
              <strong>Viikko Nro – Toimitusperiaatteet</strong>
            </Link>: Toimituksellinen riippumattomuus, laadunvarmistus ja virheiden korjausprosessi.
          </li>
        </ul>

        <h2>Miten laskuri käsittelee karkausvuodet ja poikkeustapaukset?</h2>
        <p>
          Luotettava kalenterilaskenta vaatii poikkeustapausten ja kalenterin rajapintojen täydellistä hallintaa:
        </p>

        <h3>1. Karkausvuodet (Leap years)</h3>
        <p>
          Gregoriaanisessa ajanlaskussa vuosi on karkausvuosi, jos sen vuosiluku on jaollinen neljällä (kuten 2024, 2028 ja 2032).
          Poikkeuksena ovat tasavuosisadat (vuodet, jotka päättyvät 00): ne ovat karkausvuosia <em>vain silloin</em>, kun ne ovat jaollisia
          myös 400:lla. Tästä syystä esimerkiksi vuodet 1600, 2000 ja 2400 ovat karkausvuosia, mutta vuodet 1700, 1800, 1900 ja 2100
          ovat tavallisia 365-päiväisiä vuosia. Laskurimme noudattaa tätä 400 vuoden sääntöä tarkasti.
        </p>

        <h3>2. Karkauspäivä 29. helmikuuta (February 29)</h3>
        <p>
          Helmikuun 29. päivä esiintyy vain karkausvuosina. Laskuri validoi syötteet deterministisesti: kun syötät 29.2. aitoon karkausvuoteen,
          laskuri laskee oikean viikonpäivän (esimerkiksi 29.2.2024 oli torstai). Jos käyttäjä syöttää virheellisen päivän (kuten 29.2.2025
          tai 31.4.), laskuri tunnistaa virheellisen päivämäärän eikä anna virheellistä tulosta.
        </p>

        <h3>3. Vuodenvaihteet ja ISO-viikkovuoden ero (Year boundaries &amp; ISO week-year differences)</h3>
        <p>
          Yleinen syy kalenterisekaannuksiin on kalenterivuoden ja ISO-viikkovuoden ero vuodenvaihteessa.
          ISO 8601 -standardin määritelmän mukaan <strong>vuoden viikko 1 on se viikko, johon kuuluu uuden vuoden ensimmäinen torstai</strong> (eli
          vähintään neljä uuden vuoden päivää). Tästä johtuen:
        </p>
        <ul>
          <li>
            <strong>Tammikuun 1.–3. päivä</strong> voivat kuulua edellisen vuoden viikkoon 52 tai 53. Esimerkiksi 1.1.2027 on perjantai,
            mutta se kuuluu ISO-viikkoon 53/2026, koska viikon torstai (31.12.) sijoittui vuodelle 2026.
          </li>
          <li>
            <strong>Joulukuun 29.–31. päivä</strong> voivat kuulua jo seuraavan kalenterivuoden viikkoon 1. Esimerkiksi 31.12.2029 on
            maanantai, mutta se kuuluu jo ISO-viikkoon 1/2030, koska saman viikon torstai on 3.1.2030.
          </li>
        </ul>
        <p>
          Viikonpäivälaskuri ilmoittaa aina selkeästi sekä viikonpäivän että täsmällisen ISO-viikon ja -viikkovuoden.
        </p>

        <h3>4. Historialliset ja tulevat päivämäärät (Historical and future dates)</h3>
        <p>
          Laskuri perustuu niin sanottuun proleptiseen gregoriaaniseen kalenteriin, joka ulottaa modernit kalenterisäännöt
          yhdenmukaisesti menneisyyteen ja tulevaisuuteen. Historiallisissa yhteyksissä on hyvä ottaa huomioon, että Suomessa (osana Ruotsin
          kuningaskuntaa) siirryttiin vanhasta juliaanisesta kalenterista gregoriaaniseen kalenteriin vuonna 1753. Siirtymässä helmikuun 17.
          päivää 1753 seurasi suoraan maaliskuun 1. päivä. Laskuri laskee viikonpäivät aina nykyaikaisen gregoriaanisen standardin mukaisesti.
        </p>

        <h2>Tietoa palvelusta ja toimituksellisesta ylläpidosta</h2>
        <p>
          Kalenterityökalu ei vaadi perinteistä lehtitoimitusta, mutta käyttäjällä on oikeus tietää tarkalleen,
          kuka palvelua operoi, mihin laskentalogiikka nojaa ja miten tietojen virheettömyys taataan:
        </p>

        <h3>Kuka operoi Viikko Nro -palvelua?</h3>
        <p>
          Viikkonro.fi-palvelua ylläpitää ja kehittää itsenäinen ohjelmistoasiantuntija <strong>Dawood Zafar</strong>.
          Palvelu on suomalainen, puolueeton ja riippumaton verkkojulkaisu. Voit tutustua palvelun taustaan,
          rekisteritietoihin ja tarkoitukseen tarkemmin sivulla <Link to="/tietoa-meista">Tietoa meistä</Link>.
        </p>

        <h3>Miksi palvelu on luotu?</h3>
        <p>
          Sivusto syntyi tarpeesta luoda selkeä, salamannopea ja esteetön kotimainen kalenteriviite. Monilla
          verkkosivuilla viikkonumerot ja kalenterilaskelmat ovat epätarkkoja, hitaita tai peittyvät häiritsevien
          mainosbannereiden alle. Viikkonro tarjoaa suomalaisille palkansaajille, tiimeille, opiskelijoille ja
          yrityksille täsmällisen, mainoshäiriöttömän ja yksityisyyttä kunnioittavan työkalun arjen ajanhallintaan
          ja aikataulutukseen.
        </p>

        <h3>Kuka vastaa laskennasta ja kalenterimenetelmästä?</h3>
        <p>
          Laskentasäännöt ja matemaattiset algoritmit on toteuttanut ja niitä valvoo palvelun ylläpitäjä.
          Kaikki laskelmat perustuvat viralliseen <strong>ISO 8601</strong> -viikkostandardiin ja <strong>gregoriaaniseen kalenterijärjestelmään</strong>.
          Laskenta suoritetaan deterministisesti koodilla suoraan selaimessa, joten se ei nojaa käsin syötettyihin
          tai vanhentuviin staattisiin taulukoihin. Tutustu tarkkaan laskentakaavaan sivulla{" "}
          <Link to="/menetelma">Laskentamenetelmä</Link> sekä aineistojen taustoihin sivulla{" "}
          <Link to="/tietolahteet">Tietolähteet</Link>.
        </p>

        <h3>Miten usein työkaluja testataan?</h3>
        <p>
          Laskurin toimintavarmuutta valvotaan jatkuvasti:
        </p>
        <ul>
          <li><strong>Yli 1 300 automaattista yksikkö- ja integraatiotestiä:</strong> Koko koodikanta ajetaan läpi jokaisen julkaisun yhteydessä kalenteripoikkeusten, karkausvuosien ja rajapäivien varalta.</li>
          <li><strong>Päivittäinen valvontaohjelma:</strong> Automaattinen GitHub Actions -valvontaskripti ajaa testit läpi joka yö klo 01.05 UTC ja verifioi kuluvan viikon, viikonpäivän sekä päivämäärien synkronoinnin.</li>
          <li><strong>Yöllinen automaattikoonti:</strong> Sivusto uudelleenrakennetaan joka yö klo 00.05 Suomen aikaa, mikä varmistaa tuoreen staattisen esirenderöinnin hakukoneille ja käyttäjille.</li>
        </ul>

        <h3>Miten virheistä ilmoitetaan ja miten ne korjataan?</h3>
        <p>
          Noudatamme avointa korjauskäytäntöä. Jos havaitset laskurin tuloksessa minkäänlaisen poikkeaman tai haluat
          ehdottaa parannusta, voit lähettää palautetta <Link to="/ota-yhteytta">yhteydenottolomakkeella</Link> tai
          sähköpostitse osoitteeseen <code>hi@viikkonro.fi</code>.
        </p>
        <p>
          Koska Viikkonron sivut käyttävät keskitettyä laskentamoduulia, mahdolliset bugikorjaukset viedään suoraan
          ydinlogiikkaan. Tämä tarkoittaa, että yksi korjaus päivittää välittömästi koko sivuston kaikki vastaavat
          laskurit ilman sivukohtaisia viiveitä. Lue toimituksellisesta tarkistusprosessistamme sivulta{" "}
          <Link to="/toimitusperiaatteet">Toimitusperiaatteet</Link>.
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {weekdayFaqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>

      <p>
        Katso myös <Link to="/ikalaskuri">ikälaskuri</Link>,{" "}
        <Link to="/paivamaara-viikoksi">päivämäärän viikkonumero</Link>,{" "}
        <Link to="/tyopaivalaskuri">työpäivälaskuri</Link>,{" "}
        <Link to="/">mikä viikko nyt on</Link> ja <Link to="/mika-kuukausi-nyt">mikä kuukausi nyt on</Link>.
      </p>
    </section>
  );
};

export default WeekdayCalculator;
