import { Link } from "react-router-dom";
import { isoWeek, isoYear, weeksInIsoYear } from "../components/dateUtils";
import SEO from "../components/SEO";
import { whatWeekFaqs } from "../data/isoWeekContent";
import {
  canonicalFor,
  routeMeta,
  CONTENT_UPDATED_FI,
} from "../data/seo";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";

const WhatWeek = () => {
  // Live current week/year, computed in the render body so the prerendered HTML
  // is correct too; the daily rebuild keeps it fresh and hydration reconciles.
  const NOW = new Date();
  const W_NOW = isoWeek(NOW);
  const Y_NOW = isoYear(NOW);
  const weeksInYear = weeksInIsoYear(Y_NOW);
  const meta = routeMeta["/mika-on-viikkonumero"];

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor("/mika-on-viikkonumero")} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to="/mika-on-viikkonumero">Mikä on viikkonumero</Link>
      </div>

      <h1>Mikä on viikkonumero?</h1>

      <div className="prose">
        {/* Direct answer block — the self-contained definition AI engines lift. */}
        <p className="lead">
          <strong>
            Viikkonumero on 1–53 välinen kokonaisluku, joka kertoo, kuinka mones
            vuoden viikko on parhaillaan menossa.
          </strong>{" "}
          Suomessa viikkonumerot lasketaan ISO 8601 -standardin mukaan, jossa
          viikko alkaa maanantaista ja päättyy sunnuntaihin, ja vuoden
          ensimmäinen viikko on aina se, johon vuoden ensimmäinen torstai (ja
          siten 4. tammikuuta) osuu.
        </p>

        <p>
          Juuri nyt on{" "}
          <Link to={`/vuosi-${Y_NOW}`}>
            <strong>
              viikko {W_NOW}, vuosi {Y_NOW}
            </strong>
          </Link>
          . Vuodessa {Y_NOW} on yhteensä {weeksInYear} viikkoa. Tämä opas
          selittää viikkonumeron määritelmän, ISO 8601:n säännöt, laskentatavan
          ja käytännön esimerkit.
        </p>
        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        {/* Quick facts — each bullet independently citable. */}
        <div className="panel">
          <div className="now-label">Viikkonumero lyhyesti</div>
          <ul>
            <li>
              <strong>Määritelmä:</strong> 1–53 välinen kokonaisluku, joka
              ilmaisee vuoden kuluvan viikon.
            </li>
            <li>
              <strong>Standardi:</strong> ISO 8601 (julkaistu 1988, päivitetty
              viimeksi 2019).
            </li>
            <li>
              <strong>Viikon alku:</strong> maanantai. Viikon loppu: sunnuntai.
            </li>
            <li>
              <strong>Viikko 1 -sääntö:</strong> vuoden ensimmäinen viikko
              sisältää vuoden ensimmäisen torstain.
            </li>
            <li>
              <strong>Käytännön sääntö:</strong> viikkoon 1 kuuluu aina 4.
              tammikuuta.
            </li>
            <li>
              <strong>Viikkojen määrä vuodessa:</strong> 52 tai 53.
            </li>
            <li>
              <strong>ISO-merkintätapa:</strong> <code>2026-W30</code> tarkoittaa
              vuoden 2026 viikkoa 30.
            </li>
            <li>
              <strong>Käyttö:</strong> Suomi, muu Eurooppa ja kansainvälinen
              liike-elämä.
            </li>
          </ul>
        </div>

        <h2>Miten viikkonumero määräytyy ISO 8601:ssä?</h2>
        <p>
          ISO 8601 -viikkonumerot määräytyvät kolmen säännön perusteella.
          Säännöt ovat yksinkertaisia, mutta yhdessä ne poistavat kaiken
          tulkinnanvaraisuuden — kaksi eri järjestelmää eivät voi laskea samaa
          päivää eri viikkoon.
        </p>

        <h3>Sääntö 1: Viikko alkaa maanantaista</h3>
        <p>
          Viikon ensimmäinen päivä on maanantai ja viimeinen sunnuntai.
          Yhdysvalloissa, Kanadassa ja osassa Aasiaa viikko alkaa usein
          sunnuntaista, mikä johtaa siihen, että sama päivä voi kuulua eri
          viikkonumeroon eri maassa. Suomessa on aina turvallista olettaa
          ISO-viikkoa.
        </p>

        <h3>Sääntö 2: Vuoden viikko 1 sisältää ensimmäisen torstain</h3>
        <p>
          <strong>
            Vuoden ensimmäinen viikko on aina se, johon vuoden ensimmäinen
            torstai osuu.
          </strong>{" "}
          Käytännössä tämä tarkoittaa, että 4. tammikuuta kuuluu <em>aina</em>{" "}
          viikkoon 1, olipa vuosi mikä tahansa. Tämä on koko standardin paras
          muistisääntö.
        </p>
        <p>Säännöstä seuraa kaksi asiaa, jotka yllättävät monta:</p>
        <ol>
          <li>
            Vuoden ensimmäiseen viikkoon voi kuulua vielä{" "}
            <strong>edellisen vuoden joulukuun päiviä</strong>. Esimerkiksi 29.,
            30. ja 31. joulukuuta 2025 kuuluvat jo vuoden 2026 viikkoon 1, koska
            sen viikon torstai on 1.1.2026.
          </li>
          <li>
            Vuoden viimeiseen viikkoon voi kuulua{" "}
            <strong>seuraavan vuoden tammikuun päiviä</strong>. Esimerkiksi 1.–3.
            tammikuuta 2027 kuuluvat vielä vuoden 2026 viikkoon 53.
          </li>
        </ol>

        <h3>Sääntö 3: Vuodessa on 52 tai 53 viikkoa</h3>
        <p>
          Tavallisessa vuodessa on 52 viikkoa. Vuodessa on 53 viikkoa silloin,
          kun vuosi alkaa torstaista tai kun karkausvuosi alkaa keskiviikosta.
          Näin käy noin joka viides tai kuudes vuosi. Esimerkiksi{" "}
          <strong>vuosi 2020 (53 viikkoa)</strong>,{" "}
          <strong>2026 (53 viikkoa)</strong> ja{" "}
          <strong>2032 (53 viikkoa)</strong> ovat 53 viikon vuosia. Aiheesta oma
          sivunsa:{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">
            kuinka monta viikkoa vuodessa on
          </Link>
          .
        </p>

        <h2>Miten viikkonumero lasketaan?</h2>
        <p>
          Viikkonumeron voi laskea kolmella tavalla — käsin, algoritmilla tai
          laskurilla. Käytännössä kaikki tarvitsevat vain kaksi tietoa: minkä
          päivän viikkoa lasketaan, ja mikä on saman viikon torstai.
        </p>

        <h3>1. Käsin laskettuna</h3>
        <ol>
          <li>Etsi tarkasteltavan päivän sisältävän viikon torstai.</li>
          <li>Katso, mihin vuoteen tämä torstai kuuluu — se on viikkovuosi.</li>
          <li>
            Laske, kuinka mones torstai se on kyseisenä vuonna. Se on
            viikkonumero.
          </li>
        </ol>
        <p>
          Esimerkki: mihin viikkoon <strong>1.1.2027 (perjantai)</strong> kuuluu?
          Saman viikon torstai on 31.12.2026. Se on vuoden 2026{" "}
          <strong>53. torstai</strong>, joten päivä kuuluu vuoden 2026 viikkoon
          53.
        </p>

        <h3>2. Algoritmilla</h3>
        <p>
          Ohjelmistoissa käytetään yleensä muunnelmaa, jossa lasketaan päivän
          torstain etäisyys saman viikkovuoden 4. tammikuusta ja jaetaan
          seitsemällä. Käytännössä kaikki ohjelmointikielet tarjoavat valmiin
          funktion (JavaScriptissä esim. <code>date.toLocaleDateString</code>{" "}
          ISO-lokaalilla tai kirjaston kuten <em>date-fns</em>{" "}
          <code>getISOWeek()</code>), joten omaa kaavaa tarvitaan harvoin.
        </p>

        <h3>3. Laskurilla</h3>
        <p>
          Nopein tapa: avaa <Link to="/">viikkonro.fi:n etusivu</Link> — kuluva
          viikkonumero näkyy heti isolla. Minkä tahansa muun päivän viikon saa{" "}
          <Link to="/paivamaara-viikoksi">päivämäärähausta</Link>.
        </p>

        <h2>Esimerkkejä viikkolaskennasta</h2>
        <p>Nämä esimerkit näyttävät sudenkuopat käytännössä:</p>
        <ul>
          <li>
            <strong>4. tammikuuta 2026</strong> → viikko 1 vuonna 2026.
          </li>
          <li>
            <strong>1.1.2026 (torstai)</strong> → viikko 1, koska se on vuoden
            ensimmäinen torstai.
          </li>
          <li>
            <strong>29.12.2025 (maanantai)</strong> → viikko 1 vuonna 2026. Ei
            siis viikko 53 vuonna 2025.{" "}
            <Link to="/viikko-1-2026">Avaa viikko 1/2026 →</Link>
          </li>
          <li>
            <strong>31.12.2023 (sunnuntai)</strong> → viikko 52 vuonna 2023.
          </li>
          <li>
            <strong>1.1.2023 (sunnuntai)</strong> → viikko 52 vuonna 2022, ei
            viikko 1 vuonna 2023.
          </li>
          <li>
            <strong>20.7.2026 (maanantai)</strong> → viikko 30 vuonna 2026.{" "}
            <Link to="/viikko-30-2026">Avaa viikko 30/2026 →</Link>
          </li>
        </ul>

        <h2>Mihin viikkonumeroa käytetään Suomessa?</h2>
        <p>
          Viikkonumero on suomalaisessa arjessa niin luonteva, että sitä
          käytetään ilman että sitä huomaa. Tavallisimmat käyttöalueet:
        </p>
        <ul>
          <li>
            <strong>Työelämä:</strong> palaverit (»viikolla 12»), lomien merkintä
            HR-järjestelmiin, projektiaikataulut, vuorolistat ja tuotannon
            suunnittelu.
          </li>
          <li>
            <strong>Koulut ja päiväkodit:</strong> lukuvuosikalenterit, jaksot,
            koeviikot, talvi- ja syyslomat. Hiihtoloma on Suomessa{" "}
            <Link to={`/viikko-8-${Y_NOW}`}>viikko 8</Link> tai{" "}
            <Link to={`/viikko-9-${Y_NOW}`}>viikko 9</Link> alueesta riippuen.
          </li>
          <li>
            <strong>Terveydenhuolto:</strong> raskausviikot ilmaistaan
            raskausviikko-numerolla (esim. rv. 24), sairauspoissaolot ja
            kuntoutusjaksot suunnitellaan usein viikoittain.
          </li>
          <li>
            <strong>Kauppa ja logistiikka:</strong> tarjouskampanjat, sesongit ja
            toimitusaikataulut.
          </li>
          <li>
            <strong>Media ja urheilu:</strong> lehtien numerointi, tv-kausien
            ohjelmakartat, urheilun kilpailukaudet.
          </li>
        </ul>

        <h2>Viikkonumeron kirjoitusasu suomeksi</h2>
        <p>
          Suomessa viikkonumero kirjoitetaan yleensä lyhennettynä muodossa{" "}
          <code>vk 30</code> tai <code>vko 30</code>. Molemmat ovat käytössä, ja
          »vk» on yleisin ammattikirjoituksessa. Täyspitkä muoto on »viikko 30».
          Vuosi voidaan lisätä kauttaviivalla tai pilkulla: »viikko 30/2026» tai
          »viikko 30, 2026». ISO 8601:n virallinen muoto <code>2026-W30</code> on
          käytössä ohjelmistoissa ja kansainvälisessä viestinnässä.
        </p>

        <h2>Miksi viikkonumero eroaa maittain?</h2>
        <p>
          ISO 8601 on kansainvälinen standardi, mutta sen soveltaminen vaihtelee.
        </p>
        <ul>
          <li>
            <strong>Suomi, muu Eurooppa</strong> ja kansainvälinen liike-elämä
            käyttävät ISO 8601:n mukaista viikkoa: alkaa maanantaista, viikko 1
            sisältää ensimmäisen torstain. Saksassa käytetään termiä{" "}
            <em>Kalenderwoche</em>, Ranskassa{" "}
            <em>numéro de semaine</em>.
          </li>
          <li>
            <strong>Yhdysvallat ja Kanada</strong> käyttävät yleensä omaa
            käytäntöään, jossa viikko alkaa sunnuntaista ja viikko 1 sisältää 1.
            tammikuuta. Sama päivä saattaa siis kuulua eri viikkonumeroon
            Yhdysvaltain ja ISO-viikon välillä. Katso oikeilla päivämäärillä
            laskettu{" "}
            <Link to="/suomi-vs-usa-viikkonumerot">
              vertailu Suomen ja Yhdysvaltain viikkonumeroista
            </Link>
            .
          </li>
          <li>
            <strong>Lähi-itä</strong> — osassa maita työviikko alkaa sunnuntaista
            tai lauantaista, mutta ISO-viikkonumeroa käytetään silti
            liike-elämässä.
          </li>
        </ul>

        <h2>ISO 8601 -standardin tausta</h2>
        <p>
          ISO 8601 julkaistiin ensimmäisen kerran <strong>vuonna 1988</strong>.
          Sitä on päivitetty vuosina 1991, 2000, 2004 ja 2019. Standardin tavoite
          oli poistaa kansallisten päiväysmerkintöjen aiheuttamat sekaannukset —
          esimerkiksi merkintä »03/04/05» tarkoittaa Yhdysvalloissa 4.
          maaliskuuta 2005, Euroopassa 3. huhtikuuta 2005 ja Japanissa 5.
          huhtikuuta 2003. ISO 8601:n <code>2005-04-03</code> on yksiselitteinen
          kaikkialla.
        </p>
        <p>
          Standardi kattaa päivämäärät, ajat, aikavälit ja niiden yhdistelmät.
          Viikkonumerot ovat yksi osa standardia, määritelty pykälässä 3.2.4.
          Tarkempi selostus:{" "}
          <a
            href="https://fi.wikipedia.org/wiki/ISO_8601"
            target="_blank"
            rel="noopener noreferrer"
          >
            ISO 8601 Wikipediassa
          </a>
          .
        </p>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          {pageConfidenceTier(Y_NOW) === CONFIDENCE.CONFIRMED && (
            <Link className="ql" to={`/koululomat-${Y_NOW}`}>
              <b>Koululomat {Y_NOW}</b>
              <span>Hiihto- ja syyslomat alueittain</span>
            </Link>
          )}
          <Link className="ql" to="/viikko-alkaa-maanantaista">
            <b>Miksi viikko alkaa maanantaista?</b>
            <span>Viikon alku ja torstaisääntö selitettynä</span>
          </Link>
          <Link className="ql" to="/suomi-vs-usa-viikkonumerot">
            <b>Suomi vs. USA</b>
            <span>Miksi viikkonumero eroaa — oikeat esimerkit</span>
          </Link>
          <Link className="ql" to={`/vuosi-${Y_NOW}`}>
            <b>Vuoden {Y_NOW} viikot</b>
            <span>Kaikki viikkonumerot päivämäärineen</span>
          </Link>
          <Link className="ql" to={`/kalenteri-${Y_NOW}`}>
            <b>Vuoden {Y_NOW} kalenteri</b>
            <span>Viikot ja juhlapäivät yhdellä sivulla</span>
          </Link>
          <Link className="ql" to="/kuinka-monta-viikkoa-vuodessa">
            <b>Kuinka monta viikkoa vuodessa on?</b>
            <span>52 vai 53 viikkoa — näin se ratkeaa</span>
          </Link>
          <Link className="ql" to={`/tulosta-${Y_NOW}`}>
            <b>Tulostettava viikkolista</b>
            <span>Kaikki ISO-viikot riveittäin</span>
          </Link>
          <Link className="ql" to="/ukk">
            <b>Usein kysytyt kysymykset</b>
            <span>Vastauksia viikkonumeroista</span>
          </Link>
        </div>

        <h2>Usein kysytyt kysymykset</h2>

        {whatWeekFaqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}

        <p style={{ marginTop: 32 }}>
          <Link className="btn" to={`/vuosi-${Y_NOW}`}>
            Katso kaikki vuoden {Y_NOW} viikot →
          </Link>
        </p>
      </div>
    </section>
  );
};

export default WhatWeek;
