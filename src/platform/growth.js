import { validateYear, validateWeek } from "../components/dateUtils.js";

// Public route families and static copy only. Private workspaces are excluded.
const intents = {
  calendar: { product: "company-calendar", href: "/yrityskalenteri", title: "Luo yrityksellesi oma kalenteri", text: "Lisää yrityksen omat päivät ja tutustu kalenterin esikatseluun." },
  print: { product: "company-calendar", href: "/yrityskalenteri", title: "Lisää yrityksen logo ja omat tärkeät päivät", text: "Suunnittele yrityskalenteri ja tarkista tulos esikatselussa." },
  working_days: { product: "project-planner", href: "/projektiaikataulu", title: "Luo projektillesi viikkokalenteri", text: "Suunnittele työpäivät, vaiheet ja välitavoitteet samalla suomalaisella kalenterilla." },
  hr: { product: "hr-payroll-calendar", href: "/hr-kalenteri", title: "Kokoa yrityksen tärkeät päivät HR-kalenteriin", text: "Lisää omat palkkapäivät, määräpäivät ja yrityksen tapahtumat." },
  vacation: { product: "team-leave-planner", href: "/tiimin-lomat", title: "Suunnittele koko tiimin lomat", text: "Tutustu yhteiseen lomakalenteriin, käyttöoikeuksiin ja tiimin kattavuuden suunnitteluun." },
  project: { product: "project-planner", href: "#project-planner-pro", title: "Luo projektillesi viikkokalenteri", text: "Lisää vaiheet ja välitavoitteet. Lataa suunnitelma PDF-, Excel- tai ICS-muodossa." },
  sprint: { product: "sprint-planner", href: "#sprint-planner-pro", title: "Suunnittele sprintit ISO-viikoittain", text: "Kokoa usean sprintin aikataulu ja lataa se omaan kalenteriisi." },
};

export function growthIntent(path) {
  const tools = { "/lomasuunnittelija": "vacation", "/projektiaikataulu": "project", "/sprinttisuunnittelija": "sprint" };
  if (Object.hasOwn(tools, path)) return { family: tools[path], ...intents[tools[path]] };
  const match = path?.match(/^\/(kalenteri|tulostettava-kalenteri|tulosta|vuosi|tyopaivat|pyhapaivat|palkkapaivat)-(\d{4})(?:-(alkuvuosi|loppuvuosi))?$/);
  if (match && validateYear(+match[2]) && (!match[3] || match[1] === "kalenteri")) {
    const family = match[1];
    const intent = family === "tyopaivat" ? "working_days" : ["pyhapaivat", "palkkapaivat"].includes(family) ? "hr" : ["tulosta", "tulostettava-kalenteri"].includes(family) ? "print" : "calendar";
    return { family, ...intents[intent] };
  }
  const week = path?.match(/^\/viikko-(\d+)-(\d{4})$/);
  if (week && validateYear(+week[2]) && validateWeek(+week[1], +week[2])) return { family: "week", ...intents.calendar };
  return null;
}

const products = new Set([...Object.values(intents).map((item) => item.product), "company-ics", "excel-templates", "vacation-planner-pro", "construction-planner"]);
const families = new Set(["direct", "calendar", "print", "working_days", "hr", "vacation", "project", "sprint", "week", "kalenteri", "tulostettava-kalenteri", "tulosta", "vuosi", "tyopaivat", "pyhapaivat", "palkkapaivat"]);
const stages = new Set(["landing", "cta", "start", "preview", "export", "repeat"]);

export function growthCommands(stage, product, family) {
  if (!stages.has(stage) || !products.has(product) || !families.has(family)) return [];
  return [["set", "growth_product", product], ["set", "growth_source", family], ["set", "growth_path", `${product}:${family}`], ["event", `growth_${stage}`], ["event", `growth_${stage}_${product}`]];
}

export function productStage(name, props = {}, path = "") {
  // Payment redirects, development unlocks and unverified purchase events do
  // not constitute a purchase. A verified payment integration is still needed.
  if (path.startsWith("/tiimin-lomat/") || name === "purchase") return null;
  let product, stage;
  if (name.startsWith("company_calendar_")) product = path === "/yrityskalenteri/ics" ? "company-ics" : "company-calendar";
  else if (name.startsWith("company_ics_")) return null; // Builder already emits the shared calendar event.
  else if (name.startsWith("vacation_planner_")) product = "vacation-planner-pro";
  else if (name.startsWith("planning_suite_")) product = props.source === "project" ? "project-planner" : props.source === "sprint" ? "sprint-planner" : null;
  else if (name.startsWith("construction_planner_")) product = "construction-planner";
  else if (name.startsWith("hr_calendar_")) product = "hr-payroll-calendar";
  else if (name.startsWith("template_")) product = "excel-templates";
  if (name.endsWith("_started") || name === "planning_suite_created" || name === "template_cta") stage = "start";
  else if (name.endsWith("_preview") || name === "construction_planner_created") stage = "preview";
  else if (name.endsWith("_export") || name === "template_download") stage = "export";
  return product && stage ? { product, stage } : null;
}

// Session memory only: no identifiers, tracking storage, URLs, form values or
// country inference. Clarity supplies its existing device/country filters.
export function createGrowthTracker(send) {
  const sources = new Map(), started = new Set(), completed = new Set();
  let path = "", seen = new Set();
  const emit = (stage, product, family) => {
    const key = `${stage}:${product}`;
    const commands = growthCommands(stage, product, family);
    if (!commands.length || seen.has(key)) return;
    seen.add(key);
    commands.forEach((command) => send(...command));
  };
  return {
    page(next) {
      if (next !== path) { path = next; seen = new Set(); }
      const intent = growthIntent(path);
      if (intent) emit("landing", intent.product, intent.family);
    },
    cta(intent) {
      if (!growthCommands("cta", intent?.product, intent?.family).length) return;
      sources.set(intent.product, intent.family);
      emit("cta", intent.product, intent.family);
    },
    event(name, props, currentPath = path) {
      const item = productStage(name, props, currentPath);
      if (!item) return;
      const family = sources.get(item.product) ?? growthIntent(currentPath)?.family ?? "direct";
      if (item.stage === "start") {
        if (!started.has(item.product) && completed.has(item.product)) emit("repeat", item.product, family);
        started.add(item.product);
      }
      if (item.stage === "export") { completed.add(item.product); started.delete(item.product); }
      emit(item.stage, item.product, family);
    },
  };
}
