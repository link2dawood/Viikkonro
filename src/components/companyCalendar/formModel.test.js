import { describe, expect, it } from "vitest";
import { createForm, formToConfigInput, limitedPreviewInput, parseDraft, serializeDraft, DRAFT_MAX_CHARS } from "./formModel.js";
import { validateCalendarConfig } from "../../platform/calendar/config.js";
import { buildCalendarModel } from "../../platform/calendar/model.js";
import { defaultCompanyCalendarInput } from "../../data/companyCalendar.js";

const years = [2026, 2027, 2028];
let rowN = 0;
const row = (patch) => ({ id: `t${(rowN += 1)}`, ...patch });
const config = (form) => validateCalendarConfig(formToConfigInput(form).input);

describe("company calendar form to configuration", () => {
  it("is valid with no input at all, using sensible defaults", () => {
    const { input, skipped } = formToConfigInput(createForm(2027));
    expect(skipped).toBe(0);
    const { config: c, issues } = validateCalendarConfig(input);
    expect(issues).toEqual([]);
    expect(c).toMatchObject({ year: 2027, layout: { id: "year-glance", paper: "A4" }, include: { weekNumbers: true, holidays: true, flagDays: false, paydays: null, schoolHolidays: null } });
    expect(input).toMatchObject({ ...defaultCompanyCalendarInput(2027), branding: expect.any(Object) });
  });
  it("ignores empty rows silently and counts unfinished ones", () => {
    const f = createForm(2027);
    f.closures = [row({ label: "", start: "", end: "" }), row({ label: "Ei päivää", start: "", end: "" })];
    f.events = [row({ date: "", title: "" }), row({ date: "2027-05-12", title: "" }), row({ date: "", title: "Ei päivää" }), row({ date: "2027-05-12", title: "Kunnossa" })];
    f.paydayDates = [row({ date: "" }), row({ date: "2027-06-15" })];
    const { input, skipped } = formToConfigInput(f);
    expect(skipped).toBe(3); // one closure, two events
    expect(input.events.map((e) => e.title)).toEqual(["Kunnossa"]);
    expect(input.paydayDates).toEqual(["2027-06-15"]);
    expect(validateCalendarConfig(input).issues).toEqual([]);
  });
  it("turns a single date, a range and a missing label into closures", () => {
    const f = createForm(2027);
    f.closures = [
      row({ label: "Kesäsulku", start: "2027-07-05", end: "2027-07-30" }),
      row({ label: "", start: "2027-12-24", end: "" }),
      row({ label: "Väärin päin", start: "2027-03-10", end: "2027-03-01" }),
    ];
    const { input, skipped } = formToConfigInput(f);
    expect(skipped).toBe(1);
    expect(input.periods.map((p) => [p.label, p.start, p.end, p.kind])).toEqual([
      ["Kesäsulku", "2027-07-05", "2027-07-30", "closure"],
      ["Sulkupäivä", "2027-12-24", "2027-12-24", "closure"],
    ]);
  });
  it("keeps a closure that starts in the previous year and drops one entirely outside the year", () => {
    const f = createForm(2027);
    f.closures = [
      row({ label: "Vuodenvaihde", start: "2026-12-28", end: "2027-01-05" }),
      row({ label: "Joulusulku", start: "2027-12-23", end: "2028-01-09" }),
      row({ label: "Viime vuosi", start: "2026-03-01", end: "2026-03-02" }),
    ];
    const { input, skipped } = formToConfigInput(f);
    expect(input.periods.map((p) => p.label)).toEqual(["Vuodenvaihde", "Joulusulku"]);
    expect(skipped).toBe(1);
    expect(validateCalendarConfig(input).issues).toEqual([]);
  });
  it("drops dated rows when the year changes instead of failing", () => {
    const f = createForm(2027);
    f.events = [row({ date: "2027-05-12", title: "Yhtiökokous" })];
    f.paydayDates = [row({ date: "2027-06-15" })];
    f.year = 2028;
    const { input, skipped } = formToConfigInput(f);
    expect(input.events).toEqual([]);
    expect(input.paydayDates).toEqual([]);
    expect(skipped).toBe(2);
  });
  it("maps the payday rule, the optional season and school holidays", () => {
    const f = createForm(2027);
    f.paydayRule = "day";
    f.paydayDay = "15";
    f.seasonOn = true;
    f.season = { label: "", start: "2027-06-01", end: "2027-08-15" };
    f.schoolOn = true;
    f.schoolCity = "Helsinki";
    const c = config(f).config;
    expect(c.include.paydays).toEqual({ day: 15 });
    expect(c.include.schoolHolidays).toEqual({ city: "Helsinki" });
    expect(c.periods[0]).toMatchObject({ label: "Lomakausi", kind: "season" });
    f.paydayRule = "last";
    expect(config(f).config.include.paydays).toEqual({ day: "last" });
    f.paydayRule = "none";
    expect(config(f).config.include.paydays).toBeNull();
    f.paydayRule = "day";
    f.paydayDay = "99";
    expect(config(f).config.include.paydays).toEqual({ day: 31 }); // clamped, never invalid
    f.schoolCity = "";
    expect(config(f).config.include.schoolHolidays).toBeNull();
  });
  it("reports a school city that has no data for the chosen year", () => {
    const f = createForm(2029);
    f.schoolOn = true;
    f.schoolCity = "Helsinki";
    expect(validateCalendarConfig(formToConfigInput(f).input).issues.join()).toMatch(/not available for 2029/);
  });
  it("accepts 2026, 2027 and 2028 including the leap year", () => {
    for (const year of [2026, 2027, 2028]) {
      const f = createForm(year);
      f.events = [row({ date: `${year}-12-31`, title: "Vuoden viimeinen" }), row({ date: `${year}-01-01`, title: "Vuoden eka" })];
      const c = config(f).config;
      const model = buildCalendarModel(c);
      expect(model.stats.days).toBe(year === 2028 ? 366 : 365);
      expect(model.events.filter((e) => e.kind === "company")).toHaveLength(2);
    }
  });
});

