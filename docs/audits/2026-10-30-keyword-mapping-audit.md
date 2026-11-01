# SEO keyword mapping audit

Date: 2026-10-30  
Property: `viikkonro.fi`  
Requested current window: 2026-07-29 to 2026-10-28, Finland, Web

## Deliverable

`outputs/2026-10-30-seo-keyword-map/Viikkonro_SEO_keyword_map_2026-10-30.xlsx`

The workbook contains the 39 priority terms from the five requested groups,
one recommended URL per query intent, search intent, an improvement action,
current-window metrics, a verification workflow, and a separate record of
older Search Console observations already preserved in the repository.

## Evidence and limits

- The user supplied impressions for 12 terms. Those exact values are in the
  current-window metric column. The user did not supply clicks or average
  positions; the workbook leaves them blank and calculates CTR only when both
  clicks and impressions are present.
- No Search Console connector was available, no Google credentials were
  configured in the local environment, and the computer-use browser failed to
  initialize. The actual Page-filter + Query-filter verification for
  2026-07-29 to 2026-10-28 could not be run. Proposed URLs are labelled as such.
- `docs/seo-2027-growth-plan.md`, recorded 2026-10-17, preserves a 90-day
  Search Console analysis but omits the exact range and raw export. The workbook
  puts these observations on a separate tab and does not blend them into the
  requested current-window metrics.
- The saved historical notes conflict for `viikkokalenteri 2027`, `juhannus
  2027`, `helatorstai 2027`, `pyhäpäivät 2027`, `työpäivät 2027`, and
  `pääsiäinen 2027`. The evidence tab keeps the competing observations, their
  reported granularity, and source line references. The raw Search Console
  export is needed to settle the discrepancies.

## URL ownership decisions

- `viikkokalenteri 2027` and `kalenteri 2027 viikot` map to `/vuosi-2027`,
  following the saved query map and the implemented title split that reserves
  `/kalenteri-2027` for the annual calendar overview.
- `kalenteri 2027 tulostettava` and `tulostettava kalenteri 2027` share
  `/tulostettava-kalenteri-2027`; they express the same print-download intent.
- `juhannus 2027` maps to `/pyhat-2027/juhannusaatto`, matching the saved
  intent analysis for the date of the main celebration and the question of
  whether the eve is a day off. `/pyhat-2027/juhannuspaiva` remains for the
  distinct `juhannuspäivä 2027` query.
- No new keyword routes are proposed. Existing route families are used.
- The 23 unique recommended paths all have generated HTML files in the local
  `dist/` output. This verifies local route availability, not production HTTP
  status, indexing, or the live Search Console query-to-page relationship.

## Current status

The spreadsheet and its source notes are implemented locally. To complete the
requested verification, export Search Console data for the specified window
with country=Finland and search type=Web, using the Page and Query filters for
each proposed URL. Import the raw query/page metrics, then review any queries
with impressions split across multiple pages before changing page targeting.
