import {
  isoWeek,
  isoYear,
  mondayOf,
  dWritten,
  getWeekdayName,
  parseDateInput,
} from "../components/dateUtils.js";

export function computeDateToWeek(str) {
  const d = parseDateInput(str);
  if (!d) return null;
  const w = isoWeek(d);
  const y = isoYear(d);
  const mo = mondayOf(w, y);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);
  return {
    w,
    y,
    weekday: getWeekdayName(d),
    written: dWritten(d),
    range: `${dWritten(mo)} - ${dWritten(su)}`,
  };
}
