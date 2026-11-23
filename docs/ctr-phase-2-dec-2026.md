# CTR phase 2: title fixes and 2026 consolidation

Nov 21, 2026 · prepared against `main` at commit `34d588c`

Phase 2 of the CTR brief covers ten pages that hold over 70% of impressions
at under 1% CTR. This document records what was implemented, what was held
back and why, and the Search Console checks that are still open. It is the
decision record for the batch; the brief itself sets the targets.

The repository had no Search Console access while this was prepared, so every
claim below is derived from the code and from git history, not from query
data. The three open questions at the end need a GSC session to close.

## Constraint that reshaped every proposed title

Titles are capped at **60 characters including the `| Viikko Nro` suffix**,
asserted per year across 2020 to 2035 by `homeMeta.test.js`,
`metaPromises.test.js`, `phase1CoreQueries.test.js` and the other
phase query suites. All five titles proposed in the brief exceed it once the
mandatory brand suffix is added:

| Proposed title | With brand | Over by |
| --- | --- | --- |
| Vuosi 2026: viikkonumerot, pyhät ja tulostettava kalenteri (PDF) | 77 | 17 |
| Mikä viikko nyt on? Viikkonumero tänään ja viikkokalenteri 2027 | 76 | 16 |
| Koululomat 2027 kunnittain: talviloma, hiihtoloma ja kesäloma | 74 | 14 |
| Montako viikkoa vuodessa? Vuodessa 2026 on 53 viikkoa | 66 | 6 |
| Työpäivät 2026 kuukausittain: taulukko ja laskuri | 62 | 2 |

Each title below therefore carries the brief's *promise* rather than its exact
wording. The brief's intent, giving the searcher a reason to click that the
answer box cannot satisfy, is preserved in all three shipped titles.

## 2.1 Shipped titles

Three pages. Each had its title last changed on Oct 6, Oct 17 or Oct 22, so all
three are past a 28-day measurement window and can be attributed cleanly.

### `/tyopaivat-{year}` (`workingDaysMeta`, `src/data/seo.js`)

- Before: `Työpäivät 2026: montako työpäivää vuodessa | Viikko Nro`
- After: `Työpäivät 2026: 254 päivää kuukausittain | Viikko Nro`

The answer box already states the bare count, so the title now states the
count *and* names the per-month breakdown `WorkingDays.jsx` renders as a real
table. The count reads `workingDaySplit()`, the same source `calendarMeta()`
uses, so `/tyopaivat-` and `/kalenteri-` cannot state different numbers for a
year. The description keeps the `montako työpäivää` phrasing and the Kela
arkipäivä mode that `metaPromises.test.js` requires.

The brief also wanted "laskuri" in the title. The page links the
`/tyopaivalaskuri` calculator but does not embed one, and the brief's own
rule 5 (promise only what the page renders) rules the word out.

### `/kuinka-monta-viikkoa-vuodessa` (`weeksInYearMeta`, `src/data/weeksInYearContent.js`)

- Before: `Kuinka monta viikkoa vuodessa on? 52 vai 53 | Viikko Nro`
- After: `Kuinka monta viikkoa vuodessa? 2026: 53 viikkoa | Viikko Nro`

`52 vai 53` posed the question twice and answered it never, which is the one
thing this page can do in the SERP itself. The count is computed per ISO year,
so the title turns over on 1 January by itself.

The lead phrase stays `Kuinka monta viikkoa vuodessa`, not the brief's
`Montako`. The page ranks at position 3.2 on the phrase in its own slug and
H1, and swapping the lead noun phrase on a page that already ranks is a
separate experiment from adding the answer. `montako viikkoa vuodessa` remains
in the description, so the synonym is still covered. If query data shows
`montako` is the dominant form, the swap costs 5 characters and is a one-line
change.

The title is exactly 60 characters for every year in the horizon. There is no
headroom; a longer suffix or a three-digit week count would break the cap.

### `/tulosta-{year}` (`printMeta`, `src/data/seo.js`)

- Before: `Tulostettava viikkokalenteri 2026: 53 viikkoa | Viikko Nro`
- After: `Tulostettava viikkolista 2026: 53 viikkoa | Viikko Nro`

This is the consolidation fix for `/tulosta-2026`, done as a title change
instead of the 301 the brief proposed. See 2.2 for the reasoning. The
breadcrumb leaf label in `breadcrumbTrail()` moved with it, so the title, the
visible breadcrumb and the `BreadcrumbList` node agree.

