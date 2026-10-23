import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { LegalNavigation, LegalOperator, LegalUpdated } from "../components/LegalContact.jsx";
import { canonicalFor, routeMeta } from "../data/seo";
import { REFUND_PATH } from "../data/legalPolicies.js";

export default function TermsAndConditions() {
  return <section className="app">
    <SEO {...routeMeta["/kayttoehdot"]} canonical={canonicalFor("/kayttoehdot")} />
    <div className="breadcrumb"><Link to="/">Etusivu</Link> / Käyttö- ja ostoehdot</div>
    <h1>Käyttö- ja ostoehdot</h1><LegalUpdated />
    <div className="prose">
      <h2>1. Palvelu ja yhteystiedot</h2>
      <p>Nämä ehdot koskevat Viikkonro.fi:n kalentereita, laskureita, suunnittelutyökaluja ja verkkosivustolta ostettavia digitaalisia latausoikeuksia. Tuotteen sivulla ja maksusivulla kerrotaan ostoksen sisältö ennen maksamista. Esikatselu ei itsessään ole tilaus.</p>
      <LegalOperator />
      <p>Polar Software, Inc. toimii Polar-maksujen myyjänä ja jälleenmyyjänä (Merchant of Record). Maksamiseen sovelletaan myös <a href="https://polar.sh/legal/checkout-buyer-terms">Polarin ostajan ehtoja</a>. Viikkonro vastaa oman tuotteensa toiminnasta ja näissä ehdoissa kuvatusta käyttöoikeudesta.</p>
      <h2>2. Maksuttomat työkalut ja laskennan rajaukset</h2>
      <p>Maksuttomien kalenterien ja laskurien käyttö ei edellytä ostoa. Valitse oikea vuosi, ajanjakso ja päivän laskentasääntö. Työpäivät, suunnittelun lomapäivät ja vuosilomalain lomapäivät eivät ole sama asia. Koululomat ja yrityksen määräpäivät voivat riippua alueesta, työnantajasta tai sopimuksesta.</p>
      <p>Tarkista tärkeät aikataulut alkuperäisestä lähteestä. Laskurit eivät korvaa yksilöllistä oikeudellista, palkanlaskennan tai terveydenhuollon neuvontaa. Virheistä voi ilmoittaa asiakaspalveluun.</p>
      <h2>3. Yrityskalenterin kertamaksu ja toimitus</h2>
      <p>Ostos avaa yhden valitun kalenterivuoden PDF-, XLSX-, CSV- ja ICS-lataukset sekä yrityksen logon ja omat merkinnät valmiisiin tiedostoihin. Latausoikeus on voimassa maksun vahvistamisesta valitun vuoden loppuun Europe/Helsinki-ajassa. Ostos ei uusiudu, eikä siitä synny jatkuvaa tilausta.</p>
      <p>Hinta ilmoitetaan euroina ostopainikkeen yhteydessä. Polar näyttää lopullisen maksettavan summan ja verot ennen maksun hyväksymistä. Uusi hinta ei muuta aikaisemman ostoksen sovittua hintaa.</p>
      <p>Lataukset avautuvat, kun palvelin on varmistanut maksun Polarilta. Pelkkä paluu maksusivulta ei ole maksuvahvistus. Virallinen lasku tai ostovahvistus toimitetaan Polarin kautta. Viikkonro voi lisäksi lähettää laskun sähköpostitse. Ongelmatilanteessa ilmoita Polarin tilaustunniste ja ostossa käyttämäsi sähköpostiosoite.</p>
      <p>Säilytä kalenteriluonnos ja yksityinen ostotunnus erikseen. Ostotunnus palauttaa latausoikeuden toiseen selaimeen voimassaoloajan sisällä, mutta ei palauta kalenteriluonnosta. Älä jaa ostotunnusta tai sijoita sitä julkiseen URL-osoitteeseen.</p>
      <h2>4. Kalenteritiedostojen käyttö ja omat aineistot</h2>
      <p>Voit käyttää ostoksella tekemiäsi kalentereita yrityksesi toiminnassa, tulostaa niitä ja jakaa niitä työyhteisössäsi. Ladattuja tiedostoja voi säilyttää ja käyttää myös latausoikeuden voimassaolon jälkeen. Ostos ei sisällä alustapalvelun jälleenmyyntioikeutta tai jatkuvasti päivittyvää yksityistä ICS-tilausta.</p>
      <p>Vastaat oikeudestasi käyttää lisäämiäsi logoja, nimiä ja muita aineistoja. Niiden omistus ei siirry Viikkonrolle. Älä lisää muiden henkilötietoja ilman asianmukaista perustetta.</p>
      <p>Projektin julkaistu lähdekoodi on <a href="https://github.com/link2dawood/Viikkonro/blob/main/LICENSE">MIT-lisensoitu</a>. Aineistoilla, fonteilla, logoilla ja kolmansien osapuolten sisällöllä voi olla omat lisenssinsä ja lähdemainintavaatimuksensa. Nämä ehdot eivät poista erikseen myönnettyjä avoimen lähdekoodin oikeuksia.</p>
      <h2>5. Yksityiset organisaatiot ja käyttäjätilit</h2>
      <p>Yksityinen suunnittelutila edellyttää kirjautumista ja organisaation myöntämää käyttöoikeutta. Organisaation omistaja ja hallinnoijat vastaavat käyttöoikeuksien sekä tallentamiensa tietojen asianmukaisuudesta. Asiakasyrityksen oikeus ei anna pääsyä muiden asiakasyritysten kalentereihin.</p>
      <p>Huolehdi tunnustesi turvallisuudesta ja kirjaudu ulos yhteiskäyttöisellä laitteella. Älä ohita käyttöoikeuksia, kuormita palvelua kohtuuttomasti tai käytä rajapintoja vastoin niiden dokumentoituja rajoja. Yrityskalenterin ostos ei automaattisesti avaa muita tuotteita.</p>
      <h2>6. Peruutukset, palautukset ja virheet</h2>
      <p><Link to={REFUND_PATH}>Palautus- ja peruutusehdot</Link> kuvaavat peruuttamisen, palautukset ja virhetilanteiden käsittelyn. Kuluttajan pakottavia oikeuksia ei rajoiteta. Lataaminen ei yksin tarkoita peruuttamisoikeudesta luopumista.</p>
      <p>Täysi Polarissa vahvistettu palautus poistaa kyseisen ostoksen latausoikeuden. Osittainen palautus ei automaattisesti poista sitä. Palautuksen jälkeen maksullisen käyttöoikeuden käyttö lopetetaan sovitun palautuksen laajuudessa.</p>
      <h2>7. Mainonta maksuttomilla sivuilla</h2>
      <p>Maksuttomien kalenterien, laskurien ja hakemistosivujen ylläpito rahoitetaan osittain mainonnalla. Sivuston maksuttomilla sisältösivuilla näytetään Google AdSense -mainoksia. Mainoksia ei näytetä kirjautumisen takana olevassa yksityisessä suunnittelutilassa, upotettavassa kalenterivimpaimessa eikä maksullisissa ladattavissa tiedostoissa.</p>
      <p>Mainokset ovat kolmansien osapuolten sisältöä. Viikkonro ei valitse yksittäisiä mainoksia, ei vastaa niiden sisällöstä, tarjouksista tai kohdesivustoista eikä ole osapuoli mainostajan kanssa tehdyssä sopimuksessa. Tarkista mainostajan ehdot aina mainostajan omalta sivustolta. Sopimattomasta tai harhaanjohtavasta mainoksesta voi ilmoittaa asiakaspalveluun tai suoraan Googlelle.</p>
      <p>Mainonnan suostumus pyydetään Googlen sertifioidussa suostumuksenhallintapalvelussa, ja valinnan voi myöhemmin muuttaa. Mainosvalinta ei rajoita maksuttomien työkalujen käyttöä, ja mainosten estotoiminnon käyttäminen on sallittua. <Link to="/tietosuoja">Tietosuojaseloste</Link> kuvaa mainonnassa käsiteltävät tiedot.</p>
      <p>Mainosnäyttöjä tai napsautuksia ei saa tuottaa keinotekoisesti. Oman tai toisen puolesta tehty mainosten napsauttaminen, kehottaminen napsauttamaan, automatisoitu sivulataus tai mainosten peittäminen, muokkaaminen ja uudelleenjulkaisu on kiellettyä ja rikkoo myös Googlen julkaisijaehtoja. Tällainen käyttö voi johtaa käytön estämiseen.</p>
      <h2>8. Vastuu, saatavuus ja ehtojen muutokset</h2>
      <p>Palvelussa voi olla virheitä tai huoltokatkoja. Pyrimme selvittämään ilmoitetut ongelmat ja korjaamaan tuotteen virheet. Emme lupaa, että työkalut sopivat jokaiseen työehtosopimukseen tai käyttötarkoitukseen. Tämä ei poista kuluttajan oikeutta virheen korjaamiseen tai muuhun lain mukaiseen hyvitykseen.</p>
      <p>Vastuuta ei rajoiteta siltä osin kuin sovellettava laki estää rajoituksen. Uudet ehdot julkaistaan päivämäärineen. Aikaisemmin maksetun ostoksen olennaisia ehtoja tai pakottavia oikeuksia ei heikennetä pelkästään muuttamalla tätä sivua.</p>
      <p><Link to="/tietosuoja">Tietosuojaseloste</Link> kertoo henkilötietojen käsittelystä. Yritämme ratkaista erimielisyydet ensin asiakaspalvelussa. Suomessa asuva kuluttaja voi ottaa yhteyttä <a href="https://www.kkv.fi/kuluttaja-asiat/kuluttajaneuvonta/">kuluttajaneuvontaan</a>. Sovellettavan lain mukaisia oikeussuojakeinoja ei suljeta pois.</p>
    </div><LegalNavigation />
  </section>;
}
