# SEO growth plan: the 2027 terms

Status: proposed, not implemented. No page, route, or data module has been
changed for this plan. Every item below still goes through the
[SEO constitution](SEO_CONSTITUTION.md) pre-merge checklist and
`npm run test:predeploy`.

Recorded 2026-10-17 against `main` at 7ed1d71.

## Why this exists

The 2027 queries already draw 95,842 impressions and 700 clicks in 90 days at
an average position near 7, and none of them has reached its seasonal peak yet.
Every target page already exists, so the work is moving each one from position
6 to 8 into the top 3, in three waves timed to the search peaks.

The 2026 versions show the ceiling: pääsiäinen 2026 peaked at 60,500 searches a
month, kalenteri 2026 at 33,100, and helatorstai 2026 at 22,200.

Success means top 3 for each primary keyword and a CTR above 3% on every target
page by its peak month, measured weekly in Search Console.

## Three waves

| Wave | Ready by | Clusters | Search peak |
| --- | --- | --- | --- |
| Calendars | December 2026 | 1, 2, 3 | December to January |
| Ski holidays and weeks 8 to 10 | mid January 2027 | 5, 6 | 22.2., 1.3., 8.3.2027 |
| Holidays | mid February 2027 | 4, 7, 8, 12 | 28.3., 6.5., 25.6.2027 |

Ship or refresh each cluster 6 to 8 weeks before its peak, which is roughly how
long Google needs to recrawl the page, test it in results, and settle its
position.

## Keyword map

Sixteen clusters cover every 2027 term in the data. Each has a single target
URL, so no two pages compete for the same keyword.

| # | Pri | Primary keyword | Target URL | Impressions 90d | Position | CTR | Peak |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | P1 | kalenteri 2027 | `/kalenteri-2027` | 17,166 | 5.6 | 1.3% | Dec to Jan |
| 2 | P1 | kalenteri 2027 tulostettava | `/tulostettava-kalenteri-2027` | 1,566 | 4.7 | 13.5% | Nov to Jan |
| 3 | P1 | viikkokalenteri 2027 | `/vuosi-2027` | 5,639 | 4.3 | 1.3% | Dec to Jan |
| 4 | P1 | pääsiäinen 2027 | `/pyhat-2027/paasiaispaiva` | 22,234 | 7.3 | 0.09% | Feb to Mar |
| 5 | P1 | hiihtoloma 2027 | `/koululomat-2027` | 9,323 | 6.8 | 0.14% | Jan to Feb |
| 6 | P1 | viikko 8 2027 | `/viikko-8-2027`, `-9-`, `-10-` | 11,698 | 7.0 | 0.1% | Jan to Mar |
| 7 | P2 | helatorstai 2027 | `/pyhat-2027/helatorstai` | 2,697 | 7.7 | 0% | Apr to May |
| 8 | P2 | juhannus 2027 | `/pyhat-2027/juhannusaatto` | 5,373 | 7.5 | 0.07% | May to Jun |
| 9 | P2 | arkipyhät 2027 | `/pyhapaivat-2027` | 1,020 | 4.7 | 0.2% | Dec to Jan |
| 10 | P2 | työpäivät 2027 | `/tyopaivat-2027` | 1,589 | 2.6 | 4.9% | Dec to Jan |
| 11 | P2 | viikko N 2027, other weeks | `/viikko-N-2027` | 14,453 | 6.8 | 0.2% | Rolling, 1 to 2 weeks ahead |
| 12 | P3 | vappu 2027 | `/pyhat-2027/vappu` | 45 | 4.8 | 0% | Apr |
| 13 | P3 | kesäaika 2027 | `/kesaaika-2027` | 413 | 4.5 | 0.24% | Mar and Oct |
| 14 | P3 | liputuspäivät 2027 | `/liputuspaivat-2027` | 420 | 3.9 | 4.8% | All year |
| 15 | P3 | ystävänpäivä 2027 | `/ystavanpaiva-2027` and siblings | 1,848 | 7.2 | 0.3% | 2 weeks before each day |
| 16 | P3 | palkkapäivät 2027 | `/palkkapaivat-2027` and siblings | below top 1,000 | not ranking | none | Dec, then monthly |

Peak volume is the 2026 version of the term at its 2026 peak, which is the best
available guide to how big the 2027 term will get.

| Primary keyword | Supporting keywords | 2027 now / 2026 peak per month |
| --- | --- | --- |
| kalenteri 2027 | 2027 kalenteri, almanakka 2027, vuosikalenteri 2027, kalenteri 2027 juhlapyhät, kalender 2027 | 5,400 / 33,100 |
| kalenteri 2027 tulostettava | tulostettava kalenteri 2027, ilmainen kalenteri 2027, vuosikalenteri 2027 tulostettava | not exported / 2,900 (vuosikalenteri 2026) |
| viikkokalenteri 2027 | viikkonumerot 2027, viikot 2027, kalenteri 2027 viikot, kalenteriviikot 2027 | not exported / 2,900 (kalenteri 2026 viikot) |
| pääsiäinen 2027 | milloin on pääsiäinen 2027, pitkäperjantai 2027, pääsiäinen 2027 kalenteri, palmusunnuntai 2027 | 9,900 / 60,500 |
| hiihtoloma 2027 | hiihtolomaviikot 2027, hiihtoloma 2027 Helsinki, Espoo, Vantaa, Kuopio, Oulu | not exported / 1,300 (hiihtolomaviikot 2026) |
| viikko 8 2027 | viikko 9 2027, viikko 10 2027, vko 8 2027 | not exported |
| helatorstai 2027 | onko helatorstai vapaapäivä, 6.5.2027 | 1,900 / 22,200 |
| juhannus 2027 | juhannusaatto 2027, milloin on juhannus 2027 | 3,600 / not exported |
| arkipyhät 2027 | pyhäpäivät 2027, vapaapäivät 2027, arkivapaat 2027 | not exported / 8,100 (arkipyhät 2026) |
| työpäivät 2027 | työpäiväkalenteri 2027, työpäivien määrä 2027, arkipäivät 2027 | not exported / 1,300 (työpäivät 2026) |
| viikko N 2027 | viikko 1 to 52 2027, vko N 2027 | 1,000 to 4,400 per week, generic "viikko N" |
| kesäaika 2027 | kellojen siirto 2027, talviaika 2027 | not exported |
| liputuspäivät 2027 | liputuspäivä tänään | not exported |
| ystävänpäivä 2027 | isänpäivä 2027, äitienpäivä 2027, Runebergin päivä 2027, helluntai 2027 | not exported |
| palkkapäivät 2027 | eläkkeen maksupäivät 2027, Kelan maksupäivät 2027 | not exported |

"Not exported" means the term was absent from the supplied Semrush files. One
Keyword Magic export per seed would fill those cells: kalenteri 2027,
hiihtoloma 2027, juhannus 2027, työpäivät 2027, kesäaika 2027.

## What every target page gets

1. Answer first. The date, weekday, and week number in the first 50 words, in
   plain text, so Google can lift it as the answer and the reader sees it
   without scrolling.
2. Title with the keyword first: keyword, then the date, then the brand, under
   60 characters.
3. `FAQPage` schema with the 3 to 5 questions people actually search, mirrored
   as visible text from the same data function.
4. A visible update date plus `dateModified` in the schema, refreshed whenever
   the data changes. A build date is not an editorial review date.
5. Data driven content. Every date and count comes from `src/data`, never typed
   by hand, so the 2028 pages inherit the same work for free.

## Internal linking

1. Homepage: from 1.11.2026, a "Vuosi 2027" block linking to
   `/kalenteri-2027`, `/tulostettava-kalenteri-2027`, `/vuosi-2027`,
   `/pyhapaivat-2027`, and `/koululomat-2027`.
2. 2026 to 2027: every 2026 page links to its 2027 sibling near the top
   ("Katso myös: Kalenteri 2027"). The 2026 pages hold the current authority,
   so this passes it forward.
3. Holiday hub: `/pyhapaivat-2027` links to every `/pyhat-2027/*` page, and
   each holiday page links back to the hub and to its week page.
4. Ski holiday weeks: `/viikko-8-2027`, `/viikko-9-2027`, and
   `/viikko-10-2027` link to `/koululomat-2027`, and the school holiday page
   links to all three.

## Technical

1. No year window change is needed. See the verification note below.
2. After each refresh, request indexing for the changed URLs in Search Console
   through URL Inspection.
