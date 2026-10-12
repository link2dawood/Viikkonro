import { Link, useLocation } from "react-router-dom";
import { useToday } from "./useToday";
import { relatedTools } from "../data/toolDirectory.js";

export default function RelatedTools() {
  const { pathname } = useLocation();
  const tools = relatedTools(pathname, useToday());
  if (!tools.length) return null;
  return <aside className="app related-tools noprint" aria-label="Aiheeseen liittyvät työkalut">
    <h2>Aiheeseen liittyvät työkalut</h2>
    <ul>{tools.map(tool => <li key={tool.to}><Link to={tool.to}>{tool.name}</Link></li>)}</ul>
    <Link to="/laskurit">Katso kaikki työkalut</Link>
  </aside>;
}
