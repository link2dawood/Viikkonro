import {
  isoWeek,
  isoYear,
  WD,
  WD_ESSIVE,
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
} from "../components/dateUtils.js";

const inRange = (y) => y >= PRERENDER_MIN_YEAR && y <= PRERENDER_MAX_YEAR;

// ---------------------------------------------------------------------------
// 1. Itsenäisyyspäivä (/itsenaisyyspaiva-{year})
// ---------------------------------------------------------------------------

export function itsenaisyyspaivaData(year) {
  const y = Number(year);
  const date = new Date(y, 11, 6);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const week = isoWeek(date);
  const weekYear = isoYear(date);
  const yearsSinceIndependence = y - 1917;

  return {
    year: y,
    date,
    dayOfWeek,
    weekday: WD[dayOfWeek],
    weekdayEssive: WD_ESSIVE[dayOfWeek],
    week,
    weekYear,
    isWeekend,
    yearsSinceIndependence,
    flagTime: "8.00-20.00",
    answerLead: isWeekend
      ? `Itsenäisyyspäivä ${y} on ${WD[dayOfWeek].toLowerCase()} ${date.getDate()}.${date.getMonth() + 1}., ei ylimääräistä vapaapäivää.`
      : `Itsenäisyyspäivä ${y} on ${WD[dayOfWeek].toLowerCase()} ${date.getDate()}.${date.getMonth() + 1}., palkallinen vapaapäivä.`,
  };
}

export function itsenaisyyspaivaMeta(year) {
  const data = itsenaisyyspaivaData(year);
  const y = data.year;
  const shortDate = `${data.weekday.slice(0, 2).toLowerCase()} 6.12.`;
  const title = `Itsenäisyyspäivä ${y}: ${shortDate} ja vapaapäivät | Viikko Nro`;

  const description = data.isWeekend
    ? `Onko itsenäisyyspäivä ${y} vapaapäivä? Itsenäisyyspäivä ${y} on ${data.weekday.toLowerCase()} 6.12., ei ylimääräistä vapaapäivää. Katso viikko, liputus ja perinteet.`
    : `Onko itsenäisyyspäivä ${y} vapaapäivä? Itsenäisyyspäivä ${y} on ${data.weekday.toLowerCase()} 6.12., palkallinen arkipyhä. Katso viikko, liputusajat ja perinteet.`;

  return {
    title: title.length <= 60 ? title : `Itsenäisyyspäivä ${y}: 6.12., viikko ${data.week} | Viikko Nro`,
    description,
  };
}

export function itsenaisyyspaivaFaqs(year) {
  const data = itsenaisyyspaivaData(year);
  const y = data.year;

  return [
    {
      q: `Onko itsenäisyyspäivä ${y} vapaapäivä?`,
      a: data.isWeekend
        ? `Itsenäisyyspäivä ${y} on ${data.weekday.toLowerCase()} 6.12., joten se ei tuo ylimääräistä vapaapäivää maanantaista perjantaihin työskenteleville. Suomessa viikonlopulle osuvista arkipyhistä ei anneta korvaavaa vapaapäivää.`
        : `Kyllä. Itsenäisyyspäivä ${y} on ${data.weekday.toLowerCase()} 6.12. ja se on lakisääteinen palkallinen vapaapäivä useimmilla aloilla.`,
    },
    {
      q: `Millä viikolla itsenäisyyspäivä ${y} on?`,
      a: `Itsenäisyyspäivä 6.12.${y} kuuluu ISO-viikkoon ${data.week}.`,
    },
    {
      q: `Miten itsenäisyyspäivänä liputetaan?`,
      a: `Itsenäisyyspäivä on virallinen liputuspäivä. Liputus alkaa klo 8.00 ja päättyy poikkeuksellisesti vasta klo 20.00 (myös pimeän tultua valaisemattomassa salossa).`,
    },
    {
      q: `Montako vuotta Suomi on ollut itsenäinen vuonna ${y}?`,
      a: `Suomen eduskunta hyväksyi itsenäisyysjulistuksen 6. joulukuuta 1917, joten vuonna ${y} itsenäisyydestä tulee kuluneeksi ${data.yearsSinceIndependence} vuotta.`,
    },
    {
      q: `Mitä perinteitä itsenäisyyspäivään kuuluu Suomessa?`,
      a: `Itsenäisyyspäivän perinteisiin kuuluvat kahden sinivalkoisen kynttilän sytyttäminen ikkunalle klo 18.00, tasavallan presidentin itsenäisyyspäivän juhlavastaanotto (Linnan juhlat), seppeleenlaskut sankarihaudoille sekä Tuntematon sotilas -elokuva.`,
    },
    ...(y === 2026
      ? [
          {
            q: `Osuuko 2. adventti samalle päivälle itsenäisyyspäivän kanssa vuonna 2026?`,
            a: `Kyllä, sunnuntai 6.12.2026 on samalla kirkkovuoden toinen adventtisunnuntai.`,
          },
        ]
      : []),
    ...(inRange(y + 1)
      ? [
          {
            q: `Milloin on itsenäisyyspäivä ${y + 1}?`,
            a: `Itsenäisyyspäivä ${y + 1} on ${itsenaisyyspaivaData(y + 1).weekdayEssive} 6.12.${y + 1} (viikko ${itsenaisyyspaivaData(y + 1).week}).`,
          },
        ]
      : []),
  ];
}

