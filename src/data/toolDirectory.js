import { COUNTDOWNS } from "./countdownPages.js";
import { OFFSETS, offsetPath } from "./dateCalculator.js";
import { SUN_CITIES, SUN_HUB_PATH, sunCityPath } from "./sunCities.js";
import { navigationYearTargets } from "../components/dateUtils.js";
import { schoolHolidayPage } from "./schoolHolidayPages.js";

const CALCULATORS = [
  { to: "/tiimin-lomat", name: "Tiimin lomasuunnittelija", desc: "Yksityinen organisaatiokalenteri, yhteinen saatavuus ja käyttöoikeudet. Vaatii kirjautumisen." },
  { to: "/hr-kalenteri", name: "HR-kalenteri", desc: "Palkkapäivät, omat määräpäivät, viestintä ja lomajaksot. ISO-viikot sekä PDF, Excel ja ICS." },
  { to: "/rakennuskalenteri", name: "Rakennuskalenteri", desc: "Työmaan työvaiheet, viikkotehtävät, toimitukset ja tarkastukset. Tulosta tai lataa PDF, Excel, CSV ja ICS." },
  {
    to: "/viikonpaiva",
    name: "Viikonpäivälaskuri",
    desc: "Syötä päivämäärä ja selvitä, mikä viikonpäivä se oli tai tulee olemaan.",
  },
  {
    to: "/paivamaara-viikoksi",
    name: "Päivämäärästä viikkonumeroon",
    desc: "Syötä päivä ja näe sen viikkonumero, viikonpäivä ja viikon päivämäärät.",
  },
  {
    to: "/viikko-paivamaaraksi",
    name: "Viikosta päivämääräksi",
    desc: "Syötä viikko ja vuosi, näe viikon alkamis- ja päättymispäivä sekä viikonpäivät.",
  },
  {
    to: "/tyopaivalaskuri",
    name: "Työpäivälaskuri",
    desc: "Työpäivät kahden päivän välillä, viikonloput ja arkipyhät huomioiden.",
  },
  {
    to: "/kuukautislaskuri",
    name: "Kuukautislaskuri",
    desc: "Seuraavat kuukautiset, arvioitu ovulaatio ja hedelmälliset päivät.",
  },
  {
    to: "/raskauslaskuri",
    name: "Raskauslaskuri",
    desc: "Raskausviikko ja laskettu aika sekä raskausvapaan ja raskausrahan päivät.",
  },
  {
    to: "/vuosilomalaskuri",
    name: "Vuosilomalaskuri",
    desc: "Montako lomapäivää loma kuluttaa ja kertyy, ja viikot, joilla loma kuluttaa vähemmän.",
  },
  {
    to: "/yrityskalenteri",
    name: "Yrityskalenteri",
    desc: "Tee yrityksellesi oma kalenteri logolla, sulku- ja palkkapäivillä sekä viikkonumeroilla.",
  },
  {
    to: "/lomasuunnittelija",
    name: "Lomasuunnittelija",
    desc: "Pisimmät tauot omilla lomapäivillä, kun ne sijoitetaan viikonloppujen ja arkipyhien väliin.",
  },
  {
    to: "/projektiaikataulu",
    name: "Projektiaikataulu",
    desc: "Projektin päättymispäivä työpäivinä, viikkokohtainen aikataulu ja välitavoitteet.",
  },
  {
    to: "/sprinttisuunnittelija",
    name: "Sprinttisuunnittelija",
    desc: "Sprinttien päivämäärät, ISO-viikot ja työpäivät arkipyhät huomioiden.",
  },
  {
    to: "/tuntilaskuri",
    name: "Tuntilaskuri",
    desc: "Työtunnit kellonajoista taukoineen, viikon tunnit ja minuutit desimaaleina.",
  },
  {
    to: "/ikalaskuri",
    name: "Ikälaskuri",
    desc: "Tarkka ikä vuosina, kuukausina ja päivinä sekä seuraava syntymäpäivä.",
  },
  {
    to: "/paivamaaralaskuri",
    name: "Päivämäärälaskuri",
    desc: "Lisää tai vähennä päiviä, viikkoja, kuukausia tai arkipäiviä mistä tahansa päivästä.",
  },
  {
    to: "/paivien-erotus",
    name: "Päivien erotus",
    desc: "Montako päivää ja viikkoa kahden päivämäärän välillä on.",
  },
  ...COUNTDOWNS.map((c) => ({
    to: c.path,
    name: `Päivää ${c.illative}`,
    desc: `Montako päivää, viikkoa ja työpäivää on jäljellä: ${c.targetName}.`,
  })),
];

const planningPaths = new Set(["/tiimin-lomat", "/hr-kalenteri", "/rakennuskalenteri", "/yrityskalenteri", "/lomasuunnittelija", "/projektiaikataulu", "/sprinttisuunnittelija", "/vuosilomalaskuri"]);
const item = (to, name, desc) => ({ to, name, desc });

