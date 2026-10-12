# Viikkonro Business Calendar Widget, versio 1

Ohjeet ja esikatselu: `/upota-viikkonumero#yrityskalenteri-widget`.
Upotus: `/widget/calendar/v1`; itsenäinen skripti: `/widget/calendar/v1.js`.
Vanha `/widget/viikko` säilyy ennallaan.

```html
<iframe id="kalenteri" src="https://viikkonro.fi/widget/calendar/v1?view=month&theme=light"
  title="Yrityskalenteri" loading="lazy" referrerpolicy="no-referrer"
  width="650" height="650" style="border:0;width:100%;max-width:650px"></iframe>
```

URL-asetukset: `view=month|week`, `theme=light|dark`, `color=%231f7a5c`
(kuusimerkkinen hex-väri), `date=YYYY-MM-DD`, `holidays=true|false`.
Oletuksena kuukauden kalenteri seuraa Suomen päivää Europe/Helsinki-ajassa.
Kiinteä päivä ei vaihdu ajan mukana. Vuodet 2000..2100. ISO-viikkovuosi voi
erota kalenterivuodesta. Aattojen vapaa riippuu yrityksen käytännöistä.

```js
const frame = document.getElementById('kalenteri');
frame.addEventListener('load', () => {
  frame.contentWindow.postMessage({
    type: 'viikkonro-calendar:configure', version: 1,
    config: {
      view: 'month', theme: 'dark', color: '#2a8c64',
      companyName: 'Yrityksen kalenteri',
      events: [{ id: 'tilaisuus', date: '2027-06-15', title: 'Avoimet ovet' }]
    }
  }, 'https://viikkonro.fi');
});
```

Viesti korvaa koko määrityksen. Enintään 100 tapahtumaa ja 120 merkkiä otsikossa;
yrityksen nimi enintään 160 merkkiä. Valinnainen `endDate` on viimeinen mukana
oleva päivä. Jakso voi olla enintään 400 päivää. Tunnisteet ovat yksilöllisiä
ja valinnaisia. Vain upotuksen suora vanhempi voi toimittaa määrityksen.
Virheellinen viesti ei korvaa kelvollista kalenteria.

Upotuksen korkeus on ylläpitäjän asetettava. Pitkät nimet ja tapahtumalistat
voivat vaatia suuremman korkeuden; iframe sallii vierityksen. Näppäimistöllä
toimivat selauspainikkeet, semanttinen taulukko ja tekstimuotoiset tapahtumat.
Automaattista korkeusviestittelyä tai skriptiä isäntäsivulle ei tarvita.

## Tietosuoja ja turvallisuus

Ei evästeitä, selaintallennusta, analytiikkaa, mainoksia, fonttihakuja,
taustapyyntöjä tai tapahtumien tallennusta. Latauksessa tarvitaan HTML ja yksi
pieni skripti. Hosting-palvelu voi säilyttää tavallisia teknisiä käyttölokeja.
Älä laita nimiä, tapahtumia, API-avaimia tai kalenteritunnisteita URL:iin.
Viittausosoite poistetaan iframe-koodissa ja lähtevistä linkeistä.

Widget ei tunne organisaatioita, Supabasea tai yksityisiä kalentereita eikä
nouda etätapahtumia. Julkiselle sivulle lisätyt tiedot näkyvät sen kävijöille.
Sisäinen portaali vastaa omasta pääsynvalvonnastaan ennen tietojen välittämistä.
Älä välitä terveys- tai työntekijäkohtaisia poissaolotietoja.

Tekstit lisätään `textContent`-rajapinnalla, ei HTML:nä. Päivät, värit ja rajat
validoidaan. Tuntemattomat parametrit hylätään. Enforced CSP estää verkkohaut,
ulkopuoliset skriptit, objektit, lomakkeet ja kehykset. `/widget/`-namespace
sallii ulkoiset upotukset, muun sivuston kehyskäytäntö säilyy.

## Ilmainen ja premium

