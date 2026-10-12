import { renderCalendarPdf } from "../render/pdf.js";
import { pdfSafe, wrapText } from "../render/text.js";
import { dmy } from "../../data/planningDates.js";
import { toDate } from "../calendar/events.js";

// A calendar followed by a complete, paginated report, including long notes.
export function renderVacationPdf(model, options) {
  return renderCalendarPdf(model.calendar, { ...options, appendPages: (doc, preceding) => {
    let pages = 0, y = 78;
    const width = 523;
    const page = () => {
      doc.addPage({ size: "A4", margin: 0 }); pages += 1; y = 78;
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#15211f").text(`Lomasuunnitelma Pro ${model.config.year}`, 36, 32, { width });
      doc.font("Helvetica").fontSize(8).text(`Viikkonro.fi | Suunnitelman tiedot | Sivu ${preceding + pages}`, 36, 810, { width, lineBreak: false });
    };
    const paragraph = (value, bold = false) => {
      const font = bold ? "Helvetica-Bold" : "Helvetica";
      const safe = pdfSafe(value);
      for (const line of wrapText(doc, safe.text, width, 1000, { font, size: 10 })) {
        if (y + 14 > 780) page();
        doc.font(font).fontSize(10).fillColor("#15211f").text(line, 36, y, { width, lineBreak: false });
        y += 14;
      }
      y += 8;
    };
    page();
    paragraph("Laskentatavat ja vuosiyhteenveto", true);
    paragraph(model.disclosure);
    paragraph(`Työpäivät ja käytettävyys: ${model.workDisclosure}`);
    paragraph("Sulkupäivät vähentävät työpäiviä. Lakisääteisessä laskennassa sulku ei automaattisesti vähennä loman kulutusta. Muut poissaolot eivät kuluta lomapäiviä tässä suunnitelmassa.");
    paragraph("Vuosiyhteenveto laskee vain valitun vuoden päivät kerran. Jaksojen alla on koko jakson laskenta; päällekkäisiä rivejä ei pidä summata.");
    for (const person of model.summaries) {
      paragraph(`${person.label}: loman laskentapäiviä ${person.vacationDays}, muun poissaolon työpäiviä ${person.absenceDays}, käytettävissä ${person.availableDays} työpäivää. Päällekkäisiä kalenteripäiviä ${person.overlapDays}.`, true);
    }
    if (model.config.notes) { paragraph("Suunnitelman huomautus", true); paragraph(model.config.notes); }
    paragraph("Loma- ja poissaolojaksot", true);
    for (const period of model.periods) {
      paragraph(`${period.person}: ${period.label} (${period.type === "vacation" ? "loma" : "muu poissaolo"}), ${dmy(toDate(period.start))}-${dmy(toDate(period.end))}. Koko jakson laskentapäiviä ${period.counted}.`, true);
      if (period.note) paragraph(period.note);
    }
    paragraph("Yrityksen sulkupäivät", true);
    for (const period of model.config.closures) {
      paragraph(`${period.label}, ${dmy(toDate(period.start))}-${dmy(toDate(period.end))}.`, true);
      if (period.note) paragraph(period.note);
    }
    return pages;
  } });
}

export async function exportVacationPdf(model) {
  const pdfkit = await import("pdfkit/js/pdfkit.standalone.js");
  return renderVacationPdf(model, { PDFDocument: pdfkit.default ?? pdfkit });
}
