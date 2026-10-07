# CLAUDE.md

This file gives Claude Code the repository-specific rules needed to change
Viikkonro safely. Keep it aligned with the code whenever commands, deployment,
or major architecture change.

## Required reading

Before changing routing, page content, metadata, structured data,
`prerender.js`, `vercel.json`, or anything under `/data/`, `/pdf/`, `/og/`,
`/discover/`, or the AI-facing files in `public/`, read
[`docs/SEO_CONSTITUTION.md`](docs/SEO_CONSTITUTION.md).

The constitution is the source of truth for URL stability, schema coverage,
internal linking, sitemap output, PDF and image discoverability, hreflang, and
AI-facing resources. If a request requires weakening an invariant, explain the
specific tradeoff and obtain an explicit user decision before implementing it.

## Content rules

- Do not add the en dash character to page copy, titles, descriptions, FAQs,
  schema, AI-facing text, or comments. Use punctuation, Finnish conjunctions,
  or a plain hyphen where appropriate. Remove an existing en dash from any
  content line you edit.
- Compute dates, counts, ISO weeks, and examples from real data. Verify factual
  editorial claims against an official source and record the source and review
  date in the relevant data module.
- Keep visible FAQ text and `FAQPage` JSON-LD sourced from the same function.
- Give each indexable page a distinct intent, useful visible content, a
  self-canonical, appropriate schema, sitemap eligibility, and crawlable
  internal links.
- Do not add unsupported freshness claims. A build date is not an editorial
  review date.
- `/en` is the only English route. Other user-facing pages are Finnish. Do not
  add English deep-page alternates without a real equivalent page and an
  explicit product decision.

## What this repository is

Viikko Nro (`viikkonro.fi`) is a Finnish ISO 8601 week-number, calendar, and
date-utility site built with React, React Router, and Vite. It is a hydrated SPA
whose indexable routes are prerendered to static HTML. There is no runtime
application server. The contact form posts from the browser to Web3Forms.

Vercel serves the static output and Cloudflare fronts the production domain.

## Commands

- `npm run dev`: start the Vite development server.
- `npm run build`: build the client and temporary SSR bundle, then run the full
  prerender and asset generation pipeline.
- `npm run build:spa`: build only the client bundle.
- `npm run preview`: serve `dist/` locally.
- `npm run lint`: run ESLint.
- `npm test`: run the complete Vitest unit and component suite.
- `npm run test:predeploy:artifacts`: test an existing production build in
  `dist/` with the generated-artifact cases.
- `npm run test:predeploy`: run the required release gate: lint, unit tests,
  production build, generated-artifact tests, SSR rebuild, and crawl checks.
- `npm run check:crawl`: crawl rendered internal links. It requires both
  `dist/` and `dist-server/`. The main build removes `dist-server/`, so use the
  predeployment command unless debugging the crawl directly.
- `npm run check`: verify Search Console access with the configured credentials.
- `npm run report:seo-growth`: create a read-only Search Console comparison
  report. It requires Search Console credentials and never submits a sitemap.

The generated-artifact cases are documented in
[`docs/predeployment-test-cases.md`](docs/predeployment-test-cases.md).

## Architecture

### Rendering

`src/main.jsx` mounts `AppRoutes` inside `BrowserRouter` for browser hydration.
`src/entry-server.jsx` mounts the same routes inside `StaticRouter` for the
build-time render used by `prerender.js`.

Production does not run an SSR server. `prerender.js` writes flat HTML files
such as `dist/ukk.html`. This matches `cleanUrls` and the no-trailing-slash
canonical convention. `vercel.json` intentionally has no SPA fallback for
unknown public routes, so an unsupported path returns the generated 404 page.

The dated resource horizon starts at `PRERENDER_MIN_YEAR` and ends at
`PRERENDER_MAX_YEAR` in `src/components/dateUtils.js`. Pages outside the
indexable year window remain prerendered and directly accessible but receive
`noindex` and stay out of the sitemap.

### Routes

Static paths are declared in `src/AppRoutes.jsx`. Dated Finnish paths use
single-segment keyword slugs such as `/viikko-42-2026`,
`/kuukausi-10-2026`, `/vuosi-2026`, and `/kalenteri-2026`. The `/:slug`
catch-all validates and dispatches those shapes. Two-segment families such as
`/pyhat-2026/joulupaiva`, `/nimipaiva/aapeli`, and `/nimipaivat/01-02` have
their own routes.

