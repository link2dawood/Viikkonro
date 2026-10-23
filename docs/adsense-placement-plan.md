# AdSense placement plan

Publisher: `ca-pub-5553975522423673`.

Status: the account wiring ships, and one manual desktop unit is live as of
2026-10-23. What is in the repository:

| Piece | Location | Note |
| --- | --- | --- |
| Loader script | `index.html` head | `prerender.js` copies it into every public page. |
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
on phones. The viewport gate is gone, and one unit serves all eight placements.

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

The homepage carries three slots as of 2026-10-24, the only page that does.
It is the highest-traffic page and has enough distinct blocks to separate
them: a substantial content section sits between each pair, and none is above
the hero. Every other page family keeps exactly one slot. Raising density
further is a revenue-per-page question that should be answered from the
AdSense report, not assumed.

## High-traffic placements, added 2026-10-23

The four slots above sit on `/vuosi-`, `/tyopaivat-`, `/tulosta-` and
`/kalenteri-`. Search Console shows the demand is elsewhere, so a unit in those
four alone would earn almost no impressions. These placements follow the
traffic, and obey the same guardrails.

| Placement ID | Route family | Position | Rationale |
| --- | --- | --- | --- |
| `week-after-facts` | `/viikko-{week}-{year}` | After the QuickFacts table, before the holiday note and the day table | The largest page family on the site. Keeps the lead answer and the facts table uninterrupted, and stays out of the day table. |
| `home-after-answer` | `/` | After the live week answer and the parity answer, before the week search tool | The highest-viewability slot on the site. It sits after the hero, never above or inside it: the week number is what the page exists to answer and what it ranks for. |
| `home-after-search` | `/` | After the week search tool, before the month and year browse blocks | Below both the live answer and the primary tool, so it never sits between an input and its result. |
| `home-after-browse` | `/` | After the month and year week lists, before the explanatory sections | Keeps the third slot below two substantial content blocks rather than stacking it near the others. |
| `weeks-in-year-after-answer` | `/kuinka-monta-viikkoa-vuodessa` | After the computed current-year answer, before the ISO explanation | Highest-impression single page. The answer is served first. |
| `dst-after-facts` | `/kesaaika-{year}` | After the change cards, QuickFacts and the EU directive note, before the FAQ | Strongly seasonal; the directive caveat stays attached to the facts. |

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
