// Age arithmetic for /ikalaskuri. Plain .js so prerender.js can import it.
//
// Conventions (stated on the page):
// - Age is counted in full years, months and days; a year is complete on
//   the birthday itself.
// - Someone born on 29.2. completes a year on 1.3. in years without a leap
//   day (the day after 28.2.). This is the calculator's counting rule, not a
//   legal statement; the page says people choose their own celebration day.
// - Adulthood at 18 (täysi-ikäisyys) is the general Finnish rule.
import { fmtFullFi, isoWeek, isoYear, WD, WD_ESSIVE } from "../components/dateUtils.js";

export const AGE_PATH = "/ikalaskuri";

const DAY = 86400000;
const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysInMonth = (y, m0) => new Date(y, m0 + 1, 0).getDate();
export const daysBetween = (a, b) => Math.round((atMidnight(b) - atMidnight(a)) / DAY);

// The birthday in a given year; 29.2. becomes 1.3. when there is no leap day.
export function birthdayIn(birth, year) {
  const m = birth.getMonth();
  const d = birth.getDate();
  if (m === 1 && d === 29 && daysInMonth(year, 1) === 28) return new Date(year, 2, 1);
  return new Date(year, m, d);
}

// Full years, months and days from birth to `on` (on >= birth).
export function ageOn(birth, on) {
  const b = atMidnight(birth);
  const o = atMidnight(on);
  let years = o.getFullYear() - b.getFullYear();
  if (o < birthdayIn(b, o.getFullYear())) years -= 1;
  // Months and days after the last completed birthday.
  const last = birthdayIn(b, b.getFullYear() + years);
  let months = (o.getFullYear() - last.getFullYear()) * 12 + o.getMonth() - last.getMonth();
  let anchor = new Date(last.getFullYear(), last.getMonth() + months, Math.min(last.getDate(), daysInMonth(last.getFullYear(), last.getMonth() + months)));
  if (anchor > o) {
    months -= 1;
    anchor = new Date(last.getFullYear(), last.getMonth() + months, Math.min(last.getDate(), daysInMonth(last.getFullYear(), last.getMonth() + months)));
  }
  const days = daysBetween(anchor, o);
  const totalDays = daysBetween(b, o);
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
  };
}

export function nextBirthday(birth, on) {
  const o = atMidnight(on);
  let next = birthdayIn(birth, o.getFullYear());
  if (next < o) next = birthdayIn(birth, o.getFullYear() + 1);
  return {
    date: next,
    isToday: daysBetween(o, next) === 0,
    daysLeft: daysBetween(o, next),
    turns: next.getFullYear() - birth.getFullYear(),
    weekday: WD[next.getDay()],
    weekdayEssive: WD_ESSIVE[next.getDay()],
  };
}

// Milestones: round birthdays and round day counts, each with its date.
export function milestones(birth, on) {
  const b = atMidnight(birth);
  const o = atMidnight(on);
  const rows = [
    { label: "Täysi-ikäinen (18 vuotta)", date: birthdayIn(b, b.getFullYear() + 18) },
    { label: "10 000 päivää", date: new Date(b.getFullYear(), b.getMonth(), b.getDate() + 10000) },
    ...[30, 40, 50].map((n) => ({ label: `${n}-vuotispäivä`, date: birthdayIn(b, b.getFullYear() + n) })),
    { label: "20 000 päivää", date: new Date(b.getFullYear(), b.getMonth(), b.getDate() + 20000) },
    ...[60, 70, 80].map((n) => ({ label: `${n}-vuotispäivä`, date: birthdayIn(b, b.getFullYear() + n) })),
    { label: "30 000 päivää", date: new Date(b.getFullYear(), b.getMonth(), b.getDate() + 30000) },
    ...[90, 100].map((n) => ({ label: `${n}-vuotispäivä`, date: birthdayIn(b, b.getFullYear() + n) })),
  ];
  return rows
    .sort((x, y) => x.date - y.date)
    .map((r) => ({ ...r, past: r.date < o, weekday: WD[r.date.getDay()] }));
}