The change applies to every year, `/tulosta-2027` included, because `printMeta`
is year-generic. The brief's "never during its peak" rule is about redirects;
this is a reversible title change with no URL loss. Gating it to past years
would mean a hardcoded year special case that goes stale.

## 2.1 Held back: three titles already changed on Nov 16

`#126` (commit `34d588c`, Nov 16) rewrote the titles of the homepage,
`/vuosi-{year}` and `/koululomat-2027`. The brief's baseline is Nov 3 to 9,
which measures the titles those three pages no longer have.

Shipping a second rewrite on Dec 1 would mean the Dec 15 comparison attributes
the combined effect of two changes to the second one, and `#126`'s own effect
would never be measured at all. That breaks the brief's measurement rule, so
these three are held until `#126` has 28 days of data, from about Dec 14.

Two of the three also conflict with a token split that is deliberate and
documented in the code:

- `/vuosi-{year}` was given `viikkokalenteri <year>` to own, with
  `/kalenteri-{year}` giving the token up in exchange (`#83`, Oct 17; the
  comments in `yearMeta()` and `calendarMeta()` record the trade). The brief's
  title drops `viikkokalenteri` from `/vuosi-2026` entirely and adds
  `tulostettava kalenteri`, which is `/tulostettava-kalenteri-2026`'s token.
- The homepage title proposed by the brief claims `viikkokalenteri 2027`,
  which is `/vuosi-2027`'s token.

Reversing that split is a product decision, not an engineering one. When the
three come off hold, these titles fit the cap and keep the split:

| Page | Candidate | Length |
| --- | --- | --- |
| `/vuosi-{year}` | `Viikkokalenteri 2026: 53 viikkoa, pyhät ja PDF \| Viikko Nro` | 59 |
| `/koululomat-2027` | `Koululomat 2027: talviloma 8-10, kesäloma 5.6. \| Viikko Nro` | 59 |
| homepage | unchanged; see note | 43 |

`/koululomat-2027`: the brief's `kunnittain` is not supportable. The page's
`coverageNote` states the table compares regional capitals, and for autumn
2027 only Helsinki is confirmed; `SchoolHolidays.jsx` tells the visitor to
check their own municipality. `alueittain`, the page's own word, is the honest
form, but it does not fit alongside both seasons (62 characters), so the
candidate above spends those characters on the week range instead. `kesäloma`
is supportable: `otherPeriods` renders "Lukuvuosi 2026-2027 päättyy
peruskouluissa lauantaina 5.6.2027", and that date is a stronger hook than the
word, which is why the candidate names `kesäloma 5.6.`. Note that
`#126` chose to lead with `Talviloma 2027` for the high-impression query;
leading with `Koululomat 2027` instead is the brief's call to make explicitly.

Homepage: the brief lists it at 0.10% CTR on 370k impressions, while also
noting that the answer box already answers `mikä viikko nyt on`. No title
rewrite changes that. Treat the homepage as answer-box saturated rather than
as a title problem, and spend the effort on the pages where a click is still
available.

## 2.2 Consolidating the 2026 pages

The brief proposes two 301s gated on Search Console query overlap. Neither gate
could be evaluated, and both targets turn out to have a different problem than
the brief assumes.

**`/tulosta-2026` vs `/tulostettava-kalenteri-2026`: do not merge.** The two
pages hold different content. `/tulosta-{y}` is a week list, weeks as rows with
start and end dates plus a CSV export; `/tulostettava-kalenteri-{y}` is a
month-grid PDF. `printCalendarContent.js` spells the distinction out in its own
FAQ, and `breadcrumbs.test.js` asserts the two keep distinct leaf labels. A 301
would lose the week-list and CSV intent.

The real collision is elsewhere and is visible in the code without any query
data: `/tulosta-{y}`'s title led with `Tulostettava viikkokalenteri {y}`, which
is the token `/vuosi-{y}` was given to own, and it contradicted the page's own
`<h1>`, which has always read `Tulostettava viikkolista {year}`. Three pages
led with the same noun. The title now matches the H1, which resolves the
collision without losing a URL. This is the shipped change described in 2.1.

