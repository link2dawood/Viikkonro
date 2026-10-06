// Registry of the planning tools: one place that says which URL and which
// day-rule mode (src/data/dayRules.js) each planner uses. The data modules
// read their path and mode from here, so a rule or URL cannot drift between
// a page, its tests and its analytics. A future planner (shift, construction,
// team leave) is one new entry plus its own data module.
import { DAY_RULES } from "../data/dayRules.js";

/**
 * @typedef {object} PlannerDefinition
 * @property {string} id
 * @property {string|null} path  indexable URL, or null for a page family
 * @property {keyof typeof DAY_RULES} mode  the day rule the planner counts with
 * @property {string} analyticsType  value of the planner_type analytics tag
 */

/** @type {Record<string, PlannerDefinition>} */
export const PLANNERS = Object.freeze({
  vacation: { id: "vacation", path: "/lomasuunnittelija", mode: "FINLAND_PLANNER", analyticsType: "lomasuunnittelija" },
  project: { id: "project", path: "/projektiaikataulu", mode: "FINLAND_PROJECT", analyticsType: "projektiaikataulu" },
  sprint: { id: "sprint", path: "/sprinttisuunnittelija", mode: "FINLAND_SPRINT", analyticsType: "sprinttisuunnittelija" },
  leave: { id: "leave", path: "/vuosilomalaskuri", mode: "FINLAND_STATUTORY_LEAVE", analyticsType: "vuosilomalaskuri" },
  workday: { id: "workday", path: "/tyopaivalaskuri", mode: "FINLAND_WORKDAY", analyticsType: "tyopaivalaskuri" },
  payday: { id: "payday", path: null, mode: "FINLAND_BANKING", analyticsType: "palkkapaivat" },
});

// A planner can only name a day rule that exists: fail at import, not at render.
for (const planner of Object.values(PLANNERS)) {
  if (!DAY_RULES[planner.mode]) throw new Error(`Planner "${planner.id}" uses unknown day rule "${planner.mode}".`);
}

export function getPlanner(id) {
  const planner = PLANNERS[id];
  if (!planner) throw new Error(`Unknown planner "${id}".`);
  return planner;
}

export const plannerMode = (id) => getPlanner(id).mode;
export const plannerPath = (id) => getPlanner(id).path;