// A directory of existing tools, not a new route or a product launch list.
export function toolGroups(today) {
  const { currentYear: year, promotedYear } = navigationYearTargets(today);
  const calendar = [
    item(`/kalenteri-${promotedYear}`, `Viikkokalenteri ${promotedYear}`, "Vuoden päivät, pyhäpäivät ja ISO-viikot."),
    item(`/tulostettava-kalenteri-${promotedYear}`, "Tulostettava kalenteri", "Maksuton kalenteri tulostamiseen ja PDF-lataukseen."),
    item(`/tulosta-${promotedYear}`, "Tulostettava viikkolista", "Vuoden viikot ja päivämäärät riveittäin."),
    item(`/vuosi-${year}`, `Vuoden ${year} viikkonumerot`, "Selaa viikon päivämääriä ja kuukausia."),
    item("/mika-kuukausi-nyt", "Nykyinen kuukausi", "Kuukauden kalenteri ja viikot."),
    item("/mika-vuosi-nyt", "Nykyinen vuosi", "Vuoden tiedot ja eteneminen."),
    item("/parillinen-pariton-viikko", "Parillinen vai pariton viikko", "Tarkista viikon parillisuus."),
    item(`/pyhapaivat-${year}`, "Suomen pyhäpäivät", "Pyhäpäivät, arkipyhät ja viikkonumerot."),
    item(`/liputuspaivat-${year}`, "Liputuspäivät", "Suomen liputuspäivät ja päivämäärät."),
    item(`/tyopaivat-${year}`, "Vuoden työpäivät", "Työpäivät kuukausittain ja vuodessa."),
    item(`/kuun-vaiheet-${year}`, "Kuun vaiheet", "Uusikuu ja täysikuu vuoden aikana."),
    item(`/kesaaika-${year}`, "Kellonsiirto", "Kesäajan ja talviajan vaihtuminen."),
    item("/nimipaivat/tanaan", "Nimipäivät tänään", "Päivän nimipäivät saatavilla olevan aineiston mukaan."),
  ];
  if (schoolHolidayPage(year)) calendar.push(item(`/koululomat-${year}`, "Koululomat", "Selaa koulujen lomajaksoja alueittain."));
  return [
    { id: "kalenterit", name: "Kalenterit, viikot ja juhlapäivät", tools: calendar },
    { id: "laskenta", name: "Päivämäärä- ja aikalaskurit", tools: [
      ...CALCULATORS.filter(tool => !planningPaths.has(tool.to)),
      ...OFFSETS.map(n => item(offsetPath(n), `${n} päivää eteenpäin`, "Laske päivämäärä tästä päivästä eteenpäin.")),
    ] },
    { id: "suunnittelu", name: "Maksuttomat suunnittelutyökalut", tools: [
      ...CALCULATORS.filter(tool => planningPaths.has(tool.to) && tool.to !== "/yrityskalenteri"),
      item("/kalenteripohjat", "Kalenteri- ja suunnittelupohjat", "Ladattavat Excel-, CSV- ja PDF-pohjat."),
      { ...item("/tiimin-lomat/suunnittelu", "Tiimin lomat, työvuorot ja asiakasyritykset", "Avaa yksityinen suunnittelutyötila. Vaatii kirjautumisen ja asianmukaiset käyttöoikeudet."), documentNavigation: true },
    ] },
    { id: "pro", name: "Pro-työkalut", description: "Yrityksen omat kalenterit ja laajemmat suunnitelmat. Kokeile esikatselua maksutta. Maksulliset lataukset ovat tuotekohtaisia; kaikki Pro-tuotteet eivät vielä ole myynnissä.", tools: [
      { ...CALCULATORS.find(tool => tool.to === "/yrityskalenteri"), badge: "Maksuton esikatselu · maksulliset viennit" },
      { ...item("/yrityskalenteri/ics", "Yrityksen ICS-kalenteri", "Yrityksen päivät kalenterisovellukseen. Sisältyy Yrityskalenterin latausoikeuteen."), badge: "Maksuton esikatselu · maksullinen vienti" },
      { ...item("/lomasuunnittelija#vuosisuunnitelma", "Lomasuunnittelija Pro", "Henkilökohtaiset lomajaksot, sulkupäivät ja yhteinen vuosinäkymä. Maksuton lomasuunnittelija säilyy käytössä."), badge: "Esikatselu · ei vielä myynnissä" },
    ] },
    { id: "maksupaivat", name: "Palkka- ja maksupäivät", tools: [
      item(`/palkkapaivat-${year}`, "Palkkapäivät", "Tarkista palkkapäivän siirtyminen viikonlopun tai arkipyhän vuoksi."),
      item(`/kelan-maksupaivat-${year}`, "Kelan maksupäivät", "Etuuksien maksupäivät kuukausittain."),
      item(`/elakkeen-maksupaivat-${year}`, "Eläkkeen maksupäivät", "Työeläkkeen, kansaneläkkeen ja takuueläkkeen maksupäivät."),
    ] },
    { id: "aurinko", name: "Auringonnousu ja auringonlasku", tools: [
      item(SUN_HUB_PATH, "Aurinkoajat Suomessa", "Valitse paikkakunta ja tarkista päivän aurinkoajat."),
      ...SUN_CITIES.map(city => item(sunCityPath(city.slug), `Aurinkoajat: ${city.name}`, "Auringonnousu, auringonlasku ja päivän pituus.")),
    ] },
    { id: "integraatiot", name: "Kalenteritilaukset, sovellukset ja integraatiot", tools: [
      item("/kalenteritilaus", "Kalenteritilaus", "Tilaa Viikkonron kalenterit omaan kalenterisovellukseesi."),
      item("/upota-viikkonumero", "Kalenteri- ja viikkonumerowidget", "Lisää widget omalle verkkosivulle."),
      item("/api-playground", "Kalenteri-API:n kokeilu", "Kokeile kalenteridataa ja tutustu API:n käyttöön."),
      item("/avoin-data", "Avoin kalenteridata", "Kalenteriaineistot ja rajapinnan dokumentaatio."),
      item("/chrome-extension", "Chrome-laajennus", "Viikkonumero selaimen työkalupalkkiin."),
      item("/android-sovellus", "Android-sovellus", "Viikkonumerot ja kalenterityökalut puhelimeen."),
    ] },
  ];
}

