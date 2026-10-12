import { canonicalFor, metaFor, sitemapEntries } from "./seo.js";
import { daysInYear, daysInMonth, fmtShortFi, helsinkiDayKey, M_GENITIVE, mondayOf, navigationYearTargets, weeksInIsoYear } from "../components/dateUtils.js";
import { DAY_RULES } from "./dayRules.js";

// Editorial content reviewed on this date, not refreshed by daily builds.
export const TOPIC_CONTENT_UPDATED = "2026-10-11";
const isoSource = { name:"ISO: päivämäärien ja aikojen esitysmuodot",url:"https://www.iso.org/iso-8601-date-and-time-format.html" };
const holidaySource = { name:"Yliopiston almanakkatoimisto: liputus- ja juhlapäivät",url:"https://almanakka.helsinki.fi/fi/liputus-ja-juhlapaivat/" };
const leaveSource = { name:"Finlex: vuosilomalaki",url:"https://www.finlex.fi/fi/lainsaadanto/2005/162" };
const link = (to, name, purpose) => ({ to, name, purpose });

// Existing guides are the topic hubs. This adds no keyword landing pages.
export const PAGE_TOPICS = Object.freeze({
  weeks:{ name:"ISO-viikkonumerot",hub:"/mika-on-viikkonumero",heading:"Viikkonumerosta kalenteriin",text:"Viikkonumeroa käytetään yhdessä viikkovuoden kanssa. Tarkista viikon päivämäärät ennen kuin siirrät numeron aikatauluun, etenkin vuodenvaihteessa.",sources:[isoSource] },
  calendar:{ name:"Kalenterit ja tulostaminen",hub:"/laskurit",heading:"Valitse kalenteri käyttötarkoituksen mukaan",text:"Viikkokalenteri näyttää päivät kuukausittain. Viikkolista sopii aikataulun rungoksi, ja tulostettava kalenteri paperilla käytettäväksi. Yrityskalenteriin voit lisätä omat merkinnät.",sources:[] },
  holidays:{ name:"Suomen pyhä- ja liputuspäivät",hub:"/tietolahteet",heading:"Pyhäpäivä, liputuspäivä vai oma vapaapäivä?",text:"Kalenterin juhlapäivämerkintä ja työpaikan vapaa ovat eri tietoja. Tarkista päivän luokitus ja käytä työpäivälaskuria, kun tarvitset arkipyhien vaikutuksen aikaväliin.",sources:[holidaySource] },
  work:{ name:"Työpäivien laskenta",hub:"/tyopaivalaskuri",heading:"Valitse oikea päivän laskutapa",text:DAY_RULES.FINLAND_WORKDAY.disclosure,sources:[] },
  leave:{ name:"Vuosiloma ja lomasuunnittelu",hub:"/lomasuunnittelija",heading:"Lomapäivien kuluminen ja loman suunnittelu",text:"Vuosilomalaskuri ja viisipäiväisen työviikon lomasuunnittelija vastaavat eri kysymyksiin. Valitse laskutapa erikseen ja tarkista oma työehtosopimus ennen tuloksen käyttämistä lomaoikeuden arviointiin.",sources:[leaveSource] },
  pay:{ name:"Palkka- ja etuusmaksujen kalenterit",hub:"/hr-kalenteri",heading:"Erota sovittu palkkapäivä ja etuuden maksupäivä",text:"Palkkapäivä, Kelan etuuden maksupäivä ja eläkkeen maksupäivä määräytyvät eri perusteilla. Käytä kyseisen maksun omaa taulukkoa. Yrityksen itse syöttämä määräpäivä ei ole automaattisesti lakisääteinen.",sources:[] },
  project:{ name:"Projekti- ja sprinttiaikataulut",hub:"/projektiaikataulu",heading:"Projektin työpäivistä viikkosuunnitelmaan",text:"Aloita projektin ajanjaksosta ja käytettävästä työpäiväsäännöstä. Lisää vaiheiden jälkeen välitavoitteet. Sprinttien pituus ja lomapäivien kuluminen ovat erillisiä laskentatapoja.",sources:[] },
  construction:{ name:"Rakennustyömaan viikkosuunnittelu",hub:"/rakennuskalenteri",heading:"Yhdistä työvaiheet, toimitukset ja tarkastukset",text:"Merkitse ensin työmaan ajanjakso ja sulut. Sijoita toimitukset sekä tarkastukset työvaiheiden yhteyteen ja tarkista valitun viikon tehtävät. Sääriskit kirjataan omiin muistiinpanoihin.",sources:[] },
  hr:{ name:"HR:n vuosikello ja yrityksen määräpäivät",hub:"/hr-kalenteri",heading:"Rakenna vuosikello päivien alkuperän mukaan",text:"Pidä yleiset kalenteripäivät, yrityksen omat päivät, lähteistetyt lakimuistutukset ja työehtosopimukseen liittyvät säännöt erillään. Lisää palkanlaskennan ja viestinnän määräpäivät oman käytännön mukaan.",sources:[] },
  team:{ name:"Tiimin lomat ja yhteinen suunnittelu",hub:"/tiimin-lomat",heading:"Henkilökohtaisesta lomasta tiimin saatavuuteen",text:"Lomapäivien laskenta auttaa yksittäisen jakson arvioinnissa. Tiimin yhteisessä näkymässä tarkistetaan myös poissaolojen päällekkäisyys ja saatavuus. Yksityiset suunnitelmat edellyttävät kirjautumista ja käyttöoikeuksia.",sources:[] },
  templates:{ name:"Kalenteri- ja suunnittelupohjat",hub:"/kalenteripohjat",heading:"Valitse pohja ja tiedostomuoto työn mukaan",text:"Excel-pohjaa voi muokata taulukkolaskennassa, CSV sopii tietojen siirtoon ja PDF tulostamiseen. Tarkista pohjan ajanjakso sekä ohjeet ennen omien tehtävien tai poissaolojen lisäämistä.",sources:[] },
  data:{ name:"Avoin kalenteridata ja rajapinnat",hub:"/avoin-data",heading:"Kalenteritiedot omaan sovellukseen",text:"Valitse ensin tarvittava aineisto: viikko, kuukausi, vuosi, pyhäpäivä tai työpäivät. Lue kenttien merkitykset ja aikavyöhykkeen käyttö. Staattiset aineistot ja avaimella käytettävä Business API ovat erillisiä rajapintoja.",sources:[isoSource] },
  integration:{ name:"Kalenteritilaukset ja viikkonumeron upottaminen",hub:"/kalenteritilaus",heading:"Valitse tiedosto, tilaus tai upotus",text:"ICS-tiedoston tuonti ja URL-osoitteella tilattu kalenteri ovat eri toimintoja. Yrityksen ladattava tiedosto ei ole jatkuvasti päivittyvä tilaus. Julkiselle verkkosivulle upotettavaan widgetiin kuuluu vain julkaistavaksi tarkoitettu sisältö.",sources:[] },
  dates:{ name:"Päivämäärien ja aikavälien laskenta",hub:"/paivamaaralaskuri",heading:"Päivämäärä, kesto vai työpäivien määrä?",text:"Päivämäärälaskuri siirtää päivää eteen- tai taaksepäin. Päivien erotus laskee aikavälin pituuden. Työpäivälaskuri käyttää valittua päivän sääntöä. Tarkista myös, sisältyvätkö rajapäivät kyseisen laskurin tulokseen.",sources:[isoSource] },
  nature:{ name:"Aurinkoajat ja kalenterin luonnonilmiöt",hub:"/auringonlasku",heading:"Paikkakunta ja päivämäärä vaikuttavat aurinkoaikoihin",text:"Valitse oikea paikkakunta ennen aurinkoaikojen vertailua. Kuun vaiheet ja kellonsiirrot löytyvät omista kalentereistaan. Laskentamenetelmä ja aineiston lähteet on koottu erillisille ohjesivuille.",sources:[] },
  names:{ name:"Nimipäivät ja kalenterin merkkipäivät",hub:"/nimipaivat/tanaan",heading:"Nimipäivästä päivän kalenteriin",text:"Nimipäiväsivut perustuvat sivustolla saatavilla olevaan nimipäiväaineistoon. Aineiston puuttuminen ei tarkoita, ettei päivällä olisi nimipäiviä. Tarkista myös saman päivän kalenteri ja aineiston lähdetiedot.",sources:[] },
  health:{ name:"Päivämääräarviot",hub:"/menetelma",heading:"Tarkista arvion lähtötiedot",text:"Näiden laskurien tulokset ovat arvioita. Tarkista lähtöpäivämäärä ja laskurin omat ohjeet. Terveyteen liittyvissä päätöksissä noudata terveydenhuollosta saamiasi ohjeita.",sources:[] },
  trust:{ name:"Kalenteritietojen lähteet ja menetelmät",hub:"/tietolahteet",heading:"Miten tiedot ja laskentatavat tarkistetaan?",text:"Tietolähteet-sivu kertoo aineistojen alkuperästä. Menetelmä-sivu kuvaa laskennan perusteet, ja toimitusperiaatteet kertovat sisällön tarkistamisesta. Voit ilmoittaa virheestä yhteydenottosivulla.",sources:[] },
});

