import { Link } from "react-router-dom";
import { PRERENDER_MAX_YEAR as YEAR_MAX } from "./dateUtils";
import { calendarPdfPath } from "../data/seo";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";

// Above-the-fold actions for the year hubs (/vuosi-{y}) and the calendar
// views (/kalenteri-{y}[-alkuvuosi|-loppuvuosi], /tulostettava-kalenteri-{y}):
// the year's PDF download plus the pages people most often open next. Placed
// right under the lead paragraph because about half of visitors never scroll
// past the first screen — the same links further down the page stay as they
// are.
//
// `view` is the page family, so the "other view" and "next year" links stay
// in the family the visitor is browsing. `download={false}` drops the button
// on pages that already have their own download row up top (the A4 print page).
const YearActions = ({ year, view, download = true }) => {
  const y = Number(year);
  const next = y + 1 <= YEAR_MAX ? y + 1 : null;
  const onYearPage = view === "vuosi";

  return (
    <div className="year-actions noprint">
      {download && (
        <a className="btn year-download" href={calendarPdfPath(y)} download>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            <span className="year-download-title">Lataa PDF-kalenteri {y}</span>
            <span className="year-download-sub">
              A4 · viikkonumerot, pyhä- ja liputuspäivät
            </span>
          </span>
        </a>
      )}
      <nav className="year-actions-links" aria-label={`Vuoden ${y} sivut`}>
        {onYearPage ? (
          <Link to={`/kalenteri-${y}`}>Kalenteri {y}</Link>
        ) : (
          <Link to={`/vuosi-${y}`}>Viikkonumerot {y}</Link>
        )}
        <Link to={`/tyopaivat-${y}`}>Työpäivät {y}</Link>
        {/* Only confirmed school-holiday pages get links (STEP 6 rule). */}
        {pageConfidenceTier(y) === CONFIDENCE.CONFIRMED && (
          <Link to={`/koululomat-${y}`}>Koululomat {y}</Link>
        )}
        <Link to={`/pyhapaivat-${y}`}>Pyhäpäivät {y}</Link>
        {next && (
          <Link
            className="year-actions-next"
            to={onYearPage ? `/vuosi-${next}` : `/kalenteri-${next}`}
          >
            {onYearPage ? `Viikot ${next}` : `Kalenteri ${next}`} →
          </Link>
        )}
      </nav>
    </div>
  );
};

export default YearActions;