export function relatedTools(pathname, today) {
  if (["/", "/laskurit"].includes(pathname)) return [];
  const pageYear = pathname.match(/-(\d{4})(?:$|-(?:alkuvuosi|loppuvuosi)$)/)?.[1];
  const contextDate = pageYear ? new Date(Date.UTC(Number(pageYear), 0, 1, 12)) : today;
  const year = navigationYearTargets(contextDate).currentYear;
  const groups = toolGroups(contextDate);
  let group = groups.find(value => value.tools.some(tool => tool.to === pathname));
  if (!group && /^\/(kalenteri|tulostettava-kalenteri|tulosta|vuosi|viikko|kuukausi|pyhapaivat|liputuspaivat|tyopaivat|koululomat)-/.test(pathname)) group = groups[0];
  if (!group && pathname.startsWith("/kalenteripohjat/")) group = groups.find(value => value.id === "suunnittelu");
  if (!group) return [];
  const byPath = new Map(groups.flatMap(value => value.tools).map(tool => [tool.to, tool]));
  const preferred = {
    kalenterit: [`/pyhapaivat-${year}`, `/tyopaivat-${year}`, "/yrityskalenteri", "/kalenteritilaus"],
    laskenta: ["/paivamaaralaskuri", "/paivien-erotus", "/paivamaara-viikoksi", "/tyopaivalaskuri"],
    suunnittelu: ["/yrityskalenteri", "/lomasuunnittelija", "/projektiaikataulu", "/hr-kalenteri", "/kalenteripohjat"],
    pro: ["/yrityskalenteri", "/yrityskalenteri/ics", "/kalenteripohjat", "/hr-kalenteri"],
    maksupaivat: ["/hr-kalenteri", `/pyhapaivat-${year}`, "/yrityskalenteri", "/tyopaivalaskuri"],
    aurinko: [SUN_HUB_PATH, "/paivamaaralaskuri"],
    integraatiot: ["/kalenteritilaus", "/upota-viikkonumero", "/api-playground", "/avoin-data"],
  };
  const specific = {
    "/projektiaikataulu": ["/sprinttisuunnittelija", "/rakennuskalenteri", "/tyopaivalaskuri", `/kalenteri-${year}`],
    "/sprinttisuunnittelija": ["/projektiaikataulu", "/tyopaivalaskuri", `/pyhapaivat-${year}`, "/kalenteripohjat"],
    "/rakennuskalenteri": ["/projektiaikataulu", "/tyopaivalaskuri", `/pyhapaivat-${year}`, "/kalenteripohjat"],
    "/hr-kalenteri": [`/palkkapaivat-${year}`, "/lomasuunnittelija", "/yrityskalenteri", `/pyhapaivat-${year}`],
    "/lomasuunnittelija": ["/vuosilomalaskuri", "/tiimin-lomat", `/pyhapaivat-${year}`, "/hr-kalenteri"],
    "/vuosilomalaskuri": ["/lomasuunnittelija", "/tiimin-lomat", "/hr-kalenteri", `/pyhapaivat-${year}`],
    "/tiimin-lomat": ["/lomasuunnittelija", "/hr-kalenteri", "/vuosilomalaskuri", "/yrityskalenteri"],
    "/yrityskalenteri": ["/yrityskalenteri/ics", "/kalenteripohjat", "/hr-kalenteri", `/palkkapaivat-${year}`],
    "/yrityskalenteri/ics": ["/yrityskalenteri", "/kalenteritilaus", "/hr-kalenteri", "/kalenteripohjat"],
  };
  const candidates = [...(specific[pathname] ?? preferred[group.id]).map(path => byPath.get(path)), ...group.tools];
  return [...new Map(candidates.filter(tool => tool && tool.to !== pathname && !tool.documentNavigation).map(tool => [tool.to, tool])).values()].slice(0,4);
}
