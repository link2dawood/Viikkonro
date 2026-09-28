// Sunrise and sunset by city for /auringonlasku-{city} and the /auringonlasku
// hub. Plain .js with explicit extensions so prerender.js can import it
// (sunTimes.js imports dateUtils without one, which only Vite resolves).
//
// Solar times come from suncalc, the same library sunTimes.js uses on the
// week pages: sunrise/sunset is the Sun's upper limb at the horizon with
// standard refraction (altitude -0.833 degrees). Checked 2026-09-28: Helsinki
// 21.6.2026 03.54 / 22.50 and 21.12.2026 09.23 / 15.12, and Utsjoki's midnight
// sun 17.5.-28.7. and kaamos 26.11.-15.1. (the windows sunTimes.test.js
// already verifies) come out of the same calculation. Times are formatted in
// Europe/Helsinki, so summer time is handled by the platform time-zone data.
// Coordinates are the municipal centres.
import { getTimes, getPosition } from "suncalc";
import { fmtFullFi, M_FULL, WD_ESSIVE } from "../components/dateUtils.js";

export const SUN_HUB_PATH = "/auringonlasku";
export const sunCityPath = (slug) => `/auringonlasku-${slug}`;

// name, locative ("Helsingissä"), coordinates. Ordered south to north.
export const SUN_CITIES = [
  { slug: "helsinki", name: "Helsinki", in: "Helsingissä", lat: 60.1699, lon: 24.9384 },
  { slug: "espoo", name: "Espoo", in: "Espoossa", lat: 60.2055, lon: 24.6559 },
  { slug: "turku", name: "Turku", in: "Turussa", lat: 60.4518, lon: 22.2666 },
  { slug: "lahti", name: "Lahti", in: "Lahdessa", lat: 60.9827, lon: 25.6612 },
  { slug: "lappeenranta", name: "Lappeenranta", in: "Lappeenrannassa", lat: 61.0587, lon: 28.1887 },
  { slug: "pori", name: "Pori", in: "Porissa", lat: 61.4851, lon: 21.7974 },
  { slug: "tampere", name: "Tampere", in: "Tampereella", lat: 61.4978, lon: 23.761 },
  { slug: "jyvaskyla", name: "Jyväskylä", in: "Jyväskylässä", lat: 62.2426, lon: 25.7473 },
  { slug: "joensuu", name: "Joensuu", in: "Joensuussa", lat: 62.601, lon: 29.7636 },
  { slug: "kuopio", name: "Kuopio", in: "Kuopiossa", lat: 62.8924, lon: 27.677 },
  { slug: "vaasa", name: "Vaasa", in: "Vaasassa", lat: 63.0951, lon: 21.6165 },
  { slug: "oulu", name: "Oulu", in: "Oulussa", lat: 65.0121, lon: 25.4651 },
  { slug: "rovaniemi", name: "Rovaniemi", in: "Rovaniemellä", lat: 66.5039, lon: 25.7294 },
  { slug: "inari", name: "Inari", in: "Inarissa", lat: 68.9064, lon: 27.0288 },
  { slug: "utsjoki", name: "Utsjoki", in: "Utsjoella", lat: 69.9086, lon: 27.0272 },
];
const BY_SLUG = new Map(SUN_CITIES.map((c) => [c.slug, c]));
export const sunCity = (slug) => BY_SLUG.get(slug) ?? null;

const timeFmt = new Intl.DateTimeFormat("fi-FI", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Helsinki",
});
export const fmtTime = (d) => (d ? timeFmt.format(d) : null);

