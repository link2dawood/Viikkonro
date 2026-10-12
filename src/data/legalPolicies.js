// Refund policy selected and consumer-rights guidance checked 2026-10-12.
export const LEGAL_UPDATED = "2026-10-12";
export const REFUND_PATH = "/palautusehdot";
export const LEGAL_PATHS = ["/tietoa-meista","/tietosuoja","/kayttoehdot",REFUND_PATH];
// Confirmed public contact details. A postal address was explicitly declined.
export const LEGAL_OPERATOR = Object.freeze({
  legalName:"Dawood Zafar", registered:false, email:"hi@viikkonro.fi",
  website:"https://dawoodzafar.us", whatsapp:"+9230633301114",
});
export const UNUSED_REFUND_TEXT = "Tarjoamme yrityskalenterin käyttämättömälle ostokselle 14 päivän palautusoikeuden ostamisesta. Ilmoita peruuttamisesta määräajan sisällä. Ostos on käyttämätön, jos sillä ei ole ladattu maksullista PDF-, XLSX-, CSV- tai ICS-kalenteritiedostoa. Maksuttoman esikatselun käyttäminen tai luonnoksen muokkaaminen ei poista tätä palautusoikeutta.";
export const LEGAL_SOURCES = [
  {name:"KKV: peruuttamisoikeus verkkokaupassa",url:"https://www.kkv.fi/kuluttaja-asiat/verkkokauppa/peruuttamisoikeus-verkkokaupassa/"},
  {name:"KKV: maksun palauttaminen",url:"https://www.kkv.fi/kuluttaja-asiat/verkkokauppa/maksun-palauttaminen-kun-perut-verkkokauppaostoksen/"},
  {name:"Polar: ostajan ehdot",url:"https://polar.sh/legal/checkout-buyer-terms"},
];
export function refundFaqs() {
  return [
    {q:"Onko yrityskalenteri jatkuva tilaus?",a:"Ei. Yrityskalenterin kertamaksu avaa yhden valitun kalenterivuoden lataukset vuoden loppuun Suomen ajassa. Ostos ei uusiudu automaattisesti."},
    {q:"Milloin käyttämättömän ostoksen voi palauttaa?",a:"Käyttämättömän yrityskalenteriostoksen voi perua ilmoittamalla siitä 14 päivän sisällä ostamisesta. Käyttämättömällä tarkoitetaan, ettei ostoksella ole ladattu maksullista kalenteritiedostoa. Maksuton esikatselu ja luonnoksen muokkaaminen ovat sallittuja. Tämä vapaaehtoinen ehto ei rajoita kuluttajan pakottavia oikeuksia tai virheen perusteella saatavaa hyvitystä."},
    {q:"Poistaako lataaminen kuluttajan peruuttamisoikeuden?",a:"Lataaminen yksin ei poista lakisääteistä peruuttamisoikeutta. Digitaaliseen sisältöön liittyvä poikkeus edellyttää lain mukaisia tietoja ja nimenomaista suostumusta. Näillä ehdoilla ei vaadita tällaisesta oikeudesta luopumista."},
    {q:"Onko peruuttamisilmoitus sama kuin maksun palautus?",a:"Ei. Ilmoituksen vastaanottamisesta lähetetään sähköpostivahvistus. Asiakaspalvelu käsittelee pyynnön, ja hyväksytyn maksun palautuksen toteuttaa Polar alkuperäiselle maksutavalle."},
    {q:"Mitä täysi maksun palautus tekee latausoikeudelle?",a:"Täysi palautus poistaa kyseisen ostoksen latausoikeuden, kun Polar on vahvistanut palautuksen. Pelkkä peruuttamisilmoitus ei automaattisesti muuta maksua tai käyttöoikeuksia."},
  ];
}