**`/kalenteri-2026` vs `/vuosi-2026` vs `/kalenteri-2026-loppuvuosi`: no merge
proposed.** `#83` already gave each of the three a distinct token (`kalenteri
<year>`, `viikkokalenteri <year>`, and the half-year page's own intent) on
Oct 17. The brief infers cannibalization from all three sitting at position 7
to 9, which is consistent with cannibalization but also with three pages that
simply rank mid-page-one. Distinguishing the two needs the query report.

**`/tulosta-2027` vs `/tulostettava-kalenteri-2027`:** the title fix above
already applies to 2027, so the planned post-Jan 15 work on this pair is done
unless the query data argues for an actual merge.

## 2.3 Zero-click pages as link sources

`src/components/UpcomingCalendarPromo.jsx` is one shared block, rendered on
five page families:

| Page family | Component |
| --- | --- |
| `/isanpaiva-{y}` and the other observance days | `ObservanceDay.jsx` |
| `/pyhat-{y}/{slug}` | `NamedHoliday.jsx` |
| `/pyhapaivat-{y}` | `PublicHolidays.jsx` |
| `/kesaaika-{y}` | `DaylightSaving.jsx` |
| `/kuun-vaiheet-{y}` | `MoonPhases.jsx` |

The brief named five URLs; four of them are families, and the pages in a family
share the problem, so the block goes on the family. It sits directly above each
page's FAQ section, which is the last place a visitor still reads.

The promoted year is computed, never hardcoded. The block calls
`navigationYearTargets()`, the site-wide promotion rule the header quicklinks
already use, so from 1 October it promotes the upcoming calendar year and needs
no annual edit. `useToday()` keeps the prerendered and hydrated renders in
agreement.

Anchor text names each target's own token, `Tulostettava kalenteri {year}
(PDF)` and `Kalenteri {year}`, rather than the brief's `Tulostettava
viikkokalenteri 2027`. The brief's wording would have the block compete with
`/vuosi-{year}` from five page families at once, which is the cannibalization
2.2 exists to remove. The `(PDF)` promise the brief wanted is kept.

The brief's second 2.3 item, every holiday page linking to the next year's
version, was already satisfied before this change: `NamedHoliday.jsx`,
`PublicHolidays.jsx`, `DaylightSaving.jsx` and `MoonPhases.jsx` all render a
`prevnext` block, and `ObservanceDay.jsx` lists the same day across six coming
years via `upcomingYears()`. No change was needed and none was made.

## Verification

`workingDaysMeta`, `printMeta`, `weeksInYearMeta` and `breadcrumbTrail` were
checked against real computed output for every year from 2020 to 2035 in a Node
harness reusing the real functions: titles 53, 54 and 60 characters, both
descriptions inside the 140 to 160 window, and the `/tulosta-` breadcrumb leaf
matching the new title. `UpcomingCalendarPromo.test.jsx` renders the block with
`globalThis.__VIIKKONRO_RENDER_DAY__` pinned either side of the October
rollover and asserts it inside a real host page render.

`npm run lint` passes. `npx vitest run` passes. One `npm run test:predeploy`
attempt failed at the unit-test step on two 5-second timeouts in
`src/platform/businessWorkspace/business.test.js` and
`src/platform/export/companyIcs.test.js`; both pass in isolation in under
3 seconds and neither touches anything this change edits. The gate needs a
clean re-run on a quiet machine before release.

## Note on the working tree

This batch was prepared while other uncommitted work was in progress in the
same tree, including a narrowing of `isIndexable()` from
`currentYear-2..currentYear+4` to `currentYear-1..currentYear+2` and a new
year-index hub. The narrowing does not affect this batch: the promoted year is
always `currentYear` or `currentYear + 1`, so every page the 2.3 block links
stays inside the narrower window. Stage the paths listed in the commit
explicitly; `git add -A` would mix the two.

## Open questions for a Search Console session

1. Query overlap for `/tulosta-2026` vs `/tulostettava-kalenteri-2026`, and for
   `/kalenteri-2026` vs `/vuosi-2026` vs `/kalenteri-2026-loppuvuosi`. The title
   fix shipped here may be sufficient; a 301 is still available if the reports
   show the same queries landing on both after 28 days.
2. Whether `montako viikkoa vuodessa` outweighs `kuinka monta viikkoa
   vuodessa` on `/kuinka-monta-viikkoa-vuodessa`. If it does, swap the lead.
3. Whether `#126`'s Nov 16 titles moved CTR on the homepage, `/vuosi-2026` and
   `/koululomat-2027`. Read this from about Dec 14, before touching those three.

## Measurement

Annotate Search Console on the deploy date. Compare the three shipped pages on
Dec 15 against Nov 3 to 9 at a comparable position, and do not read the held
pages in the same window. The brief's rule stands: leave any title already
above 5% CTR alone.
