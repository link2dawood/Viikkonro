import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  LOGO_MIME_TYPES,
  MAX_COMPANY_NAME,
  contrastRatio,
  createBranding,
  normalizeHex,
  readableTextColor,
  validateBranding,
} from "./design/branding.js";
import { DEFAULT_THEME, THEMES, resolveTheme } from "./design/themes.js";
import { LAYOUTS, PAPER, resolveLayout } from "./design/layouts.js";
import { PRODUCTS, featuresFor, getProduct, productsByStatus } from "./business/products.js";
import { createLicense, hasFeature, isLicenseActive, licenseToJson } from "./business/licensing.js";
import { PLANNERS, getPlanner, plannerMode, plannerPath } from "./planners.js";
import { PLATFORM_EVENTS, platformEventCommands } from "./analytics.js";
import { DAY_RULES, countsAsDay, dayReason } from "../data/dayRules.js";
import { nonBankingReason } from "../data/paydayPages.js";
import { PLANNER_PATH } from "../data/vacationPlanner.js";
import { PROJECT_PATH } from "../data/projectTimeline.js";
import { SPRINT_PATH } from "../data/sprintPlanner.js";
import { routeMeta, sitemapEntries } from "../data/seo.js";
import * as platform from "./index.js";

const png = "data:image/png;base64,iVBORw0KGgo=";
const svg = (body) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`).toString("base64")}`;

describe("branding", () => {
  it("normalises colours and rejects non-hex values", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex(" #1F7A5C ")).toBe("#1f7a5c");
    for (const bad of ["red", "#12", "#12345", "1f7a5c", "", null, 7]) expect(normalizeHex(bad)).toBeNull();
  });
  it("creates branding with a trimmed name and optional parts", () => {
    const b = createBranding({ companyName: "  Oy Testi Ab ", primaryColor: "#1f7a5c", logo: { dataUri: png } });
    expect(b).toEqual({ companyName: "Oy Testi Ab", logo: { mime: "image/png", dataUri: png }, primaryColor: "#1f7a5c", accentColor: null });
    expect(createBranding({})).toEqual({ companyName: "", logo: null, primaryColor: null, accentColor: null });
  });
  it("rejects over-long names, bad colours and unsupported logos", () => {
    expect(validateBranding({ companyName: "x".repeat(MAX_COMPANY_NAME + 1) }).issues[0]).toMatch(/longer/);
    expect(validateBranding({ accentColor: "blue" }).issues[0]).toMatch(/accentColor/);
    expect(validateBranding({ logo: { dataUri: "data:image/gif;base64,AAAA" } }).issues[0]).toMatch(/PNG, JPEG or SVG/);
    expect(validateBranding({ logo: { dataUri: "https://example.com/logo.png" } }).issues[0]).toMatch(/data URI/);
    const huge = `data:image/png;base64,${"A".repeat(800 * 1024)}`;
    expect(validateBranding({ logo: { dataUri: huge } }).issues[0]).toMatch(/larger than/);
    expect(LOGO_MIME_TYPES).toContain("image/svg+xml");
    expect(() => createBranding({ primaryColor: "nope" })).toThrow(/primaryColor/);
  });
  it("accepts a plain SVG logo and rejects active content in one", () => {
    expect(validateBranding({ logo: { dataUri: svg('<rect width="4" height="4"/>') } }).issues).toEqual([]);
    for (const bad of ["<script>alert(1)</script>", '<rect onload="x()"/>', '<a href="javascript:x()"/>', "<foreignObject/>"]) {
      expect(validateBranding({ logo: { dataUri: svg(bad) } }).issues[0]).toMatch(/scripts, event handlers/);
    }
  });
  it("picks readable text and computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#ffffff")).toBe("#15211f");
    expect(readableTextColor("#1f7a5c")).toBe("#ffffff");
    expect(readableTextColor("#faf1e0")).toBe("#15211f");
  });
});

describe("themes", () => {
  it("keeps the classic theme equal to the existing calendar PDF palette", () => {
    // The palette hard-coded in prerender.js (PDF_COLORS).
    expect(THEMES.classic.colors).toMatchObject({
      ink: "#15211f",
      inkSoft: "#56655f",
      accent: "#1f7a5c",
      flag: "#e0a23b",
      line: "#d8ddd9",
      holidayTint: "#faf1e0",
      weekendText: "#b5473a",
    });
    expect(DEFAULT_THEME).toBe("classic");
  });
  it("gives every theme the same set of valid colours", () => {
    const keys = Object.keys(THEMES.classic.colors).sort();
    for (const theme of Object.values(THEMES)) {
      expect(Object.keys(theme.colors).sort()).toEqual(keys);
      for (const value of Object.values(theme.colors)) expect(normalizeHex(value)).toBe(value);
    }
  });
  it("layers company colours over the theme", () => {
    const branded = resolveTheme("classic", createBranding({ primaryColor: "#112233", accentColor: "#445566" }));
    expect(branded.colors).toMatchObject({ accent: "#112233", flag: "#445566", ink: "#15211f" });
    expect(resolveTheme("minimal").colors.accent).toBe("#3a3a3a");
    expect(() => resolveTheme("neon")).toThrow(/Unknown theme/);
  });
});

