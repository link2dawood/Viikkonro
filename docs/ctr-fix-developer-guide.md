# Viikkonro CTR fix: developer guide

Nov 3, 2026 · @Dawood Zafar

## Overview

Three title templates leave about 555 clicks per month on the table at positions that already rank on page one. The fix is metadata only: no ranking work, no new pages. Data is Search Console, 3 Oct to 31 Oct 2026, checked against `main` at commit `e43a82e`.

| Template | Function | Impressions (28d) | CTR now | Missed clicks (28d) | Target CTR |
| --- | --- | --- | --- | --- | --- |
| Week pages `/viikko-N-YYYY` | `weekMeta` in `src/data/seo.js` | about 60k | 0.2% to 0.6% | about 280 | at least 1.0% |
| Clock change `/kesaaika-YYYY` | `dstMeta` in `src/data/dstPages.js` | 89k | 0.2% | about 135 | next season |
| Holidays `/pyhat-YYYY/slug` and observances | `holidayPageMeta`, `observanceMeta` | about 70k | 0.0% to 0.3% | about 140 | at least 0.8% |

The three causes differ, so each phase fixes one:

- **Week pages** use `vuonna`, which breaks the exact query phrase `viikko 46 2026`, and give no reason to click beyond dates Google already shows.
- **Clock change** leads with `Talviaika` while people search `kellojen siirto 2026`, and goes stale 30 days after the October change.
- **Holidays** answer the whole question in the title, so the SERP satisfies the searcher.

Success means target CTR reached within 14 days of each deploy, average position no worse by more than 0.5, and Google showing our titles rather than rewrites.

## Setup and conventions

Each phase ships as its own branch and PR, a few days apart, so the CTR change can be attributed.

```bash
git checkout main && git pull
git checkout -b fix/ctr-phase-0-dst     # then fix/ctr-phase-1-week, fix/ctr-phase-2-holidays
npm ci
npm test                                # vitest, must stay green
npm run build                           # runs prerender.js, writes dist/
```

Title rules every change must keep:

1. **60 characters maximum**, brand included. `weekMeta.test.js` already enforces this for every week 2020 to 2035; add the same loop for any template you touch.
2. **Brand suffix is exactly `| Viikko Nro`.** `dstPages.js` currently says `| Viikkonro`, which is a typo.
3. **Separator is `:`**, not `–`. Date ranges from `fmtRangeCompactFi` keep their range dash.
4. **Exact query phrase first**: write `Viikko 46 2026`, not `Viikko 46 vuonna 2026`. Same reasoning as the existing `monthMeta` comment.
5. **Only promise what the page renders.** `metaPromises.test.js` exists for this; extend it when a hook names new content.
6. **No relative time words** like `nyt` or `tällä viikolla` in titles. Google caches titles for days, so they go stale in the SERP even though the site rebuilds nightly.

All titles flow through one place: `prerender.js` calls the URL dispatcher in `src/data/seo.js` (week pages at line 1342, clock change at 1362), which calls the meta function. Change the meta function and both the static `<head>` and the hydrated `<SEO>` tag follow.

## Phase 0: clock change page

Ship today. One file, about 30 minutes, and it fixes a bug that would put a 2026 page title about a past March change into the SERP from 25 Nov.

**File:** `src/data/dstPages.js`, function `dstMeta` (line 47). **Branch:** `fix/ctr-phase-0-dst`.

### What changes

1. **Title leads with the query.** `kellojen siirto 2026` (25.6k impressions) and `kellojen siirto syksy 2026` (10.7k) are what people type, not `Talviaika`.
2. **After the change, the title names the next one**, because that is what a searcher in November wants.
3. **Brand typo** `| Viikkonro` becomes `| Viikko Nro`.
4. **Stale season bug.** `autumnFirst` is bounded by `autumnFocusEnds = end + 30 days`. From 25 Nov the current year falls back to the spring title `kesäaika alkaa`, which describes 29 Mar 2026. Autumn wording must hold until 31 Dec.
5. **Season is a pure helper** so tests stop inferring it from title words.

