// Company branding for calendars and exports: a name, an optional logo and up
// to two colours. Validation is strict because a logo is user-supplied markup
// that future code will embed into PDFs, pages and exports.

/**
 * @typedef {object} Branding
 * @property {string} companyName
 * @property {{mime: string, dataUri: string}|null} logo
 * @property {string|null} primaryColor  "#rrggbb"
 * @property {string|null} accentColor   "#rrggbb"
 */

export const MAX_COMPANY_NAME = 80;
export const MAX_LOGO_BYTES = 512 * 1024;
export const LOGO_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/svg+xml"]);

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#abc" or "#aabbcc" to lower-case "#aabbcc", or null. */
export function normalizeHex(value) {
  if (typeof value !== "string" || !HEX.test(value.trim())) return null;
  let hex = value.trim().toLowerCase();
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two "#rrggbb" colours (1 to 21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Dark or white text, whichever reads better on `background`. */
export function readableTextColor(background, dark = "#15211f", light = "#ffffff") {
  return contrastRatio(background, dark) >= contrastRatio(background, light) ? dark : light;
}

function validateLogo(logo, issues) {
  if (logo == null) return null;
  const match = /^data:([a-z]+\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(logo.dataUri ?? "");
  if (!match || !LOGO_MIME_TYPES.includes(match[1])) {
    issues.push("Logo must be a PNG, JPEG or SVG data URI (base64).");
    return null;
  }
  if (Math.floor((match[2].length * 3) / 4) > MAX_LOGO_BYTES) {
    issues.push(`Logo is larger than ${MAX_LOGO_BYTES / 1024} KB.`);
    return null;
  }
  if (match[1] === "image/svg+xml") {
    const svg = atob(match[2]); // global in browsers and in Node 16+
    if (/<script|\son[a-z]+\s*=|javascript:|<foreignObject|<iframe/i.test(svg)) {
      issues.push("SVG logo must not contain scripts, event handlers or embedded frames.");
      return null;
    }
  }
  return { mime: match[1], dataUri: logo.dataUri };
}

/** @returns {{branding: Branding|null, issues: string[]}} */
export function validateBranding(input = {}) {
  const issues = [];
  const companyName = typeof input.companyName === "string" ? input.companyName.trim() : "";
  if (companyName.length > MAX_COMPANY_NAME) issues.push(`Company name is longer than ${MAX_COMPANY_NAME} characters.`);
  const colors = {};
  for (const key of ["primaryColor", "accentColor"]) {
    if (input[key] == null || input[key] === "") colors[key] = null;
    else if (!(colors[key] = normalizeHex(input[key]))) issues.push(`${key} must be a hex colour like #1f7a5c.`);
  }
  const logo = validateLogo(input.logo, issues);
  if (issues.length) return { branding: null, issues };
  return { branding: Object.freeze({ companyName, logo, ...colors }), issues };
}

export function createBranding(input) {
  const { branding, issues } = validateBranding(input);
  if (!branding) throw new Error(issues.join(" "));
  return branding;
}
