import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { TEMPLATES } from "../src/platform/templates/catalog.js";
import { buildTemplateWorkbook, templateToCsv, templateToXlsx } from "../src/platform/templates/workbook.js";
import { renderTemplatePdf } from "../src/platform/templates/pdf.js";

export async function buildTemplates(distDir) {
  let count = 0;
  for (const template of TEMPLATES) {
    // Fail closed: paid assets must stay out of the public static build.
    if (template.price.amount !== 0) continue;
    for (const year of template.yearApplicability.years) {
      const workbook = buildTemplateWorkbook(template, year);
      const outputs = { xlsx: templateToXlsx(workbook), csv: templateToCsv(workbook), pdf: (await renderTemplatePdf(workbook, { PDFDocument })).bytes };
      for (const asset of template.downloadableAssets.filter((asset) => asset.year === year)) {
        const filename = path.join(distDir, asset.path.slice(1));
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        fs.writeFileSync(filename, outputs[asset.format]);
        count += 1;
      }
    }
  }
  console.log(`generated ${count} template assets (dist/pohjat)`);
}
