import { describe, it, expect } from "vitest";
import PDFDocument from "pdfkit";
import { buildShiftModel, canManageShifts, canEditAvailability } from "./model.js";
import { helsinkiInstant, helsinkiLocal, shiftInterval, intervalsOverlap } from "./time.js";
import { shiftWorkbook, shiftsToXlsx, shiftsToIcs, renderShiftPdf } from "./exports.js";
import { getProduct } from "../business/products.js";
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
export const shiftFixture = (year = 2027) => ({ organization: { id: id(1), name: "Ääkkösyrityksen pitkä suomalainen työvuorosuunnittelun nimi Oy", calendar_year: year, min_coverage: 2, include_holidays: true, version: 1 }, role: "owner", member_id: id(2), members: [{ id: id(2), organization_id: id(1), label: "Aino", active: true, department_id: id(10) }, { id: id(3), organization_id: id(1), label: "Väinö", active: true }], departments: [{ id: id(10), organization_id: id(1), name: "Tiimi" }], types: [{ id: id(9), organization_id: id(1), name: "Loma", kind: "vacation" }], leaves: [], closures: [], memberships: [], invites: [], shift_templates: [{ id: id(4), organization_id: id(1), name: "Yövuoro", kind: "night", start_time: "22:00:00", end_time: "06:00:00", end_day: 1 }], shifts: [{ id: id(5), organization_id: id(1), member_id: id(3), template_id: id(4), ...shiftInterval(`${year}-01-01T22:00`, `${year}-01-02T06:00`), notes: "Salainen työjärjestely" }], availability: [] });
describe("shift engine", () => {
  for (const year of [2026, 2027, 2028]) it(`${year}: shared calendar, ISO weeks, holidays and leap year`, () => {
    const model = buildShiftModel(shiftFixture(year));
    expect(model.days).toHaveLength(year === 2028 ? 366 : 365); expect(model.days[0].events.some((e) => e.kind === "holiday")).toBe(true);
    expect(model.days[0].scheduled).toBe(1); expect(model.days[1].scheduled).toBe(1); expect(model.days[2].scheduled).toBe(0);
    if (year === 2027) expect(model.days[0]).toMatchObject({ week: 53, weekYear: 2026 });
  });
  it("flags same-person overlaps, permits adjacency and distinct employees", () => {
    const s = shiftFixture(); s.shifts.push({ ...s.shifts[0], id: id(6), ...shiftInterval("2027-01-02T05:00", "2027-01-02T07:00") }, { ...s.shifts[0], id: id(7), member_id: id(2) }, { ...s.shifts[0], id: id(8), ...shiftInterval("2027-01-02T07:00", "2027-01-02T09:00") });
    const model = buildShiftModel(s); expect(model.shifts.find((r) => r.id === id(5)).conflicts).toContain("Päällekkäinen vuoro");
    expect(model.shifts.find((r) => r.id === id(7)).conflicts).toEqual([]); expect(model.shifts.find((r) => r.id === id(8)).conflicts).toEqual([]);
    expect(model.days[1].scheduled).toBe(2); expect(model.days[1].lowShiftCoverage).toBe(false);
  });
  it("detects availability, approved and pending leave, closures without mixing statutory rules", () => {
    const s = shiftFixture(); s.availability.push({ id: id(6), organization_id: id(1), member_id: id(3), ...shiftInterval("2027-01-02T05:00", "2027-01-02T07:00"), notes: "Este" });
    s.leaves = ["approved", "pending", "rejected"].map((status, i) => ({ id: id(20 + i), member_id: id(3), type_id: id(9), status, start_date: "2027-01-02", end_date: "2027-01-02" }));
    s.closures.push({ id: id(30), organization_id: id(1), label: "Sulku", start_date: "2027-01-02", end_date: "2027-01-02" });
    expect(buildShiftModel(s).shifts[0].conflicts).toEqual(["Ei käytettävissä", "Hyväksytty poissaolo", "Odottava poissaolopyyntö", "Yrityksen sulku"]);
  });
  it("uses exclusive midnight ends and includes full boundary-crossing shifts once", () => {
    const s = shiftFixture(); s.shifts[0] = { ...s.shifts[0], ...shiftInterval("2026-12-31T22:00", "2027-01-01T06:00") };
    let model = buildShiftModel(s, { from: "2027-01-01", to: "2027-01-03" }); expect(model.shifts).toHaveLength(1); expect(model.days[0].scheduled).toBe(1);
    expect(shiftsToIcs(model)).toContain("DTSTART:20261231T200000Z");
    s.shifts[0] = { ...s.shifts[0], ...shiftInterval("2027-01-03T22:00", "2027-01-04T00:00") };
    model = buildShiftModel(s); expect(model.days[2].scheduled).toBe(1); expect(model.days[3].scheduled).toBe(0);
    s.shifts[0] = { ...s.shifts[0], ...shiftInterval("2027-01-03T22:00", "2027-01-04T06:00") };
    expect(buildShiftModel(s, { from: "2027-01-04", to: "2027-01-10" }).shifts).toHaveLength(1);
  });
  it("uses selected teams without applying the whole-organization target", () => {
    const model = buildShiftModel(shiftFixture(), { departmentId: id(10) }); expect(model.shifts).toHaveLength(0); expect(model.days.every((d) => !d.lowShiftCoverage)).toBe(true);
  });
  it("rejects invalid tenant data, unknown references and duplicate event IDs", () => {
    for (const name of ["shifts", "availability", "shift_templates"]) { const s = shiftFixture(); s[name].push({ ...s.shifts[0], id: id(40), organization_id: id(99) }); expect(() => buildShiftModel(s)).toThrow(); }
    const s = shiftFixture(); s.shifts.push(s.shifts[0]); expect(() => buildShiftModel(s)).toThrow();
    s.shifts = [{ ...s.shifts[0], template_id: id(99) }]; expect(() => buildShiftModel(s)).toThrow();
    expect(() => buildShiftModel(shiftFixture(), { from: "2026-01-01" })).toThrow();
  });
  it("employees can edit only own availability, never assign shifts", () => {
    expect(getProduct("shift-planner")).toMatchObject({ status: "preview", path: null, pricing: { model: "free" } });
    const s = shiftFixture(); s.role = "employee"; expect(canManageShifts(s)).toBe(false);
    expect(canEditAvailability(s, { member_id: id(2) })).toBe(true); expect(canEditAvailability(s, { member_id: id(3) })).toBe(false);
    s.role = "manager"; expect(canManageShifts(s)).toBe(true); expect(canEditAvailability(s, { member_id: id(3) })).toBe(true);
  });
  it("all exports hide coworker notes defensively and preserve Finnish timed events", async () => {
    const s = shiftFixture(); s.role = "employee";
    const model = buildShiftModel(s, { from: "2027-01-01", to: "2027-01-03" });
    expect(JSON.stringify(shiftWorkbook(model))).not.toContain("Salainen");
    const ics = shiftsToIcs(model, { stamp: "20261010T000000Z" }).replace(/\r\n /g, "");
    expect(ics).not.toContain("Salainen"); expect(ics).toContain("Väinö: Yövuoro"); expect(ics).toContain("DTEND:20270102T040000Z"); expect(ics).not.toMatch(/URL:|REFRESH-INTERVAL|VALUE=DATE/);
    expect(ics).toContain(`${id(1)}-shift-${id(5)}@viikkonro.fi`);
    expect(shiftsToXlsx(model).slice(0, 2)).toEqual(new Uint8Array([80, 75]));
    const pdf = await renderShiftPdf(model, { PDFDocument, compress: false }); expect(pdf.bytes.length).toBeGreaterThan(3000); expect(pdf.pages).toBe(3); expect(pdf.warnings).toEqual([]);
  });
  it("supports many shifts and paginated print output", async () => {
    const s = shiftFixture(); s.shifts = Array.from({ length: 60 }, (_, i) => ({ ...s.shifts[0], id: id(100 + i) }));
    const model = buildShiftModel(s, { from: "2027-01-01", to: "2027-01-03" });
    const pdf = await renderShiftPdf(model, { PDFDocument }); expect(pdf.pages).toBeGreaterThan(5); expect(shiftWorkbook(model).sheets[0].rows).toHaveLength(60);
  });
});
describe("Helsinki shift instants", () => {
  it("does not depend on host timezone and validates leap dates and duration", () => {
    expect(helsinkiInstant("2028-02-29T22:00")).toBe("2028-02-29T20:00:00.000Z");
    expect(() => helsinkiInstant("2027-02-29T09:00")).toThrow(); expect(() => shiftInterval("2027-01-01T09:00", "2027-01-01T09:00")).toThrow(); expect(() => shiftInterval("2027-01-01T09:00", "2027-01-03T09:00")).toThrow();
    expect(helsinkiLocal("2027-07-01T06:00:00Z")).toBe("2027-07-01T09:00");
  });
  it("rejects nonexistent spring times and handles both autumn occurrences explicitly", () => {
    expect(() => helsinkiInstant("2027-03-28T03:30")).toThrow("kesäaikaan");
    expect(helsinkiInstant("2027-10-31T03:30", "earlier")).toBe("2027-10-31T00:30:00.000Z"); expect(helsinkiInstant("2027-10-31T03:30", "later")).toBe("2027-10-31T01:30:00.000Z");
    const spring = shiftInterval("2027-03-27T22:00", "2027-03-28T06:00"), autumn = shiftInterval("2027-10-30T22:00", "2027-10-31T06:00");
    expect(Date.parse(spring.ends_at) - Date.parse(spring.starts_at)).toBe(7 * 3600000); expect(Date.parse(autumn.ends_at) - Date.parse(autumn.starts_at)).toBe(9 * 3600000);
    const fold = shiftInterval("2027-10-31T03:15", "2027-10-31T03:45", "earlier", "later"); expect(Date.parse(fold.ends_at) - Date.parse(fold.starts_at)).toBe(90 * 60000);
    expect(intervalsOverlap(spring, { starts_at: spring.ends_at, ends_at: autumn.starts_at })).toBe(false);
  });
});