### Code

```js
// src/data/dstPages.js
export function dstSeason(year, now = new Date()) {
  const { start } = dstChanges(year);
  const buildDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return year === now.getFullYear() && buildDate > start.date ? "autumn" : "spring";
}

export function dstMeta(year, now = new Date()) {
  const { start, end } = dstChanges(year);
  const buildDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

  if (dstSeason(year, now) === "autumn") {
    const changePassed = buildDate >= end.date;
    const next = dstChanges(year + 1).start.date;
    const title = changePassed
      ? `Kellojen siirto ${year}: ${dm(end.date)}, seuraava ${dm(next)} | Viikko Nro`
      : `Kellojen siirto ${year}: talviaika ${dm(end.date)} | Viikko Nro`;
    const tail = changePassed
      ? `Kesäaika alkaa ${dm(next)}${next.getFullYear()}.`
      : `Kesäaika alkoi ${dm(start.date)}`;
    return {
      title,
      description: `Milloin kelloja siirretään? Talviaika ${year} ${changePassed ? "alkoi" : "alkaa"} ${WD_ESSIVE[end.date.getDay()]} ${dm(end.date)} klo 4.00. Kelloja ${changePassed ? "siirrettiin" : "siirretään"} tunti taaksepäin klo 3.00:een. ${tail}`,
    };
  }
  // spring branch unchanged
}
```

Expected output on a 3 Nov 2026 build:

```
Kellojen siirto 2026: 25.10., seuraava 28.3. | Viikko Nro              (57 chars)
Milloin kelloja siirretään? Talviaika 2026 alkoi sunnuntaina 25.10. klo 4.00.
Kelloja siirrettiin tunti taaksepäin klo 3.00:een. Kesäaika alkaa 28.3.2027.
```

### Tests (`src/data/dstPages.test.js`)

- Replace the exact title assertion (`Talviaika 2026: kellojen siirto 25.10. | Viikkonro`) with `Kellojen siirto 2026: talviaika 25.10. | Viikko Nro` for the 15 Oct build.
- Add a 3 Nov build case: title equals the 57 character string above; description contains `28.3.2027`; description length stays 140 to 160.
- Rewrite the boundary table to assert `dstSeason(2026, now)` instead of `title.includes("talviaika")`, keep the four existing rows, and add `[new Date(2026, 11, 1), true]` and `[new Date(2026, 11, 31), true]`.
- Add a loop: for years 2024 to 2032 and builds on the 1st of every month, `title.length <= 60` and `title` starts with `Kellojen siirto`.

### Done when

- `npm test` is green and `dist/kesaaika-2026.html` contains the new `<title>` after `npm run build`.
- No `Viikkonro` string remains: `grep -rn "| Viikkonro" src prerender.js` returns nothing.

## Phase 1: week page titles

Ship by Thu 5 Nov so week 46 and 47 titles are recrawled while they are searched. This is the biggest lever: about 280 missed clicks per 28 days across about 200 indexable URLs.

**File:** `src/data/seo.js`, function `weekMeta` (line 191). **Branch:** `fix/ctr-phase-1-week`.

### New format

```
Viikko {w} {y} ({range}): {hook} | Viikko Nro
```

| Part | Rule | Source |
| --- | --- | --- |
| `Viikko {w} {y}` | Exact query phrase, no `vuonna` | arguments |
| `{range}` | Same year: `fmtDayRangeFi(mo, su)` gives `9.-15.11.`. Cross year: `${fmtShortFi(mo)}-${fmtShortFi(su)}` gives `28.12.2026-3.1.2027` | `src/components/dateUtils.js` |
| `{hook}` priority 1 | Confirmed school holiday week: `syyslomaviikko`, `hiihtolomaviikko` | `schoolPeriods[0].type` (already computed in `weekMeta`) |
| `{hook}` priority 2 | Holidays and flag days in the week, mapped through `TITLE_HOOKS`, deduped, at most 2 | `holidaysInWeekForPrerender`, `flagDaysInWeekForPrerender` in `src/data/pageJsonLd.js` |
| `{hook}` fallback | `päivät ja PDF` | every week page renders dates and links its PDF |

