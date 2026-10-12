# Viikkonro Business Calendar API v1

API on tarkoitettu palvelinten välisiin integraatioihin. Se ei lue yritysten,
tiimien tai työntekijöiden yksityisiä kalentereita. Nykyiset `/data/*`-tiedostot
ja vanhat API-uudelleenohjaukset säilyvät ennallaan ja maksuttomina.

## Kutsuminen

Kaikki resurssit hyväksyvät vain GET-pyynnön ja otsakkeen
`Authorization: Bearer vnr_<64 heksamerkkiä>`. Avainta ei saa lähettää URL:ssa
tai sijoittaa verkkosivun selainkoodiin. CORS-käyttöä ei avata tässä vaiheessa.

```sh
curl 'https://viikkonro.fi/api/v1/holidays?year=2027' \
  -H "Authorization: Bearer $VIIKKONRO_API_KEY"
```

| Polku | Parametrit | Sisältö |
| --- | --- | --- |
| `/api/v1/calendar` | `year`, valinnainen `rule` | Vuoden kaikki päivät ja ISO-viikot |
| `/api/v1/holidays` | `year` | Pyhät ja aatot, erillinen `official`-tieto |
| `/api/v1/working-days` | `from`, `to`, valinnainen `rule` | Päivät ja laskettava määrä, molemmat rajat mukana |
| `/api/v1/week` | `date` TAI `year` ja `week` | ISO-viikko, viikkovuosi, maanantai ja sunnuntai |
| `/api/v1/paydays` | `year`, valinnainen `day=1..31` tai `last` | Sovittu ja edeltävään pankkipäivään siirretty päivä |
| `/api/v1/flag-days` | `year` | Liputuspäivät ja luokittelu |
| `/api/v1/school-holidays` | `year`, `city` | Aineistossa olevat hiihto- ja syyslomajaksot |

Vuosi on 2000..2100. Päivämäärät ovat `YYYY-MM-DD`. Työpäiväjakso on enintään
366 kalenteripäivää. Tuntemattomat ja toistetut parametrit hylätään.
Koululomien saatavuus riippuu nykyisestä aineistosta; puuttuvia vuosia tai
kaupunkeja ei arvata. Esimerkiksi `year=2027&city=Helsinki` käyttää nykyistä
aineistoa. Vastauksessa näkyvät lähdeviite, osittainen kattavuus ja arviot.

Päivämäärät ovat suomalaisia kalenteripäiviä, eivät UTC-aikaleimoja.
`timezone` on `Europe/Helsinki`. `weekYear` voi erota kalenterivuodesta.
Käyttökiintiön kuukausi ja minuutti vaihtuvat UTC-ajassa.

Sallitut `rule`-arvot ovat nykyisen moottorin `FINLAND_WORKDAY` (oletus),
`FINLAND_PROJECT`, `FINLAND_SPRINT`, `FINLAND_PLANNER`, `FINLAND_BANKING` ja
`FINLAND_STATUTORY_LEAVE`. Vastauksen `disclosure` kertoo valitun säännön.
Vuosiloman lakisääteinen laskenta ja suunnittelun työpäivät ovat eri sääntöjä.
Työehtosopimuksen, sopimuksen ja yrityksen käytäntöjen soveltuvuus on tarkistettava
erikseen. API ei todista oikeudellista vaatimustenmukaisuutta.

Onnistunut vastaus: `{ "version": "v1", "timezone": "Europe/Helsinki", "data": {...} }`.
Virhe: `{ "version": "v1", "error": { "code": "...", "requestId": "..." } }`.
Virheet: 400 `invalid_parameters`, 401 `invalid_api_key`, 404 `not_found`,
405 `method_not_allowed`, 429 `rate_limit` tai `usage_limit`, 503 `unavailable`.
429 ja 503 sisältävät `Retry-After`-otsakkeen sekunteina. Onnistunut vastaus
sisältää `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-Usage-Limit` ja
`X-Usage-Remaining`. Vastauksia ei välimuistiteta CDN:ssä.

## Avaimet, kiintiöt ja käyttöönotto

Yksi nykyinen Supabase-projekti riittää. Redis-palvelua tai uutta tietokantaa ei
tarvita. Sovella `supabase/migrations/202610100003_business_api.sql` SQL-editorilla
tai hallitulla migraatiolla. Se ei tarvitse tiimitauluja eikä muuta niitä.

Palvelimen ympäristömuuttujat: `BUSINESS_API_SUPABASE_URL` ja
`BUSINESS_API_SUPABASE_SECRET` (Supabasen secret-avain tai legacy service-role
JWT). Älä käytä `VITE_*`-muuttujia. Publishable-avain ei riitä. Puuttuva backend
palauttaa 503; muistissa toimivaa näennäistä tuotantorajoitinta ei ole.

Operaattori myöntää ensimmäiset avaimet manuaalisesti:

```sql
select public.business_api_issue('Integraation tunniste');
-- Palauta avain käyttäjälle turvallisesti kerran, älä tallenna lokiin.
select public.business_api_revoke('AVAIMEN_UUID');
```

Ilmainen avain: 30 hyväksyttyä pyyntöä minuutissa, 10 000 kuukaudessa,
voimassa 90 päivää. Kiintiöt ovat avainkohtaisia ja kattavat kaikki endpointit.
Avaimen salaisuus on 256-bittinen; tietokannassa on vain SHA-256-tiiviste.
Uusi avain ja vanhan peruminen toteuttavat kierron. Operaattori hallitsee
myöntämistä; itsepalvelua tai maksujen vastaanottamista ei ole.

