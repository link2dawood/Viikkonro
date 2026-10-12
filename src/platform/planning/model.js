import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { addDays } from "../../data/planningDates.js";
import { createEvent, dayKey, toDate } from "../calendar/events.js";
import { firstWorkingDay, buildProjectTimeline, buildSprintTimeline, calendarGroups, workingDayRule, MAX_PROJECT_DAYS } from "./dates.js";

/** @typedef {{id: string, label: string, workingDays: number, dependsOn: string[], note: string}} Phase */
/** @typedef {{id: string, label: string, date: string, phaseId: string|null, note: string}} Milestone */
/** @typedef {ReturnType<typeof buildSprintTimeline>[number]} Sprint */
/** @typedef {import('../calendar/events.js').CalendarEvent} Event */
/** @typedef {{kind: 'project'|'sprint', name: string, rule: string, start: string, phases?: Phase[], milestones?: Milestone[]}} Planner */
const id = (value) => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,59}$/.test(value);
const label = (value, max = 80) => typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null;

export function createPhase(input) {
  const workingDays = Number(input?.workingDays);
  if (!id(input?.id) || !label(input.label) || !Number.isInteger(workingDays) || workingDays < 1 || workingDays > MAX_PROJECT_DAYS) throw new Error("Anna vaiheelle nimi ja kesto 1-520 työpäivää.");
  const dependencies = input.dependsOn ?? [];
  if (!Array.isArray(dependencies) || dependencies.some((value) => !id(value)) || new Set(dependencies).size !== dependencies.length) throw new Error("Vaiheen riippuvuudet ovat virheelliset.");
  if (typeof (input.note ?? "") !== "string" || (input.note ?? "").length > 1000) throw new Error("Vaiheen huomautus saa sisältää enintään 1000 merkkiä.");
  return Object.freeze({ id: input.id, label: input.label.trim(), workingDays, dependsOn: Object.freeze([...dependencies]), note: input.note ?? "" });
}
export function createMilestone(input) {
  if (!id(input?.id) || !label(input.label) || input.phaseId && !id(input.phaseId) || !input.phaseId && !toDate(input.date)) throw new Error("Anna välitavoitteelle nimi sekä päivämäärä tai vaihe.");
  if (typeof (input.note ?? "") !== "string" || (input.note ?? "").length > 1000) throw new Error("Välitavoitteen huomautus saa sisältää enintään 1000 merkkiä.");
  return Object.freeze({ id: input.id, label: input.label.trim(), date: input.phaseId ? null : dayKey(toDate(input.date)), phaseId: input.phaseId || null, note: input.note ?? "" });
}
export function createPlanner(input) {
  if (!["project", "sprint"].includes(input?.kind) || !toDate(input.start)) throw new Error("Valitse suunnitelman laji ja oikea aloituspäivä.");
  const rule = input.rule ?? (input.kind === "project" ? "FINLAND_PROJECT" : "FINLAND_SPRINT");
  workingDayRule(rule);
  if (input.end && !toDate(input.end)) throw new Error("Tarkista projektin loppupäivä.");
  const name = label(input.name ?? (input.kind === "project" ? "Projektisuunnitelma" : "Sprinttisuunnitelma"));
  if (!name) throw new Error("Suunnitelman nimi saa sisältää enintään 80 merkkiä.");
  const phases = (input.phases ?? []).map(createPhase), milestones = (input.milestones ?? []).map(createMilestone);
  if (phases.length > 30 || milestones.length > 50) throw new Error("Lisää enintään 30 vaihetta ja 50 välitavoitetta.");
  const ids = [...phases, ...milestones].map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error("Vaiheiden ja välitavoitteiden tunnisteiden pitää olla yksilöllisiä.");
  if (input.kind === "sprint" && (phases.length || milestones.length)) throw new Error("Vaiheet ja välitavoitteet kuuluvat projektisuunnitelmaan.");
  return Object.freeze({ version: 1, kind: input.kind, name, rule, start: dayKey(toDate(input.start)),
    workingDays: input.workingDays, end: input.end || null, weeks: input.weeks, count: input.count, firstNumber: input.firstNumber ?? 1,
    phases: Object.freeze(phases), milestones: Object.freeze(milestones) });
}

/** Finish-to-start DAG scheduling, constrained to the entered project's duration. */
export function buildPlanner(input) {
  const config = createPlanner(input);
  const start = toDate(config.start);
  const base = config.kind === "project"
    ? buildProjectTimeline(start, { workingDays: config.workingDays, end: config.end ? toDate(config.end) : null, mode: config.rule })
    : buildSprintTimeline(start, config.weeks, config.count, config.firstNumber, config.rule);
  if (!base) throw new Error("Tarkista suunnitelman päivämäärät ja kesto.");
  const first = config.kind === "project" ? base.start : base[0].from;
  const last = config.kind === "project" ? base.end : base[base.length - 1].to;
  const phases = new Map(), visiting = new Set();
  const definitions = new Map(config.phases.map((phase) => [phase.id, phase]));
  const schedule = (phaseId) => {
    if (phases.has(phaseId)) return phases.get(phaseId);
    const phase = definitions.get(phaseId);
    if (!phase) throw new Error("Vaiheen riippuvuus viittaa puuttuvaan vaiheeseen.");
    if (visiting.has(phaseId)) throw new Error("Vaiheiden riippuvuudet muodostavat kehän. Poista kiertävä riippuvuus.");
    visiting.add(phaseId);
    const predecessors = phase.dependsOn.map(schedule);
    const earliest = predecessors.reduce((date, predecessor) => predecessor.end >= date ? addDays(predecessor.end, 1) : date, first);
    const computed = buildProjectTimeline(firstWorkingDay(earliest, config.rule), { workingDays: phase.workingDays, mode: config.rule });
    if (computed.end > last) throw new Error(`Vaihe "${phase.label}" ylittää projektin loppupäivän. Pidennä projektia tai lyhennä vaihetta.`);
    const result = Object.freeze({ ...phase, start: computed.start, end: computed.end });
    visiting.delete(phaseId); phases.set(phaseId, result); return result;
  };
  const scheduledPhases = config.phases.map((phase) => schedule(phase.id));
  const milestones = config.milestones.map((milestone) => {
    const phase = milestone.phaseId ? phases.get(milestone.phaseId) : null;
    if (milestone.phaseId && !phase) throw new Error("Välitavoite viittaa puuttuvaan vaiheeseen.");
    const date = phase ? phase.end : toDate(milestone.date);
    if (date < first || date > last) throw new Error("Välitavoitteen pitää osua projektin alku- ja loppupäivän välille.");
    return Object.freeze({ ...milestone, date, week: isoWeek(date), weekYear: isoYear(date) });
  });
  return Object.freeze({ config, base, start: first, end: last, phases: Object.freeze(scheduledPhases), milestones: Object.freeze(milestones),
    weeks: Object.freeze(calendarGroups(first, last, config.rule)), months: Object.freeze(calendarGroups(first, last, config.rule, "month")),
    disclosure: workingDayRule(config.rule).disclosure });
}

// The existing Event primitive owns DATE validation and RFC-safe event identities.
export const createPlanningEvent = createEvent;