The hook map is a whitelist. Long official names such as `Mikael Agricolan päivä / Suomen kielen päivä` never reach a title, and related days collapse into one word.

### Code

```js
// src/data/seo.js
import { holidaysInWeekForPrerender, flagDaysInWeekForPrerender } from "./pageJsonLd.js";
import { fmtDayRangeFi, fmtShortFi } from "../components/dateUtils.js";

const TITLE_MAX = 60;
const BRAND = " | Viikko Nro";
const TITLE_HOOKS = {
  "Uudenvuodenpäivä": "uudenvuodenpäivä",
  "Loppiainen": "loppiainen",
  "Pitkäperjantai": "pääsiäinen",
  "1. pääsiäispäivä": "pääsiäinen",
  "2. pääsiäispäivä": "pääsiäinen",
  "Vappu": "vappu",
  "Äitienpäivä": "äitienpäivä",
  "Helatorstai": "helatorstai",
  "Helluntai": "helluntai",
  "Juhannusaatto": "juhannus",
  "Juhannuspäivä": "juhannus",
  "Pyhäinpäivä": "pyhäinpäivä",
  "Isänpäivä": "isänpäivä",
  "Itsenäisyyspäivä": "itsenäisyyspäivä",
  "Jouluaatto": "joulu",
  "Joulupäivä": "joulu",
  "Tapaninpäivä": "joulu",
};

function weekTitleHooks(w, y, schoolPeriods) {
  if (schoolPeriods.length) return [`${schoolPeriods[0].type}viikko`];
  const names = [
    ...holidaysInWeekForPrerender(y, w),
    ...flagDaysInWeekForPrerender(y, w),
  ]
    .sort((a, b) => a.date - b.date)
    .map((d) => TITLE_HOOKS[d.name])
    .filter(Boolean);
  return [...new Set(names)].slice(0, 2);
}

function weekTitle(w, y, mo, su, hooks) {
  const range = mo.getFullYear() === su.getFullYear()
    ? fmtDayRangeFi(mo, su)
    : `${fmtShortFi(mo)}-${fmtShortFi(su)}`;
  const base = `Viikko ${w} ${y} (${range})`;
  const candidates = [
    hooks.length ? `${base}: ${hooks.join(", ")}` : null,
    hooks.length > 1 ? `${base}: ${hooks[0]}` : null,
    `${base}: päivät ja PDF`,
    base,
  ].filter(Boolean);
  return candidates.map((t) => t + BRAND).find((t) => t.length <= TITLE_MAX);
}

export function weekMeta(w, y) {
  // ...existing mo, su, schoolPeriods, schoolWeekText...
  return {
    title: weekTitle(w, y, mo, su, weekTitleHooks(w, y, schoolPeriods)),
    description: /* unchanged */,
  };
}
```

Before you commit, check that `fmtShortFi` returns `29.12.2025` (day, month, year). If it returns a different shape, build the cross-year range from `getDate()`, `getMonth()` and `getFullYear()` directly.

### Expected output

```
48 Viikko 1 2026 (29.12.2025-4.1.2026) | Viikko Nro
56 Viikko 8 2026 (16.-22.2.): hiihtolomaviikko | Viikko Nro
52 Viikko 14 2026 (30.3.-5.4.): pääsiäinen | Viikko Nro
51 Viikko 19 2026 (4.-10.5.): äitienpäivä | Viikko Nro
49 Viikko 25 2026 (15.-21.6.): juhannus | Viikko Nro
54 Viikko 41 2026 (5.-11.10.): päivät ja PDF | Viikko Nro
56 Viikko 42 2026 (12.-18.10.): syyslomaviikko | Viikko Nro
56 Viikko 43 2026 (19.-25.10.): syyslomaviikko | Viikko Nro
55 Viikko 44 2026 (26.10.-1.11.): pyhäinpäivä | Viikko Nro
49 Viikko 45 2026 (2.-8.11.): isänpäivä | Viikko Nro
54 Viikko 46 2026 (9.-15.11.): päivät ja PDF | Viikko Nro
60 Viikko 49 2026 (30.11.-6.12.): itsenäisyyspäivä | Viikko Nro
47 Viikko 52 2026 (21.-27.12.): joulu | Viikko Nro
49 Viikko 53 2026 (28.12.2026-3.1.2027) | Viikko Nro
49 Viikko 1 2027 (4.-10.1.): loppiainen | Viikko Nro
```

