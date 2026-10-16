# Redirect Audit — Viikkonro.fi

Read-only, no code changed. Every finding cites exact file:line; every
behavioral claim (matching, precedence, overlap) was tested against the
real `path-to-regexp` library (what Vercel's redirect engine uses), not
assumed.

---

## 1. Where redirect rules live

- **`vercel.json`**: 23 rules, `vercel.json:8-30` (the `redirects` array).
  This is the *only* declarative redirect mechanism in the project.
- **Middleware**: none. No `middleware.js`/`middleware.ts` exists at the
  project root (checked directly — the project has no Vercel Edge
  Middleware at all).
- **Route handlers**: none in the server sense — this is a static site,
  no API routes. There **is** one client-side, non-HTTP redirect inside
  React Router: `<Navigate>` at `src/AppRoutes.jsx:126` — flagged
  separately below since it doesn't return any HTTP status at all (it's
  a post-hydration JS redirect), and is explicitly *not* how the
  equivalent server-visible redirect for the same URL is implemented
  (see §2).
- **Server configuration**: none exists (`CLAUDE.md`: "no Docker image,
  no self-hosted server" — confirmed, no `server.js`/Express config
  anywhere in the repo).

## 2. Does every redirect return HTTP 301?

**22 of 23 declarative rules: yes.** Every single line in
`vercel.json:8-30` has `"statusCode": 301` written explicitly — verified
by direct inspection, not sampling.

**One additional redirect-*like* mechanism is deliberately not a 301,
and is outside `vercel.json` entirely** — worth surfacing since the
audit asked specifically about "every redirect":

- `/liputuspaivat` (no year) → `/liputuspaivat-{currentYear}`.
  Implemented as a **0-delay `<meta http-equiv="refresh">`** plus a
  canonical tag pointing at the target (`prerender.js:2595-2606`),
  **not** an HTTP 301. The code comment at `prerender.js:2583-2594`
  explains why deliberately: Google documents meta-refresh + canonical
  as SEO-equivalent to a real redirect, and unlike a 301 it still works
  from a client-rendered context. A **second**, separate mechanism for
  the same URL — React Router's `<Navigate to={...} replace />` at
  `src/AppRoutes.jsx:124-127` — handles in-app SPA navigation to this
  path, but per the comment at `src/AppRoutes.jsx:121-123`, "never runs
  for a crawler or a fresh page load," so it's not what a crawler or a
  fresh visitor ever actually hits.
  **Finding**: this is a reasoned, documented exception, not an
  oversight — but it does mean the literal claim "every redirect
  returns HTTP 301" is false for this one URL if it's counted as a
  redirect. Flagging rather than silently excluding it from the count.

## 3. Redirect table

| # | Source | Destination | Status | Type |
|---|---|---|---|---|
| 1 | `/week/:week/:year` | `/viikko-:week-:year` | 301 | Permanent, param passthrough |
| 2 | `/month/:month/:year` | `/kuukausi-:month-:year` | 301 | Permanent, param passthrough |
| 3 | `/year/:year` | `/vuosi-:year` | 301 | Permanent, param passthrough |
| 4 | `/print/:year` | `/tulosta-:year` | 301 | Permanent, param passthrough |
| 5 | `/pdfs/:file` | `/pdf/:file` | 301 | Permanent, param passthrough |
| 6 | `/api/week/:week/:year.json` | `/data/week/:year/:week.json` | 301 | Permanent, param reorder |
| 7 | `/api/month/:month/:year.json` | `/data/month/:year/:month.json` | 301 | Permanent, param reorder |
| 8 | `/api/year/:year.json` | `/data/year/:year.json` | 301 | Permanent, param passthrough |
| 9 | `/api/holiday/:slug/:year.json` | `/data/holiday/:year/:slug.json` | 301 | Permanent, param reorder |
| 10 | `/kalenteri-:y(\d+)-1` | `/kalenteri-:y-alkuvuosi` | 301 | Permanent, slug rename |
| 11 | `/kalenteri-:y(\d+)-2` | `/kalenteri-:y-loppuvuosi` | 301 | Permanent, slug rename |
| 12 | `/what-is-a-week-number` | `/mika-on-viikkonumero` | 301 | Permanent, i18n slug |
| 13 | `/weeks-in-a-year` | `/kuinka-monta-viikkoa-vuodessa` | 301 | Permanent, i18n slug |
| 14 | `/about-us` | `/tietoa-meista` | 301 | Permanent, i18n slug |
| 15 | `/contact-us` | `/ota-yhteytta` | 301 | Permanent, i18n slug |
| 16 | `/faq` | `/ukk` | 301 | Permanent, i18n slug |
| 17 | `/privacy-policy` | `/tietosuoja` | 301 | Permanent, i18n slug |
| 18 | `/terms-and-conditions` | `/kayttoehdot` | 301 | Permanent, i18n slug |
| 19 | `/sv/vecka-:w(\d+)-:y(\d+)` | `/viikko-:w-:y` | 301 | Permanent, retired-locale |
| 20 | `/sv/veckor-:y(\d+)` | `/vuosi-:y` | 301 | Permanent, retired-locale |
| 21 | `/sv/helgdagar-:y(\d+)` | `/pyhapaivat-:y` | 301 | Permanent, retired-locale |
| 22 | `/sv` | `/` | 301 | Permanent, retired-locale fallback |
| 23 | `/sv/:path*` | `/` | 301 | Permanent, retired-locale catch-all |
| — | `/liputuspaivat` | `/liputuspaivat-{currentYear}` | **200** + meta-refresh | Soft redirect (deliberate, see §2) |

All 23 numbered rows verified against the real `path-to-regexp` matcher
(methodology at the bottom); row 24 verified by direct code reading.

