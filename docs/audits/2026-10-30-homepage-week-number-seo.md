# Homepage week-number SEO implementation

Date: 2026-10-30  
Scope: Phase 2, homepage and core week-number SEO

## Implemented locally

- Homepage title now leads with the primary query: `Mikä viikko nyt on?
  Viikkonumero ja kalenteri | Viikkonro`.
- The meta description answers with the live ISO week and year, then describes
  the week dates and even/odd lookup. It stays within the existing 140–160
  character check for all weeks.
- The first-week card exposes the current ISO week, today's Finnish weekday,
  the full start and end dates, parity, and direct previous/next week links.
  Navigation calculates ISO week-years, including year boundaries.
- The homepage already had visible ISO 8601 guidance, date lookup, parity
  explanation, year navigation, and featured FAQs. These remain the supporting
  content; no duplicate explainer or unnecessary schema was added.
- The homepage QuickLinks card titled “Viikkokalenteri” now links to
  `/vuosi-{year}`, the page that owns the week-list intent. It previously
  linked to `/kalenteri-{year}`. A direct link to the printable yearly calendar
  page was added alongside it. Existing year browsing links to 2026 and 2027
  remain available.
- Structured data remains appropriate: the sitewide WebSite/Organization
  graph is retained, and the homepage FAQPage is built from the same featured
  questions shown visibly on the page. The homepage has no breadcrumb trail,
  so no BreadcrumbList was added there.

## Search Console baseline

The supplied brief reports 167,993 impressions, 107 clicks, 0.06% CTR, and
average position 6.54 for “mikä viikko nyt on”, plus 304,612 impressions,
295 clicks, and 0.10% CTR for the homepage. Those values are recorded as
user-supplied and were not independently re-exported from Search Console in
this session.

## Verification

`npm run build` completed successfully and prerendered 1,920 routes. The
generated homepage was checked for the 57-character title, a 158-character
description, the rendered week/parity/date range, previous and next week links,
the corrected calendar destinations, and WebSite/FAQPage schema. No
deployment was made.

The first build run revealed an over-60-character title in the pending
clock-change page work. It was shortened to keep its main search terms and
date, and the existing title expectation was updated. The subsequent full
build completed without prerender failures.