3. Check that each 2027 page has its own OG image and a correct self-canonical
   before its wave starts.

## Links from other sites

The printable 2027 calendar is the best link magnet. In November and December,
pitch it to school sites (peda.net), libraries, parenting blogs, and municipal
intranets as a free, ad light download.

## Measurement

Every Monday, filter Search Console to queries containing "2027" and track
position and CTR per target URL. A page sitting in the top 5 with a CTR under
2% for three weeks gets its title and meta description rewritten.

## Content briefs: calendars

The three calendar pages must each own a different intent, or they split the
same clicks. `/kalenteri-2027` is the yearly overview,
`/tulostettava-kalenteri-2027` is the yearly print, and `/vuosi-2027` is the
week list. `/tulosta-2027` (weekly print) is a fourth intent and gets its own
keyword in brief 2.

### 1. kalenteri 2027

- **Target URL:** `/kalenteri-2027`. Today it has 31,161 impressions, 326
  clicks, 1.05% CTR, and position 6.3. This is the URL level figure; the
  17,166 impressions in the keyword map is the `kalenteri 2027` query alone.
- **Keywords:** kalenteri 2027 (5,400/mo now, 33,100 peak for the 2026 term),
  2027 kalenteri, almanakka 2027, vuosikalenteri 2027, kalenteri 2027
  juhlapyhät (position 1.2 with 474 impressions and 0 clicks, so the snippet
  does not answer it).
- **Intent:** see the whole year with week numbers and holidays, usually
  before printing or planning.
- **Title:** Kalenteri 2027: viikkonumerot ja pyhäpäivät | Viikko Nro
- **Meta description:** Kalenteri 2027 viikkonumeroilla, arkipyhillä ja
  liputuspäivillä. Vuodessa 2027 on 52 viikkoa ja 255 työpäivää. Selaa
  kuukausittain tai tulosta PDF. (The brief as supplied said 253. See the
  correction below.)
- **H1:** Kalenteri 2027
- **Answer block:** Vuosi 2027 alkaa perjantaina 1.1.2027, joka kuuluu vielä
  vuoden 2026 viikkoon 53. Ensimmäinen viikko alkaa maanantaina 4.1.2027, ja
  vuodessa on 52 viikkoa. Pääsiäinen on 28.3., juhannusaatto 25.6. ja
  itsenäisyyspäivä maanantaina 6.12.2027.
- **H2 outline:**
  1. Kalenteri 2027 kuukausittain (12 month grids with week numbers)
  2. Juhlapyhät ja arkipyhät 2027 (table: holiday, date, weekday, week)
  3. Pitkät viikonloput 2027 (new section: uusi vuosi pe 1.1., pääsiäinen
     26.3. to 29.3., helatorstai to 6.5. with a one day bridge,
     itsenäisyyspäivä ma 6.12.)
  4. Koulujen lomat 2027 (short summary, link to `/koululomat-2027`)
  5. Tulosta kalenteri 2027 (button to `/tulostettava-kalenteri-2027`)
  6. Usein kysyttyä
- **FAQ schema:** Montako viikkoa vuodessa 2027 on? Milloin pääsiäinen on
  vuonna 2027? Montako työpäivää vuonna 2027 on? Onko 2027 karkausvuosi?
  (that query already ranks 2.3)
- **Links in:** homepage Vuosi 2027 block, `/kalenteri-2026`, `/vuosi-2027`,
  `/pyhapaivat-2027`. **Links out:** `/tulostettava-kalenteri-2027`,
  `/pyhapaivat-2027`, `/koululomat-2027`, `/tyopaivat-2027`,
  `/kalenteri-2027-alkuvuosi`.
- **Ship by:** 15.11.2026. Goal: top 3 for kalenteri 2027, CTR above 3% by
  January.

#### Correction: 253 working days is the wrong mode

The brief as supplied put "253 työpäivää" in the meta description. The site's
own `/tyopaivat-2027` page and its FAQ state **255**, because
`src/data/dayRules.js` counts jouluaatto and juhannusaatto as working days in
the työpäivälaskuri mode. 253 is the count under the leave planning mode,
where both are off.

Publishing 253 on `/kalenteri-2027` would contradict `/tyopaivat-2027` on the
same site, for the same year, and both pages are linked to each other by this
very brief. Use 255, taken from `workingDaysFaqs(2027)` rather than typed by
hand, or state the mode explicitly if a different count is intended.

#### Everything else in brief 1 checks out

Verified 2026-10-17 against the repository's own data modules:

| Claim | Result |
| --- | --- |
| 1.1.2027 is a Friday in week 53 of 2026 | Confirmed. `isoWeek()` returns 53, `isoYear()` returns 2026 |
| First week of 2027 starts Monday 4.1.2027 | Confirmed by `mondayOf(1, 2027)` |
| 2027 has 52 weeks | Confirmed by `weeksInIsoYear(2027)` |
| 2027 is not a leap year | Confirmed by `isLeapYear(2027)` |
| Pääsiäinen 28.3.2027 | Confirmed. Pitkäperjantai 26.3., 2. pääsiäispäivä 29.3., so the long weekend span in H2 section 3 is right |
| Juhannusaatto Friday 25.6.2027 | Confirmed |
| Helatorstai Thursday 6.5.2027 | Confirmed, and the one day bridge on Friday 7.5. is right |
| Itsenäisyyspäivä Monday 6.12.2027 | Confirmed |
| `/tulosta-2027` and `/kalenteri-2027-alkuvuosi` exist | Confirmed. Both are matched and built in `src/data/seo.js` |

One note for brief 2: vappu 1.5.2027 falls on a Saturday, which caps what
cluster 12 can return.

### 2. kalenteri 2027 tulostettava

- **Target URL:** `/tulostettava-kalenteri-2027`. The best page on the site:
  472 clicks, 6.8% CTR, position 6.2. The query `kalenteri 2027 tulostettava`
  already gets 17.8% CTR at position 4.1.
- **Keywords:** kalenteri 2027 tulostettava, tulostettava kalenteri 2027,
  ilmainen tulostettava kalenteri 2027 (14.9% CTR), ilmainen kalenteri 2027,
  vuosikalenteri 2027 tulostettava.
- **Split with `/tulosta-2027`:** that page has 4,328 impressions at 0.5% CTR
  and competes for the same words. Give it the weekly print intent only:
  viikkokalenteri 2027 tulostettava, tulostettava viikkokalenteri. Link each
  page to the other once. See the naming warning below before retitling it.
- **Intent:** download a free PDF and print it on A4, today.
- **Title:** Tulostettava kalenteri 2027: ilmainen PDF | Viikko Nro
- **Meta description:** Lataa ilmainen tulostettava kalenteri 2027 PDF:nä.
  Viikkonumerot, arkipyhät ja liputuspäivät valmiina. Vuosi yhdellä sivulla
  tai kuukausi per sivu.
- **H1:** Tulostettava kalenteri 2027
- **Answer block:** Lataa kalenteri 2027 ilmaiseksi ja tulosta se A4
  paperille. Jokaisessa versiossa on viikkonumerot, arkipyhät ja
  liputuspäivät. Ei rekisteröitymistä.
- **H2 outline:**
  1. Valitse malli (thumbnail for each PDF format, download button above the
     fold)
  2. Mitä kalenterissa on
  3. Tulostusohjeet (A4, vaaka tai pysty, mustavalko)
  4. Saako kalenteria jakaa? (yes for schools and workplaces, with a link
     back; this is the link building hook)
  5. Muut vuodet (2026, 2028)
- **FAQ schema:** Onko kalenteri 2027 ilmainen? Miten tulostan kalenterin A4
  kokoon? Onko kalenterissa viikkonumerot? Voinko jakaa kalenteria koulussa?
- **Links in:** `/kalenteri-2027`, `/kalenteri-2026`, homepage, every month
  page of 2027. **Links out:** `/tulosta-2027`, `/kalenteri-2027`.
- **Ship by:** 1.11.2026. Goal: top 3 for kalenteri 2027 tulostettava, keep
  CTR above 10%.

#### Answer to the brief's check: three PDF formats already exist

The brief asks to confirm which PDF formats exist and says "if only one, add a
month per page version". There are already three families, built by
`prerender.js` and present in `dist/pdf/` (1,043 files in the current build):