## 4. Do redirected (source) URLs leak into live content?

Checked all 23 source patterns against sitemap, hreflang, canonical,
nav, footer, and structured data.

- **`sitemap.xml`**: built entirely from `sitemapEntries()`
  (`src/data/seo.js:811-954`) plus PDF urlsets in `prerender.js` — both
  construct paths from the *current* naming scheme (`/viikko-`,
  `/kuukausi-`, etc.) directly; neither reads or transforms any of the
  23 legacy source patterns. Zero overlap by construction, not by
  filtering.
- **hreflang**: none — English was removed 2026-10-15, so
  `languageAlternateLinks()` was deleted from `prerender.js` and no page
  emits `hreflang` tags. No `/sv/*`, `/en`, or any other redirect source
  ever appears in an hreflang tag.
- **canonical**: every page's canonical is `canonicalFor(url)` for its
  *own current* `url` (see the indexing audit, finding #3, same
  mechanism) — there is no code path that could produce a canonical
  pointing at a legacy path, since canonicals are only ever generated
  for the `routes` list built from the current sitemap/route scheme,
  never from `vercel.json`'s source patterns.
- **nav / footer**: read every `<Link to=...>` in
  `src/components/Navbar.jsx` and `src/components/Footer.jsx` directly
  — 11 links total, all to current canonical paths (`/`, `/laskurit`,
  `/mika-on-viikkonumero`, `/kuinka-monta-viikkoa-vuodessa`,
  `/avoin-data`, `/tietoa-meista`, `/ota-yhteytta`, `/kayttoehdot`,
  `/tietosuoja`). Zero legacy-path links.
- **structured data**: grepped `prerender.js` for `/week/`, `/month/`,
  `/year/` (three of the legacy source prefixes) — every match found is
  the *current*, canonical `/data/week/`, `/data/month/`, `/data/year/`
  JSON-feed family (e.g. `prerender.js:2953-2996`'s `datasetNodes()`
  entries) — a **different, real, non-redirected URL family** (`/data/
  week/2026/32.json`, not the legacy `/week/32/2026`). No false positive
  once distinguished; zero actual leaks.
- **Automated regression coverage already exists for `/sv`**:
  `src/data/seoLanguages.test.js:4-16` is a real Vitest test asserting
  `sitemapEntries()` never contains a `/sv` or `/sv/*` path, and that
  `metaFor()`/`breadcrumbTrail()` return `null` for `/sv`,
  `/sv/veckor-2026`, `/sv/vecka-32-2026` — this is a standing regression
  guard, not something this audit had to check manually only once.

**Finding: zero leaks across all six surfaces.**

## 5. Codebase-wide search for the 7 requested strings

| String | Matches (excluding `vercel.json` itself and `node_modules`) |
|---|---|
| `/week/` | None |
| `/month/` | None |
| `/year/` | None |
| `/sv/` | `src/data/seoLanguages.test.js:8,12,13` — a test *asserting absence*, not a leak (see §4) |
| `/about-us` | None |
| `/terms-and-conditions` | None |
| `/weeks-in-a-year` | None |

One adjacent, worth-noting non-match: `/pdfs/` (the legacy plural)
appears once outside `vercel.json`, at `src/data/seo.js:574`, but only
inside a **code comment** explicitly documenting that the site uses
singular `/pdf/`, not `/pdfs/` — a correctness note, not a reference to
the legacy path.

## 6. Redirect chains

**None found.** Checked every one of the 23 destinations against all 23
sources: no destination is itself a source of another rule. Every
redirect is exactly one hop (A → B), never A → B → C. This also means
Vercel never has to internally resolve a multi-step redirect for any
URL in this table — each is resolved in a single lookup.

## 7. Redirect loops

**None found** — a direct consequence of §6: a loop requires at least
one destination to also be a source (so the chain can eventually cycle
back); since zero destinations are sources, no cycle is possible.

**One overlap worth noting (not a bug)**: `/sv` (row 22) and
`/sv/:path*` (row 23) both match the bare input `/sv` — verified
directly (`:path*`'s zero-or-more semantics matches an empty remainder).
Vercel evaluates `redirects` in array order and applies the first
match, so row 22 wins for that exact input; row 23 only ever actually
fires for `/sv/something`. Not a defect: both rules redirect to the
identical destination (`/`), so which one "wins" for bare `/sv`
produces no behavioral difference — but it's real, confirmed overlap,
and the order (specific rules at rows 19-22 before the generic
catch-all at row 23) is what prevents it from mattering.

---

## Summary

- 24 real HTTP 301s, all verified (23 original + `/en` → `/`, added 2026-10-15 when English was removed).
- 1 additional soft-redirect (`/liputuspaivat`) that's intentionally not
  a 301 — a documented, reasoned exception, flagged rather than silently
  included or excluded.
- 0 chains, 0 loops, 0 leaks into sitemap/hreflang/canonical/nav/footer/
  schema.
- 1 pre-existing automated test already guards the `/sv` retirement
  specifically.
- 1 harmless rule overlap (`/sv` vs `/sv/:path*` for the bare-`/sv`
  case), inert because both rules share a destination and are correctly
  ordered.

## Methodology

- All 23 `vercel.json` patterns tested directly against the real
  `path-to-regexp` v6 library (installed standalone in a scratch
  directory, not assumed to behave a certain way) — same verification
  standard used for this site's `/api/` aliases and the prior indexing
  audit.
- Every "zero matches" claim above is a real `grep -rn` across `src/`,
  `prerender.js`, `public/`, and `index.html`, not an assumption from
  memory of earlier reads.
- Chain/loop analysis is a direct cross-reference of all 23 sources
  against all 23 destinations, not a sampled check.
