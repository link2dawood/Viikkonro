// Finnish public holidays (juhlapäivät) and flag days (liputuspäivät) for the
// calendar view. Self-contained: implements the Gregorian Easter (Anonymous
// Gauss) algorithm and derives the movable feasts from it, so it has no
// imports and works identically in the client bundle, the SSR bundle, and any
// plain-Node context. (The site's ISO-week math is separate and untouched.)

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
function key(date) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Gregorian Easter Sunday (Anonymous Gauss / Meeus–Jones–Butcher).
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// The single Saturday within a 7-day window starting at (month0, dayStart).
function saturdayInWindow(year, month0, dayStart) {
  for (let d = dayStart; d <= dayStart + 6; d++) {
    const date = new Date(year, month0, d);
    if (date.getDay() === 6) return date;
  }
  return new Date(year, month0, dayStart); // unreachable
}

// nth Sunday of a month (n = 1 for first). Used for Mother's/Father's Day.
function nthSundayOfMonth(year, month0, n) {
  const first = new Date(year, month0, 1);
  const firstSunday = 1 + ((7 - first.getDay()) % 7);
  return new Date(year, month0, firstSunday + (n - 1) * 7);
}

// Public holidays → Map("MM-DD" -> name). Movable feasts computed per year.
export function getJuhlapaivat(year) {
  const easter = easterSunday(year);
  const midsummerDay = saturdayInWindow(year, 5, 20); // Saturday 20–26 June
  const allSaints = saturdayInWindow(year, 9, 31); // Saturday 31 Oct – 6 Nov

  return new Map([
    ["01-01", "Uudenvuodenpäivä"],
    ["01-06", "Loppiainen"],
    [key(addDays(easter, -2)), "Pitkäperjantai"],
    [key(easter), "Pääsiäispäivä"],
    [key(addDays(easter, 1)), "2. pääsiäispäivä"],
    ["05-01", "Vappu"],
    [key(addDays(easter, 39)), "Helatorstai"],
    [key(addDays(easter, 49)), "Helluntaipäivä"],
    [key(addDays(midsummerDay, -1)), "Juhannusaatto"],
    [key(midsummerDay), "Juhannuspäivä"],
    [key(allSaints), "Pyhäinpäivä"],
    ["12-06", "Itsenäisyyspäivä"],
    ["12-24", "Jouluaatto"],
    ["12-25", "Joulupäivä"],
    ["12-26", "Tapaninpäivä"],
  ]);
}

// Last Saturday of a month (month0 is 0-based). Used for Suomen luonnon päivä.
function lastSaturdayOfMonth(year, month0) {
  const last = new Date(year, month0 + 1, 0);
  return new Date(year, month0, last.getDate() - ((last.getDay() + 1) % 7));
}

// Flag days → Map("MM-DD" -> name[]). The full list of dated flag days,
// checked 2026-09-28 against almanakka.helsinki.fi (the University of
// Helsinki almanac office, which keeps the list of customary flag days) and
// fi.wikipedia.org/wiki/Luettelo_Suomen_liputuspäivistä: 7 official days in
// the flag-day decree plus the customary ones. Election days and presidential
// inaugurations are also official flag days but have no fixed date, so they
// are not listed. Days added recently only apply from their first year
// (`since`). Movable days can land on the same date as a fixed one (e.g.
// Äitienpäivä and Eurooppa-päivä both fall on 9 May in 2027), which is why the
// value is an array: a collision never silently drops a real flag day.
export function getLiputuspaivat(year) {
  const entries = [
    ["02-05", "J. L. Runebergin päivä"],
    ["02-28", "Kalevalan päivä"],
    ["03-19", "Minna Canthin päivä"],
    ["04-09", "Mikael Agricolan päivä / Suomen kielen päivä"],
    ["04-27", "Kansallinen veteraanipäivä"],
    ["05-01", "Vappu"],
    ["05-09", "Eurooppa-päivä"],
    ["05-12", "J. V. Snellmanin päivä"],
    [key(nthSundayOfMonth(year, 4, 2)), "Äitienpäivä"],
    [key(nthSundayOfMonth(year, 4, 3)), "Kaatuneitten muistopäivä"],
    ["06-04", "Puolustusvoimain lippujuhlan päivä"],
    [key(saturdayInWindow(year, 5, 20)), "Juhannuspäivä"],
    ["07-06", "Eino Leinon päivä"],
    [key(lastSaturdayOfMonth(year, 7)), "Suomen luonnon päivä", 2023],
    ["10-01", "Miina Sillanpään päivä", 2023],
    ["10-10", "Aleksis Kiven päivä"],
    ["10-24", "YK:n päivä"],
    ["11-06", "Ruotsalaisuuden päivä"],
    [key(nthSundayOfMonth(year, 10, 2)), "Isänpäivä"],
    ["11-20", "Lapsen oikeuksien päivä", 2020],
    ["12-06", "Itsenäisyyspäivä"],
    ["12-08", "Jean Sibeliuksen päivä"],
  ];
  const map = new Map();
  for (const [mmdd, name, since] of entries) {
    if (since && year < since) continue;
    if (!map.has(mmdd)) map.set(mmdd, []);
    map.get(mmdd).push(name);
  }
  return map;
}
