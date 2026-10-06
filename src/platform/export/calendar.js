// Calendar exports: one calendar model out as CSV, XLSX or ICS. These are thin
// compositions of the format writers in this folder; the table below is the
// single tabular shape every spreadsheet export shares.
import { WD } from "../../components/dateUtils.js";
import { eventsToIcs } from "../calendar/events.js";
import { weekList } from "../calendar/model.js";
import { buildIcs } from "./ics.js";
import { toCsv } from "./csv.js";
import { buildXlsx } from "./xlsx.js";

export const TABLE_HEADER = Object.freeze(["Päivämäärä", "Viikonpäivä", "Viikko", "Vapaapäivä", "Tapahtumat"]);

const pad = (n) => String(n).padStart(2, "0");
const fiDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

/** One row per day of the year. `dates: "date"` keeps Date objects (for XLSX). */
export function calendarTable(model, { dates = "text" } = {}) {
  const rows = [];
  for (const month of model.months) {
    for (const week of month.rows) {
      for (const day of week.days) {
        if (!day) continue;
        const titles = day.events.filter((e) => e.kind !== "week").map((e) => e.title);
        rows.push([
          dates === "date" ? day.date : fiDate(day.date),
          WD[day.date.getDay()],
          week.week,
          day.reason ?? "",
          titles.join("; "),
        ]);
      }
    }
  }
  return rows;
}

/** Excel-friendly CSV (semicolon, BOM, CRLF) with formula injection neutralised. */
export function calendarToCsv(model) {
  return toCsv([TABLE_HEADER, ...calendarTable(model)], {
    delimiter: ";",
    eol: "\r\n",
    bom: true,
    escapeFormulas: true,
  });
}

/** @returns {Uint8Array} a workbook with the day table and the event list. */
export function calendarToXlsx(model) {
  const events = [...model.events].filter((e) => e.kind !== "week");
  return buildXlsx({
    sheets: [
      {
        name: String(model.year),
        columns: [
          { header: TABLE_HEADER[0], width: 14 },
          { header: TABLE_HEADER[1], width: 14 },
          { header: TABLE_HEADER[2], width: 8 },
          { header: TABLE_HEADER[3], width: 22 },
          { header: TABLE_HEADER[4], width: 60 },
        ],
        rows: calendarTable(model, { dates: "date" }),
      },
      {
        name: "Tapahtumat",
        columns: [
          { header: "Alkaa", width: 14 },
          { header: "Päättyy", width: 14 },
          { header: "Laji", width: 12 },
          { header: "Nimi", width: 40 },
          { header: "Kuvaus", width: 60 },
        ],
        rows: events.map((e) => [e.date, e.endDate ?? e.date, e.kind, e.title, e.description ?? ""]),
      },
      {
        name: "Viikot",
        columns: [
          { header: "Viikko", width: 9 },
          { header: "Alkaa (ma)", width: 14 },
          { header: "Päättyy (su)", width: 14 },
          { header: `Työpäiviä ${model.year}`, width: 16 },
          { header: "Merkittävät päivät", width: 70 },
        ],
        rows: weekList(model).map((w) => [w.week, w.from, w.to, w.workingDays, w.events.map((e) => e.text).join("; ")]),
      },
    ],
  });
}

/** An iCalendar file of the model's events. `stamp` is "YYYYMMDDTHHMMSSZ". */
export function calendarToIcs(model, { stamp, domain } = {}) {
  const { companyName } = model.config.branding;
  return buildIcs({
    calName: `${companyName || "Viikkonro"} ${model.year}`,
    calDesc: `Viikkonro-kalenteri ${model.year}: viikkonumerot, pyhäpäivät ja yrityksen omat päivät.`,
    events: eventsToIcs(model.events, { domain }),
    stamp,
  });
}
