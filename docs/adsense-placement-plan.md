# AdSense placement plan

Publisher: `ca-pub-5553975522423673`.

Status: the account wiring ships, and one manual desktop unit is live as of
2026-10-23. What is in the repository:

| Piece | Location | Note |
| --- | --- | --- |
| Loader script | `index.html` head | Inline block that appends the loader after load, at idle. `prerender.js` copies it into every public page. |
| Ownership meta | `index.html` head | `google-adsense-account`, accepted as proof even when the script is blocked. |
| Seller declaration | `public/ads.txt` | One Google DIRECT line. `scripts/check-ad-crawlers.js` then requires the live file to match it byte for byte. |
| Crawler access | `public/robots.txt` | `Mediapartners-Google`, `Google-Display-Ads-Bot` and `AdsBot-Google` allowed explicitly. |
| Origin allowances | `vercel.json` | AdSense origins in `script-src`, `connect-src` and `frame-src` of the reported policy. |
| Disclosure | `src/pages/PrivacyPolicy.jsx` | Third-party advertising, ad cookies, Google CMP and opt-out links. Reviewed 2026-10-18. |
| Publisher terms | `src/pages/TermsAndConditions.jsx` | Section 7: ads are third-party content, ad blocking allowed, invalid-traffic prohibition. |
| Release gate | PD-19 in `scripts/predeploy-build.cases.mjs` | Loader on content pages only, ads.txt, headers, print exclusion. |
| Ad unit mount | `src/components/AdSlot.jsx` | Client-only `<ins>`, desktop-only, collapses when unfilled. |

No `<ins class="adsbygoogle">` element reaches prerendered HTML. PD-19 asserts
that for every generated page, and it still holds: `AdSlot` mounts the unit
after the first client render, so the static files stay ad-free and the request
is only made once a real viewport has been measured.

One manual unit is live, following step 4 below:

| Unit | Slot | Format | Where it runs |
| --- | --- | --- | --- |
| In-content display | `8867840228` | Responsive display | Every viewport |

It went live on 2026-10-23 as a fixed 728x90 leaderboard, which could only be
rendered at 768px and wider: a fixed unit below its own width had to be left
out entirely rather than rendered and hidden, because AdSense counts an
impression for a hidden unit. That left phones, most of this audience, with no
ad at all.

The same unit was reconfigured in the AdSense account as responsive on
2026-10-24, keeping its slot ID. The markup now carries no width or height and
uses `data-ad-format="auto"` with `data-full-width-responsive="true"`, so
AdSense sizes the creative to the container and may use the full viewport width
on phones. The viewport gate is gone, and the one unit serves every placement.

Because a responsive creative varies in height, the reserved geometry is the
120px desktop and 280px mobile budget in the guardrails below rather than an
exact creative height. `format="rectangle"` constrains the container width
again, so it is no longer preview-only.

Three places stay ad free by construction, and PD-19 fails if that changes:
the private app (`tiimin-lomat/suunnittelu.html`), the embeddable widget
(`scripts/build-business-widget.mjs`), and non-content documents, meaning
`404.html` and the `/liputuspaivat` meta-refresh page, which `prerender.js`
generates through `withoutAdsenseLoader()`. AdSense allows ads only on pages
that carry real publisher content.

## Consent

The certified CMP is Google's own Privacy and messaging GDPR message, configured
in the AdSense account and delivered by the loader script. That is why the
loader is not gated behind the first-party banner: gating it would stop the
consent message from ever appearing and would leave the site review with no
detectable ad code.

`src/consent.js` is the analytics banner only. It keeps `ad_Storage` denied for
Clarity and must not be presented as the control for advertising.

## When the loader runs, changed 2026-11-27

Unconditional does not mean first. A Lighthouse run on `/adventti-2026`
attributed about 650 ms of main-thread CPU to the loader and the consent
message it delivers, on a page that mounts no unit at all, and total blocking
time on that page was 690 ms.

The loader is therefore appended by an inline head script once the page has
loaded and the main thread goes idle, the pattern Clarity and `gtag.js`
already use. What did not change:

