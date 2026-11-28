// Sister sites: the same ISO 8601 week-number service in another language, on
// its own domain, with its own copy, holiday data and calendars. They are not
// translations of this site, so they are ordinary outbound links plus a schema
// relatedLink edge. They are never hreflang alternates (see
// docs/SEO_CONSTITUTION.md #12: no hreflang anywhere, and never a tag pointing
// at a URL that does not serve equivalent content) and never Organization
// sameAs, because each site is a separate entity, not another profile of this
// one.
//
// Each link is reciprocal: numerosemanas.es and weeknr.date both link back to
// viikkonro.fi from their own language section, so the pair is a mutual
// editorial link rather than a one-way outbound link. seo/backlinks.txt
// monitors that the return link stays in place and stays followed.
//
// `keyword` is the target market's own head term and is rendered inside a
// `lang`-tagged element, so the anchor text is relevant for the queries that
// site actually ranks for while the surrounding copy stays Finnish.
//
// Reciprocal link and live content verified: 2026-11-28.

export const SISTER_SITES = [
  {
    code: "es",
    language: "espanja",
    name: "NumeroSemanas.es",
    url: "https://www.numerosemanas.es/",
    keyword: "Número de semana",
    description:
      "Espanjankielinen viikkonumerosivusto: kuluva viikko, kalenterit, Espanjan pyhäpäivät ja arkipäivien laskenta espanjaksi.",
  },
  {
    code: "nl",
    language: "hollanti",
    name: "weeknr.date",
    url: "https://weeknr.date/",
    keyword: "Weeknummer",
    description:
      "Hollanninkielinen viikkonumerosivusto: kuluva viikko, kalenteriviikot ja Alankomaiden pyhäpäivät hollanniksi.",
  },
];

export const SISTER_SITE_HEADING = "Viikkonumero muilla kielillä";

export const SISTER_SITE_INTRO =
  "ISO 8601 -viikkonumerointi on sama Suomessa, Espanjassa ja Alankomaissa: viikko alkaa maanantaista ja viikko 1 on se viikko, johon 4. tammikuuta osuu. Pyhäpäivät, koululomat ja arkipäivät sen sijaan eroavat maittain, joten saman viikkolaskurin saa myös espanjaksi ja hollanniksi omilla maakohtaisilla tiedoillaan.";

// Canonical sister-site URLs for schema relatedLink on the pages that show
// the visible links. Schema mirrors what a reader can see, nothing more.
export const sisterSiteLinks = () => SISTER_SITES.map((site) => site.url);

// Topic-matched deep links. A Finnish page whose subject has a direct
// counterpart on the Spanish site links to that page instead of to the Spanish
// homepage: the homepage is already found and crawled every day, while its deep
// pages are the ones that gain from a direct crawl path, and a page-to-page
// link between two pages on the same subject is a relevance signal that a
// homepage link cannot be.
//
// Deliberately kept to a handful of contextual, topically matched pages. These
// are not added to the footer or to a shared template: extra links from one
// domain are consolidated anyway, and a sitewide reciprocal link between two
// sites with the same owner is the pattern that reads as a link network rather
// than an editorial link.
//
// Only Spanish targets are mapped. weeknr.date's URL structure was not verified
// page by page, and an unverified outbound URL is worse than no link.
//
// Every `match` resolves to a prerendered Finnish route and every `url`
// returned HTTP 200, both verified 2026-11-28. All targets are undated on
// purpose: a dated target such as /fases-luna-2026 goes stale, and the Spanish
// site has no undated equivalent of it yet.
const SPANISH = SISTER_SITES[0];

export const SISTER_TOPIC_LINKS = [
  {
    match: /^\/mika-on-viikkonumero$/,
    path: "/numeros-de-semana",
    keyword: "Número de semana",
    text: "Sama ISO 8601 -laskenta espanjaksi, Espanjan omilla pyhäpäivillä ja kalentereilla:",
  },
  {
    match: /^\/parillinen-pariton-viikko$/,
    path: "/semanas-pares-e-impares",
    keyword: "Semanas pares e impares",
    text: "Parillisten ja parittomien viikkojen laskenta espanjaksi:",
  },
  {
    match: /^\/pyhapaivat-\d{4}$/,
    path: "/festivos-por-comunidad",
    keyword: "Festivos por comunidad",
    text: "Espanjan pyhäpäivät vaihtelevat itsehallintoalueittain. Alueittainen luettelo espanjaksi:",
  },
  {
    match: /^\/tyopaivat-\d{4}$/,
    path: "/dias-laborables",
    keyword: "Días laborables",
    text: "Espanjan arkipäivien ja työpäivien laskenta espanjaksi:",
  },
  {
    match: /^\/tulostettava-kalenteri-\d{4}$/,
    path: "/calendario-imprimible",
    keyword: "Calendario imprimible",
    text: "Tulostettavat kalenterit espanjaksi:",
  },
  {
    match: /^\/paivien-erotus$/,
    path: "/calculadora-dias",
    keyword: "Calculadora de días",
    text: "Sama päivien erotuksen laskuri espanjaksi:",
  },
  {
    match: /^\/auringonlasku$/,
    path: "/amanecer-atardecer",
    keyword: "Amanecer y atardecer",
    text: "Auringonnousun ja -laskun ajat Espanjan kaupungeissa espanjaksi:",
  },
].map((entry) => ({
  ...entry,
  code: SPANISH.code,
  name: SPANISH.name,
  // Built from the site's own base URL so a domain change stays one edit.
  url: new URL(entry.path, SPANISH.url).href,
}));

// The topic link for one Finnish path, or null when that path has no matched
// counterpart. Takes the pathname, so it serves both the component (via
// useLocation) and prerender.js (via the route it is rendering).
export function sisterTopicLink(pathname) {
  return SISTER_TOPIC_LINKS.find((entry) => entry.match.test(pathname)) ?? null;
}

// The pages that render the full SisterSites section: both sister homepages.
// Kept here next to the topic map so the visible links and the schema edge are
// read from one place.
const SISTER_SECTION_PAGES = new Set(["/", "/tietoa-meista"]);

// Sister URLs a given route links to in visible copy, for schema relatedLink.
// Schema mirrors the rendered links exactly: a page that shows no sister link
// gets no sister relatedLink.
export function sisterSchemaLinks(pathname) {
  if (SISTER_SECTION_PAGES.has(pathname)) return sisterSiteLinks();
  const topic = sisterTopicLink(pathname);
  return topic ? [topic.url] : [];
}
