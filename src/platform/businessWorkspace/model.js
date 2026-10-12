import { configFromJson, configToJson, createCalendarConfig } from "../calendar/config.js";
import { buildCalendarModel } from "../calendar/model.js";
export const BUSINESS_ROLES = Object.freeze(["firm_owner","firm_manager","client_admin","editor","viewer"]);
export const BUSINESS_ROLE_LABELS = Object.freeze({firm_owner:"Tilitoimiston omistaja",firm_manager:"Tilitoimiston esihenkilö",client_admin:"Asiakasyrityksen ylläpitäjä",editor:"Asiakasyrityksen muokkaaja",viewer:"Asiakasyrityksen katselija"});
export const BUSINESS_ACTION_LABELS = Object.freeze({enable:"Tilitoimisto otettu käyttöön",create_client:"Asiakasyritys lisätty",save_calendar:"Kalenteri tallennettu",save_template:"Pohja tallennettu",remove_template:"Pohja poistettu",grant_access:"Asiakkaan käyttöoikeus annettu",revoke_access:"Asiakkaan käyttöoikeus peruttu",export_record:"Vienti valmisteltu",delete_client:"Asiakasyritys poistettu",organization_access_insert:"Organisaation käyttöoikeus annettu",organization_access_update:"Organisaation käyttöoikeus muutettu",organization_access_delete:"Organisaation käyttöoikeus peruttu"});
const uuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const canManageClientAccess = (role) => ["firm_owner","client_admin"].includes(role);
export const canEditCompanyCalendar = (role) => BUSINESS_ROLES.includes(role) && role !== "viewer";
export const initialCompanyConfiguration = (name, year) => configToJson(createCalendarConfig({ year, dayRuleMode: "FINLAND_WORKDAY", branding: { companyName: name }, include: { holidays: true, flagDays: false } }));
export function validateBusinessSnapshot(snapshot, clientId, year) {
  if (!snapshot || !uuid(clientId) || snapshot.client?.id !== clientId || !uuid(snapshot.client?.firmId) || snapshot.year !== year || !BUSINESS_ROLES.includes(snapshot.role) || !Number.isInteger(snapshot.client.version) || snapshot.client.version < 1 || !Number.isInteger(snapshot.firmVersion) || snapshot.firmVersion < 1 || typeof snapshot.client.name !== "string" || !snapshot.client.name.trim() || snapshot.client.name.length > 80) throw new Error("Invalid company boundary");
  for (const key of ["access","audit","exports"]) if (!Array.isArray(snapshot[key]) || snapshot[key].length > (key === "access" ? 1000 : 100)) throw new Error("Invalid history");
  if (snapshot.firmAudit != null && (!Array.isArray(snapshot.firmAudit) || snapshot.firmAudit.length > 100)) throw new Error("Invalid firm history");
  if (!["firm_owner","firm_manager"].includes(snapshot.role) && (snapshot.firmAudit?.length ?? 0)>0) throw new Error("Firm history outside permission boundary");
  if (snapshot.calendar) {
    if (!uuid(snapshot.calendar.id) || !Number.isInteger(snapshot.calendar.version) || snapshot.calendar.version < 1) throw new Error("Invalid calendar");
    const config = configFromJson(snapshot.calendar.configuration);
    if (config.year !== year) throw new Error("Invalid calendar year");
  }
  return snapshot;
}
export function companyCalendarModel(snapshot) {
  validateBusinessSnapshot(snapshot, snapshot.client.id, snapshot.year);
  return buildCalendarModel(configFromJson(snapshot.calendar?.configuration ?? initialCompanyConfiguration(snapshot.client.name, snapshot.year)));
}
export function reusableCompanyTemplate(configuration, companyName, year) {
  const config = configFromJson(configuration);
  return configToJson(createCalendarConfig({ year, dayRuleMode: config.dayRuleMode, theme: config.theme, layout: config.layout,
    include: { weekNumbers: true, holidays: config.include.holidays, flagDays: config.include.flagDays },
    branding: { companyName, primaryColor: config.branding.primaryColor, accentColor: config.branding.accentColor } }));
}
// A new scope invalidates in-flight reads and exports. Versions protect permission downgrades.
export function createBusinessScope() {
  let epoch = 0, scope = "", firmVersion = 0, clientVersion = 0, calendarVersion = 0;
  return {
    reset(next = "") { epoch += 1; scope = next; firmVersion = 0; clientVersion = 0; calendarVersion = 0; return epoch; },
    token() { return epoch; },
    current(token) { return token === epoch; },
    accept(snapshot, token, clientId, year) {
      validateBusinessSnapshot(snapshot, clientId, year);
      const version = snapshot.calendar?.version ?? 0;
      if (token !== epoch || scope !== `${clientId}:${year}` || snapshot.firmVersion < firmVersion || snapshot.client.version < clientVersion || version < calendarVersion) return false;
      firmVersion = snapshot.firmVersion; clientVersion = snapshot.client.version; calendarVersion = version; return true;
    },
  };
}