- The loader URL stays a literal in `index.html`, so PD-19 and the contextual
  crawlers still read it in every generated page, and `prerender.js` still
  removes the whole block from `404.html` and the `/liputuspaivat` redirect
  document through `withoutAdsenseLoader()`.
- The `google-adsense-account` meta remains the ownership proof.
- The certified CMP is still Google's message, still delivered by this script.
  It appears a moment later than before, not conditionally.

A page that mounts a unit does not wait: `AdSlot` calls
`window.viikkonroLoadAds()` from its mount effect, so the loader is requested
as soon as a real viewport has been measured. Ad-bearing pages therefore
request it at the same point in the lifecycle as before, and the large
majority of pages, which carry no slot, no longer pay for it during load.

`src/adsenseLoader.test.js` covers the URL literal, the ownership meta, the
idle append, the `AdSlot` fast path and the once-only guarantee. The inline
block has its own `sha256` in `vercel.json`, asserted by the release gate.

## Remaining manual steps

1. Deploy, then confirm `https://viikkonro.fi/ads.txt` serves as `text/plain`
   over both HTTP and HTTPS and that `node scripts/check-ad-crawlers.js` passes
   against production.
2. In Cloudflare, keep Rocket Loader off. It rewrites async scripts and is a
   known cause of AdSense failing to load or to be detected. Confirm the loader
   tag survives in the live HTML and that Cloudflare does not serve a cached 404
   for `/ads.txt`.
3. In the AdSense account: add the site, enable the EEA/UK GDPR message and the
   California message, then request review.
4. After the site status is **Ready**, enable ad serving. Prefer manual units at
   the reserved slots below over Auto ads, which inserts placements the layout
   and CLS budget here were not designed for.
5. Re-run mobile and desktop Lighthouse plus real-user CWV monitoring after the
   first units are live. Pre-approval numbers are only the baseline.

Preview the reserved slot geometry locally with:

```sh
VITE_AD_LAYOUT_PREVIEW=true npm run dev
```

The flag renders a dashed placeholder and is separate from ad serving. It must
never be used as the ad-serving switch.

## Planned slots

| Placement ID | Route family | Position | Format | Rationale |
| --- | --- | --- | --- | --- |
| `year-summary-after-facts` | `/vuosi-{year}` | After the complete year summary, before navigation and week cards | Responsive banner | Keeps the direct answer and facts uninterrupted. |
| `working-days-after-result` | `/tyopaivat-{year}` | After calculated totals, before the monthly breakdown | In-content rectangle | Never separates inputs from results and remains outside the table. |
| `print-list-before-preview` | `/tulosta-{year}` | After print/download controls, before the printable week table | Responsive banner | Leaves the explanation and actions together and never enters printed output. |
| `calendar-before-preview` | `/kalenteri-{year}[-alkuvuosi|-loppuvuosi]` | After view controls, before the calendar grid | Responsive banner | Places monetization outside the calendar itself and excludes the print-only route. |

## Density: four slots per page, 2026-11-26

Density was raised to four slots per page family on request, after a same-day
reduction to one. Current state: 107 `AdSlot` mounts across 27 page
components, each with a unique placement id, 26 of them carrying four.

The user was advised before this change that four units per page is a 4x
density increase, that it works against the Better Ads ad-density signal and
the pogo-sticking risk on short lookup pages, and that several pages have
fewer than four content blocks to separate the units. The increase was
confirmed and implemented. Revisit it from the AdSense report plus field
Core Web Vitals, not from assumption, and treat the three notes below as the
known weak points.

Placement rule used for the three added slots on each page: the insertion
point must be a sibling-level content boundary (`h2`, `h3`, `section`, `p`,
`ul`, `ol`, `blockquote`) at the same JSX depth as the original slot, at least
six source lines after the previous slot, so a content block always separates
a pair. `div` boundaries are deliberately excluded, because on these pages a
`div` is a table wrapper, the calendar grid, a tool panel, a FAQ list or a pill
or grid block, and the guardrails below keep slots out of tables, calendar
cells and calculator controls. Inserting before a tool panel would also split
a heading from its own tool.

Three exceptions to the four-per-page rule:

- `/kalenteri-{year}` (`src/pages/CalendarYear.jsx`) carries **three**. Its
  remaining content sits inside `half` and `print` variant conditionals at
  deeper JSX depth, so a fourth slot could only go inside a variant branch or
  against the calendar grid. Both are out of bounds here.
