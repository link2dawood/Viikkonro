import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { describe, expect, it } from "vitest";
import { TEMPLATE_CATEGORIES, TEMPLATE_YEARS, TEMPLATES, templateBySlug, templateAssetPath, templatePath, filterTemplates } from "./catalog.js";
import { buildTemplateWorkbook, templateToCsv, templateToXlsx, templateCellText } from "./workbook.js";
import { staticTemplateProvider } from "./access.js";
import { renderTemplatePdf } from "./pdf.js";
import { templateNodes } from "./schema.js";
import { dayKey } from "../calendar/events.js";
import { summarizeDayRange } from "../../data/dayRules.js";
import { platformEventCommands } from "../analytics.js";
import { metaFor, sitemapEntries, templatePdfPath } from "../../data/seo.js";

describe("template catalogue and access", () => {
  it("has six distinct, substantive templates with complete asset manifests", () => {
    expect(new Set(TEMPLATES.map((t) => t.slug)).size).toBe(6);
    expect(new Set(TEMPLATES.map((t) => t.category))).toEqual(new Set(TEMPLATE_CATEGORIES.map((c) => c.id)));
    for (const template of TEMPLATES) {
      expect(template.name).toBeTruthy(); expect(template.finnishName).toBeTruthy();
      expect(template.description.length).toBeGreaterThan(100);
      expect(template.includes).toHaveLength(3); expect(template.steps).toHaveLength(3);
      expect(template.price).toEqual({ amount: 0, currency: "EUR" });
      expect(template.downloadableAssets).toHaveLength(9);
      expect(template.seo.description.length).toBeLessThanOrEqual(160);
      expect(template.seo.title.length).toBeLessThanOrEqual(60);
      expect(templateBySlug(template.slug)).toBe(template);
      expect(metaFor(templatePath(template)).title).toBe(template.seo.title);
      expect(sitemapEntries(2026).some((entry) => entry.path === templatePath(template))).toBe(true);
      for (const year of TEMPLATE_YEARS) expect(templatePdfPath(template, year)).toBe(templateAssetPath(template, year, "pdf"));
    }
    expect(templateBySlug("unknown")).toBeNull();
    expect(() => templateAssetPath(TEMPLATES[0], 2029, "pdf")).toThrow();
    expect(() => templateAssetPath({ slug: "../escape" }, 2027, "pdf")).toThrow();
    expect(() => templateAssetPath(TEMPLATES[0], 2027, "ics")).toThrow();
  });
  it("filters categories and formats without creating extra indexable pages", () => {
    expect(filterTemplates({ category: "vacation" }).map((t) => t.id)).toEqual(["vacation"]);
    expect(filterTemplates({ format: "pdf" })).toHaveLength(6);
    expect(filterTemplates({ format: "ics" })).toEqual([]);
    expect(filterTemplates({ category: "missing" })).toEqual([]);
  });
  it("grants only declared free assets and fails closed for future paid records", async () => {
    const request = { template: TEMPLATES[0], year: 2027, format: "xlsx" };
    expect((await staticTemplateProvider.resolveDownload(request)).status).toBe("granted");
    expect((await staticTemplateProvider.resolveDownload({ ...request, year: 2030 })).status).toBe("unavailable");
    expect((await staticTemplateProvider.resolveDownload({ ...request, format: "__proto__" })).status).toBe("unavailable");
    expect((await staticTemplateProvider.resolveDownload({ ...request, template: { ...TEMPLATES[0], price: { amount: 9, currency: "EUR" } } })).status).toBe("unavailable");
  });
  it("links real catalogue, template and download entities in schema", () => {
    const siteUrl = "https://viikkonro.fi";
    const pageNode = (url, type, extra) => ({ "@type": type, "@id": `${siteUrl}${url}#webpage`, ...extra });
    const catalog = templateNodes("/kalenteripohjat", { siteUrl, pageNode })[0];
    expect(catalog["@type"]).toBe("CollectionPage"); expect(catalog.mainEntity.numberOfItems).toBe(6);
    for (const template of TEMPLATES) {
      const [page, work] = templateNodes(templatePath(template), { siteUrl, pageNode });
      expect(page.associatedMedia).toHaveLength(9); expect(page.potentialAction).toHaveLength(9);
      expect(page.mainEntity["@id"]).toBe(work["@id"]);
      expect(page.associatedMedia.every((media) => template.downloadableAssets.some((asset) => media.contentUrl === siteUrl + asset.path))).toBe(true);
    }
    expect(templateNodes("/kalenteripohjat/unknown", { siteUrl, pageNode })).toEqual([]);
  });
  it("accepts all four requested analytics events without sending unknown fields", () => {
    for (const name of ["template_view", "template_preview", "template_cta", "template_download"]) {
      const commands = platformEventCommands(name, { source: "project", year: 2027, export_type: "xlsx", companyName: "Salainen Oy", logo: "secret" });
      expect(commands).toContainEqual(["event", name]);
      expect(JSON.stringify(commands)).not.toMatch(/Salainen|secret|companyName|logo/);
    }
  });
});

