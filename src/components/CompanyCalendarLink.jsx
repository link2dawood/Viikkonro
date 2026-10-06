import { Link } from "react-router-dom";
import { trackPlatformEvent } from "../analytics";

// A link from an existing calendar page to the company calendar builder. It
// records only which page it was clicked on (the `source` tag).
const CompanyCalendarLink = ({ source, children }) => (
  <Link to="/yrityskalenteri" onClick={() => trackPlatformEvent("company_calendar_cta_click", { source })}>
    {children}
  </Link>
);

export default CompanyCalendarLink;
