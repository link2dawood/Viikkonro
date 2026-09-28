// Time arithmetic for /tuntilaskuri: hours between two clock times, a weekly
// working-hours sum, and minutes <-> decimal hours. Plain .js so prerender.js
// can import it.
//
// Working-time facts on the page, checked 2026-09-28 against the Finnish
// Working Hours Act (työaikalaki 872/2019) as restated by the Finnish
// Institute of Occupational Health (ttl.fi) and Tehy's työelämäopas:
// - 5 §: regular working time at most 8 hours a day and 40 hours a week
// - 24 §: over 6 hours of work a day gives at least a one-hour break during
//   which the employee may leave the workplace; it can be agreed down to at
//   least half an hour
// - 25 §: at least 11 hours of uninterrupted daily rest
// Collective agreements can set other rules, which the page says.

export const HOURS_PATH = "/tuntilaskuri";
export const WORKING_TIME_ACT_URL = "https://www.finlex.fi/fi/laki/ajantasa/2019/20190872";
export const FACTS_CHECKED = "28.9.2026";
export const WEEKDAYS_FI = ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai", "Sunnuntai"];

// "7.30", "07:30", "7,30", "730" or "7" -> minutes after midnight, or null.
export function parseClock(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  let h;
  let m;
  const sep = s.match(/^(\d{1,2})[.:,](\d{1,2})$/);
  if (sep) {
    h = Number(sep[1]);
    m = Number(sep[2]);
  } else if (/^\d{3,4}$/.test(s)) {
    h = Number(s.slice(0, -2));
    m = Number(s.slice(-2));
  } else if (/^\d{1,2}$/.test(s)) {
    h = Number(s);
    m = 0;
  } else {
    return null;
  }
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}

// Worked minutes from start to end, minus the break. An end earlier than the
// start means the shift ends the next day (a night shift).
export function shiftMinutes(start, end, breakMinutes = 0) {
  const a = parseClock(start);
  const b = parseClock(end);
  if (a === null || b === null) return null;
  const span = b >= a ? b - a : b + 1440 - a;
  const brk = Math.max(0, Math.round(Number(breakMinutes) || 0));
  return {
    span,
    worked: Math.max(0, span - brk),
    overnight: b < a,
    breakMinutes: brk,
  };
}

// "7 h 30 min"; "45 min"; "8 h"
export function fmtHM(minutes) {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (!h) return `${sign}${m} min`;
  return m ? `${sign}${h} h ${m} min` : `${sign}${h} h`;
}

// Decimal hours with a Finnish decimal comma: 450 -> "7,50"
export const toDecimal = (minutes, digits = 2) => (minutes / 60).toFixed(digits).replace(".", ",");

// "7,75" or "7.75" -> minutes (rounded), or null.
export function decimalToMinutes(value) {
  const n = Number(String(value ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 60);
}

// Weekly sum over rows of { start, end, break }. Empty rows are skipped.
export function weekTotal(rows) {
  let worked = 0;
  let days = 0;
  const perDay = rows.map((r) => {
    const s = shiftMinutes(r.start, r.end, r.break);
    if (s) {
      worked += s.worked;
      days += 1;
    }
    return s;
  });
  return { perDay, worked, days, diffTo40: worked - 40 * 60 };
}

// Minutes 1-60 as decimal hours, for the reference table.
export const MINUTE_TABLE = Array.from({ length: 60 }, (_, i) => ({ min: i + 1, dec: toDecimal(i + 1) }));

// Worked examples with fixed times, computed by the calculator itself.
export const EXAMPLES = [
  { label: "Päivävuoro 8.00-16.30, tauko 30 min", start: "8.00", end: "16.30", brk: 30 },
  { label: "Iltavuoro 14.00-22.15, tauko 30 min", start: "14.00", end: "22.15", brk: 30 },
  { label: "Yövuoro 22.00-6.00, tauko 30 min", start: "22.00", end: "6.00", brk: 30 },
].map((e) => ({ ...e, r: shiftMinutes(e.start, e.end, e.brk) }));

export function hoursFaqs() {
  const ex = shiftMinutes("8.00", "16.30", 30);
  return [
    {
      q: "Miten muutan minuutit tunneiksi desimaaleina?",
      a: `Jaa minuutit 60:llä. Esimerkiksi 15 min on ${toDecimal(15)} h, 30 min on ${toDecimal(30)} h ja 45 min on ${toDecimal(45)} h. Näin 7 h 45 min on ${toDecimal(465)} tuntia.`,
    },
    {
      q: "Miten lasken työtunnit kellonajoista?",
      a: `Vähennä lopetusajasta aloitusaika ja sen jälkeen tauot. Esimerkiksi 8.00-16.30 on 8 h 30 min, ja kun siitä vähennetään 30 minuutin tauko, työaikaa on ${fmtHM(ex.worked)} eli ${toDecimal(ex.worked)} tuntia.`,
    },
    {
      q: "Miten lasken yövuoron tunnit?",
      a: `Jos vuoro päättyy seuraavan päivän puolella, laskuri lisää keskiyön yli menevän ajan automaattisesti. Esimerkiksi 22.00-6.00 on 8 tuntia, ja 30 minuutin tauon jälkeen työaikaa on ${fmtHM(EXAMPLES[2].r.worked)}.`,
    },
    {
      q: "Lasketaanko ruokatauko työaikaan?",
      a: "Työaikalain mukainen lepoaika, jonka aikana työntekijä saa poistua työpaikalta, ei ole työaikaa. Jos työpäivä on yli kuusi tuntia, lepoaikaa on annettava vähintään tunti, tai sovittaessa vähintään puoli tuntia. Kahvitauoista ja muista tauoista sovitaan yleensä työehtosopimuksissa.",
    },
    {
      q: "Montako tuntia viikossa saa tehdä töitä?",
      a: "Työaikalain mukaan säännöllinen työaika on enintään 8 tuntia vuorokaudessa ja 40 tuntia viikossa. Tämän ylittävä työ on lisä- tai ylityötä, ja työehtosopimukset voivat määrätä toisin.",
    },
  ];
}

export const HOURS_STEPS = [
  "Kirjoita aloitus- ja lopetusaika, esimerkiksi 8.00 ja 16.30.",
  "Lisää tauon pituus minuutteina.",
  "Näet työajan tunteina ja minuutteina sekä desimaalitunteina.",
  "Viikkotaulukkoon voit syöttää jokaisen päivän, jolloin näet viikon tunnit yhteensä.",
];
