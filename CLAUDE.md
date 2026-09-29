# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Before any task touching routing, page content, structured data, `prerender.js`, `vercel.json`, or anything under `/data/`, `/pdf/`, `/og/`, `/discover/`, or the AI-facing text files in `public/`, read [`docs/SEO_CONSTITUTION.md`](docs/SEO_CONSTITUTION.md) first.** It names the exact mechanisms (URL structure, schema coverage, internal linking, sitemap, PDF/image discoverability, AI-facing files) that must survive any change, and what "preserve" means for each in this specific codebase.

## Writing rules for page content

- **Never use the en dash character (`–`) in any new or edited writing**: page copy, titles, meta descriptions, FAQ answers, schema text, AI-facing text files, or code comments. Rewrite the sentence instead (a colon, a comma, "ja", or a plain hyphen `-` in ranges like `A-K`). Existing copy is not bulk-rewritten, but any line you touch should lose its `–`.
- New content must be unique and high quality: every number and date computed from real data or verified against an official source (cite it in a comment with the check date), never generic filler shared across page families.
- Follow semantic SEO: headings and copy built around the main keyword and its related entities and questions, `FAQPage` content that answers real queries, and proper internal links (each new page links to its related pages and is linked back from them, the footer, and relevant hubs).

## What this is

"Viikko Nro" (viikkonro.fi) — a Finnish-language ISO 8601 week-number calculator built as a React SPA (Vite + React Router). All UI copy is in Finnish. There is no backend; the contact form posts directly to Web3Forms from the client.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — full production build: client build → SSR build (`entry-server.jsx`) → `node prerender.js`. This is what Vercel runs; use it to verify prerendering/SEO output, not just the app.
- `npm run build:spa` — client-only build, skips SSR/prerendering (fast path if you only need to check the SPA bundles)
- `npm run preview` — serve the built `dist/` locally
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm test` — Vitest (`holidays.test.js`, `nameDays.test.js`, `schoolHolidays.test.js`, `sunTimes.test.js` under `src/data/`)
- `npm run check` / `npm run check:crawl` — `src/cli.js` (Search Console permission check / sitemap submission) and `scripts/check-crawl.js`, both plain-Node, not part of the client bundle

## Architecture

**Hybrid SPA + prerendering (no SSR server at runtime).** There are two separate render entry points that both mount the same router-agnostic `AppRoutes`:
- `src/main.jsx` → `App.jsx` (wraps `AppRoutes` in `BrowserRouter`) — normal client hydration.
- `src/entry-server.jsx` — wraps `AppRoutes` in `StaticRouter`, used only at build time.

**Routes are single-segment Finnish keyword slugs**, not `/word/:param/:param` — e.g. `/viikko-30-2026`, `/kuukausi-7-2026`, `/vuosi-2026`, `/kalenteri-2026[-alkuvuosi|-loppuvuosi]`, `/tulosta-2026`, `/pyhapaivat-2026`, `/tyopaivat-2026`, `/tulostettava-kalenteri-2026`. React Router can't parse two params inside one path segment, so `AppRoutes.jsx` routes every unmatched single segment to a `/:slug` catch-all (`DynamicSlug`) that regex-dispatches to the right page component; static routes (`/ukk`, `/tietoa-meista`, …) still outrank it. `vercel.json` 301-redirects the old `/week/:week/:year`-style and English routes to these. Old `/sv/*` (Swedish pilot, retired) paths also 301 to their Finnish equivalents there.

`prerender.js` runs after both builds finish: it imports the SSR bundle and calls `render(url)` for **every** route in `sitemapEntries()` — not just static pages, but every `/viikko-*`, `/kuukausi-*`, `/vuosi-*`, `/kalenteri-*` etc. across a rolling 2020..currentYear+9 horizon — injecting per-route `<title>`, meta description, canonical URL, Open Graph/Twitter tags, BreadcrumbList JSON-LD, and (for `/ukk`, `/mika-on-viikkonumero`, `/pyhapaivat-*`, and the four calculator pages) FAQPage/Article/Event/HowTo JSON-LD, into `dist/<route>.html` (flat files, not `<route>/index.html`, to avoid directory-index redirect conventions that would conflict with the no-trailing-slash convention `canonicalFor()` declares). It also generates `dist/sitemap.xml`, `dist/llms-full.txt`, `dist/404.html`, and build-time OG PNGs (`@vercel/og`), then deletes the temporary `dist-server/` SSR bundle so it never ships. Pages outside a rolling indexable window (`currentYear-2`..`currentYear+4`) stay prerendered but are marked `noindex` and dropped from the sitemap, so a long tail of near-duplicate year pages doesn't dilute the site's ranking.

**vercel.json has no rewrites/SPA-fallback configured.** Because virtually every reachable route is prerendered to a real file by `prerender.js`, a path outside the prerendered horizon isn't a client-rendered guess — it's a genuine 404 (Vercel's static-output convention of serving `dist/404.html`).

**SEO/GEO metadata is centralized in `src/data/seo.js`**: `routeMeta` (per-route title/description/breadcrumb), `canonicalFor()`, and `sitemapEntries()`. `index.html` additionally carries global JSON-LD (`WebSite`/`Organization`/`WebApplication`/`FAQPage` schema.org graph) that should stay in sync with `src/data/faqs.js`. `CONTENT_UPDATED`/`CONTENT_UPDATED_FI` in `seo.js` is a hand-bumped (not build-time) date used for both the visible "Päivitetty" line and `dateModified` in structured data on evergreen content pages, so the two never disagree.

**Date/week logic lives in `src/components/dateUtils.js`** — ISO week/year calculations (`isoWeek`, `isoYear`, `weeksInIsoYear`, `mondayOf`), plus Finnish date/weekday formatters (`dShort`, `dWritten`, `dFull`, `formatShort`, `formatLong`, `fmtFullFi`, `WD`/`WEEKDAYS`, `M_FULL`, `M_SHORT`). All week-number pages and components should use these rather than reimplementing ISO week math. It's plain `.js` (not `.jsx`) specifically so plain-Node scripts (`prerender.js`, `src/data/seo.js`) can import it directly with an explicit `.js` extension — `src/data/holidays.js` imports it *without* the extension, which only Vite's resolver (not plain Node) can handle, so anything `prerender.js` needs from `holidays.js`-style logic must be duplicated inline (see `prerender.js`'s own `holidaysInYearForPrerender`), not imported.

**Pages vs. components**: `src/pages/*` are route-level screens (one per `AppRoutes.jsx` route); `src/components/*` are shared building blocks (`Navbar`, `Footer`, `Weekcounter`, `WeeklySearch`, `WeeksOfMonth`, `YearsWeek`, `QuickLinks`, `FAQ`, `WeekCard`, `Information`) composed into `Home.jsx` and other pages.

**Build chunking** (`vite.config.js`): manual chunks split `react`/`react-dom`/`scheduler` into a `react` chunk, `react-router*` into a `router` chunk, and everything else from `node_modules` into `vendor`, for long-term browser caching. This only applies to the client build — the SSR build uses default (single-bundle) output.

## Deployment

**Vercel, behind Cloudflare** — there is no Docker image, no self-hosted server, and no SSH deploy step; those were retired. Vercel's own GitHub integration builds (`npm run build`) and deploys on every push to `main` (`vercel.json`: `buildCommand`, `outputDirectory: "dist"`, `installCommand: "npm install --include=dev"`). `VITE_WEB3FORMS_ACCESS_KEY` and `SITE_ORIGIN` are configured as Vercel project environment variables (Vite bakes `VITE_*` vars into the bundle at build time, so they can't be supplied at runtime — a GitHub Actions secret of the same name would only affect the retired Docker build, not this one).

**Cloudflare sits in front of Vercel** — two things that will silently break if misconfigured, neither visible from this repo alone: (1) SSL/TLS mode must be **Full (strict)**, not Flexible, or requests loop between Cloudflare and Vercel; (2) Cloudflare's edge cache must NOT hold `sitemap.xml` or the HTML pages for long — the whole point of the nightly `vercel-rebuild.yml` cron is same-day freshness on the homepage's current-week title, and a multi-hour edge TTL defeats that silently (no error, just stale content). `/assets/*` (fingerprinted, immutable per `vercel.json`'s own headers) is the one thing that's safe to cache aggressively at the edge. `prerender.js` writes flat files (`dist/ukk.html`, not `dist/ukk/index.html`) specifically so `cleanUrls`/`trailingSlash: false` don't produce a redirect loop through Cloudflare — verify this periodically with `curl -I` **through the live domain**, not just `*.vercel.app`, since Cloudflare's edge behavior isn't reproducible by hitting Vercel directly.

**Cloudflare must not cache 404s under `/assets/`.** `vercel.json` sends `Cache-Control: public, max-age=31536000, immutable` for `/assets/(.*)`, and Vercel applies it to 404 responses too. On 2026-09-28 a deploy switchover briefly 404'd the new main bundle, Cloudflare cached that 404, and the site lost all JavaScript for most visitors until the URL was purged. A Cloudflare Cache Rule (URI path starts with `/assets/`, status 404 not cached) now prevents it; verify with a made-up `/assets/x.js` URL requested twice (the second must not be `cf-cache-status: HIT`). After any deploy that changes JS, check the live site in a real browser, not just `curl`, which can land on a healthy edge node.

Search Console automation (all use the `GCP_SA_KEY` secret, whose service account must be an **Owner** of the `sc-domain:viikkonro.fi` property in Search Console, or every call fails with "insufficient permission"): `sitemap-on-deploy.yml` waits for the Vercel deploy of each push to `main` and submits the sitemap (fails visibly); `gsc-stability-check.yml` checks traffic and indexing daily; `weekly-seo-report.yml` emails a report every Monday (`scripts/seo-report.js`, needs the `SMTP_*` and `REPORT_EMAIL_TO` secrets) including the known backlinks listed in `seo/backlinks.txt` (`scripts/check-backlinks.js`).

`.github/workflows/vercel-rebuild.yml` additionally triggers a Vercel deploy hook once a day (cron, plus manual `workflow_dispatch`) so the current-week `<title>`/`<meta description>` baked into the homepage never goes stale between code pushes, then best-effort submits `sitemap.xml` to Search Console (`src/cli.js submit-sitemap`) — carried over from the retired Docker-era `deploy.yml`. `.github/workflows/week-check.yml` independently verifies the *live* site shows the correct ISO week and was rebuilt recently, deliberately run on GitHub's infra (not Vercel) so a wedged build can't silently disable its own alarm.

## Contact form

`src/pages/ContactUs.jsx` posts directly to the Web3Forms API with no backend. It implements its own client-side anti-spam: a honeypot field, a minimum-fill-time trap (3s), and a `localStorage`-based rate limiter (cooldown + rolling-window cap). The Web3Forms access key is safe to expose client-side (it can only deliver mail to the pre-verified address).
