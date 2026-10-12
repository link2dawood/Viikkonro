// Static catalogue. Asset manifests and page content use the same records.
// A paid record can be added later, but its files must never be published in dist.
export const TEMPLATE_PATH = "/kalenteripohjat";
export const TEMPLATE_UPDATED = "2026-10-10";
export const TEMPLATE_YEARS = Object.freeze([2026, 2027, 2028]);
export const TEMPLATE_DEFAULT_YEAR = 2027;
export const TEMPLATE_CATEGORIES = Object.freeze([
  { id: "company", name: "Yrityskalenterit" },
  { id: "vacation", name: "Lomasuunnittelu" },
  { id: "project", name: "Projektisuunnittelu" },
  { id: "shifts", name: "Työvuorot" },
  { id: "construction", name: "Rakennusprojektit" },
  { id: "hr", name: "HR ja palkkapäivät" },
]);
export const TEMPLATE_FORMATS = Object.freeze({
  xlsx: { label: "Excel (XLSX)", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  csv: { label: "CSV", mime: "text/csv;charset=utf-8" },
  pdf: { label: "Tulostettava PDF", mime: "application/pdf" },
});

/**
 * @typedef {object} Template
 * @property {string} id
 * @property {string} slug
 * @property {string} name Internal English name
 * @property {string} finnishName
 * @property {string} description
 * @property {string} category Category id
 * @property {string[]} format
 * @property {{caption: string, rows: number}} preview
 * @property {{amount: number, currency: "EUR"}} price Zero means a free download
 * @property {{years: number[], defaultYear: number}} yearApplicability
 * @property {string[]} tags
 * @property {{format: string, year: number, path: string}[]} downloadableAssets
 * @property {{title: string, description: string}} seo
 * @property {string[]} steps
 * @property {string[]} includes
 * @property {string} limitation
 */
const definitions = [
  {
    id: "company", slug: "yrityksen-vuosikalenteri", name: "Company annual calendar", finnishName: "Yrityksen vuosikalenteri",
    description: "Koko vuoden päivät, Suomen pyhäpäivät ja ISO-viikot samassa pohjassa. Merkitse yrityksen sulkupäivät, yhteiset tapahtumat ja omat muistiinpanot päivittäisille riveille.",
    includes: ["365 tai 366 päiväkohtaista riviä", "Suomen pyhäpäivät ja viikonpäivät", "Vuosinäkymä PDF-tulosteena ja päivittäinen Excel-taulukko"],
    steps: ["Valitse suunnitteluvuosi ja lataa Excel-pohja.", "Täytä Sulkupäivä-, Tapahtuma- ja Muistiinpanot-sarakkeet.", "Jaa täytetty tiedosto tiimille. Käytä PDF:ää vuoden yleiskuvana."],
    limitation: "PDF on valmis vuosikalenteri. Exceliin tekemäsi muutokset eivät siirry siihen automaattisesti. Logollisen kalenterin voit tehdä Yrityskalenterissa.",
    related: { path: "/yrityskalenteri", label: "Tee kalenteri yrityksen logolla" },
  },
  {
    id: "vacation", slug: "tiimin-lomasuunnitelma", name: "Team vacation plan", finnishName: "Tiimin lomasuunnitelma",
    description: "Sovita tiimin lomat yhteen viikko kerrallaan. Täytä lomalaiset, sijaiset ja arvio käytettävissä olevasta henkilöstöstä ennen kuin vahvistat loma-ajat.",
    includes: ["Jokainen vuotta koskettava ISO-viikko päivämäärineen", "Lomalaiset, sijaiset ja kapasiteetti omissa sarakkeissa", "Viikoittaiset pyhäpäivät sekä erillinen päivämääräviite Excelissä"],
    steps: ["Kerää tiimin lomatoiveet ja merkitse ne oikeille viikoille.", "Kirjaa samalle riville sovitut sijaiset ja käytettävissä oleva henkilöstö.", "Ratkaise päällekkäisyydet yhdessä ja päivitä suunnitelma hyväksymisen jälkeen."],
    limitation: "Viikon työpäivät lasketaan maanantaista perjantaihin, pyhäpäivät ja aattovapaat pois lukien. Pohja ei laske lakisääteistä lomankulutusta eikä hyväksy lomia.",
    related: { path: "/lomasuunnittelija", label: "Etsi sopivat lomajaksot" },
  },
  {
    id: "project", slug: "projektin-viikkosuunnitelma", name: "Project weekly plan", finnishName: "Projektin viikkosuunnitelma",
    description: "Jaa projektin työ viikoille ja tee vastuut näkyviksi. Kirjaa tehtävät, vastuuhenkilöt, välitavoitteet ja tilanne samaan viikkokohtaiseen taulukkoon.",
    includes: ["Vuoden ISO-viikot ja niiden alku- ja loppupäivät", "Tehtävä, vastuu, välitavoite ja tilanne", "Työpäivien määrä viikossa suunnittelun tueksi"],
    steps: ["Merkitse projektin käytössä olevat viikot ja jätä muut rivit tyhjiksi.", "Kirjaa kullekin viikolle tehtävä, vastuuhenkilö ja tavoiteltu tulos.", "Päivitä tilanne viikkopalaverissa ja siirrä keskeneräiset tehtävät tarvittaessa."],
    limitation: "Työpäivät lasketaan maanantaista perjantaihin pyhäpäivät pois lukien. Aattopäivät voivat olla työpäiviä. Pohja ei laske tehtävien kestoja tai riippuvuuksia automaattisesti.",
    related: { path: "/projektiaikataulu", label: "Laske projektin päättymispäivä" },
  },
  {
    id: "shifts", slug: "tyovuorojen-suunnittelupohja", name: "Shift planning sheet", finnishName: "Työvuorojen suunnittelupohja",
    description: "Suunnittele aamu-, ilta- ja yövuorojen miehitys päiväkohtaisesti. Jokaisen päivän viikonpäivä ja ISO-viikkovuosi auttavat vertaamaan vuorolistoja myös vuodenvaihteessa.",
    includes: ["Päiväkohtaiset aamu-, ilta- ja yövuorosarakkeet", "Viikonpäivä, ISO-viikko ja pyhäpäivän nimi", "12 kuukausikohtaista PDF-sivua käsin täytettäväksi"],
    steps: ["Täytä vuorosarakkeisiin työntekijöiden nimet tai sovitut tunnisteet.", "Kirjaa vapaapäivät ja vaihdot Huomio-sarakkeeseen.", "Tarkista miehitys ja työajat organisaation käytäntöjen mukaan ennen jakamista."],
    limitation: "Pohja on miehityksen suunnittelua varten. Se ei laske tunteja, palkkoja, lepoaikoja tai työehtosopimuksen mukaista vuorojen kelpoisuutta.",
    related: { path: "/tuntilaskuri", label: "Laske vuoron työtunnit" },
  },
  {
    id: "construction", slug: "rakennustyomaan-viikkoaikataulu", name: "Construction weekly schedule", finnishName: "Rakennustyömaan viikkoaikataulu",
    description: "Kokoa työmaan vaiheet, urakoitsijat, toimitukset ja tarkastukset yhteen viikkoaikatauluun. Näet samalla, mitä edellytyksiä seuraavan työvaiheen aloitukselle on.",
    includes: ["Viikkojen päivämäärät ja suunnittelutyöpäivät", "Työvaihe, urakoitsija, edeltävä työ ja toimitukset", "Tarkastus ja riski omissa sarakkeissa"],
    steps: ["Jaa työvaiheet suunnitelluille viikoille.", "Kirjaa vastuullinen urakoitsija ja työn aloittamisen edellytykset.", "Lisää toimitukset, tarkastukset ja riskit. Päivitä rivit työmaakokouksessa."],
    limitation: "Työpäivien määrä on yleinen suunnitteluviite. Tarkastussarakkeet ovat tyhjiä: pohja ei määrää pakollisia tarkastuksia, lupia tai turvallisuusvelvoitteita.",
    related: { path: "/rakennuskalenteri", label: "Tee työmaan viikkoaikataulu selaimessa" },
  },
  {
    id: "hr", slug: "hr-ja-palkkapaivien-vuosikello", name: "HR and payroll annual plan", finnishName: "HR- ja palkkapäivien vuosikello",
    description: "Aikatauluta palkanlaskennan aineistot, omat palkkapäivät ja henkilöstöhallinnon tehtävät viikoittain. Nimeä vastuuhenkilö ja seuraa tehtävän valmistumista.",
    includes: ["ISO-viikot ja pyhäpäivät ajoituksen tueksi", "Oma palkkapäivä ja aineiston määräpäivä", "HR-tehtävä, vastuu ja tilanne"],
    steps: ["Kirjaa organisaation sovitut palkkapäivät täsmällisinä päivämäärinä.", "Lisää aineiston toimituspäivä, HR-tehtävä ja vastuuhenkilö.", "Varmista määräajat omista sopimuksista ja päivitä tilanne jokaisen käsittelyn jälkeen."],
    limitation: "Palkkapäivät ja määräajat jätetään tyhjiksi. Pohja ei anna lakisääteisiä määräaikoja, pankkisiirtolupauksia tai palkanlaskennan laskelmia.",
    related: { path: "/hr-kalenteri", label: "Tee HR:n vuosikello selaimessa" },
  },
];

export const templatePath = (template) => `${TEMPLATE_PATH}/${template.slug}`;
export function templateAssetPath(template, year, format) {
  if (!TEMPLATE_YEARS.includes(year) || !Object.hasOwn(TEMPLATE_FORMATS, format)) throw new Error("Unsupported template asset.");
  if (!/^[a-z0-9-]+$/.test(template.slug)) throw new Error("Invalid template slug.");
  return `/pohjat/${template.slug}/${year}.${format}`;
}

/** @type {readonly Template[]} */
export const TEMPLATES = Object.freeze(definitions.map((definition) => Object.freeze({
  ...definition,
  category: definition.category ?? definition.id,
  format: Object.keys(TEMPLATE_FORMATS),
  preview: { caption: `${definition.finnishName}: taulukon ensimmäiset viisi riviä`, rows: 5 },
  price: { amount: 0, currency: "EUR" },
  yearApplicability: { years: TEMPLATE_YEARS, defaultYear: TEMPLATE_DEFAULT_YEAR },
  tags: ["ISO-viikot", "Suomi", definition.id === "shifts" || definition.id === "company" ? "päiväkohtainen" : "viikkokohtainen"],
  downloadableAssets: TEMPLATE_YEARS.flatMap((year) => Object.keys(TEMPLATE_FORMATS).map((format) => ({ year, format, path: templateAssetPath(definition, year, format) }))),
  seo: { title: `${definition.finnishName}: Excel ja PDF | Viikko Nro`, description: `${definition.description.split(". ")[0]}. Lataa maksuton Excel-, CSV- tai PDF-pohja.` },
})));

export const templateBySlug = (slug) => TEMPLATES.find((template) => template.slug === slug) ?? null;
export const templateCategory = (id) => TEMPLATE_CATEGORIES.find((category) => category.id === id);
export const templateCatalogMeta = {
  title: "Kalenteri- ja suunnittelupohjat: Excel ja PDF | Viikko Nro",
  description: "Lataa maksuttomat kalenteri- ja suunnittelupohjat yrityksen vuosikalenteriin, lomiin, projekteihin, työvuoroihin, rakennustyömaalle ja HR-tehtäviin.",
};

export function filterTemplates({ category = "all", format = "all" } = {}) {
  return TEMPLATES.filter((template) => (category === "all" || template.category === category) && (format === "all" || template.format.includes(format)));
}