Ilmainen versio sisältää viikot, pyhät, tapahtumat, yrityksen otsikon ja ulkoasun.
Viikkonro.fi-lähdemerkintä säilyy. `WIDGET_TIERS` erottaa ilmaisen tarjonnan
tulevista premium-ominaisuuksista: oma logo ja varmennettu white-label.
Premium on poissa käytöstä. Selainkenttä, URL tai viesti ei voi avata sitä.
Maksamista tai tekaistua lisenssiä ei toteuteta. Seuraava vaihe tarvitsee
palvelimella varmennetun lisenssin. Lisenssi ei julkaise yksityistä kalenteria.

## Build ja testit

`scripts/build-business-widget.mjs` käyttää nykyistä Viteä erilliseen
IIFE-bundleen. Ei uusia paketteja tai React-runtimea. Päivä-, ISO-, tapahtuma-,
pyhä- ja kuukausirivifunktiot ovat yhteisestä moottorista.

- `src/platform/widget/widget.test.js`: 2026..2028, karkauspäivä, ISO-vuosiraja,
  päällekkäiset tapahtumat ja yksityisten parametrien esto.
- `scripts/business-widget.browser.cases.mjs`: tuotantobundle, CSP,
  ulkoinen iframe, viestilähteet, näppäimistö, mobiili, XSS ja tietosuoja.
- `scripts/predeploy-build.cases.mjs`: tiedostot, kokoraja ja headers.

Koko release gate: `npm run test:predeploy`.

Paikallinen esikatselu: `npm run build` ja `npm run preview`. Widget on
tuotantoartefakti, joten tavallinen Vite-kehityspalvelin ei yksin tuota sitä.
Selaintestin komento on `node scripts/business-widget.browser.cases.mjs`.
Testi tarvitsee Playwrightin ja Chromiumin; tarvittaessa määritä niiden polut
muuttujilla `WIDGET_PLAYWRIGHT_MODULE` ja `WIDGET_CHROMIUM`. Testi käynnistää ja
sulkee itse kaksi paikallista HTTP-palvelinta eikä käytä tuotantopalvelua.

Tekniset ensisijaiset lähteet, tarkistettu 2026-10-11:
[postMessage ja turvallinen kohdeorigin](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
sekä [Viten library build](https://vite.dev/guide/build).

## Tarkistettu tulos 2026-10-11

Koko `npm run test:predeploy` onnistui: lint, 840 testiä 77 tiedostossa,
tuotantobuild, prerenderöinti, 19 artefaktitestiä ja 2 283 sisäisen URL:n crawl.
Saavuttamattomia sivuja, 404-linkkejä ja renderöintivirheitä ei löytynyt.
Kaikki 1 043 olemassa olevaa PDF-tiedostoa säilyivät linkitettyinä.
Tuotantobundlen selaintesti onnistui: ulkoinen iframe, Suomen keskiyö,
karkauspäivä, ISO-vuosiraja, näppäimistö, 320 px leveys, 100 tapahtumaa,
HTML-injektion ja väärän viestilähteen esto sekä verkko-/tallennustarkistus.
Bundle on noin 13,9 KB, gzip noin 5,5 KB. Tuotantodeployta ei tehty.

Lisätyt tiedostot: `src/platform/widget/{model,runtime,widget.test}.js`,
`scripts/build-business-widget.mjs`, `scripts/business-widget.browser.cases.mjs`
ja tämä ohje. Integraatiot: `package.json`, `vercel.json`, `prerender.js`,
`src/pages/WidgetEmbed.jsx`, `scripts/predeploy-build.cases.mjs`, `CLAUDE.md`,
`docs/SEO_CONSTITUTION.md`, `public/ai.txt` ja `public/llms.txt`.

Nykyiset nimipäiväaineiston puutteet ja bundle-/dynamic-import-varoitukset
säilyvät ennallaan. Seuraava vaihe on palvelimella varmennettu premium-lisenssi
ja oma logo. Automaattinen korkeusviestittely voidaan lisätä tarvittaessa.