describe("layouts", () => {
  it("matches the existing A4 year calendar PDF geometry", () => {
    // From generateCalendarPdf() in prerender.js: 36 pt margins, 3 columns with
    // 8 pt gaps, grid top 96, rows 150 pt high.
    const l = resolveLayout();
    expect(l.page).toEqual({ width: 595.28, height: 841.89 });
    expect(l.content.width).toBeCloseTo(523.28, 5);
    expect(l.grid.columns).toBe(3);
    expect(l.grid.rows).toBe(4);
    expect(l.grid.top).toBe(96);
    expect(l.grid.cell.height).toBe(150);
    expect(l.grid.cell.width).toBeCloseTo((523.28 - 8 * 2) / 3, 5);
  });
  it("scales the grid for A3 and swaps the page for landscape", () => {
    const a3 = resolveLayout({ paper: "A3" });
    expect(a3.page.width).toBe(PAPER.A3.width);
    expect(a3.grid.cell.height).toBeGreaterThan(150);
    const month = resolveLayout({ id: "month-page" });
    expect(month.orientation).toBe("landscape");
    expect(month.page).toEqual({ width: 841.89, height: 595.28 });
    expect(month.grid.cell.width).toBeCloseTo(month.content.width, 5);
    expect(resolveLayout({ id: "year-glance", orientation: "landscape" }).page.width).toBe(841.89);
  });
  it("keeps the grid inside the page for every layout and paper", () => {
    for (const id of Object.keys(LAYOUTS)) {
      for (const paper of Object.keys(PAPER)) {
        const l = resolveLayout({ id, paper });
        expect(l.content.x + l.content.width).toBeLessThanOrEqual(l.page.width);
        expect(l.grid.top + l.grid.rows * l.grid.cell.height).toBeLessThanOrEqual(l.page.height);
      }
    }
  });
  it("rejects unknown layouts, paper and orientation", () => {
    expect(() => resolveLayout({ id: "poster" })).toThrow(/layout/);
    expect(() => resolveLayout({ paper: "B5" })).toThrow(/paper/);
    expect(() => resolveLayout({ orientation: "sideways" })).toThrow(/orientation/);
  });
});

