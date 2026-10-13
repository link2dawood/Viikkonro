# Frontend performance follow-up, 2026-10-13

Public pages now load as separate browser chunks. `virtual:route-page` resolves
to an eager module registry for SSR and tests, and a lazy registry for the client.
The same React Router route table chooses the initial module before hydration,
including dated slugs and named template exports. An initial visit retains its
complete HTML; subsequent navigation uses a Suspense boundary.

The Vite client manifest supplies each prerendered route's static dependencies,
CSS and module preloads. It deliberately excludes other routes and on-demand
imports such as pdfkit. Page CSS is present in the initial document, so styling
does not depend on hydration. Calendar, daylight-saving, countdown, payment and
preview-ad rules have moved out of the global stylesheet. The base stylesheet
is imported from `main.jsx`, independently of the Home page.

The navigation badge, date and daylight-saving clock now use mono weight 500.
The 600 face is no longer declared, saving its 15,620-byte download on pages
that previously needed both medium weights. The versioned font asset remains
available for older cached HTML. Bricolage's optical-size axis is retained.

The consent banner remains in prerendered HTML and is revealed before paint.
Its copy is shorter and `data-nosnippet` excludes this shared interface from
search-result snippets. Consent storage, reopening and both choices are preserved.

## Verification

The measured client application entry is 188,569 bytes raw, excluding framework
and shared chunks. The two shared stylesheet assets total 27,977 bytes raw.
Route-specific styles and code are additional only on their matching pages.

- The full `npm run test:predeploy` gate passes: 1,102 tests, 9 existing skips,
  37 artifact cases, complete prerendering and no rendered-link crawl errors.
- Route tests compare preloaded client markup with eager SSR and cover dated,
  named, static and invalid routes. Artifact checks verify route preloads,
  complete content and initial route CSS.
- Browser regressions cover direct visits, client navigation, CSS and interactive
  controls, plus existing mobile cases at 320, 390, 768 and 1280 pixels.

## Production baseline before merging

The fresh [PageSpeed report](https://pagespeed.web.dev/analysis/https-viikkonro-fi/jzkduk3y2k)
was captured at 19:49 Asia/Karachi on 2026-10-13. It measures the existing
production deployment, not this pending PR.

| Measurement | Mobile | Desktop |
| --- | --- | --- |
| Lighthouse performance | 84 | 100 |
| Lab FCP | 3.0 seconds | 0.6 seconds |
| Lab LCP | 3.7 seconds | 0.7 seconds |
| Lab total blocking time | 20 ms | 10 ms |
| Field FCP | 1.2 seconds | 0.8 seconds |
| Field LCP | 1.3 seconds | 1.0 seconds |

Field Core Web Vitals pass for both device classes. Field TTFB is unavailable in
this report. The field readings are historical, not an immediate deployment test.

Two consecutive requests to a made-up asset returned real 404 responses with
Cloudflare `MISS` both times. Vercel itself returned `MISS`, then `HIT`, and the
existing broad asset header applies an immutable lifetime to that missing URL.
The Cloudflare check passes, but these are not evidence of uncached Vercel 404s.

After the squash merge and its production deployment, repeat real-browser
checks, the same two-request asset probe and PageSpeed. PR #70 currently needs
an independent review; repository auto-merge is disabled. Do not bypass either
the review requirement or the Git integration with a separate production deploy.

The eager SSR design follows React's documented
[renderToString limitation](https://react.dev/reference/react-dom/server/renderToString#when-a-component-suspends-the-html-always-contains-a-fallback).
The registries use Vite's documented
[glob imports](https://vite.dev/guide/features.html#glob-import).
