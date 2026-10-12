import { describe, expect, it } from "vitest";
import PDFDocument from "pdfkit";
import { buildPlanner, createPhase, createMilestone, createPlanningEvent } from "./model.js";
import { plannerToIcs, plannerToXlsx, plannerWorkbook, renderPlannerPdf } from "./exports.js";
import { buildProjectTimeline, buildSprintTimeline, workingDayRule } from "./dates.js";
import { projectPlan } from "../../data/projectTimeline.js";
import { sprintPlan } from "../../data/sprintPlanner.js";
import { dayKey, toDate } from "../calendar/events.js";
import { summarizeDayRange } from "../../data/dayRules.js";

const calendarId = "1234567890abcdef1234567890abcdef", stamp = "20261010T120000Z";
const project = (extra = {}) => buildPlanner({ kind: "project", start: "2027-03-22", workingDays: 60, ...extra });
const phase = (id, workingDays = 5, dependsOn = []) => ({ id, label: `Vaihe ${id}`, workingDays, dependsOn });
const flat = (text) => text.replace(/\r\n[ \t]/g, "");
describe("shared project and sprint engine", () => {
  it.each([2026, 2027, 2028])("preserves free calculators and rule totals in %i", (year) => {
    const start = toDate(`${year}-01-01`);
    const model = project({ start, workingDays: 260 });
    expect(model.base).toEqual(projectPlan(start, { workingDays: 260 }));
    expect(model.weeks.reduce((sum, row) => sum + row.workingDays, 0)).toBe(260);
    expect(model.months.reduce((sum, row) => sum + row.workingDays, 0)).toBe(260);
    expect(model.base.workingDays).toBe(summarizeDayRange("FINLAND_PROJECT", model.start, model.end).counted);
    expect(buildSprintTimeline(start, 2, 26)).toEqual(sprintPlan(start, 2, 26));
  });
  it("retains ISO week 53 across December and January", () => {
    const model = project({ start: "2026-12-28", workingDays: 10 });
    expect(model.weeks[0]).toMatchObject({ week: 53, year: 2026 });
    expect(model.months.map((row) => row.calendarYear)).toEqual([2026, 2027]);
    expect(model.weeks[0].to.getFullYear()).toBe(2027);
  });
  it("includes leap day and ignores DST as civil dates", () => {
    const model = project({ start: "2028-02-28", workingDays: 30 });
    expect(dayKey(model.base.milestones[0].date)).toBe("2028-03-08");
    expect(model.base.workingDays).toBe(30);
    expect(buildProjectTimeline(toDate("2028-02-29"), { workingDays: 1 }).calendarDays).toBe(1);
  });
  it("keeps eves as project workdays and rejects statutory leave rules", () => {
    expect(dayKey(project({ start: "2026-12-24", workingDays: 1 }).end)).toBe("2026-12-24");
    expect(() => workingDayRule("FINLAND_STATUTORY_LEAVE")).toThrow();
    expect(() => project({ rule: "FINLAND_PLANNER" })).toThrow();
  });
  it("schedules dependencies independent of definition order and permits parallel phases", () => {
    const model = project({ phases: [phase("c", 2, ["a", "b"]), phase("b", 5), phase("a", 3)] });
    const c = model.phases[0];
    expect(dayKey(c.start)).toBe("2027-03-31");
    expect(model.phases[1].start).toEqual(model.phases[2].start);
  });
  it("rejects missing, cyclic and self dependencies", () => {
    expect(() => project({ phases: [phase("a", 5, ["missing"])] })).toThrow(/puuttuvaan/);
    expect(() => project({ phases: [phase("a", 5, ["b"]), phase("b", 5, ["a"])] })).toThrow(/kehän/);
    expect(() => project({ phases: [phase("a", 5, ["a"])] })).toThrow(/kehän/);
  });
  it("never silently extends a project or drops invalid milestones", () => {
    expect(() => project({ workingDays: 2, phases: [phase("a", 3)] })).toThrow(/ylittää/);
    expect(() => project({ milestones: [{ id: "m", label: "Luovutus", date: "2027-02-01" }] })).toThrow(/välille/);
    expect(() => project({ end: "2027-02-30" })).toThrow(/loppupäivä/);
  });
  it("anchors named milestones to phase completion", () => {
    const model = project({ phases: [phase("a")], milestones: [{ id: "m", label: "Hyväksyntä", phaseId: "a" }] });
    expect(model.milestones[0].date).toEqual(model.phases[0].end);
    expect(model.milestones[0].week).toBe(13);
  });
  it("validates primitive identities, limits and explicit rules", () => {
    expect(() => createPhase(phase("a", 521))).toThrow();
    expect(() => createPhase(phase("a", 1.5))).toThrow();
    expect(() => createMilestone({ id: "m", label: "x", date: "2028-02-30" })).toThrow();
    expect(() => project({ phases: [phase("a"), phase("a")] })).toThrow(/yksilöllisiä/);
    expect(createPlanningEvent({ id: "test", title: "Testi", date: "2028-02-29", kind: "company" }).date).toEqual(toDate("2028-02-29"));
  });
  it("supports continued sprint numbering and maximum multi-year spans", () => {
    const model = buildPlanner({ kind: "sprint", start: "2026-12-28", weeks: 6, count: 26, firstNumber: 42 });
    expect(model.base[25].number).toBe(67);
    expect(model.end.getFullYear()).toBe(2029);
    expect(project({ workingDays: 520 }).base.workingDays).toBe(520);
    expect(buildSprintTimeline(toDate("2027-01-01"), 2, 1, 0)).toBeNull();
  });
});
describe("planning artifacts", () => {
  it.each([2026, 2027, 2028])("exports private UTF-8 ICS and native-date XLSX for %i", (year) => {
    const model = project({ start: `${year}-01-01`, name: "Äänekosken yhteistyöprojekti", phases: [phase("a")], milestones: [{ id: "m", label: "Hyväksyntä; ensimmäinen", phaseId: "a" }] });
    const text = plannerToIcs(model, { calendarId, stamp });
    expect(flat(text)).toContain("SUMMARY:Hyväksyntä\\; ensimmäinen");
    expect(text).toContain("X-WR-TIMEZONE:Europe/Helsinki\r\n");
    expect(text).not.toMatch(/TZID|URL:|REFRESH-INTERVAL|RRULE/);
    const uids = flat(text).match(/^UID:.+$/gm);
    expect(new Set(uids).size).toBe(uids.length);
    for (const line of text.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    const bytes = plannerToXlsx(model);
    expect([...bytes.slice(0, 2)]).toEqual([80, 75]);
    expect(plannerWorkbook(model).sheets.find((s) => s.name === "Vaiheet").rows[0][2]).toBeInstanceOf(Date);
  });
  it("retains custom ICS identifiers when dates change", () => {
    const a = plannerToIcs(project({ phases: [phase("a")] }), { calendarId, stamp });
    const b = plannerToIcs(project({ start: "2027-04-01", phases: [phase("a")] }), { calendarId, stamp });
    expect(flat(a).match(/UID:.*phase-a@viikkonro.fi/)[0]).toBe(flat(b).match(/UID:.*phase-a@viikkonro.fi/)[0]);
  });
  it("uses exclusive all-day ends and retains all maximum-length sprints", () => {
    const model = buildPlanner({ kind: "sprint", start: "2026-12-28", weeks: 6, count: 26, firstNumber: 7 });
    const text = flat(plannerToIcs(model, { calendarId, stamp }));
    expect(text.match(/UID:.*-sprint-/g)).toHaveLength(26);
    expect(text).toContain("DTSTART;VALUE=DATE:20261228\r\nDTEND;VALUE=DATE:20270208");
    expect(plannerWorkbook(model).sheets.find((s) => s.name === "Sprintit").rows).toHaveLength(26);
  });
  it("renders paginated print-ready reports with many phases and Finnish notes", async () => {
    const model = project({ name: "Äänekosken pitkä suomalainen projektisuunnitelma", phases: Array.from({ length: 30 }, (_, i) => ({ ...phase(`p${i}`), note: "Huomautus: hyväksyntä ja yhteistyö. ".repeat(20) })) });
    const result = await renderPlannerPdf(model, { PDFDocument, compress: false });
    expect(result.pages).toBeGreaterThan(5);
    expect(new TextDecoder().decode(result.bytes.slice(0, 8))).toContain("%PDF-");
    expect(result.warnings).toEqual([]);
  });
});
