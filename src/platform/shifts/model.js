import { buildTeamModel, validateTeamSnapshot } from "../team/model.js";
import { helsinkiLocal, helsinkiInstant, nextLocalDate, intervalsOverlap } from "./time.js";
export const SHIFT_KINDS = Object.freeze({ morning: "Aamu", evening: "Ilta", night: "Yö", custom: "Oma vuoro" });
export const SHIFT_DISCLOSURE = "Kellonajat ovat Suomen aikaa (Europe/Helsinki). Kattavuus kertoo päivän aikana vuorossa olevien eri henkilöiden määrän, ei yhtäaikaista miehitystä. Tämä on suunnittelutyökalu: työaikalakia, lepoaikoja, taukoja tai työehtosopimuksia ei tarkisteta. Tarkista ne erikseen. Älä kirjaa terveystietoja tai yksityisiä poissaolon syitä.";
export const canManageShifts = (snapshot) => ["owner", "manager"].includes(snapshot.role);
export const canEditAvailability = (snapshot, row) => canManageShifts(snapshot) || row.member_id === snapshot.member_id;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateShiftSnapshot(input) {
  validateTeamSnapshot(input);
  const members = new Set(input.members.map((m) => m.id));
  const templates = new Set((input.shift_templates ?? []).map((t) => t.id));
  for (const name of ["shift_templates", "shifts", "availability"]) {
    if (!Array.isArray(input[name])) throw new Error("Virheellinen työvuorokalenteri.");
    const ids = new Set();
    for (const r of input[name]) {
      if (!UUID.test(r.id) || ids.has(r.id) || r.organization_id !== input.organization.id) throw new Error("Virheellinen organisaation työvuoro.");
      ids.add(r.id);
      if (name === "shift_templates") {
        const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d:00$/;
        if (!Object.hasOwn(SHIFT_KINDS, r.kind) || !r.name?.trim() || r.name.length > 60 || !timePattern.test(r.start_time) || !timePattern.test(r.end_time) || ![0, 1].includes(r.end_day)) throw new Error("Virheellinen vuoromalli.");
      } else {
        const start = Date.parse(r.starts_at), end = Date.parse(r.ends_at);
        if (!members.has(r.member_id) || !Number.isFinite(start) || !Number.isFinite(end) || start >= end || (name === "shifts" && (end - start > 36 * 3600000 || !templates.has(r.template_id))) || (name === "availability" && end - start > 400 * 86400000) || typeof r.notes !== "string" || r.notes.length > 500) throw new Error("Virheellinen työvuorojakso.");
      }
    }
  }
  return input;
}
export function buildShiftModel(input, { departmentId = "", from = `${input.organization.calendar_year}-01-01`, to = `${input.organization.calendar_year}-12-31` } = {}) {
  const snapshot = validateShiftSnapshot(input);
  const team = buildTeamModel(snapshot, { departmentId });
  if (from > to || !team.dayMap.has(from) || !team.dayMap.has(to)) throw new Error("Valitse jakso kalenterivuoden sisältä.");
  const memberIds = new Set(team.members.map((m) => m.id));
  const begin = helsinkiInstant(`${from}T00:00`), finish = helsinkiInstant(`${nextLocalDate(to)}T00:00`);
  const range = { starts_at: begin, ends_at: finish };
  const notes = (r) => snapshot.role === "employee" && r.member_id !== snapshot.member_id ? "" : r.notes;
  const availability = snapshot.availability.filter((r) => memberIds.has(r.member_id) && intervalsOverlap(r, range)).map((r) => ({ ...r, notes: notes(r) }));
  const shifts = snapshot.shifts.filter((r) => memberIds.has(r.member_id) && intervalsOverlap(r, range)).map((r) => ({ ...r, notes: notes(r), template: snapshot.shift_templates.find((t) => t.id === r.template_id), member: team.members.find((m) => m.id === r.member_id), conflicts: [] })).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id));
  const groupMembers = (rows) => {
    const groups = new Map();
    for (const r of rows) { if (!groups.has(r.member_id)) groups.set(r.member_id, []); groups.get(r.member_id).push(r); }
    return groups;
  };
  const overlapIds = new Set();
  for (const rows of groupMembers(snapshot.shifts).values()) {
    rows.sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
    let longest = null;
    for (const r of rows) {
      if (longest && intervalsOverlap(longest, r)) { overlapIds.add(longest.id); overlapIds.add(r.id); }
      if (!longest || Date.parse(r.ends_at) > Date.parse(longest.ends_at)) longest = r;
    }
  }
  const unavailable = groupMembers(snapshot.availability);
  const periodInstants = (rows) => rows.map((r) => ({ ...r, starts_at: helsinkiInstant(`${r.start_date}T00:00`), ends_at: helsinkiInstant(`${nextLocalDate(r.end_date)}T00:00`) }));
  const approved = groupMembers(periodInstants(snapshot.leaves.filter((r) => r.status === "approved")));
  const pending = groupMembers(periodInstants(snapshot.leaves.filter((r) => r.status === "pending")));
  const closures = periodInstants(snapshot.closures);
  // Check against the whole fetched year, including rows crossing the selected
  // month/week boundary. Half-open instants allow adjacent shifts.
  for (const shift of shifts) {
    if (overlapIds.has(shift.id)) shift.conflicts.push("Päällekkäinen vuoro");
    if ((unavailable.get(shift.member_id) ?? []).some((r) => intervalsOverlap(shift, r))) shift.conflicts.push("Ei käytettävissä");
    for (const [rows, label] of [[approved.get(shift.member_id) ?? [], "Hyväksytty poissaolo"], [pending.get(shift.member_id) ?? [], "Odottava poissaolopyyntö"], [closures, "Yrityksen sulku"]]) {
      if (rows.some((r) => intervalsOverlap(shift, r))) shift.conflicts.push(label);
    }
  }
  const days = team.days.filter((d) => d.key >= from && d.key <= to).map((d) => {
    const dayRange = { starts_at: helsinkiInstant(`${d.key}T00:00`), ends_at: helsinkiInstant(`${nextLocalDate(d.key)}T00:00`) };
    const rows = shifts.filter((r) => intervalsOverlap(r, dayRange));
    const scheduled = new Set(rows.map((r) => r.member_id)).size;
    return { ...d, shifts: rows, scheduled, lowShiftCoverage: rows.length > 0 && !departmentId && scheduled < snapshot.organization.min_coverage };
  });
  return { snapshot, shifts, availability, days, from, to, departmentId, disclosure: SHIFT_DISCLOSURE, year: snapshot.organization.calendar_year, local: helsinkiLocal };
}
