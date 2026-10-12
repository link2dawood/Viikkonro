// Shift instants are independent of the browser's time zone. Calendar dates
// and ISO weeks continue to come from the existing calendar engine.
const formatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function helsinkiLocal(instant) {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new Error("Virheellinen kellonaika.");
  const p = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function helsinkiInstant(local, occurrence = "earlier") {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || !["earlier", "later"].includes(occurrence)) throw new Error("Virheellinen kellonaika.");
  const naive = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(naive) || new Date(naive).toISOString().slice(0, 16) !== local) throw new Error("Virheellinen päivämäärä.");
  const offsets = new Set([-86400000, 0, 86400000].map((delta) => {
    const probe = naive + delta;
    return Date.parse(`${helsinkiLocal(probe)}:00Z`) - probe;
  }));
  const candidates = [...offsets].map((offset) => naive - offset).filter((instant) => helsinkiLocal(instant) === local).sort((a, b) => a - b);
  if (!candidates.length) throw new Error("Tätä kellonaikaa ei ole kesäaikaan siirryttäessä. Valitse toinen aika.");
  return new Date(candidates[occurrence === "later" ? candidates.length - 1 : 0]).toISOString();
}
export function shiftInterval(start, end, occurrence = "earlier", endOccurrence = occurrence) {
  const starts_at = helsinkiInstant(start, occurrence), ends_at = helsinkiInstant(end, endOccurrence);
  const duration = Date.parse(ends_at) - Date.parse(starts_at);
  if (duration <= 0 || duration > 36 * 3600000) throw new Error("Vuoron on kestettävä yli 0 ja enintään 36 tuntia.");
  return { starts_at, ends_at };
}
export const intervalsOverlap = (a, b) => Date.parse(a.starts_at) < Date.parse(b.ends_at) && Date.parse(b.starts_at) < Date.parse(a.ends_at);
export function nextLocalDate(key) {
  const d = new Date(`${key}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10);
}
