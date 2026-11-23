import { Link } from "react-router-dom";
import { useToday } from "./useToday";
import {
  navigationYearTargets,
  PRERENDER_MAX_YEAR,
  PRERENDER_MIN_YEAR,
} from "./dateUtils";

// The printable-calendar block for high-impression, low-click pages
// (/isanpaiva-{y}, /pyhat-{y}/{slug}, /pyhapaivat-{y}, /kesaaika-{y},
// /kuun-vaiheet-{y}). Those pages answer their whole question in the SERP, so
// the visitors who do click are calendar users arriving on a page with nothing
// to convert them. This sends them to the two pages that do convert.
//
// The year is computed, never hardcoded: navigationYearTargets() is the same
// site-wide promotion rule the header quicklinks use, so from 1 October this
// block promotes the upcoming calendar year and never needs an annual edit.
// Anchor text matches each target's own owned token ("Tulostettava kalenteri"
// for the PDF page, "Kalenteri" for the browsable year) rather than inventing
// a third phrasing that would compete with /vuosi-{year}.
export default function UpcomingCalendarPromo() {
  const today = useToday();
  const { promotedYear } = navigationYearTargets(today);
  if (promotedYear < PRERENDER_MIN_YEAR || promotedYear > PRERENDER_MAX_YEAR) {
    return null;
  }
  return (
    <section className="panel noprint" aria-labelledby="upcoming-calendar-promo">
      <div className="now-label" id="upcoming-calendar-promo">
        Tulostettava kalenteri {promotedYear}
      </div>
      <p>
        Suunnitteletko jo vuotta {promotedYear}? Lataa koko vuosi yhdellä
        sivulla tai selaa kuukaudet viikkonumeroineen.
      </p>
      <div className="quicklinks">
        <Link className="ql" to={`/tulostettava-kalenteri-${promotedYear}`}>
          <b>Tulostettava kalenteri {promotedYear} (PDF)</b>
          <span>Ilmainen vuosikalenteri viikkonumeroilla ja arkipyhillä</span>
        </Link>
        <Link className="ql" to={`/kalenteri-${promotedYear}`}>
          <b>Kalenteri {promotedYear}</b>
          <span>Kaikki kuukaudet, viikot ja pyhäpäivät selattavana</span>
        </Link>
      </div>
    </section>
  );
}