| Family | Path | Canonical HTML |
| --- | --- | --- |
| Year on one page | `/pdf/kalenteri-<year>.pdf` | `/kalenteri-<year>` |
| One month per file | `/pdf/kuukausi-<month>-<year>.pdf` | `/kuukausi-<month>-<year>` |
| One week per file | `/pdf/viikko-<week>-<year>.pdf` | `/viikko-<week>-<year>` |

A month per page version therefore already exists, as 12 separate monthly
files. If the brief means a single 12 page PDF instead, that is a genuinely
new artifact and it is not a cheap addition. Under invariant 5 of the SEO
constitution every generated PDF must stay visibly linked from its HTML page,
be represented in schema, be exposed through a `rel="alternate"` link, and be
served with a matching HTML canonical in an HTTP `Link` response header. That
last one means a fourth mapping in `vercel.json`, which currently carries
exactly these three plus `/pohjat/:slug/:year.pdf`. Budget for the whole chain,
not just the generator.

Note also that the three canonical mappings bind each PDF to a *different*
page than this brief's target. No PDF currently canonicalises to
`/tulostettava-kalenteri-2027`, so decide deliberately whether a new format
should point there or keep pointing at `/kalenteri-2027`.

#### Warning: the proposed `/tulosta-2027` title collides with cluster 3

The brief says `/tulosta-2027` should start with "Tulostettava viikkokalenteri
2027". But `viikkokalenteri 2027` is cluster 3's primary keyword, and cluster 3
targets `/vuosi-2027`. Pointing a second page at that token breaks the plan's
own rule that each cluster has a single target URL.

The current titles are already distinct and already encode the intended split:

| URL | Current title |
| --- | --- |
| `/tulostettava-kalenteri-2027` | Tulostettava A4-kuukausikalenteri 2027 \| Viikko Nro |
| `/tulosta-2027` | Tulostettava viikkolista 2027 (en dash) 52 ISO-viikkoa \| Viikko Nro |
| `/kalenteri-2027` | Viikkokalenteri 2027: 12 kuukautta, 52 viikkoa \| Viikko Nro |

Two consequences the brief does not account for. First, `/kalenteri-2027`
already leads on "Viikkokalenteri 2027", so cluster 1 and cluster 3 are
competing for that token today, before any new page is retitled. Second,
"viikkolista" is the existing distinct term for `/tulosta-2027`; keeping it, or
scoping the new title to "tulostettava viikkolista", avoids creating a third
contender.

#### The `/tulosta-2027` title violates the repository's en dash rule

`printMeta()` in `src/data/seo.js` builds the title with an en dash. CLAUDE.md
forbids that character in titles and descriptions, so this title is out of
policy today, and brief 2 rewrites exactly this title.

The rule is only partly enforced. Unit tests assert that FAQ answers contain no
en dashes, but nothing guards titles or meta descriptions, which is why 168
occurrences remain across `src/data` and `src/pages` and 1,664 built HTML files
in the current `dist/` contain the character. Rewriting this title is a chance
to fix one instance; the wider cleanup and a test that covers titles is a
separate piece of work worth scheduling.

### 3. viikkokalenteri 2027

- **Target URL:** `/vuosi-2027`. Today it has 37,681 impressions, 159 clicks,
  0.42% CTR, and position 6.7.
- **Keywords:** viikkokalenteri 2027 (9,917 impressions at position 6.6),
  viikkonumerot 2027 (position 4.0), viikot 2027 (position 4.2), kalenteri
  2027 viikot, kalenteriviikot 2027, 2027 viikkokalenteri.
- **Intent:** a list of all weeks with dates, to plan work shifts, school, or
  projects.
- **Title:** Viikkokalenteri 2027: viikkonumerot ja viikot | Viikko Nro
- **Meta description:** Viikkokalenteri 2027: kaikki 52 viikkoa
  päivämäärineen. Viikko 1 alkaa 4.1.2027. Näet arkipyhät ja
  hiihtolomaviikot ja voit tulostaa viikkokalenterin.
- **H1:** Viikkokalenteri 2027: viikkonumerot
- **Answer block:** Vuodessa 2027 on 52 viikkoa. Viikko 1 alkaa maanantaina
  4.1.2027 ja viikko 52 päättyy sunnuntaina 2.1.2028. Uudenvuodenpäivä
  1.1.2027 kuuluu vielä vuoden 2026 viikkoon 53.
- **H2 outline:**
  1. Viikkonumerot 2027 (table: week, Monday, Sunday, holidays, school
     holidays)
  2. Hiihtolomaviikot 2027: viikot 8, 9 ja 10
  3. Miksi vuosi 2027 alkaa viikolla 53?
  4. Tulostettava viikkokalenteri 2027 (link to `/tulosta-2027`)
  5. Usein kysyttyä
- **FAQ schema:** Montako viikkoa vuonna 2027 on? Milloin viikko 1 alkaa
  vuonna 2027? Onko vuonna 2027 viikkoa 53? Mikä viikko on juhannus 2027?
  (viikko 25)
- **Links in:** homepage, `/vuosi-2026`, every `/viikko-N-2027` page
  (breadcrumb). **Links out:** every `/viikko-N-2027` page, `/tulosta-2027`,
  `/koululomat-2027`.
- **Ship by:** 15.11.2026. Goal: top 3 for viikkokalenteri 2027 and
  viikkonumerot 2027.

#### Brief 3 is factually clean

Every claim verified 2026-10-17 against the repository's data modules:

| Claim | Result |
| --- | --- |
| 2027 has 52 weeks, and no week 53 | Confirmed by `weeksInIsoYear(2027)` |
| Viikko 1 starts Monday 4.1.2027 | Confirmed by `mondayOf(1, 2027)` |
| Viikko 52 ends Sunday 2.1.2028 | Confirmed. Week 52 runs Mon 27.12.2027 to Sun 2.1.2028 |
| 1.1.2027 belongs to week 53 of 2026 | Confirmed by `isoWeek()` and `isoYear()` |
| Juhannus 2027 is week 25 | Confirmed. Both juhannusaatto 25.6. and juhannuspäivä 26.6. fall in ISO week 25 |
| Hiihtolomaviikot are 8, 9, and 10 | Confirmed, matching `/koululomat-2027` |

#### This settles the viikkokalenteri token

Brief 2's note raised a conflict: `viikkokalenteri 2027` is cluster 3's
keyword, yet `/kalenteri-2027` leads its current title with "Viikkokalenteri
2027". The three calendar briefs resolve this deliberately when applied
together:

| URL | Current title leads with | Proposed title leads with |
| --- | --- | --- |
| `/kalenteri-2027` | Viikkokalenteri 2027 | Kalenteri 2027 |
| `/vuosi-2027` | Viikot 2027 | Viikkokalenteri 2027 |
| `/tulosta-2027` | Tulostettava viikkolista 2027 | Tulostettava viikkokalenteri 2027 |

Brief 1 moves `/kalenteri-2027` off the token and brief 3 hands it to
`/vuosi-2027`, so the owner becomes unambiguous. Apply briefs 1 and 3 in the
same change, or the site will briefly have two pages leading on the same
keyword.

One residual overlap is smaller but real: `/tulosta-2027` would take
"Tulostettava viikkokalenteri 2027" while `/vuosi-2027`'s current description
already ends with "lataa tulostettava viikkokalenteri PDF-muodossa". The print
modifier does separate the intent, and brief 3 links to `/tulosta-2027` under
exactly that heading, so this reads as intentional. Drop the phrase from the
`/vuosi-2027` description when brief 3 lands, so only one page claims it.

## Content briefs: holidays

Holiday pages already rank around position 7 but convert at 0.09%, because the
snippet does not answer "when" as fast as the competitor's. Each brief puts the
date in the title and in the first sentence. Make the changes in
`src/data/holidayPages.js` so all years benefit.

That instruction fits the code: `holidayPageMeta()` and `holidayFaqs()` already
live in that module and are year parameterized, so a template change there
reaches 2026, 2028, and every prerendered year at once.

### 4. pääsiäinen 2027

- **Target URL:** `/pyhat-2027/paasiaispaiva`. Today it has 22,524
  impressions, 17 clicks, 0.08% CTR, and position 7.3. The single biggest 2027
  opportunity.
- **Keywords:** pääsiäinen 2027 (9,900/mo now; the 2026 term peaked at
  60,500), milloin on pääsiäinen 2027, koska on pääsiäinen 2027,
  pitkäperjantai 2027, pääsiäinen 2027 kalenteri, palmusunnuntai 2027, miten
  pääsiäinen määräytyy (390/mo).
