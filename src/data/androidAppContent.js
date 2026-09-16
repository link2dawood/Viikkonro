export const ANDROID_APP_PATH = "/android-sovellus";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=fi.viikkonro.app";

export const ANDROID_APP_FACTS = {
  name: "Viikkonro",
  storeName: "Viikkonro: viikkonumero",
  packageId: "fi.viikkonro.app",
  storeUrl: PLAY_STORE_URL,
  price: "0 €",
  minimumAndroid: "Android 7.0 tai uudempi",
  minimumApi: 24,
  languageCount: 22,
  widgetCount: 7,
  updated: "2026-09-16",
};

export const ANDROID_APP_FEATURES = [
  {
    id: "current-week",
    name: "Kuluva viikko heti",
    desc: "Näe ISO-viikkonumero, viikon päivämäärät, päivän numero vuodessa sekä viikon tärkeät kalenteritiedot yhdellä silmäyksellä.",
  },
  {
    id: "calendar",
    name: "Viikot ja kalenteri",
    desc: "Selaa vuoden 52 tai 53 viikkoa, kuukausikalenteria, pyhäpäiviä, liputuspäiviä ja koululomia.",
  },
  {
    id: "calculators",
    name: "Päivä- ja työpäivälaskurit",
    desc: "Laske päivien tai työpäivien määrä sekä muunna päivämäärä viikkonumeroksi tai viikko päivämääriksi.",
  },
  {
    id: "offline",
    name: "Toimii myös ilman verkkoa",
    desc: "Viikkolaskenta ja sovellukseen pakatut kalenteritiedot toimivat ensimmäisestä käynnistyksestä lähtien myös offline-tilassa.",
  },
  {
    id: "languages",
    name: "22 käyttöliittymäkieltä",
    desc: "Käytä sovellusta suomeksi, englanniksi, ruotsiksi ja 19 muulla eurooppalaisella kielellä.",
  },
  {
    id: "themes",
    name: "Vaalea ja tumma tila",
    desc: "Sovellus ja widgetit sopivat puhelimen teemaan. Widgeteissä voi käyttää myös Androidin taustakuvasta johdettuja värejä.",
  },
];

export const ANDROID_WIDGETS = [
  {
    id: "mini",
    name: "Viikko mini",
    desc: "Kuluva viikkonumero mahdollisimman pienessä tilassa.",
    image: "/mobile/android/widget-week-mini.png",
    alt: "Viikko mini -widget, joka näyttää viikon 37",
  },
  {
    id: "card",
    name: "Viikkokortti",
    desc: "Viikkonumero, päivämääräväli ja seuraava tärkeä päivä.",
    image: "/mobile/android/widget-week-card.png",
    alt: "Viikkokortti-widget viikon numerolla ja kalenteritiedoilla",
  },
  {
    id: "strip",
    name: "Viikkonauha",
    desc: "Koko viikon päivät yhdellä vaakarivillä.",
    image: "/mobile/android/widget-week-strip.png",
    alt: "Viikkonauha-widget viikon seitsemälle päivälle",
  },
  {
    id: "month",
    name: "Kuukausi",
    desc: "Kuukausikalenteri viikkonumeroineen suoraan aloitusnäytöllä.",
    image: "/mobile/android/widget-month.png",
    alt: "Kuukausi-widget, jossa näkyvät viikkonumerot ja päivät",
  },
];

export const androidAppFaqs = [
  {
    q: "Mikä Viikkonro-sovellus on?",
    a: "Viikkonro on Android-sovellus ISO 8601 -viikkonumeroiden, kalenteriviikkojen, pyhäpäivien ja päivämäärälaskureiden käyttöön. Sen tekee sama Viikkonro-palvelu kuin viikkonro.fi-sivuston.",
  },
  {
    q: "Onko Viikkonro-sovellus ilmainen?",
    a: "Kyllä. Sovelluksen voi ladata maksutta Google Playsta. Android-versiossa voidaan näyttää yksi suostumuksenhallinnalla ohjattu mainospaikka etusivulla.",
  },
  {
    q: "Toimiiko sovellus ilman verkkoyhteyttä?",
    a: "Kyllä. Viikkolaskenta sekä sovellukseen pakatut kalenteri-, pyhäpäivä- ja koululomatiedot toimivat myös ilman verkkoyhteyttä. Verkkosivun avaaminen ja mainospalvelut tarvitsevat yhteyden.",
  },
  {
    q: "Mitä Android-widgetejä sovelluksessa on?",
    a: "Sovelluksessa on seitsemän aloitusnäytön widgetiä: Viikko mini, Viikkokortti, Viikkonauha, Kuukausi, Laskuri, Pyhät ja liputus sekä Koululomat.",
  },
  {
    q: "Vaatiiko sovellus käyttäjätilin?",
    a: "Ei. Sovelluksessa ei ole käyttäjätilejä eikä pilvisynkronointia. Asetukset ja käyttäjän valinnat tallennetaan paikallisesti laitteelle.",
  },
  {
    q: "Mitä Android-versiota sovellus vaatii?",
    a: "Sovellus toimii Android 7.0:ssa (API 24) ja sitä uudemmissa Android-versioissa.",
  },
];