describe.each(TEMPLATE_YEARS)("planning template data %i", (year) => {
  it.each(TEMPLATES)("$id covers the entire year and has editable fields", (template) => {
    const workbook = buildTemplateWorkbook(template, year);
    const daily = workbook.sheets[2].rows;
    expect(daily).toHaveLength(year === 2028 ? 366 : 365);
    expect(dayKey(daily[0][0])).toBe(`${year}-01-01`);
    expect(dayKey(daily.at(-1)[0])).toBe(`${year}-12-31`);
    expect(new Set(daily.map((row) => dayKey(row[0]))).size).toBe(daily.length);
    if (year === 2028) expect(daily.some((row) => dayKey(row[0]) === "2028-02-29")).toBe(true);
    expect(daily.find((row) => dayKey(row[0]) === `${year}-12-06`)[4]).toContain("Itsenäisyyspäivä");
    expect(workbook.main.rows.every((row) => row.length === workbook.main.columns.length)).toBe(true);
    expect(workbook.main.rows.every((row) => row.at(-1) === "")).toBe(true);
    expect(templateToCsv(workbook).startsWith("\uFEFF")).toBe(true);
    expect(Buffer.from(templateToXlsx(workbook)).subarray(0, 2).toString()).toBe("PK");
  });
});

describe("date rules and portable files", () => {
  it("allows multiple catalogue records in a category without coupling ids to the engine", () => {
    const original = TEMPLATES.find((template) => template.category === "project");
    const variant = { ...original, id: "project-team", slug: "projektin-tiimipohja" };
    expect(buildTemplateWorkbook(variant, 2027).main.rows).toEqual(buildTemplateWorkbook(original, 2027).main.rows);
  });
  it("preserves ISO week-year boundaries and counts only in-year working days", () => {
    const company = buildTemplateWorkbook(TEMPLATES[0], 2027);
    expect(company.main.rows[0].slice(2, 4)).toEqual([53, 2026]);
    const project = buildTemplateWorkbook(TEMPLATES.find((t) => t.id === "project"), 2027);
    expect(project.main.rows[0].slice(0, 2)).toEqual([53, 2026]);
    expect(dayKey(project.main.rows[0][2])).toBe("2026-12-28");
    expect(project.main.rows.reduce((count, row) => count + row[4], 0)).toBe(summarizeDayRange("FINLAND_WORKDAY", new Date(2027, 0, 1), new Date(2027, 11, 31)).counted);
    expect(() => buildTemplateWorkbook(TEMPLATES[0], 2029)).toThrow();
  });
  it("keeps formula-like planning text safe in CSV and actual XML workbook cells", () => {
    const workbook = buildTemplateWorkbook(TEMPLATES[0], 2028);
    workbook.main.rows[0][5] = "=HYPERLINK(\"https://example.invalid\")";
    expect(templateToCsv(workbook)).toContain("'=HYPERLINK");
    const data = Buffer.from(templateToXlsx(workbook)).toString("utf8");
    expect(data).toContain("=HYPERLINK(&quot;https://example.invalid&quot;)");
    expect(data).not.toContain("<f>");
    expect(data).toContain("Ohjeet"); expect(data).toContain("Päivämääräviite");
    expect(data).toContain('state="frozen"');
    expect(templateCellText(new Date(2028, 1, 29))).toBe("2028-02-29");
  });
});

const hasPdfText = spawnSync("pdftotext", ["-v"]).status === 0;
describe("printable template artifacts", () => {
  it.each(TEMPLATES)("$id produces valid A4 PDFs with bounded page counts", async (template) => {
    for (const year of TEMPLATE_YEARS) {
      const result = await renderTemplatePdf(buildTemplateWorkbook(template, year), { PDFDocument });
      const pdf = Buffer.from(result.bytes).toString("latin1");
      expect(pdf.startsWith("%PDF-")).toBe(true); expect(pdf).toContain("%%EOF");
      expect(result.pages).toBeGreaterThan(0); expect(result.pages).toBeLessThanOrEqual(14);
      expect(pdf).toMatch(/\/MediaBox \[0 0 (?:841\.89 595\.28|595\.28 841\.89)\]/);
      expect(result.warnings).toEqual([]);
    }
  });
  it.skipIf(!hasPdfText)("extracts Finnish characters and every shift date from the leap-year PDF", async () => {
    const dir = mkdtempSync(join(tmpdir(), "viikkonro-template-"));
    try {
      const template = TEMPLATES.find((t) => t.id === "shifts");
      const workbook = buildTemplateWorkbook(template, 2028);
      const pdf = await renderTemplatePdf(workbook, { PDFDocument });
      const file = join(dir, "shifts.pdf"); writeFileSync(file, pdf.bytes);
      const result = spawnSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Työvuorojen suunnittelupohja");
      expect(result.stdout).toContain("Yövuoro");
      for (const row of workbook.main.rows) expect(result.stdout).toContain(dayKey(row[0]));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
