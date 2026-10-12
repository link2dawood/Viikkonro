import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
import { createEvent } from "../calendar/events.js";
import { schoolHolidayCities } from "../calendar/sources.js";
import { paydaysInYear } from "../../data/paydayPages.js";
import { createForm, formToConfigInput, parseDraft, serializeDraft } from "../../components/companyCalendar/formModel.js";
import { COMPANY_SUBSCRIPTION, companyCalendarToIcs, companyIcsEvents, newCalendarIdentity, utcIcsStamp } from "./companyIcs.js";

const calendarId = "1234567890abcdef1234567890abcdef";
const stamp = "20261010T120000Z";
const modelFor = (year, extra = {}) => buildCalendarModel(createCalendarConfig({ year, ...extra }));
const output = (model, extra = {}) => companyCalendarToIcs(model, { calendarId, stamp, ...extra });
// Independent consumer: unfold content lines and read component properties.
const unfold = (ics) => ics.replace(/\r\n[ \t]/g, "");
const readEvents = (ics) => [...unfold(ics).matchAll(/BEGIN:VEVENT\r\n([\s\S]*?)END:VEVENT/g)].map((match) => Object.fromEntries(match[1].trim().split("\r\n").map((line) => {
  const colon = line.indexOf(":");
  return [line.slice(0, colon), line.slice(colon + 1)];
})));

