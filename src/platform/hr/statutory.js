// Only reviewed definitions are generated here. User input cannot become a verified rule.
export const HR_LEGAL_SOURCE = Object.freeze({ name: "Finlex: vuosilomalaki 162/2005, 4 § ja 30 §", url: "https://www.finlex.fi/fi/lainsaadanto/2005/162", reviewed: "2026-10-10", years: [2026, 2027, 2028] });
export const HR_LEGAL_SCOPE = "Vuosilomalain 4 §:n ajanjaksojen rajat, eivät ilmoitus- tai maksujen määräpäivät. Tarkista lain soveltamisala ja ajantasaisuus. Työ- tai virkaehtosopimus voi sisältää poikkeavia määräyksiä (30 §). Muistutus ei määrää yksittäisen työntekijän lomaa.";
export function statutoryHrDates(year) {
  if (!HR_LEGAL_SOURCE.years.includes(year)) throw new Error("Lakimuistutukset on tarkistettu vain vuosille 2026, 2027 ja 2028.");
  return [["earning-end", "03-31", "Lomanmääräytymisvuosi päättyy"], ["earning-start", "04-01", "Lomanmääräytymisvuosi alkaa"], ["season-start", "05-02", "Vuosilomalain lomakausi alkaa"], ["season-end", "09-30", "Vuosilomalain lomakausi päättyy"]].map(([id, date, label]) => ({ id: `statutory-${year}-${id}`, start: `${year}-${date}`, end: `${year}-${date}`, label, type: "reminder", origin: "statutory", note: HR_LEGAL_SCOPE, reference: HR_LEGAL_SOURCE.name, url: HR_LEGAL_SOURCE.url, reviewed: HR_LEGAL_SOURCE.reviewed }));
}
