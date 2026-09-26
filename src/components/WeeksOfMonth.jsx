import { useToday } from "./useToday";
import React from "react";
import { isoWeek, isoYear, mondayOf } from "./dateUtils";
import { Link } from "react-router-dom";

function formatShort(date) {
  return date.getDate() + "." + (date.getMonth() + 1) + ".";
}

// Computed directly in the render body, not an effect: an effect never runs
// during SSR/prerendering, so this section (including all its links to
// specific weeks) would be entirely absent from the no-JS HTML until the
// client hydrates — undermining D-06's "reachable within 3 clicks" goal for
// any crawler that doesn't execute JS.
const WeeksOfMonth = () => {
  const now = useToday();
  const currentWkNow = isoWeek(now);
  const currentYrNow = isoYear(now);

  const monthName = now.toLocaleString("fi-FI", { month: "long" });
  const monthTitle = `Kuukauden viikot – ${monthName} ${now.getFullYear()}`;

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const weeksGrid = [];
  const seen = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const d2 = new Date(now.getFullYear(), now.getMonth(), day);

    const wk2 = isoWeek(d2);
    const yr2 = isoYear(d2);
    const key = `${yr2}-${wk2}`;

    if (seen[key]) continue;
    seen[key] = true;

    const m2 = mondayOf(wk2, yr2);
    const s2 = new Date(m2);
    s2.setDate(m2.getDate() + 6);

    const isCurrentWeek = wk2 === currentWkNow && yr2 === currentYrNow;

    weeksGrid.push({
      id: key,
      weekNum: wk2,
      // Each week's own ISO year, NOT the current year — a day near a
      // December/January boundary can belong to a week whose ISO year
      // differs from the current calendar year (e.g. early January days
      // often belong to the previous year's week 52/53). Linking with the
      // wrong year either shows the wrong week or, if that year doesn't
      // have that many weeks, forces a redirect — exactly what D-06 rules
      // out.
      year: yr2,
      rangeText: `${formatShort(m2)}–${formatShort(s2)}`,
      isCurrent: isCurrentWeek,
    });
  }

  return (
    <>
      <section>
        <h2 id="monthTitle">{monthTitle}</h2>

        <div className="month-list" id="monthList">
          {weeksGrid.map((wk) => (
            <Link
              key={wk.id}
              to={`/viikko-${wk.weekNum}-${wk.year}`}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={() => window.scrollTo(0, 0)}
            >
              <div className={`wk ${wk.isCurrent ? "current" : ""}`}>
                <div className="n">Viikko {wk.weekNum}</div>
                <div className="r">{wk.rangeText}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default WeeksOfMonth;
