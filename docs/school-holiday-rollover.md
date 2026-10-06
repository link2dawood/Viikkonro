# School-holiday yearly rollover

Use this checklist each spring after municipalities and Opetushallitus publish
the next school year's confirmed dates. Never publish an estimated date as a
confirmed school holiday.

## Timing and sources

1. Review Opetushallitus in April and May for its national city comparison.
2. Review the official education pages for Helsinki, Turku, Tampere, Joensuu,
   and Oulu. Add other municipalities only from their own official pages.
3. Record the review date in SCHOOL_HOLIDAY_UPDATED and on each source entry.
4. Keep cities without a published date in autumnUnknownCities. Do not infer
   a date from an earlier year or a neighboring city.

Current official source entry points are stored in SCHOOL_HOLIDAY_SOURCES in
src/data/schoolHolidayPages.js.

## Add the next page

1. Add the next year to PAGES in src/data/schoolHolidayPages.js.
2. Include only rows supported by a named source key.
3. Check every ISO week with mondayOf() rather than typing date ranges.
4. Add source keys, coverage notes, other confirmed periods, and unknown-city
   lists. The confidence tier must remain computed from the rows.
5. Confirm that the rolling year and calendar routes already generate the
   corresponding /vuosi-YYYY and /kalenteri-YYYY pages. Do not add duplicate
   route declarations for those existing programmatic families.

## Verify before release

1. Run the school-holiday data and page tests.
2. Run the full unit suite, lint, and production build.
3. Inspect the generated school-holiday HTML for one H1, a self-canonical,
   official source links, visible confidence labels, matching visible and
   schema FAQs, and no unsupported city date.
4. Confirm the page appears in sitemap.xml only when its confidence tier is
   CONFIRMED.
5. Check week pages 8, 9, 10, 42, and 43 link to the verified yearly page and
   that no other week creates a forced school-holiday hub link.
6. Update docs/seo-growth-validation-2026-10-05.md with the build counts and
   the source coverage actually shipped.