- **Intent:** which days are off, and how long the break is.
- **Title:** Pääsiäinen 2027 on 28.3.: pyhät ja vapaapäivät | Viikko Nro
- **Meta description:** Pääsiäinen 2027: pitkäperjantai 26.3., pääsiäispäivä
  28.3. ja 2. pääsiäispäivä 29.3.2027. Neljän päivän vapaa viikoilla 12 ja 13.
  Kesäaika alkaa samana yönä.
- **H1:** Pääsiäinen 2027
- **Answer block:** Pääsiäispäivä on sunnuntaina 28.3.2027. Pitkäperjantai
  26.3. ja 2. pääsiäispäivä 29.3. ovat arkipyhiä, joten pääsiäisestä tulee
  neljän päivän vapaa perjantaista maanantaihin (viikot 12 ja 13).
- **H2 outline:**
  1. Pääsiäisen päivät 2027 (table: palmusunnuntai 21.3., kiirastorstai
     25.3., pitkäperjantai 26.3., lankalauantai 27.3., pääsiäispäivä 28.3.,
     2. pääsiäispäivä 29.3.; columns: weekday, week, day off yes or no)
  2. Kesäaika alkaa pääsiäisyönä 28.3.2027 (link to `/kesaaika-2027`)
  3. Miten pääsiäinen määräytyy? (first Sunday after the first full moon
     after the spring equinox; the Orthodox Church of Finland uses the same
     date)
  4. Kauppojen ja Alkon aukiolo pääsiäisenä (general rules plus a link to the
     official source; 1,900 searches a month for Alko alone)
  5. Pääsiäinen tulevina vuosina (2028: 16.4., then 2029, 2030)
  6. Usein kysyttyä
- **FAQ schema:** Milloin on pääsiäinen 2027? Onko kiirastorstai vapaapäivä?
  Miten pääsiäisen päivä määräytyy? Milloin on pääsiäinen 2028?
- **Links in:** homepage (upcoming holiday slot from January),
  `/kalenteri-2027`, `/pyhapaivat-2027`, `/viikko-12-2027`,
  `/viikko-13-2027`, `/pyhat-2026/paasiaispaiva`. **Links out:**
  `/pyhat-2027/pitkaperjantai`, `/kesaaika-2027`, `/pyhapaivat-2027`,
  `/pyhat-2027/helatorstai`.
- **Ship by:** 15.1.2027. Goal: top 3 for pääsiäinen 2027 and CTR above 3% by
  March.

The kesäaika angle is real and worth the section it gets. DST starts on the
last Sunday of March, which in 2027 is 28.3., the same night as pääsiäispäivä.

### 7. helatorstai 2027

- **Target URL:** `/pyhat-2027/helatorstai`. Today it has 2,896 impressions,
  0 clicks, and position 7.6.
- **Keywords:** helatorstai 2027 (1,900/mo now; the 2026 term peaked at
  22,200), onko helatorstai vapaapäivä, milloin on helatorstai.
- **Intent:** the date, and whether it is a day off.
- **Title:** Helatorstai 2027: torstai 6.5., viikko 18 | Viikko Nro
- **Meta description:** Helatorstai on torstaina 6.5.2027 (viikko 18). Se on
  arkipyhä ja yleinen vapaapäivä. Ota perjantai 7.5. vapaaksi, niin saat
  neljän päivän loman.
- **H1:** Helatorstai 2027
- **Answer block:** Helatorstai on torstaina 6.5.2027 (viikko 18). Se on
  arkipyhä ja yleinen vapaapäivä. Helatorstai on aina 39 päivää
  pääsiäispäivän jälkeen, siksi päivämäärä vaihtelee.
- **H2 outline:** Onko helatorstai vapaapäivä? / Siltapäivä perjantaina
  7.5.2027 / Miksi helatorstai on eri päivänä joka vuosi? / Helatorstai
  tulevina vuosina (2028: 25.5.) / Usein kysyttyä
- **FAQ schema:** Onko helatorstai vapaapäivä? Mikä viikko helatorstai on
  2027? Miksi helatorstai vaihtelee? Milloin on helatorstai 2028?
- **Links in:** `/pyhapaivat-2027`, `/pyhat-2027/paasiaispaiva`,
  `/viikko-18-2027`, `/kalenteri-2027`. **Links out:**
  `/pyhat-2027/helluntaipaiva`, `/vuosilomalaskuri`.
- **Ship by:** 1.3.2027. Goal: top 3 by April.

### 8. juhannus 2027

- **Target URL:** `/pyhat-2027/juhannusaatto`. Today it has 5,826
  impressions, 3 clicks, 0.05% CTR, and position 7.4.
  `/pyhat-2027/juhannuspaiva` should target only "juhannuspäivä 2027" and
  link here.
- **Keywords:** juhannus 2027 (3,600/mo now), juhannusaatto 2027, milloin on
  juhannus 2027, onko juhannusaatto pyhäpäivä.
- **Intent:** which Friday, and whether it is a day off.
- **Title:** Juhannus 2027: juhannusaatto 25.6., viikko 25 | Viikko Nro
- **Meta description:** Juhannusaatto on perjantaina 25.6.2027 ja
  juhannuspäivä lauantaina 26.6.2027 (viikko 25). Katso onko aatto
  vapaapäivä ja milloin liputetaan.
- **H1:** Juhannus 2027
- **Answer block:** Juhannusaatto on perjantaina 25.6.2027 ja juhannuspäivä
  lauantaina 26.6.2027 (viikko 25). Juhannusaatto ei ole virallinen
  pyhäpäivä, mutta monissa työehtosopimuksissa se on vapaapäivä.
- **H2 outline:** Onko juhannusaatto vapaapäivä? / Juhannuksen liputus /
  Miten juhannuksen päivä määräytyy? (Saturday between 20.6. and 26.6.) /
  Juhannus tulevina vuosina (2028: aatto 23.6.) / Usein kysyttyä
- **FAQ schema:** Milloin on juhannus 2027? Onko juhannusaatto pyhäpäivä?
  Milloin juhannuksena liputetaan? Milloin on juhannus 2028?
- **Links in:** `/pyhapaivat-2027`, `/liputuspaivat-2027`,
  `/viikko-25-2027`, `/kalenteri-2027`. **Links out:**
  `/pyhat-2027/juhannuspaiva`, `/liputuspaivat-2027`.
- **Ship by:** 15.4.2027. Goal: top 3 by June.

### 9. arkipyhät 2027

- **Target URL:** `/pyhapaivat-2027`. Today it has 1,017 impressions and
  position 7.4. The 2026 term peaked at 8,100 searches a month.
- **Keywords:** arkipyhät 2027, pyhäpäivät 2027, vapaapäivät 2027, vuoden
  2027 arkipyhät, arkivapaat 2027, juhlapyhät 2027.
- **Intent:** count the days off in 2027 and plan holidays around them.
- **Title:** Arkipyhät 2027: pyhäpäivät ja vapaapäivät | Viikko Nro
- **Meta description:** Kaikki arkipyhät 2027 päivämäärineen ja viikkoineen.
  Kuusi virallista arkipyhää osuu arkipäiville. (The supplied brief also
  claimed five weekend holidays. See the correction below.)
- **H1:** Arkipyhät ja pyhäpäivät 2027
- **Answer block:** Vuonna 2027 arkipäiville osuu kuusi virallista
  arkipyhää: uudenvuodenpäivä 1.1., loppiainen 6.1., pitkäperjantai 26.3.,
  2. pääsiäispäivä 29.3., helatorstai 6.5. ja itsenäisyyspäivä 6.12.
- **H2 outline:**
  1. Arkipyhät 2027 (table: holiday, date, weekday, week, falls on a weekday
     yes or no)
  2. Vuosi 2027 vapaapäivien kannalta (the weekend holidays angle; compare
     with 2026)
  3. Pitkät viikonloput ja siltapäivät 2027
  4. Aatot: juhannusaatto ja jouluaatto (both Fridays in 2027)
  5. Usein kysyttyä
- **FAQ schema:** Montako arkipyhää vuonna 2027 on? Onko vappu 2027
  vapaapäivä? (Saturday) Mitkä pyhät osuvat viikonlopulle 2027? Onko
  jouluaatto pyhäpäivä?
- **Links in:** homepage Vuosi 2027 block, `/kalenteri-2027`,
  `/pyhapaivat-2026`, `/tyopaivat-2027`. **Links out:** every
  `/pyhat-2027/*` page, `/tyopaivat-2027`, `/liputuspaivat-2027`.
