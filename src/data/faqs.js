// Single source of truth for all FAQ content (Finnish).
//
// This drives THREE outputs, all generated from this one file so they never
// drift: the visible /ukk page (FAQPage.jsx) + home featured block (FAQ.jsx),
// the FAQPage JSON-LD injected into /ukk by prerender.js, and the generated
// dist/llms-full.txt. Edit here only.

export const faqCategories = [
  {
    title: "Kuluva viikko",
    items: [
      {
        featured: true,
        q: "Mikä viikko nyt on?",
        a: "Kuluva viikkonumero lasketaan ISO 8601 -standardin mukaan: viikko alkaa maanantaina ja päättyy sunnuntaina. Viikkonro.fi näyttää tämänhetkisen viikon numeron, alkamis- ja päättymispäivän sekä sen, monesko viikko vuodesta on kyseessä. Numero päivittyy automaattisesti joka maanantai kello 00.00.",
      },
      {
        q: "Monesko viikko nyt menee?",
        a: "Sama kuin kuluva viikkonumero – katso se etusivun laskurista. Suomessa viikot numeroidaan ISO 8601 -standardilla, ja vuoteen mahtuu 52 tai 53 viikkoa.",
      },
      {
        q: "Mikä viikko on tänään?",
        a: "Tämän päivän viikkonumero näkyy etusivulla. Viikko vaihtuu aina maanantaina, joten numero päivittyy automaattisesti viikon alussa.",
      },
      {
        q: "Millä viikolla ollaan nyt?",
        a: "Viikkonumero kertoo, monesko vuoden viikko on meneillään. Suomessa numerointi seuraa ISO 8601 -standardia, jossa vuoden ensimmäinen viikko on se, johon osuu vuoden ensimmäinen torstai. Vuodessa on 52 tai 53 viikkoa.",
      },
      {
        q: "Mikä on tämän viikon numero ja päivämäärät?",
        a: "Etusivu näyttää kuluvan viikon numeron sekä sen alkamis- (maanantai) ja päättymispäivän (sunnuntai).",
      },
    ],
  },
  {
    title: "Tietyn päivän viikko",
    items: [
      {
        featured: true,
        q: "Miten selvitän tietyn päivän viikkonumeron?",
        a: "Valitse päivämäärä etusivun päivämäärähausta, niin näet kyseisen päivän viikkonumeron, vuoden ja viikon ajanjakson – minkä tahansa menneen tai tulevan päivän osalta.",
      },
      {
        q: "Millä viikolla jokin päivämäärä on?",
        a: "Syötä päivämäärä etusivun hakuun; palvelu kertoo sen viikkonumeron ISO 8601 -standardin mukaan.",
      },
      {
        q: "Miten selvitän, mille viikolle tietty päivämäärä osuu?",
        a: "Etsi se maanantai, joka edeltää päivämäärää tai on sama päivä, ja katso kyseisen maanantain viikkonumero — koko maanantaista sunnuntaihin kestävä jakso kuuluu samaan viikkoon. Viikkonro.fi laskee minkä tahansa päivämäärän viikon automaattisesti.",
      },
      {
        q: "Mikä viikko on ensi maanantaina?",
        a: "Näet tulevan viikon etusivun laskurista tai avaamalla suoraan seuraavan viikon sivun. Uusi viikko alkaa aina maanantaista.",
      },
      {
        q: "Voiko sama päivä kuulua kahteen eri viikkoon?",
        a: "Ei voi. ISO 8601 -standardissa jokainen päivä kuuluu täsmälleen yhteen viikkoon. Vuodenvaihteessa päivä voi kuitenkin kuulua eri vuoden viikkoon kuin mitä kalenterivuosi antaisi olettaa: esimerkiksi 1. tammikuuta voi kuulua edellisen vuoden viikkoon 52 tai 53.",
      },
    ],
  },
  {
    title: "Viikkonumeron lyhenteet ja merkintätavat",
    items: [
      {
        q: "Mitä lyhenne vk tarkoittaa?",
        a: "Vk on suomen kielen lyhenne sanasta viikko. Merkintä vk 30 tarkoittaa samaa kuin viikko 30. Sitä käytetään yleisesti työpaikoilla, aikatauluissa ja toimitusilmoituksissa.",
      },
      {
        q: "Mitä lyhenne vko tarkoittaa?",
        a: "Vko on vaihtoehtoinen lyhenne sanasta viikko, ja se tarkoittaa täsmälleen samaa kuin vk. Molemmat ovat yleisiä suomalaisessa käytössä: vko 8 ja vk 8 viittaavat samaan kahdeksanteen viikkoon.",
      },
      {
        q: "Mitä tarkoittaa viikko 30/2026?",
        a: "Merkintä viikko 30/2026 tarkoittaa vuoden 2026 kolmattakymmenettä viikkoa. Kauttaviivan jälkeinen luku on vuosi. ISO 8601 -standardin mukainen kansainvälinen kirjoitusasu samalle viikolle on 2026-W30.",
      },
      {
        q: "Miten viikkonumero kirjoitetaan oikein?",
        a: "Suomessa yleisimmät muodot ovat viikko 30, vk 30 ja vko 30. Vuosiluku lisätään kauttaviivalla (viikko 30/2026) tai pilkulla. Kansainvälisissä ja teknisissä yhteyksissä käytetään ISO-muotoa 2026-W30.",
      },
      {
        q: "Miksi eri kalenterit näyttävät eri viikkonumeron?",
        a: "Eroa syntyy kahdesta eri numerointitavasta. ISO 8601 -standardissa viikko alkaa maanantaista ja vuoden ensimmäinen viikko sisältää ensimmäisen torstain. Yhdysvaltain käytännössä viikko alkaa sunnuntaista ja viikko 1 on se, johon 1. tammikuuta osuu. Suomessa käytetään aina ISO-viikkoa.",
      },
    ],
  },
  {
    title: "Viikon alkaminen ja ISO 8601",
    items: [
      {
        featured: true,
        q: "Alkaako viikko maanantaista vai sunnuntaista?",
        a: "Suomessa ja koko Euroopassa viikko alkaa maanantaista ja päättyy sunnuntaihin ISO 8601 -standardin mukaan. Esimerkiksi Yhdysvalloissa viikko alkaa usein sunnuntaista.",
      },
      {
        q: "Mikä on viikon ensimmäinen päivä Suomessa?",
        a: "Maanantai. ISO 8601 -standardin mukaan viikko alkaa aina maanantaista.",
      },
      {
        q: "Milloin viikko vaihtuu?",
        a: "Viikko vaihtuu sunnuntain ja maanantain välisenä yönä kello 00.00. Jokainen viikko kestää tasan seitsemän vuorokautta.",
      },
      {
        q: "Mikä on ISO 8601 -standardi?",
        a: "Kansainvälinen standardi päivämäärien ja viikkojen esittämiseen: viikko alkaa maanantaista, ja vuoden ensimmäinen viikko sisältää vuoden ensimmäisen torstain.",
      },
      {
        q: "Käyttävätkö kaikki maat samaa viikkonumerointia?",
        a: "Eivät. Eurooppa käyttää ISO 8601:tä, kun taas esimerkiksi Yhdysvalloissa viikko alkaa sunnuntaista ja viikko 1 määritellään eri tavalla.",
      },
    ],
  },
  {
    title: "Viikkonumeron laskenta",
    items: [
      {
        featured: true,
        q: "Miten viikkonumero lasketaan?",
        a: "Vuoden ensimmäinen viikko on se, joka sisältää vuoden ensimmäisen torstain (aina 4. tammikuuta). Siitä eteenpäin jokainen maanantaista alkava jakso kasvattaa viikkonumeroa yhdellä.",
      },
      {
        q: "Mikä on vuoden ensimmäinen viikko?",
        a: "Viikko 1 on se viikko, johon osuu vuoden ensimmäinen torstai – käytännössä aina viikko, joka sisältää 4. tammikuuta.",
      },
      {
        q: "Mihin viikkoon 1. tammikuuta kuuluu?",
        a: "Se riippuu viikonpäivästä: jos 1. tammikuuta on maanantain ja torstain välillä, se kuuluu viikkoon 1; jos perjantain ja sunnuntain välillä, se kuuluu edellisen vuoden viimeiseen viikkoon (52 tai 53).",
      },
      {
        q: "Mihin viikkoon uudenvuodenpäivä kuuluu?",
        a: "Sama kuin 1. tammikuuta: joko uuden vuoden viikkoon 1 tai edellisen vuoden viikkoon 52/53, viikonpäivästä riippuen.",
      },
      {
        q: "Miksi tammikuun alkupäivät voivat olla viikkoa 52 tai 53?",
        a: "Koska viikko lasketaan kokonaisena maanantaista sunnuntaihin, vuoden ensimmäiset päivät voivat kuulua edellisen vuoden viimeiseen viikkoon, jos kyseisen viikon torstai osuu vielä vanhalle vuodelle.",
      },
    ],
  },
  {
    title: "Viikkojen määrä vuodessa",
    items: [
      {
        featured: true,
        q: "Kuinka monta viikkoa vuodessa on?",
        a: "Useimmissa vuosissa on 52 viikkoa. Noin joka viides tai kuudes vuosi on 53 viikon vuosi.",
      },
      {
        featured: true,
        q: "Milloin vuodessa on 53 viikkoa?",
        a: "Vuodessa on 53 viikkoa, kun se alkaa torstaista, tai kun karkausvuosi alkaa keskiviikosta.",
      },
      {
        q: "Miten tiedän, onko vuodessa 52 vai 53 viikkoa?",
        a: "Vuodessa on 53 viikkoa kahdessa tapauksessa: kun 1. tammikuuta on torstai, tai kun karkausvuosi alkaa keskiviikkona. Kaikkina muina vuosina viikkoja on 52. Sääntö toistuu keskimäärin joka viides tai kuudes vuosi.",
      },
      {
        q: "Mitkä tulevat vuodet ovat 53 viikon vuosia?",
        a: "53 viikon vuosia ovat muun muassa 2026, 2032, 2037, 2043 ja 2048. Vuosi 2020 oli edellinen. Muina vuosina viikkoja on 52.",
      },
      {
        q: "Kuinka monta viikkoa on puolessa vuodessa?",
        a: "Puolessa vuodessa on noin 26 viikkoa. Tarkka jako riippuu vuodesta: 52 viikon vuonna ensimmäiselle vuosipuoliskolle osuu viikot 1–26 ja jälkimmäiselle 27–52, kun taas 53 viikon vuonna jälkimmäinen puolisko on viikon pidempi.",
      },
      {
        q: "Kuinka monta viikkoa on kuukaudessa?",
        a: "Kuukaudessa on 4–5 viikkoa. 30- ja 31-päiväiset kuukaudet ulottuvat käytännössä viidelle eri viikolle, koska kuukausi alkaa harvoin maanantaista. Helmikuussa on tasan neljä viikkoa vain silloin, kun se alkaa maanantaina eikä ole karkausvuosi.",
      },
      {
        q: "Monesko viikko vuodesta on kulunut?",
        a: "Kuluneiden viikkojen määrä on nykyinen viikkonumero miinus yksi. Esimerkiksi viikolla 30 vuodesta on kulunut 29 täyttä viikkoa ja jäljellä on 22 tai 23 viikkoa sen mukaan, onko vuodessa 52 vai 53 viikkoa.",
      },
      {
        q: "Kuinka monta viikkoa vuonna 2026 on?",
        a: "Vuonna 2026 on 53 viikkoa, koska vuosi alkaa torstaista.",
      },
      {
        q: "Kuinka monta viikkoa vuonna 2025 on?",
        a: "Vuonna 2025 on 52 viikkoa.",
      },
      {
        q: "Kuinka monta viikkoa vuonna 2024 on?",
        a: "Vuonna 2024 on 52 viikkoa.",
      },
      {
        q: "Kuinka monta viikkoa vuonna 2027 on?",
        a: "Vuonna 2027 on 52 viikkoa.",
      },
      {
        q: "Voiko vuodessa olla 54 viikkoa?",
        a: "Ei. ISO 8601 -viikkonumerointi tuottaa aina joko 52 tai 53 viikkoa vuodessa, ei koskaan enempää.",
      },
      {
        q: "Onko tänä vuonna 52 vai 53 viikkoa?",
        a: "Katso tarkka viikkomäärä kuluvan vuoden sivulta – se laskee viikot automaattisesti oikein.",
      },
    ],
  },
  {
    title: "Erikoistapaukset",
    items: [
      {
        q: "Mikä on viikko 53?",
        a: "Viikko 53 on ylimääräinen viikko, joka esiintyy vain 53 viikon vuosina. Se on vuoden viimeinen viikko ennen seuraavan vuoden viikkoa 1.",
      },
      {
        q: "Mihin viikkoon joulu kuuluu?",
        a: "Jouluaatto 24.12., joulupäivä 25.12. ja tapaninpäivä 26.12. osuvat useimmiten viikolle 52, mutta joinakin vuosina viikolle 51 sen mukaan, mille viikonpäivälle 24.12. sattuu.",
      },
      {
        q: "Mihin viikkoon juhannus osuu?",
        a: "Juhannuspäivä on lauantai, joka osuu 20.–26. kesäkuuta, joten juhannus osuu useimmiten viikolle 25 ja toisinaan viikolle 26. Juhannusaatto on sitä edeltävä perjantai. Vuodesta 1955 lähtien juhannusta on vietetty kiinteän päivämäärän sijaan aina viikonloppuna.",
      },
      {
        q: "Mihin viikkoon vappu kuuluu?",
        a: "Vappu eli 1. toukokuuta osuu viikolle 17 tai 18 vuodesta riippuen. Vappuaatto on 30. huhtikuuta. Vappu on Suomessa virallinen vapaapäivä riippumatta siitä, mille viikonpäivälle se osuu.",
      },
    ],
  },
  {
    title: "Kuukauden viikot",
    items: [
      {
        q: "Mitkä viikot kuuluvat tiettyyn kuukauteen?",
        a: "Kuukausi ulottuu tavallisesti 4–6 eri viikolle, koska ISO-viikot kulkevat maanantaista sunnuntaihin eivätkä noudata kuukausirajoja. Kuukauden ensimmäinen ja viimeinen viikko ovat siksi usein osittaisia ja jaettuja edellisen tai seuraavan kuukauden kanssa.",
      },
      {
        q: "Miksi kuukauden ensimmäinen viikko voi alkaa edellisessä kuussa?",
        a: "Koska viikko on aina kokonainen maanantaista sunnuntaihin kestävä jakso. Jos kuukausi alkaa esimerkiksi keskiviikkona, kyseinen viikko alkoi jo edellisen kuukauden puolella maanantaina, ja se lasketaan yhdeksi ja samaksi viikoksi.",
      },
    ],
  },
  {
    title: "Viikkokalenteri ja tulostaminen",
    items: [
      {
        q: "Mikä on viikkokalenteri?",
        a: "Viikkokalenteri on kalenterinäkymä, jossa vuoden jokainen viikko näkyy omalla rivillään viikkonumeron ja päivämäärävälin kanssa. Se helpottaa aikataulutusta, kun tapahtumiin viitataan viikkonumeroilla eikä päivämäärillä.",
      },
      {
        q: "Mistä saan tulostettavan viikkokalenterin?",
        a: "Viikkonro.fi:ssä on jokaiselle vuodelle oma tulostettava kalenteri, joka on muotoiltu mahtumaan A4-arkille vaakasuunnassa. Kalenteri sisältää kaikki vuoden viikot numeroineen ja päivämäärineen sekä suomalaiset pyhäpäivät.",
      },
      {
        q: "Voinko tulostaa viikkokalenterin PDF-muodossa?",
        a: "Kyllä. Tulostettavan kalenterin voi tallentaa PDF-tiedostoksi valitsemalla selaimen tulostusvalikosta tulostimen sijaan Tallenna PDF-muotoon. Kalenterin asettelu on suunniteltu A4-kokoon, joten se säilyy siistinä.",
      },
      {
        q: "Näkyvätkö pyhäpäivät viikkokalenterissa?",
        a: "Näkyvät. Suomalaiset arkipyhät kuten uudenvuodenpäivä, loppiainen, pitkäperjantai, pääsiäinen, vappu, helatorstai, juhannus, pyhäinpäivä, itsenäisyyspäivä ja joulu on merkitty kalenteriin viikkonumeroiden rinnalle.",
      },
    ],
  },
  {
    title: "Juhlapäivät ja arkipyhät",
    items: [
      {
        q: "Milloin on pääsiäinen?",
        a: "Pääsiäispäivä on ensimmäinen sunnuntai kevätpäiväntasausta seuraavan täydenkuun jälkeen, joten se osuu 22. maaliskuuta ja 25. huhtikuuta välille. Pitkäperjantai on kaksi päivää sitä ennen ja 2. pääsiäispäivä sitä seuraava maanantai.",
      },
      {
        q: "Miksi pääsiäisen ajankohta vaihtelee?",
        a: "Pääsiäinen määräytyy kuukalenterin mukaan, toisin kuin kiinteät juhlapäivät. Ajankohta lasketaan computus-nimisellä säännöllä: pääsiäispäivä on kevätpäiväntasausta seuraavan täydenkuun jälkeinen sunnuntai. Siksi se voi vaihdella yli kuukauden verran vuodesta toiseen.",
      },
      {
        q: "Milloin on juhannus?",
        a: "Juhannuspäivä on lauantai, joka osuu 20.–26. kesäkuuta, ja juhannusaatto sitä edeltävä perjantai. Ennen vuotta 1955 juhannusta vietettiin kiinteästi 24. kesäkuuta, mutta lakimuutoksen jälkeen se siirrettiin aina viikonloppuun.",
      },
      {
        q: "Mitkä ovat Suomen viralliset arkipyhät?",
        a: "Suomen 13 virallista pyhäpäivää ovat uudenvuodenpäivä, loppiainen, pitkäperjantai, 1. pääsiäispäivä, 2. pääsiäispäivä, vappu, helatorstai, helluntai, juhannuspäivä, pyhäinpäivä, itsenäisyyspäivä, joulupäivä ja tapaninpäivä. Jouluaatto ja juhannusaatto eivät ole virallisia pyhäpäiviä, vaikka ne ovat käytännössä monilla aloilla vapaita.",
      },
      {
        q: "Onko jouluaatto virallinen vapaapäivä?",
        a: "Jouluaatto ei ole virallinen arkipyhä eikä pyhäpäivä, mutta se on useimmilla aloilla työehtosopimuksen mukainen vapaapäivä. Sama koskee juhannusaattoa. Viralliset joulupyhät ovat joulupäivä 25.12. ja tapaninpäivä 26.12.",
      },
      {
        q: "Milloin on helatorstai?",
        a: "Helatorstai on 39 päivää pääsiäispäivän jälkeen, aina torstaina, ja osuu 30. huhtikuuta ja 3. kesäkuuta välille. Se on virallinen vapaapäivä Suomessa.",
      },
      {
        q: "Milloin on pyhäinpäivä?",
        a: "Pyhäinpäivä on lauantai, joka osuu 31. lokakuuta ja 6. marraskuuta välille. Se on virallinen vapaapäivä ja osuu useimmiten viikolle 44.",
      },
      {
        q: "Milloin on loppiainen?",
        a: "Loppiaista vietetään aina 6. tammikuuta riippumatta siitä, mille viikonpäivälle se osuu. Se on Suomessa virallinen vapaapäivä ja päättää joulunajan.",
      },
      {
        q: "Mille viikonpäivälle itsenäisyyspäivä osuu?",
        a: "Itsenäisyyspäivä on aina 6. joulukuuta, joten sen viikonpäivä vaihtuu vuosittain. Toisin kuin juhannusta tai pyhäinpäivää, sitä ei siirretä viikonloppuun. Se osuu useimmiten viikolle 49.",
      },
      {
        q: "Siirretäänkö arkipyhät viikonloppuun Suomessa?",
        a: "Vain juhannuspäivä ja pyhäinpäivä on määritelty siirtyviksi lauantaipäiviksi. Muut arkipyhät kuten vappu, loppiainen ja itsenäisyyspäivä pidetään kiinteinä päivämäärinä, vaikka ne osuisivat viikonlopulle — jolloin ylimääräistä vapaapäivää ei tule.",
      },
    ],
  },
  {
    title: "Koululomat ja viikkonumerot",
    items: [
      {
        q: "Mille viikolle hiihtoloma osuu?",
        a: "Hiihtoloma on porrastettu kolmelle peräkkäiselle viikolle alueittain: Etelä-Suomi lomailee ensimmäisenä, Väli-Suomi seuraavana ja Itä- ja Pohjois-Suomi viimeisenä. Käytännössä lomat osuvat viikoille 8–10. Tarkat viikot vahvistaa jokainen opetuksen järjestäjä erikseen.",
      },
      {
        q: "Miksi hiihtoloma on eri viikolla eri paikkakunnilla?",
        a: "Porrastus jakaa matkailun ja majoituksen kysyntää kolmelle viikolle sen sijaan, että koko maa lomailisi samaan aikaan. Aluejako on vakiintunut: etelä ensin, keskiosa toisena, itä ja pohjoinen viimeisenä.",
      },
      {
        q: "Mille viikolle syysloma osuu?",
        a: "Syysloma osuu useimmilla paikkakunnilla viikolle 42, eli lokakuun puolivälin tienoille. Osa kunnista pitää loman viikolla 41 tai 43. Tarkka ajankohta päätetään kunnittain.",
      },
      {
        q: "Milloin koulujen kesäloma alkaa ja päättyy?",
        a: "Peruskoulun lukuvuosi päättyy viikon 22 lauantaina, eli toukokuun lopun ja kesäkuun ensimmäisten päivien välillä, ja uusi lukuvuosi alkaa yleensä elokuun puolivälissä viikolla 32–33. Kesäloma kestää siis noin 10 viikkoa.",
      },
      {
        q: "Milloin koulujen joululoma on?",
        a: "Joululoma alkaa tavallisesti joulua edeltävällä viikolla, viikon 51 tienoilla, ja päättyy loppiaisen 6. tammikuuta jälkeen. Tarkat päivät vaihtelevat kunnittain ja lukuvuosittain.",
      },
      {
        q: "Kuka päättää koulujen loma-ajoista Suomessa?",
        a: "Loma-ajoista päättää jokainen opetuksen järjestäjä eli käytännössä kunta tai koulutuskuntayhtymä. Siksi lomaviikot voivat vaihdella naapurikuntienkin välillä. Lukuvuoden päättyminen viikon 22 lauantaina on kuitenkin säädetty valtakunnallisesti.",
      },
    ],
  },
  {
    title: "Kuukausi, päivä ja vuosineljännes",
    items: [
      {
        q: "Mikä kuukausi nyt on numerona?",
        a: "Kuukaudet numeroidaan 1–12 tammikuusta joulukuuhun: tammikuu 1, helmikuu 2, maaliskuu 3, huhtikuu 4, toukokuu 5, kesäkuu 6, heinäkuu 7, elokuu 8, syyskuu 9, lokakuu 10, marraskuu 11 ja joulukuu 12.",
      },
      {
        q: "Monesko päivä vuodesta tänään on?",
        a: "Päivän järjestysluku vuodessa on 1–365, karkausvuonna 1–366. Esimerkiksi 1. heinäkuuta on tavallisena vuonna vuoden 182. päivä ja karkausvuonna 183. päivä.",
      },
      {
        q: "Mikä vuosineljännes on menossa?",
        a: "Vuosi jakautuu neljään neljännekseen: Q1 kattaa tammi–maaliskuun, Q2 huhti–kesäkuun, Q3 heinä–syyskuun ja Q4 loka–joulukuun. Kukin neljännes on noin 13 viikkoa pitkä.",
      },
    ],
  },
  {
    title: "Työelämä ja ohjelmistot",
    items: [
      {
        q: "Montako työpäivää vuodessa on?",
        a: "Vuodessa on tavallisesti 260–262 maanantaista perjantaihin osuvaa arkipäivää. Kun niistä vähennetään Suomessa virallisiksi arkipyhiksi osuvat päivät, työpäiviä jää yleensä noin 252–256. Työehtosopimukset ja työpaikkakohtaiset vapaat, kuten jouluaatto tai juhannusaatto, voivat pienentää määrää.",
      },
      {
        q: "Miten lasken viikkonumeron Excelissä?",
        a: "Käytä kaavaa =ISOVIIKKONRO(A1), jossa A1 on päivämäärä. Englanninkielisessä Excelissä kaava on =ISOWEEKNUM(A1). Vanhempi =VIIKKO.NRO-kaava voi antaa eri tuloksen vuodenvaihteessa, jos siinä ei käytetä ISO-viikkonumerointia vastaavaa palautustyyppiä.",
      },
      {
        q: "Miten lasken viikkonumeron Google Sheetsissä?",
        a: "Google Sheetsissä kaava on =ISOWEEKNUM(A1), jossa A1 sisältää päivämäärän. Se noudattaa ISO 8601 -standardia ja antaa saman tuloksen kuin suomalaiset kalenterit.",
      },
      {
        q: "Miten saan viikkonumerot näkyviin Outlookissa?",
        a: "Outlookin työpöytäversiossa valitse Tiedosto → Asetukset → Kalenteri ja rastita kohta Näytä viikkonumerot kuukausinäkymässä. Numerot ilmestyvät kalenterin vasempaan reunaan.",
      },
      {
        q: "Miksi työpaikoilla käytetään viikkonumeroita?",
        a: "Viikkonumero on lyhyt ja yksiselitteinen tapa viitata ajanjaksoon ilman tarkkoja päivämääriä. Ilmaisu \"toimitus viikolla 34\" on selkeämpi ja joustavampi kuin päivämääräväli, ja se toimii samalla tavalla eri maiden välillä Euroopassa.",
      },
    ],
  },
  {
    title: "Viikkonumerot laitteissa ja ohjelmissa",
    items: [
      {
        q: "Miten näen viikkonumeron iPhonessa?",
        a: "iPhonen Kalenteri-sovellus ei näytä viikkonumeroita oletuksena. Ne saa näkyviin Asetukset → Kalenteri → Viikkonumerot. Kuukausinäkymässä numerot ilmestyvät rivien vasempaan reunaan. Vaihtoehtoisesti viikkonumeron voi tarkistaa selaimesta.",
      },
      {
        q: "Miten näen viikkonumerot Androidissa?",
        a: "Google-kalenterin Android-sovelluksessa viikkonumerot kytketään päälle valikosta Asetukset → Yleiset → Näytä viikkonumero. Androidin oma kalenterisovellus vaihtelee valmistajittain, eivätkä kaikki tue viikkonumeroita lainkaan.",
      },
      {
        q: "Miten näen viikkonumerot Google-kalenterissa?",
        a: "Google-kalenterin asetuksissa on erillinen valinta viikkonumeroiden näyttämiseen.",
      },
      {
        q: "Voinko tulostaa koko vuoden viikkokalenterin?",
        a: "Kyllä. Tulostettava viikkokalenteri listaa kaikki vuoden viikot päivämäärineen yhdellä sivulla.",
      },
    ],
  },
  {
    title: "Nimipäivät, arkipyhät ja lomat",
    items: [
      {
        q: "Mitkä ovat tämän viikon nimipäivät?",
        a: "Viikon sivu näyttää saatavilla olevat varmennetut suomalaiset nimipäivät päiväkohtaisesti. Päivä jää ilman nimipäiväriviä, jos varmennettua tietoa ei ole saatavilla.",
      },
      {
        q: "Onko tällä viikolla arkipyhiä?",
        a: "Viikon oma sivu kertoo, osuuko viikolle virallisia arkipyhiä tai muita merkkipäiviä.",
      },
      {
        q: "Milloin aurinko nousee ja laskee tällä viikolla?",
        a: "Jokaisen viikon sivulla näkyvät auringonnousu- ja laskuajat sekä valoisan ajan pituus (Helsinki).",
      },
    ],
  },
  {
    title: "Viikkonumeroiden käyttö",
    items: [
      {
        q: "Mihin viikkonumeroita käytetään?",
        a: "Viikkonumeroita käytetään laajasti työelämässä, kouluissa, projektien aikataulutuksessa ja logistiikassa esimerkiksi toimitusten ja tapaamisten ajoittamiseen.",
      },
      {
        q: "Käytetäänkö kouluissa viikkonumeroita?",
        a: "Kyllä. Lukujärjestykset, jaksot ja lomat ilmoitetaan usein viikkonumeroina.",
      },
    ],
  },
  {
    title: "Palvelu",
    items: [
      {
        featured: true,
        q: "Onko Viikko Nro ilmainen?",
        a: "Kyllä. Viikko Nro on täysin ilmainen käyttää, eikä käyttö vaadi rekisteröitymistä.",
      },
      {
        q: "Toimiiko palvelu mobiililla?",
        a: "Kyllä. Sivusto on optimoitu mobiili-, tabletti- ja työpöytäselaimille.",
      },
      {
        q: "Tarvitseeko palveluun kirjautua?",
        a: "Ei. Kaikki toiminnot ovat käytettävissä ilman tiliä tai kirjautumista.",
      },
      {
        q: "Onko saatavilla erillistä sovellusta?",
        a: "Viikkonro.fi toimii suoraan selaimessa puhelimella, tabletilla ja tietokoneella ilman asennusta. Sivun voi lisätä puhelimen aloitusnäytölle pikakuvakkeeksi, jolloin se avautuu kuin sovellus.",
      },
    ],
  },
];

// Flat list of every question/answer.
export const faqs = faqCategories.flatMap((category) => category.items);

// Curated subset highlighted on the home page.
export const featuredFaqs = faqs.filter((item) => item.featured);
