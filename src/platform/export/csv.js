// One CSV serializer for every export. The site already ships two dialects,
// and both are kept byte for byte through the options:
// - dataset files under /data/*.csv: comma, LF, cells quoted on ", and LF
//   (build time, prerender.js);
// - the Excel download on the calendar pages: semicolon (Finnish Excel
//   locale), CRLF, UTF-8 BOM, no trailing newline.
// `escapeFormulas` neutralises user-typed cells that spreadsheets would run as
// formulas (a leading = + - @ tab or CR); it is off by default so existing
// exports are unchanged, and must be on for any text a customer typed.

const needsQuoteFor = (delimiter) =>
  new RegExp(`[${delimiter.replace(/[\\\]^-]/g, "\\$&")}"\\r\\n]`);

export function csvCell(value, { delimiter = ",", quoteWhen, escapeFormulas = false } = {}) {
  let text = String(value ?? "");
  if (escapeFormulas && typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  const re = quoteWhen ?? needsQuoteFor(delimiter);
  return re.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(
  rows,
  { delimiter = ",", eol = "\n", bom = false, trailingEol = false, quoteWhen, escapeFormulas = false } = {},
) {
  const cell = (v) => csvCell(v, { delimiter, quoteWhen, escapeFormulas });
  const body = rows.map((row) => row.map(cell).join(delimiter)).join(eol);
  return (bom ? "﻿" : "") + body + (trailingEol ? eol : "");
}