- **Ship by:** 1.12.2026. Goal: top 3 for arkipyhät 2027 by January.

#### Correction: seven official holidays fall on a weekend in 2027, not five

The supplied brief states "viisi pyhää osuu viikonlopulle" and lists vappu,
juhannuspäivä, pyhäinpäivä, joulupäivä, and tapaninpäivä. Counted from
`src/data/holidayPages.js`, where `official: true` marks the statutory days,
2027 splits like this:

| Falls on | Count | Days |
| --- | --- | --- |
| Weekday | 6 | uudenvuodenpäivä 1.1. (pe), loppiainen 6.1. (ke), pitkäperjantai 26.3. (pe), 2. pääsiäispäivä 29.3. (ma), helatorstai 6.5. (to), itsenäisyyspäivä 6.12. (ma) |
| Weekend | 7 | pääsiäispäivä 28.3. (su), vappu 1.5. (la), helluntaipäivä 16.5. (su), juhannuspäivä 26.6. (la), pyhäinpäivä 6.11. (la), joulupäivä 25.12. (la), tapaninpäivä 26.12. (su) |

The brief omits pääsiäispäivä and helluntaipäivä, which are always Sundays.
The weekday count of six is right and matches the existing
`workingDaysFaqs(2027)` answer, so only the weekend number is wrong.

This matters because the number goes in a meta description and answers the FAQ
"Mitkä pyhät osuvat viikonlopulle 2027?". Either say seven and list all seven,
or state the narrower claim the brief probably means: five holidays that could
have fallen on a weekday land on a weekend in 2027. Do not publish five as a
bare count.

The brief's H2 section 4 is right that juhannusaatto and jouluaatto are both
Fridays in 2027, and the data agrees they are not official holidays, which is
also why they count as working days in the 255 figure.

### 12. vappu 2027

- **Target URL:** `/pyhat-2027/vappu`. Small today (45 impressions), but
  vappu searches spike in April.
- **Keywords:** vappu 2027, milloin on vappu 2027, onko vappu vapaapäivä
  2027.
- **Title:** Vappu 2027: lauantai 1.5., viikko 17 | Viikko Nro
- **Answer block:** Vappu on lauantaina 1.5.2027 (viikko 17). Koska vappu
  osuu lauantaille, se ei anna ylimääräistä vapaapäivää viisipäiväistä
  viikkoa tekeville.
- **H2 outline:** Onko vappu vapaapäivä 2027? / Vappuaatto perjantaina 30.4.
  / Vapun liputus / Usein kysyttyä
- **FAQ schema:** Milloin on vappu 2027? Onko vappuaatto vapaapäivä?
  Liputetaanko vappuna?
- **Ship by:** 15.3.2027.

### Every date in briefs 4, 7, 8, 9, and 12 is correct

Resolved 2026-10-17 from `holidayPageFor()` and `isoWeek()`:

| Day | Date | Weekday | Week |
| --- | --- | --- | --- |
| Palmusunnuntai | 21.3.2027 | sunnuntai | 11 |
| Kiirastorstai | 25.3.2027 | torstai | 12 |
| Pitkäperjantai | 26.3.2027 | perjantai | 12 |
| Pääsiäispäivä | 28.3.2027 | sunnuntai | 12 |
| 2. pääsiäispäivä | 29.3.2027 | maanantai | 13 |
| Vappu | 1.5.2027 | lauantai | 17 |
| Helatorstai | 6.5.2027 | torstai | 18 |
| Juhannusaatto | 25.6.2027 | perjantai | 25 |
| Juhannuspäivä | 26.6.2027 | lauantai | 25 |
| Jouluaatto | 24.12.2027 | perjantai | 51 |

The four day pääsiäinen break does span weeks 12 and 13, helatorstai is 39 days
after pääsiäispäivä, and the next year dates are right: pääsiäinen 2028 on
16.4., helatorstai 2028 on 25.5., juhannusaatto 2028 on 23.6.

### Two claims in these briefs need a source before publishing

CLAUDE.md requires editorial claims to be verified against an official source,
with the source and review date recorded in the data module.

- **The juhannus flag protocol** in brief 8 (raised at 18:00 on juhannusaatto,
  lowered at 21:00 on juhannuspäivä) is not in `src/data/flagDayPages.js`
  today. It needs an official citation and a recorded review date before it
  goes on the page.
- **Shop and Alko opening hours** in brief 4 section 4 are third party facts
  that change. The brief already says to recheck them each spring; record the
  source and review date alongside, and prefer linking the official source
  over restating specifics.

Also note that `holidaysMeta()` builds the `/pyhapaivat-<year>` title with an
en dash, so brief 9 is another chance to remove one.

## Content briefs: weeks, working days and payment dates

Week pages are template pages, so one change to `weekMeta()` in
`src/data/seo.js` improves all 52 at once. The rule: when a week holds a
holiday or a school holiday, that event goes into the title, because that is
why people search for the week.

### 6. viikko 8, 9 ja 10 2027

- **Target URLs:** `/viikko-8-2027`, `/viikko-9-2027`, `/viikko-10-2027`.
  Together 11,698 impressions at position 7 and about 0.1% CTR, almost half of
  all 2027 week impressions.
- **Why these three:** they are the 2027 ski holiday weeks. Etelä-Suomi has
  week 8 (22.2. to 28.2.), Väli-Suomi week 9 (1.3. to 7.3.), Itä- ja
  Pohjois-Suomi week 10 (8.3. to 14.3.).
- **Keywords:** viikko 8 2027, vko 8 2027, viikko 8 vuonna 2027, viikko 9
  2027, viikko 10 2027, vk 10 2027, viikko 10 2027 kalenteri.
- **Title (week 8):** Viikko 8 2027: hiihtoloma, ma 22.2. alkaen | Viikko Nro
- **Meta description (week 8):** Viikko 8 vuonna 2027 alkaa maanantaina 22.2.
  ja päättyy sunnuntaina 28.2. Se on Etelä-Suomen hiihtolomaviikko,
  esimerkiksi Helsingissä, Espoossa ja Turussa.
- **H1:** Viikko 8 vuonna 2027
- **H2 outline:** Viikon 8 päivät / Hiihtoloma viikolla 8: mitkä kunnat /
  Muut hiihtolomaviikot 2027 / Tulosta viikko 8
- **FAQ schema:** Milloin on hiihtoloma 2027? Kenellä on hiihtoloma viikolla
  8? Mikä viikko on hiihtoloma Helsingissä 2027?
- **Dev change:** in `weekMeta()`, put the confirmed school holiday type in
  the title, not only in the description.
- **Ship by:** 15.1.2027. Goal: top 3 for viikko 8, 9 and 10 2027 by
  February.

Verified: the week ranges and every city grouping match
`schoolHolidayPage(2027)` exactly, all three groups marked `confirmed` from
`oph2026`.

| Week | Range | Confirmed cities in the data |
| --- | --- | --- |
| 8 | 22.2. to 28.2.2027 | Helsinki, Espoo, Vantaa, Pori, Turku |
| 9 | 1.3. to 7.3.2027 | Hämeenlinna, Jyväskylä, Kokkola, Kotka, Kouvola, Lahti, Lappeenranta, Mikkeli, Seinäjoki, Tampere, Vaasa |
| 10 | 8.3. to 14.3.2027 | Joensuu, Kajaani, Kuopio, Oulu, Rovaniemi |

### 11. viikko N 2027, all other weeks

- **Target URLs:** `/viikko-1-2027` to `/viikko-52-2027`. 14,453 impressions
  across the other weeks, position 6.8, CTR 0.2%.
- **Intent:** the dates of one week, searched one or two weeks before it
  starts.
- **Title rule:** "Viikko N 2027: ma d.m. alkaen | Viikko Nro", plus the
  week's event when there is one.
- **Answer block (template):** Viikko N vuonna 2027 alkaa maanantaina d.m. ja
  päättyy sunnuntaina d.m.2027. [If any: Viikolla on X.] Tänään on viikko
  [current week].
- **H2 outline (template):** Viikon N päivät / Viikon tapahtumat / Edellinen
  ja seuraava viikko / Tulosta viikko N
- **FAQ schema:** Milloin viikko N 2027 alkaa? Mitä viikolla N 2027 on?
- **Links:** each week page links to the previous and next week, to
  `/vuosi-2027`, and to any holiday page that falls in it.
