// Year index hub (/kaikki-vuodet): the single crawlable entry point for the
// published years that sit outside the indexable window.
//
// Why this page exists: isIndexable() (seo.js) indexes dated hub families only
// for currentYear-1..currentYear+2. The homepage used to link every year in
// PRERENDER_MIN_YEAR..PRERENDER_MAX_YEAR directly, so ~11 of the 16 year pills
// pointed at noindex pages from the site's strongest page. Those years stay
// live and useful for visitors, and their week pages stay indexable across the
// full horizon, so they still need a crawl path - just not one competing for
// attention on the homepage. This hub is that path: the homepage links the
// in-window years plus this page, and this page links everything else.
//
// Distinct intent (not a duplicate of /vuosi-{year}): it answers "which years
// does this site publish, and where do I start", which no single year page can.

import {
  PRERENDER_MAX_YEAR,
  PRERENDER_MIN_YEAR,
  helsinkiDayKey,
  weeksInIsoYear,
} from "../components/dateUtils.js";

export const YEAR_INDEX_PATH = "/kaikki-vuodet";

// The indexable window isIndexable() applies to dated hub families. Kept here
// as the single source the page copy, the homepage split and the FAQ all read,
// so the three can never disagree with seo.js about which years are featured.
export const INDEX_WINDOW_BACK = 1;
export const INDEX_WINDOW_FORWARD = 2;

function calendarYear(date = new Date()) {
  return Number(helsinkiDayKey(date).slice(0, 4));
}

// Years the homepage keeps featuring directly: the indexable window, clamped
// to the publishing horizon.
export function featuredYears(date = new Date()) {
  const y = calendarYear(date);
  const from = Math.max(PRERENDER_MIN_YEAR, y - INDEX_WINDOW_BACK);
  const to = Math.min(PRERENDER_MAX_YEAR, y + INDEX_WINDOW_FORWARD);
  const years = [];
  for (let year = from; year <= to; year += 1) years.push(year);
  return years;
}

// Published years before the window ("aiemmat vuodet"), newest first: an
// archive reads better from the most recent year backwards.
export function earlierYears(date = new Date()) {
  const min = featuredYears(date)[0];
  const years = [];
  for (let year = min - 1; year >= PRERENDER_MIN_YEAR; year -= 1) years.push(year);
  return years;
}

// Published years after the window ("myohemmat vuodet"), oldest first.
export function laterYears(date = new Date()) {
  const max = featuredYears(date).at(-1);
  const years = [];
  for (let year = max + 1; year <= PRERENDER_MAX_YEAR; year += 1) years.push(year);
  return years;
}

// Every published year, newest-relevant ordering handled by the caller.
export function publishedYears() {
  const years = [];
  for (let year = PRERENDER_MIN_YEAR; year <= PRERENDER_MAX_YEAR; year += 1) {
    years.push(year);
  }
  return years;
}

export function yearIndexStats(date = new Date()) {
  const years = publishedYears();
  return {
    first: years[0],
    last: years.at(-1),
    count: years.length,
    weekCount: years.reduce((sum, year) => sum + weeksInIsoYear(year), 0),
    featured: featuredYears(date),
    earlier: earlierYears(date),
    later: laterYears(date),
  };
}

export function yearIndexMeta(date = new Date()) {
  const { first, last, count } = yearIndexStats(date);
  return {
    // Kept under prerender.js's MAX_TITLE_LENGTH of 60 characters.
    title: `Kaikki vuodet ${first}-${last}: viikot ja kalenterit | Viikko Nro`,
    description: `Viikkonumerot ja vuosikalenterit vuosilta ${first}-${last}. Valitse vuosi ja katso sen ISO-viikot, pyhäpäivät ja työpäivät. Yhteensä ${count} julkaistua vuotta.`,
  };
}

// One source for the visible <details> list and the FAQPage JSON-LD.
export function yearIndexFaqs(date = new Date()) {
  const { first, last, count, weekCount, featured, later } = yearIndexStats(date);
  return [
    {
      q: `Miltä vuosilta viikkonumerot löytyvät?`,
      a: `Sivustolla on viikkonumerot ja vuosikalenteri jokaiselle vuodelle ${first}-${last}, eli ${count} vuodelle. Niissä on yhteensä ${weekCount} ISO 8601 -viikkoa.`,
    },
    {
      q: `Miksi etusivu näyttää vain vuodet ${featured[0]}-${featured.at(-1)}?`,
      a: `Etusivu nostaa esiin ne vuodet, joita haetaan juuri nyt: kulunut vuosi, tämä vuosi ja kaksi seuraavaa. Muut vuodet löytyvät tältä sivulta, ja jokainen niistä toimii normaalisti.`,
    },
    {
      q: `Toimivatko myöhempien vuosien sivut jo nyt?`,
      a: later.length
        ? `Kyllä. Vuosien ${later[0]}-${later.at(-1)} viikkonumerot on laskettu ISO 8601 -säännöillä, joten ne ovat valmiita ja pysyviä. Pyhäpäivien ja koululomien kaltaiset tiedot vahvistetaan vasta lähempänä kyseistä vuotta.`
        : `Kyllä. Jokaisen julkaistun vuoden viikkonumerot on laskettu ISO 8601 -säännöillä, joten ne ovat valmiita ja pysyviä.`,
    },
    {
      q: `Lasketaanko viikkonumerot samalla tavalla kaikille vuosille?`,
      a: `Kyllä. Jokainen vuosi käyttää samaa ISO 8601 -sääntöä: viikko alkaa maanantaista ja vuoden ensimmäinen viikko on se, johon osuu ensimmäinen torstai. Siksi vuodessa on 52 tai 53 viikkoa.`,
    },
  ];
}
