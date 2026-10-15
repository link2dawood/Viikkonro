# AdSense placement plan

Publisher: `ca-pub-5553975522423673`.

Status: the account wiring ships, ad units do not. What is in the repository:

| Piece | Location | Note |
| --- | --- | --- |
| Loader script | `index.html` head | `prerender.js` copies it into every public page. |
| Ownership meta | `index.html` head | `google-adsense-account`, accepted as proof even when the script is blocked. |
| Seller declaration | `public/ads.txt` | One Google DIRECT line. `scripts/check-ad-crawlers.js` then requires the live file to match it byte for byte. |
| Crawler access | `public/robots.txt` | `Mediapartners-Google`, `Google-Display-Ads-Bot` and `AdsBot-Google` allowed explicitly. |
| Origin allowances | `vercel.json` | AdSense origins in `script-src`, `connect-src` and `frame-src` of the reported policy. |
| Disclosure | `src/pages/PrivacyPolicy.jsx` | Third-party advertising, ad cookies and opt-out links. |
| Release gate | PD-19 in `scripts/predeploy-build.cases.mjs` | Loader on content pages only, ads.txt, headers, print exclusion. |

No `<ins class="adsbygoogle">` element exists anywhere, so nothing is requested
until ad serving is switched on inside the AdSense account. That is deliberate:
units and Auto ads are account settings, so turning ads on or off needs no
deployment.

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
