import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import { openConsentSettings } from "../consent";
import { LegalNavigation, LegalOperator, LegalUpdated } from "../components/LegalContact.jsx";

const PrivacyPolicy = () => {
  const meta = routeMeta["/tietosuoja"];
  return (
    <>
      <section className="app">
        <SEO title={meta.title} description={meta.description} canonical={canonicalFor("/tietosuoja")} />
        <div className="breadcrumb">
          <Link to="/">Etusivu</Link> / Tietosuojaseloste
        </div>
        <h1>Tietosuojaseloste</h1>
        <LegalUpdated />
        <p className="lead">Tässä kerrotaan, mitä tietoja Viikkonron maksuttomat työkalut, yrityskalenterin ostaminen ja yksityiset suunnittelutilat käsittelevät. Android-sovelluksen käsittely on kuvattu erikseen.</p>
        <h2>Rekisterinpitäjä ja yhteydenotto</h2>
        <LegalOperator />
        <div className="prose"><p>Viikkonron ylläpitäjä vastaa palvelun asiakas-, osto- ja yhteydenottotietojen käsittelystä. Organisaatio vastaa työntekijöidensä suunnittelutietojen käyttötarkoituksesta ja asianmukaisuudesta. Polar käsittelee maksamisen tietoja myös omien myyjän velvollisuuksiensa perusteella; sen rooli on erillinen Viikkonron roolista.</p></div>

        <h2>Verkkosivustolla käsiteltävät tiedot</h2>
        <div className="prose">
          <p>
            <strong>Tekniset tiedot:</strong> Vercel ja Cloudflare käsittelevät
            verkkopyynnön toimittamiseen ja suojaamiseen tarvittavia tietoja,
            kuten IP-osoitetta, pyydettyä osoitetta, ajankohtaa sekä selaimen
            ja verkkoyhteyden teknisiä tietoja. Kalenterien sisältöä ei ole
            tarkoitettu palvelulokeihin.
          </p>
          <p><strong>Virheenseuranta:</strong> Sentry vastaanottaa verkkosivun ohjelmavirheiden tyypin ja JavaScript-tiedoston rivitietoja vian selvittämiseksi. Raportista poistetaan lomakesisältö, alkuperäinen virheviesti, käyttäjätiedot, pyyntöjen sisältö ja osoitteiden hakuehdot. Sentry käsittelee tiedonsiirrossa myös teknisiä yhteystietoja, kuten IP-osoitetta. Yksityinen suunnittelutila ei käytä tätä verkkosivun virheenseurantaa.</p>
          <p>
            <strong>Paikallinen tallennus:</strong> Yhteydenottolomakkeen
            väärinkäytön estävä lähetysrajoitus tallentaa selaimen{" "}
            <code>localStorage</code>-muistiin vain lähetysaikoja. Laskureiden
            käyttämiseen ei tarvita mainos- tai analytiikkaevästeitä, ja
            mainosevästeiden hylkääminen ei rajoita työkalujen käyttöä.
            Evästevalintasi tallennetaan selaimen <code>localStorage</code>
            -muistiin avaimella <code>viikkonro-consent</code>, jotta sitä ei
            kysytä jokaisella sivulla. Valinta ohjaa Claritylle lähetettäviä
            suostumussignaaleja, jotka kuvataan jäljempänä.
          </p>
          <p>
            <strong>Käyttöanalytiikka:</strong> Microsoft Clarity voi käsitellä
            sivulatauksiin, laitteeseen, selaimeen sekä sivulla tehtyihin
            napsautuksiin, vierityksiin ja hiiren liikkeisiin liittyviä tietoja
            lämpökarttojen, käyttötietojen ja istuntotallenteiden tuottamiseksi.
            Lomakekenttien sisältö peitetään Clarity-tallenteissa.
          </p>
          <p>
            <strong>Yhteydenottolomake:</strong> Jos lähetät viestin, nimi,
            sähköpostiosoite ja viestin sisältö välitetään Web3Forms-palvelulle
            viestin toimittamista varten.
          </p>
        </div>

        <h2>Yrityskalenterin ostaminen</h2>
        <div className="prose">
          <p>Yrityskalenterin luonnos ja esikatselu tallentuvat vain selaimeesi. Maksullista tiedostoa luotaessa yrityksen nimi, merkinnät ja logo lähetetään HTTPS-yhteydellä palvelimelle tiedoston tekemistä varten. Kalenterin sisältöä ei tallenneta tietokantaan eikä lähetetä maksupalvelulle tai analytiikkaan.</p>
          <p>Polar käsittelee maksamisen ja kuitit. Maksusivulla antamasi yhteys- ja laskutustiedot käsitellään Polarissa. Viikkonro ei käsittele maksukortin tietoja. Latausoikeus tarkistetaan Polarilta ostotunnisteen, tuotteen ja kalenterivuoden perusteella.</p>
          <p>Latausoikeutta varten selaimeen asetetaan välttämätön, suojattu ostoeväste. Voit myös tallentaa yksityisen ostotunnuksen latausoikeuden palauttamista varten. Väärinkäytön estämiseksi palvelin käyttää IP-osoitteesta päivittäin vaihtuvalla tiivisteellä muodostettua tunnistetta. Tiivisteen sisältävät rajoitusikkunat poistetaan seuraavien pyyntöjen yhteydessä, kun ne ovat yli vuorokauden vanhoja. Ostotunnuksia tai kalenteritietoja ei lähetetä analytiikkatapahtumiin.</p>
        </div>
        <h2>Sähköpostimuistutukset</h2>
        <div className="prose">
          <p>
            Jos tilaat viikoittaiset viikkonumero- ja pyhäpäivämuistutukset,
            sähköpostiosoitteesi sekä suostumusversion, tilauspyynnön ajan ja
            viestien kielen tiedot välitetään Brevo-palvelulle. Tilaus perustuu
            suostumukseesi ja vahvistetaan sähköpostilinkillä. Voit perua
            tilauksen jokaisen muistutusviestin peruutuslinkistä tai pyytää
            tietojesi poistamista <Link to="/ota-yhteytta">ottamalla yhteyttä</Link>.
            Tilauksen peruuttaminen ei vaikuta sivuston käyttöön.
          </p>
          <p>
            Tilaajatietoja käytetään muistutusten toimittamiseen tilauksen ajan.
            Peruutuksen jälkeen lähetysesto ja suostumuksen osoittamiseen
            tarvittavat tiedot voidaan säilyttää vain näiden tarkoitusten
            edellyttämän ajan. Brevon käsittelystä ja mahdollisista
            kansainvälisistä tiedonsiirroista kerrotaan sen{" "}
            <a href="https://www.brevo.com/legal/privacypolicy/" rel="external noopener">tietosuojakäytännössä</a>.
          </p>
          <p>
            Lomakkeen avaaminen lataa Cloudflare Turnstile -varmennuksen
            väärinkäytön estämiseksi. Cloudflare käsittelee tähän tarvittavia
            selain- ja verkkoyhteystietoja. Lisätietoja on{" "}
            <a href="https://www.cloudflare.com/privacypolicy/" rel="external noopener">Cloudflaren tietosuojakäytännössä</a>.
            Lomakkeen sulkeminen tai hyväksytty tilauspyyntö tallentaa selaimeen
            vain ajankohdan, jonka avulla pyyntö piilotetaan 30 päiväksi.
            Sähköpostiosoitetta ei tallenneta selaimen paikalliseen muistiin.
          </p>
        </div>

        <h2>Maksullisten tuotteiden ostot ja laskut</h2>
        <div className="prose">
          <p>Polar käsittelee maksun ja toimittaa virallisen laskun. Viikkonro ei vastaanota eikä tallenna maksukortin tietoja. Tallennamme Supabasen suojattuun asiakasrekisteriin ostajan sähköpostiosoitteen, annetun laskutusnimen ja -osoitteen, mahdollisen verotunnisteen sekä tilauksen, tuotteen, kalenterivuoden, maksun, verojen, palautusten ja laskun tiedot. Kalenterin sisältöä tai logoa ei tallenneta tähän rekisteriin.</p>
          <p>Tietoja käytetään ostoksen toteuttamiseen, laskujen toimittamiseen, asiakaspalveluun ja maksujen selvittämiseen. Mailjet toimittaa laskuviestin ostajalle ja piilokopion Viikkonron asiakaspalvelulle. Viesti ei sisällä markkinointia, eikä sen avauksia tai linkkien napsautuksia seurata.</p>
          <p>Ostotietoja säilytetään sopimuksen hoitamisen, maksuihin liittyvien selvitysten ja sovellettavien kirjanpitovelvoitteiden edellyttämän ajan. Rekisteri ei ole julkinen eikä organisaatioiden tai tavallisten käyttäjien luettavissa. Maksu- ja laskutuspalveluun osallistuvat Polar, Supabase, Vercel ja Mailjet.</p>
          <p>Suunnittelutuotteiden sähköpostimarkkinointi on erikseen valittava, vapaaehtoinen suostumus. Tallennamme suostumuksen sanamuodon version ja ajankohdan. Ostaminen ei edellytä suostumusta. Voit perua suostumuksen tai pyytää tietojesi tarkistamista osoitteesta <a href="mailto:hi@viikkonro.fi">hi@viikkonro.fi</a>. Peruminen ei poista tarpeellisia laskutustietoja.</p>
        </div>

        <h2>Yksityiset tilit, tiimit ja asiakasyritykset</h2>
        <div className="prose">
          <p>Kirjautumisen ja salasanojen palauttamisen hoitaa Supabase Auth. Sähköpostiosoite, käyttäjätunniste ja tunnistautumiseen tarvittavat tiedot käsitellään palvelun tarjoamiseksi. Salasanaa ei lähetetä Viikkonron analytiikkaan tai sähköpostiviestiin. Kirjautumisistuntoa käsitellään selaimen muistissa; yksityisen sovelluksen nykyinen toteutus ei säilytä istuntoa pysyvästi selaimen paikallisessa tallennuksessa.</p>
          <p>Organisaation asetukset, jäsenten nimet tai tunnisteet, osastot, roolit, poissaolojaksot, työvuorot, saatavuus ja niihin lisätyt muistiinpanot tallennetaan Supabasen yksityisiin organisaatiotietoihin. Asiakasyritysten kalenterimääritykset, käyttöoikeudet sekä ylläpitotoimien ja vientien historiat voivat sisältää käyttäjä- ja yritystunnisteita. Tietojen näkyvyys määräytyy organisaation ja asiakasyrityksen käyttöoikeuksien mukaan.</p>
          <p>Yksityiseen suunnittelutilaan ei ladata julkisen sivuston mainoksia tai Clarity-analytiikkaa. Organisaatiotietoja ei julkaista avoimessa kalenterirajapinnassa, widgetissä, hakukoneissa tai julkisessa ICS-osoitteessa. Älä tallenna diagnooseja, sairauden syitä tai tarpeettomia arkaluonteisia tietoja poissaolomuistiinpanoihin.</p>
          <p>Työntekijä voi pyytää organisaatiotietojensa tarkistamista tai poistamista ensin oman organisaationsa hallinnoijalta. Viikkonron asiakaspalvelu auttaa palvelun omaan käsittelyyn liittyvissä pyynnöissä. Organisaation tai tilin sulkeminen ei automaattisesti poista lakisääteisesti säilytettäviä osto- ja laskutustietoja.</p>
        </div>
        <h2>Peruuttamisilmoitukset ja asiakaspalvelu</h2>
        <div className="prose"><p>Peruuttamistoiminto käsittelee ilmoittajan nimen, ostossa käytetyn sähköpostiosoitteen, Polarin tilaustunnisteen ja ilmoituksen ajankohdan. Tilaus ja sähköpostiosoite tarkistetaan Polarilta. Mailjet toimittaa vastaanottovahvistuksen ostajalle ja kopion Viikkonron asiakaspalvelulle. Ilmoituksessa ei pyydetä korttitietoja, yksityistä ostotunnusta tai kalenterin sisältöä. Tietoja ei käytetä markkinointiin. Ilmoitusta ja asiakaspalveluviestejä säilytetään asian käsittelyn ja mahdollisten oikeudellisten vaateiden selvittämisen edellyttämän ajan.</p></div>
        <h2>Käsittelyn tarkoitukset ja perusteet</h2>
        <div className="prose"><ul>
          <li>Ostoksen toteuttaminen, latausoikeus, käyttäjätilin tarjoaminen ja asiakaspalvelu: sopimuksen täyttäminen tai pyynnöstäsi tehtävät sopimusta edeltävät toimet.</li>
          <li>Tarpeelliset laskutus- ja maksuselvitystiedot: sopimus ja sovellettavat lakisääteiset velvoitteet.</li>
          <li>Palvelun suojaaminen, väärinkäytön ehkäisy ja teknisten ongelmien selvittäminen: oikeutettu etu turvallisen palvelun ylläpitämiseen.</li>
          <li>Valinnaiset analytiikka- ja mainosevästeet, muistutusten tilaus ja erilliset markkinointiviestit: kyseiseen tarkoitukseen annettu suostumus. Suostumukset ovat toisistaan erillisiä. Mainonnan suostumuksen kerää Googlen suostumuksenhallintapalvelu, analytiikan suostumuksen sivuston oma evästebanneri.</li>
        </ul><p>Clarityn ennen evästevalintaa tapahtuva rajoitettu, evästeetön käsittely kuvataan jäljempänä. Palvelun kehittämisessä ja koottujen käyttötietojen arvioinnissa huomioidaan oikeutettu etu ja käyttäjän oikeus vastustaa käsittelyä. Pelkkä evästeiden hylkääminen ei tarkoita kaikkien teknisten verkkopyyntöjen estämistä.</p></div>
        <h2>Android-sovelluksessa käsiteltävät tiedot</h2>
        <div className="prose">
          <p>
            <strong>Paikalliset tiedot:</strong> Viikkonro-sovellus ei vaadi
            käyttäjätiliä eikä sisällä pilvisynkronointia. Kieli-, teema- ja
            muut sovellusasetukset, viikkokohtaiset muistiinpanot sekä widgetien
            valinnat tallennetaan paikallisesti laitteelle. Niitä ei lähetetä
            Viikkonron palvelimelle.
            Tiedot voi poistaa tyhjentämällä sovelluksen tiedot tai poistamalla
            sovelluksen.
          </p>
          <p>
            <strong>Google Analytics for Firebase:</strong> Android-sovellus
            kerää sovelluksen käyttöön liittyviä tietoja, kuten avattuja
            näkymiä, navigointia, sovelluksen version sekä laitteen ja
            käyttöjärjestelmän teknisiä tietoja. Tietoja käytetään koottuun
            käyttöanalyysiin ja sovelluksen parantamiseen.
          </p>
          <p>
            <strong>Firebase Crashlytics:</strong> Tuotantoversio voi lähettää
            kaatumisraportteja, virhelokeja, sovelluksen version sekä laitteen ja
            käyttöjärjestelmän teknisiä tietoja teknisten vikojen löytämiseksi
            ja korjaamiseksi.
          </p>
          <p>
            <strong>Google Mobile Ads ja suostumuksenhallinta:</strong>
            Android-sovelluksen etusivulla voidaan näyttää mainos. Google Mobile
            Ads SDK ja Googlen User Messaging Platform (UMP) voivat käsitellä
            mainostunnisteita, IP-osoitetta, laitteen teknisiä tietoja,
            mainosvuorovaikutuksia ja suostumusvalintoja mainosten näyttämiseen,
            rajoittamiseen, mittaamiseen ja käyttäjän valinnan perusteella
            personointiin. Kun Google edellyttää suostumusta, mainospalvelu
            alustetaan vasta UMP:n sallittua mainospyynnöt. Tietosuoja-asetuksiin
            voi palata sovelluksen asetuksista, kun Google edellyttää valinnan
            hallintaa.
          </p>
          <p>
            Sovellus ei pyydä sijainti-, yhteystieto-, kalenteri-, kamera- tai
            mikrofonioikeutta. Kalenteri- ja viikkotoiminnot toimivat
            sovellukseen pakatulla aineistolla myös ilman verkkoyhteyttä.
          </p>
        </div>

        <h2>Miten käytämme tietoja</h2>
        <div className="prose">
          <p>Käytämme keräämiämme tietoja seuraaviin tarkoituksiin:</p>
          <ul>
            <li>Verkkosivustomme tarjoaminen, ylläpito ja huolto.</li>
            <li>Alustamme työkalujen parantaminen, mukauttaminen ja laajentaminen.</li>
            <li>Sen ymmärtäminen ja analysointi, miten käytät verkkosivustoamme.</li>
            <li>Teknisten vikojen ja petollisen toiminnan seuranta ja estäminen.</li>
            <li>Android-sovelluksen kaatumisten diagnosointi ja korjaaminen.</li>
            <li>Mainosten näyttäminen ja mittaaminen käyttäjän suostumusvalintojen mukaisesti maksuttoman palvelun rahoittamiseksi.</li>
          </ul>
        </div>

        <h2>Google AdSense, Google Mobile Ads ja mainostunnisteet</h2>
        <div className="prose">
          <p>
            Sivuston maksuttomilla sisältösivuilla näytetään Google AdSense
            -mainoksia. Mainostulo rahoittaa maksuttomien kalenterien ja
            laskurien ylläpitoa. Google toimii kolmannen osapuolen
            mainostoimittajana ja voi käyttäjän valinnan mukaisesti käyttää
            evästeitä tai muuta selaimen paikallista tallennusta mainosten
            näyttämiseen, rajoittamiseen, mittaamiseen ja personointiin.
            Google käytti mainosevästeestään aiemmin nimeä
            <strong> DART-eväste</strong>; mainosevästeiden avulla mainoksia
            voidaan näyttää tällä ja muilla verkkosivustoilla tehtyjen
            vierailujen perusteella.
          </p>
          <p>
            Mainoksia ei ladata kirjautumisen takana olevaan yksityiseen
            suunnittelutilaan, upotettavaan kalenterivimpaimeen eikä
            404-sivulle. Mainospaikat ovat sisällön yhteydessä eivätkä
            laskurien syöttökentissä, laskennan tuloksissa, kalenteriruuduissa
            tai tulostettavassa aineistossa. Mainosten estoa käyttävä selain
            voi käyttää maksuttomia työkaluja tavalliseen tapaan.
          </p>
          <p>
            Mainonnan suostumuksen kerää Googlen sertifioitu
            suostumuksenhallintapalvelu (CMP), joka näytetään AdSensen
            mainosskriptin kautta. Valinta pyydetään EU:ssa, ETA-alueella,
            Isossa-Britanniassa ja Sveitsissä sekä muilla alueilla, joilla
            Google tai sovellettava laki sitä edellyttää. Valinnaiset
            mainosevästeet ja personoitu mainonta pidetään pois käytöstä,
            kunnes kävijä tekee valinnan. Valinnan voi myöhemmin muuttaa tai
            perua samasta Googlen suostumusviestistä sekä Googlen
            mainosasetuksista. Sivuston oma evästebanneri ja alaosan
            Evästeasetukset-linkki ohjaavat vain käyttöanalytiikkaa, eivät
            mainontaa. Mainosvalinnan hylkääminen ei estä kalenterien tai
            laskurien käyttöä.
          </p>
          <p>
            Mainosten näyttämiseen ja mittaamiseen voidaan käsitellä
            IP-osoitetta, selaimen ja laitteen teknisiä tietoja, mainosten
            näyttöjä ja napsautuksia sekä suostumussignaaleja. Googlen ja sen
            mainoskumppanien säilytysajat ja käsittelyperusteet määräytyvät
            niiden omien tietosuojakäytäntöjen sekä suostumusviestissä
            luetellun tarjoajaluettelon mukaan. Viikkonro ei lähetä
            mainospalveluille yhteydenottolomakkeen sisältöä, ostotunnuksia,
            laskutustietoja eikä yksityisen suunnittelutilan tietoja.
          </p>
          <p>
            Android-sovelluksessa mainonnan toteuttaa Google Mobile Ads.
            Sovellus pyytää Google UMP:n kautta suostumusvalinnan niillä alueilla,
            joilla Google tai sovellettava laki sitä edellyttää. Sovelluksen
            ydintoiminnot ovat käytettävissä valinnasta riippumatta.
          </p>
          <p>
            Lisätietoja:{" "}
            <a href="https://policies.google.com/technologies/ads" rel="external noopener">
              Googlen mainosevästeet
            </a>
            ,{" "}
            <a href="https://policies.google.com/technologies/partner-sites" rel="external noopener">
              miten Google käyttää kumppanisivustoilta saatuja tietoja
            </a>
            ,{" "}
            <a href="https://support.google.com/admanager/answer/9012903" rel="external noopener">
              Googlen mainosteknologian tarjoajat
            </a>{" "}
            ja{" "}
            <a href="https://myadcenter.google.com/" rel="external noopener">
              Googlen mainosasetukset
            </a>.
          </p>
        </div>

        <h2>Microsoft Clarity -käyttöanalytiikka</h2>
        <div className="prose">
          <p>
            Käytämme Microsoft Clarity -palvelua sivuston käytettävyyden,
            teknisten ongelmien ja käyttäjien vuorovaikutuksen ymmärtämiseen.
            Clarity tuottaa muun muassa koottuja käyttömittareita,
            lämpökarttoja ja istuntotallenteita. Tietoja ei käytetä
            laskureiden tulosten muuttamiseen eikä Clarity estä sivuston
            toimintoja.
          </p>
          <p>
            Claritylle välitetään ennen käyttäjän valintaa Consent API V2
            -signaalit <code>analytics_Storage: denied</code> ja{" "}
            <code>ad_Storage: denied</code>. Tällöin Clarity ei aseta
            analytiikka- tai mainosevästeitä ja toimii rajoitetussa
            evästeettömässä tilassa, jossa yksittäisiä sivulatauksia ja
            perusvuorovaikutuksia voidaan käsitellä ilman sivujen välille
            jatkuvaa evästeistuntoa. Sivuston evästebannerissa voit sallia
            analytiikkaevästeet, jolloin Claritylle välitetään{" "}
            <code>analytics_Storage: granted</code> ja Clarity voi tunnistaa
            palaavan selaimen. Mainosevästeet pysyvät tämän valinnan jälkeenkin
            estettyinä. Voit muuttaa tai perua valinnan milloin tahansa
            sivuston alaosan Evästeasetukset-linkistä tai alla olevasta
            painikkeesta; perumisen yhteydessä Clarityn evästeet poistetaan.
          </p>
          <p>
            <button type="button" className="btn" onClick={openConsentSettings}>
              Muuta evästeasetuksia
            </button>
          </p>
          <p>
            Lisätietoja siitä, miten Microsoft käsittelee ja suojaa tietoja, on{" "}
            <a
              href="https://privacy.microsoft.com/privacystatement"
              rel="external noopener"
            >
              Microsoftin tietosuojaselosteessa
            </a>
            .
          </p>
        </div>

        <h2>Tietojen vastaanottajat ja säilytys</h2>
        <div className="prose">
          <p>
            Palvelun tekniseen toimittamiseen osallistuvat Vercel ja Cloudflare.
            Yhteydenottoviestit käsittelee Web3Forms ja käyttöanalytiikkaa
            Microsoft Clarity. Maksuttomien sisältösivujen mainonnan toimittaa Google AdSense,
            ja Google sekä suostumusviestissä luetellut mainosteknologian
            tarjoajat voivat käsitellä mainonnan tietoja omien
            tietosuojakäytäntöjensä ja kävijän antaman valinnan mukaisesti.
            Emme myy henkilötietoja.
          </p>
          <p>Supabase käsittelee kirjautumis- ja yksityisiä organisaatiotietoja, Polar ostoksia ja maksamista, Mailjet tilaus- ja tunnistautumisviestejä ja Brevo tilattuja sähköpostimuistutuksia. Ostajan laskutus- tai kalenteritietoja ei myydä markkinointikäyttöön. Laskun kopion saa Viikkonron asiakaspalvelu asiakassuhteen hoitamista varten.</p>
          <p>Palveluntarjoajat voivat käsitellä tietoja EU:n tai ETA:n ulkopuolella. Siirron oikeusperusta ja suojatoimet määräytyvät käytettävän palvelun sopimusten ja sovellettavan tietosuojalainsäädännön mukaan, esimerkiksi riittävyyspäätöksen tai vakiosopimuslausekkeiden perusteella. Tämä seloste ei lupaa, että kaikki tietoja käsittelevät palvelut sijaitsevat Suomessa tai EU:ssa. Voit pyytää lisätietoja tietosuojayhteydestä.</p>
          <ul>
            <li><a href="https://supabase.com/privacy">Supabasen tietosuojakäytäntö</a></li>
            <li><a href="https://polar.sh/legal/privacy-policy">Polarin tietosuojakäytäntö</a></li>
            <li><a href="https://www.mailjet.com/legal/privacy-policy/">Mailjetin tietosuojakäytäntö</a></li>
            <li><a href="https://vercel.com/legal/privacy-policy">Vercelin tietosuojakäytäntö</a></li>
            <li><a href="https://sentry.io/privacy/">Sentryn tietosuojakäytäntö</a></li>
          </ul>
          <p>
            Android-sovelluksen analytiikan, kaatumisraportoinnin, mainonnan ja
            suostumuksenhallinnan teknisenä palveluntarjoajana toimii Google.
            Google voi käsitellä tietoja omien säilytysaikojensa ja
            tietosuojakäytäntöjensä mukaisesti. Lisätietoja on{" "}
            <a href="https://policies.google.com/privacy" rel="external noopener">
              Googlen tietosuojakäytännössä
            </a>
            .
          </p>
          <p>
            Palvelinlokeja säilytetään palveluntarjoajien omien
            säilytysaikojen mukaisesti. Yhteydenottoviestejä säilytetään vain
            niin kauan kuin asian käsittely sitä edellyttää. Paikallisia
            lähetysaikoja käytetään vain tunnin mittaisen lähetysrajan
            laskentaan; sitä vanhemmat merkinnät poistetaan seuraavan
            lomakekäytön yhteydessä. Tiedot voi poistaa myös tyhjentämällä
            selaimen sivustotiedot. Microsoftin ilmoituksen mukaan Clarityn
            istuntotallenteita säilytetään tavallisesti 30 päivää. Koottuja
            napsautus- ja lämpökarttatietoja sekä merkittyjä tai otantaan
            valittuja tallenteita voidaan säilyttää enintään yhdeksän kuukautta.
            Säilytys perustuu Microsoftin <a href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention">30.6.2026 päivitettyyn säilytysohjeeseen</a>.
          </p>
          <p>Tilin ja organisaation tiedot säilytetään palvelun käytön ja asian hoitamisen edellyttämän ajan. Tarpeettomien tietojen poistamista voi pyytää. Ostotietojen säilytys riippuu sopimuksen hoitamisesta, mahdollisista riidoista sekä ylläpitäjään ja maksun myyjään sovellettavista kirjanpito- ja muista lakisääteisistä velvoitteista. Suostumuksen peruminen estää myöhemmän suostumukseen perustuvan markkinoinnin, mutta ei poista tarpeellisia laskutustietoja tai lähetyseston osoittavaa tietoa.</p>
        </div>

        <h2>Oikeutesi ja suostumuksen peruuttaminen</h2>
        <div className="prose">
          <p>
            Sinulla on soveltuvan tietosuojalainsäädännön mukaisesti oikeus
            pyytää pääsyä henkilötietoihisi, niiden oikaisua tai poistamista,
            käsittelyn rajoittamista sekä vastustaa käsittelyä. Suostumukseen
            perustuvan käsittelyn voi perua milloin tahansa vaikuttamatta ennen
            peruuttamista tehdyn käsittelyn lainmukaisuuteen. Pyynnön voi tehdä{" "}
            <Link to="/ota-yhteytta">yhteydenottolomakkeella</Link>.
          </p>
          <p>
            Android-sovelluksen mainontaa koskevaa valintaa voi muuttaa
            sovelluksen asetusten tietosuoja-asetuksista, kun Google näyttää
            tämän vaihtoehdon. Paikalliset sovellustiedot voi poistaa Androidin
            sovelluksen tietojen hallinnasta tai poistamalla sovelluksen.
          </p>
        </div>
        <div className="prose"><p>Sinulla voi olla myös oikeus saada antamasi tiedot siirrettävässä muodossa, kun lain edellytykset täyttyvät. Voit tehdä valituksen toimivaltaiselle tietosuojaviranomaiselle, Suomessa <a href="https://tietosuoja.fi/">tietosuojavaltuutetun toimistolle</a>. Pyynnön yhteydessä voidaan tarvita riittävä henkilöllisyyden varmistus muiden henkilöiden tietojen suojaamiseksi. Älä lähetä salasanaasi tai maksukorttisi tietoja.</p></div>
        <LegalNavigation />
      </section>
    </>
  );
};

export default PrivacyPolicy;
