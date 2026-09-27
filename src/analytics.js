// Microsoft Clarity custom events and tags (client only).
//
// Everything goes through window.clarity, the command queue index.html
// creates before anything else — so calls made before clarity.js has loaded
// (it is deferred until the page is idle) are buffered, not lost.
//
// Funnel (build it in Clarity → Funnels, steps are custom events):
//   1. "landing"         — once per page load, tagged entry_page_type
//   2. "pdf_page_view"   — a year/calendar/week/month page (each offers a PDF)
//   3. "pdf_download"    — a PDF link was clicked (+ per-type / per-file events)
// Break any step down by the tags page_type, entry_page_type, pdf_type,
// pdf_file.

function clarity(...args) {
  if (typeof window !== "undefined" && typeof window.clarity === "function") {
    window.clarity(...args);
  }
}

// Page families, for the page_type / entry_page_type tags.
const PAGE_TYPES = [
  [/^\/$/, "etusivu"],
  [/^\/viikko-\d+-\d+$/, "viikko"],
  [/^\/kuukausi-\d+-\d+$/, "kuukausi"],
  [/^\/vuosi-\d+$/, "vuosi"],
  [/^\/kalenteri-\d+(-alkuvuosi|-loppuvuosi)?$/, "kalenteri"],
  [/^\/tulostettava-kalenteri-\d+$/, "tulostettava-kalenteri"],
  [/^\/tulosta-\d+$/, "tulosta"],
  [/^\/q[1-4]-\d+$/, "vuosineljannes"],
  [/^\/(pyhapaivat-\d+|pyhat-\d+\/.+)$/, "pyhapaivat"],
  [/^\/liputuspaivat-\d+$/, "liputuspaivat"],
  [/^\/tyopaivat-/, "tyopaivat"],
  [/^\/koululomat-\d+$/, "koululomat"],
  [/^\/palkkapaivat-\d+$/, "palkkapaivat"],
  [/^\/kesaaika-\d+$/, "kesaaika"],
  [/^\/kuinka-monta-paivaa-/, "laskuri-paivat"],
  [/^\/nimipaiv/, "nimipaivat"],
];

export function pageTypeOf(pathname) {
  for (const [re, type] of PAGE_TYPES) if (re.test(pathname)) return type;
  return "muu";
}

// "/pdf/kalenteri-2026.pdf" -> { file: "kalenteri-2026", type: "kalenteri" }
export function pdfInfo(href) {
  let path;
  try {
    path = new URL(href, "https://viikkonro.fi").pathname;
  } catch {
    return null;
  }
  const m = path.match(/^\/pdf\/(([a-z]+)-[a-z0-9-]+)\.pdf$/);
  return m ? { file: m[1], type: m[2] } : null;
}

// Events for one PDF download. The per-file event makes every file its own
// row in Clarity's custom-event list; the tags allow filtering sessions.
export function pdfDownloadEvents({ file, type }) {
  return [
    ["set", "pdf_file", file],
    ["set", "pdf_type", type],
    ["event", "pdf_download"],
    ["event", `pdf_download_${type}`],
    ["event", `pdf:${file}`],
  ];
}

// One delegated listener for every PDF link on the site (calendar, week and
// month PDFs) — present or future — instead of wiring each button. Capture
// phase so it runs before React Router or anything that stops propagation.
// auxclick covers middle-click "open in new tab".
export function trackPdfDownloads() {
  if (typeof document === "undefined") return;
  const onClick = (event) => {
    if (event.type === "auxclick" && event.button !== 1) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const info = link && pdfInfo(link.getAttribute("href"));
    if (!info) return;
    for (const args of pdfDownloadEvents(info)) clarity(...args);
  };
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);
}

// Page families that exist to offer a PDF (funnel step 2). Pages that merely
// link one — like the homepage's season block — don't count as a step, or
// every homepage visit would skip straight past it. Downloads from them are
// still counted (pdf_download, tagged with their page_type).
const PDF_PAGE_TYPES = new Set(["vuosi", "kalenteri", "tulostettava-kalenteri", "viikko", "kuukausi"]);

let landed = false;

// Called after each route renders (RouteAnalytics in AppRoutes.jsx).
// Client-side navigations stay in the same Clarity session, so the funnel
// works even while analytics cookies are denied.
export function trackPageView(pathname) {
  const type = pageTypeOf(pathname);
  clarity("set", "page_type", type);
  if (!landed) {
    landed = true;
    clarity("set", "entry_page_type", type);
    clarity("event", "landing");
  }
  if (PDF_PAGE_TYPES.has(type)) clarity("event", "pdf_page_view");
}
