import { addDays, parseIsoDate, toIsoDate } from "../../data/planningDates.js";
import { holidaysInYear } from "../../data/holidays.js";
import { isoWeek, isoYear } from "../../components/dateUtils.js";
import { createEvent } from "../calendar/events.js";
import { createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
import { HR_TOOLKIT_SOURCES } from "../../data/hrToolkit.js";
export const TOOLKIT_CLASSIFICATIONS = Object.freeze({ statutory: "Lähteistetty lakimuistutus", recommended: "Mallisuositus", configurable: "Yrityksen määrittämä päivä" });
export const TOOLKIT_TEMPLATES = Object.freeze({
  payroll: { name: "Palkanlaskennan valmisteluaikataulu", source: HR_TOOLKIT_SOURCES.model, rows: [
    { id: "collect", offset: -7, label: "Palkka-aineiston keruu", explanation: "Sovi tarvittavat tiedot ja palautuspäivä palkkapalvelun kanssa." },
    { id: "check", offset: -3, label: "Aineiston tarkistus", explanation: "Tarkista aineiston puutteet ennen sovittua käsittelyä." },
    { id: "approve", offset: -2, label: "Palkanlaskennan hyväksyntä", explanation: "Sovi hyväksyntä ja pankkisiirron valmistelu palveluntarjoajan kanssa." },
    { id: "pay", offset: 0, label: "Käyttäjän antama palkkapäivä", explanation: "Syötä todellinen maksupäivä. Työkalu ei ratkaise sopimuksen mukaista palkanmaksupäivää.", fixed: true },
    { id: "review", offset: 1, label: "Palkkakierroksen jälkitarkistus", explanation: "Tarkista kierroksen valmistuminen. Tämä ei ole Tulorekisterin ilmoitusmääräpäivä." },
  ] },
  onboarding: { name: "Perehdytyssuunnitelma", source: HR_TOOLKIT_SOURCES.onboarding, rows: [
    { id: "prepare", offset: -7, label: "Perehdytyksen valmistelut", explanation: "Sovi perehdytyksen sisältö, yhteyshenkilöt ja työvälineiden järjestelyt." },
    { id: "start", offset: 0, label: "Käyttäjän antama aloituspäivä", explanation: "Käy läpi tehtävän kannalta tarpeelliset käytännöt ja ohjaus ennen itsenäistä työtä.", fixed: true },
    { id: "week", offset: 7, label: "Ensimmäisen viikon tarkistus", explanation: "Kysy, miten työn aloitus on sujunut ja mitä ohjausta vielä tarvitaan." },
    { id: "month", offset: 30, label: "Perehdytyksen seurantakeskustelu", explanation: "Arvioi yhdessä perehtymistä ja täydennä suunnitelmaa." },
    { id: "followup", offset: 90, label: "Myöhempi perehdytyksen seuranta", explanation: "Sovi jatkoseuranta tarpeen mukaan. Tämä ei tarkoita koeajan päättymispäivää." },
  ] },
});
export function newToolkitDraft(kind, anchor) {
  const template = TOOLKIT_TEMPLATES[kind]; if (!template) throw new Error("Tuntematon HR-malli.");
  return { kind, anchor, reference: "Yrityksen oma suunnitelma: vahvista sovittu päivä ja käytäntö.", rows: template.rows.map((r) => ({ ...r, edited: false, note: "" })) };
}
export function buildToolkitModel(input) {
  const template = TOOLKIT_TEMPLATES[input?.kind], anchor = parseIsoDate(input?.anchor);
  if (!template || !/^\d{4}-\d{2}-\d{2}$/.test(input.anchor) || !anchor || anchor.getFullYear() < 2000 || anchor.getFullYear() > 2100) throw new Error("Anna kelvollinen aloitus- tai palkkapäivä vuosilta 2000-2100.");
  if (typeof input.reference !== "string" || !input.reference.trim() || input.reference.length > 300 || !Array.isArray(input.rows) || input.rows.length !== template.rows.length) throw new Error("Anna päivien peruste ja tarkista mallin tehtävät.");
  const ids = new Set();
  const records = input.rows.map((r) => {
    const definition = template.rows.find((d) => d.id === r.id);
    if (!definition || ids.has(r.id) || !Number.isInteger(r.offset) || r.offset < -90 || r.offset > 365 || (definition.fixed && r.offset !== 0) || typeof r.edited !== "boolean" || typeof r.label !== "string" || !r.label.trim() || r.label.length > 120 || typeof r.note !== "string" || r.note.length > 1000) throw new Error("Tarkista tehtävän nimi ja etäisyys (-90...365 kalenteripäivää).");
    ids.add(r.id);
    const date = addDays(anchor, r.offset), applicableYear = date.getFullYear();
    if (applicableYear < 2000 || applicableYear > 2100) throw new Error("Suunnitelman päivien on osuttava vuosille 2000-2100.");
    const classification = definition.fixed || r.edited ? "configurable" : "recommended";
    const holiday = holidaysInYear(applicableYear).find((h) => toIsoDate(h.date) === toIsoDate(date));
    const caution = holiday ? `${holiday.name}: tarkista järjestelyt, päivää ei siirretä.` : [0, 6].includes(date.getDay()) ? "Viikonloppu: tarkista järjestelyt, päivää ei siirretä." : "";
    const explanation = `${definition.explanation} Etäisyys ${r.offset} kalenteripäivää käyttäjän antamasta päivästä. ${classification === "recommended" ? "Viikkonron ehdotus, ei lähteen määräämä määräaika." : "Käyttäjän antama päivä tai muokattu suunnitelma, ei tarkistettu velvoite."}`;
    return { id: `${input.kind}-${r.id}`, label: r.label.trim(), date, start: toIsoDate(date), applicableYear, classification, source: template.source, reference: classification === "configurable" ? input.reference.trim() : "Viikkonron muokattava malliaikataulu", explanation, note: r.note.trim(), caution, week: isoWeek(date), weekYear: isoYear(date) };
  }).sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const events = records.map((r) => createEvent({ id: r.id, title: r.label, date: r.start, kind: "company", description: toolkitRecordDescription(r) }));
  const years = [...new Set(records.map((r) => r.applicableYear))].sort();
  const calendars = years.map((year) => buildCalendarModel(createCalendarConfig({ year, include: { holidays: false, weekNumbers: true }, dayRuleMode: "FINLAND_PROJECT" }), events.filter((e) => e.date.getFullYear() === year)));
  return { kind: input.kind, title: template.name, anchor: input.anchor, records, calendars, years, disclosure: "Muokattava suunnitteluaikataulu, ei oikeudellinen määräpäiväluettelo. Etäisyydet ovat kalenteripäiviä. Päiviä ei siirretä automaattisesti. Tiedot pysyvät selaimessa." };
}
export function toolkitRecordDescription(r) {
  return [TOOLKIT_CLASSIFICATIONS[r.classification], `Soveltuva vuosi: ${r.applicableYear}`, `ISO-viikko ${r.week}/${r.weekYear}`, r.explanation, `Peruste: ${r.reference}`, `Lähde: ${r.source.name}`, r.source.url, `Lähde tarkistettu: ${r.source.reviewed}`, r.caution, r.note].filter(Boolean).join("\n");
}