// Solar times for one calendar date. Queried at 10:00 UTC (near local solar
// noon), so the machine's own time zone never changes which day suncalc uses.
export function sunDay(city, y, m0, d) {
  const probe = new Date(Date.UTC(y, m0, d, 10));
  const t = getTimes(probe, city.lat, city.lon);
  const ok = (x) => x && !Number.isNaN(x.getTime());
  const date = new Date(y, m0, d);
  if (ok(t.sunrise) && ok(t.sunset)) {
    return {
      date,
      sunrise: t.sunrise,
      sunset: t.sunset,
      daylight: Math.round((t.sunset - t.sunrise) / 60000),
      // Unrounded, so the solstice wins over neighbours with the same minute count.
      ms: t.sunset - t.sunrise,
      polarDay: false,
      polarNight: false,
    };
  }
  const polarDay = getPosition(t.solarNoon, city.lat, city.lon).altitude > 0;
  return { date, sunrise: null, sunset: null, daylight: polarDay ? 1440 : 0, ms: polarDay ? 86400000 : 0, polarDay, polarNight: !polarDay };
}

export function sunYear(city, year) {
  const days = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = new Date(year, d.getMonth(), d.getDate() + 1)) {
    days.push(sunDay(city, year, d.getMonth(), d.getDate()));
  }
  return days;
}

export const fmtDaylight = (min) => `${Math.floor(min / 60)} h ${min % 60} min`;
const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const whenFi = (d) => `${WD_ESSIVE[d.getDay()]} ${fmtFullFi(d)}`;

// Consecutive runs of polar day or polar night within the year.
function runs(days, key) {
  const out = [];
  let start = null;
  days.forEach((day, i) => {
    if (day[key] && start === null) start = i;
    if ((!day[key] || i === days.length - 1) && start !== null) {
      const end = day[key] ? i : i - 1;
      out.push({ from: days[start].date, to: days[end].date, count: end - start + 1 });
      start = null;
    }
  });
  return out;
}

// Year summary for one city: longest/shortest day, 12-hour crossings,
// polar periods, and the 1st and 15th of every month for the table. Cached,
// since a page asks for the same city-year several times.
const summaryCache = new Map();
export function sunSummary(city, year) {
  const key = `${city.slug}-${year}`;
  if (!summaryCache.has(key)) summaryCache.set(key, computeSummary(city, year));
  return summaryCache.get(key);
}

function computeSummary(city, year) {
  const days = sunYear(city, year);
  const withTimes = days.filter((d) => d.sunrise);
  const longest = days.reduce((a, b) => (b.ms > a.ms ? b : a));
  const shortest = days.reduce((a, b) => (b.ms < a.ms ? b : a));
  const twelve = days.filter((d, i) => i > 0 && (days[i - 1].daylight < 720) !== (d.daylight < 720));
  const earliestSunrise = withTimes.reduce((a, b) => (fmtTime(b.sunrise) < fmtTime(a.sunrise) ? b : a));
  const latestSunset = withTimes.reduce((a, b) => (fmtTime(b.sunset) > fmtTime(a.sunset) ? b : a));
  return {
    city,
    year,
    days,
    longest,
    shortest,
    twelve,
    earliestSunrise,
    latestSunset,
    midnightSun: runs(days, "polarDay"),
    polarNight: runs(days, "polarNight"),
    table: M_FULL.flatMap((monthName, m0) => [1, 15].map((d) => ({ monthName, ...days.find((x) => x.date.getMonth() === m0 && x.date.getDate() === d) }))),
  };
}

// Today at one city, with the change from yesterday.
export function sunToday(city, today) {
  const y = today.getFullYear();
  const m0 = today.getMonth();
  const d = today.getDate();
  const t = sunDay(city, y, m0, d);
  const prev = sunDay(city, y, m0, d - 1);
  return { ...t, change: t.daylight - prev.daylight };
}

const HELSINKI = SUN_CITIES[0];

// "17.5.-26.7." style ranges of polar day or night runs.
const rangeText = (rs) => rs.map((r) => `${dm(r.from)}-${dm(r.to)}`).join(" ja ");

