// iCalendar (RFC 5545) serializer shared by the subscribable feeds
// (src/data/icsFeeds.js) and the planning platform's company calendars.
// Output follows the RFC: CRLF line endings, content lines folded at 75
// octets (UTF-8 aware, so "ä" is never split), TEXT values escaped.
// Plain .js with no browser or Node APIs beyond TextEncoder, so prerender.js,
// the browser and future serverless code can all import it.

export const DEFAULT_PRODID = "-//Viikko Nro//viikkonro.fi//FI";

const pad = (n) => String(n).padStart(2, "0");
export const icsDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

export function escapeIcsText(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold one content line at 75 octets without splitting a UTF-8 sequence.
export function foldIcsLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const len = enc.encode(ch).length;
    if (bytes + len > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    bytes += len;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

// One all-day VEVENT. `endDate` is the LAST day of a multi-day event
// (inclusive); iCalendar's DTEND is exclusive, so one day is added here.
export function allDayEvent({ uid, date, endDate, summary, description, url }, stamp) {
  const next = new Date(endDate ?? date);
  next.setDate(next.getDate() + 1);
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(date)}`,
    `DTEND;VALUE=DATE:${icsDate(next)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

export function buildIcs({ calName, calDesc, events, stamp, prodId = DEFAULT_PRODID }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-CALDESC:${escapeIcsText(calDesc)}`,
    "X-WR-TIMEZONE:Europe/Helsinki",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
    ...events.flatMap((e) => allDayEvent(e, stamp)),
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
