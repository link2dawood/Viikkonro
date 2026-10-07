import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildIcs, escapeIcsText, foldIcsLine } from "./ics.js";
import { csvCell, toCsv } from "./csv.js";
import { buildXlsx, columnLetter, crc32, excelSerial, sheetName, zipStore } from "./xlsx.js";
import { calendarTable, calendarToCsv, calendarToIcs, calendarToXlsx, TABLE_HEADER } from "./calendar.js";
import { calendarCsv } from "../../data/printCalendarContent.js";
import { nonBankingReason } from "../../data/paydayPages.js";
import { buildIcs as buildFeedIcs } from "../../data/icsFeeds.js";
import { buildCalendarModel } from "../calendar/model.js";
import { createCalendarConfig } from "../calendar/config.js";

const sha = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const enc = new TextEncoder();
const dec = new TextDecoder();

// Reads a stored (uncompressed) ZIP back: the independent half of the XLSX test.
function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = {};
  let eocd = bytes.length - 22;
  expect(view.getUint32(eocd, true)).toBe(0x06054b50);
  const count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  for (let i = 0; i < count; i += 1) {
    expect(view.getUint32(at, true)).toBe(0x02014b50);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 24, true);
    const nameLen = view.getUint16(at + 28, true);
    const localAt = view.getUint32(at + 42, true);
    const name = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    expect(view.getUint32(localAt, true)).toBe(0x04034b50);
    const dataAt = localAt + 30 + view.getUint16(localAt + 26, true) + view.getUint16(localAt + 28, true);
    const data = bytes.subarray(dataAt, dataAt + size);
    expect(crc32(data)).toBe(crc);
    entries[name] = dec.decode(data);
    at += 46 + nameLen;
  }
  return entries;
}

describe("ICS serializer (moved from icsFeeds.js, output unchanged)", () => {
  // Fingerprints taken from the pre-refactor implementation.
  const events = [
    { uid: "a@viikkonro.fi", date: new Date(2026, 0, 6), summary: "Loppiainen", description: "Virallinen, arkipyhä; ok\nrivi 2", url: "https://viikkonro.fi/x" },
    { uid: "b@viikkonro.fi", date: new Date(2026, 11, 31), summary: "Pitkä otsikko ".repeat(12) },
  ];
  it("produces byte-identical output through both import paths", () => {
    const args = { calName: "Testi, kalenteri; ä", calDesc: "Kuvaus\nrivi2", events, stamp: "20260101T000000Z" };
    expect(sha(buildIcs(args))).toBe("856b6563aba65a02e1f879e5e1c153949f2fe6309e0ae4fdc689ca5fe797a6f9");
    expect(buildFeedIcs(args)).toBe(buildIcs(args));
  });
  it("folds and escapes exactly as before", () => {
    expect(sha(foldIcsLine("X-ÄÖ:" + "ääkköset ".repeat(20)))).toBe("55ecf7114bcb3eeee7b1d1ef702612db159bdc9f9782910889e5997595998e17");
    expect(sha(escapeIcsText("a\\b;c,d\ne"))).toBe("0639d0ae5142b669300f0fbe470243a86120e29d8cac62bda86034681b24f7ea");
  });
  it("never splits a UTF-8 character and keeps lines within 75 octets", () => {
    for (const line of foldIcsLine("S:" + "ä".repeat(200)).split("\r\n")) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75);
      expect(line).not.toContain("�");
    }
  });
  it("writes an inclusive multi-day event with an exclusive DTEND", () => {
    const ics = buildIcs({
      calName: "x",
      calDesc: "y",
      stamp: "20260101T000000Z",
      events: [{ uid: "c", date: new Date(2027, 6, 5), endDate: new Date(2027, 6, 30), summary: "Sulku" }],
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20270705");
    expect(ics).toContain("DTEND;VALUE=DATE:20270731");
  });
  it("lets a product set its own PRODID", () => {
    expect(buildIcs({ calName: "x", calDesc: "y", events: [], stamp: "s", prodId: "-//Acme//FI" })).toContain("PRODID:-//Acme//FI");
  });
});

