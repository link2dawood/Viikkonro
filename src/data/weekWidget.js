// Embeddable current-week widget (/widget/viikko) — see
// docs/embeddable-widgets.md. The widget document is NOT a React route: it's
// a tiny standalone HTML file written by prerender.js (inline CSS + a few
// lines of inline JS), so embedding it costs the host page almost nothing.
// The build-time week is baked in as a no-JS fallback; the inline script
// recomputes the ISO week on load and hourly, so an iframe left open across
// midnight on Sunday still turns over without a rebuild.
//
// /widget/* is noindex (X-Robots-Tag in vercel.json + meta robots here) and
// kept out of sitemapEntries(): it's an embed target, not a landing page.
// The "viikkonro.fi" link inside it is the backlink the feature exists for —
// deliberately not optional in the embed code.
import { fmtShortFi, isoWeek, isoYear, mondayOf } from "../components/dateUtils.js";

export const WIDGET_EMBED_PAGE_PATH = "/upota-viikkonumero";
export const WEEK_WIDGET_PATH = "/widget/viikko";
export const WIDGET_WIDTH = 300;
export const WIDGET_HEIGHT = 150;

export const WIDGET_THEMES = [
  { id: "vaalea", label: "Vaalea" },
  { id: "tumma", label: "Tumma" },
];

export function widgetSrc(siteUrl, theme) {
  return `${siteUrl}${WEEK_WIDGET_PATH}${theme && theme !== "vaalea" ? `?teema=${theme}` : ""}`;
}

export function widgetEmbedCode(siteUrl, theme) {
  return `<iframe src="${widgetSrc(siteUrl, theme)}" width="${WIDGET_WIDTH}" height="${WIDGET_HEIGHT}" loading="lazy" title="Viikko Nro – kuluva viikkonumero" style="border:0;max-width:100%"></iframe>`;
}

export const widgetEmbedMeta = {
  title: "Viikkonumero-widget omalle sivullesi | Viikko Nro",
  description:
    "Upota kuluva viikkonumero omalle verkkosivullesi ilmaisella widgetillä. Kopioi yksi iframe-rivi – viikko päivittyy automaattisesti joka maanantai.",
};

export const WIDGET_EMBED_STEPS = [
  "Valitse widgetin teema (vaalea tai tumma).",
  "Kopioi upotuskoodi painikkeella Kopioi koodi.",
  "Liitä koodi sivusi HTML-koodiin kohtaan, jossa viikkonumeron halutaan näkyvän.",
];

export function widgetFaqs() {
  return [
    {
      q: "Maksaako viikkonumero-widget jotain?",
      a: "Ei. Widget on ilmainen, eikä sen käyttö vaadi rekisteröitymistä tai API-avainta.",
    },
    {
      q: "Päivittyykö widgetin viikkonumero itsestään?",
      a: "Kyllä. Widget laskee ISO 8601 -viikkonumeron kävijän laitteella ja vaihtuu automaattisesti maanantaina.",
    },
    {
      q: "Toimiiko widget WordPressissä?",
      a: "Kyllä. Lisää sivulle tai sivupalkkiin Mukautettu HTML -lohko ja liitä upotuskoodi siihen.",
    },
    {
      q: "Kerääkö widget tietoja kävijöistä?",
      a: "Ei. Widget ei käytä evästeitä, analytiikkaa eikä mainoksia, eikä se lähetä tietoja mihinkään.",
    },
  ];
}

// Inline script: same ISO-week rule as dateUtils.isoWeek(), restated in
// ~10 lines because the widget must not load the site's bundle.
const widgetScript = (siteUrl) => `(function(){
var p=new URLSearchParams(location.search);if(p.get("teema")==="tumma")document.documentElement.className="dark";
function f(d){return d.getDate()+"."+(d.getMonth()+1)+"."+d.getFullYear()}
function u(){var n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate()),g=(t.getDay()+6)%7;
var th=new Date(t);th.setDate(t.getDate()-g+3);var y=th.getFullYear(),j=new Date(y,0,4);
var w=1+Math.round(((th-j)/864e5-3+((j.getDay()+6)%7))/7);var mo=new Date(t);mo.setDate(t.getDate()-g);
var su=new Date(mo);su.setDate(mo.getDate()+6);
document.getElementById("w").textContent=w;document.getElementById("r").textContent=f(mo)+" – "+f(su);
document.getElementById("a").href=${JSON.stringify(siteUrl)}+"/viikko-"+w+"-"+y}
u();setInterval(u,36e5)})();`;

export function weekWidgetHtml(siteUrl, now) {
  const week = isoWeek(now);
  const year = isoYear(now);
  const mo = mondayOf(week, year);
  const su = new Date(mo);
  su.setDate(mo.getDate() + 6);
  return `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, follow" />
<title>Viikko ${week} – Viikko Nro</title>
<link rel="canonical" href="${siteUrl}/" />
<style>
:root{--bg:#ffffff;--ink:#15211f;--soft:#56655f;--accent:#1f7a5c;--line:rgba(21,33,31,.12)}
.dark{--bg:#15211f;--ink:#f3f7f5;--soft:#b5c4be;--accent:#7fd3b0;--line:rgba(255,255,255,.14)}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;justify-content:center;padding:14px 18px;overflow:hidden;position:relative}
.k{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--soft)}
.n{font-size:44px;font-weight:800;line-height:1.05;color:var(--accent)}
.n span{font-size:20px;font-weight:700;color:var(--ink)}
.r{font-size:14px;color:var(--soft);margin-top:2px}
a.b{position:absolute;right:12px;bottom:10px;font-size:12px;color:var(--soft);text-decoration:none}
a.b:hover{color:var(--accent);text-decoration:underline}
</style>
</head>
<body>
<div class="k">Kuluva viikko</div>
<div class="n"><span>Vk</span> <b id="w">${week}</b></div>
<div class="r" id="r">${fmtShortFi(mo)} – ${fmtShortFi(su)}</div>
<a class="b" id="a" href="${siteUrl}/viikko-${week}-${year}" target="_blank" rel="noopener">viikkonro.fi</a>
<script>${widgetScript(siteUrl)}</script>
</body>
</html>
`;
}