// Everything the result box shows for one birth date.
export function ageReport(birth, on) {
  if (!birth || Number.isNaN(birth.getTime()) || atMidnight(birth) > atMidnight(on)) return null;
  return {
    age: ageOn(birth, on),
    next: nextBirthday(birth, on),
    bornWeekday: WD[birth.getDay()],
    bornWeek: isoWeek(birth),
    bornWeekYear: isoYear(birth),
    milestones: milestones(birth, on),
  };
}

// "36 vuotta, 3 kuukautta ja 13 päivää", with singular forms.
export function ageText({ years, months, days }) {
  const part = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  return `${part(years, "vuosi", "vuotta")}, ${part(months, "kuukausi", "kuukautta")} ja ${part(days, "päivä", "päivää")}`;
}

// Birth year -> the age reached during `year`. Age before the birthday is
// one less, which the page says above the table.
export function birthYearTable(year, from = year - 90, to = year - 1) {
  const rows = [];
  for (let y = to; y >= from; y -= 1) rows.push({ born: y, turns: year - y });
  return rows;
}

const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;

// FAQ with fixed example dates, so the answers never depend on the build day.
export function ageFaqs() {
  const ex = ageOn(new Date(1990, 5, 15), new Date(2026, 8, 28));
  const days2000 = daysBetween(new Date(2000, 0, 1), new Date(2026, 0, 1));
  const leap = birthdayIn(new Date(2004, 1, 29), 2027);
  const adult = birthdayIn(new Date(2008, 9, 3), 2026);
  return [
    {
      q: "Miten ikä lasketaan?",
      a: `Ikä lasketaan täysinä vuosina, ja uusi vuosi täyttyy syntymäpäivänä. Laskuri näyttää lisäksi kuukaudet ja päivät viimeisestä syntymäpäivästä: esimerkiksi 15.6.1990 syntynyt on 28.9.2026 ${ageText(ex)} vanha.`,
    },
    {
      q: "Kuinka vanha olen, jos olen syntynyt vuonna 1990?",
      a: "Vuonna 1990 syntynyt täyttää vuonna 2026 36 vuotta. Ennen tämän vuoden syntymäpäivää ikä on 35 vuotta. Sivun taulukosta näet saman jokaiselle syntymävuodelle.",
    },
    {
      q: "Montako päivää vanha olen?",
      a: `Laskuri näyttää iän myös päivinä, viikkoina ja kuukausina. Esimerkiksi 1.1.2000 syntynyt oli 1.1.2026 täsmälleen ${days2000} päivää vanha.`,
    },
    {
      q: "Milloin 29.2. syntynyt täyttää vuosia?",
      a: `Karkausvuosina syntymäpäivä on 29.2. Muina vuosina laskuri laskee täydet vuodet täyttyviksi 1.3., eli seuraavana päivänä 28.2. jälkeen: esimerkiksi 29.2.2004 syntynyt täyttää vuonna 2027 vuotensa ${whenFi(leap)}. Juhlapäivän voi valita itse.`,
    },
    {
      q: "Milloin olen täysi-ikäinen?",
      a: `Suomessa täysi-ikäisyys alkaa 18-vuotispäivänä. Esimerkiksi 3.10.2008 syntynyt on täysi-ikäinen ${whenFi(adult)}. Laskuri näyttää oman päiväsi merkkipäivien listassa.`,
    },
  ];
}

export const AGE_STEPS = [
  "Valitse syntymäpäivä.",
  "Halutessasi vaihda päivä, jolle ikä lasketaan. Oletuksena on tämä päivä.",
  "Näet iän vuosina, kuukausina ja päivinä, seuraavan syntymäpäivän ja tulevat merkkipäivät.",
];
