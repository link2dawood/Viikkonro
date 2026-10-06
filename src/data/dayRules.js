// The single definition of "which days count" for the planning tools. There is
// deliberately no universal working day: a leave day, a vacation-planning day
// and a project or sprint working day differ, so each tool names its mode and
// shows the rule to the visitor (disclosure). Plain .js so prerender.js can
// import it.
//
// reason(date) returns why a date does NOT count ("Sunnuntai", "Helatorstai"),
// or null when it counts. Every mode is built on the same holiday data
// (holidays.js) and, for statutory leave, on annualLeave.js.
//
// - FINLAND_STATUTORY_LEAVE: Annual Holidays Act leave days (see annualLeave.js
//   for the rule, source and review date). Saturdays count.
// - FINLAND_PLANNER: five-day week for finding long breaks. Saturdays, Sundays
//   and every holiday in holidaysInYear() are off, including jouluaatto and
//   juhannusaatto, which are not statutory but close most workplaces
//   (holidays.js, reviewed 2026-07-23).
// - FINLAND_WORKDAY: working days for /tyopaivalaskuri (isWorkingDay):
//   Monday-Friday except statutory holidays; the two eves count as working
//   days. FINLAND_PROJECT and FINLAND_SPRINT apply the same rule under their
//   own names, so a tool can change its rule without touching the others.
import { WD } from "../components/dateUtils.js";
import { holidaysInYear } from "./holidays.js";
import { leaveFreeReason } from "./annualLeave.js";
import { officialHolidayOn } from "./dateCalculator.js";

const holidayCache = new Map();
function anyHoliday(date) {
  const year = date.getFullYear();
  if (!holidayCache.has(year)) {
    holidayCache.set(year, new Map(holidaysInYear(year).map((h) => [h.date.toDateString(), h.name])));
  }
  return holidayCache.get(year).get(date.toDateString()) ?? null;
}

const weekend = (date) => (date.getDay() === 0 || date.getDay() === 6 ? WD[date.getDay()] : null);
const workingDayReason = (date) => officialHolidayOn(date) ?? weekend(date);

export const DAY_RULES = {
  FINLAND_STATUTORY_LEAVE: {
    id: "FINLAND_STATUTORY_LEAVE",
    unit: "lomapäivä",
    units: "lomapäivää",
    reason: leaveFreeReason,
    disclosure:
      "Lomapäivä vuosilomalain mukaan: lauantai on lomapäivä, mutta sunnuntai, arkipyhät, jouluaatto, juhannusaatto ja pääsiäislauantai eivät kuluta lomaa. Työehtosopimus voi laskea toisin.",
  },
  FINLAND_PLANNER: {
    id: "FINLAND_PLANNER",
    unit: "lomapäivä",
    units: "lomapäivää",
    reason: (date) => anyHoliday(date) ?? weekend(date),
    disclosure:
      "Lomapäivä suunnittelussa: maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Lauantait, sunnuntait, arkipyhät sekä jouluaatto ja juhannusaatto ovat vapaata.",
  },
  FINLAND_WORKDAY: {
    id: "FINLAND_WORKDAY",
    unit: "työpäivä",
    units: "työpäivää",
    reason: workingDayReason,
    disclosure:
      "Työpäivä työpäivälaskurissa: maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Jouluaatto ja juhannusaatto lasketaan työpäiviksi. Kelan arkipäivät -vaihtoehto laskee myös lauantait.",
  },
  FINLAND_PROJECT: {
    id: "FINLAND_PROJECT",
    unit: "työpäivä",
    units: "työpäivää",
    reason: workingDayReason,
    disclosure:
      "Työpäivä projektissa: maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Jouluaatto ja juhannusaatto lasketaan työpäiviksi.",
  },
  FINLAND_SPRINT: {
    id: "FINLAND_SPRINT",
    unit: "työpäivä",
    units: "työpäivää",
    reason: workingDayReason,
    disclosure:
      "Työpäivä sprintissä: maanantain ja perjantain välinen päivä, joka ei ole arkipyhä. Jouluaatto ja juhannusaatto lasketaan työpäiviksi.",
  },
};

// Why `date` does not count under `mode`, or null when it counts.
export const dayReason = (mode, date) => DAY_RULES[mode].reason(date);
export const countsAsDay = (mode, date) => dayReason(mode, date) === null;
