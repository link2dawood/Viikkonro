import { plannerPath } from "../platform/planners.js";
export const CONSTRUCTION_PATH = plannerPath("construction");
export const CONSTRUCTION_UPDATED = "2026-10-10";
export const constructionMeta = {
  title: "Rakennuskalenteri: työmaan viikkoaikataulu | Viikko Nro",
  description: "Tee rakennustyömaan viikkoaikataulu: työvaiheet, tehtävät, toimitukset, tarkastukset ja tauot. Tulosta tai lataa PDF, Excel, CSV ja ICS ilman tiliä.",
};
export const CONSTRUCTION_STEPS = [
  "Nimeä projekti ja työmaa sekä valitse projektin alku- ja loppupäivä.",
  "Lisää työvaiheet ja viikkotehtävät. Merkitse toimitukset, tarkastukset, välitavoitteet ja työmaan tauot.",
  "Kirjaa aliurakoitsijoiden työhuomiot ja omat sääriskihuomiot. Tarkista ISO-viikot ja taukojen kanssa päällekkäiset merkinnät.",
  "Valitse viikkoaikataulu tai projektin yleiskuva. Tulosta tai lataa PDF. Excel, CSV ja ICS sisältävät koko projektin.",
];
export function constructionFaqs() {
  return [
    { q: "Mitä rakennuskalenterilla voi suunnitella?", a: "Voit koota projektin työvaiheet, viikkotehtävät, välitavoitteet, toimitukset, tarkastukset ja työmaan tauot samalle aikataululle. Aliurakoitsijahuomiot ja sääriskit kirjoitetaan käsin. Työkalu sopii työmaan viikkopalaverin ja projektikoordinoinnin tueksi." },
    { q: "Miten työmaan tauot vaikuttavat työpäiviin?", a: "Pohjana on sama Suomen projektityöpäiväsääntö kuin projektiaikataulussa. Työmaan tauot vähentävät käytettävissä olevia työpäiviä. Päällekkäisiä taukoja ei vähennetä kahteen kertaan. Tauko ei siirrä tehtävän tai toimituksen päivämäärää automaattisesti." },
    { q: "Mitä viikkoaikataulu ja projektin yleiskuva sisältävät?", a: "Viikkoaikataulu näyttää valitun ISO-viikon merkinnät, pyhäpäivät ja työpäivät taukojen jälkeen. Projektin yleiskuva näyttää kaikki viikot ja merkinnät. PDF ja tulostus seuraavat valittua näkymää. Excel, CSV ja ICS sisältävät aina koko projektijakson." },
    { q: "Voinko käyttää aikataulua Excelissä ja kalenterissa?", a: "Excel-tiedostossa on projektin tiedot, viikkokohtaiset työpäivät, merkinnät ja pyhäpäivät omilla välilehdillään. CSV käyttää UTF-8-merkistöä ja puolipistettä. Usean viikon merkintä toistuu CSV:ssä jokaisella viikollaan. ICS tuo kokopäiväiset merkinnät kalenteriin tiedostona, eikä luo päivittyvää tilausta." },
    { q: "Hakeeko työkalu sääennusteen tai pakolliset tarkastukset?", a: "Ei. Sääriskit, toimitukset ja tarkastukset ovat omia suunnittelumerkintöjäsi. Työkalu ei hae säätietoja eikä päättele työmaalle vaadittavia tarkastuksia, lupia tai turvallisuusvelvoitteita." },
    { q: "Tallentuuko työmaan suunnitelma palvelimelle?", a: "Suunnitelma käsitellään omassa selaimessasi eikä sitä tallenneta palvelimelle. Tiliä ei tarvita. Suunnitelma tyhjenee, kun lataat sivun uudelleen. Lataa tarvittavat tiedostot ennen sivulta poistumista. Kirjaa yrityksiä ja työvaiheita, älä työntekijöiden henkilötietoja." },
  ];
}
