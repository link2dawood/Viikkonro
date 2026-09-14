// Content for /chrome-extension — the landing page for the "Viikko Nro –
// viikkonumero" Chrome extension. Plain .js (not .jsx), same reason as
// openDataContent.js: prerender.js (plain Node) needs these exports directly
// for the page's SoftwareApplication/HowTo/FAQPage JSON-LD, so the visible
// page and the structured data read one source and can't drift.
//
// Every fact below is taken from the extension's own Chrome Web Store
// listing (version, size, languages, permissions, feature list). When the
// extension ships a new version, update EXTENSION_FACTS here — nowhere else.
import { isoWeek, isoYear, mondayOf, weeksInIsoYear } from "../components/dateUtils.js";

export const CHROME_EXTENSION_PATH = "/chrome-extension";

export const EXTENSION_FACTS = {
  name: "Viikko Nro – viikkonumero",
  storeUrl:
    "https://chromewebstore.google.com/detail/viikko-nro-%E2%80%93-viikkonumero/cljdpfclijdndkcphkgagcoodpdafajg",
  extensionId: "cljdpfclijdndkcphkgagcoodpdafajg",
  version: "0.1.0",
  updated: "2026-09-14",
  updatedFi: "14.9.2026",
  size: "266 KiB",
  languagesFi: "suomi ja englanti",
  languageCodes: ["fi", "en"],
  categoryFi: "Työnkulku ja suunnittelu",
  category: "Workflow & Planning",
  cityCount: 21,
  permissionCount: 2,
};

// Feature cards — also emitted as SoftwareApplication.featureList.
export const EXTENSION_FEATURES = [
  {
    id: "toolbar",
    name: "Viikkonumero työkalupalkissa",
    desc: "Kuvakkeessa näkyy kuluvan viikon numero, esimerkiksi 42 tai vk42. Numero päivittyy itsestään keskiyöllä.",
  },
  {
    id: "popup",
    name: "Viikon päivämäärät yhdellä klikkauksella",
    desc: "Ponnahdusikkuna näyttää viikon maanantaista sunnuntaihin, vuoden etenemisen sekä nuolet edellisiin ja tuleviin viikkoihin.",
  },
  {
    id: "omnibox",
    name: "Viikkohaku osoiteriviltä",
    desc: "Kirjoita osoiteriville vk ja viikon numero tai päivämäärä – Enter avaa viikon sivun viikkonro.fi-palvelussa.",
  },
  {
    id: "flagdays",
    name: "Liputuspäivät",
    desc: "Ponnahdusikkuna kertoo päivän liputuspäivän, esimerkiksi Aleksis Kiven päivän.",
  },
  {
    id: "schoolholidays",
    name: "Koululomat 21 kaupunkiin",
    desc: "Valitse kaupunkisi, niin näet seuraavan hiihto- tai syysloman ja montako päivää lomaan on.",
  },
  {
    id: "privacy",
    name: "Yksityinen ja offline",
    desc: "Ei tietojen keräämistä, analytiikkaa tai mainoksia. Toimii ilman verkkoyhteyttä.",
  },
];

// Install steps — rendered as the visible <ol> and as the HowTo node.
export const INSTALL_STEPS = [
  {
    name: "Avaa Chrome Web Store",
    text: "Avaa Viikko Nro – viikkonumero -laajennuksen sivu Chrome Web Storessa Google Chrome -selaimella.",
  },
  {
    name: "Lisää Chromeen",
    text: "Valitse Lisää Chromeen ja vahvista valinta Lisää laajennus.",
  },
  {
    name: "Kiinnitä kuvake työkalupalkkiin",
    text: "Avaa selaimen laajennusvalikko (palapelikuvake) ja kiinnitä Viikko Nro, jotta viikkonumero näkyy aina työkalupalkissa.",
  },
  {
    name: "Valitse kaupunki ja kieli",
    text: "Avaa ponnahdusikkuna ja valitse asetuksista kaupunkisi koululomia varten. Kieli seuraa selaimen kieltä, ja sen voi vaihtaa asetuksista.",
  },
];

// Address-bar (omnibox) examples. Week/date ranges are computed from the real
// ISO week math in dateUtils.js at render time, never hand-typed.
export function omniboxExamples(now = new Date()) {
  const year = isoYear(now);
  const nextYear = year + 1;
  const range = (week, y) => {
    const mo = mondayOf(week, y);
    const su = new Date(mo);
    su.setDate(mo.getDate() + 6);
    return `${mo.getDate()}.${mo.getMonth() + 1}.–${su.getDate()}.${su.getMonth() + 1}.${su.getFullYear()}`;
  };
  const sampleDate = new Date(year, 9, 13); // 13.10. of the current ISO year
  return [
    {
      input: "vk 42",
      result: `Viikon 42 päivämäärät (${range(42, year)})`,
      href: `/viikko-42-${year}`,
    },
    {
      input: `vk 42 ${nextYear}`,
      result: `Viikko 42 vuonna ${nextYear} (${range(42, nextYear)})`,
      href: `/viikko-42-${nextYear}`,
    },
    {
      input: `vk 13.10.${sampleDate.getFullYear()}`,
      result: `Viikko, jolle päivämäärä osuu: viikko ${isoWeek(sampleDate)}`,
      href: `/viikko-${isoWeek(sampleDate)}-${isoYear(sampleDate)}`,
    },
  ];
}

