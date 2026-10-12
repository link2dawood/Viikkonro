import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { LegalNavigation, LegalOperator, LegalUpdated } from "../components/LegalContact.jsx";
import WithdrawalForm from "../components/WithdrawalForm.jsx";
import { REFUND_PATH, UNUSED_REFUND_TEXT, LEGAL_SOURCES, refundFaqs } from "../data/legalPolicies.js";
import { canonicalFor, routeMeta } from "../data/seo";

export default function RefundPolicy() {
  return <section className="app">
    <SEO {...routeMeta[REFUND_PATH]} canonical={canonicalFor(REFUND_PATH)} />
    <div className="breadcrumb"><Link to="/">Etusivu</Link> / Palautus- ja peruutusehdot</div>
    <h1>Palautus- ja peruutusehdot</h1><LegalUpdated />
    <p className="lead">Ohjeet yrityskalenterin ostoksen peruuttamiseen, maksun palauttamiseen ja virhetilanteiden selvittämiseen.</p>
    <div className="prose">
      <h2>Mitä ostosta ehdot koskevat?</h2>
      <p>Ehdot koskevat Viikkonro Yrityskalenterin kertamaksua, joka avaa yhden valitun kalenterivuoden lataukset. Se ei ole jatkuva tilaus. Maksuttomiin kalentereihin ei liity maksettua summaa tai palautusta. Mahdollisen muun maksullisen tuotteen ehdot ilmoitetaan erikseen ennen sen ostamista.</p>
      <h2>Kuluttajan peruuttamisoikeus</h2>
      <p>Kun ostat kuluttajana, digitaalista sisältöä koskeva lakisääteinen peruuttamisaika on lähtökohtaisesti 14 päivää sopimuksen tekemisestä. Peruuttamisesta on ilmoitettava määräajassa, mutta syytä ei tarvitse kertoa. Nämä ehdot eivät rajoita lain mukaista pidempää aikaa tai muita pakottavia oikeuksia.</p>
      <p>Pelkkä tiedoston lataaminen tai ostopainikkeen painaminen ei yksin poista tätä oikeutta. Digitaalisen sisällön peruuttamisoikeuden menettäminen edellyttää laissa määrättyjä ennakkotietoja, nimenomaista suostumusta toimittamisen aloittamiseen ja oikeuden menettämisen hyväksymistä. Viikkonro ei näissä ehdoissa edellytä tällaista luopumista.</p>
      <h2>Käyttämättömän ostoksen palautus</h2>
      <p>{UNUSED_REFUND_TEXT}</p>
      <p>Kerro asiakaspalvelulle, oletko ladannut ostoksella maksullisia tiedostoja. Käsittelemme pyynnön ostoksen tietojen ja antamasi selvityksen perusteella. Epäonnistunut lataus tai virheellinen tiedosto käsitellään virhetilanteena.</p>
      <p>Yritysten väliseen ostoon ei sovelleta kuluttajan lakisääteistä 14 päivän peruuttamisoikeutta. Edellä kuvattu käyttämättömän ostoksen palautus on Viikkonron vapaaehtoinen ehto. Käytetyn ostoksen tai yli 14 päivän jälkeen tehdyn pyynnön mahdollinen hyvitys arvioidaan tuotteen virheen, sovittujen ehtojen ja sovellettavan lain perusteella.</p>
      <p>Käyttämättömyyttä koskeva ehto ei rajoita kuluttajan pakottavia oikeuksia. Kuluttajan peruuttamisoikeus voi olla voimassa myös lataamisen jälkeen, kuten edellä on kuvattu. Virheeseen perustuva hyvitys käsitellään erikseen käyttämättömyydestä riippumatta.</p>
      <h2>Palautuksen toteuttaminen ja latausoikeus</h2>
      <p>Polar toimii maksun myyjänä ja toteuttaa hyväksytyn palautuksen alkuperäiselle maksutavalle. Kuluttajan lain mukainen peruuttamispalautus tehdään ilman aiheetonta viivytystä ja viimeistään 14 päivän kuluessa peruuttamisilmoituksen vastaanottamisesta. Pankin tai maksutavan käsittely vaikuttaa siihen, milloin summa näkyy tilillä.</p>
      <p>Lakisääteisestä peruuttamispalautuksesta ei vähennetä käsittely- tai maksupalvelumaksua. Täysi vahvistettu palautus poistaa ostoksen latausoikeuden. Palautetulla ostoksella saadun maksullisen käyttöoikeuden käyttö lopetetaan palautuksen laajuudessa. Pelkkä ilmoitus ei automaattisesti muuta maksua tai latausoikeutta.</p>
      <h2>Jos tuote ei toimi tai maksu on veloitettu kahdesti</h2>
      <p>Ota yhteyttä ja kuvaa ongelma. Kerro käytetty selain, ostoksen ajankohta ja Polarin tilaustunniste. Älä lähetä korttitietoja, salasanaa tai yksityistä ostotunnusta. Pyrimme korjaamaan toimitus- tai tiedostovirheen. Jos korjaus ei onnistu, mahdollinen hinnanalennus, sopimuksen purku tai palautus käsitellään sovellettavien oikeuksien mukaan.</p>
      <p>Virheestä ilmoittamista ei rajata pelkästään 14 päivän peruuttamisaikaan. Jos epäilet päällekkäistä veloitusta, ilmoita molempien tilausten tunnisteet. Maksun palautusta koskevan vaatimuksen voi osoittaa myös Polarille sen ostovahvistuksessa annettujen yhteystietojen kautta.</p>
      <h2>Peruuttamisilmoituksen malli</h2>
      <p>Voit käyttää seuraavaa tekstiä sähköpostissa. Mallin käyttö ei ole pakollista.</p>
      <blockquote><p>Ilmoitan peruuttavani Viikkonro Yrityskalenterin ostoksen. Tilauspäivä: [päivä]. Tilaustunniste tai muut tunnistetiedot: [tiedot]. Ostajan nimi: [nimi]. Ostajan osoite: [osoite]. Sähköpostiosoite vahvistusta varten: [sähköposti]. Ilmoituksen päiväys: [päivä]. Allekirjoitus vain paperilla lähetettävässä ilmoituksessa.</p></blockquote>
      <LegalOperator />
    </div>
    <WithdrawalForm />
    <div className="prose"><h2>Usein kysyttyä palautuksista</h2>{refundFaqs().map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
      <h2>Ohjeiden lähteet</h2><ul>{LEGAL_SOURCES.map(source=><li key={source.url}><a href={source.url}>{source.name}</a></li>)}</ul>
    </div><LegalNavigation />
  </section>;
}
