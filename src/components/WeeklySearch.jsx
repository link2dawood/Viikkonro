import { useToday } from "./useToday";
import React, { useState, useEffect } from "react";
import { isoWeek, isoYear, mondayOf } from "./dateUtils";
import { Link } from "react-router-dom";
// FORMATTING HELPERS
function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function getFormattedDateInputString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const WEEKDAYS = [
  "Sunnuntai",
  "Maanantai",
  "Tiistai",
  "Keskiviikko",
  "Torstai",
  "Perjantai",
  "Lauantai",
];

// Pure function of a date string. `selectedDateStr` (the controlled input's
// value) intentionally starts empty on both server and first client render
// (see the hydration-safety comment in WeeklySearch below), so `result` below
// is null until the mount effect fills it in. `todayExample` calls this same
// function directly with today's date instead, so the section still has real,
// crawlable text before that effect ever runs.
function computeResult(selectedDateStr) {
  if (!selectedDateStr) return null;
  const parts = selectedDateStr.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);

  const wk = isoWeek(d);
  const yr = isoYear(d);
  const m = mondayOf(wk, yr);
  const s = new Date(m);
  s.setDate(m.getDate() + 6);

  const fullDateOptions = { day: "numeric", month: "long", year: "numeric" };

  return {
    writtenDay: d.toLocaleDateString("fi-FI", fullDateOptions),
    weekday: WEEKDAYS[d.getDay()],
    weekNum: wk,
    isoYearNum: yr,
    rangeText:
      m.toLocaleDateString("fi-FI", {
        day: "2-digit",
        month: "short",
      }) +
      "–" +
      s.toLocaleDateString("fi-FI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  };
}

const WeeklySearch = () => {
  // Start empty so the server-rendered HTML and the first client render match
  // exactly (hydration-safe). Defaulting to today's date here would differ
  // from the build-time date on any day after the build and break hydration.
  // The real "today" is filled in after mount, client-side only.
  const [selectedDateStr, setSelectedDateStr] = useState("");
  useEffect(() => {
    setSelectedDateStr(getFormattedDateInputString(new Date()));
  }, []);
  const result = computeResult(selectedDateStr);

  // Static worked example, computed directly in the render body (not gated
  // behind the effect above) so it's present in the SSR/prerendered HTML and
  // for no-JS visitors — otherwise this whole section's crawlable body is a
  // label and an empty <input>. Once the client hydrates and the effect fills
  // in selectedDateStr, `result` becomes truthy and replaces this example.
  const todayExample = computeResult(getFormattedDateInputString(useToday()));

  return (
    <>
      <section>
        {/* <div className="sec-head">Weekly search</div> */}
        <h2 className="mh">Tarkista minkä tahansa päivän viikkonumero</h2>
        <div className="lookup">
          <label htmlFor="dpick">Valitse päivämäärä</label>
          <input
            type="date"
            id="dpick"
            value={selectedDateStr}
            onChange={(e) => setSelectedDateStr(e.target.value)}
          />
          {!result && todayExample && (
            <p className="note-soft" id="staticExample">
              Esimerkiksi <strong>{todayExample.writtenDay}</strong> (
              {todayExample.weekday.toLowerCase()}) on viikolla{" "}
              {todayExample.weekNum} — viikko {todayExample.weekNum}/
              {todayExample.isoYearNum}, {todayExample.rangeText}.{" "}
              <Link
                className="open-link"
                to={`/viikko-${todayExample.weekNum}-${todayExample.isoYearNum}`}
              >
                avaa viikko {todayExample.weekNum}
              </Link>
            </p>
          )}
          {result && (
            <div className="result" id="lookupResult">
              <div className="main-text">
                <strong>{result.writtenDay}</strong> on{" "}
                <span className="num">viikolla {result.weekNum}</span>.
              </div>

              <div className="sub">
                {result.weekday} · viikko {result.weekNum}/{result.isoYearNum} ·{" "}
                {result.rangeText}.{" "}
                <span>
                  <Link
                    className="open-link"
                    to={`/viikko-${result.weekNum}-${result.isoYearNum}`}
                  >
                    avaa viikko {result.weekNum}
                  </Link>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default WeeklySearch;