Generated by running the code above against the repo data at `e43a82e` (character count first). Across every week of 2026 and 2027 the longest title is 60 characters and none overflow. Week 1 loses `uudenvuodenpäivä` because the cross-year range leaves no room; that is the length guard working as intended.

Reprint the list with `node -e` over weeks 1 to 53 of 2026 and 2027 and read it before committing. Any title that reads oddly is a map entry to fix, not an exception to code around.

### Tests (`src/data/weekMeta.test.js`)

- **Exact title test:** delete the week 43 assertion (`"Viikko 43 vuonna 2026 – 19.–25.10.2026 | Viikko Nro"`); week 43 2026 is a syysloma week and now gets `syyslomaviikko`. Add `expect(weekMeta(41, 2026).title).toBe("Viikko 41 2026 (5.-11.10.): päivät ja PDF | Viikko Nro")`. Week 41 contains Aleksis Kiven päivä, which is deliberately not in `TITLE_HOOKS`, so this also proves the whitelist.
- **Prefix regex** in the 2020 to 2035 loop: `^Viikko ${week} ${year} \(`. Keep the 60 character and uniqueness assertions as they are.
- **New Year test:** expect `29.12.2025-4.1.2026` and `28.12.2026-3.1.2027` (plain hyphen).
- **New cases:** week 45 2026 title contains `isänpäivä`; week 42 2026 contains `syyslomaviikko`; week 52 2026 contains `joulu` exactly once; no title contains `vuonna`, an en dash, or `Agricolan`.
- **`keywordMeta.test.js` line 55:** the comment says week titles keep the old en dash format. Drop that exception and add `weekMeta(46, 2026)` to the en dash loop.

### Leave the H1 alone

`src/pages/WeekDays.jsx` line 270 renders `Viikko {week} vuonna {year}`. Keep it: it reads naturally, and the title still contains `Viikko 46 2026`, so Google has no reason to rewrite the title. Only rename the test `aligns the title with the H1` to `leads the title with the exact query phrase`.

### Done when

- `npm test` is green.
- `dist/viikko-45-2026.html` and `dist/viikko-53-2026.html` contain the expected `<title>` after `npm run build`.
- The `og:title` and `twitter:title` in the same files match the new `<title>` (`prerender.js` copies `meta.title`, so they should).

## Phase 2: holiday and observance titles

Ship by Sat 28 Nov, ahead of itsenäisyyspäivä (3.9k impressions, position 5.0), loppiainen 2027 (4.3k, position 5.1) and äitienpäivä 2027 (1.3k, position 2.8). Expect a smaller gain than Phase 1: on date questions Google's answer box takes most clicks, and titles only recover part of it.

**Files:** `src/data/holidayPages.js` (`holidayPageMeta`, line 270) and `src/data/observanceDays.js` (`observanceMeta`, line 284). **Branch:** `fix/ctr-phase-2-holidays`.

### Current output

