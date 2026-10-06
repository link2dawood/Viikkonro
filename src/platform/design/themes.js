// Calendar themes: named colour sets for every renderer (PDF, HTML, XLSX).
// "classic" is the exact palette of the site's existing calendar PDFs, so a
// company calendar looks like a Viikkonro calendar until it is branded.

/**
 * @typedef {object} ThemeColors
 * @property {string} ink @property {string} inkSoft @property {string} accent
 * @property {string} flag @property {string} line @property {string} holidayTint
 * @property {string} weekendText @property {string} closureTint
 * @property {string} leaveTint @property {string} companyTint @property {string} background
 */

export const THEMES = Object.freeze({
  classic: {
    id: "classic",
    name: "Klassinen",
    colors: {
      ink: "#15211f",
      inkSoft: "#56655f",
      accent: "#1f7a5c",
      flag: "#e0a23b",
      line: "#d8ddd9",
      holidayTint: "#faf1e0",
      weekendText: "#b5473a",
      closureTint: "#f4e3e0",
      leaveTint: "#e3ecf4",
      companyTint: "#e3f0ea",
      background: "#ffffff",
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimalistinen",
    colors: {
      ink: "#1a1a1a",
      inkSoft: "#6b6b6b",
      accent: "#3a3a3a",
      flag: "#8a8a8a",
      line: "#e0e0e0",
      holidayTint: "#f2f2f2",
      weekendText: "#6b6b6b",
      closureTint: "#e8e8e8",
      leaveTint: "#eeeeee",
      companyTint: "#f6f6f6",
      background: "#ffffff",
    },
  },
  contrast: {
    id: "contrast",
    name: "Korkea kontrasti",
    colors: {
      ink: "#000000",
      inkSoft: "#333333",
      accent: "#000000",
      flag: "#000000",
      line: "#999999",
      holidayTint: "#dddddd",
      weekendText: "#000000",
      closureTint: "#bbbbbb",
      leaveTint: "#cccccc",
      companyTint: "#eeeeee",
      background: "#ffffff",
    },
  },
});

export const DEFAULT_THEME = "classic";

/** Theme colours with the company's own colours applied on top. */
export function resolveTheme(themeId = DEFAULT_THEME, branding = null) {
  const theme = THEMES[themeId];
  if (!theme) throw new Error(`Unknown theme "${themeId}".`);
  return Object.freeze({
    id: theme.id,
    name: theme.name,
    colors: Object.freeze({
      ...theme.colors,
      ...(branding?.primaryColor ? { accent: branding.primaryColor } : {}),
      ...(branding?.accentColor ? { flag: branding.accentColor } : {}),
    }),
  });
}
