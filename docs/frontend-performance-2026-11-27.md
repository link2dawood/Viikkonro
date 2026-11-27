# Frontend performance follow-up, 2026-11-27

## The reported problem

A Lighthouse 13.6 mobile run of `/adventti-2026`, captured 2026-11-27 on an
emulated Moto G Power over slow 4G, paints quickly and then blocks:

| Measurement | Value |
| --- | --- |
| First contentful paint | 0.9 s |
| Largest contentful paint | 0.9 s |
| Cumulative layout shift | 0.013 |
| Total blocking time | 690 ms |
| Speed index | 3.0 s |

Paint and layout stability are already good. Total blocking time and speed
index are what hold the score down, and both come from JavaScript, not from
rendering.

The run attributed 3.5 s of main-thread work, 2,169 ms of it script
evaluation, and reported ten long tasks. Two causes account for nearly all of
it.

### Third-party scripts ran during hydration

| Script | Total CPU |
| --- | --- |
| AdSense loader and `show_ads_impl` | 317 ms |
| Google FundingChoices consent message | 332 ms |
| Google Tag Manager, `gtag.js` | 143 ms |
| Microsoft Clarity | 149 ms |

That is roughly 940 ms of third-party CPU, competing with React for the main
thread while the page hydrated. `/adventti-2026` mounts no ad unit, so the
649 ms spent on AdSense and its consent message earned the page nothing.
Clarity was already deferred to idle and stays as it is.

### The critical path carried code the page never needed

`/adventti-2026` preloaded 825,697 bytes of JavaScript, 254,406 gzipped, to
render a page that states four advent Sunday dates. Two chunks were there by
accident:

- **`@sentry/react`, about 90 KB raw, inside the React chunk.** `manualChunks`
  tested `id.includes("/react/")`, which the path `node_modules/@sentry/react/`
  also satisfies. The SDK was folded into the chunk every page preloads, and
  `Sentry.init()` ran synchronously in `main.jsx` before hydration, where its
  instrumentation of timers, event listeners, fetch, XHR and history competed
  with React. Lighthouse attributed 1,043 ms of CPU to that combined chunk.
- **`data/pageJsonLd` and `data/seo`, 143,759 bytes raw in one chunk.**
  `SEO.jsx` recomputed the page's JSON-LD graph in the browser and wrote it
  into `<head>` on hydration. `prerender.js` had already written the same
  graph into the static document. Compared byte for byte against a current
  build, the two were identical on `/adventti-2026` and on week, year,
  calendar, FAQ, name-day, legal and tool pages. The browser was parsing
  109 KB of data modules to produce a string the document already held.

## What changed

### Third-party loading

`gtag.js` and the AdSense loader are now appended by their inline head blocks
after the load event, once the main thread goes idle, the pattern Clarity
already used. No third-party `<script src>` remains in the head of a generated
page.

Nothing is gated behind consent and nothing is dropped:

- The whole `gtag` command queue, including the consent default, any restored
  grant and `config`, is still built synchronously. `dataLayer` buffers it, so
  the tag replays it in order when it arrives.
- The AdSense loader URL stays a literal in `index.html`, which is what PD-19
  and the contextual crawlers read, and the certified Google CMP is still
  delivered by that same script.
- `AdSlot` calls `window.viikkonroLoadAds()` from its mount effect, so a page
  that actually mounts a unit requests the loader at the same point in the
  lifecycle as before. See `docs/adsense-placement-plan.md`.

### Sentry

`src/sentryLazy.js` imports the SDK after load, at idle, and `src/main.jsx`
no longer imports `@sentry/react` at all. The reporting window is unchanged:
`error` and `unhandledrejection` listeners are registered synchronously,
buffer up to ten errors, and replay them into Sentry when it initializes, so
failures during hydration are still reported. `hydrateRoot`'s three error
callbacks go through the same buffer.

Two bundling details matter as much as the deferral:

- `manualChunks` no longer names a chunk for `@sentry`, and does not let the
  `vendor` fallback claim it either. Naming a manual chunk for a dynamically
  imported module turns it back into a static import of that chunk, and
  `vendor` is statically imported by every page. Both attempts put the SDK
  back on the critical path; the first one also preloaded it.