| Page | Title now | Chars |
| --- | --- | --- |
| `/pyhat-2026/itsenaisyyspaiva` | `Itsenäisyyspäivä 2026 – 6.12.2026, viikko 49 \| Viikko Nro` | 57 |
| `/pyhat-2027/loppiainen` | `Loppiainen 2027 – 6.1.2027, viikko 1 \| Viikko Nro` | 49 |
| `/pyhat-2026/pyhainpaiva` | `Pyhäinpäivä 2026 – 31.10.2026, viikko 44 \| Viikko Nro` | 53 |
| `/isanpaiva-2026` | `Isänpäivä 2026: su 8.11., viikko 45 \| Viikko Nro` | 48 |
| `/aitienpaiva-2027` | `Äitienpäivä 2027: su 9.5., viikko 18 \| Viikko Nro` | 49 |

Holiday titles repeat the year, use the en dash separator and leave out the weekday, which is what people check for long weekends. Observance titles are already in the right shape but give no reason to click.

### Holiday detail pages (`holidayPageMeta`, generic branch only)

Match the observance format: weekday plus short date, `:` separator. Leave the `vappu` and `paasiaispaiva` branches as they are.

```js
// src/data/holidayPages.js, replaces the generic return
const wdm = (d) => `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
return {
  title: `${page.seoName} ${page.year}: ${wdm(page.date)}, viikko ${page.week} | Viikko Nro`,
  description, // unchanged
};
```

`WEEKDAY_SHORT` is the two letter lowercase form (`su`, `ma`). `observanceDays.js` line 61 already builds it as `WD[d.getDay()].slice(0, 2).toLowerCase()`; move that `wdm` helper to `src/components/dateUtils.js` and import it in both files instead of duplicating it.

Result: `Itsenäisyyspäivä 2026: su 6.12., viikko 49 | Viikko Nro` (55 chars).

### Observance pages (`observanceMeta`)

Add a hook that names sections `src/pages/ObservanceDay.jsx` already renders: `Perinteet` (line 140) and `Onko … liputuspäivä?` (line 121). Fall back to the current title when the hook does not fit.

```js
// src/data/observanceDays.js, inside observanceMeta, non-laskiainen branch
const withHook = `${page.name} ${page.year}: ${wdm(page.date)}, perinteet ja liputus | Viikko Nro`;
const plain = `${page.name} ${page.year}: ${wdm(page.date)}, viikko ${page.week} | Viikko Nro`;
const title = page.flagDay && withHook.length <= 60 ? withHook : plain;
```

Check the real field name for the flag day flag on `page` before using it; `ObservanceDay.jsx` line 125 renders `page.flagDay` as text, so it may be a sentence rather than a boolean. Pages that are not flag days (ystävänpäivä, adventti) keep the plain title.

Result: `Isänpäivä 2026: su 8.11., perinteet ja liputus | Viikko Nro` (59 chars).

### Pyhäinpäivä split (ranking, not CTR)

`/pyhat-2026/pyhainpaiva` and the hub `/pyhapaivat-2026` shared 56k impressions for `pyhäinpäivä 2026`, both around position 10. The hub already links each holiday (`PublicHolidays.jsx` line 82), but the anchor is the bare name.

1. Change the anchor to `{h.name} {year}` so the link text carries the full query.
2. Leave the hub title alone: `Suomen pyhäpäivät 2026` targets the list query, not single holidays.
3. Re-check this split in Search Console after October 2027. If both pages still sit below position 8, consider trimming the hub row to date only and moving the rule text to the detail page.

### Tests

- `src/data/holidayPages.test.js`: for every slug in `HOLIDAY_DEFINITIONS` and years 2026 to 2030, `title.length <= 60`, no en dash, title matches `/^.+ \d{4}: [a-z]{2} \d{1,2}\.\d{1,2}\./` for the generic branch. Exact string for `itsenaisyyspaiva` 2026.
- `src/data/keywordMeta.test.js` already checks `holidayPageMeta(2027, "paasiaispaiva")` for en dashes; add `holidayPageMeta(2026, "itsenaisyyspaiva")`.
- Observance: exact strings for `isanpaiva` 2026 and `aitienpaiva` 2027; `ystavanpaiva` 2027 keeps the plain format.
- `src/data/metaPromises.test.js`: add `perinteet` and `liputus` as promises that observance pages must render.

### Done when

- `npm test` is green.
- `dist/pyhat-2026/itsenaisyyspaiva.html` and `dist/isanpaiva-2026.html` carry the new `<title>`.

## Release, verification and measurement

Each phase follows the same five steps. Space the merges at least 3 days apart so each change has its own clean window in Search Console.

| Phase | Merge by | Measure on | Pages to watch |
| --- | --- | --- | --- |
| 0: clock change | Tue 3 Nov | Tue 17 Nov | `/kesaaika-2026` |
| 1: week pages | Thu 5 Nov | Thu 19 Nov | `^https://viikkonro\.fi/viikko-\d+-\d{4}$` |
| 2: holidays and observances | Sat 28 Nov | Sat 12 Dec | `/pyhat-\d{4}/`, `/(isanpaiva\|aitienpaiva\|laskiainen\|ystavanpaiva\|adventti)-\d{4}$` |

