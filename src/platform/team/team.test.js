import { describe, it, expect } from "vitest";
import PDFDocument from "pdfkit";
import { buildTeamModel, teamLeaveLabel, canEditTeamLeave } from "./model.js";
import { teamWorkbook, teamToXlsx, teamToIcs, renderTeamPdf } from "./exports.js";
import { teamBackendConfig, teamRpc } from "./client.js";
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const fixture = (year = 2027) => ({ organization: { id: id(1), name: "Ääkkösyritys Oy", calendar_year: year, min_coverage: 2, include_holidays: true, version: 1 }, role: "owner", member_id: id(2), departments: [{ id: id(8), organization_id: id(1), name: "Suunnittelu" }], members: [{ id: id(2), organization_id: id(1), label: "Aino", active: true, department_id: id(8) }, { id: id(3), organization_id: id(1), label: "B", active: true }, { id: id(4), organization_id: id(1), label: "C", active: false }], types: [{ id: id(5), organization_id: id(1), name: "Yksityinen vapaa", kind: "personal" }], leaves: [{ id: id(6), member_id: id(3), type_id: id(5), start_date: `${year}-07-01`, end_date: `${year}-07-10`, status: "approved" }], closures: [], memberships: [], invites: [] });
describe("team leave engine and privacy", () => {
  for (const year of [2026, 2027, 2028]) it(`${year}: reuses Finnish days, holidays and ISO boundaries`, () => {
    const model = buildTeamModel(fixture(year)); expect(model.days).toHaveLength(year === 2028 ? 366 : 365);
    expect(model.members).toHaveLength(2); expect(model.days.find((d) => d.key === `${year}-01-01`).working).toBe(false);
    expect(model.days.find((d) => d.key >= `${year}-07-01` && d.key <= `${year}-07-10` && d.working).available).toBe(1);
    expect(model.calendar.months).toHaveLength(12);
    if (year === 2027) expect(model.days[0]).toMatchObject({ week: 53, weekYear: 2026 });
  });
  it("uses unions for overlaps, closure precedence and pending/rejected statuses", () => {
    const data = fixture(); data.leaves.push({ ...data.leaves[0], id: id(7), status: "pending" }, { ...data.leaves[0], id: id(9), member_id: id(2), status: "rejected" });
    let model = buildTeamModel(data); expect(model.days.find((d) => d.key === "2027-07-01")).toMatchObject({ absent: 1, available: 1, duplicates: [id(3)], lowCoverage: true });
    model = buildTeamModel(data, { includePending: false }); expect(model.days.find((d) => d.key === "2027-07-01").duplicates).toHaveLength(0);
    data.closures.push({ id: id(10), organization_id: id(1), label: "Yrityksen sulku", start_date: "2027-07-01", end_date: "2027-07-02" });
    expect(buildTeamModel(data).days.find((d) => d.key === "2027-07-01")).toMatchObject({ closed: true, working: false, lowCoverage: false });
  });
  it("department coverage does not reuse a misleading organization threshold", () => {
    const model = buildTeamModel(fixture(), { departmentId: id(8) }); expect(model.members).toHaveLength(1); expect(model.days.every((d) => !d.lowCoverage)).toBe(true);
    expect(() => buildTeamModel(fixture(), { departmentId: id(99) })).toThrow();
  });
  it("rejects mixed tenant snapshots and foreign member/type references", () => {
    for (const list of ["members", "types", "departments", "closures", "memberships", "invites"]) { const data = fixture(); data[list].push({ id: id(99), organization_id: id(99) }); expect(() => buildTeamModel(data)).toThrow(); }
    const data = fixture(); data.leaves[0].member_id = id(99); expect(() => buildTeamModel(data)).toThrow();
  });
  it("employee labels and every export hide coworkers' reasons even in an overprivileged fixture", async () => {
    const data = fixture(); data.role = "employee"; const model = buildTeamModel(data);
    expect(teamLeaveLabel(data, data.leaves[0])).toBe("Poissaolo"); expect(canEditTeamLeave(data, data.leaves[0])).toBe(false);
    expect(JSON.stringify(teamWorkbook(model))).not.toContain("Yksityinen vapaa");
    const ics = teamToIcs(model, { stamp: "20261010T000000Z" }); expect(ics).not.toContain("Yksityinen vapaa"); expect(ics).toContain("B: Poissaolo");
    const pdf = await renderTeamPdf(model, { PDFDocument, compress: false }); expect(pdf.bytes.length).toBeGreaterThan(5000);
    expect(new TextDecoder().decode(teamToXlsx(model))).not.toContain("Yksityinen vapaa");
    expect(pdf.warnings).toEqual([]);
  });
  it("allows employees to edit only their own pending rows", () => {
    const data = fixture(); data.role = "employee";
    const own = { ...data.leaves[0], member_id: data.member_id, status: "pending" };
    expect(canEditTeamLeave(data, own)).toBe(true); expect(canEditTeamLeave(data, { ...own, status: "approved" })).toBe(false);
    data.role = "manager"; expect(canEditTeamLeave(data, data.leaves[0])).toBe(true);
  });
  it("supports leap day and full year-crossing ICS ranges with stable private IDs", () => {
    const data = fixture(2028); data.leaves[0].start_date = "2027-12-28"; data.leaves[0].end_date = "2028-02-29";
    const model = buildTeamModel(data), ics = teamToIcs(model, { stamp: "20261010T000000Z" });
    expect(ics).toContain("DTSTART;VALUE=DATE:20271228"); expect(ics).toContain("DTEND;VALUE=DATE:20280301"); expect(ics.replace(/\r\n /g, "")).toContain(`${id(1)}-team-${id(6)}@viikkonro.fi`); expect(ics).not.toMatch(/URL:|REFRESH-INTERVAL/);
    expect(teamWorkbook(model).sheets[0].rows).toHaveLength(366);
  });
  it("fails closed without configuration and rejects server keys", () => {
    expect(teamBackendConfig({})).toBeNull();
    for (const key of ["sb_secret_never", "invalid", `x.${btoa(JSON.stringify({ role: "service_role" }))}.y`]) expect(() => teamBackendConfig({ VITE_TEAM_SUPABASE_URL: "https://project.supabase.co", VITE_TEAM_SUPABASE_PUBLISHABLE_KEY: key })).toThrow();
    expect(teamBackendConfig({ VITE_TEAM_SUPABASE_URL: "https://project.supabase.co", VITE_TEAM_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_testing" })).toMatchObject({ url: "https://project.supabase.co" });
  });
  it("does not expose backend exception details in client errors", async () => {
    await expect(teamRpc({ rpc: async () => ({ error: { code: "42501", message: "secret tenant name" } }) }, "team_snapshot")).rejects.toThrow("Sinulla ei ole oikeutta");
    await expect(teamRpc({ rpc: async () => ({ error: { code: "40001" } }) }, "team_command")).rejects.toThrow("toisessa istunnossa");
  });
});
