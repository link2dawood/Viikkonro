import { renderCalendarPdf } from "../render/pdf.js";
import { pdfSafe, wrapText } from "../render/text.js";
import { templateCellText } from "./workbook.js";

// Planning sheets need writable table cells rather than calendar day boxes.
// Reuse the established calendar PDF for the year-at-a-glance template.
export async function renderTemplatePdf(workbook, { PDFDocument, compress = true }) {
  if (workbook.template.category === "company") return renderCalendarPdf(workbook.model, { PDFDocument, compress });
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, autoFirstPage: false, compress,
    info: { Title: workbook.title ?? `${workbook.template.finnishName} ${workbook.year}`, Author: "Viikkonro.fi" } });
  const chunks = [];
  const finished = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => {
      const bytes = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      resolve(bytes);
    });
  });
  const margin = 24;
  const width = 841.89 - margin * 2;
  let pages = 0;
  const text = (value, x, y, w, size = 8, lines = 3, bold = false) => {
    const font = bold ? "Helvetica-Bold" : "Helvetica";
    const wrapped = wrapText(doc, pdfSafe(value).text, w - 8, lines, { font, size });
    doc.font(font).fontSize(size).fillColor("#182b37");
    wrapped.forEach((line, i) => doc.text(line, x + 4, y + 4 + i * (size + 2), { width: w - 8, lineBreak: false }));
  };
  const page = (subtitle) => {
    doc.addPage(); pages += 1;
    text(workbook.title ?? `${workbook.template.finnishName} ${workbook.year}`, margin, 16, width, workbook.title ? 12 : 17, workbook.title ? 2 : 1, true);
    text(subtitle, margin, 46, width, 9, 2);
    text(`Viikkonro.fi | ISO 8601 | ${pages}`, margin, 565, width, 8, 1);
  };
  page(workbook.instructionTitle ?? "Täyttöohjeet ja käyttöoikeus");
  let instructionY = 82;
  for (const instruction of workbook.instructions) {
    const lines = wrapText(doc, pdfSafe(instruction).text, width - 8, 20, { font: "Helvetica", size: 10 });
    const height = lines.length * 14 + 12;
    if (instructionY + height > 548) { page(workbook.instructionTitle ? `${workbook.instructionTitle} (jatkuu)` : "Täyttöohjeet (jatkuu)"); instructionY = 82; }
    text(instruction, margin, instructionY, width, 10, 20);
    instructionY += height;
  }
  const { columns, rows } = workbook.main;
  const sizes = columns.map((column) => column.header.includes("Pyhä") ? 1.9 : column.header.includes("ISO") ? 0.65 : column.header.includes("Työpäiviä") ? 0.75 : 1.15);
  const total = sizes.reduce((sum, value) => sum + value, 0);
  const widths = sizes.map((value) => width * value / total);
  // Daily shift pages are grouped by calendar month, with every date present.
  const groups = workbook.groups ?? (workbook.template.category === "shifts"
    ? workbook.model.months.map((month) => ({ subtitle: month.name, rows: rows.filter((row) => row[0].getMonth() === month.index) }))
    : [{ subtitle: workbook.subtitle ?? "Viikkosuunnitelma. Työpäivät koskevat vain valittua kalenterivuotta.", rows }]);
  for (const group of groups) {
    const rowHeight = workbook.template.category === "shifts" ? 13.6 : 38;
    let y;
    const begin = () => {
      page(group.subtitle);
      let x = margin;
      doc.rect(margin, 80, width, 38).fill("#e4edf2");
      columns.forEach((column, i) => { text(column.header === "ISO-viikkovuosi" ? "ISO viikon vuosi" : column.header.replace("ISO-viikko", "ISO viikko"), x, 80, widths[i], 7, 3, true); x += widths[i]; });
      y = 118;
    };
    begin();
    for (const row of group.rows) {
      if (y + rowHeight > 548) begin();
      let x = margin;
      row.forEach((value, i) => {
        doc.lineWidth(0.4).strokeColor("#acbac3").rect(x, y, widths[i], rowHeight).stroke();
        text(templateCellText(value), x, y - (rowHeight < 20 ? 1 : 0), widths[i], 6.5, rowHeight < 20 ? 1 : 3);
        x += widths[i];
      });
      y += rowHeight;
    }
  }
  doc.end();
  return { bytes: await finished, pages, warnings: [] };
}