### Steps per phase

1. **Predeploy check.** Run `npm run test:predeploy` (lint, tests, full build, artifact cases, crawl check). Merge only when it is green.
2. **Spot check the build.** `grep -o "<title>[^<]*</title>" dist/viikko-45-2026.html` and the equivalent file for the phase. Check `og:title` matches.
3. **Merge to `main`.** Vercel deploys on push. The 22:05 UTC cron rebuild then refreshes date-dependent titles nightly, which the clock change title relies on.
4. **Verify live past Cloudflare.** Fetch the raw `*.vercel.app` deployment URL and the live domain, and compare `<title>`. If they differ, purge the Cloudflare cache for that path; query string cache busting does not work on this stack.
5. **Ask Google to recrawl and annotate.** Inspect and request indexing for 3 to 5 representative URLs in Search Console, and add a Search Console note with the commit hash and template name on the deploy date.

### Reading the result on day 14

Compare the 14 days after the deploy with the 14 days before, filtered to the phase's page pattern, in Search Console or with `npm run check:traffic`.

- **Pass:** CTR at or above the target in the overview table, and average position no worse by more than 0.5.
- **Title rewrites:** search `site:viikkonro.fi viikko 46 2026` and compare the SERP title to ours. If Google rewrites more than a few, the title has drifted too far from the H1 or the page content.
- **Seasonality:** week pages lose and gain impressions as weeks pass, so judge CTR, not clicks.

### Rollback

Each phase is one function plus its tests. `git revert <commit>` and push; the next Vercel deploy restores the old titles. Google picks up the revert at its next crawl of each URL, usually within a few days.

## Out of scope and decisions

These came up during the analysis and are deliberately not part of this work.

| Decision | Reason |
| --- | --- |
| Homepage title stays as is | `mikä viikko nyt on` (71.8k impressions) is zero-click: Google shows the week number itself. The current title already leads with the query and the live answer. |
| No `nyt` in the current week's title | Google caches titles for days, so the SERP would label a finished week as current. |
| No FAQ schema work for CTR | Google stopped showing FAQ rich results for sites like this in 2023, which is why Search Console reports no search appearances. Keep the JSON-LD for AI indexes. |
| Week page H1 keeps `vuonna` | Natural Finnish, and the title still contains the exact phrase. |
| `/tulosta-YYYY` and `/tulostettava-kalenteri-YYYY` both stay | Different intents: printable week list versus printable calendar. Not duplicates. |
| PDF cannibalization needs no code | `vercel.json` already sends `X-Robots-Tag: noindex` on PDFs; it clears as Google recrawls. |
| `Talviaika` title lead reversed | It was a deliberate earlier choice, but Search Console now shows `kellojen siirto 2026` and `kellojen siirto syksy 2026` as the dominant queries. |
| Uudenvuodenpäivä absent from week 1 titles | The cross-year date range uses the space; accepted rather than shortening the range. |

Open question: should `TITLE_HOOKS` include Kalevalan päivä and J. L. Runebergin päivä? Both are flag days with modest search volume; add them only if Search Console shows week queries that name them.
