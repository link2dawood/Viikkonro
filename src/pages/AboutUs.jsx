import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import SocialLinks from "../components/SocialLinks";
import { LegalNavigation, LegalOperator, LegalUpdated } from "../components/LegalContact.jsx";
import { canonicalFor, routeMeta } from "../data/seo";

export default function AboutUs() {
  return <section className="app">
    <SEO {...routeMeta["/tietoa-meista"]} canonical={canonicalFor("/tietoa-meista")} />
    <div className="breadcrumb"><Link to="/">Etusivu</Link> / Tietoa meistä</div>
    <h1>Tietoa Viikkonrosta</h1>
    <p className="lead">Viikkonro.fi auttaa tarkistamaan viikkonumeron, löytämään kalenterin ja suunnittelemaan arjen tai yrityksen aikatauluja suomeksi.</p>
    <LegalUpdated />
    <div className="prose">
      <h2>Maksuttomat kalenterit ja laskurit</h2>
      <p>Voit tarkistaa ISO-viikkonumerot, Suomen pyhäpäivät ja työpäivät sekä ladata tavalliset tulostettavat kalenterit ilman käyttäjätiliä. <Link to="/laskurit">Työkaluhakemisto</Link> kokoaa laskurit ja suunnittelutyökalut käyttötarkoituksen mukaan.</p>
      <h2>Yrityksen suunnitteluun</h2>
      <p><Link to="/yrityskalenteri">Viikkonro Yrityskalenteri</Link> yhdistää yrityksen omat merkinnät, logon, sulkupäivät ja palkkapäivät samaan kalenteriin. Esikatselu on maksuton. Valitun kalenterivuoden PDF-, Excel-, CSV- ja ICS-lataukset avataan kertamaksulla, jonka hinta näytetään ennen ostoa.</p>
      <p>Yrityskalenterin ostoon ei tarvita tiliä. Tiimin ja usean yrityksen yksityiset suunnitelmat ovat erillisiä kirjautumista ja käyttöoikeuksia edellyttäviä toimintoja. Kaikki suunnittelutuotteet eivät ole maksullisessa myynnissä, eikä yhden tuotteen ostos automaattisesti avaa muita tuotteita.</p>
      <h2>Mihin tiedot ja laskenta perustuvat?</h2>
      <p>Viikkonumerot perustuvat ISO-viikkoihin. <Link to="/tietolahteet">Tietolähteet</Link> kertovat aineistojen alkuperästä ja kattavuudesta. <Link to="/menetelma">Menetelmä</Link> selittää laskennan, ja <Link to="/toimitusperiaatteet">toimitusperiaatteet</Link> kuvaavat sisällön tarkistamista.</p>
      <p>Työpäivien laskenta, viisipäiväisen työviikon lomasuunnittelu ja vuosilomalain mukainen lomapäivien kuluminen ovat erillisiä laskentatapoja. HR- ja suunnittelutyökalut eivät takaa työehtosopimuksen, työnantajan käytännön tai lakisääteisten velvoitteiden täyttymistä.</p>
      <h2>Ylläpito, palaute ja virheiden korjaaminen</h2>
      <p>Jos huomaat virheen, kerro sivun osoite, päivämäärä ja odottamasi tulos. Älä lähetä salasanaa, yksityistä ostotunnusta tai työntekijöiden arkaluonteisia tietoja.</p>
      <LegalOperator />
      <h2>Muut tavat käyttää Viikkonroa</h2>
      <p>Viikkonrosta on myös <Link to="/android-sovellus">Android-sovellus</Link> ja <Link to="/chrome-extension">Chrome-laajennus</Link>. Kehittäjille on <Link to="/avoin-data">avoimia kalenteriaineistoja</Link> ja verkkosivuille <Link to="/upota-viikkonumero">upotettava viikkonumero ja kalenteri</Link>.</p>
      <SocialLinks />
    </div><LegalNavigation />
  </section>;
}
