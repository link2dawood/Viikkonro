// Browser PDF export: loads pdfkit's standalone build and the renderer on
// demand, so the 2 MB library is downloaded only when someone presses
// "Lataa PDF", never with a page. SVG logos are drawn to PNG here, on the
// visitor's device.
import { prepareLogoForPdf, rasterizeSvgToPng } from "./logo.js";

/** @returns {Promise<{bytes: Uint8Array, pages: number, warnings: string[]}>} */
export async function exportCalendarPdf(model, { logo = null, generatedOn = new Date() } = {}) {
  const [pdfkit, { renderCalendarPdf }] = await Promise.all([
    import("pdfkit/js/pdfkit.standalone.js"),
    import("./pdf.js"),
  ]);
  const PDFDocument = pdfkit.default ?? pdfkit;
  const prepared = await prepareLogoForPdf(logo, rasterizeSvgToPng);
  const result = await renderCalendarPdf(model, { PDFDocument, logo: prepared.src, generatedOn });
  if (prepared.warning) result.warnings.push(prepared.warning);
  return result;
}
