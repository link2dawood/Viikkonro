import {
  PRERENDER_MAX_YEAR,
  PRERENDER_MIN_YEAR,
  weeksInIsoYear,
} from "../components/dateUtils.js";

export function sameWeekOtherYears(
  week,
  year,
  { minYear = PRERENDER_MIN_YEAR, maxYear = PRERENDER_MAX_YEAR, limit = 7 } = {},
) {
  const w = Number(week);
  const y = Number(year);
  if (
    !Number.isInteger(w) || !Number.isInteger(y) || w < 1 || w > 53 ||
    !Number.isInteger(minYear) || !Number.isInteger(maxYear) || maxYear < minYear ||
    !Number.isInteger(limit) || limit < 1
  ) return [];

  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)
    .filter((candidate) => candidate !== y && w <= weeksInIsoYear(candidate))
    .sort((a, b) => Math.abs(a - y) - Math.abs(b - y) || a - b)
    .slice(0, limit)
    .sort((a, b) => a - b)
    .map((candidate) => ({ week: w, year: candidate }));
}
