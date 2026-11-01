import {
  mondayOf,
  weeksInIsoYear,
  dWritten,
  getWeekdayName,
} from "../components/dateUtils";

export function computeWeekToDate(weekStr, yearStr) {
  const wStr = String(weekStr ?? "").trim();
  const yStr = String(yearStr ?? "").trim();
  if (!/^\d+$/.test(wStr) || !/^\d+$/.test(yStr)) return null;

  const w = Number(wStr);
  const y = Number(yStr);
  if (!Number.isInteger(w) || !Number.isInteger(y)) return null;
  if (y < 1000 || y > 9999) return null;
  if (w < 1 || w > weeksInIsoYear(y)) return null;

  const mo = mondayOf(w, y);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(mo);
    d.setDate(mo.getDate() + i);
    return { name: getWeekdayName(d), written: dWritten(d) };
  });

  return { w, y, start: dWritten(mo), end: dWritten(su), days };
}