describe("the free preview", () => {
  it("keeps the company name and the visitor's days but drops logo and colours", () => {
    const f = createForm(2027);
    f.companyName = "Oy Testi Ab";
    f.color = "#112233";
    f.logo = { mime: "image/png", dataUri: "data:image/png;base64,AAAA" };
    f.events = [row({ date: "2027-05-12", title: "Yhtiökokous" })];
    const limited = limitedPreviewInput(formToConfigInput(f).input);
    expect(limited.branding).toEqual({ companyName: "Oy Testi Ab", logo: null, primaryColor: null, accentColor: null });
    expect(limited.events).toHaveLength(1);
    const c = validateCalendarConfig(limited).config;
    expect(c.branding.logo).toBeNull();
    expect(c.theme).toBe("classic");
  });
});

describe("draft saved in the browser", () => {
  const opts = { years, fallbackYear: 2027 };
  const full = () => {
    const f = createForm(2028);
    f.companyName = "Äänekosken Työläiset Oy";
    f.color = "#112233";
    f.layout = "month-page";
    f.paper = "A3";
    f.flagDays = true;
    f.schoolOn = true;
    f.schoolCity = "Helsinki";
    f.paydayRule = "last";
    f.closures = [row({ label: "Kesäsulku", start: "2028-07-03", end: "2028-07-28" })];
    f.events = [row({ date: "2028-02-29", title: "Karkauspäivä" })];
    f.paydayDates = [row({ date: "2028-12-20" })];
    f.seasonOn = true;
    f.season = { label: "Lomakausi", start: "2028-06-01", end: "2028-08-15" };
    return f;
  };
  it("round-trips a full form", () => {
    const back = parseDraft(serializeDraft(full()), opts);
    expect(back).toMatchObject({ year: 2028, companyName: "Äänekosken Työläiset Oy", color: "#112233", layout: "month-page", paper: "A3", flagDays: true, paydayRule: "last", schoolCity: "Helsinki" });
    expect(back.closures[0]).toMatchObject({ label: "Kesäsulku", start: "2028-07-03", end: "2028-07-28" });
    expect(back.events[0]).toMatchObject({ date: "2028-02-29", title: "Karkauspäivä" });
    expect(back.closures[0].id).toBeTruthy();
    expect(validateCalendarConfig(formToConfigInput(back).input).issues).toEqual([]);
  });
  it("rejects anything that is not a draft of this version", () => {
    for (const bad of [null, undefined, "", "not json", "[]", '{"v":2,"form":{}}', '{"v":1}', '{"v":1,"form":5}', "x".repeat(DRAFT_MAX_CHARS + 1)]) {
      expect(parseDraft(bad, opts), String(bad).slice(0, 20)).toBeNull();
    }
  });
  it("sanitises every field of a tampered draft", () => {
    const evil = JSON.stringify({
      v: 1,
      form: {
        year: 1999,
        companyName: "x".repeat(500),
        color: "red",
        layout: "poster",
        paper: "B5",
        paydayRule: "weekly",
        paydayDay: "abc",
        closures: "nope",
        events: [null, 5, { date: 5, title: { a: 1 } }],
        logo: { dataUri: "data:image/svg+xml;utf8,<svg onload=alert(1)>" },
      },
    });
    const f = parseDraft(evil, opts);
    expect(f.year).toBe(2027);
    expect(f.companyName).toHaveLength(80);
    expect(f).toMatchObject({ color: "#1f7a5c", layout: "year-glance", paper: "A4", paydayRule: "none", paydayDay: 15, closures: [] });
    expect(f.events).toEqual([expect.objectContaining({ date: "", title: "" })]);
    expect(f.logo).toBeNull(); // not a base64 PNG or SVG data URI
  });
  it("keeps a valid PNG or SVG logo and rejects other types", () => {
    const keep = (dataUri) => parseDraft(JSON.stringify({ v: 1, form: { year: 2027, logo: { dataUri } } }), opts).logo;
    expect(keep("data:image/png;base64,iVBORw0KGgo=")).toEqual({ mime: "image/png", dataUri: "data:image/png;base64,iVBORw0KGgo=" });
    expect(keep("data:image/svg+xml;base64,PHN2Zy8+").mime).toBe("image/svg+xml");
    expect(keep("data:image/gif;base64,R0lGOD")).toBeNull();
    expect(keep("https://example.com/logo.png")).toBeNull();
  });
});

