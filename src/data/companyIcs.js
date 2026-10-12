// Import/subscription guidance reviewed 2026-10-10 against the official sources below.
export const COMPANY_ICS_PATH = "/yrityskalenteri/ics";
export const COMPANY_ICS_UPDATED = "2026-10-10";
export const companyIcsMeta = {
  title: "Yrityksen ICS-kalenteri: Google ja Outlook | Viikko Nro",
  description: "Tee yrityksen ICS-kalenteri: pyhäpäivät, sulkupäivät, tapahtumat ja palkkapäivät. Tuo tiedosto Google-kalenteriin, Outlookiin tai Apple Kalenteriin.",
};
export const COMPANY_ICS_IMPORTS = [
  { app: "Google Kalenteri", url: "https://support.google.com/calendar/answer/37118", steps: [
    "Luo tietokoneen selaimessa erillinen kalenteri yrityksen päiville.",
    "Avaa asetuksista Tuo ja vie (Import & export). Valitse ladattu ICS-tiedosto.",
    "Valitse yrityksen kalenteri kohteeksi ja tuo tapahtumat. Tiedoston tuonti ei päivity automaattisesti.",
  ] },
  { app: "Outlook verkossa", url: "https://support.microsoft.com/en-us/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web", steps: [
    "Luo erillinen kalenteri yrityksen päiville ja avaa Lisää kalenteri (Add calendar).",
    "Valitse Lataa tiedostosta (Upload from file), selaa ladattuun ICS-tiedostoon ja valitse kohdekalenteri.",
    "Tuo tiedosto. Käyttöliittymän nimet voivat vaihdella Outlook-version mukaan; tiedostotuonti ei ole verkkotilaus.",
  ] },
  { app: "Apple Kalenteri Macissa", url: "https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac", steps: [
    "Luo erillinen kalenteri yrityksen päiville.",
    "Valitse Kalenteri-sovelluksessa Arkisto > Tuo (File > Import) ja ladattu ICS-tiedosto.",
    "Valitse yrityksen kalenteri kohteeksi. iCloud-kalenteria voi käyttää samalla tilillä myös iPhonessa ja iPadissa.",
  ] },
];
export const COMPANY_ICS_STEPS = [
  "Valitse vuosi ja täytä yrityksen kalenterin merkinnät.",
  "Tarkista esikatselusta päivät ja mahdolliset päällekkäiset merkinnät.",
  "Lataa ICS-tiedosto, kun latausoikeus on käytettävissä.",
  "Tuo tiedosto erilliseen yrityksen kalenteriin valitsemassasi sovelluksessa.",
];
export function companyIcsFaqs() {
  return [
    { q: "Mitä yrityksen ICS-tiedosto sisältää?", a: "Tiedosto sisältää valitsemasi pyhäpäivät, liputuspäivät ja saatavilla olevat koululomat sekä yrityksen sulkupäivät, omat tapahtumat, palkkapäivät ja lomakauden. ISO-viikkonumerot näkyvät maanantain merkintöinä. Kaikki merkinnät ovat kokopäiväisiä." },
    { q: "Voinko tilata yrityksen kalenterin päivittyvänä syötteenä?", a: "Yrityksen omille päiville ei luoda tilausosoitetta tässä versiossa. Maksullinen tiedosto tehdään suojatulla palvelimella, eikä yrityksen tietoja julkaista verkkoon. Yleiset viikkonumero-, pyhäpäivä- ja liputuspäiväkalenterit ovat tilattavissa erikseen Kalenteritilaus-sivulla." },
    { q: "Miten kalenteri päivitetään ilman päällekkäisiä tapahtumia?", a: "Säilytä luonnos samassa selaimessa, muokkaa sitä ja lataa uusi tiedosto. Merkintöjen tunnisteet pysyvät samoina. Kaikki sovellukset eivät silti päivitä vanhoja tapahtumia tiedostotuonnissa: korvaa vain tätä tuontia varten luodun erillisen kalenterin sisältö ja tuo uusi tiedosto. Älä poista kalenteria, johon on lisätty muita omia tapahtumia." },
    { q: "Siirtyvätkö päivät kesäajan tai aikavyöhykkeen vuoksi?", a: "Tapahtumat viedään kokopäiväisinä päivämäärinä, ei kellonaikoina. Kalenterin aikavyöhykkeeksi merkitään Europe/Helsinki. Monipäiväinen jakso kattaa myös lomakkeeseen annetun loppupäivän." },
    { q: "Miten toistuvat palkkapäivät viedään?", a: "Kuukausittainen palkkapäiväsääntö lasketaan valitulle vuodelle samoilla pankkipäiväsäännöillä kuin yrityskalenterissa. ICS-tiedostossa on erillinen tapahtuma jokaiselle lasketulle palkkapäivälle. Toistuvaa RRULE-sääntöä ei käytetä, joten arkipyhäsiirrot säilyvät täsmällisinä." },
    { q: "Onko tämä maksullinen ominaisuus?", a: "Muokkaus ja esikatselu ovat ilmaisia. ICS-lataus kuuluu yrityskalenterin maksullisiin tiedostoihin. Kertamaksu avaa valitun kalenterivuoden lataukset vuoden loppuun. Hinta ja maksupalvelun saatavuus näkyvät editorissa ennen ostoa." },
  ];
}
