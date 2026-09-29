// Period and ovulation estimates for /kuukautislaskuri. Plain .js so
// prerender.js can import it.
//
// Health content: the page states only facts checked on 2026-09-28 against
// Terveyskylä (the Finnish university hospitals' health service), and says
// the result is an estimate and not a method of contraception:
// - A normal cycle is 21-35 days, counted from the first day of bleeding to
//   the start of the next bleeding; bleeding usually lasts 3-7 days
//   ("Normaali kuukautiskierto")
// - Ovulation happens about 12-14 days before the next period; the egg can be
//   fertilised for about 24 hours, sperm survive about 3-4 days, and
//   pregnancies have started from intercourse up to 5-6 days before
//   ovulation ("Milloin on hedelmällinen aika kuukautiskierrossa?")
// So ovulation is shown as a range (12-14 days before the next period), and
// the fertile days as the 5 days before that range plus the range itself.
import { fmtFullFi, isoWeek, isoYear, WD_ESSIVE } from "../components/dateUtils.js";

export const PERIOD_PATH = "/kuukautislaskuri";
export const FACTS_CHECKED = "28.9.2026";
export const SOURCES = {
  cycle: "https://www.terveyskyla.fi/naistalo/lisaantymisterveys/hedelmallisyys/lisaantymisen-anatomia-ja-fysiologia/normaali-kuukautiskierto",
  fertile: "https://www.terveyskyla.fi/naistalo/lisaantymisterveys/hedelmallisyys/raskauden-alkaminen/milloin-on-hedelmallinen-aika-kuukautiskierrossa",
};
export const NORMAL_CYCLE = { min: 21, max: 35 };
export const INPUT_CYCLE = { min: 15, max: 60 };
export const DEFAULT_CYCLE = 28;
export const DEFAULT_BLEEDING = 5;

const DAY = 86400000;
const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a, b) => Math.round((atMidnight(b) - atMidnight(a)) / DAY);
const clampInt = (v, min, max, fallback) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

// One cycle starting on `start`: the bleeding days, the estimated ovulation
// range and the estimated fertile days, all before the next period.
export function cycleFrom(start, cycle, bleeding) {
  const s = atMidnight(start);
  const next = addDays(s, cycle);
  const ovulationFrom = addDays(next, -14);
  const ovulationTo = addDays(next, -12);
  return {
    start: s,
    bleedingTo: addDays(s, bleeding - 1),
    ovulationFrom,
    ovulationTo,
    fertileFrom: addDays(ovulationFrom, -5),
    fertileTo: ovulationTo,
    next,
    week: isoWeek(s),
    weekYear: isoYear(s),
  };
}

// Everything the result shows, as of `today`. Returns null for a missing
// start date; `future: true` when the start date is after today.
export function periodReport({ lastStart, cycle, bleeding }, today) {
  if (!lastStart || Number.isNaN(lastStart.getTime())) return null;
  const c = clampInt(cycle, INPUT_CYCLE.min, INPUT_CYCLE.max, DEFAULT_CYCLE);
  const b = clampInt(bleeding, 1, 10, DEFAULT_BLEEDING);
  const t = atMidnight(today);
  const first = atMidnight(lastStart);
  if (first > t) return { future: true, cycle: c, bleeding: b };
  // Roll forward to the cycle that contains today, so an old date still gives
  // the next period in the future.
  const passed = Math.floor(daysBetween(first, t) / c);
  const current = cycleFrom(addDays(first, passed * c), c, b);
  const upcoming = Array.from({ length: 6 }, (_, i) => cycleFrom(addDays(current.start, (i + 1) * c), c, b));
  return {
    future: false,
    cycle: c,
    bleeding: b,
    normal: c >= NORMAL_CYCLE.min && c <= NORMAL_CYCLE.max,
    cycleDay: daysBetween(current.start, t) + 1,
    current,
    next: current.next,
    daysToNext: daysBetween(t, current.next),
    upcoming,
  };
}

const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

// FAQ with a fixed example, so the answers never depend on the build day.
export function periodFaqs() {
  const ex = cycleFrom(new Date(2027, 2, 1), 28, 5);
  return [
    {
      q: "Miten seuraavat kuukautiset lasketaan?",
      a: `Kierron pituus lasketaan ensimmäisestä vuotopäivästä seuraavan vuodon alkamispäivään. Seuraavat kuukautiset alkavat arviolta, kun edellisten alusta on kulunut kierron pituuden verran: esimerkiksi jos kuukautiset alkoivat 1.3.2027 ja kierto on 28 päivää, seuraavat alkavat arviolta ${whenFi(ex.next)}.`,
    },
    {
      q: "Mikä on normaali kuukautiskierron pituus?",
      a: "Normaali kuukautiskierron pituus on 21-35 vuorokautta, ja varsinainen kuukautisvuoto kestää yleensä 3-7 vuorokautta.",
    },
    {
      q: "Milloin ovulaatio tapahtuu?",
      a: `Ovulaatio tapahtuu noin 12-14 päivää ennen seuraavan kuukautisvuodon alkua. 28 päivän kierrossa se on siis noin kierron 15.-17. päivänä, esimerkiksi 1.3.2027 alkaneessa kierrossa arviolta ${dm(ex.ovulationFrom)}-${dm(ex.ovulationTo)}`,
    },
    {
      q: "Mitkä ovat hedelmälliset päivät?",
      a: `Munasolu on hedelmöityskelpoinen noin vuorokauden ovulaatiosta, ja siittiöt elävät naisen elimistössä noin 3-4 vuorokautta. Raskaus voi alkaa jopa 5-6 päivää ennen ovulaatiota tapahtuneista yhdynnöistä. Laskuri näyttää hedelmällisinä päivinä viisi päivää ennen arvioitua ovulaatiota sekä ovulaatiopäivät: esimerkin kierrossa ${dm(ex.fertileFrom)}-${dm(ex.fertileTo)}`,
    },
    {
      q: "Voiko laskuria käyttää ehkäisyyn?",
      a: "Ei. Laskuri antaa vain arvion, joka perustuu keskimääräiseen kiertoon, ja ovulaation ajankohta vaihtelee kierrosta toiseen. Luotettavasta ehkäisystä kannattaa keskustella terveydenhuollon ammattilaisen kanssa.",
    },
  ];
}

export const PERIOD_STEPS = [
  "Valitse viimeisten kuukautisten ensimmäinen vuotopäivä.",
  "Tarkista kierron pituus ja vuodon kesto. Oletuksena on 28 päivän kierto ja 5 päivän vuoto.",
  "Näet seuraavien kuukautisten päivämäärän, arvioidun ovulaation ja hedelmälliset päivät sekä kuusi seuraavaa kiertoa.",
];
