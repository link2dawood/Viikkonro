import { describe, it, expect } from "vitest";
import PDFDocument from "pdfkit";
import { newHrDraft, createHrConfig } from "./config.js";
import { buildHrModel } from "./model.js";
import { statutoryHrDates, HR_LEGAL_SOURCE } from "./statutory.js";
import { hrWorkbook, hrToXlsx, hrToIcs, renderHrPdf } from "./exports.js";
import { holidaysInYear } from "../../data/holidays.js";
import { platformEventCommands } from "../analytics.js";
const identity = "a".repeat(32), stamp = "20261010T000000Z";
const row = (values = {}) => ({ id: "one", type: "payday", origin: "company", label: "Palkkapäivä ääkkösillä", start: "2027-01-15", end: "2027-01-15", note: "", reference: "", ...values });
describe("HR calendar", () => {
  for (const year of [2026, 2027, 2028]) {
    it(`${year}: reuses holidays, native dates, ISO weeks and reviewed statutory sources`, () => {
      const model = buildHrModel({ ...newHrDraft(year), statutory: true });
      expect(model.calendar.stats.days).toBe(year === 2028 ? 366 : 365);
      expect(model.records.filter((r) => r.origin === "calendar").map((r) => r.start)).toEqual(holidaysInYear(year).filter((h) => h.official).map((h) => `${year}-${String(h.date.getMonth() + 1).padStart(2, "0")}-${String(h.date.getDate()).padStart(2, "0")}`).sort());
      expect(model.records.filter((r) => r.origin === "statutory")).toHaveLength(4);
      expect(statutoryHrDates(year).map((r) => r.start)).toEqual([`${year}-03-31`, `${year}-04-01`, `${year}-05-02`, `${year}-09-30`]);
      for (const r of statutoryHrDates(year)) expect(r).toMatchObject({ url: HR_LEGAL_SOURCE.url, reviewed: "2026-10-10" });
      const book = hrWorkbook(model);
      expect(book.sheets[1].rows).toHaveLength(year === 2028 ? 366 : 365);
      expect(book.sheets[1].rows[0][0]).toBeInstanceOf(Date);
      const ics = hrToIcs(model, { calendarId: identity, stamp });
      expect(ics).toContain("X-WR-TIMEZONE:Europe/Helsinki");
      expect(ics).toContain("DTSTART;VALUE=DATE:" + year + "0331");
      expect(ics).toContain("DTEND;VALUE=DATE:" + year + "0401");
      expect(ics).toContain("Finlex");
      const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]);
      expect(new Set(uids).size).toBe(uids.length);
      expect(hrToXlsx(model).slice(0, 2)).toEqual(new Uint8Array([80, 75]));
    });
  }
  it("defaults to no statutory reminders and rejects unsupported reviewed years", () => {
    expect(buildHrModel(newHrDraft(2027)).records.every((r) => r.origin === "calendar")).toBe(true);
    expect(() => statutoryHrDates(2029)).toThrow(/2026/);
    expect(() => createHrConfig({ ...newHrDraft(2029), statutory: true })).toThrow(/2026/);
    expect(buildHrModel(newHrDraft(2029)).calendar.stats.days).toBe(365);
  });
  it("does not allow user entries to forge verified origins or invent agreement rules", () => {
    for (const origin of ["statutory", "calendar", "unknown"]) expect(() => createHrConfig({ ...newHrDraft(2027), records: [row({ origin })] })).toThrow();
    expect(() => createHrConfig({ ...newHrDraft(2027), records: [row({ origin: "agreement" })] })).toThrow(/TES/);
    const r = createHrConfig({ ...newHrDraft(2027), records: [row({ origin: "agreement", reference: "Sopimus 2027, kohta X", url: "https://fake", reviewed: "2099-01-01" })] }).records[0];
    expect(r.url).toBeUndefined(); expect(r.reviewed).toBeUndefined();
  });
  it("validates dates, leap years, ranges, point events, IDs and row limits", () => {
    for (const values of [{ start: "2027-02-29" }, { end: "2027-01-14" }, { end: "2027-01-16" }, { start: "2026-01-15", end: "2026-01-15" }, { label: " " }, { type: "unknown" }, { end: null }]) expect(() => createHrConfig({ ...newHrDraft(2027), records: [row(values)] })).toThrow();
    expect(() => createHrConfig({ ...newHrDraft(2027), records: [row(), row()] })).toThrow(/toistuu/);
    expect(() => createHrConfig({ ...newHrDraft(2027), records: Array.from({ length: 251 }, (_, i) => row({ id: `r${i}` })) })).toThrow(/250/);
    expect(buildHrModel({ ...newHrDraft(2028), records: [row({ start: "2028-02-29", end: "2028-02-29" })] }).records.some((r) => r.start === "2028-02-29")).toBe(true);
  });
  it("preserves overlaps, weekend paydays and cross-year full periods with stable private IDs", () => {
    const model = buildHrModel({ ...newHrDraft(2027), holidays: false, records: [row({ start: "2027-01-02", end: "2027-01-02" }), row({ id: "two", type: "vacation", start: "2026-12-28", end: "2027-01-03" })] });
    expect(model.records).toHaveLength(2);
    expect(model.calendar.eventsByDate.get("2027-01-02")).toHaveLength(2);
    expect(model.weeks[0]).toMatchObject({ week: 53, weekYear: 2026 });
    const first = hrToIcs(model, { calendarId: identity, stamp });
    expect(first).toContain("DTSTART;VALUE=DATE:20261228"); expect(first).toContain("DTEND;VALUE=DATE:20270104");
    expect(first).not.toMatch(/https:|REFRESH-INTERVAL/);
    const changed = hrToIcs(buildHrModel({ ...newHrDraft(2027), holidays: false, records: [row({ label: "Uusi nimi" })] }), { calendarId: identity, stamp });
    expect(changed).toContain(`${identity}-hr-one@viikkonro.fi`); expect(first).toContain(`${identity}-hr-one@viikkonro.fi`);
    expect(() => hrToIcs(model)).toThrow();
  });
  it("exports safe strings, full notes, long Finnish names and source warnings to PDF", async () => {
    const model = buildHrModel({ ...newHrDraft(2028), companyName: "Ääkkösyrityksen erittäin pitkä henkilöstöhallinnon vuosikellon nimi".repeat(2).slice(0, 80), statutory: true, records: Array.from({ length: 30 }, (_, i) => row({ id: `r${i}`, start: "2028-02-29", end: "2028-02-29", origin: "agreement", reference: "TES 2028 kohta X", label: `=SUM(A1) ${i}`, note: "Täydellinen huomautus säilyy tiedostossa." })) });
    const bytes = new TextDecoder().decode(hrToXlsx(model));
    expect(bytes).not.toMatch(/<f>/); expect(bytes).toContain("inlineStr");
    const pdf = await renderHrPdf(model, { PDFDocument, compress: false });
    expect(pdf.pages).toBeGreaterThan(4); expect(pdf.warnings).toEqual([]); expect(new TextDecoder().decode(pdf.bytes).startsWith("%PDF")).toBe(true);
  });
  it("analytics exclude company data and dates", () => {
    const result = JSON.stringify(platformEventCommands("hr_calendar_export", { source: "editor", year: 2027, export_type: "xlsx", companyName: "Secret", reference: "Private", date: "2027-01-15" }));
    expect(result).not.toMatch(/Secret|Private|2027-01-15/);
  });
});
