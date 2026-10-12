import { describe, expect, it } from "vitest";
import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { newVacationDraft, validateVacationConfig, vacationConfigFromJson, vacationConfigToJson } from "./config.js";
import { buildVacationModel } from "./model.js";
import { vacationWorkbook, vacationToIcs, vacationToXlsx } from "./exports.js";
import { renderVacationPdf } from "./pdf.js";
import { summarizeDayRange } from "../../data/dayRules.js";

const calendarId = "1234567890abcdef1234567890abcdef";
const draftFor = (year = 2027, extra = {}) => ({ ...newVacationDraft(year), calendarId, ...extra });
const row = (start = "2027-07-05", end = "2027-07-11", extra = {}) => ({ id: "leave1", personId: "person1", type: "vacation", label: "Kesäloma", note: "Äänekoski", start, end, ...extra });
const flatEvents = (ics) => ics.replace(/\r\n[ \t]/g, "");
const hasPdfText = spawnSync("pdftotext", ["-v"]).status === 0;
const pdfText = (bytes) => {
  const dir = mkdtempSync(join(tmpdir(), "vacation-pdf-"));
  try { const file = join(dir, "a.pdf"); writeFileSync(file, bytes); return spawnSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" }).stdout; }
  finally { rmSync(dir, { recursive: true, force: true }); }
};

describe("annual vacation planner config and rule separation", () => {
  it("defaults to planning rules and serializes a validated local plan", () => {
    const draft = draftFor();
    const result = validateVacationConfig(draft);
    expect(result.issues).toEqual([]);
    expect(result.config).toMatchObject({ leaveRule: "FINLAND_PLANNER", workRule: "FINLAND_PLANNER" });
    expect(vacationConfigFromJson(vacationConfigToJson(result.config)).config).toEqual(result.config);
    expect(Object.isFrozen(result.config.people)).toBe(true);
    expect(vacationConfigFromJson("invalid").config).toBeNull();
    expect(vacationConfigFromJson("x".repeat(250001)).config).toBeNull();
  });
  it("rejects project, sprint, banking and workday modes as vacation consumption", () => {
    for (const leaveRule of ["FINLAND_PROJECT", "FINLAND_SPRINT", "FINLAND_BANKING", "FINLAND_WORKDAY", "unknown"]) expect(validateVacationConfig(draftFor(2027, { leaveRule })).config).toBeNull();
    expect(validateVacationConfig(draftFor(2027, { workRule: "FINLAND_PROJECT" })).config).toBeNull();
  });
  it("rejects partial, invalid, reversed, out-of-year and overlong periods without dropping them", () => {
    for (const period of [row("", ""), row("2027-02-29", "2027-03-01"), row("2027-07-05", "2027-07-04"), row("2026-01-01", "2026-01-02"), row("2026-01-01", "2027-12-31"), row(undefined, undefined, { personId: "missing" }), row(undefined, undefined, { note: "x".repeat(1001) })]) {
      expect(validateVacationConfig(draftFor(2027, { periods: [period] })).config).toBeNull();
    }
    expect(validateVacationConfig(draftFor(2027, { people: [] })).config).toBeNull();
    expect(validateVacationConfig(draftFor(2027, { notes: "x".repeat(1001) })).config).toBeNull();
    expect(validateVacationConfig(draftFor(2027, { calendarId: "Private name" })).config).toBeNull();
  });
  it("enforces unique identities and explicit resource limits", () => {
    expect(validateVacationConfig(draftFor(2027, { periods: [row(), row()] })).config).toBeNull();
    const people = Array.from({ length: 21 }, (_, i) => ({ id: `p${i}`, label: `Henkilö ${i}` }));
    expect(validateVacationConfig(draftFor(2027, { people })).config).toBeNull();
    expect(validateVacationConfig(draftFor(2027, { periods: Array.from({ length: 101 }, (_, i) => row(undefined, undefined, { id: `l${i}` })) })).config).toBeNull();
  });
  for (const [year, start, end] of [[2026, "2026-07-06", "2026-07-12"], [2027, "2027-07-05", "2027-07-11"], [2028, "2028-07-03", "2028-07-09"]]) {
    it(`${year}: counts five planning days or six statutory days for the same vacation`, () => {
      const draft = draftFor(year, { periods: [row(start, end)] });
      const planner = buildVacationModel(draft);
      const statutory = buildVacationModel({ ...draft, leaveRule: "FINLAND_STATUTORY_LEAVE" });
      expect(planner.summaries[0].vacationDays).toBe(5);
      expect(statutory.summaries[0].vacationDays).toBe(6);
      expect(planner.summaries[0].availableDays).toBe(statutory.summaries[0].availableDays);
      expect(planner.calendar.stats.days).toBe(year === 2028 ? 366 : 365);
      expect(planner.calendar.config.dayRuleMode).toBe("FINLAND_PLANNER");
      expect(planner.calendar.events.some((event) => event.kind === "holiday")).toBe(true);
    });
    it(`${year}: creates Finnish PDF and native-date XLSX/ICS exports`, async () => {
      const model = buildVacationModel(draftFor(year, { periods: [row(start, end)] }));
      const workbook = vacationWorkbook(model);
      expect(workbook.sheets).toHaveLength(5);
      expect(workbook.sheets[3].rows).toHaveLength(year === 2028 ? 366 : 365);
      expect(workbook.sheets[1].rows[0][3]).toBeInstanceOf(Date);
      expect(Buffer.from(vacationToXlsx(model)).subarray(0, 2).toString()).toBe("PK");
      const ics = vacationToIcs(model, { stamp: "20261010T120000Z" });
      expect(ics).toContain("X-WR-TIMEZONE:Europe/Helsinki");
      expect(flatEvents(ics)).toContain("SUMMARY:Henkilö 1: Kesäloma");
      expect(flatEvents(ics)).toContain("Äänekoski");
      expect(ics).not.toMatch(/RRULE|URL:/);
      const pdf = await renderVacationPdf(model, { PDFDocument, compress: false });
      expect(Buffer.from(pdf.bytes).subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.pages).toBeGreaterThanOrEqual(2);
      expect(Buffer.from(pdf.bytes).toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(pdf.pages);
      if (hasPdfText) { const text = pdfText(pdf.bytes); expect(text).toContain("Kesäloma"); expect(text).toContain("Äänekoski"); expect(text).toContain("Laskentatavat ja vuosiyhteenveto"); }
    });
  }
  it("closures reduce availability and planning days without silently changing statutory consumption", () => {
    const draft = draftFor(2027, { periods: [row()], closures: [{ id: "close", label: "Kesäsulku", start: "2027-07-08", end: "2027-07-09", note: "" }] });
    const annual = summarizeDayRange("FINLAND_PLANNER", new Date(2027, 0, 1), new Date(2027, 11, 31)).counted;
    const planner = buildVacationModel(draft), statutory = buildVacationModel({ ...draft, leaveRule: "FINLAND_STATUTORY_LEAVE" });
    expect(planner.summaries[0]).toMatchObject({ vacationDays: 3, workingDays: annual - 2, availableDays: annual - 5 });
    expect(statutory.summaries[0]).toMatchObject({ vacationDays: 6, workingDays: annual - 2, availableDays: annual - 5 });
  });
  it("deduplicates totals for overlapping periods and keeps different people separate", () => {
    const model = buildVacationModel(draftFor(2027, { people: [{ id: "person1", label: "Äänekoski" }, { id: "person2", label: "Henkilö B" }], periods: [row(), row(undefined, undefined, { id: "duplicate" }), row(undefined, undefined, { id: "absence", type: "absence" }), row(undefined, undefined, { id: "other", personId: "person2", end: "2027-07-05" })] }));
    expect(model.summaries[0]).toMatchObject({ vacationDays: 5, absenceDays: 5, overlapDays: 7 });
    expect(model.summaries[1]).toMatchObject({ vacationDays: 1, overlapDays: 0 });
    const ics = flatEvents(vacationToIcs(model));
    expect(ics.match(/SUMMARY:Äänekoski: Kesäloma/g)).toHaveLength(2); // vacation plus independently typed absence
  });
  it("clips annual totals to the selected year but retains full boundary periods in exports", () => {
    const model = buildVacationModel(draftFor(2027, { periods: [row("2026-12-28", "2027-01-05")] }));
    expect(model.summaries[0].vacationDays).toBe(2);
    expect(model.periods[0].counted).toBe(6);
    expect(vacationToIcs(model)).toContain("DTSTART;VALUE=DATE:20261228");
    expect(vacationToIcs(model)).toContain("DTEND;VALUE=DATE:20270106");
  });
  it("uses the existing Easter Saturday and eve distinctions, not project days", () => {
    const model = buildVacationModel(draftFor(2027, { leaveRule: "FINLAND_STATUTORY_LEAVE", periods: [row("2027-03-27", "2027-03-29"), row("2027-12-24", "2027-12-24", { id: "eve" })] }));
    expect(model.summaries[0].vacationDays).toBe(0);
    expect(buildVacationModel(draftFor(2028, { periods: [row("2028-02-29", "2028-02-29")] })).summaries[0].vacationDays).toBe(1);
  });
  it("keeps private ICS identities stable across local save, label/date edits and separate plans", () => {
    const original = draftFor(2027, { periods: [row()], notes: "Sisäinen huomautus" });
    const saved = vacationConfigFromJson(vacationConfigToJson(original)).config;
    const before = vacationToIcs(buildVacationModel(original));
    const after = vacationToIcs(buildVacationModel({ ...saved, people: [{ id: "person1", label: "Uusi tunniste" }], periods: [row("2027-07-06", "2027-07-12")] }));
    expect(before).toContain(`${calendarId}-vacation-leave1@viikkonro.fi`);
    expect(after).toContain(`${calendarId}-vacation-leave1@viikkonro.fi`);
    expect(flatEvents(after)).toContain("Sisäinen huomautus");
    expect(vacationToIcs(buildVacationModel({ ...saved, calendarId: "abcdef1234567890abcdef1234567890" }))).not.toContain(`${calendarId}-`);
  });
  it.runIf(hasPdfText)("prints long Finnish labels and complete notes with real pagination", async () => {
    const periods = Array.from({ length: 40 }, (_, index) => row(undefined, undefined, { id: `long${index}`, label: `Kesäloma ${index}`, note: `Pitkä huomautus ${index}. ` + "Äänekosken työryhmä sopii päivistä. ".repeat(24) + ` LOPPU${index}` }));
    const model = buildVacationModel(draftFor(2027, { people: [{ id: "person1", label: "Äänekosken Yhteistyökumppanit ja Työntekijät" }], periods, notes: "Suunnitelman oma huomautus" }));
    const result = await renderVacationPdf(model, { PDFDocument });
    expect(result.pages).toBeGreaterThan(10);
    const text = pdfText(result.bytes);
    for (let index = 0; index < 40; index += 1) expect(text).toContain(`LOPPU${index}`);
    expect(text).toContain("Suunnitelman oma huomautus");
    const monthly = await renderVacationPdf(buildVacationModel(draftFor(2028, { layout: "month-page", periods: [row("2028-02-29", "2028-02-29")] })), { PDFDocument });
    expect(monthly.pages).toBeGreaterThanOrEqual(13);
  });
});