// ---------------------------------------------------------------------------
// 2. Joulu (/joulu-{year})
// ---------------------------------------------------------------------------

export function christmasData(year) {
  const y = Number(year);
  const eve = new Date(y, 11, 24);
  const day = new Date(y, 11, 25);
  const boxing = new Date(y, 11, 26);

  const eveWd = WD[eve.getDay()];
  const dayWd = WD[day.getDay()];
  const boxingWd = WD[boxing.getDay()];
  const week = isoWeek(eve);

  // In 2026: Eve is Thu (24th), Day is Fri (25th), Boxing is Sat (26th), Sun (27th).
  // Standard day work yields 4 consecutive days off (Thu-Sun).
  const is2026 = y === 2026;

  return {
    year: y,
    week,
    eve: { date: eve, weekday: eveWd, weekdayEssive: WD_ESSIVE[eve.getDay()] },
    day: { date: day, weekday: dayWd, weekdayEssive: WD_ESSIVE[day.getDay()] },
    boxing: { date: boxing, weekday: boxingWd, weekdayEssive: WD_ESSIVE[boxing.getDay()] },
    freeDaysCount: is2026 ? 4 : (eve.getDay() >= 1 && eve.getDay() <= 4 ? 4 : 3),
    freeDaysRange: is2026 ? "torstai 24.12. - sunnuntai 27.12.2026" : "joulun pyhät",
  };
}

export function christmasMeta(year) {
  const data = christmasData(year);
  const y = data.year;
  const title = `Joulu ${y}: päivät, vapaat ja aukioloajat | Viikko Nro`;

  const description = y === 2026
    ? `Milloin on joulu 2026? Jouluaatto on to 24.12., joulupäivä pe 25.12. ja tapaninpäivä la 26.12. Katso vapaapäivät, viikot ja kauppojen aukioloajat.`
    : `Milloin on joulu ${y}? Jouluaatto on ${data.eve.weekday.toLowerCase()}na 24.12., joulupäivä 25.12. ja tapaninpäivä 26.12. Katso pyhät, viikko ja aukioloajat.`;

  return {
    title: title.length <= 60 ? title : `Joulu ${y}: jouluaatto ja pyhät | Viikko Nro`,
    description,
  };
}

