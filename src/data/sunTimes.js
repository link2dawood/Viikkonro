// Sunrise/sunset for a configurable location, defaulting to Helsinki — D-03.
//
// Uses suncalc (an established solar-position implementation) rather than
// hand-rolling the astronomy, per the handoff's explicit guidance — unlike
// D-01's Easter algorithm or D-02's name-day facts, the underlying
// computation here isn't something this codebase re-derives or re-verifies;
// it's exactly what "use an established library" is for. What IS new code
// here, and so what actually needs testing, is the polar-day/polar-night
// handling and the weekly aggregation on top of suncalc's raw output.
//
// suncalc.getTimes() returns Invalid Date for sunrise/sunset on days with no
// sunrise/sunset crossing (polar day or polar night) — naively formatting
// that renders "Invalid Date" on a live page. This module turns that into
// explicit polarDay/polarNight flags instead.
//
// IMPORTANT for callers (D-05): this must be invoked at build/generation
// time, not from a client-side effect — see the handoff's "pre-computed at
// build time, not client-side" requirement. The functions here are pure and
// synchronous (safe to call from a render body, same pattern already used
// for D-01/D-02 and for Weekcounter/Home elsewhere in this codebase), but
// week/month/year routes aren't currently prerendered at all (see
// CLAUDE.md's "Dynamic routes are intentionally NOT prerendered"), so
// actually satisfying "pre-computed at build time" for those pages depends
// on whatever D-05 decides about prerendering them — not something this
// file can guarantee in isolation.

// suncalc is CommonJS with no default export - named imports only.
import { getTimes, getPosition } from "suncalc";
import { mondayOf } from "../components/dateUtils.js";

export const HELSINKI = { lat: 60.1699, lon: 24.9384, name: "Helsinki" };
// Finland's northernmost municipality, well north of the Arctic Circle
// (66.5°N) - used for the explicit polar day/night tests the handoff asks
// for. Coordinates and polar-day/night windows verified against independent
// sources (checked 2026-07-23): kaamos (polar night) 26 Nov-15 Jan,
// midnight sun 17 May-28 Jul.
export const UTSJOKI = { lat: 69.9086, lon: 27.0272, name: "Utsjoki" };

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Sunrise/sunset/daylight for one calendar date at a location. `sunrise` and
// `sunset` are null (never Invalid Date) when the location has no
// sunrise/sunset crossing that day; polarDay/polarNight say which.
export function sunTimesForDate(date, location = HELSINKI) {
  const { lat, lon } = location;

  // Calculate solar position using a probe at midday (12:00 UTC) for the
  // civil calendar date (y, m, d). Passing a local midnight instant causes
  // positive-offset timezones (e.g. Europe/Helsinki UTC+2/+3, Asia/Karachi UTC+5)
  // to fall on the previous UTC date, shifting sunrise/sunset calculations to
  // the previous civil day (Finding 3 fix).
  let y, m, d;
  if (typeof date === "string") {
    const parts = date.split("-").map(Number);
    y = parts[0];
    m = parts[1] - 1;
    d = parts[2];
  } else {
    y = date.getFullYear();
    m = date.getMonth();
    d = date.getDate();
  }
  const probe = new Date(Date.UTC(y, m, d, 12, 0, 0));
  const times = getTimes(probe, lat, lon);

  const sunriseValid = times.sunrise && !isNaN(times.sunrise.getTime());
  const sunsetValid = times.sunset && !isNaN(times.sunset.getTime());

  if (sunriseValid && sunsetValid) {
    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      daylightMinutes: Math.round((times.sunset - times.sunrise) / 60000),
      polarDay: false,
      polarNight: false,
    };
  }

  // No crossing today. solarNoon is a pure position calculation (not a
  // threshold crossing), so it's always a valid instant - use the sun's
  // altitude there to tell polar day (sun up all day) from polar night
  // (sun down all day).
  const noonAltitude = getPosition(times.solarNoon, lat, lon).altitude;
  const isPolarDay = noonAltitude > 0;

  return {
    sunrise: null,
    sunset: null,
    daylightMinutes: isPolarDay ? 24 * 60 : 0,
    polarDay: isPolarDay,
    polarNight: !isPolarDay,
  };
}

// The 7 days (Monday–Sunday) of ISO week `week` in ISO year `isoYear`, each
// with sunTimesForDate's fields plus the change in daylight minutes from the
// previous calendar day. daylightMinutes is always a number (0 for polar
// night, 1440 for polar day), so the delta is always computable too.
export function sunTimesForWeek(isoYear, week, location = HELSINKI) {
  const monday = mondayOf(week, isoYear);
  const days = [];
  let prevDaylight = sunTimesForDate(addDays(monday, -1), location).daylightMinutes;

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const today = sunTimesForDate(date, location);
    days.push({
      date,
      ...today,
      deltaMinutesFromPreviousDay: today.daylightMinutes - prevDaylight,
    });
    prevDaylight = today.daylightMinutes;
  }

  return days;
}

// Formats a sunrise/sunset instant in Europe/Helsinki, with correct DST
// handling, regardless of the machine's own local timezone — important
// because this is meant to be pre-computed at build time, and build
// machines (Docker/CI) typically default to UTC, not Europe/Helsinki.
export function formatHelsinkiTime(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  }).format(date);
}
