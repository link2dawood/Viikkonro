import { widgetConfiguration, widgetQuery, buildWidgetModel, moveWidgetDate, WIDGET_VERSION } from "./model.js";
import { helsinkiDayKey } from "../../components/dateUtils.js";
import { dayKey } from "../calendar/events.js";

const root = document.getElementById("calendar");
let input, followsToday, config;
const el = (tag, text, attrs = {}) => { const node = document.createElement(tag); if (text != null) node.textContent = text; for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value); return node; };
function render() {
  const model = buildWidgetModel(config);
  document.documentElement.dataset.theme = config.theme;
  document.documentElement.style.setProperty("--accent", config.color);
  const section = el("section", null, { "aria-label": "Yrityskalenteri" });
  if (config.companyName) section.append(el("h1", config.companyName));
  const nav = el("nav", null, { "aria-label": "Kalenterin selaus" });
  const label = config.date.toLocaleDateString("fi-FI", { year: "numeric", month: "long", ...(config.view === "week" ? { day: "numeric" } : {}) });
  for (const direction of [-1, 1]) {
    const next = moveWidgetDate(config, direction), button = el("button", direction < 0 ? "‹" : "›", { type: "button", "aria-label": `${direction < 0 ? "Edellinen" : "Seuraava"} ${config.view === "week" ? "viikko" : "kuukausi"}` });
    button.disabled = !next;
    button.addEventListener("click", () => { const focusLabel = button.getAttribute("aria-label"); followsToday = false; input.date = next; update(input); [...root.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === focusLabel)?.focus(); });
    if (direction === 1) nav.append(el("h2", label, { "aria-live": "polite" }));
    nav.append(button);
  }
  section.append(nav, el("p", `Viikko ${model.week}/${model.weekYear} · ${model.date}`, { class: "summary" }));
  const table = el("table"), caption = el("caption", "ISO-viikot ja kalenteripäivät"); table.append(caption);
  const heading = el("tr");
  for (const day of ["Vk", "Ma", "Ti", "Ke", "To", "Pe", "La", "Su"]) heading.append(el("th", day, { scope: "col" }));
  const thead = el("thead"); thead.append(heading); table.append(thead);
  const tbody = el("tbody");
  for (const row of model.rows) {
    const tr = el("tr"); tr.append(el("th", row.week, { scope: "row", "aria-label": `ISO-viikko ${row.week}, viikkovuosi ${row.weekYear}` }));
    for (const day of row.days) {
      const td = el("td");
      if (day) {
        if (day.date === helsinkiDayKey()) td.setAttribute("aria-current", "date");
        td.append(el("time", day.day, { datetime: day.date }));
        for (const h of day.holidays) td.append(el("span", `${h.title}${h.official ? "" : " (aatto)"}`, { class: "holiday" }));
        for (const event of day.events) td.append(el("span", event.title, { class: "event" }));
      }
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody); section.append(table);
  section.append(el("p", "Aattojen ja yrityksen tapahtumien vapaa riippuu yrityksen käytännöistä.", { class: "note" }));
  section.append(el("a", "Kalenteri: viikkonro.fi", { href: "https://viikkonro.fi", target: "_blank", rel: "noopener noreferrer", referrerpolicy: "no-referrer" }));
  root.replaceChildren(section);
}
function update(value) {
  try { const next = widgetConfiguration(value); config = next; render(); }
  catch { root.replaceChildren(el("p", "Kalenterin asetukset eivät kelpaa. Tarkista päivämäärät ja tapahtumat.", { role: "alert" })); }
}
try { input = widgetQuery(location.search); followsToday = !input.date; update(input); }
catch { input = {}; root.replaceChildren(el("p", "URL saa sisältää vain kalenterin julkisia näyttöasetuksia.", { role: "alert" })); }
// Only this embed's direct parent can supply data. No token, URL fetch or storage API.
window.addEventListener("message", (event) => {
  if (window.parent === window || event.source !== window.parent || event.data?.type !== "viikkonro-calendar:configure" || event.data?.version !== WIDGET_VERSION) return;
  try {
    const next = event.data.config;
    widgetConfiguration(next);
    input = { ...next }; followsToday = !input.date; update(input);
  } catch { /* Invalid parent messages never replace a valid calendar. */ }
});
// Refresh current-day embeds after midnight, including sleeping tabs.
setInterval(() => { if (followsToday && config && dayKey(config.date) !== helsinkiDayKey()) update(input); }, 60000);
window.addEventListener("focus", () => { if (followsToday) update(input); });
