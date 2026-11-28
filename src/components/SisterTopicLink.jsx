import { useLocation } from "react-router-dom";
import { sisterTopicLink } from "../data/sisterSites";

// One contextual link from a Finnish page to the Spanish page on the same
// subject, for the handful of pages that have a verified counterpart (see
// SISTER_TOPIC_LINKS). Returns null everywhere else, so the map in the data
// module is the only thing that decides which pages carry a link.
//
// Rendered once from AppRoutes next to TopicGuide and RelatedTools rather than
// edited into each page, so the pages themselves stay untouched and the set
// cannot drift from the schema relatedLink that prerender.js emits from the
// same map. Same rel policy as SisterSites: external, noopener, followed.
export default function SisterTopicLink() {
  const { pathname } = useLocation();
  const link = sisterTopicLink(pathname);
  if (!link) return null;
  return (
    <section className="app sister-topic noprint" aria-label="Sama aihe espanjaksi">
      <p>
        {link.text}{" "}
        <a href={link.url} hrefLang={link.code} rel="external noopener">
          <span lang={link.code}>{link.keyword}</span>
          {` (${link.name})`}
        </a>
      </p>
    </section>
  );
}
