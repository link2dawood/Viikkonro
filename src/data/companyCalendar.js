// Content and defaults for /yrityskalenteri, the company calendar builder.
// Plain .js so prerender.js can import it for the page's FAQ and HowTo schema,
// which read the same functions as the visible page.
import { navigationYearTargets } from "../components/dateUtils.js";
import { schoolHolidayCities } from "../platform/calendar/sources.js";

export const COMPANY_CALENDAR_PATH = "/yrityskalenteri";
export const COMPANY_CALENDAR_PRODUCT = "company-calendar";
export const COMPANY_CALENDAR_UPDATED = "2026-10-10";
export const DEFAULT_BRAND_COLOR = "#1f7a5c";

/**
 * The years a calendar can be made for (this, next, the one after) and the one
 * to start on. From 1 October the site promotes next year's calendar, so the
 * default and the page's headline follow the same rule.
 */
export function companyCalendarYears(today = new Date()) {
  const { currentYear, promotedYear } = navigationYearTargets(today);
  return { years: [currentYear, currentYear + 1, currentYear + 2], defaultYear: promotedYear };
}

/** The form's starting state: sensible, and valid without any input. */
export function defaultCompanyCalendarInput(year) {
  return {
    year,
    dayRuleMode: "FINLAND_PLANNER",
    include: { weekNumbers: true, holidays: true, flagDays: false, paydays: null, schoolHolidays: null },
    paydayDates: [],
    events: [],
    periods: [],
    branding: { companyName: "", logo: null, primaryColor: DEFAULT_BRAND_COLOR, accentColor: null },
    theme: "classic",
    layout: { id: "year-glance", paper: "A4" },
    product: COMPANY_CALENDAR_PRODUCT,
  };
}

export const LAYOUT_OPTIONS = Object.freeze([
  { id: "year-glance", name: "Koko vuosi yhdellä sivulla", hint: "Kaikki 12 kuukautta, viikkonumerot ja päivälista." },
  { id: "month-page", name: "Yksi kuukausi sivulla", hint: "Iso kuukausinäkymä, jossa päivät näkyvät ruuduissa." },
  { id: "week-list", name: "Viikkonumeroluettelo", hint: "Jokainen viikko päivineen ja merkittävine päivineen." },
]);

export const PAYDAY_RULES = Object.freeze([
  { id: "none", name: "Ei toistuvaa palkkapäivää" },
  { id: "day", name: "Kuukauden päivä" },
  { id: "last", name: "Kuukauden viimeinen pankkipäivä" },
]);

/** File name for an export: the company's name in plain letters, or a default. */
export function exportFilename(config, extension) {
  const slug = config.branding.companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30)
    .replace(/-$/, "");
  return `${slug ? `${slug}-kalenteri` : "yrityskalenteri"}-${config.year}.${extension}`;
}

export const companyCalendarMeta = {
  title: "Yrityskalenteri: tee oma kalenteri logolla | Viikko Nro",
  description:
    "Tee yrityksellesi oma kalenteri: lisää logo, sulku- ja palkkapäivät sekä tärkeät päivät. Valmis PDF-, Excel-, CSV- ja ICS-tiedosto viikkonumeroineen.",
};

export function companyCalendarFaqs() {
  return [
    {
      q: "Mitä yrityskalenteri sisältää?",
      a: "Kalenterissa on ISO-viikkonumerot, Suomen pyhäpäivät ja halutessasi liputuspäivät ja koululomat. Lisäksi voit lisätä yrityksen logon ja värin, sulkupäivät, palkkapäivät, lomakauden ja omat tärkeät päivät.",
    },
    {
      q: "Missä muodoissa saan valmiin kalenterin?",
      a: "Kalenterista tulee tulostusvalmis PDF sekä Excel-, CSV- ja ICS-tiedosto. PDF-kalenterin voi valita kolmessa asettelussa: koko vuosi yhdellä sivulla, yksi kuukausi sivulla tai viikkonumeroluettelo. Pitkät merkinnät ja päivät, jotka eivät mahdu näkymään kokonaan, löytyvät PDF:n erillisestä luettelosta. ICS-tiedoston voi tuoda Google-kalenteriin, Outlookiin tai iPhonen kalenteriin.",
    },
    {
      q: "Onko kalenterin tekeminen ilmaista?",
      a: "Muokkaus ja esikatselu ovat ilmaisia. Esikatselussa on vesileima, eikä siinä näy logo. Maksullinen kertamaksu avaa valitun kalenterivuoden PDF-, Excel-, CSV- ja ICS-lataukset vuoden loppuun. Hinta ja maksupalvelun saatavuus näkyvät editorissa ennen ostoa. Ostosta ei synny tilausta.",
    },
    {
      q: "Lähtevätkö logoni ja yrityksen tiedot palvelimelle?",
      a: "Esikatselu ja luonnos ovat vain selaimessasi. Maksullista tiedostoa luotaessa kalenterin tiedot ja logo lähetetään suojatulle palvelimelle tiedoston tekemistä varten. Niitä ei tallenneta kalenteritietokantaan eikä lähetetä Polarille tai analytiikkaan. Polar käsittelee maksun ja kuitin. Luonnoksen voi tyhjentää editorin painikkeella.",
    },
    {
      q: "Miten viikkonumerot näkyvät kalenterissa?",
      a: "Kaikissa asetteluissa jokaisella viikolla on ISO 8601 -viikkonumero: viikko alkaa maanantaina ja viikko 1 on se, jonka torstai on vuoden ensimmäinen. Excel- ja CSV-tiedostoissa on oma viikkosarake ja Excelissä lisäksi viikkolista.",
    },
    {
      q: "Miten palkkapäivät määritetään?",
      a: "Voit lisätä yksittäiset palkkapäivät käsin. Ne merkitään täsmälleen antamillesi päiville. Toistuvaksi palkkapäiväksi voit valita kuukauden päivän tai kuukauden viimeisen pankkipäivän. Jos toistuvan säännön sovittu päivä ei ole pankkipäivä, se siirtyy edelliseen pankkipäivään, kuten palkkapäivät-sivullakin.",
    },
    {
      q: "Mistä koululomat tulevat?",
      a: `Koululomat tulevat sivuston koululomatiedoista, ja ne voi valita kaupungeittain. Tietoa on ${schoolHolidayCities(2026).length} kaupungille vuodelle 2026, ja osalle vuosista vain vahvistetuista kaupungeista. Tarkista aina oman koulusi päivät.`,
    },
  ];
}

export const COMPANY_CALENDAR_STEPS = [
  "Kirjoita yrityksen nimi, lisää logo ja valitse väri ja kalenterin vuosi.",
  "Lisää sulkupäivät, tärkeät päivät, palkkapäivät ja mahdollinen lomakausi.",
  "Valitse Suomen pyhäpäivät, liputuspäivät ja koululomat sekä kalenterin asettelu.",
  "Tarkista esikatselu, jossa viikkonumerot näkyvät jokaisella viikolla.",
  "Lataa valmis kalenteri PDF-, Excel-, CSV- tai ICS-muodossa.",
];