function polarSentence(s) {
  const parts = [];
  if (s.midnightSun.length) {
    const r = s.midnightSun[0];
    parts.push(`Keskiyön aurinko (yötön yö, aurinko ei laske) kestää ${s.city.in} vuonna ${s.year} ${dm(r.from)}-${dm(r.to)}, eli ${r.count} vuorokautta.`);
  }
  if (s.polarNight.length) {
    const r = s.polarNight.map((p) => `${dm(p.from)}-${dm(p.to)}`).join(" ja ");
    const total = s.polarNight.reduce((n, p) => n + p.count, 0);
    parts.push(`Kaamos (aurinko ei nouse lainkaan) on ${s.city.in} vuonna ${s.year} ${r}, yhteensä ${total} vuorokautta.`);
  }
  return parts.join(" ");
}

export function sunCityMeta(slug, today) {
  const city = sunCity(slug);
  const t = sunToday(city, today);
  const todayText = t.sunrise
    ? `Tänään aurinko nousee klo ${fmtTime(t.sunrise)} ja laskee klo ${fmtTime(t.sunset)}.`
    : t.polarDay
      ? "Tänään aurinko ei laske lainkaan."
      : "Tänään aurinko ei nouse lainkaan.";
  return {
    title: `Auringonlasku ja -nousu ${city.in} | Viikko Nro`,
    description: `${todayText} Auringonnousu- ja laskuajat ${city.in} koko vuodelle, päivän pituus sekä pisin ja lyhyin päivä.`,
  };
}

// Shared by SunCity.jsx (visible <details>) and prerender.js (FAQPage).
export function sunCityFaqs(slug, today) {
  const city = sunCity(slug);
  const y = today.getFullYear();
  const s = sunSummary(city, y);
  const t = sunToday(city, today);
  const faqs = [
    {
      q: `Mihin aikaan aurinko laskee ${city.in} tänään?`,
      a: t.sunrise
        ? `${city.in} aurinko laskee tänään (${dm(t.date)}) klo ${fmtTime(t.sunset)} ja nousee klo ${fmtTime(t.sunrise)}. Valoisaa aikaa on ${fmtDaylight(t.daylight)}.`
        : `${city.in} aurinko ei tänään (${dm(t.date)}) ${t.polarDay ? "laske lainkaan: on keskiyön auringon aika" : "nouse lainkaan: on kaamos"}.`,
    },
    {
      q: `Milloin on vuoden pisin päivä ${city.in}?`,
      a: s.longest.polarDay
        ? `${city.in} aurinko ei laske lainkaan keskiyön auringon aikaan, vuonna ${y} ${rangeText(s.midnightSun)}, joten pisin päivä kestää koko vuorokauden.`
        : `Vuonna ${y} pisin päivä ${city.in} on ${whenFi(s.longest.date)}: aurinko nousee klo ${fmtTime(s.longest.sunrise)} ja laskee klo ${fmtTime(s.longest.sunset)}, valoisaa ${fmtDaylight(s.longest.daylight)}.`,
    },
    {
      q: `Milloin on vuoden lyhyin päivä ${city.in}?`,
      a: s.shortest.polarNight
        ? `${city.in} aurinko ei nouse lainkaan kaamoksen aikana, vuonna ${y} ${rangeText(s.polarNight)}.`
        : `Vuonna ${y} lyhyin päivä ${city.in} on ${whenFi(s.shortest.date)}: aurinko nousee klo ${fmtTime(s.shortest.sunrise)} ja laskee klo ${fmtTime(s.shortest.sunset)}, valoisaa vain ${fmtDaylight(s.shortest.daylight)}.`,
    },
    {
      q: `Onko ${city.in} yötöntä yötä tai kaamosta?`,
      a:
        polarSentence(s) ||
        `Ei. ${city.in} aurinko nousee ja laskee joka päivä. Keskikesällä yöt ovat silti valoisia, koska aurinko käy vain vähän horisontin alapuolella, ja keskitalvella valoisaa on vain muutama tunti.`,
    },
    {
      q: `Milloin päivä on 12 tuntia pitkä ${city.in}?`,
      a: `Vuonna ${y} valoisa aika ylittää 12 tuntia ${city.in} ${whenFi(s.twelve[0].date)} ja jää taas alle 12 tunnin ${whenFi(s.twelve[s.twelve.length - 1].date)}.`,
    },
  ];
  if (city.slug !== HELSINKI.slug) {
    const hel = sunSummary(HELSINKI, y);
    const diff = s.longest.daylight - hel.longest.daylight;
    faqs.push({
      q: `Paljonko ${city.name} eroaa Helsingistä?`,
      a: s.longest.polarDay
        ? `Helsingissä aurinko laskee joka päivä, mutta ${city.in} on keskiyön aurinko. Helsingin pisin päivä on ${fmtDaylight(hel.longest.daylight)}.`
        : `Pisimpänä päivänä ${city.in} on valoisaa ${fmtDaylight(s.longest.daylight)}, eli ${diff >= 0 ? `${fmtDaylight(diff)} enemmän` : `${fmtDaylight(-diff)} vähemmän`} kuin Helsingissä.`,
    });
  }
  // A date range like "31.12." can end a sentence: avoid "31.12..".
  return faqs.map(({ q, a }) => ({ q, a: a.replaceAll("..", ".") }));
}

