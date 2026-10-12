import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
import { createEvent, dayKey } from "../calendar/events.js";
import { holidaysInYear } from "../../data/holidays.js";
import { isoWeek, isoYear } from "../../components/dateUtils.js";
export const TEAM_STATUSES = Object.freeze({ pending: "Odottaa hyväksyntää", approved: "Hyväksytty", rejected: "Hylätty" });
export const TEAM_DISCLOSURE = "Saatavuus on suunnitteluarvio: maanantai-perjantai, Suomen pyhäpäivät ja yrityksen sulut huomioiden. Odottavat pyynnöt ovat alustavia. Arvio ei laske lakisääteistä lomankulutusta, työvuoroja tai palkkoja. Älä kirjaa diagnooseja, terveystietoja tai vapaan yksityistä syytä.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateTeamSnapshot(snapshot) {
  const org = snapshot?.organization;
  if (!org || !UUID.test(org.id) || typeof org.name !== "string" || org.name.trim().length < 1 || org.name.length > 80 || !Number.isInteger(org.version) || org.version < 1 || !Number.isInteger(org.min_coverage) || org.min_coverage < 0 || org.min_coverage > 500 || typeof org.include_holidays !== "boolean" || !Number.isInteger(org.calendar_year) || org.calendar_year < 2000 || org.calendar_year > 2100 || !["owner", "manager", "employee"].includes(snapshot.role)) throw new Error("Virheellinen organisaation kalenteri.");
  for (const name of ["members", "departments", "types", "leaves", "closures", "memberships", "invites"]) {
    if (!Array.isArray(snapshot[name])) throw new Error("Virheellinen organisaation kalenteri.");
    for (const row of snapshot[name]) if (row.organization_id && row.organization_id !== org.id) throw new Error("Organisaatioiden tiedot eivät saa sekoittua.");
  }
  const members = new Set(snapshot.members.map((r) => r.id)), types = new Set(snapshot.types.map((r) => r.id)), departments = new Set(snapshot.departments.map((r) => r.id));
  for (const m of snapshot.members) if (!UUID.test(m.id) || (m.department_id && !departments.has(m.department_id))) throw new Error("Virheellinen tiimin jäsen.");
  for (const r of snapshot.leaves) if (!UUID.test(r.id) || !members.has(r.member_id) || (r.type_id && !types.has(r.type_id)) || !Object.hasOwn(TEAM_STATUSES, r.status)) throw new Error("Virheellinen poissaolomerkintä.");
  return snapshot;
}
export function canEditTeamLeave(snapshot, leave) {
  return snapshot.role === "owner" || snapshot.role === "manager" || (snapshot.role === "employee" && leave.member_id === snapshot.member_id && leave.status === "pending");
}
export function teamLeaveLabel(snapshot, leave) {
  // Defense in depth: exports never reveal coworkers' reasons for employee sessions.
  if (snapshot.role === "employee" && leave.member_id !== snapshot.member_id) return "Poissaolo";
  return snapshot.types.find((t) => t.id === leave.type_id)?.name ?? "Poissaolo";
}
export function buildTeamModel(input, { departmentId = "", includePending = true } = {}) {
  const snapshot = validateTeamSnapshot(input), org = snapshot.organization, year = org.calendar_year;
  if (departmentId && !snapshot.departments.some((d) => d.id === departmentId)) throw new Error("Tuntematon osasto.");
  const members = snapshot.members.filter((m) => m.active && (!departmentId || m.department_id === departmentId));
  const ids = new Set(members.map((m) => m.id));
  const leaves = snapshot.leaves.filter((l) => ids.has(l.member_id) && (l.status === "approved" || (includePending && l.status === "pending")));
  const records = leaves.map((l) => ({ ...l, label: `${members.find((m) => m.id === l.member_id).label}: ${teamLeaveLabel(snapshot, l)}`, description: TEAM_STATUSES[l.status], kind: "leave" }));
  records.push(...snapshot.closures.map((c) => ({ ...c, label: c.label, kind: "closure", description: "Yrityksen sulku" })));
  if (org.include_holidays) records.push(...holidaysInYear(year).filter((h) => h.official).map((h) => ({ id: `holiday-${dayKey(h.date)}`, start_date: dayKey(h.date), end_date: dayKey(h.date), label: h.name, kind: "holiday", description: "Suomen pyhäpäivä" })));
  const events = records.map((r) => createEvent({ id: `team-${r.id}`, date: r.start_date, endDate: r.end_date, title: r.label.slice(0, 120), description: r.description, kind: r.kind }));
  const calendar = buildCalendarModel(createCalendarConfig({ year, dayRuleMode: "FINLAND_PROJECT", branding: { companyName: org.name }, include: { holidays: false, weekNumbers: true } }), events);
  const covers = (r, key) => r.start_date <= key && r.end_date >= key;
  const days = calendar.months.flatMap((m) => m.rows.flatMap((w) => w.days.filter(Boolean))).map((d) => {
    const closed = snapshot.closures.some((c) => covers(c, d.key));
    const counts = new Map();
    for (const l of leaves) if (covers(l, d.key)) counts.set(l.member_id, (counts.get(l.member_id) ?? 0) + 1);
    const absent = new Set(counts.keys());
    const duplicates = [...counts].filter(([, count]) => count > 1).map(([id]) => id);
    const working = d.counts && !closed;
    const available = working ? members.length - absent.size : 0;
    return { ...d, closed, working, absent: absent.size, available, duplicates, lowCoverage: working && !departmentId && available < org.min_coverage, week: isoWeek(d.date), weekYear: isoYear(d.date) };
  });
  return { snapshot, calendar, members, leaves, records, days, departmentId, includePending, disclosure: TEAM_DISCLOSURE, dayMap: new Map(days.map((d) => [d.key, d])) };
}