export function christmasFaqs(year) {
  const data = christmasData(year);
  const y = data.year;

  return [
    {
      q: `Milloin on joulu ${y} ja mille päiville se osuu?`,
      a: `Vuonna ${y} jouluaatto on ${data.eve.weekday.toLowerCase()}na 24.12., joulupäivä ${data.day.weekday.toLowerCase()}na 25.12. ja tapaninpäivä ${data.boxing.weekday.toLowerCase()}na 26.12. Kaikki kuuluvat viikkoon ${data.week}.`,
    },
    {
      q: `Montako vapaapäivää joulusta ${y} tulee?`,
      a: y === 2026
        ? `Vuonna 2026 normaalissa maanantaista perjantaihin tehtävässä päivätyössä joulusta saa 4 peräkkäistä vapaapäivää (torstaista 24.12. sunnuntaihin 27.12.2026) ilman lomapäivien käyttöä. Jouluaatto on useimmissa työehtosopimuksissa palkallinen vapaa ja joulupäivä on virallinen arkipyhä.`
        : `Joulupäivä 25.12. ja tapaninpäivä 26.12. ovat lakisääteisiä pyhäpäiviä. Lisäksi jouluaatto 24.12. on useimmissa työehtosopimuksissa sovittu koko päivän palkalliseksi vapaaksi.`,
    },
    {
      q: `Miten ottaa lomaa jouluna ${y} mahdollisimman tehokkaasti?`,
      a: y === 2026
        ? `Ottamalla 3 lomapäivää joulua edeltäville arkipäiville (ma 21.12. - ke 23.12.2026) saat yhteensä 9 päivän yhtäjaksoisen vapaan (la 19.12. - su 27.12.). Ottamalla lisäksi 4 lomapäivää välipäiville (ma 28.12. - to 31.12.) saat jopa 16 peräkkäistä vapaapäivää käyttämällä vain 7 vuosilomapäivää.`
        : `Sijoittamalla vuosilomapäiviä joulun arkipyhien yhteyteen saat pidennettyä vapaat pitkäksi lomajaksoksi vähillä lomapäivillä.`,
    },
    {
      q: `Ovatko kaupat auki jouluna ${y}?`,
      a: `Kauppojen aukioloajat ovat Suomessa vapautetut. Yleisen käytännön mukaisesti jouluaattona 24.12. useimmat ruokakaupat ja kauppakeskukset sulkeutuvat klo 12.00-14.00. Joulupäivänä 25.12. suuri osa kaupoista on kiinni lukuun ottamatta pieniä lähikauppoja ja liikenneasemia. Tapaninpäivänä 26.12. kaupat avaavat ovensa sunnuntaiaukioloajoin ja joulun alennusmyynnit alkavat.`,
    },
    {
      q: `Onko tapaninpäivä ${y} arkivapaa?`,
      a: y === 2026
        ? `Tapaninpäivä 26.12.2026 osuu lauantaille. Se on virallinen kirkollinen pyhäpäivä, mutta ma-pe -päivätyötä tekeville se ei tuo ylimääräistä arkivapaata, koska Suomessa viikonloppupyhistä ei siirretä vapaata arkipäivälle.`
        : `Tapaninpäivä 26.12. on lakisääteinen kirkollinen juhlapyhä. Jos se osuu arkipäivälle, se on palkallinen vapaapäivä.`,
    },
    {
      q: `Millä viikolla joulu ${y} on?`,
      a: `Joulu ${y} on ISO-viikolla ${data.week}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// 3. Koulujen joululoma (/joululoma-{year})
// ---------------------------------------------------------------------------

export const CHRISTMAS_BREAK_CITIES_2026 = [
  { city: "Helsinki", start: "23.12.2026", end: "6.1.2027", schoolResumes: "7.1.2027", days: 15, note: "Syyslukukausi päättyy ti 22.12." },
  { city: "Espoo", start: "23.12.2026", end: "6.1.2027", schoolResumes: "7.1.2027", days: 15, note: "Syyslukukausi päättyy ti 22.12." },
  { city: "Tampere", start: "23.12.2026", end: "6.1.2027", schoolResumes: "7.1.2027", days: 15, note: "Syyslukukausi päättyy ti 22.12." },
  { city: "Vantaa", start: "23.12.2026", end: "6.1.2027", schoolResumes: "7.1.2027", days: 15, note: "Syyslukukausi päättyy ti 22.12." },
  { city: "Oulu", start: "23.12.2026", end: "6.1.2027", schoolResumes: "7.1.2027", days: 15, note: "Syyslukukausi päättyy ti 22.12." },
  { city: "Turku", start: "23.12.2026", end: "6.1.2027", schoolResumes: "7.1.2027", days: 15, note: "Syyslukukausi päättyy ti 22.12." },
];

export function christmasBreakData(year) {
  const y = Number(year);
  const nextYear = y + 1;
  const is2026 = y === 2026;

  return {
    year: y,
    schoolYear: `${y}-${nextYear}`,
    generalStart: is2026 ? "23.12.2026" : `23.12.${y}`,
    generalEnd: is2026 ? "6.1.2027" : `6.1.${nextYear}`,
    schoolResumes: is2026 ? "7.1.2027" : `7.1.${nextYear}`,
    durationDays: 15,
    cities: is2026 ? CHRISTMAS_BREAK_CITIES_2026 : [
      { city: "Helsinki", start: `23.12.${y}`, end: `6.1.${nextYear}`, schoolResumes: `7.1.${nextYear}`, days: 15, note: "Vahvistetaan kunnan päätöksellä" },
      { city: "Espoo", start: `23.12.${y}`, end: `6.1.${nextYear}`, schoolResumes: `7.1.${nextYear}`, days: 15, note: "Vahvistetaan kunnan päätöksellä" },
      { city: "Tampere", start: `23.12.${y}`, end: `6.1.${nextYear}`, schoolResumes: `7.1.${nextYear}`, days: 15, note: "Vahvistetaan kunnan päätöksellä" },
      { city: "Vantaa", start: `23.12.${y}`, end: `6.1.${nextYear}`, schoolResumes: `7.1.${nextYear}`, days: 15, note: "Vahvistetaan kunnan päätöksellä" },
      { city: "Oulu", start: `23.12.${y}`, end: `6.1.${nextYear}`, schoolResumes: `7.1.${nextYear}`, days: 15, note: "Vahvistetaan kunnan päätöksellä" },
      { city: "Turku", start: `23.12.${y}`, end: `6.1.${nextYear}`, schoolResumes: `7.1.${nextYear}`, days: 15, note: "Vahvistetaan kunnan päätöksellä" },
    ],
  };
}

export function christmasBreakMeta(year) {
  const y = Number(year);
  const nextYear = y + 1;
  const title = `Joululoma ${y}: koulujen loma-ajat kaupungeittain | Viikko Nro`;

  const description = y === 2026
    ? `Milloin koulujen joululoma 2026 alkaa ja päättyy? Katso joululoman päivämäärät: Helsinki, Espoo, Tampere, Vantaa, Oulu ja Turku. Koulu alkaa to 7.1.2027.`
    : `Milloin koulujen joululoma ${y} alkaa? Katso joululoman päivämäärät Suomen suurimmissa kaupungeissa ja milloin koulu jatkuu tammikuussa ${nextYear}.`;

  return {
    title: title.length <= 60 ? title : `Joululoma ${y}: koulujen loma-ajat | Viikko Nro`,
    description,
  };
}

export function christmasBreakFaqs(year) {
  const data = christmasBreakData(year);
  const y = data.year;
  const nextYear = y + 1;

  return [
    {
      q: `Milloin koulujen joululoma ${y} alkaa ja loppuu?`,
      a: `Suurimmassa osassa Suomea koulujen joululoma ${y} alkaa keskiviikkona ${data.generalStart} ja päättyy loppiaiseen keskiviikkona ${data.generalEnd}. Koulutyö jatkuu torstaina ${data.schoolResumes}.`,
    },
    {
      q: `Milloin on Helsingin koulujen joululoma ${y}?`,
      a: `Helsingissä peruskoulujen joululoma pidetään ${data.generalStart}-${data.generalEnd}. Syyslukukausi päättyy tiistaina 22.12.${y} ja kevätlukukausi alkaa torstaina ${data.schoolResumes}.`,
    },
    {
      q: `Milloin koulut alkavat joululoman jälkeen tammikuussa ${nextYear}?`,
      a: `Koulut alkavat loppiaisen jälkeen torstaina ${data.schoolResumes} lähes kaikissa Suomen kunnissa.`,
    },
    {
      q: `Kuinka pitkä koululaisten joululoma on?`,
      a: `Koululaisten joululoma kestää noin kaksi viikkoa (yhteensä 15-16 päivää vapaata viikonloput mukaan luettuina).`,
    },
    {
      q: `Milloin ovat Espoon, Tampereen, Vantaan, Oulun ja Turun joululomat?`,
      a: `Kaikissa näissä suurissa kaupungeissa peruskoulujen joululoma ajoittuu ajalle ${data.generalStart}-${data.generalEnd} ja koulu alkaa torstaina ${data.schoolResumes}.`,
    },
    {
      q: `Mistä näen kaikki lukuvuoden ${data.schoolYear} koululomat?`,
      a: `Kaikki varmistetut loma-ajat (syysloma, joululoma, talviloma ja kesäloma) löydät sivulta koululomat ${y}.`,
    },
  ];
}
