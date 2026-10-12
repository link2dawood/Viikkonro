import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel, weekList } from "../calendar/model.js";
import { WD } from "../../components/dateUtils.js";
import { buildXlsx } from "../export/xlsx.js";
import { toCsv } from "../export/csv.js";
import { dayKey } from "../calendar/events.js";

const fields = {
  company: ["Sulkupäivä", "Tapahtuma", "Muistiinpanot"],
  vacation: ["Lomalaiset", "Sijaiset", "Henkilöstöä käytettävissä", "Huomio"],
  project: ["Tehtävä", "Vastuu", "Välitavoite", "Tilanne"],
  shifts: ["Aamuvuoro", "Iltavuoro", "Yövuoro", "Huomio"],
  construction: ["Työvaihe", "Urakoitsija", "Edeltävä työ", "Toimitukset", "Tarkastus", "Riski"],
  hr: ["Oma palkkapäivä", "Aineiston määräpäivä", "HR-tehtävä", "Vastuu", "Tilanne"],
};

// Dates and ISO week-years remain explicit in every output, including CSV.
export const templateCellText = (value) => value instanceof Date ? dayKey(value) : String(value ?? "");

export function buildTemplateWorkbook(template, year) {
  if (!template.yearApplicability.years.includes(year)) throw new Error("Year not available for this template.");
  const mode = ["project", "construction", "hr"].includes(template.category) ? "FINLAND_WORKDAY" : "FINLAND_PLANNER";
  const model = buildCalendarModel(createCalendarConfig({ year, dayRuleMode: mode, include: { holidays: true }, layout: "year-glance", branding: template.category === "company" ? { companyName: template.finnishName } : {} }));
  const weeks = weekList(model);
  const isDaily = ["company", "shifts"].includes(template.category);
  const headers = isDaily
    ? ["Päivämäärä", "Viikonpäivä", "ISO-viikko", "ISO-viikkovuosi", "Pyhäpäivä", ...fields[template.category]]
    : ["ISO-viikko", "ISO-viikkovuosi", "Alkaa (ma)", "Päättyy (su)", `Työpäiviä ${year}`, "Pyhäpäivät", ...fields[template.category]];
  const dailyWithIsoYear = model.months.flatMap((month) => month.rows.flatMap((week) => week.days.filter(Boolean).map((day) => [
    day.date, WD[day.date.getDay()], week.week, week.weekYear,
    day.events.filter((event) => event.kind === "holiday").map((event) => event.title).join("; "),
  ])));
  const base = isDaily ? dailyWithIsoYear : weeks.map((week) => [
    week.week, week.weekYear, week.from, week.to, week.workingDays,
    week.events.filter((event) => event.kind === "holiday").map((event) => event.text).join("; "),
  ]);
  const main = { name: "Suunnitelma", columns: headers.map((header, i) => ({ header, width: i < (isDaily ? 5 : 6) ? (header.includes("Pyhä") ? 40 : 17) : 26 })), rows: base.map((row) => [...row, ...fields[template.category].map(() => "")]), freezeHeader: true };
  const instructions = [template.description, ...template.steps, template.limitation,
    "Täytä tyhjät suunnittelusarakkeet. Päivämäärät ja pyhäpäivät ovat valmiita viitetietoja.",
    "Pyhäpäiväsarakkeessa näkyvät myös joulu- ja juhannusaatto. Ne eivät ole virallisia pyhäpäiviä. Tarkista omat aattovapaasi organisaation käytännöistä.",
    "ISO-viikkovuosi voi poiketa kalenterivuodesta. Viikkorivien päivämääräväli sisältää myös naapurivuoden päiviä; työpäivien määrä koskee vain valittua kalenterivuotta.",
    "CSV sisältää vain Suunnitelma-taulukon. Erotin on puolipiste ja merkistö UTF-8. Excel-pohjan kaikki välilehdet voi tuoda Google Sheetsiin.",
    "PDF on alkuperäisen pohjan tuloste. Muokattu Excel-taulukko tulostetaan Excelistä tai Google Sheetsistä.",
    "Käyttöoikeus: omaan ja organisaation sisäiseen käyttöön. Täytetyn suunnitelman voi jakaa omalle tiimille. Pohjaa ei saa myydä edelleen."];
  return { template, year, model, main, instructions, sheets: [
    { name: "Ohjeet", columns: [{ header: `${template.finnishName} ${year}`, width: 110 }], rows: instructions.map((line) => [line]), freezeHeader: true },
    main,
    { name: "Päivämääräviite", columns: ["Päivämäärä", "Viikonpäivä", "ISO-viikko", "ISO-viikkovuosi", "Pyhäpäivä"].map((header) => ({ header, width: 24 })), rows: dailyWithIsoYear, freezeHeader: true },
  ] };
}

export const templateToXlsx = (workbook) => buildXlsx({ sheets: workbook.sheets });
export const templateToCsv = (workbook) => toCsv([
  workbook.main.columns.map((column) => column.header),
  ...workbook.main.rows.map((row) => row.map(templateCellText)),
], { delimiter: ";", eol: "\r\n", bom: true, escapeFormulas: true });
