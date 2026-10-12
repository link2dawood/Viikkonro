import { describe, expect, it } from "vitest";
import PDFDocument from "pdfkit";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { newConstructionDraft, validateConstructionConfig, CONSTRUCTION_TYPES } from "./config.js";
import { buildConstructionModel, constructionWeek, constructionConflicts } from "./model.js";
import { constructionWorkbook, constructionToCsv, constructionToIcs, constructionToXlsx, renderConstructionPdf } from "./exports.js";
import { calendarGroups } from "../planning/dates.js";
import { toDate, dayKey } from "../calendar/events.js";
const draft = (extra = {}) => ({ ...newConstructionDraft("2027-03-22"), end: "2027-04-02", ...extra });
const row = (id, type = "task", start = "2027-03-22", end = start, extra = {}) => ({ id, type, label: `Merkintä ${id}`, start, end, note: "", subcontractorNote: "", weatherRisk: "", ...extra });
const calendarId = "1234567890abcdef1234567890abcdef", stamp = "20261010T120000Z";
const flat = (ics) => ics.replace(/\r\n[ \t]/g, "");
const hasPdfText = spawnSync("pdftotext", ["-v"]).status === 0;
describe("construction configuration and planning engine", () => {
  it.each([2026, 2027, 2028])("reuses the project day rule and ISO grouping in %i", (year) => {
    const model = buildConstructionModel(draft({ start: `${year}-01-01`, end: `${year}-12-31` }));
    expect(model.weeks.map((w) => w.workingDays)).toEqual(calendarGroups(toDate(`${year}-01-01`), toDate(`${year}-12-31`), "FINLAND_PROJECT").map((w) => w.workingDays));
    expect(model.availableDays).toBe(model.workingDays);
    expect(model.holidays).toHaveLength(13);
  });
  it("preserves weekend project boundaries and single-day periods", () => {
    const model = buildConstructionModel(draft({ start: "2027-03-27", end: "2027-03-27" }));
    expect(dayKey(model.start)).toBe("2027-03-27");
    expect(dayKey(model.end)).toBe("2027-03-27");
    expect(model.availableDays).toBe(0);
  });
  it("deduplicates overlapping shutdown days without moving project or tasks", () => {
    const model = buildConstructionModel(draft({ records: [row("phase", "phase", "2027-03-22", "2027-04-02"), row("close1", "shutdown", "2027-03-30", "2027-03-31"), row("close2", "shutdown", "2027-03-31", "2027-04-01"), row("delivery", "delivery", "2027-03-31")] }));
    expect(model.workingDays).toBe(8);
    expect(model.availableDays).toBe(5);
    expect(model.weeks.map((w) => w.shutdownDays)).toEqual([0, 3]);
    expect(model.conflicts.map((r) => r.id)).toEqual(["phase", "delivery"]);
    expect(model.config.records[0].end).toBe("2027-04-02");
  });
  it("does not subtract weekends or holidays twice", () => {
    const model = buildConstructionModel(draft({ records: [row("close", "shutdown", "2027-03-26", "2027-03-29")] }));
    expect(model.availableDays).toBe(model.workingDays);
    expect(model.weeks.every((w) => w.shutdownDays === 0)).toBe(true);
  });
  it("scopes shutdown conflicts to the selected week", () => {
    const model = buildConstructionModel(draft({ records: [row("a", "phase", "2027-03-22", "2027-04-02"), row("close", "shutdown", "2027-03-30", "2027-03-31")] }));
    expect(constructionConflicts(model)).toHaveLength(1);
    expect(constructionConflicts(model, model.weeks[0].key)).toHaveLength(0);
    expect(constructionConflicts(model, model.weeks[1].key)).toHaveLength(1);
  });
  it("handles ISO week 53 and shutdowns at year boundaries", () => {
    const model = buildConstructionModel(draft({ start: "2026-12-28", end: "2027-01-10", records: [row("close", "shutdown", "2026-12-31", "2027-01-04")] }));
    expect(model.weeks[0]).toMatchObject({ year: 2026, week: 53 });
    expect(model.weeks[1]).toMatchObject({ year: 2027, week: 1 });
    expect(model.workingDays).toBe(8); expect(model.availableDays).toBe(6);
  });
  it("includes leap day and keeps the project treatment of eves", () => {
    expect(buildConstructionModel(draft({ start: "2028-02-29", end: "2028-02-29" })).workingDays).toBe(1);
    expect(buildConstructionModel(draft({ start: "2026-12-24", end: "2026-12-24" })).workingDays).toBe(1);
  });
  it("puts multi-week tasks on every touched week and retains distinct overlaps", () => {
    const model = buildConstructionModel(draft({ records: [row("a", "task", "2027-03-22", "2027-04-02"), row("b", "task", "2027-03-22", "2027-04-02")] }));
    expect(model.weeks.map((w) => w.records.length)).toEqual([2, 2]);
    expect(constructionWeek(model, "missing")).toBe(model.weeks[0]);
  });
  it("validates all six record types and strips unrecognized personal fields", () => {
    const config = validateConstructionConfig(draft({ employeeName: "Private", records: Object.keys(CONSTRUCTION_TYPES).map((type) => row(type, type, "2027-03-22", "2027-03-22", { employeeName: "Private" })) }));
    expect(config.records).toHaveLength(6);
    expect(JSON.stringify(config)).not.toContain("Private");
  });
  it("rejects invalid, reversed, out-of-period and multi-day point dates", () => {
    expect(() => buildConstructionModel(draft({ start: "2027-02-29" }))).toThrow();
    expect(() => buildConstructionModel(draft({ end: "2027-01-01" }))).toThrow();
    expect(() => buildConstructionModel(draft({ records: [row("a", "delivery", "2027-03-22", "2027-03-23")] }))).toThrow();
    expect(() => buildConstructionModel(draft({ records: [row("a", "task", "2027-03-21")] }))).toThrow();
    expect(() => buildConstructionModel(draft({ records: [row("a", "task", "2027-04-01", "2027-03-22")] }))).toThrow();
  });
  it("rejects duplicate identities, unknown types and excessive data", () => {
    expect(() => validateConstructionConfig(draft({ records: [row("a"), row("a")] }))).toThrow();
    expect(() => validateConstructionConfig(draft({ records: [row("a", "weather-api")] }))).toThrow();
    expect(() => validateConstructionConfig(draft({ records: Array.from({ length: 251 }, (_, i) => row(`r${i}`)) }))).toThrow();
    expect(() => validateConstructionConfig(draft({ projectName: "x".repeat(101) }))).toThrow();
    expect(() => validateConstructionConfig(draft({ weatherNotes: "x".repeat(1001) }))).toThrow();
    expect(() => validateConstructionConfig(draft({ end: "2030-04-03" }))).toThrow();
  });
  it("accepts a versioned JSON round trip with Finnish manual notes", () => {
    const config = validateConstructionConfig(draft({ siteName: "Äänekoski", weatherNotes: "Pakkasriski, ei ennustetta", records: [row("a", "inspection", "2027-03-22", "2027-03-22", { subcontractorNote: "Kaluston käyttö" })] }));
    expect(validateConstructionConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
  });
});
describe("construction exports and print layouts", () => {
  it("exports native Excel dates, full notes and all weekly CSV rows", () => {
    const model = buildConstructionModel(draft({ projectName: "=SUM(1)", weatherNotes: "=1+1", records: [row("a", "task", "2027-03-22", "2027-04-02", { note: "@SUM(1)", weatherRisk: "Jäätyminen", subcontractorNote: "Kaluston käyttö" })] }));
    const workbook = constructionWorkbook(model);
    expect(workbook.sheets).toHaveLength(4);
    expect(workbook.sheets[2].rows[0][3]).toBeInstanceOf(Date);
    expect([...constructionToXlsx(model).slice(0, 2)]).toEqual([80, 75]);
    const csv = constructionToCsv(model);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("'=SUM(1)"); expect(csv).toContain("'@SUM(1)");
    expect(csv).toContain("Kaluston käyttö"); expect(csv).toContain("Jäätyminen");
    expect(csv.split("\r\n")).toHaveLength(3);
  });
  it("exports an empty weekly plan with its notes and holidays", () => {
    const model = buildConstructionModel(draft({ weatherNotes: "Varapäivä" }));
    expect(constructionToCsv(model).split("\r\n")).toHaveLength(3);
    expect(constructionToCsv(model)).toContain("Pitkäperjantai");
    expect(constructionToCsv(model)).toContain("Varapäivä");
  });
  it.each([2026, 2027, 2028])("exports RFC all-day private ICS in %i", (year) => {
    const model = buildConstructionModel(draft({ start: `${year}-12-28`, end: `${year + 1}-01-10`, records: [row("a", "phase", `${year}-12-28`, `${year + 1}-01-04`, { label: "Äänekoski; työvaihe", note: "Rivi 1\nRivi 2" })] }));
    const text = constructionToIcs(model, { calendarId, stamp });
    expect(flat(text)).toContain("SUMMARY:Työvaihe: Äänekoski\\; työvaihe");
    expect(flat(text)).toContain(`DTEND;VALUE=DATE:${year + 1}0105`);
    expect(flat(text)).toContain("DESCRIPTION:Rivi 1\\nRivi 2");
    const uids = flat(text).match(/^UID:.+$/gm); expect(new Set(uids).size).toBe(uids.length);
    expect(text).not.toMatch(/TZID|URL:|RRULE|REFRESH-INTERVAL/);
    for (const line of text.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it("retains row UIDs when dates change and rejects missing namespaces", () => {
    const a = flat(constructionToIcs(buildConstructionModel(draft({ records: [row("a")] })), { calendarId, stamp }));
    const b = flat(constructionToIcs(buildConstructionModel(draft({ records: [row("a", "task", "2027-03-23")] })), { calendarId, stamp }));
    expect(a.match(/UID:.*construction-a@viikkonro.fi/)[0]).toBe(b.match(/UID:.*construction-a@viikkonro.fi/)[0]);
    expect(() => constructionToIcs(buildConstructionModel(draft()))).toThrow();
  });
  it("renders both weekly and overview PDF layouts", async () => {
    for (const layout of ["weekly", "overview"]) {
      const model = buildConstructionModel(draft({ layout, records: [row("a", "task", "2027-03-22", "2027-04-02", { note: "Huomautus" })] }));
      const result = await renderConstructionPdf(model, { PDFDocument });
      expect(result.pages).toBeGreaterThanOrEqual(layout === "weekly" ? 2 : 3);
      expect(new TextDecoder().decode(result.bytes.slice(0, 8))).toContain("%PDF-");
    }
  });
  it.skipIf(!hasPdfText)("preserves full Finnish notes, many events and selected-week PDF scope", async () => {
    const directory = mkdtempSync(join(tmpdir(), "construction-pdf-"));
    try {
      const records = Array.from({ length: 30 }, (_, i) => row(`r${i}`, "task", "2027-03-22", "2027-03-22", { note: `Huomio ${i}: ${"Öljy ja jäätyminen. ".repeat(30)} LOPPU${i}` }));
      records.push(row("later", "delivery", "2027-04-02", "2027-04-02", { label: "Myöhempi toimitus" }));
      const model = buildConstructionModel(draft({ records, projectName: "Äänekosken rakennusprojektin pitkä suomalainen nimi", siteName: "Työmaan nimi" }));
      const result = await renderConstructionPdf(model, { PDFDocument });
      expect(result.pages).toBeGreaterThan(5);
      const file = join(directory, "a.pdf"); writeFileSync(file, result.bytes);
      const extracted = spawnSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
      expect(extracted.status).toBe(0);
      expect(extracted.stdout).toContain("Äänekosken rakennusprojektin pitkä suomalainen nimi");
      for (let i = 0; i < 30; i += 1) expect(extracted.stdout).toContain(`LOPPU${i}`);
      expect(extracted.stdout).not.toContain("Myöhempi toimitus");
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
