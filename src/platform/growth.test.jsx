import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import GrowthCTA from "../components/GrowthCTA.jsx";
import { PRODUCTS } from "./business/products.js";
import { createGrowthTracker, growthCommands, growthIntent, productStage } from "./growth.js";

const surfaces = [
  ["/kalenteri-2027", "company-calendar"], ["/kalenteri-2027-alkuvuosi", "company-calendar"],
  ["/tulostettava-kalenteri-2027", "company-calendar"], ["/tulosta-2027", "company-calendar"],
  ["/vuosi-2027", "company-calendar"], ["/tyopaivat-2027", "project-planner"],
  ["/pyhapaivat-2027", "hr-payroll-calendar"], ["/palkkapaivat-2027", "hr-payroll-calendar"],
  ["/viikko-1-2027", "company-calendar"], ["/lomasuunnittelija", "team-leave-planner"],
  ["/projektiaikataulu", "project-planner"], ["/sprinttisuunnittelija", "sprint-planner"],
];

describe("contextual growth surfaces", () => {
  it.each(surfaces)("prerenders a useful, existing product link on %s", (path, product) => {
    const intent = growthIntent(path);
    expect(intent.product).toBe(product);
    expect(PRODUCTS[product]).toBeDefined();
    if (!intent.href.startsWith("#")) expect(intent.href).toBe(PRODUCTS[product].path);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><GrowthCTA inline /></MemoryRouter>);
    expect(html).toContain(`href="${intent.href}"`);
    expect(html).toContain(intent.title);
    expect(html).toContain("noprint");
    expect(html).not.toContain("dialog");
  });
  it.each(["/tiimin-lomat/suunnittelu", "/en", "/raskauslaskuri", "/kalenteri-9999", "__proto__", "/viikko-53-2027", "/vuosi-2027-alkuvuosi", "/api/v1/calendar", "/embed/v1", "/missing"])("does not promote on private, invalid or unrelated route %s", (path) => {
    expect(growthIntent(path)).toBeNull();
    expect(renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><GrowthCTA /></MemoryRouter>)).toBe("");
  });
  it("places planner CTAs inline rather than twice in the shared shell", () => {
    expect(renderToStaticMarkup(<MemoryRouter initialEntries={["/projektiaikataulu"]}><GrowthCTA /></MemoryRouter>)).toBe("");
  });
  it("ignores URL queries rather than sending them to analytics", () => {
    expect(growthIntent("/kalenteri-2027?name=private")).toBeNull();
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={["/kalenteri-2027?name=private"]}><GrowthCTA /></MemoryRouter>);
    expect(html).toContain("href=\"/yrityskalenteri\"");
    expect(html).not.toContain("private");
  });
});

describe("privacy-safe public funnel", () => {
  it("attributes a company preview/export to the original public page family", () => {
    const commands = [], tracker = createGrowthTracker((...args) => commands.push(args));
    tracker.page("/tulosta-2027");
    tracker.cta(growthIntent("/tulosta-2027"));
    tracker.page("/yrityskalenteri");
    tracker.event("company_calendar_started", { companyName: "Salainen Oy", logo: "data:image/png;base64,SECRET" });
    tracker.event("company_calendar_preview", { title: "Salainen tapahtuma" });
    tracker.event("company_calendar_export_attempt");
    tracker.event("company_calendar_pdf_export");
    expect(commands.filter(([kind, value]) => kind === "event" && /^growth_(landing|cta|start|preview|export)$/.test(value)).map(([, value]) => value)).toEqual(["growth_landing", "growth_cta", "growth_start", "growth_preview", "growth_export"]);
    expect(commands).toContainEqual(["event", "growth_export_company-calendar"]);
    expect(commands.filter(([, key]) => key === "growth_source").every(([, , value]) => value === "tulosta")).toBe(true);
    expect(JSON.stringify(commands)).not.toMatch(/Salainen|SECRET|2027|logo|companyName/);
  });
  it("does not count attempts, development unlocks, redirects or unverified purchases as successful purchases", () => {
    for (const name of ["purchase", "checkout_start", "company_calendar_export_attempt", "company_calendar_cta_click", "company_ics_export"]) {
      expect(productStage(name, { tier: "paid", source: "unlock" }, "/yrityskalenteri")).toBeNull();
    }
    expect(growthCommands("purchase", "company-calendar", "calendar")).toEqual([]);
  });
  it("uses catalogue product IDs and never accepts caller-supplied personal tags", () => {
    expect(productStage("planning_suite_export", { source: "private project" })).toBeNull();
    expect(productStage("planning_suite_export", { source: "sprint" })).toEqual({ product: "sprint-planner", stage: "export" });
    expect(productStage("template_download", { source: "Private company" })).toEqual({ product: "excel-templates", stage: "export" });
    expect(productStage("company_calendar_ics_export", {}, "/yrityskalenteri/ics").product).toBe("company-ics");
    expect(growthCommands("cta", "Private company", "calendar")).toEqual([]);
    expect(growthCommands("start", "company-calendar", "Private company")).toEqual([]);
    expect(growthCommands("start", "company-calendar", "__proto__")).toEqual([]);
  });
  it("excludes private calendars from all funnel events", () => {
    expect(productStage("company_calendar_pdf_export", {}, "/tiimin-lomat/suunnittelu")).toBeNull();
  });
  it("deduplicates repeated previews and counts repeat use only after a completed export", () => {
    const events = [], tracker = createGrowthTracker((kind, value) => { if (kind === "event") events.push(value); });
    tracker.page("/hr-kalenteri");
    tracker.event("hr_calendar_started"); tracker.event("hr_calendar_preview"); tracker.event("hr_calendar_preview");
    tracker.page("/palkkapaivat-2027"); tracker.page("/hr-kalenteri"); tracker.event("hr_calendar_started");
    expect(events).not.toContain("growth_repeat");
    tracker.event("hr_calendar_export");
    tracker.page("/palkkapaivat-2027"); tracker.page("/hr-kalenteri"); tracker.event("hr_calendar_started");
    expect(events.filter((event) => event === "growth_repeat")).toHaveLength(1);
    expect(events.filter((event) => event === "growth_preview")).toHaveLength(1);
  });
});
