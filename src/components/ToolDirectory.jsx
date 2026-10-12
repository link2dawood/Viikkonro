import { Link } from "react-router-dom";
import { useToday } from "./useToday";
import { toolGroups } from "../data/toolDirectory.js";
import "./toolDirectory.css";

export default function ToolDirectory() {
  const groups = toolGroups(useToday());
  return <section className="tool-directory" aria-labelledby="tool-directory-title">
    <h2 id="tool-directory-title">Kaikki työkalut</h2>
    <nav aria-label="Työkalujen ryhmät" className="tool-directory-nav">
      {groups.map(group => <a key={group.id} href={`#tools-${group.id}`}>{group.name}</a>)}
    </nav>
    {groups.map(group => <section key={group.id} id={`tools-${group.id}`} className={group.id === "pro" ? "tool-directory-pro" : undefined}>
      <h3>{group.name}</h3>
      {group.description && <p>{group.description}</p>}
      <div className="tool-grid">
        {group.tools.map(tool => {
          const content = <><span className="tool-name">{tool.name}</span>{tool.badge && <span className="tool-tier">{tool.badge}</span>}<span className="tool-desc">{tool.desc}</span></>;
          return tool.documentNavigation
            ? <a key={tool.to} className="tool-card" href={tool.to}>{content}</a>
            : <Link key={tool.to} className="tool-card" to={tool.to}>{content}</Link>;
        })}
      </div>
    </section>)}
  </section>;
}
