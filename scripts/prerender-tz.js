// Imported FIRST by prerender.js (ES modules evaluate in import order), so
// every module-level and render-time `new Date()` during the build sees
// Finnish local time. Vercel's build machines run in UTC: the nightly rebuild
// fires just after midnight in Helsinki, when UTC is still on the previous
// day — without this, Monday's rebuild baked in last week's number.
process.env.TZ = "Europe/Helsinki";
