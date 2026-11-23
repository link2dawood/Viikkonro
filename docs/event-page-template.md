# Event page template

Dated event pages (adventti, itsenäisyyspäivä, joulu, uusi vuosi, loppiainen,
the rare week 53) answer a query with a sharp, short-lived peak: *when is it,
how long until it, and is it a day off*. They share one block so every page in
the family answers those three in the same order, and so a refresh is a data
edit rather than a copy rewrite.

## What the block renders

`src/components/EventTemplate.jsx`, in this order:

1. **The answer**, inside the `.answer-sentence` wrapper the pages' `speakable`
   schema targets. It states date, weekday and week number.
2. **A countdown** to the day.
3. **The day-off verdict**, as a `<dl>` with the question as the term.
4. **A link to next year's page.**
5. **A calendar CTA.**
6. **The visible "Sisältö päivitetty" line**, from the same review date the
   page's schema `dateModified` and its sitemap `lastmod` use.

Each page passes its own answer node in, so adopting the template never
rewrites the sentence an already-ranking page leads with.

### Why the countdown is hydration safe

The day count comes from `useToday()`: the prerendered day while hydrating, the
live day immediately after. A visitor therefore never sees a stale number, and
the first browser render matches the prerendered HTML. The hours-and-minutes
line renders only after mount, because it changes every minute and cannot be
prerendered. `src/components/EventTemplate.test.jsx` asserts the static markup
contains no clock.

Once the day has passed the countdown states that plainly instead of showing a
negative number, and the next-year link carries the visitor forward.

## Review dates

`EVENT_REVIEWS` in `src/data/eventTemplate.js` maps a path to the day its
visible copy was actually reviewed. **A build date is not a review date**, so
these are hand-set, never computed from the clock. One constant has three
consumers, so the visible date and the machine-readable dates cannot disagree:

| Consumer | Path through the code |
| --- | --- |
| Visible "Sisältö päivitetty" line | `EventTemplate.jsx`, and `WeekDays.jsx` for a reviewed week page |
| Schema `dateModified` (WebPage) | `sitemapLastmod()`, read by `prerender.js`'s generic `pageNode()` fallback and by `observanceNodes()` |
| Schema `dateModified` (FAQPage) | `faqPageNode()`'s default argument in `prerender.js` |
| `sitemap.xml` `lastmod` | `previousContentLastmod()` in `src/data/sitemapMetadata.js` |

All four go through `eventReviewedFor(path, dayKey)`, which returns the
recorded date only once `dayKey` has reached it and otherwise null, so the
caller falls back to the site-wide `CONTENT_UPDATED`. **Do not bypass it.** An
earlier revision of this work read `EVENT_REVIEWS` directly in
`faqPageNode()`, and a build that ran the evening before the recorded review
shipped pages whose FAQPage node said the review date while their WebPage node
and the sitemap still said the older one. The guard is why that cannot recur.

Week pages have no site-wide editorial date, so `WeekDays.jsx` renders the
line only for a week with a recorded review. The other 834 show nothing rather
than a date nobody reviewed.

Named holiday pages route through `page.updated` in
`src/data/holidayPages.js`, which takes the later of the slug-wide date and the
recorded review of that one year's page.

`previousContentLastmod()` checks the event review before its generic
week/year rule, so a reviewed week page publishes its own date rather than the
shared parity date.

### Refreshing a page

1. Edit the copy and the data behind it.
2. Raise that path's row in `EVENT_REVIEWS` to the day you did the work. Add a
   row if the page has none; without one the page falls back to the site-wide
   `CONTENT_UPDATED`, which is honest but does not signal the refresh. Use the
   day the build will actually run on, in Helsinki time: a date a day ahead is
   withheld until a later build, so the refresh silently fails to publish.
3. Note what was reviewed in the comment above `EVENT_REVIEWS`.
4. Run `npm run test:predeploy`.

## Finnish weekday cases

`WD_ALLATIVE` in `src/components/dateUtils.js` exists because the allative is
not derivable by appending `lle` to the nominative: `keskiviikko` takes
consonant gradation and loses its final vowel (`keskiviikolle`, never
`keskiviikkolle`). Any copy saying "osuu <weekday>lle" must read the array.
This bit the itsenäisyyspäivä and joulu pages for every year the day lands on a
Wednesday, which is why the test suite pins `/itsenaisyyspaiva-2028`.

## Phase 3 schedule

Refresh each page three to four weeks before its date, so Google has recrawled
it before the searches start.

| Event | Date | Page | Refresh by | Status |
| --- | --- | --- | --- | --- |
| 1. adventti | 29.11.2026 | `/adventti-2026` | now | Done 21.11.2026. Template plus `/kalenteri-2027` links. |
| Itsenäisyyspäivä | 6.12.2026 | `/itsenaisyyspaiva-2026`, `/pyhat-2026/itsenaisyyspaiva` | 22.11. | Done 21.11.2026. Flag day falling on a Sunday; the holiday page now links the landing page. |
| Joulu | 24.12.2026 | `/joulu-2026` | 25.11. | Done 21.11.2026. Live countdown to jouluaatto. |
| Viikko 53 | 28.12.2026 to 3.1.2027 | `/viikko-53-2026` | 1.12. | Done 21.11.2026. Already a prerendered week page; the rare-week notice now states the year boundary. |
| Uusivuosi and loppiainen | 1.1. and 6.1.2027 | `/uusi-vuosi-2027`, `/loppiainen-2027` | 8.12. | Done 21.11.2026. |
| Talvilomat | weeks 8 to 10, 2027 | `/koululomat-2027` | 5.1.2027 | Open. See the decision below. |
| Laskiainen | 7.2.2027 | `/laskiainen-2027` | 15.1.2027 | Open. Page exists and already carries the template. |
| Pääsiäinen and kesäaika | 28.3.2027 | `/pyhat-2027/paasiaispaiva`, `/kesaaika-2027` | 28.2.2027 | Open. Both fall on 28.3.2027, so cross-link the two pages. |

### Decision: talvilomat 2027 has no URL of its own

The source plan proposed a new `/talvilomat-2027`. It was rejected on
2026-11-21: `/koululomat-2027` already owns that content, and
[`docs/seo-2027-growth-plan.md`](seo-2027-growth-plan.md) brief 5 already
targets it for the hiihtoloma and talviloma 2027 queries. A second URL would
break SEO constitution invariant 1 and split the two pages' signals. The
January work therefore strengthens `/koululomat-2027`: the municipality table,
a per-city anchor id for each searched city, and talviloma-first seasonal
titling.
