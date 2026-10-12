import { Link, useLocation } from "react-router-dom";
import { trackPlatformEvent, trackGrowthCTA } from "../analytics";
import { growthIntent } from "../platform/growth.js";

// A link from an existing calendar page to the company calendar builder. It
// records only which page it was clicked on (the `source` tag).
const CompanyCalendarLink = ({ source, children }) => {
  const { pathname } = useLocation();
  return <Link to="/yrityskalenteri" onClick={() => {
    trackPlatformEvent("company_calendar_cta_click", { source });
    const intent = growthIntent(pathname);
    if (intent?.product === "company-calendar") trackGrowthCTA(intent);
  }}>
    {children}
  </Link>;
};

export default CompanyCalendarLink;