describe("product catalogue and licensing", () => {
  it("lists the platform's products with the three live free planners", () => {
    expect(Object.keys(PRODUCTS)).toHaveLength(13);
    expect(productsByStatus("live").map((p) => p.id).sort()).toEqual(["project-planner", "sprint-planner", "vacation-planner"]);
    for (const p of Object.values(PRODUCTS)) {
      expect(p.id).toBe(Object.keys(PRODUCTS).find((k) => PRODUCTS[k] === p));
      expect(["free", "one-time", "subscription"]).toContain(p.pricing.model);
      expect(p.pricing.validated).toBe(false); // every price is a hypothesis until tested
      if (p.status === "live") expect(p.path).toMatch(/^\//);
    }
    expect(() => getProduct("teleporter")).toThrow(/Unknown product/);
  });
  it("points every live product at a real, indexable page", () => {
    const sitemap = new Set(sitemapEntries().map((e) => e.path));
    for (const p of productsByStatus("live")) {
      expect(routeMeta[p.path]).toBeDefined();
      expect(sitemap.has(p.path)).toBe(true);
    }
  });
  const license = createLicense({ productId: "company-calendar", tier: "paid", issuedOn: "2026-11-01", expiresOn: "2027-12-31", licensee: " Oy Testi " });
  it("creates a licence only for a paid tier of a known product", () => {
    expect(license).toMatchObject({ productId: "company-calendar", tier: "paid", licensee: "Oy Testi" });
    expect(() => createLicense({ productId: "nope", tier: "paid", issuedOn: "2026-01-01", expiresOn: "2026-02-01" })).toThrow(/Unknown product/);
    expect(() => createLicense({ productId: "company-calendar", tier: "free", issuedOn: "2026-01-01", expiresOn: "2026-02-01" })).toThrow(/not a paid tier/);
    expect(() => createLicense({ productId: "company-calendar", tier: "gold", issuedOn: "2026-01-01", expiresOn: "2026-02-01" })).toThrow(/not a paid tier/);
    expect(() => createLicense({ productId: "company-calendar", tier: "paid", issuedOn: "2026-02-01", expiresOn: "2026-01-01" })).toThrow(/before/);
    expect(() => createLicense({ productId: "company-calendar", tier: "paid", issuedOn: "bad", expiresOn: "2026-01-01" })).toThrow(/valid/);
  });
  it("is active from the issue day to the expiry day inclusive", () => {
    expect(isLicenseActive(license, "2026-10-31")).toBe(false);
    expect(isLicenseActive(license, "2026-11-01")).toBe(true);
    expect(isLicenseActive(license, new Date(2027, 11, 31, 18, 0))).toBe(true);
    expect(isLicenseActive(license, "2028-01-01")).toBe(false);
    expect(isLicenseActive(null, "2027-01-01")).toBe(false);
  });
  it("unlocks paid features only with an active licence of the same product", () => {
    expect(featuresFor("company-calendar", "free")).toContain("preview");
    expect(hasFeature("company-calendar", "preview", null, "2027-01-01")).toBe(true);
    expect(hasFeature("company-calendar", "logo", null, "2027-01-01")).toBe(false);
    expect(hasFeature("company-calendar", "logo", license, "2027-01-01")).toBe(true);
    expect(hasFeature("company-calendar", "logo", license, "2029-01-01")).toBe(false); // expired
    expect(hasFeature("company-calendar", "made-up", license, "2027-01-01")).toBe(false);
    const other = createLicense({ productId: "company-calendar", tier: "paid", issuedOn: "2026-11-01", expiresOn: "2027-12-31" });
    expect(hasFeature("excel-templates", "logo", other, "2027-01-01")).toBe(false);
  });
  it("serialises a licence to plain JSON", () => {
    expect(licenseToJson(license)).toEqual({ productId: "company-calendar", tier: "paid", issuedOn: "2026-11-01", expiresOn: "2027-12-31", licensee: "Oy Testi" });
  });
});

describe("planner registry", () => {
  it("names a real day rule for every planner", () => {
    for (const p of Object.values(PLANNERS)) expect(DAY_RULES[p.mode]).toBeDefined();
    expect(plannerMode("vacation")).toBe("FINLAND_PLANNER");
    expect(plannerMode("sprint")).toBe("FINLAND_SPRINT");
    expect(plannerMode("leave")).toBe("FINLAND_STATUTORY_LEAVE");
    expect(() => getPlanner("teleport")).toThrow(/Unknown planner/);
  });
  it("is the single source of the planner URLs the data modules export", () => {
    expect(PLANNER_PATH).toBe(plannerPath("vacation"));
    expect(PROJECT_PATH).toBe(plannerPath("project"));
    expect(SPRINT_PATH).toBe(plannerPath("sprint"));
    const sitemap = new Set(sitemapEntries().map((e) => e.path));
    for (const p of Object.values(PLANNERS).filter((x) => x.path)) {
      expect(routeMeta[p.path]).toBeDefined();
      expect(sitemap.has(p.path)).toBe(true);
    }
  });
  it("uses the same analytics type as the page's page-type tag", () => {
    expect(Object.values(PLANNERS).every((p) => /^[a-z]+$/.test(p.analyticsType))).toBe(true);
  });
});

describe("platform analytics events", () => {
  it("sends coarse tags and a total plus a per-product event", () => {
    expect(platformEventCommands("export_download", { product: "company-calendar", export_type: "xlsx", year: 2027, size: 12 })).toEqual([
      ["set", "pf_product", "company-calendar"],
      ["set", "pf_export_type", "xlsx"],
      ["set", "pf_year", "2027"],
      ["set", "pf_size", "12"],
      ["event", "export_download"],
      ["event", "export_download_company-calendar"],
    ]);
  });
  it("never sends full dates, free text or unlisted keys", () => {
    const commands = platformEventCommands("cta_click", {
      source: "2027-03-22",
      companyName: "Oy Testi Ab",
      title: "secret",
      tier: "paid",
    });
    expect(JSON.stringify(commands)).not.toMatch(/2027-03-22|Oy Testi|secret/);
    expect(commands).toEqual([["set", "pf_tier", "paid"], ["event", "cta_click"]]);
  });
  it("accepts only known event names", () => {
    expect(PLATFORM_EVENTS).toContain("purchase");
    expect(() => platformEventCommands("page_view_2")).toThrow(/Unknown platform event/);
    expect(platformEventCommands("purchase")).toEqual([["event", "purchase"]]);
  });
});

describe("shared day rules", () => {
  it("makes banking days the same set as planner days off, for five years", () => {
    for (let d = new Date(2026, 0, 1); d < new Date(2031, 0, 1); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      expect(dayReason("FINLAND_BANKING", d)).toBe(dayReason("FINLAND_PLANNER", d));
      expect(nonBankingReason(d)).toBe(dayReason("FINLAND_BANKING", d));
    }
  });
  it("treats Christmas Eve as a non-banking day but a working day", () => {
    const eve = new Date(2026, 11, 24);
    expect(countsAsDay("FINLAND_BANKING", eve)).toBe(false);
    expect(countsAsDay("FINLAND_WORKDAY", eve)).toBe(true);
  });
});

describe("platform barrel", () => {
  it("exposes the foundation from one import", () => {
    for (const name of [
      "createCalendarConfig",
      "buildCalendarModel",
      "createEvent",
      "createPeriod",
      "finnishCalendarEvents",
      "createBranding",
      "resolveTheme",
      "resolveLayout",
      "buildIcs",
      "toCsv",
      "buildXlsx",
      "calendarToCsv",
      "calendarToXlsx",
      "calendarToIcs",
      "PRODUCTS",
      "createLicense",
      "PLANNERS",
      "platformEventCommands",
      "DAY_RULES",
      "dayReason",
    ]) {
      expect(platform[name], name).toBeDefined();
    }
  });
});
