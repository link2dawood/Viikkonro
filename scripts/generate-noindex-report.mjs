import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sitemapEntries, isIndexable, extractYearFromPath, SITE_URL } from "../src/data/seo.js";
import { helsinkiYear } from "../src/components/dateUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const currentYear = helsinkiYear();

const patterns = [
  {
    pattern: "/viikko-[n]-[year]",
    match: (p) => /^\/viikko-\d+-(\d{4})$/.test(p),
    sampleIn: `/viikko-1-${currentYear}`,
    sampleOut: "/viikko-1-2024",
  },
  {
    pattern: "/pyhat-[year]/*",
    match: (p) => /^\/pyhat-(\d{4})\/.+$/.test(p),
    sampleIn: `/pyhat-${currentYear}/vappu`,
    sampleOut: "/pyhat-2024/vappu",
  },
  {
    pattern: "/pyhapaivat-[year]",
    match: (p) => /^\/pyhapaivat-(\d{4})$/.test(p),
    sampleIn: `/pyhapaivat-${currentYear}`,
    sampleOut: "/pyhapaivat-2024",
  },
  {
    pattern: "/tyopaivat-[month]-[year]",
    match: (p) => /^\/tyopaivat-[a-z]+-(\d{4})$/.test(p),
    sampleIn: `/tyopaivat-tammikuu-${currentYear}`,
    sampleOut: "/tyopaivat-tammikuu-2024",
  },
  {
    pattern: "/tyopaivat-[year]",
    match: (p) => /^\/tyopaivat-(\d{4})$/.test(p),
    sampleIn: `/tyopaivat-${currentYear}`,
    sampleOut: "/tyopaivat-2024",
  },
  {
    pattern: "/kuukausi-[m]-[year]",
    match: (p) => /^\/kuukausi-\d+-(\d{4})$/.test(p),
    sampleIn: `/kuukausi-1-${currentYear}`,
    sampleOut: "/kuukausi-1-2024",
  },
  {
    pattern: "/q[n]-[year]",
    match: (p) => /^\/q\d+-(\d{4})$/.test(p),
    sampleIn: `/q1-${currentYear}`,
    sampleOut: "/q1-2024",
  },
  {
    pattern: "/kalenteri-[year]",
    match: (p) => /^\/kalenteri-(\d{4})$/.test(p),
    sampleIn: `/kalenteri-${currentYear}`,
    sampleOut: "/kalenteri-2024",
  },
  {
    pattern: "/kalenteri-[year]-alku/loppuvuosi",
    match: (p) => /^\/kalenteri-(\d{4})-(alkuvuosi|loppuvuosi)$/.test(p),
    sampleIn: `/kalenteri-${currentYear}-alkuvuosi`,
    sampleOut: "/kalenteri-2024-alkuvuosi",
  },
  {
    pattern: "/vuosi-[year]",
    match: (p) => /^\/vuosi-(\d{4})$/.test(p),
    sampleIn: `/vuosi-${currentYear}`,
    sampleOut: "/vuosi-2024",
  },
  {
    pattern: "/tulosta-[year]",
    match: (p) => /^\/tulosta-(\d{4})$/.test(p),
    sampleIn: `/tulosta-${currentYear}`,
    sampleOut: "/tulosta-2024",
  },
  {
    pattern: "/tulostettava-kalenteri-[year]",
    match: (p) => /^\/tulostettava-kalenteri-(\d{4})$/.test(p),
    sampleIn: `/tulostettava-kalenteri-${currentYear}`,
    sampleOut: "/tulostettava-kalenteri-2024",
  },
  {
    pattern: "/koululomat-[year]",
    match: (p) => /^\/koululomat-(\d{4})$/.test(p),
    sampleIn: `/koululomat-${currentYear}`,
    sampleOut: "/koululomat-2024",
  },
  {
    pattern: "/liputuspaivat-[year]",
    match: (p) => /^\/liputuspaivat-(\d{4})$/.test(p),
    sampleIn: `/liputuspaivat-${currentYear}`,
    sampleOut: "/liputuspaivat-2024",
  },
  {
    pattern: "/palkkapaivat-[year]",
    match: (p) => /^\/palkkapaivat-(\d{4})$/.test(p),
    sampleIn: `/palkkapaivat-${currentYear}`,
    sampleOut: "/palkkapaivat-2024",
  },
  {
    pattern: "/kelan-maksupaivat-[year]",
    match: (p) => /^\/kelan-maksupaivat-(\d{4})$/.test(p),
    sampleIn: `/kelan-maksupaivat-${currentYear}`,
    sampleOut: "/kelan-maksupaivat-2024",
  },
  {
    pattern: "/elakkeen-maksupaivat-[year]",
    match: (p) => /^\/elakkeen-maksupaivat-(\d{4})$/.test(p),
    sampleIn: `/elakkeen-maksupaivat-${currentYear}`,
    sampleOut: "/elakkeen-maksupaivat-2024",
  },
  {
    pattern: "/kuun-vaiheet-[year]",
    match: (p) => /^\/kuun-vaiheet-(\d{4})$/.test(p),
    sampleIn: `/kuun-vaiheet-${currentYear}`,
    sampleOut: "/kuun-vaiheet-2024",
  },
  {
    pattern: "/kesaaika-[year]",
    match: (p) => /^\/kesaaika-(\d{4})$/.test(p),
    sampleIn: `/kesaaika-${currentYear}`,
    sampleOut: "/kesaaika-2024",
  },
  {
    pattern: "/[holiday/event]-[year]",
    match: (p) => /^\/(itsenaisyyspaiva|joulu|uusi-vuosi|loppiainen|joululoma)-(\d{4})$/.test(p),
    sampleIn: `/joulu-${currentYear}`,
    sampleOut: "/joulu-2024",
  },
  {
    pattern: "/[observance]-[year]",
    match: (p) => /^\/[a-z0-9-]+-(\d{4})$/.test(p) && !/^\/(vuosi|tulosta|tyopaivat|pyhapaivat|liputuspaivat|kalenteri|tulostettava-kalenteri|koululomat|palkkapaivat|kelan-maksupaivat|elakkeen-maksupaivat|kuun-vaiheet|kesaaika|itsenaisyyspaiva|joulu|uusi-vuosi|loppiainen|joululoma)-\d{4}$/.test(p),
    sampleIn: `/aiti-ja-isainpaiva-${currentYear}`,
    sampleOut: "/aiti-ja-isainpaiva-2024",
  },
  {
    pattern: "/ (homepage)",
    match: (p) => p === "/",
    sampleIn: "/",
    sampleOut: null,
  },
  {
    pattern: "/[non-year-tools]",
    match: (p) => p !== "/" && extractYearFromPath(p) === null,
    sampleIn: "/viikonpaiva",
    sampleOut: null,
  },
];

const allEntries = sitemapEntries(currentYear);

const rows = [
  "url_pattern,example_url,year,robots_value,in_sitemap,approx_count",
];

for (const def of patterns) {
  const matching = allEntries.filter((e) => def.match(e.path));
  const inWindow = matching.filter((e) => isIndexable(e.path, currentYear));
  const outWindow = matching.filter((e) => !isIndexable(e.path, currentYear));

  if (outWindow.length > 0) {
    const yearOut = "2020-2024,2029-2035";
    rows.push(
      `"${def.pattern}","${SITE_URL}${def.sampleOut}","${yearOut}","noindex,follow",false,${outWindow.length}`,
    );
  }
  if (inWindow.length > 0) {
    const yearIn = def.sampleOut === null ? "all" : `${currentYear - 1}-${currentYear + 2}`;
    rows.push(
      `"${def.pattern}","${SITE_URL}${def.sampleIn}","${yearIn}","index,follow",true,${inWindow.length}`,
    );
  }
}

const csvContent = rows.join("\n") + "\n";
fs.writeFileSync(path.join(root, "noindex-report.csv"), csvContent);
console.log(`Generated noindex-report.csv (${rows.length - 1} pattern summary rows).`);