describe("CSV serializer", () => {
  it("keeps the Excel download byte-identical to the pre-refactor output", () => {
    expect(sha(calendarCsv(2027))).toBe("f12f465bfd6e9ef9f1b6071cd18ac8709d347c84a78af8179c63ed953bb1874f");
    expect(calendarCsv(2027).startsWith("﻿Päivämäärä;")).toBe(true);
    expect(calendarCsv(2027).endsWith("\r\n")).toBe(false);
  });
  it("reproduces the dataset dialect (comma, LF, trailing newline) of the old writer", () => {
    const old = (header, rows) => {
      const esc = (v) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      return [header.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n") + "\n";
    };
    const header = ["a", "b", "c"];
    const rows = [[1, 'x "y"', null], ["line\nbreak", "a,b", undefined], ["", "ä", 0]];
    expect(toCsv([header, ...rows], { trailingEol: true, quoteWhen: /[",\n]/ })).toBe(old(header, rows));
  });
  it("quotes a cell that contains the delimiter, a quote or a line break", () => {
    expect(csvCell("a;b", { delimiter: ";" })).toBe('"a;b"');
    expect(csvCell("a,b", { delimiter: ";" })).toBe("a,b");
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("one\r\ntwo")).toBe('"one\r\ntwo"');
    expect(csvCell(null)).toBe("");
  });
  it("neutralises spreadsheet formulas only when asked", () => {
    expect(csvCell("=SUM(A1)")).toBe("=SUM(A1)");
    for (const bad of ["=1+1", "+1", "-1", "@cmd", "\tx"]) {
      expect(csvCell(bad, { escapeFormulas: true }).replace(/^"|"$/g, "")).toBe(`'${bad}`);
    }
    expect(csvCell(-5, { escapeFormulas: true })).toBe("-5"); // numbers are untouched
    expect(csvCell("normal", { escapeFormulas: true })).toBe("normal");
  });
});

describe("XLSX writer", () => {
  it("computes the standard CRC-32 check value", () => {
    expect(crc32(enc.encode("123456789"))).toBe(0xcbf43926);
  });
  it("round-trips files through the stored ZIP", () => {
    const zip = zipStore([
      { name: "a.txt", data: enc.encode("hello") },
      { name: "ä/b.xml", data: enc.encode("<x/>") },
    ]);
    expect(readZip(zip)).toEqual({ "a.txt": "hello", "ä/b.xml": "<x/>" });
  });
  it("numbers columns like a spreadsheet and converts dates to serials", () => {
    expect([0, 25, 26, 51, 52, 701, 702].map(columnLetter)).toEqual(["A", "Z", "AA", "AZ", "BA", "ZZ", "AAA"]);
    expect(excelSerial(new Date(2000, 0, 1))).toBe(36526);
    expect(excelSerial(new Date(2027, 0, 1)) - excelSerial(new Date(2026, 0, 1))).toBe(365);
  });
  it("makes valid, unique sheet names", () => {
    const taken = new Set();
    expect(sheetName("Plan: [2027]/a*b?", taken)).toBe("Plan 2027 a b");
    expect(sheetName("Plan: [2027]/a*b?", taken)).toBe("Plan 2027 a b 2");
    expect(sheetName("x".repeat(60))).toHaveLength(31);
    expect(sheetName("")).toBe("Sheet");
  });
  it("writes every required part and is deterministic", () => {
    const book = { sheets: [{ name: "A", columns: [{ header: "H", width: 10 }], rows: [["x", 1, true, new Date(2027, 0, 1)]] }] };
    const a = buildXlsx(book);
    const b = buildXlsx(book);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    const parts = readZip(a);
    expect(Object.keys(parts).sort()).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    const sheet = parts["xl/worksheets/sheet1.xml"];
    expect(sheet).toContain('<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">H</t></is></c>');
    expect(sheet).toContain('<c r="B2"><v>1</v></c>');
    expect(sheet).toContain('<c r="C2" t="b"><v>1</v></c>');
    expect(sheet).toContain(`<c r="D2" s="2"><v>${excelSerial(new Date(2027, 0, 1))}</v></c>`);
    expect(sheet).toContain('state="frozen"');
  });
  it("keeps user text as an inline string and strips characters XML forbids", () => {
    const parts = readZip(buildXlsx({ sheets: [{ name: "S", rows: [['=HYPERLINK("x")', "a<b>&\u0001c", null, ""]] }] }));
    const sheet = parts["xl/worksheets/sheet1.xml"];
    expect(sheet).toContain('t="inlineStr"');
    expect(sheet).not.toContain("<f>");
    expect(sheet).toContain("=HYPERLINK(&quot;x&quot;)");
    expect(sheet).toContain("a&lt;b&gt;&amp;c");
    expect(sheet).not.toContain("\u0001");
    expect(sheet).not.toContain('r="C1"'); // empty cells are skipped
  });
  it("needs at least one sheet", () => {
    expect(() => buildXlsx({ sheets: [] })).toThrow(/at least one sheet/);
  });
});

describe("calendar exports", () => {
  const config = createCalendarConfig({
    year: 2027,
    branding: { companyName: "Oy Testi Ab" },
    include: { paydays: { day: 15 } },
    periods: [{ label: "Kesäsulku", start: "2027-07-05", end: "2027-07-30" }],
    events: [{ date: "2027-05-12", title: '=HYPERLINK("http://example.com")' }],
  });
  const model = buildCalendarModel(config);
  it("lists one row per day with the week number and the reason a day is off", () => {
    const rows = calendarTable(model);
    expect(rows).toHaveLength(365);
    expect(rows[0]).toEqual(["01.01.2027", "Perjantai", 53, "Uudenvuodenpäivä", "Uudenvuodenpäivä"]);
    expect(rows.find((r) => r[0] === "05.07.2027")[4]).toBe("Kesäsulku");
    expect(calendarTable(model, { dates: "date" })[0][0]).toBeInstanceOf(Date);
  });
  it("writes a CSV that is Excel-safe and carries the company data", () => {
    const csv = calendarToCsv(model);
    expect(csv.startsWith("﻿" + TABLE_HEADER.join(";"))).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv.split("\r\n")).toHaveLength(366);
  });
  it("writes a workbook with the day table and the event list", () => {
    const parts = readZip(calendarToXlsx(model));
    expect(parts["xl/workbook.xml"]).toContain('name="2027"');
    expect(parts["xl/workbook.xml"]).toContain('name="Tapahtumat"');
    expect(parts["xl/worksheets/sheet1.xml"]).toContain("Kesäsulku");
    expect(parts["xl/worksheets/sheet2.xml"]).toContain("Kesäsulku");
  });
  it("writes an ICS named after the company, with the closure as one multi-day event", () => {
    const ics = calendarToIcs(model, { stamp: "20260101T000000Z" });
    expect(ics).toContain("X-WR-CALNAME:Oy Testi Ab 2027");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270705");
    expect(ics).toContain("DTEND;VALUE=DATE:20270731");
    expect(ics.match(/BEGIN:VEVENT/g).length).toBe(model.events.length);
  });
});

describe("existing banking-day rule is unchanged by the shared day rules", () => {
  it("matches the pre-refactor nonBankingReason on 1,098 days", () => {
    const reasons = Array.from({ length: 366 * 3 }, (_, i) => nonBankingReason(new Date(2026, 0, 1 + i)));
    expect(sha(JSON.stringify(reasons))).toBe("2441b442520764361887946d7629e74aced5e1be2007d747f200455ec8f4eb23");
  });
});