describe("messages for the visitor", () => {
  it("turns platform validation messages into Finnish", async () => {
    const { issueToFinnish } = await import("./formModel.js");
    expect(issueToFinnish("SVG logo must not contain scripts, event handlers or embedded frames.")).toMatch(/^SVG-logo ei saa/);
    expect(issueToFinnish("Logo is larger than 512 KB.")).toMatch(/512 kt/);
    expect(issueToFinnish("Logo must be a PNG, JPEG or SVG data URI (base64).")).toMatch(/PNG- tai SVG/);
    expect(issueToFinnish('School holiday data for "Atlantis" is not available for 2029.')).toBe("Koululomatietoja ei ole kaupungille Atlantis vuodelle 2029.");
    expect(issueToFinnish("Company name is longer than 80 characters.")).toMatch(/80 merkkiä/);
    expect(issueToFinnish("At most 500 company events are allowed.")).toMatch(/liikaa/);
    expect(issueToFinnish("something unexpected")).toBe("Kalenterin asetuksissa on virhe: something unexpected");
  });
  it("never shows an English message for any issue the form can produce", async () => {
    const { issueToFinnish } = await import("./formModel.js");
    const f = createForm(2029);
    f.schoolOn = true;
    f.schoolCity = "Helsinki";
    f.companyName = "x".repeat(81);
    const issues = validateCalendarConfig(formToConfigInput(f).input).issues;
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) expect(issueToFinnish(issue)).not.toMatch(/must|is not|longer|available/);
  });
});