// Shared with prerender.js's FAQPage JSON-LD — identical questions and
// answers on the page and in the schema (SEO constitution invariant #9).
export function chromeExtensionFaqs(now = new Date()) {
  const year = isoYear(now);
  const weeks = weeksInIsoYear(year);
  const lastMonday = mondayOf(weeks, year);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  const fmt = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  const f = EXTENSION_FACTS;
  const ex = omniboxExamples(now);
  return [
    {
      q: "Mikä on Viikko Nro -Chrome-laajennus?",
      a: "Viikko Nro – viikkonumero on ilmainen Google Chrome -laajennus, joka näyttää kuluvan ISO 8601 -viikon numeron selaimen työkalupalkissa. Ponnahdusikkunassa näkyvät viikon päivämäärät, vuoden eteneminen, päivän liputuspäivä ja valitsemasi kaupungin seuraava koululoma. Laajennuksen tekee viikkonro.fi.",
    },
    {
      q: "Miten laajennus asennetaan?",
      a: "Avaa laajennuksen sivu Chrome Web Storessa, valitse Lisää Chromeen ja vahvista. Kiinnitä Viikko Nro sen jälkeen työkalupalkkiin laajennusvalikosta, niin viikkonumero näkyy aina.",
    },
    {
      q: "Onko laajennus ilmainen?",
      a: "Kyllä. Laajennus on maksuton, eikä siinä ole mainoksia, analytiikkaa tai rekisteröitymistä.",
    },
    {
      q: "Miten viikkonumero lasketaan?",
      a: "Viikko alkaa maanantaista. Vuoden ensimmäinen viikko on se, jolle osuu vuoden ensimmäinen torstai. Siksi tammikuun alun päivät voivat kuulua edellisen vuoden viimeiseen viikkoon. Laskenta noudattaa ISO 8601 -standardia, joten numero vastaa suomalaisia kalentereita ja työvuorolistoja.",
    },
    {
      q: "Montako viikkoa vuodessa on?",
      a: `52 tai 53. Vuodessa ${year} on ${weeks} viikkoa, ja viikko ${weeks} kestää ${fmt(lastMonday)}–${fmt(lastSunday)}.`,
    },
    {
      q: "Miten haen viikkoa osoiteriviltä?",
      a: `Kirjoita osoiteriville vk, välilyönti ja viikon numero tai päivämäärä: ${ex[0].input} näyttää viikon 42 päivämäärät, ${ex[1].input} viikon 42 vuonna ${year + 1} ja ${ex[2].input} viikon, jolle päivämäärä osuu. Enter avaa viikon sivun viikkonro.fi-palvelussa.`,
    },
    {
      q: "Päivittyykö viikkonumero automaattisesti?",
      a: "Kyllä. Numero päivittyy itsestään keskiyöllä, kun uusi viikko alkaa, joten sitä ei tarvitse päivittää käsin.",
    },
    {
      q: "Kerääkö laajennus tietojani?",
      a: `Ei. Laajennus ei kerää tietoja eikä näe avaamiesi sivujen sisältöä. Se pyytää vain ${f.permissionCount} käyttöoikeutta: tallennuksen asetuksia varten ja ajastimen keskiyön päivitystä varten.`,
    },
    {
      q: "Toimiiko laajennus ilman verkkoyhteyttä?",
      a: "Kyllä. Viikkonumero, päivämäärät, liputuspäivät ja koululomat toimivat ilman verkkoyhteyttä. Vain viikon sivun avaaminen viikkonro.fi-palvelussa vaatii yhteyden.",
    },
    {
      q: "Mistä koululomien päivämäärät tulevat?",
      a: `Koululomien päivämäärät perustuvat Opetushallituksen ja kaupunkien virallisiin päätöksiin. Laajennus kattaa ${f.cityCount} suomalaista kaupunkia. Jos kaupunki ei ole vielä vahvistanut lomaansa, laajennus kertoo sen eikä arvaa päivämäärää.`,
    },
    {
      q: "Millä kielillä laajennus toimii?",
      a: "Suomeksi ja englanniksi. Kieli seuraa selaimen kieltä, ja sen voi vaihtaa asetuksista.",
    },
  ];
}
