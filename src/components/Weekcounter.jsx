import { useToday } from "./useToday";
import React from "react";
import {
  isoWeek,
  isoYear,
  weeksInIsoYear,
  mondayOf,
  getWeekdayName,
  getDate,
} from "./dateUtils";

// Computed directly in the render body, not an effect: an effect never runs
// during SSR/prerendering, so the static/no-JS HTML (what F-04's title fix
// and F-06's correctness monitor both depend on) would otherwise always show
// "Viikko 0" until the client hydrates.
const Weekcounter = ({ lead }) => {
  const now = useToday();
  const weekNow = isoWeek(now);
  const yearNow = isoYear(now);
  const totalWeeks = weeksInIsoYear(yearNow);

  const monday = mondayOf(weekNow, yearNow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formattedDate = getWeekdayName(now) + " " + getDate(now);

  const options = { month: "long", day: "numeric" };
  const startStr = monday.toLocaleDateString("fi-FI", options);
  const endStr = sunday.toLocaleDateString("fi-FI", options);
  const dateRange = `${startStr} – ${endStr}, ${yearNow}`;

  const pct = Math.round((weekNow / totalWeeks) * 100);

  const weeksArray = [];
  for (let w = 1; w <= totalWeeks; w++) {
    let statusClass = "";
    if (w < weekNow) statusClass = "past";
    else if (w === weekNow) statusClass = "now";
    weeksArray.push({ weekNum: w, className: statusClass });
  }

  return (
    <>
      <div className="wrap">
        <div>
          <div className="eyebrow">Viikkonumerotyökalu</div>
        </div>
        <div className="hero">
          <h1>Mikä viikko nyt on?</h1>
          <p className="lead">{lead}</p>
          <div className="hero-card">
            <div>
              <div className="now-label">Juuri nyt on</div>
              <div className="week-big">
                <span className="vk">Viikko</span>
                <span id="weekNow">{weekNow}</span>
              </div>
              <div className="meta">
                <div className="date" id="dateNow">
                  {formattedDate}
                </div>
                <div className="range" id="rangeNow">
                  {dateRange}
                </div>
              </div>
            </div>
            <div className="progress-block">
              <div className="progress-head">
                <span>
                  Vuosi <b id="yearNow">{yearNow}</b>
                </span>
                <span>
                  <b id="weekOf">
                    Viikko {weekNow} / {totalWeeks}
                  </b>
                </span>
              </div>
              <div className="comb" id="comb" aria-hidden="true">
                {weeksArray.map((item) => (
                  <i key={item.weekNum} className={item.className}></i>
                ))}
              </div>
              <div className="comb-foot">
                <span id="pct">{pct}% vuodesta kulunut</span>
                <span>52/53 viikkoa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Weekcounter;