describe("private company ICS", () => {
  for (const year of [2026, 2027, 2028]) {
    it(`${year}: includes every selected source without duplicate UIDs`, () => {
      const city = schoolHolidayCities(year)[0];
      const model = modelFor(year, {
        include: { weekNumbers: true, holidays: true, flagDays: true, paydays: { day: 15 }, schoolHolidays: city ? { city } : null },
        paydayDates: [`${year}-03-10`],
        events: [{ id: "meeting", date: `${year}-05-12`, title: "Yhtiökokous", kind: "company" }],
        periods: [
          { id: "closure", kind: "closure", label: "Kesäsulku", start: `${year}-07-01`, end: `${year}-07-15` },
          { id: "season", kind: "season", label: "Lomakausi", start: `${year}-06-01`, end: `${year}-08-31` },
        ],
      });
      const ics = output(model);
      const events = readEvents(ics);
      expect(events).toHaveLength(model.events.length);
      expect(new Set(events.map((event) => event.UID)).size).toBe(events.length);
      for (const kind of ["holiday", "flag-day", "payday", "closure", "season", "company", "week", ...(city ? ["school"] : [])]) {
        expect(model.events.some((event) => event.kind === kind)).toBe(true);
      }
      expect(unfold(ics)).toContain("SUMMARY:Yhtiökokous");
      expect(unfold(ics)).toContain("SUMMARY:Kesäsulku");
      expect(ics).toContain("X-WR-TIMEZONE:Europe/Helsinki\r\n");
      expect(ics).not.toMatch(/TZID=|VTIMEZONE|RRULE|REFRESH-INTERVAL|URL:/);
      for (const event of events) {
        expect(event.DTSTAMP).toBe(stamp);
        expect(event["DTSTART;VALUE=DATE"]).toMatch(/^\d{8}$/);
        expect(event["DTEND;VALUE=DATE"] > event["DTSTART;VALUE=DATE"]).toBe(true);
      }
    });

    it(`${year}: handles January payday shifted into the previous year`, () => {
      const model = modelFor(year, { include: { paydays: { day: 1 } } });
      const events = companyIcsEvents(model, calendarId).filter((event) => event.uid.includes("payday-month"));
      expect(events).toHaveLength(12);
      expect(new Set(events.map((event) => event.uid)).size).toBe(12);
      expect(events.find((event) => event.uid === `${calendarId}-payday-month-${year}-1@viikkonro.fi`).date.getFullYear()).toBe(year - 1);
      expect(events.map((event) => event.date.getTime())).toEqual(paydaysInYear(year, 1).map((payday) => payday.actual.getTime()));
    });

    it(`${year}: keeps full closure boundaries and December's exclusive end`, () => {
      const model = modelFor(year, { periods: [
        { id: "start", kind: "closure", label: "Vuodenvaihde", start: `${year - 1}-12-28`, end: `${year}-01-05` },
        { id: "end", kind: "closure", label: "Joulusulku", start: `${year}-12-28`, end: `${year + 1}-01-05` },
      ], events: [{ id: "last", kind: "company", date: `${year}-12-31`, title: "Vuoden viimeinen päivä" }] });
      const events = readEvents(output(model));
      const byUid = (id) => events.find((event) => event.UID === `${calendarId}-${id}@viikkonro.fi`);
      expect(byUid("period-start")["DTSTART;VALUE=DATE"]).toBe(`${year - 1}1228`);
      expect(byUid("period-start")["DTEND;VALUE=DATE"]).toBe(`${year}0106`);
      expect(byUid("period-end")["DTEND;VALUE=DATE"]).toBe(`${year + 1}0106`);
      expect(byUid("last")["DTEND;VALUE=DATE"]).toBe(`${year + 1}0101`);
    });
  }

  it("exports February 29, 2028 with March 1 as exclusive end", () => {
    const events = readEvents(output(modelFor(2028, { events: [{ id: "leap", date: "2028-02-29", title: "Karkauspäivä", kind: "company" }] })));
    expect(events.find((event) => event.UID.includes("-leap@"))).toMatchObject({ "DTSTART;VALUE=DATE": "20280229", "DTEND;VALUE=DATE": "20280301" });
    for (const year of [2026, 2027]) expect(() => modelFor(year, { events: [{ id: "bad", date: `${year}-02-29`, title: "Bad", kind: "company" }] })).toThrow();
  });

  it("escapes Finnish text, separators and every newline without property injection", () => {
    const title = "Äänekosken työpäivä; öljy, vesi\\maa\rUID:injection\nRivi\r\nViimeinen";
    const model = modelFor(2027, { branding: { companyName: "Äänekosken Yhteistyökumppanit Oy ".repeat(2) }, events: [{ id: "text", date: "2027-03-28", title, kind: "company" }] });
    const ics = output(model);
    expect(unfold(ics)).toContain("SUMMARY:Äänekosken työpäivä\\; öljy\\, vesi\\\\maa\\nUID:injection\\nRivi\\nViimeinen");
    expect(ics).not.toContain("\rUID:injection");
    expect(ics.replaceAll("\r\n", "")).not.toMatch(/[\r\n]/);
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(new TextDecoder("utf-8", { fatal: true }).decode(new TextEncoder().encode(ics))).toBe(ics);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("collapses identical rows but retains distinct overlapping events", () => {
    const events = [
      { id: "one", date: "2027-05-12", title: "Yhtiökokous", kind: "company" },
      { id: "duplicate", date: "2027-05-12", title: "Yhtiökokous", kind: "company" },
      { id: "two", date: "2027-05-12", title: "Henkilöstöpäivä", kind: "company" },
    ];
    const model = modelFor(2027, { include: { weekNumbers: false, holidays: false }, events, periods: [{ id: "closure", label: "Yhtiökokous", kind: "closure", start: "2027-05-12", end: "2027-05-12" }] });
    expect(readEvents(output(model))).toHaveLength(3);
    expect(readEvents(output({ ...model, events: [...model.events, model.events[0]] }))).toHaveLength(3);
    expect(() => output({ ...model, events: [...model.events, createEvent({ ...events[0], title: "Conflicting" })] })).toThrow(/Conflicting/);
  });

  it("preserves identity through draft reload, edits and row reordering", () => {
    const form = { ...createForm(2027), calendarId, events: [{ id: "existing", date: "2027-05-12", title: "Alkuperäinen" }], paydayDates: [{ id: "salary", date: "2027-05-15" }] };
    const toEvents = (f) => companyIcsEvents(buildCalendarModel(createCalendarConfig(formToConfigInput(f).input)), f.calendarId, { paydayRows: f.paydayDates });
    const before = toEvents(form);
    const restored = parseDraft(serializeDraft(form), { years: [2026, 2027, 2028], fallbackYear: 2027 });
    expect(toEvents(restored)).toEqual(before);
    restored.companyName = "Uusi yrityksen nimi";
    restored.events[0].title = "Päivitetty";
    restored.events[0].date = "2027-05-13";
    restored.paydayDates[0].date = "2027-05-14";
    restored.events.push({ id: "new", date: "2027-01-01", title: "Uusi" });
    restored.events.reverse();
    const after = toEvents(restored);
    for (const event of before) expect(after.some((next) => next.uid === event.uid)).toBe(true);
    expect(output(modelFor(2027), { calendarId: "abcdef1234567890abcdef1234567890" })).not.toContain(`${calendarId}-`);
  });

  it("retains recurring payday month identities after the rule changes", () => {
    const uids = (day) => companyIcsEvents(modelFor(2027, { include: { paydays: { day } } }), calendarId).filter((event) => event.uid.includes("payday-month")).map((event) => event.uid).sort();
    expect(uids(1)).toEqual(uids(15));
    expect(uids(15)).toEqual(uids("last"));
  });

  it("handles 500 company events without losing unique entries", () => {
    const events = Array.from({ length: 500 }, (_, index) => ({ id: `event-${index}`, date: "2028-02-29", title: `Työpäivä ${index}`, kind: "company" }));
    const exported = readEvents(output(modelFor(2028, { include: { weekNumbers: false, holidays: false }, events })));
    expect(exported).toHaveLength(500);
    expect(new Set(exported.map((event) => event.UID)).size).toBe(500);
  });

  it("does not expose private URLs or pretend to support subscriptions", () => {
    const model = modelFor(2027, { events: [{ id: "private", date: "2027-05-12", title: "Sisäinen", kind: "company", url: "https://example.com/private?secret=123" }] });
    expect(output(model)).not.toContain("example.com");
    expect(COMPANY_SUBSCRIPTION).toEqual({ available: false, mode: "private-file" });
    expect(newCalendarIdentity()).toMatch(/^[a-f0-9]{32}$/);
    expect(newCalendarIdentity()).not.toBe(newCalendarIdentity());
    expect(() => output(model, { calendarId: "Company Oy" })).toThrow();
    expect(() => output(model, { stamp: "20261010T150000" })).toThrow(/UTC/);
    expect(utcIcsStamp(new Date("2026-10-10T15:00:00+03:00"))).toBe(stamp);
  });

  it("keeps civil dates identical across host zones and Helsinki DST transitions", () => {
    const script = `import {createCalendarConfig} from './src/platform/calendar/config.js'; import {buildCalendarModel} from './src/platform/calendar/model.js'; import {companyCalendarToIcs} from './src/platform/export/companyIcs.js'; const events=['2026-03-29','2026-10-25','2027-03-28','2027-10-31','2028-03-26','2028-10-29','2028-02-29'].map((date,i)=>({id:'dst'+i,date,title:'DST',kind:'company'})); const model=buildCalendarModel(createCalendarConfig({year:2028,events:events.filter(e=>e.date.startsWith('2028')),periods:[{id:'dst',kind:'closure',label:'DST',start:'2028-03-25',end:'2028-03-27'}]})); process.stdout.write(companyCalendarToIcs(model,{calendarId:'${calendarId}',stamp:'${stamp}'}));`;
    const files = ["UTC", "Europe/Helsinki", "America/Los_Angeles", "Asia/Tokyo"].map((TZ) => execFileSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", env: { ...process.env, TZ } }));
    for (const file of files) expect(file).toBe(files[0]);
    expect(files[0]).toContain("DTEND;VALUE=DATE:20280328");
  });
});
