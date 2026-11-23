# Embeddable Widgets — Design Spec

4 widgets: Current Week, Holiday Countdown, Working Days, Quarter
Progress. Unlike most of this session's other proposals, this one is
genuinely low-risk and high-value as SEO — every site that embeds a
widget creates a real, earned backlink to viikkonro.fi, which is
categorically different from (and safer than) trying to rank for new
head terms.

## One real technical constraint to design around

`vercel.json` currently sets `X-Frame-Options: SAMEORIGIN` site-wide —
this **blocks iframe embedding on any other site** as it stands. That
header exists for a real reason (clickjacking protection, especially
around the contact form) and shouldn't be weakened site-wide. The fix is
scoped: a separate header rule for `/widget/(.*)` only, relaxing frame
embedding just for the widget pages, leaving every other path (including
the form) exactly as protected as it is now.

## Architecture: iframe, not a JS snippet

Two ways to build embeddable widgets — picking one and saying why:

- **iframe** (recommended): `<iframe src="https://viikkonro.fi/widget/{name}">`.
  Simple, sandboxed, no third-party JS execution risk for the embedding
  site. Matches how most small data widgets (currency, weather) work.
- **JS snippet** (`<script src=".../widget.js">`, renders into a div):
  more flexible styling for the embedder, but runs viikkonro.fi's JS
  directly on their page — a bigger trust ask of the embedder, and more
  to build (a widget runtime, not just static pages).

iframe is the better fit here: these are small, self-contained data
displays, not something an embedder needs to restyle to match their
site, and it reuses the site's existing prerendering — no new runtime.

## The 4 widgets

Each is a small, dedicated, prerendered page (same build-time generation
as every other page on the site, refreshed on the nightly cron) —
`Holiday Countdown` and `Quarter Progress` add a light client-side tick
on top of the prerendered baseline so the countdown keeps moving between
rebuilds, without needing live server data.

### 1. Current Week
- **URL**: `/widget/viikko`
- **Shows**: current ISO week number, start/end dates, days remaining in
  the week.
- **Data**: same computation as the homepage (`homeMeta()`/
  `Weekcounter.jsx`) — reused, not re-derived.

### 2. Holiday Countdown
- **URL**: `/widget/pyhat-countdown`
- **Shows**: the next upcoming public holiday, name, date, days
  remaining (client-side tick recomputes daily without a rebuild).
- **Data**: `holidaysInYear()`, filtered to the next `official: true`
  date after today.

### 3. Working Days
- **URL**: `/widget/tyopaivat`
- **Shows**: working days remaining in the current month (or year,
  configurable via `?range=month|year` query param).
- **Data**: `/data/monthly-working-days/{year}/{month}.json` or
  `/data/year/{year}.json`.

### 4. Quarter Progress
- **URL**: `/widget/vuosineljannes`
- **Shows**: current quarter (Q1-Q4), a progress bar (% of quarter
  elapsed), days remaining in the quarter.
- **Data**: `quarterStats()` (already powers `/q{1-4}-{year}`).

## Embed code

```html
<iframe
  src="https://viikkonro.fi/widget/viikko"
  width="300" height="150"
  loading="lazy"
  title="Viikko Nro – kuluva viikko"
  style="border:0;">
</iframe>
```
Same shape for all 4, `src` and `title` swapped per widget. `loading="lazy"`
and explicit `width`/`height` are both real, not decorative — they're
what stops an embedded widget from causing layout shift on the host page.

## API strategy

No new API needed — widgets read the same `/data/` feeds and computation
functions every other page already uses. The widget *page* is the
product, not a new endpoint; an embedder wanting raw data instead of a
visual widget already has the real `/api/` endpoints from
`docs/api.md`/`api-playground.md` for that.

## Branding

Every widget carries a small, persistent "viikkonro.fi" mark linking back
to the real corresponding page (e.g. Current Week widget links to
`/vuosi-{year}`, Holiday Countdown links to the specific holiday's page)
— same "subtle but present" branding language already established for
Discover images (`discoverBrandMark()`), reused rather than reinvented.
This isn't just attribution — it's the actual backlink mechanism the SEO
value depends on, so it should never be removable/optional in the embed
code.

## SEO impact

- **Real backlinks**: every site that embeds a widget links back —
  genuine off-page signal, unlike a new page trying to rank on its own.
- **The `/widget/*` pages are kept out of the sitemap**: they're embed
  targets, not content for someone to land on via search. They used to be
  `noindex` as well, until the 2026-11-23 site-wide no-noindex decision
  (`docs/noindex.md`) removed both the meta tag and the `/widget/(.*)`
  header. Sitemap exclusion through `sitemapEntries()` is now the only
  signal, so accept that an embed target may be indexed.
- **`sitemapEntries()`**: exclude `/widget/*`. A sitemap listing pages
  designed to never rank is the same category of error already avoided
  elsewhere on the site.

## Implementation checklist

- [ ] 4 new lightweight page components, no nav/footer chrome.
- [ ] `vercel.json`: scoped `frame-ancestors`/`X-Frame-Options` exception
      for `/widget/(.*)` only.
- [ ] `isIndexable()`: exclude `/widget/*`.
- [ ] `/avoin-data` or a new `/embed` section: embed-code snippets,
      copy-to-clipboard, same UX as the API Playground's code examples.