- **Ship by:** 1.12.2026 (one template change). Goal: CTR above 1% on week
  pages.

The event mapping is correct. Weeks 12 and 13 hold pääsiäinen, 17 vappu, 18
helatorstai, 25 juhannus, 49 itsenäisyyspäivä, and 51 joulu, with joululoma
starting Thursday 23.12.2027 inside week 51 (20.12. to 26.12.).

One caveat on week 42. The range is right (18.10. to 24.10.2027, so a
18.10. to 22.10. school week), but `schoolHolidayPage(2027)` confirms syysloma
for **Helsinki only**. A title that calls week 42 "syysloma" without
qualification claims more than the data supports. Either name the city, or
wait until more municipalities are confirmed. This is the same data that gates
`/koululomat-2027` indexability, so it is worth watching anyway.

### 10. työpäivät 2027

- **Target URL:** `/tyopaivat-2027`. Already strong: 5,408 impressions, 173
  clicks, 3.2% CTR, position 4.5. The query työpäivät 2027 is at position
  2.5.
- **Keywords:** työpäivät 2027, työpäiväkalenteri 2027 (8.1% CTR),
  työpäivien määrä 2027, arkipäivät 2027, montako työpäivää vuodessa.
- **Intent:** the exact number of working days, per year and per month, for
  payroll and HR.
- **Title:** Työpäivät 2027: <N> työpäivää, kuukausittain | Viikko Nro, where
  N comes from the same data the page shows. See the decision below.
- **H1:** Työpäivät 2027
- **H2 outline:** Työpäivät kuukausittain 2027 / Arkipyhät, jotka vähentävät
  työpäiviä / Työpäivälaskuri / Vertailu: 2026 ja 2027 / Usein kysyttyä
- **FAQ schema:** Montako työpäivää vuonna 2027 on? Montako työpäivää on
  kuukaudessa? Lasketaanko juhannusaatto työpäiväksi?
- **Links in:** `/kalenteri-2027`, `/pyhapaivat-2027`, `/tyopaivat-2026`.
  **Links out:** the month pages, `/tyopaivalaskuri`, `/palkkapaivat-2027`.
- **Ship by:** 1.12.2026. Goal: position 1 and CTR above 5%.

#### Decision needed: 253 or 255 working days

The brief asks to confirm the counting rule for the two eves. Here is the
answer, with the arithmetic verified against the repository:

| Step | Count |
| --- | --- |
| Arkipäivät, Monday to Friday, in 2027 | 261 |
| Minus the 6 official arkipyhät that fall on weekdays | 255 |
| Minus juhannusaatto 25.6. and jouluaatto 24.12., both Fridays | 253 |

Both numbers are arithmetically right. They are different rules, and the
repository has already chosen one: `src/data/dayRules.js` states that in the
työpäivälaskuri mode "Jouluaatto ja juhannusaatto lasketaan työpäiviksi", and
`workingDaysFaqs(2027)` answers "Vuonna 2027 on 255 työpäivää" on this very
page today.

So shipping the brief as written would make the page contradict itself twice
over: the title would say 253 while its own FAQ block says 255, and it links
to `/tyopaivalaskuri`, which counts on the 255 basis. The same mode also backs
the project planner and the sprint planner, so changing it is a platform wide
decision, not a copy tweak.

Two clean options:

1. **Publish 255** and keep every number sourced from `workingDaysFaqs()`.
   Cheapest, internally consistent, no code change beyond the title template.
2. **Publish both**, which the brief's own answer block already hints at: 261
   arkipäivää, 255 työpäivää, and 253 when the two eves are also off. This
   actually serves the search intent better, because payroll readers need to
   know which convention they are getting, and it answers the FAQ
   "Lasketaanko juhannusaatto työpäiväksi?" directly.

What must not happen is a hand typed 253 in the title. CLAUDE.md requires the
count to come from the data module, and the brief agrees.

### 16. palkkapäivät, eläkkeen ja Kelan maksupäivät 2027

- **Target URLs:** `/palkkapaivat-2027`, `/elakkeen-maksupaivat-2027`,
  `/kelan-maksupaivat-2027`. The 2026 versions earn 878, 3,469, and 1,761
  impressions, so expect searches from December.
- **Keywords:** palkkapäivät 2027, eläkkeen maksupäivät 2027,
  kansaneläkkeen maksupäivät 2027, kelan maksupäivät 2027, lapsilisän
  maksupäivät 2027.
- **Intent:** the exact date money arrives each month, and what happens when
  that day is a weekend or holiday.
- **Title pattern:** Eläkkeen maksupäivät 2027: kaikki päivät | Viikko Nro
- **Answer block:** the next payment date in bold first, then the full year
  table.
- **H2 outline:** Maksupäivät 2027 kuukausittain / Mitä tapahtuu, jos
  maksupäivä on viikonloppu tai pyhä / Joulukuun ja juhannuksen poikkeukset /
  Usein kysyttyä
- **Check:** confirm 2027 dates against Kela and the pension providers'
  published schedules before shipping; never estimate.
- **Ship by:** 1.12.2026. Goal: top 3 for each in January.

The brief is right about the dash, and precise about which page has it:

| URL | Current title | Dash |
| --- | --- | --- |
| `/palkkapaivat-2027` | Palkkapäivät 2027 (en dash) milloin palkka tulee | en dash, out of policy |
| `/elakkeen-maksupaivat-2027` | Eläkkeen maksupäivät 2027, työ- ja kansaneläke | plain hyphen, fine |
| `/kelan-maksupaivat-2027` | Kelan maksupäivät 2027: lapsilisä ja asumistuki | none, fine |

The "never estimate" instruction matches repository policy exactly. Payment
dates are editorial claims about third parties, so each needs its official
source and a review date recorded in the data module, and the pages must not
fall back to a computed guess if a schedule is unpublished. Note that a bank
day rule already exists in `dayRules.js`: jouluaatto and juhannusaatto are
bank holidays there, and pay moves to the preceding bank day. Reuse that rule
rather than restating it in copy.

## Content briefs: school holidays, clock change, flag days and observances

These pages are smaller, but each has a sharp, dated peak. They should go live
three to six weeks before their day.

### 5. hiihtoloma 2027

- **Target URL:** `/koululomat-2027`. Today it has 17,615 impressions, 48
  clicks, 0.27% CTR, and position 7.0. The hiihtoloma 2027 queries alone add
  up to 9,323 impressions across 48 variants, most with a city name.
- **Keywords:** hiihtoloma 2027 (2,336 impressions, position 6.6),
  hiihtolomat 2027, hiihtolomaviikot 2027, milloin on hiihtoloma 2027,
  hiihtoloma 2027 plus a city (Helsinki, Espoo, Vantaa, Kuopio, Oulu,
  Hämeenlinna, Seinäjoki), talvilomaviikot 2027.
- **Intent:** which week my children are off, for my municipality.
- **Title (January to March):** Hiihtoloma 2027: viikot 8, 9 ja 10 alueittain
  | Viikko Nro. Season aware like the clock change fix: kesäloma first from
  April, syysloma first from August.
- **Meta description:** Hiihtoloma 2027: Etelä-Suomi viikolla 8 (22.2.
  alkaen), Väli-Suomi viikolla 9 (1.3. alkaen), Itä- ja Pohjois-Suomi
  viikolla 10 (8.3. alkaen). Katso oma kuntasi.