export function sunHubMeta() {
  return {
    title: "Auringonnousu ja -lasku tänään kaupungeittain | Viikko Nro",
    description:
      "Auringonnousu- ja laskuajat tänään Helsingistä Utsjoelle. Katso päivän pituus, pisin ja lyhyin päivä sekä yötön yö ja kaamos kaupungeittain.",
  };
}

// Today at every city, for the hub table.
export function sunAllToday(today) {
  return SUN_CITIES.map((city) => ({ city, ...sunToday(city, today) }));
}

// Shared by SunHub.jsx and prerender.js (FAQPage) for the hub page.
export function sunHubFaqs(today) {
  const rows = sunAllToday(today);
  const withRise = rows.filter((r) => r.sunrise);
  const first = withRise.reduce((a, b) => (b.sunrise < a.sunrise ? b : a));
  const lastSet = withRise.reduce((a, b) => (b.sunset > a.sunset ? b : a));
  const longest = rows.reduce((a, b) => (b.daylight > a.daylight ? b : a));
  const shortest = rows.reduce((a, b) => (b.daylight < a.daylight ? b : a));
  const day = `${today.getDate()}.${today.getMonth() + 1}.`;
  return [
    {
      q: "Missä aurinko nousee Suomessa ensimmäisenä tänään?",
      a: `Tämän sivun kaupungeista aurinko nousee tänään (${day}) ensimmäisenä ${first.city.in} klo ${fmtTime(first.sunrise)} ja laskee viimeisenä ${lastSet.city.in} klo ${fmtTime(lastSet.sunset)}.`,
    },
    {
      q: "Missä päivä on tänään pisin ja missä lyhyin?",
      a: `Tänään valoisaa on eniten ${longest.city.in} (${fmtDaylight(longest.daylight)}) ja vähiten ${shortest.city.in} (${fmtDaylight(shortest.daylight)}).`,
    },
    {
      q: "Miksi aurinko nousee eri aikaan eri puolilla Suomea?",
      a: "Koko Suomi on samalla aikavyöhykkeellä, mutta itäisillä paikkakunnilla aurinko nousee ja laskee aiemmin kuin läntisillä. Leveysaste vaikuttaa päivän pituuteen: mitä pohjoisempana ollaan, sitä pidempiä ovat kesäpäivät ja lyhyempiä talvipäivät.",
    },
    {
      q: "Miten auringonnousu ja -lasku määritellään?",
      a: "Auringonnousu ja -lasku ovat hetkiä, jolloin auringon yläreuna on horisontissa. Laskussa on huomioitu ilmakehän taittuminen, joten aurinko näkyy hetken jo ennen kuin se geometrisesti on horisontin yläpuolella.",
    },
  ];
}

export { polarSentence };
