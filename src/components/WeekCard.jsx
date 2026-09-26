import { useToday } from "./useToday";
import React from "react";
import { Link } from "react-router-dom";
import { mondayOf, dShort, isoWeek, isoYear } from "./dateUtils";

const WeekCard = ({ w, y }) => {
  const mo = mondayOf(w, y);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);

  const now = useToday();
  const isCurrent = w === isoWeek(now) && y === isoYear(now);

  return (
    <Link className={`wk ${isCurrent ? "current" : ""}`} to={`/viikko-${w}-${y}`}>
      <div className="n">Viikko {w}</div>

      <div className="r">
        {dShort(mo)} – {dShort(su)}
      </div>
    </Link>
  );
};

export default WeekCard;