- **H1:** Koulujen lomat 2027: hiihtoloma, kesäloma ja syysloma
- **H2 outline:**
  1. Hiihtoloma 2027 alueittain (table: region, week, dates, example cities)
  2. Hiihtoloma 2027 kunnittain (one row per searched city with an anchor id
     each, so "hiihtoloma 2027 espoo" lands on its row; verify every city
     against the municipality's published decision)
  3. Joululoma 2026 to 2027 (21.12.2026 to 6.1.2027)
  4. Kesäloma 2027 (lukuvuosi päättyy lauantaina 5.6.2027)
  5. Syysloma 2027 (viikko 42, 18.10. to 22.10.2027)
  6. Usein kysyttyä
- **FAQ schema:** Milloin on hiihtoloma 2027? Mikä viikko on hiihtoloma
  Helsingissä 2027? Milloin kesäloma 2027 alkaa? Milloin on syysloma 2027?
- **Links in:** homepage from January, the three ski weeks,
  `/kalenteri-2027`, `/koululomat-2026`. **Links out:** the three ski weeks,
  `/vuosilomalaskuri`.
- **Ship by:** 15.1.2027. Goal: top 3 for hiihtoloma 2027 and for the five
  biggest city variants by February.

The ski week regions and dates match the repository exactly (see brief 6), and
lukuvuosi ending Saturday 5.6.2027 is correct. Two cautions. The anchor row per
city plan is sound, but `schoolHolidayPage(2027)` currently names 21 cities
across the three winter groups, so any city searched but not in that list needs
its own sourced decision rather than a regional guess. And the joululoma range
21.12.2026 to 6.1.2027 is not in the 2027 page data, which holds winter and
autumn groups only; it needs a source and a recorded review date before it
goes on the page.

### 13. kesäaika 2027

- **Target URL:** `/kesaaika-2027`. Today it has 870 impressions and position
  5.8. The 2026 page gets 28,178 impressions around each change, so this page
  needs to be ready for March.
- **Keywords:** kesäaika 2027, kellojen siirto 2027 (position 1.3 already),
  talviaika 2027, milloin kellot siirretään 2027.
- **Title (January to March):** Kesäaika 2027 alkaa 28.3.: kellot eteenpäin |
  Viikko Nro. From April the season aware title leads with talviaika
  31.10.2027.
- **Answer block:** Kesäaika 2027 alkaa sunnuntaina 28.3.2027 klo 3.00, kun
  kellot siirretään tunti eteenpäin. Samana yönä vietetään pääsiäispäivää.
  Talviaika alkaa sunnuntaina 31.10.2027 klo 4.00.
- **H2 outline:** Kellojen siirto 2027 / Kesäaika ja pääsiäinen samana yönä /
  Kumpaan suuntaan kelloja siirretään / Loppuuko kellojen siirtäminen EU:ssa?
  / Usein kysyttyä
- **Links in:** `/pyhat-2027/paasiaispaiva`, `/viikko-12-2027`,
  `/kesaaika-2026`. **Links out:** `/pyhat-2027/paasiaispaiva`.
- **Ship by:** 1.3.2027 for spring, 1.10.2027 for autumn. Goal: top 3 for
  kesäaika 2027 in March.

This is the cheapest brief in the set. Both dates are already correct on the
live page, whose description reads "kesäaika alkaa 28.3.2027 klo 3.00 ... 
Talviaika alkaa 31.10.2027 klo 4.00", and 31.10.2027 is confirmed as a Sunday.
The existing title already leads with the season, so the season aware
machinery the brief refers to is in place. The new work is the pääsiäinen
crossover section and the links, not the facts.

### 14. liputuspäivät 2027

- **Target URL:** `/liputuspaivat-2027`. Today it has 1,420 impressions, 33
  clicks, 2.3% CTR, and position 8.7.
- **Keywords:** liputuspäivät 2027, liputuspäivä tänään, liputetaanko
  tänään, mikä liputuspäivä on tänään.
- **Title:** Liputuspäivät 2027: viralliset ja vakiintuneet | Viikko Nro
- **Answer block:** a live line at the top ("Tänään liputetaan: ..." or
  "Seuraava liputuspäivä on ..."), then the count of official and customary
  flag days in 2027, generated from `flagDayPages.js`.
- **H2 outline:** Liputetaanko tänään? / Viralliset liputuspäivät 2027 /
  Vakiintuneet liputuspäivät 2027 / Liputusajat ja säännöt / Usein kysyttyä
- **FAQ schema:** Liputetaanko tänään? Mihin aikaan lippu nostetaan? Mitkä
  ovat viralliset liputuspäivät 2027?
- **Ship by:** 1.12.2026. Goal: top 3 and CTR above 5%.

`flagDaysInYear(2027)` returns 22 days in **three** categories, not two:

| Category | Count |
| --- | --- |
| virallinen | 7 |
| vakiintunut | 13 |
| kansainvälinen | 2 |

The two table outline leaves the two international days with nowhere to go.
Either add a third table or state explicitly why they are excluded, because
dropping rows the data contains will show up as a gap against competitors.

The "Tänään liputetaan" line is a daily answer on a prerendered page. That
works here, since `vercel-rebuild.yml` rebuilds daily and
`src/data/sitemapMetadata.js` already uses the render day as `lastmod` for
daily answers. Keep the same pattern rather than inventing a client only
widget, and remember the page can be up to a day stale if a rebuild fails.

### 15. ystävänpäivä, isänpäivä, äitienpäivä, Runebergin päivä ja helluntai 2027

- **Target URLs:** `/ystavanpaiva-2027`, `/isanpaiva-2027`,
  `/aitienpaiva-2027`, `/pyhat-2027/helluntaipaiva`, and a Runebergin päivä
  page. Together 1,848 impressions today; isänpäivä 2027 already has 574 at
  position 9.9, a year early.
- **Title template:** {Päivä} 2027: sunnuntai 14.2. | Viikko Nro (the weekday
  and date, nothing else).
- **Answer block template:** {Päivä} on {viikonpäivänä} {d.m.yyyy} (viikko
  N). {One line on whether it is a flag day.} {One line on how the date is
  set.}
- **H2 outline (template):** Milloin {päivä} on 2027? / Liputetaanko? /
  Miten päivä määräytyy / Tulevat vuodet / Usein kysyttyä
- **Ship by:** four weeks before each day (Runebergin päivä and ystävänpäivä
  by 10.1.2027, äitienpäivä and helluntai by 10.4.2027, isänpäivä by
  15.10.2027).
- **Goal:** top 3 for each in the two weeks before its day.

Every date is correct:

| Day | Date | Weekday | Week |
| --- | --- | --- | --- |
| Runebergin päivä | 5.2.2027 | perjantai | 5 |
| Ystävänpäivä | 14.2.2027 | sunnuntai | 6 |
| Äitienpäivä | 9.5.2027 | sunnuntai | 18 |
| Helluntai | 16.5.2027 | sunnuntai | 19 |
| Isänpäivä | 14.11.2027 | sunnuntai | 45 |

#### The Runebergin päivä page does not exist

This is the one target in the whole plan that is not a real URL. `ystavanpaiva`,
`aitienpaiva` and `isanpaiva` are in `OBSERVANCES` and resolve through
`observancePath()`, but Runebergin päivä is not. It appears only in
`src/data/flagDayPages.js`, where `runebergin-paiva` is defined as an anchor id
on the `/liputuspaivat-<year>` table. The code says so directly: "ASCII slugs,
used as anchor ids on the /liputuspaivat-<year> table rows".

So there are two choices, and they cost very different amounts:

1. **Target the anchor**, `/liputuspaivat-2027#runebergin-paiva`. Free, but an
   anchor cannot carry its own title, FAQ schema, or canonical, so it cannot
   do what the brief's template asks and will not rank as its own result.
2. **Add Runebergin päivä to `OBSERVANCES`**, giving it a real
   `/runebergin-paiva-2027` page. This is a new page family in the sense the
   SEO constitution uses, so it must be added to the route, metadata, schema,
   sitemap, internal link, and AI file generators, and it needs the full
   release gate. Note it is a *vakiintunut* flag day, not an official one, so
   the page should say so.

Given the modest volume, option 1 plus a strong row on `/liputuspaivat-2027` is
the proportionate choice unless the Runeberg query data says otherwise. The
plan's claim that every target page already exists holds for the other fifteen
clusters.

## Verified against the code

Checked 2026-10-17 at `main` 7ed1d71, read only.

| Claim | Result |
| --- | --- |
| Every target URL family exists | Confirmed. `src/data/seo.js` matches and builds `/kalenteri-`, `/tulostettava-kalenteri-`, `/vuosi-`, `/koululomat-`, `/pyhapaivat-`, `/tyopaivat-`, `/kesaaika-`, `/liputuspaivat-`, `/palkkapaivat-`, `/kelan-maksupaivat-`, `/elakkeen-maksupaivat-`, and `/pyhat-YYYY/<slug>`, all year parameterized |
| ystävänpäivä, äitienpäivä, isänpäivä | Confirmed as observance days. `observancePath()` builds `/<slug>-<year>`, so `/ystavanpaiva-2027` is the right shape, not a `/pyhat-2027/` child |
| Holiday slugs for clusters 4, 7, 8, 12 | Confirmed in `src/data/holidayPages.js`: `paasiaispaiva`, `helatorstai`, `juhannusaatto`, `vappu`, `helluntaipaiva` |
| Ski holiday weeks 22.2., 1.3., 8.3.2027 | Confirmed. ISO weeks 8, 9, and 10 of 2027 start on exactly those Mondays |
| `/koululomat-2027` is sitemap eligible | Confirmed today. `pageConfidenceTier(2027)` returns `confirmed`, sourced from `oph2026` |
| Week and year pages cover 2027 | Confirmed, and wider than the plan assumed |

## Decisions

Taken 2026-10-17. These settle the corresponding open questions below.

| Question | Decision |
| --- | --- |
| Working days for 2027 | **255 everywhere.** It matches `dayRules.js`, the existing `workingDaysFaqs()` answer and `/tyopaivalaskuri`. Briefs 1 and 10 are amended accordingly; no `dayRules.js` change |
| Runebergin päivä | **Target the anchor** `/liputuspaivat-2027#runebergin-paiva` and strengthen that table row. No new observance page |
| En dash | **Sweep plus a guarding test.** One pass over `src/data` and `src/pages`, plus a test covering titles and descriptions as FAQ answers already are. Separate change from the content waves |
| Sequence | **Implement, starting with the calendar wave** (briefs 1, 2, 3), which must ship as one change because brief 1 is what frees the viikkokalenteri token for brief 3 |

## Implementation log

### Calendar wave, metadata layer (branch `seo/calendar-wave-2027`)

Briefs 1, 2, and 3 applied to `src/data/seo.js`. All four pages keep titles
under 60 characters and descriptions inside the 140 to 160 band for every year
from 2020 to 2035.

| URL | Before | After |
| --- | --- | --- |
| `/kalenteri-2027` | Viikkokalenteri 2027: 12 kuukautta, 52 viikkoa | Kalenteri 2027: viikkonumerot ja pyhäpäivät |
| `/vuosi-2027` | Viikot 2027: viikkonumerot ja kaikki 52 viikkoa | Viikkokalenteri 2027: viikkonumerot ja viikot |
| `/tulostettava-kalenteri-2027` | Tulostettava A4-kuukausikalenteri 2027 | Tulostettava kalenteri 2027: ilmainen PDF |
| `/tulosta-2027` | Tulostettava viikkolista 2027 (en dash) 52 ISO-viikkoa | Tulostettava viikkokalenteri 2027: 52 viikkoa |

Three deviations from the briefs as supplied, each made deliberately:

1. **255, not 253.** `/kalenteri-2027` now reads its working-day count from
   `workingDaySplit()`, the same function behind `workingDaysFaqs()`, so the
   number can never diverge from `/tyopaivat-2027`. Per the decision above.
2. **No hiihtoloma promise in the `/vuosi-` description.** School-holiday data
   covers 2026 to 2028 only, and `metaPromises.test.js` exists to stop a year
   description promising content that year cannot render. The ski weeks belong
   in the page body. The brief's real improvement, the concrete week 1 start
   date, is in.
3. **Breadcrumb leaf labels follow the new titles**, so `/tulosta-` reads
   "Tulostettava viikkokalenteri" and `/tulostettava-kalenteri-` reads
   "Tulostettava kalenteri". Breadcrumbs elsewhere still say "Viikot <year>"
   for `/vuosi-`, which is kept on purpose: it is cluster 3's supporting
   keyword, so the title and the internal anchor text cover two query forms
   for one URL.

The en dash in `printMeta()` is gone as a side effect. The remaining
occurrences are left to the sweep.

Test changes, all updating assertions that encoded the old token split rather
than relaxing them:

- `keywordMeta.test.js` now asserts the new leads, plus a new case proving the
  year and calendar titles never lead with the same token in any year.
- `printCalendarContent.test.js` asserts the new distinct leads and that the
  browsable year page states a working-day count.
- `breadcrumbs.test.js` follows the new leaf labels.

`workingDaySplit()` is now memoized per year. Reading it from `calendarMeta()`
made the ~365-day walk run often enough to push `pageTopics.test.jsx` past its
5 second timeout.

Gate status: lint, 1,107 unit tests, production build, SSR rebuild, and
`check:crawl` all pass (0 render errors, 1,043 of 1,043 PDFs linked). One
generated-artifact case fails, and it is **pre-existing on `main`**: see below.

### Blocker: the CSP hash on `main` is stale

`scripts/predeploy-build.cases.mjs` asserts that the inline head script in
`dist/index.html` is allow-listed in `vercel.json`. It is not:

| | Value |
| --- | --- |
| Script actually built | `sha256-16xOB69q4Of4Coft2LmKc8OTdvZtRdahMFn0ninAJZ0=` |
| Allow-listed in `vercel.json` | `sha256-ikazaQ2jbqlTos4KFcbhA5awOVSg592PPX8K1Biu9Lk=` |

This branch changes neither `index.html` nor `vercel.json`, so the mismatch
predates it. `index.html` last changed in #78 and the hash was never refreshed.
Nothing is broken in production, because the header is
`Content-Security-Policy-Report-Only`, so the policy reports rather than
blocks. But the release gate is red on `main`, which means every pull request
fails this case until the hash is refreshed. That is a one line fix and should
be its own change, not folded into a content wave.

## Open questions before this becomes work

- The source exports now disagree three ways on pääsiäinen 2027: 19,954
  impressions at 0.06% CTR, 22,234 at 0.09%, and 22,524 at 0.08%. The last is
  URL level and the others are query level, which explains part of the spread
  but not all of it. Pick one export and one measurement level before using any
  of these as the baseline for the biggest page in the plan.
- Brief 9 states five official holidays fall on a weekend in 2027. The repo's
  own data says seven. Agree the definition and the number before it goes in a
  meta description.
- `/koululomat-2027` carries a conditional indexability gate the plan does not
  mention. `pageConfidenceTier()` demotes the whole page to `noindex` and drops
  it from the sitemap if any winter or autumn group is `ESTIMATED` rather than
  `CONFIRMED`. It passes today on `oph2026` data, but cluster 5 is a P1 whose
  indexability depends on that staying true. Treat a tier change as a release
  blocker for that wave.
- Briefs 1 and 10 both specify 253 working days for 2027 where the site's own
  `/tyopaivat-2027` page and the linked `/tyopaivalaskuri` use 255. The
  arithmetic behind both is sound (261 arkipäivää, minus 6 arkipyhät, minus
  the two eves), but `dayRules.js` has already chosen the 255 rule, and the
  same mode backs the project and sprint planners. Decide between publishing
  255 everywhere or publishing all three numbers with their rules, then source
  it from the data module. See brief 10 for the full comparison.
- Resolved by brief 3: `/vuosi-2027` owns "viikkokalenteri 2027". Briefs 1 and
  3 must ship together, because brief 1 is what moves `/kalenteri-2027` off
  that token. Shipping brief 3 alone leaves two pages leading on it.
- Brief 15 targets a Runebergin päivä page that does not exist.
  `runebergin-paiva` is an anchor id on `/liputuspaivat-<year>`, not a route.
  Choose between targeting the anchor and adding a new observance page with
  the full new-page-family process.
- Brief 14's outline has two flag day tables, but `flagDaysInYear(2027)`
  returns three categories: 7 virallinen, 13 vakiintunut, 2 kansainvälinen.
  Decide where the international days go.
- Joululoma 21.12.2026 to 6.1.2027 in brief 5 is not in the repository's
  school holiday data. It needs a source and a review date.
- Week 42 of 2027 has syysloma confirmed for Helsinki only. Brief 11 would put
  "syysloma" in that week's title. Decide whether to qualify it by city or
  hold the title until more municipalities are confirmed.
- Titles and meta descriptions are not covered by the en dash tests that guard
  FAQ answers. 168 occurrences remain in `src/data` and `src/pages`. Decide
  whether to schedule a cleanup plus a guarding test, or keep fixing them one
  page at a time as each brief lands.
- The plan's "keep 2027 inside the week page index window" item is a non-issue.
  There is no "current year plus next year" window in the code.
  `sitemapEntries()` runs 2020 through the current year plus 9
  (`FUTURE_HORIZON`), so 2027 is already prerendered, indexable, and in the
  sitemap.

## Sources

- Google Search Console, 13.7. to 13.10.2026, top 1,000 queries.
- Semrush Finland database, exported 14.10.2026.
- Holiday and school holiday dates come from this repository's own data modules
  (`src/data/holidayPages.js`, `src/data/schoolHolidayPages.js`).
