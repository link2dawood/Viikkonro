// How one calendar day looks, decided once for every renderer (HTML preview,
// PDF): which tint it gets, whether its number is bold or red, and which small
// markers it carries. Renderers only translate this into pixels or points.

// A day takes the tint of the highest-priority range-like event on it.
const FILL_PRIORITY = ["closure", "leave", "season", "school"];
const FILL_COLOR = { closure: "closureTint", leave: "leaveTint", season: "seasonTint", school: "schoolTint" };

/**
 * @param {{date: Date, events: {kind: string}[]}} day
 * @param {import("../design/themes.js").ThemeColors} colors
 */
export function dayStyle(day, colors) {
  const kinds = new Set(day.events.map((e) => e.kind));
  const rangeKind = FILL_PRIORITY.find((k) => kinds.has(k));
  const isHoliday = kinds.has("holiday");
  return {
    fill: rangeKind ? colors[FILL_COLOR[rangeKind]] : isHoliday ? colors.holidayTint : null,
    bold: isHoliday,
    numberColor: day.date.getDay() === 0 || isHoliday ? colors.weekendText : colors.ink,
    flag: kinds.has("flag-day"),
    payday: kinds.has("payday"),
    company: kinds.has("company"),
  };
}

/** Kinds actually present in a model, for the legend (never lists what is absent). */
export function legendKinds(model) {
  const present = new Set(model.events.map((e) => e.kind));
  return ["holiday", "flag-day", "payday", "closure", "leave", "season", "school", "company"].filter((k) => present.has(k));
}