let knownYear, knownPaths;
export function pageTopic(pathname, today) {
  if (typeof pathname !== "string" || !(today instanceof Date) || !Number.isFinite(today.valueOf())) return null;
  const currentYear = navigationYearTargets(today).currentYear;
  if (knownYear !== currentYear) { knownPaths = new Set(sitemapEntries(currentYear).map(entry=>entry.path)); knownYear = currentYear; }
  if (!knownPaths.has(pathname)) return null;
  const pageYear = pathname.match(/-(\d{4})(?:$|-(?:alkuvuosi|loppuvuosi)$|\/)/)?.[1];
  const year = pageYear ? Number(pageYear) : currentYear;
  let id = "dates", detail = "", links;
  const calendar = () => link(`/kalenteri-${year}`,`Kalenteri ${year}`,"Tarkista päivämäärät kuukausinäkymästä.");
  const holidays = () => link(`/pyhapaivat-${year}`,`Pyhäpäivät ${year}`,"Katso päivän luokitus ja arkipyhien sijainti.");
  const weekGuide = link("/mika-on-viikkonumero","Miten viikkonumero määräytyy?","Viikkovuosi, merkintätapa ja vuoden ensimmäinen viikko.");
  const workGuide = link("/tyopaivalaskuri","Työpäivälaskuri","Laske työpäivät valitulla aikavälillä.");
  let match;
  if (pathname === "/en") {
    return { id:"weeks",topic:PAGE_TOPICS.weeks,heading:"Explore the Finnish calendar tools",text:"Use the Finnish guides to check week dates, public holidays and calculation methods. Pages linked below are in Finnish.",detail:"",lang:"en",day:helsinkiDayKey(today),sources:[{ ...isoSource,name:"ISO: date and time formats" }],links:[link("/mika-on-viikkonumero","ISO week-number guide (Finnish)","Understand the week-year and week numbering."),link(`/kalenteri-${year}`,`${year} calendar (Finnish)`,"See dates and week numbers together."),link("/tietolahteet","Calendar data sources (Finnish)","Check the sources behind the calendar.")] };
  }
  if ((match = pathname.match(/^\/viikko-(\d+)-(\d+)$/))) {
    id="weeks";
    const start=mondayOf(Number(match[1]),year),end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+6);
    detail=`Viikko ${match[1]}/${year} alkaa ${fmtShortFi(start)} ja päättyy ${fmtShortFi(end)}. Kalenterikuukausi ja viikkovuosi voivat vaihtua saman viikon aikana.`;
    links=[weekGuide,...[start,end].map(d=>link(`/kuukausi-${d.getMonth()+1}-${d.getFullYear()}`,`${M_GENITIVE[d.getMonth()]} ${d.getFullYear()} viikot`,"Katso viikon paikka kuukauden aikataulussa.")),link(`/vuosi-${year}`,`Viikkovuosi ${year}`,"Selaa saman viikkovuoden kaikkia viikkoja.")];
  } else if ((match=pathname.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    id="calendar";detail=`Vuoden ${year} ${M_GENITIVE[Number(match[1])-1]} kalenterissa on ${daysInMonth(year,Number(match[1]))} päivää. Kuukauden ensimmäinen ja viimeinen viikko voivat jatkua viereisen kuukauden puolelle.`;
    links=[link(`/vuosi-${year}`,`Vuoden ${year} viikot`,"Vertaa kuukautta koko vuoden aikatauluun."),holidays(),weekGuide];
  } else if (/^\/(?:vuosi|q[1-4])-/.test(pathname) || ["/mika-vuosi-nyt","/mika-kuukausi-nyt"].includes(pathname)) {
    id="calendar";detail=`Kalenterivuodessa ${year} on ${daysInYear(year)} päivää ja viikkovuodessa ${year} on ${weeksInIsoYear(year)} ISO-viikkoa. Kalenterivuosi ja viikkovuosi eivät aina ala samana päivänä.`;
    links=[calendar(),weekGuide,holidays()];
  } else if (/^\/(?:kalenteri|tulostettava-kalenteri|tulosta)-/.test(pathname) || pathname==="/") {
    id="calendar";links=[link(`/tulostettava-kalenteri-${year}`,`Tulostettava kalenteri ${year}`,"Lataa maksuton kalenteri paperille."),link(`/tulosta-${year}`,`Viikkolista ${year}`,"Katso viikot ja niiden alku- sekä loppupäivät."),link("/yrityskalenteri","Yrityksen oma kalenteri","Lisää logo ja yrityksen omat merkinnät.")];
  } else if (/^\/(?:pyhapaivat|pyhat|liputuspaivat|koululomat|isanpaiva|aitienpaiva|ystavanpaiva|laskiainen|adventti)-/.test(pathname)) {
    id="holidays";links=[holidays(),link(`/liputuspaivat-${year}`,`Liputuspäivät ${year}`,"Tarkista viralliset ja vakiintuneet liputuspäivät."),workGuide];
    if (pathname.startsWith("/koululomat-")) detail="Koululoma voi vaihdella kunnittain ja kouluittain. Tarkista valitun alueen lähde ja tiedon varmuustaso sivun taulukosta.";
  } else if (pathname.startsWith("/tyopaivat-") || pathname==="/tyopaivalaskuri") {
    id="work";links=[workGuide,holidays(),link("/vuosilomalaskuri","Vuosiloman laskentasäännöt","Tarkista lomapäivien kuluminen erillisessä laskurissa.")];
  } else if (["/lomasuunnittelija","/vuosilomalaskuri"].includes(pathname)) {
    id="leave";links=[link("/vuosilomalaskuri","Vuosilomapäivien laskenta","Laske lomapäivien kuluminen ja kertyminen."),link("/lomasuunnittelija","Loman sijoittaminen kalenteriin","Vertaa lomajaksoja viisipäiväisen työviikon mukaan."),link("/tiimin-lomat","Tiimin yhteinen lomakalenteri","Tutustu saatavuuden ja päällekkäisyyksien suunnitteluun.")];
  } else if (/^\/(?:palkkapaivat|kelan-maksupaivat|elakkeen-maksupaivat)-/.test(pathname)) {
    id="pay";links=[link(`/palkkapaivat-${year}`,`Palkkapäivät ${year}`,"Tarkista valitun palkkapäivän pankkipäivä."),link("/hr-kalenteri","HR-kalenteri ja vuosikello","Lisää yrityksen omat palkanlaskennan määräpäivät."),holidays()];
  } else if (["/projektiaikataulu","/sprinttisuunnittelija","/ajanhallinta"].includes(pathname)) {
    id="project";links=[link("/projektiaikataulu","Projektin vaiheet ja välitavoitteet","Rakenna työpäiviin perustuva aikataulu."),link("/sprinttisuunnittelija","Sprinttien kalenteri","Suunnittele peräkkäiset sprintit ja tarkista ISO-viikot."),workGuide];
  } else if (pathname==="/rakennuskalenteri") {
    id="construction";links=[link("/projektiaikataulu","Projektin kokonaisaikataulu","Tarkista työvaiheiden ajanjaksot."),workGuide,holidays()];
  } else if (pathname==="/hr-kalenteri") {
    id="hr";links=[link(`/palkkapaivat-${year}`,`Palkkapäivät ${year}`,"Vertaa maksupäiviä yrityksen määräpäiviin."),link("/vuosilomalaskuri","Vuosiloman laskenta","Pidä lomaoikeuden laskenta erillään vuosikellosta."),link("/yrityskalenteri","Yrityskalenteri","Kokoa yhteiset päivät yrityksen kalenteriin.")];
  } else if (pathname==="/tiimin-lomat") {
    id="team";links=[link("/lomasuunnittelija","Lomajakson suunnittelu","Vertaa henkilökohtaisia lomajaksoja."),link("/vuosilomalaskuri","Lomapäivien kuluminen","Laske jakson lomapäivät erikseen."),link("/hr-kalenteri","HR:n vuosikello","Sovita yhteiset tapahtumat lomakauteen.")];
  } else if (pathname.startsWith("/kalenteripohjat")) {
    id="templates";links=[link("/kalenteripohjat","Kaikki suunnittelupohjat","Vertaa pohjien käyttötarkoituksia ja muotoja."),link("/projektiaikataulu","Projektisuunnittelun työkalu","Laske päivämäärät ennen pohjan täyttämistä."),link("/lomasuunnittelija","Lomasuunnittelun työkalu","Tarkista lomajaksojen sijoittuminen.")];
  } else if (pathname==="/avoin-data" || pathname==="/api-playground" || pathname.startsWith("/data/")) {
    id="data";links=[link("/avoin-data","Aineistot ja rajapintojen erot","Valitse oikea aineisto ja tutustu käyttöön."),link("/api-playground","Kokeile kalenteridataa","Tarkista vastauksen kentät käytännössä."),link("/data/working-days","Työpäiväaineiston kentät","Lue työpäivien laskentaperusteet.")];
  } else if (["/kalenteritilaus","/upota-viikkonumero","/yrityskalenteri/ics","/chrome-extension","/android-sovellus"].includes(pathname)) {
    id="integration";links=[link("/kalenteritilaus","Julkisen kalenterin tilaaminen","Tuo tai tilaa kalenteri omaan sovellukseen."),link("/yrityskalenteri/ics","Yrityksen oma ICS-tiedosto","Lisää yrityksen omat päivät ladattavaan kalenteriin."),link("/upota-viikkonumero","Viikkonumeron ja kalenterin upotus","Tutustu verkkosivulle lisättävään widgetiin.")];
  } else if (pathname==="/yrityskalenteri") {
    id="calendar";detail="Esikatselu toimii ilman ostoa. Maksullinen latausoikeus koskee yhtä valittua kalenterivuotta. Yksityistä kalenteria ei julkaista avoimena tilausosoitteena.";
    links=[link("/yrityskalenteri/ics","Yrityskalenterin ICS-tuonti","Vie samat päivät kalenterisovellukseen."),link("/hr-kalenteri","HR:n vuosikellon suunnittelu","Jäsennä yrityksen tapahtumat ja muistutukset."),link("/kalenteripohjat","Muokattavat kalenteripohjat","Vertaa taulukkolaskentaan sopivia vaihtoehtoja.")];
  } else if (/^\/auringonlasku(?:-|$)/.test(pathname) || /^\/(?:kuun-vaiheet|kesaaika)-/.test(pathname)) {
    id="nature";links=[link("/auringonlasku","Aurinkoajat paikkakunnittain","Valitse sijainti vertailua varten."),link(`/kuun-vaiheet-${year}`,`Kuun vaiheet ${year}`,"Katso kuun vaiheiden päivämäärät."),link("/menetelma","Laskennan menetelmät","Tutustu laskennan oletuksiin.")];
  } else if (pathname.startsWith("/nimipaiva")) {
    id="names";links=[link("/nimipaivat/tanaan","Päivän nimipäivät","Katso saatavilla olevat nimipäivät."),calendar(),link("/tietolahteet","Nimipäiväaineiston lähteet","Tarkista aineiston kattavuus.")];
  } else if (["/raskauslaskuri","/kuukautislaskuri"].includes(pathname)) {
    id="health";links=[link("/menetelma","Laskentamenetelmät","Tarkista oletukset ja laskureiden rajaukset."),link("/tietolahteet","Tietolähteet","Tutustu laskurien lähteisiin."),link("/paivien-erotus","Päivien erotus","Tarkista kahden päivämäärän aikaväli.")];
  } else if (["/mika-on-viikkonumero","/viikko-alkaa-maanantaista","/kuinka-monta-viikkoa-vuodessa","/suomi-vs-usa-viikkonumerot","/parillinen-pariton-viikko"].includes(pathname)) {
    id="weeks";links=[weekGuide,link("/viikko-paivamaaraksi","Viikkonumerosta päivämääriksi","Hae kokonaisen viikon päivät."),link("/paivamaara-viikoksi","Päivämäärästä viikkonumeroon","Tarkista yksittäisen päivän viikkovuosi.")];
  } else if (["/tietolahteet","/menetelma","/toimitusperiaatteet","/tietoa-meista","/ota-yhteytta","/tietosuoja","/kayttoehdot","/palautusehdot","/ukk"].includes(pathname)) {
    id="trust";links=[link("/tietolahteet","Kalenteritietojen lähteet","Katso aineistojen alkuperä ja kattavuus."),link("/menetelma","Laskentamenetelmät","Lue päivämäärien ja työpäivien laskennasta."),link("/toimitusperiaatteet","Toimitusperiaatteet","Tutustu sisällön tarkistamiseen."),link("/ota-yhteytta","Ilmoita kalenteritiedon virheestä","Lähetä korjauspyyntö toimitukselle.")];
  } else if (pathname==="/laskurit") {
    id="calendar";links=[weekGuide,link("/menetelma","Laskureiden toimintaperiaatteet","Valitse laskutapa ennen työkalun käyttöä."),link("/tietolahteet","Tietolähteet","Tarkista aineistojen lähtötiedot.")];
  } else {
    links=[link("/paivamaaralaskuri","Päivämäärän siirtäminen","Lisää tai vähennä päiviä ja muita aikayksiköitä."),link("/paivien-erotus","Päivien erotus","Laske aikavälin pituus."),workGuide];
  }
  const topic=PAGE_TOPICS[id];
  links=[...new Map(links.filter(l=>l.to!==pathname && knownPaths.has(l.to)).map(l=>[l.to,l])).values()];
  return { id,topic,heading:topic.heading,text:topic.text,detail,links,sources:topic.sources,lang:"fi",year,day:helsinkiDayKey(today) };
}

export function topicSchema(page, context) {
  if (!context) return page;
  const topic=context.topic;
  const existing=page.about ? (Array.isArray(page.about) ? page.about : [page.about]) : [];
  const about={ "@type":"Thing","@id":`${canonicalFor(topic.hub)}#topic-${context.id}`,name:topic.name,url:canonicalFor(topic.hub) };
  const related=page.relatedLink ? (Array.isArray(page.relatedLink) ? page.relatedLink : [page.relatedLink]) : [];
  const dateModified=context.day >= TOPIC_CONTENT_UPDATED && (!page.dateModified || page.dateModified < TOPIC_CONTENT_UPDATED)
    ? TOPIC_CONTENT_UPDATED : page.dateModified;
  return { ...page,...(dateModified ? { dateModified } : {}),description:page.description ?? metaFor(new URL(page.url).pathname)?.description,about:[...existing.filter(n=>n["@id"]!==about["@id"]),about],relatedLink:[...new Set([...related,...context.links.map(l=>canonicalFor(l.to))])] };
}
