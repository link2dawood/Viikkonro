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
