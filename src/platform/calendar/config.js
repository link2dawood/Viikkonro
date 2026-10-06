// Calendar configuration: the one validated, serialisable description of a
// calendar that every platform product builds from (company calendar, HR
// calendar, leave and shift planners). It holds no behaviour; the model
// (model.js) and the exporters (../export) read it.
//
// A configuration round-trips through plain JSON (configToJson /
// configFromJson), which is how a saved calendar can live in a shareable link
// or a file without any database.
import { DAY_RULES } from "../../data/dayRules.js";
import { DEFAULT_PAYDAY, PAYDAY_LAST } from "../../data/paydayPages.js";
import { validateBranding } from "../design/branding.js";
import { DEFAULT_THEME, THEMES } from "../design/themes.js";
import { DEFAULT_LAYOUT, resolveLayout } from "../design/layouts.js";
import { PRODUCTS } from "../business/products.js";
import { createEvent, dayKey } from "./events.js";
import { createPeriod } from "./periods.js";

export const CONFIG_VERSION = 1;
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;
export const MAX_COMPANY_EVENTS = 500;
export const MAX_PERIODS = 100;
export const DEFAULT_DAY_RULE = "FINLAND_PLANNER";

function validatePayday(value, issues) {
  if (value == null || value === false) return null;
  const day = value === true ? DEFAULT_PAYDAY : value.day;
  if (day === PAYDAY_LAST || (Number.isInteger(day) && day >= 1 && day <= 31)) return Object.freeze({ day });
  issues.push('include.paydays.day must be 1-31 or "last".');
  return null;
}

/**
 * @typedef {object} CalendarConfig
 * @property {number} year
 * @property {keyof typeof DAY_RULES} dayRuleMode
 * @property {{weekNumbers: boolean, holidays: boolean, flagDays: boolean, paydays: {day: number|string}|null}} include
 * @property {import("./events.js").CalendarEvent[]} events  company dates
 * @property {import("./periods.js").Period[]} periods  closures, leave and seasons
 * @property {import("../design/branding.js").Branding} branding
 * @property {string} theme
 * @property {{id: string, paper: string, orientation: string|null}} layout
 * @property {string|null} product  product id this calendar is made for
 */

/** @returns {{config: CalendarConfig|null, issues: string[]}} */
export function validateCalendarConfig(input = {}) {
  const issues = [];

  const year = Number(input.year);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    issues.push(`year must be a whole number from ${MIN_YEAR} to ${MAX_YEAR}.`);
  }

  const dayRuleMode = input.dayRuleMode ?? DEFAULT_DAY_RULE;
  if (!DAY_RULES[dayRuleMode]) issues.push(`Unknown dayRuleMode "${dayRuleMode}".`);

  const inc = input.include ?? {};
  const include = Object.freeze({
    weekNumbers: inc.weekNumbers ?? true,
    holidays: inc.holidays ?? true,
    flagDays: inc.flagDays ?? false,
    paydays: validatePayday(inc.paydays, issues),
  });

  const rawEvents = input.events ?? [];
  const rawPeriods = input.periods ?? [];
  if (rawEvents.length > MAX_COMPANY_EVENTS) issues.push(`At most ${MAX_COMPANY_EVENTS} company events are allowed.`);
  if (rawPeriods.length > MAX_PERIODS) issues.push(`At most ${MAX_PERIODS} periods are allowed.`);

  const events = [];
  rawEvents.slice(0, MAX_COMPANY_EVENTS).forEach((e, i) => {
    try {
      events.push(createEvent({ ...e, id: e.id ?? `company-${i + 1}`, kind: "company", source: "company" }));
    } catch (error) {
      issues.push(`events[${i}]: ${error.message}`);
    }
  });
  const periods = [];
  rawPeriods.slice(0, MAX_PERIODS).forEach((p, i) => {
    try {
      periods.push(createPeriod(p));
    } catch (error) {
      issues.push(`periods[${i}]: ${error.message}`);
    }
  });

  const ids = [...events.map((e) => e.id), ...periods.map((p) => `period-${p.id}`)];
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) issues.push(`Duplicate id "${dup}".`);

  const brandingResult = validateBranding(input.branding ?? {});
  issues.push(...brandingResult.issues);

  const theme = input.theme ?? DEFAULT_THEME;
  if (!THEMES[theme]) issues.push(`Unknown theme "${theme}".`);

  const layoutInput = input.layout ?? DEFAULT_LAYOUT;
  try {
    resolveLayout(layoutInput);
  } catch (error) {
    issues.push(error.message);
  }

  const product = input.product ?? null;
  if (product !== null && !PRODUCTS[product]) issues.push(`Unknown product "${product}".`);

  if (issues.length) return { config: null, issues };
  return {
    issues,
    config: Object.freeze({
      year,
      dayRuleMode,
      include,
      events: Object.freeze(events),
      periods: Object.freeze(periods),
      branding: brandingResult.branding,
      theme,
      layout: Object.freeze({
        id: layoutInput.id ?? DEFAULT_LAYOUT.id,
        paper: layoutInput.paper ?? DEFAULT_LAYOUT.paper,
        orientation: layoutInput.orientation ?? null,
      }),
      product,
    }),
  };
}

/** @returns {CalendarConfig} */
export function createCalendarConfig(input) {
  const { config, issues } = validateCalendarConfig(input);
  if (!config) throw new Error(`Invalid calendar configuration: ${issues.join(" ")}`);
  return config;
}

/** Plain, JSON-safe form: dates as "YYYY-MM-DD". */
export function configToJson(config) {
  return {
    version: CONFIG_VERSION,
    year: config.year,
    dayRuleMode: config.dayRuleMode,
    include: { ...config.include },
    events: config.events.map((e) => ({
      id: e.id,
      date: dayKey(e.date),
      ...(e.endDate ? { endDate: dayKey(e.endDate) } : {}),
      title: e.title,
      ...(e.description ? { description: e.description } : {}),
    })),
    periods: config.periods.map((p) => ({
      id: p.id,
      label: p.label,
      start: dayKey(p.start),
      end: dayKey(p.end),
      kind: p.kind,
      ...(p.note ? { note: p.note } : {}),
    })),
    branding: createBrandingJson(config.branding),
    theme: config.theme,
    layout: { ...config.layout },
    product: config.product,
  };
}

function createBrandingJson(branding) {
  return {
    companyName: branding.companyName,
    logo: branding.logo ? { dataUri: branding.logo.dataUri } : null,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
  };
}

export function configFromJson(json) {
  if (json?.version !== CONFIG_VERSION) throw new Error(`Unsupported calendar configuration version "${json?.version}".`);
  const { version, ...input } = json;
  void version;
  return createCalendarConfig({ ...input, branding: input.branding ?? {} });
}

