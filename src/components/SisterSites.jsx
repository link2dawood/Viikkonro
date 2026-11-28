import {
  SISTER_SITES,
  SISTER_SITE_HEADING,
  SISTER_SITE_INTRO,
} from "../data/sisterSites";

// Visible, crawlable links to the sister-language week-number sites, rendered
// from one data module so the homepage and /tietoa-meista cannot drift apart.
//
// rel="external noopener" matches the site's other outbound links. The links
// stay followed on purpose: these are editorially chosen, reciprocal partner
// sites, not user-generated or paid placements. hrefLang on an <a> is only a
// hint about the target document's language; it does not declare an hreflang
// alternate, which the SEO constitution forbids. The Spanish and Dutch head
// terms carry their own lang attribute so a screen reader and a crawler both
// see which words are not Finnish.
export default function SisterSites({ id = "viikkonumero-muilla-kielilla" }) {
  return (
    <section className="prose" id={id}>
      <h2>{SISTER_SITE_HEADING}</h2>
      <p>{SISTER_SITE_INTRO}</p>
      <div className="quicklinks">
        {SISTER_SITES.map((site) => (
          <a
            className="ql"
            key={site.url}
            href={site.url}
            hrefLang={site.code}
            rel="external noopener"
          >
            <b>
              <span lang={site.code}>{site.keyword}</span>
              {`: ${site.name}`}
            </b>
            <span>{site.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
