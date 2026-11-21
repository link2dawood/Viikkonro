import { Link } from "react-router-dom";
import { useToday } from "./useToday";
import { dateFromDayKey, helsinkiDayKey } from "./dateUtils";
import { upcomingEvents } from "../data/upcomingEvents";

// Homepage list of the next holidays and observances. It is a plain, crawlable
// link list to the pages that answer each date, rebuilt daily with the site,
// so the pages people search for next are always one click from the homepage.
const UpcomingEvents = () => {
  const today = dateFromDayKey(helsinkiDayKey(useToday()));
  const events = upcomingEvents(today, 8);
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="upcoming-events-h">
      <h2 id="upcoming-events-h" className="mh">Tulevat juhlapäivät ja pyhät</h2>
      <p className="lead">
        Seuraavat pyhäpäivät ja merkkipäivät päivämäärineen ja viikkonumeroineen.
      </p>
      <ul className="upcoming-events">
        {events.map((e) => (
          <li key={e.path}>
            <Link to={e.path}>{e.name}</Link>
            {` ${e.weekday.toLowerCase()} ${e.date.getDate()}.${e.date.getMonth() + 1}.${e.date.getFullYear()}, viikko ${e.week}`}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default UpcomingEvents;
