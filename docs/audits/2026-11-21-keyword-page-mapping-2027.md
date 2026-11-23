# Keyword to page mapping, 2027 calendar cluster

Date: 21 November 2026

Deliverable for Phase 1.1 of the 2027 calendar push. Supersedes the mapping in
the Phase 1 task list, which assigned the week-calendar intent to
`/kalenteri-2027`.

## Method

Live Search Console query, read only, no sitemap submission and no indexing
request. Property `sc-domain:viikkonro.fi`, Finnish web search, finalized data,
window **19 August 2026 to 17 November 2026** (90 days). One query per term,
`page` as the sole dimension, so each row is a URL competing on that exact
term.

Unlike the 30 October 2026 audits, these are measured figures rather than
owner-supplied totals.

## Measured query to page data

| Query | URL | Clicks | Impressions | CTR | Position |
| --- | --- | ---: | ---: | ---: | ---: |
| viikkokalenteri 2027 | `/vuosi-2027` | 328 | 8,808 | 3.72% | 4.3 |
| | `/kalenteri-2027` | 162 | 12,446 | 1.30% | 6.2 |
| | `/tulostettava-kalenteri-2027` | 11 | 1,662 | 0.66% | 6.6 |
| viikot 2027 | `/vuosi-2027` | 56 | 3,601 | 1.56% | 4.1 |
| | `/kalenteri-2027` | 11 | 2,428 | 0.45% | 6.7 |
| | `/kuukausi-2-2027` | 2 | 534 | 0.37% | 7.7 |
| viikkonumerot 2027 | `/vuosi-2027` | 47 | 4,120 | 1.14% | 3.9 |
| | `/kalenteri-2027` | 20 | 3,818 | 0.52% | 5.8 |
| kalenteri 2027 | `/kalenteri-2027` | 50 | 3,760 | 1.33% | 6.5 |
| | `/vuosi-2027` | 5 | 179 | 2.79% | 10.7 |
| | `/tulostettava-kalenteri-2027` | 4 | 205 | 1.95% | 9.6 |
| kalenteri 2027 viikkonumerot | `/kalenteri-2027` | 36 | 1,007 | 3.57% | 1.7 |
| | `/vuosi-2027` | 15 | 685 | 2.19% | 4.2 |
| | `/tulostettava-kalenteri-2027` | 4 | 234 | 1.71% | 7.4 |

Long tails of near-zero-click URLs (month, quarter, half-year and individual
week pages) appear on the broad terms and are omitted. They are weak secondary
matches, not competing owners, and need no retargeting.

## Cannibalization finding

Two URLs rank on every term, so the overlap is real. It is not symmetric:

- `/vuosi-2027` beats `/kalenteri-2027` on all three week-calendar terms, on
  both position and CTR, by roughly two to one on clicks.
- `/kalenteri-2027` beats `/vuosi-2027` on both `kalenteri 2027` forms, and
  holds position 1.7 on `kalenteri 2027 viikkonumerot`.

The two pages already separate along the intent line. The loser on each term is
the weaker duplicate, not a mistargeted owner.

## Owner page per intent

| Intent | Owner | Terms |
| --- | --- | --- |
| Week calendar, week numbers | `/vuosi-2027` | viikkokalenteri 2027, viikot 2027, viikkonumerot 2027, kalenteriviikot 2027 |
| Year calendar, month grid | `/kalenteri-2027` | kalenteri 2027, kalenteri 2027 viikkonumerot, vuosikalenteri 2027, almanakka 2027 |
| Printable, download | `/tulostettava-kalenteri-2027` | tulostettava kalenteri 2027, ilmainen kalenteri 2027, kalenteri 2027 pdf, kalenteri 2027 excel |
| Year facts, day counts | `/vuosi-2027` | montako viikkoa 2027, karkausvuosi 2027 |

This matches cluster 3 of [`seo-2027-growth-plan.md`](../seo-2027-growth-plan.md),
which already assigns `viikkokalenteri 2027` to `/vuosi-2027`, and it matches
the comment block on `yearMeta()` in `src/data/seo.js`.

### Rejected alternative

Retargeting `/kalenteri-2027` at `viikkokalenteri 2027`, as the Phase 1 task
list specified, would have given it an H1 and an ISO week table nearly
identical to `/vuosi-2027`, which already holds the stronger position on that
term. That manufactures the cannibalization Phase 1.1 exists to remove, and it
spends the page's position 1.7 grip on `kalenteri 2027 viikkonumerot` to do it.
Decided against by the project owner on 21 November 2026.

A merge and 301 of `/kalenteri-2027` into `/vuosi-2027` was also considered and
rejected: the page earns 734 clicks and 53,844 impressions on its own intent,
and the task list defers redirects until after the freeze in any case.

## Headroom

`/vuosi-2027` draws 82,006 impressions at 0.94% CTR across all terms, and
`/kalenteri-2027` 53,844 at 1.4%. Both rank around position 6 on their primary
terms. Raising CTR on these two pages is worth more than any new page in the
cluster, so title, description and above-the-fold answer copy are where the
remaining Phase 1 effort belongs.

## Review

Figures above are a 90-day window ending 17 November 2026 and predate the
metadata changes in `34d588c`, so the next read of the same window will not be
comparable. Re-measure with the same method after 15 December 2026.
