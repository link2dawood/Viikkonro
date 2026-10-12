import { Link, useLocation } from "react-router-dom";
import { growthIntent } from "../platform/growth.js";
import { trackGrowthCTA, trackPlatformEvent } from "../analytics.js";
import "./growth.css";

export default function GrowthCTA({ inline = false }) {
  const { pathname } = useLocation();
  const intent = growthIntent(pathname);
  if (!intent || (!inline && ["vacation", "project", "sprint"].includes(intent.family))) return null;
  const label = intent.href.startsWith("#") ? "Avaa suunnitelma ja lataukset" : "Tutustu työkaluun";
  const click = () => {
    trackGrowthCTA(intent);
    if (intent.product === "company-calendar") trackPlatformEvent("company_calendar_cta_click", { source: intent.family });
  };
  return <aside className="growth-cta noprint" aria-label="Työkalu yrityksen suunnitteluun">
    <h2>{intent.title}</h2><p>{intent.text}</p>
    {intent.href.startsWith("#") ? <a href={intent.href} onClick={click}>{label}</a> : <Link to={intent.href} onClick={click}>{label}</Link>}
  </aside>;
}