`paid_preview`-taso ja rajatut avainkohtaiset kiintiökentät mahdollistavat
myöhemmän maksullisen tason. Niitä voi muuttaa vain tietokannan operaattori.
Tilauksia, veloituksia tai automaattisia maksullisia oikeuksia ei toteuteta.
Kiintiöt ja hinnat on päätettävä vasta laadun ja kysynnän validoinnin jälkeen.

## Valvonta ja turvallisuusarvio (2026-10-10)

Tietokannan rivikohtainen lukitus tekee rajoituksista yhteisiä kaikille
serverless-instansseille. Laskurit ja endpointkohtainen kuukausikäyttö päivittyvät
samassa transaktiossa. Perutut ja vanhentuneet avaimet hylätään välittömästi.
API-taulut ovat `private`-skeemassa ja RLS on käytössä. Taulujen suorat oikeudet
on poistettu myös gateway-roolilta. RPC-funktioiden hakupolku on lukittu ja vain
palvelimen rooli saa kutsua niitä. Tavallinen käyttäjä ei saa myöntää avaimia,
muuttaa kiintiöitä tai lukea toisen avaimen käyttöä.

Palvelin kirjaa vain satunnaisen requestId:n, tunnetun endpointin, HTTP-statuksen
ja keston. Ei IP-osoitteita, otsakkeita, avaimia, parametreja tai kalenteritietoja.
Operaattori seuraa 401-, 429- ja 503-osuuksia sekä viivettä Vercelin lokeista.
Kuukausikäyttö on `private.business_api_usage`-taulussa; määritä ylläpidossa
lokien säilytysaika ja poista vanhat käyttökuukaudet sovitun käytännön mukaan.

Tarkistetut hyökkäyspinnat: parametrien massasyöttö, prototyyppiavaimet,
virheelliset päivämäärät, avaimet URL:ssa, oikeuksien ohitus RPC:n kautta,
salaisuuksien vuotaminen virheisiin, palvelimen uudelleenohjaukset ja
kiintiöiden rinnakkaisuus. Virheellisiä avaimia ei tallenneta tietokantaan.
Vercel/Cloudflare-palomuuriin pitää asettaa erillinen IP-/DDoS-raja ennen
julkista avaamista: avainkohtainen kiintiö ei torju avaimettomien pyyntöjen
kuormitusta. Ohita CDN-välimuisti `/api/v1/*`-poluilla. Älä lokita Authorizationia
välityspalvelimessa. Oikean projektin migraatio, secret-asetus, palomuuri ja
staging-savukoe jäävät operaattorin käyttöönottoon; tätä ei ole julkaistu.

Testit: `src/platform/api/api.test.js` ja `scripts/business-api-db.cases.sql`.
Jälkimmäinen sisältyy `npm run test:team:database`-komentoon, joka käyttää vain
uutta väliaikaista PostgreSQL-klusteria.
Rinnakkaisuustesti käynnistää kahdeksan erillistä tietokantayhteyttä yhden
pyynnön kiintiötä vastaan: vain yksi hyväksytään. HTTP-testit kattavat vuodet
2026, 2027 ja 2028, karkauspäivän, ISO-vuosirajan, virhekoodit, lähteistetyn
koululomadatan ja salaisuuksien poistamisen vastauksista ja lokimerkinnöistä.

## Muutetut tiedostot

- `api/v1/[resource].js`: Vercel-gateway, avaimen tiivistys ja server-only RPC.
- `src/platform/api/{calendar,handler,api.test}.js`: moottorin sovitin,
  HTTP-sopimus ja 31 testiä.
- `supabase/migrations/202610100003_business_api.sql`: avaimet, käyttö ja kiintiöt.
- `scripts/business-api-db.cases.sql` ja `scripts/team-db.cases.mjs`:
  oikeuksien, kiintiöiden ja rinnakkaisuuden tietokantatestit.
- `.env.example`, `eslint.config.js`, `CLAUDE.md`, `SECURITY.md` ja tämä dokumentti:
  palvelinasetukset, tarkistukset ja ylläpito-ohjeet.

## Tarkistuksen tulos 2026-10-10

`npm run test:predeploy` onnistui: lint, 815 testiä 76 tiedostossa, tuotantobuild,
prerenderöinti, 18 tuotantoartefaktitestiä ja 2 283 sisäisen URL:n tarkistus.
404-linkkejä, saavuttamattomia sivukartan sivuja ja renderöintivirheitä ei löytynyt.
Kaikki 1 043 olemassa olevaa PDF-tiedostoa säilyivät HTML-sivuilta linkitettyinä.
`npm run test:team:database` onnistui 85 oikeus- ja eristysväitteellä, mukaan
lukien API:n rinnakkainen kiintiötesti. Päivämäärät tarkistettiin lisäksi UTC-,
Europe/Helsinki- ja America/New_York-palvelinaikavyöhykkeissä.

Nykyinen nimipäiväaineiston puute sekä olemassa olevat bundle-/dynamic-import-
varoitukset säilyvät. API-muutos ei lisää client-bundleen serverisalaisuuksia
eikä muuta nykyisiä julkisia kalenterisivuja tai feed-uudelleenohjauksia.
Oikean Supabase-projektin API-migraatiota tai tuotantodeployta ei tehty.

Suunnittelun ensisijaiset lähteet, tarkistettu 2026-10-10:
[Supabase-funktioiden oikeudet](https://supabase.com/docs/guides/database/functions),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Vercelin Node.js-funktiot](https://vercel.com/docs/functions/runtimes/node-js).
