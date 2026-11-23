import {
  isoWeek,
  isoYear,
  WD,
  WD_ALLATIVE,
  WD_ESSIVE,
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
} from "../components/dateUtils.js";

import { dayOffVerdict } from "./eventTemplate.js";

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
    // The answer line states date, weekday and week number, the three facts
    // the query asks for, like the loppiainen lead below.
    answerLead: isWeekend
      ? `Itsenäisyyspäivä ${y} on ${WD[dayOfWeek].toLowerCase()} ${date.getDate()}.${date.getMonth() + 1}. (viikko ${week}), ei ylimääräistä vapaapäivää.`
      : `Itsenäisyyspäivä ${y} on ${WD[dayOfWeek].toLowerCase()} ${date.getDate()}.${date.getMonth() + 1}. (viikko ${week}), palkallinen vapaapäivä.`,
    dayOff: {
      question: `Onko itsenäisyyspäivä ${y} vapaapäivä?`,
      verdict: dayOffVerdict({ official: true, weekend: isWeekend }),
      detail: isWeekend
        ? `Itsenäisyyspäivä on lakisääteinen vapaapäivä (laki 388/1937), mutta vuonna ${y} se osuu ${WD_ALLATIVE[dayOfWeek]}. Suomessa viikonlopulle osuvasta arkipyhästä ei anneta korvaavaa vapaapäivää.`
        : `Itsenäisyyspäivä on lakisääteinen palkallinen vapaapäivä (laki 388/1937), ja vuonna ${y} se osuu ${WD_ALLATIVE[dayOfWeek]}.`,
    },
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
    // Only the statutory facts, which hold in every year. The number of
    // consecutive days off is stated in the page's own section, where the
    // weekday placement is explained alongside it.
    dayOff: {
      question: `Onko jouluaatto ${y} vapaapäivä?`,
      verdict: "Ei lakisääteinen pyhäpäivä, mutta useimmilla palkallinen vapaa",
      detail: `Joulupäivä 25.12. ja tapaninpäivä 26.12. ovat lakisääteisiä pyhäpäiviä. Jouluaatto 24.12. ei ole lakisääteinen pyhäpäivä, mutta useimmissa työehtosopimuksissa se on koko päivän palkallinen vapaa.`,
    },
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

// ---------------------------------------------------------------------------
// 4. Uusi vuosi (/uusi-vuosi-{year})
// ---------------------------------------------------------------------------

export function newYearData(year) {
  const y = Number(year);
  const eveDate = new Date(y - 1, 11, 31);
  const dayDate = new Date(y, 0, 1);

  const eveWd = WD[eveDate.getDay()];
  const dayWd = WD[dayDate.getDay()];
  const eveWeek = isoWeek(eveDate);
  const eveWeekYear = isoYear(eveDate);
  const dayWeek = isoWeek(dayDate);
  const dayWeekYear = isoYear(dayDate);

  const dayIsWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

  return {
    year: y,
    previousYear: y - 1,
    eve: {
      date: eveDate,
      weekday: eveWd,
      weekdayEssive: WD_ESSIVE[eveDate.getDay()],
      week: eveWeek,
      weekYear: eveWeekYear,
    },
    day: {
      date: dayDate,
      weekday: dayWd,
      weekdayEssive: WD_ESSIVE[dayDate.getDay()],
      week: dayWeek,
      weekYear: dayWeekYear,
      isWeekend: dayIsWeekend,
    },
    fireworksTime: "klo 18.00-02.00",
    dayOff: {
      question: `Onko uudenvuodenpäivä ${y} vapaapäivä?`,
      verdict: dayOffVerdict({ official: true, weekend: dayIsWeekend }),
      detail: dayIsWeekend
        ? `Uudenvuodenpäivä 1.1. on virallinen pyhäpäivä, mutta vuonna ${y} se osuu ${WD_ALLATIVE[dayDate.getDay()]}, eikä viikonlopulle osuvasta arkipyhästä anneta korvaavaa vapaapäivää. Uudenvuodenaatto 31.12. on tavallinen arkipäivä.`
        : `Uudenvuodenpäivä 1.1. on virallinen pyhäpäivä ja useimmilla aloilla palkallinen vapaapäivä. Vuonna ${y} se osuu ${WD_ALLATIVE[dayDate.getDay()]}. Uudenvuodenaatto 31.12. on tavallinen arkipäivä, jota monissa työehtosopimuksissa lyhennetään.`,
    },
  };
}