- `/tulosta-{year}` (`src/pages/PrintCalendar.jsx`) keeps all three added
  slots inside the explicitly `noprint` prose block, never around the
  printable week table. `AdSlot` renders with the `noprint` class, so no unit
  reaches printed output.
- `/kalenteri-{year}` print variant and `/tulostettava-kalenteri-{year}` stay
  ad free: both `CalendarYear` slots are gated behind `{!print && ...}`.

Separator quality is thin on the shortest pages. On `/kesaaika-{year}` and
`/pyhapaivat-{year}` one pair is separated only by `UpcomingCalendarPromo`, a
promo card rather than a substantial content section. Those are the first two
placements to drop if ad-density or page-experience signals degrade.

The `/viikko-{week}-{year}` family carries **no slot**. `week-after-facts` was
removed earlier on 2026-11-26 to cut density and was not restored when density
was raised again, so the largest page family on the site is currently
unmonetized while every other family carries four. Restoring it means adding
`AdSlot` mounts and the import back to `src/pages/WeekDays.jsx`, the first
after the QuickFacts table and before the day table.

## High-traffic placements, added 2026-10-23

The four slots above sit on `/vuosi-`, `/tyopaivat-`, `/tulosta-` and
`/kalenteri-`. Search Console shows the demand is elsewhere, so a unit in those
four alone would earn almost no impressions. These placements follow the
traffic, and obey the same guardrails.

| Placement ID | Route family | Position | Rationale |
| --- | --- | --- | --- |
| `home-after-answer` | `/` | After the live week answer and the parity answer, before the week search tool | The highest-viewability slot on the site. It sits after the hero, never above or inside it: the week number is what the page exists to answer and what it ranks for. |
| `weeks-in-year-after-answer` | `/kuinka-monta-viikkoa-vuodessa` | After the computed current-year answer, before the ISO explanation | Highest-impression single page. The answer is served first. |
| `dst-after-facts` | `/kesaaika-{year}` | After the change cards, QuickFacts and the EU directive note, before the FAQ | Strongly seasonal; the directive caveat stays attached to the facts. |

## High-dwell planning placements, added 2026-11-03

These placements monetize high-dwell informational and planning pages where
users spend minutes researching dates, calculating leave, and planning long
weekends. They obey the single-slot-per-page rule and sit cleanly below
introductory answers and interactive tools.

| Placement ID | Route family | Position | Rationale |
| --- | --- | --- | --- |
| `school-holidays-after-summary` | `/koululomat-{year}` | After the summary panels and verification note, before the winter holiday tables | High dwell time as parents and educators consult municipal schedules. |
| `holiday-after-facts` | `/pyhat-{year}/{slug}` | After QuickFacts and updated note, before detailed holiday rules and long-weekend planning | Strong organic intent from Search Console for individual holiday queries. |
| `public-holidays-after-summary` | `/pyhapaivat-{year}` | After the annual overview lead and rule classification note, before the holiday table | Captures high-volume annual public-holiday query volume without separating table data. |
| `annual-leave-after-calc` | `/vuosilomalaskuri` | After the interactive calculation results and statutory leave note, before usage instructions | Sits below the tool results, preserving UX while engaging users reading accrual guidelines. |

## Guardrails for post-approval integration

- Slots stay out of the header, navigation, footer, calculator controls,
  calculator results, tables, calendar cells, and printable output.
- No sticky, floating, overlay, interstitial, or auto-inserted placement may
  cover or imitate functional controls.
- The reserved slot dimensions must remain in place while an approved creative
  loads: 120 px minimum for desktop banners and 280 px for mobile/rectangle
  placements. This is the CLS budget protection.
- A slot must collapse entirely when ads are disabled or consent is unavailable;
  it must not leave an empty card that looks unfinished.
- Ad requests and the AdSense script remain consent-gated by the certified CMP.
  The layout-preview flag must never be used as the ad-serving switch.
- Re-run mobile and desktop Lighthouse plus real-user CWV monitoring after the
  first ad units are enabled; pre-approval numbers are only the baseline.
