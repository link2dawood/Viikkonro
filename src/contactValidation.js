// Field validation for the contact form. Returns an object of Finnish error
// messages keyed by field name; empty object means valid.
export const LIMITS = { name: 100, email: 254, message: 5000 };
export const MIN_MESSAGE = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact({ name = "", email = "", message = "" }) {
  const errors = {};
  const n = name.trim();
  const e = email.trim();
  const m = message.trim();

  if (!n) errors.name = "Anna nimesi.";
  else if (n.length < 2) errors.name = "Nimen on oltava vähintään 2 merkkiä.";
  else if (n.length > LIMITS.name) errors.name = `Nimi saa olla enintään ${LIMITS.name} merkkiä.`;

  if (!e) errors.email = "Anna sähköpostiosoitteesi.";
  else if (e.length > LIMITS.email || !EMAIL_RE.test(e))
    errors.email = "Anna kelvollinen sähköpostiosoite, esim. nimi@example.fi.";

  if (!m) errors.message = "Kirjoita viesti.";
  else if (m.length < MIN_MESSAGE)
    errors.message = `Viestin on oltava vähintään ${MIN_MESSAGE} merkkiä.`;
  else if (m.length > LIMITS.message)
    errors.message = `Viesti saa olla enintään ${LIMITS.message} merkkiä.`;

  return errors;
}