export function newYearMeta(year) {
  const data = newYearData(year);
  const y = data.year;
  const prevY = data.previousYear;
  const eveWdShort = data.eve.weekday.slice(0, 2).toLowerCase();
  const dayWdShort = data.day.weekday.slice(0, 2).toLowerCase();

  const title = `Uusi vuosi ${y}: päivät, vapaat ja aukioloajat | Viikko Nro`;

  const description =
    `Milloin on uusi vuosi ${y}? Uudenvuodenaatto ${eveWdShort} 31.12.${prevY}, uudenvuodenpäivä ${dayWdShort} 1.1.${y}. Katso vapaat, ilotulitteiden sallitut ajat ja aukioloajat.`;

  return {
    title: title.length <= 60 ? title : `Uusi vuosi ${y}: vapaat ja aukioloajat | Viikko Nro`,
    description,
  };
}

export function newYearFaqs(year) {
  const data = newYearData(year);
  const y = data.year;
  const prevY = data.previousYear;

  return [
    {
      q: `Mille päiville uusi vuosi ${y} osuu?`,
      a: `Uudenvuodenaattoa vietetään ${data.eve.weekday.toLowerCase()}na 31.12.${prevY} ja uudenvuodenpäivä on ${data.day.weekday.toLowerCase()}na 1.1.${y}. Uudenvuodenpäivä 1.1.${y} kuuluu ISO-viikkoon ${data.day.week}.`,
    },
    {
      q: `Onko uudenvuodenpäivä ${y} vapaapäivä?`,
      a: data.day.isWeekend
        ? `Uudenvuodenpäivä 1.1.${y} on virallinen pyhäpäivä, mutta se osuu viikonlopulle (${data.day.weekday.toLowerCase()}), joten se ei tuo ylimääräistä arkivapaata.`
        : `Kyllä. Uudenvuodenpäivä 1.1.${y} on lakisääteinen kirkollinen juhlapyhä ja virallinen palkallinen arkivapaa.`,
    },
    {
      q: `Moneltako ilotulitteita saa ampua uutenavuotena?`,
      a: `Suomessa ilotulitteita saa käyttää ilman pelastusviranomaisen erillistä lupaa uudenvuodenaattona klo 18.00 alkaen uudenvuodenpäivän aamuyöhön klo 02.00 saakka. Suojalasien käyttö on lain mukaan pakollista ilotulitteiden ampujalle ja vahvasti suositeltavaa katsojille.`,
    },
    {
      q: `Ovatko kaupat auki uutenavuotena ${y}?`,
      a: `Uudenvuodenaattona 31.12. useimmat ruokakaupat ja kauppakeskukset ovat auki tavallista lyhyemmin (usein klo 18.00-21.00 asti). Uudenvuodenpäivänä 1.1. suuret marketit ovat pääosin suljettuina, mutta pienet lähikaupat ja liikenneasemat palvelevat.`,
    },
    {
      q: `Onko uudenvuodenaatto vapaapäivä Suomessa?`,
      a: `Uudenvuodenaatto 31.12. ei ole lakisääteinen pyhäpäivä, mutta monissa työehtosopimuksissa se on sovittu lyhennetyksi työpäiväksi tai kokonaan vapaaksi. Pankit sulkeutuvat uudenvuodenaattona klo 13.00.`,
    },
    {
      q: `Miksi 1. tammikuuta ${y} voi kuulua edellisen vuoden viikkoon?`,
      a: `ISO 8601 -standardin mukaan viikko kuuluu sille kalenterivuodelle, jolle sen torstai osuu. Jos tammikuun 1. päivä osuu perjantaille, lauantaille tai sunnuntaille (kuten vuonna 2027), se kuuluu vielä edellisen vuoden viikkoon 52 tai 53.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// 5. Loppiainen (/loppiainen-{year})
// ---------------------------------------------------------------------------

export function epiphanyData(year) {
  const y = Number(year);
  const date = new Date(y, 0, 6);
  const dayOfWeek = date.getDay();
  const weekday = WD[dayOfWeek];
  const weekdayEssive = WD_ESSIVE[dayOfWeek];
  const week = isoWeek(date);
  const weekYear = isoYear(date);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    year: y,
    date,
    dayOfWeek,
    weekday,
    weekdayEssive,
    week,
    weekYear,
    isWeekend,
    answerLead: isWeekend
      ? `Loppiainen ${y} on ${weekday.toLowerCase()} 6.1.${y} (viikko ${week}), ei ylimääräistä vapaapäivää.`
      : `Loppiainen ${y} on ${weekday.toLowerCase()} 6.1.${y} (viikko ${week}), palkallinen arkipyhä.`,
    dayOff: {
      question: `Onko loppiainen ${y} vapaapäivä?`,
      verdict: dayOffVerdict({ official: true, weekend: isWeekend }),
      detail: isWeekend
        ? `Loppiainen 6.1. on lakisääteinen kirkollinen pyhäpäivä, mutta vuonna ${y} se osuu ${WD_ALLATIVE[dayOfWeek]}, eikä viikonlopulle osuvasta arkipyhästä anneta korvaavaa vapaapäivää.`
        : `Loppiainen 6.1. on lakisääteinen kirkollinen pyhäpäivä ja useimmilla aloilla palkallinen vapaapäivä. Vuonna ${y} se osuu ${WD_ALLATIVE[dayOfWeek]}.`,
    },
  };
}

export function epiphanyMeta(year) {
  const data = epiphanyData(year);
  const y = data.year;
  const shortDate = `${data.weekday.slice(0, 2).toLowerCase()} 6.1.`;
  const title = `Loppiainen ${y}: ${shortDate}, viikko ja vapaapäivät | Viikko Nro`;

  const description = data.isWeekend
    ? `Loppiainen ${y} on ${data.weekday.toLowerCase()} 6.1.${y} (viikko ${data.week}). Katso miksi loppiaista vietetään, vapaat ja kauppojen aukioloajat.`
    : `Loppiainen ${y} on ${data.weekday.toLowerCase()} 6.1.${y} (viikko ${data.week}). Onko loppiainen vapaapäivä, miten sijoittaa lomat ja miten kaupat ovat auki? Katso tiedot.`;

  return {
    title: title.length <= 60 ? title : `Loppiainen ${y}: 6.1., viikko ${data.week} | Viikko Nro`,
    description,
  };
}

export function epiphanyFaqs(year) {
  const data = epiphanyData(year);
  const y = data.year;

  return [
    {
      q: `Onko loppiainen ${y} vapaapäivä?`,
      a: data.isWeekend
        ? `Loppiainen 6.1.${y} on kirkollinen pyhäpäivä, mutta se osuu viikonlopulle (${data.weekday.toLowerCase()}), joten se ei tuo ylimääräistä vapaapäivää maanantaista perjantaihin työskenteleville.`
        : `Kyllä. Loppiainen 6.1.${y} on lakisääteinen kirkollinen juhlapyhä ja useimmilla aloilla palkallinen vapaapäivä.`,
    },
    {
      q: `Millä viikolla loppiainen ${y} on?`,
      a: `Loppiainen 6.1.${y} kuuluu ISO-viikkoon ${data.week}.`,
    },
    {
      q: `Miten ottaa lomaa loppiaisena ${y}?`,
      a: y === 2027
        ? `Vuonna 2027 loppiainen on keskiviikkona. Ottamalla 2 lomapäivää (maanantai ja tiistai 4.-5.1. tai torstai ja perjantai 7.-8.1.) saat 5 päivän yhtenäisen vapaaputken viikonlopun kera. Ottamalla 4 lomapäivää saat peräti 9 päivän loman (2.-10.1.2027).`
        : `Jos loppiainen osuu arkipäivälle, yhdistämällä pari lomapäivää viereiseen viikonloppuun saat pitkän yhtenäisen loman vähällä vuosiloman kulutuksella.`,
    },
    {
      q: `Ovatko kaupat auki loppiaisena ${y}?`,
      a: `Kauppojen aukioloajat ovat vapautetut. Useimmat ruokakaupat ja kauppakeskukset ovat avoinna sunnuntaiaukioloaikojen mukaisesti. Virastot, pankit ja postit ovat kiinni.`,
    },
    {
      q: `Mitä loppiainen tarkoittaa ja miksi sitä vietetään?`,
      a: `Loppiainen on kristillinen juhla, jota vietetään 6. tammikuuta kolmentoista päivän kuluttua joulusta. Se päättää joulunpyhät. Kirkollisessa perinteessä loppiaista vietetään itämaan tietäjien saapumisen ja Jeesuksen kasteen muistoksi.`,
    },
    {
      q: `Milloin joulukuusi viedään pois?`,
      a: `Suomalaisen perinteen mukaan joulukuusi ja joulukoristeet viedään usein pois loppiaisena 6. tammikuuta tai Nuutin päivänä 13. tammikuuta vanhan sanonnan mukaan: "Hyvä Tuomas joulun tuopi, paha Nuutti pois sen viepi".`,
    },
  ];
}
