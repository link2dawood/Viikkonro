import { Link, useLocation } from "react-router-dom";
import { useToday } from "./useToday.js";
import { pageTopic } from "../data/pageTopics.js";
import "./topicGuide.css";

export default function TopicGuide() {
  const { pathname } = useLocation();
  const context = pageTopic(pathname,useToday());
  if (!context) return null;
  return <section className="app topic-guide noprint" data-topic-id={context.id} aria-label={context.lang === "en" ? "Related calendar guides" : "Kalenterin käyttö ja aiheeseen liittyvät oppaat"}>
    <h2>{context.heading}</h2>
    {context.detail && <p>{context.detail}</p>}
    <p>{context.text}</p>
    <ul>{context.links.map(item => <li key={item.to}><Link to={item.to} hrefLang={context.lang === "en" ? "fi" : undefined}>{item.name}</Link><span>{item.purpose}</span></li>)}</ul>
    {context.sources.length > 0 && <p className="topic-guide-sources">{context.lang === "en" ? "Reference: " : "Taustalähde: "}{context.sources.map((source,index) => <span key={source.url}>{index > 0 && ", "}<a href={source.url}>{source.name}</a></span>)}</p>}
  </section>;
}