Do not introduce an alternate slug for existing content. Preserve old paths
with permanent redirects in `vercel.json`.

### SEO and data

Shared metadata and URL policy live primarily in `src/data/seo.js`:
`routeMeta`, metadata builders, `canonicalFor()`, and `sitemapEntries()`.
Page-specific facts and sources belong in their data modules. ISO week and date
logic belongs in `src/components/dateUtils.js`; reuse it instead of
reimplementing week math.

`src/data/sitemapMetadata.js` controls sitemap `lastmod` values. Daily answers
use the render day, reviewed content uses a recorded review date, and unknown
dates are omitted. Never infer a modification date from the year in a URL.

Visible FAQs and schema must share the same data functions. `prerender.js`
assembles per-route JSON-LD and guarantees an indexable page has a WebPage or
more specific page node. New page families must be added to the relevant
route, metadata, schema, sitemap, internal-link, and AI-file generators listed
in the SEO constitution.

### Generated output

The full build creates:

- prerendered HTML and `404.html`;
- `sitemap.xml` with indexable HTML and image entries;
- JSON data feeds and calendar subscriptions;
- OG and Discover images;
- calendar, week, and month PDFs;
- `llms-full.txt`, its companion files, `ai-manifest.txt`, and the knowledge
  graph.

PDFs are downloadable assets, not sitemap entries. Every generated PDF must
remain visibly linked from its HTML page, represented in schema, exposed by a
`rel="alternate"` link, and served with the matching HTML canonical in an HTTP
`Link` response header. The three canonical header mappings live in
`vercel.json`.

### Planning platform

`src/platform/` is the shared foundation for the calendar and planning tools:
calendar configuration, events, the month model, branding, themes, layouts,
ICS/CSV/XLSX exports, the product catalogue and the planner registry. It sits on
`src/data/dayRules.js`, which defines which days count per mode. Read
[`docs/planning-platform.md`](docs/planning-platform.md) before adding a
planner, an export or a paid product. It adds no URLs; any new page still
follows the SEO constitution.

### Client bundles

`vite.config.js` separates React, React Router, and other vendor modules into
stable client chunks. The SSR build uses its own server bundle. Do not assume a
client-only build proves that prerendering, schema, sitemap, PDFs, or generated
AI files still work.

## Testing and pull requests

Run the narrowest useful tests while developing. Before requesting review for
changes that affect SEO, routing, build output, metadata, or deployment, run:

```sh
npm run test:predeploy
```

The `Predeployment tests` GitHub Actions workflow runs the same command on pull
requests to `main`. It has read-only repository permissions and does not deploy,
submit sitemaps, or request indexing.

The `main` branch requires changes through a pull request and requires review.
The repository does not allow merge commits, so use the permitted squash merge
flow after checks and review pass. Do not bypass the PR workflow for routine
changes.

This workspace is frequently opened from Windows through WSL. Git stores text
files with LF endings, while editor-wide CRLF conversion can make hundreds of
untouched files appear modified. Inspect diffs with line-ending noise in mind,
stage explicit intended paths, and never use `git add -A` in a noisy workspace.
Do not discard unrelated working-tree changes.

## Deployment

Vercel's GitHub integration builds and deploys each accepted push to `main`
using the command and output directory in `vercel.json`. Vite embeds `VITE_*`
variables at build time. `SITE_ORIGIN` and `VITE_WEB3FORMS_ACCESS_KEY` belong in
the Vercel project environment, not in source control.

Cloudflare must use Full (strict) TLS. It must not keep HTML or `sitemap.xml`
stale across the daily rebuild. Fingerprinted `/assets/*` files may be cached
aggressively, but Cloudflare must not cache 404 responses under `/assets/`.
After a JavaScript-changing deployment, verify the production site in a real
browser and confirm that a made-up asset URL does not become a Cloudflare cache
hit.

`.github/workflows/vercel-rebuild.yml` triggers the daily rebuild that refreshes
current-week metadata. `.github/workflows/week-check.yml` checks the live week
and freshness independently. `.github/workflows/sitemap-on-deploy.yml` waits for
the matching production deployment before checking and submitting the sitemap.
Search Console jobs use `GCP_SA_KEY`; the service account needs access to the
`sc-domain:viikkonro.fi` property.

## Contact form

`src/pages/ContactUs.jsx` submits directly to Web3Forms. It includes a honeypot,
a minimum-fill-time check, and local-storage rate limiting. The Web3Forms access
key is designed for client use and can deliver only to the preverified address.