- `src/sentryClient.js` re-exports `init` and `captureException` by name, and
  `sentryLazy` imports that instead of `@sentry/react`. A namespace import
  cannot be tree-shaken, because the bundler cannot know which exports the
  awaited object will be read for: `import("@sentry/react")` shipped 451,756
  bytes raw. Through the named re-export the chunk is 89,763 bytes.

The React chunk is now React, 190,326 bytes raw rather than 280,658.

### Structured data

`SEO.jsx` skips the head synchronization on the first render of a page that was
prerendered for that exact path, and imports `data/pageJsonLd` on demand
otherwise. `needsHeadSync()` in `src/data/seoDom.js` holds the rule and
`src/data/seoHeadSync.test.js` covers it. Every other case still synchronizes:
a client-side navigation, a route served from a shell document, a return to the
initial path later in the session, and a page that supplies its own `jsonLd`.

The path the document was built for is read from its canonical link at module
load, before hydration, because react-helmet-async overwrites that tag as soon
as a page mounts.

One consequence worth recording: a graph that embeds the render day, such as
the homepage's, now keeps the value the build wrote instead of being rewritten
to the visitor's day on hydration. The daily rebuild bounds the difference to
one day, and it makes the rendered graph agree with the one crawlers are
served.

### Images

The footer logo is `loading="lazy"` and `decoding="async"`. It is below the
fold on every viewport and its width and height are declared, so nothing
shifts. That removes an 18 KB download from the initial load.

## Measured result

Preloaded JavaScript on the critical path of `/adventti-2026`:

| | Before | After |
| --- | --- | --- |
| Raw | 825,697 B | 595,202 B |
| Gzipped | 254,406 B | 185,479 B |
| Chunks | 13 | 11 |

That is 28 percent less raw JavaScript to parse and evaluate and 69 KB less to
transfer, before counting the third-party work that no longer runs during
load. Other families improved by the same chunks: `/` is 638,396 raw,
`/viikko-5-2027` 605,892, `/kalenteri-2027` 616,332.

## Verification

- `npm run test:predeploy` passes: lint, 1,364 unit tests with 9 existing
  skips, the production build, 49 generated-artifact cases, the SSR rebuild and
  the rendered-link crawl over 8,224 internal URLs with no errors.
- New coverage: `src/adsenseLoader.test.js` (5 cases) and
  `src/data/seoHeadSync.test.js` (11 cases). `src/googleTag.test.js` gained
  three cases asserting that the command queue is complete before `gtag.js` is
  requested and that the tag is appended once the loaded page goes idle.
- The generated head was checked directly: `/adventti-2026` carries three
  inline head scripts and no third-party `<script src>`, while `404.html` and
  the `/liputuspaivat` redirect document carry two and no AdSense URL.
- The three inline head scripts' `sha256` values in `vercel.json` were
  recomputed from the LF form and are asserted by the release gate.

## Not done

Lighthouse also reports 29 KB of savings on the two logo images: both are
1158x244 WebP files displayed at 332x70 and 282x60. Fixing it properly means
re-encoding them at the size they are shown, and this repository has no image
encoder available, so it is left out rather than guessed at. The 829-byte SVG
versions in `public/` are not a drop-in replacement: they set the wordmark as
`<text>` in Bricolage Grotesque, which an `<img>` cannot resolve from the
document's self-hosted fonts.

The remaining first-party weight is the 270,927-byte application entry, which
holds the eager route table and the shared layout components, and the
190,326-byte React chunk. Reducing the entry means splitting the route table,
which is a larger change than this one and should be measured on its own.

## How to re-measure

The score in this document comes from a production PageSpeed run, not from a
local build. After deploying, re-run mobile and desktop PageSpeed on
`/adventti-2026` and on `/`, and confirm in a real browser that ads still
appear on a page that mounts a unit, that the Google consent message still
appears, and that a made-up asset URL does not become a Cloudflare cache hit.
