# Calculator Ideas — Design Spec

**17 ideas, not 50.** Same discipline as the last few requests: I
researched each category for calculators that are genuinely distinct from
each other and from the 5 the site already has
(`/paivamaara-viikoksi`, `/viikko-paivamaaraksi`, `/tyopaivalaskuri`,
`/paivien-erotus`, `/viikonpaiva`), rather than generate 50 thin
variations. The honest count across HR/Payroll/PM/Schools/Government/
Construction is 17 — getting to 50 would mean either re-skinning the same
"days between two dates" idea repeatedly with an industry label, or
proposing calculators for needs that don't actually exist. Some
categories genuinely only support 2 real ideas; I didn't pad them to
match the others.

Every idea below computes something with **real, non-trivial logic**
(not just a relabeled version of an existing calculator) and is grounded
in an actual Finnish practice or law — several reuse the same research
already done for `long-tail-pages.md`, so a calculator and its
explanatory page can link to each other rather than exist in isolation.

## Status (2026-10-06)

Built, under Finnish slugs chosen to match the site's naming:

- `/sprinttisuunnittelija` covers idea 8 (sprint end dates and ISO weeks),
  and adds working days and holiday-adjusted capacity per sprint.
- `/projektiaikataulu` covers ideas 9 and 14 (project duration in weeks and a
  week-by-week schedule), and adds 25/50/75/100 percent milestones.
- `/lomasuunnittelija` is new: the longest breaks a number of leave days buys
  between weekends and public holidays. It is not in the list below.

Each page uses the `FAQPage` + `HowTo` pattern below, fed from one data module
(`src/data/sprintPlanner.js`, `projectTimeline.js`, `vacationPlanner.js`).
Slugs such as `/sprinttilaskuri` listed below were not used, so do not add a
second URL for the same content.

## Shared schema pattern

All 5 existing calculators use the same structure (`CALCULATOR_SCHEMA` in
`prerender.js`): `HowTo` (numbered steps) + `FAQPage`, both fed from one
object per calculator so the visible page and the schema can't drift.
Every idea below follows that same pattern — `Schema` below always means
`HowTo` + `FAQPage`, not a new schema shape per calculator.

---

## HR (4)

### 1. Koeaikalaskuri (probation period calculator)
- **URL**: `/koeaikalaskuri`
- **Inputs**: employment start date
- **Outputs**: probation end date (Finnish law: max 6 months, or
  proportionally shorter for fixed-term contracts under half a year —
  verify exact proportional rule before publishing), which ISO week it
  falls in
- **Search intent**: HR staff or new employees checking when a
  probation period ends
- **Internal links**: `/tyopaivat-{year}`, `/sanasto/tyopaiva` (see
  `glossary-system.md`)
- **Schema**: `HowTo` + `FAQPage`

### 2. Irtisanomisaikalaskuri (notice period calculator)
- **URL**: `/irtisanomisaikalaskuri`
- **Inputs**: employment start date (or tenure), notice date
- **Outputs**: notice period length (Finnish law scales 14 days to 6
  months by tenure — exact brackets need verification before publishing),
  last employment day, which week that falls in
- **Search intent**: HR/employees calculating when employment actually
  ends after notice is given
- **Internal links**: `/viikko-{week}-{year}`, `/vuosi-{year}`
- **Schema**: `HowTo` + `FAQPage`

### 3. Vuosilomapäivälaskuri (annual leave accrual calculator)
- **URL**: `/vuosilomalaskuri`
- **Inputs**: employment start date, current date (or leave-year end)
- **Outputs**: accrued leave days (2 or 2.5 days/month depending on
  whether tenure exceeds 1 year by the leave-year cutoff — genuinely
  non-trivial Finnish accrual rule, not a simple date subtraction)
- **Search intent**: employees/HR checking accrued annual leave
- **Internal links**: `/tyopaivat-{year}`, `/sanasto/vapaapaiva`
- **Schema**: `HowTo` + `FAQPage`

### 4. Työsuhteen kesto viikkoina (employment tenure calculator)
- **URL**: `/tyosuhteen-kesto-viikkoina`
- **Inputs**: employment start date
- **Outputs**: tenure in complete weeks/months/years as of today, next
  anniversary date and its week number
- **Search intent**: HR checking tenure for benefits-eligibility
  thresholds tied to service length
- **Internal links**: `/viikko-{week}-{year}`, `/paivien-erotus`
  (distinct from it: outputs weeks-of-service and an anniversary date,
  not just a day count)
- **Schema**: `HowTo` + `FAQPage`

## Payroll (3)

### 5. Palkkakausilaskuri (pay period lookup)
- **URL**: `/palkkakausilaskuri`
- **Inputs**: a date, pay period type (monthly / biweekly / weekly)
- **Outputs**: which pay period that date falls in, period start/end
  dates, ISO weeks covered
- **Search intent**: payroll staff reconciling a date against a pay
  cycle
- **Internal links**: `/kuukausi-{month}-{year}`, `/data/month/{year}/
  {month}.json`
- **Schema**: `HowTo` + `FAQPage`

### 6. Viikkoylityölaskuri (weekly overtime pay calculator)
- **URL**: `/viikkoylityolaskuri`
- **Inputs**: hours worked in a given ISO week, weekly hour threshold
  (default 40, per työaikalaki)
- **Outputs**: overtime hours, which week they fall in — *not* the
  actual overtime pay multiplier, since that varies by collective
  agreement and shouldn't be asserted generically
- **Search intent**: payroll/HR checking weekly overtime hours before
  applying a CBA-specific rate
- **Internal links**: `/tyopaivalaskuri`, `long-tail-pages.md` §2
- **Schema**: `HowTo` + `FAQPage`

### 7. Palkkapäivän siirtolaskuri (payday-adjustment calculator)
- **URL**: `/palkkapaivan-siirtolaskuri`
- **Inputs**: intended payday
- **Outputs**: actual payment date if the intended date is a weekend or
  public holiday (many Finnish CBAs move payday to the preceding banking
  day)
- **Search intent**: payroll staff or employees checking whether payday
  shifts due to a holiday
- **Internal links**: `/pyhapaivat-{year}`, `/tyopaivat-{year}`
- **Schema**: `HowTo` + `FAQPage`

## Project Management (2)

### 8. Sprint-aikataulu-laskuri (sprint end-date calculator)
- **URL**: `/sprinttilaskuri`
- **Inputs**: sprint start date, sprint length in weeks
- **Outputs**: sprint end date, the ISO week number(s) it spans
- **Search intent**: Scrum/Agile teams planning sprint boundaries by
  week number
- **Internal links**: `/vuosi-{year}`, `/sanasto/sprintti`,
  `long-tail-pages.md` §4
- **Schema**: `HowTo` + `FAQPage`

### 9. Projektin viikkokesto-laskuri (project duration in weeks)
- **URL**: `/projektin-kesto-viikkoina`
- **Inputs**: project start date, end date
- **Outputs**: total ISO weeks spanned (not just calendar days — genuinely
  distinct from `/paivien-erotus`), working days, list of week numbers
- **Search intent**: project managers estimating duration in weeks for
  planning/reporting
- **Internal links**: `/tyopaivalaskuri`, `/q{quarter}-{year}`
- **Schema**: `HowTo` + `FAQPage`

## Schools (2)

### 10. Lukukausiviikkolaskuri (term/semester week calculator)
- **URL**: `/lukukausiviikot`
- **Inputs**: term start date, term end date
- **Outputs**: list of ISO week numbers the term spans, total week
  count — directly extends the "opetusviikko" numbering already
  documented in `long-tail-pages.md` §3
- **Search intent**: students/staff converting a syllabus's week-number
  range into actual dates
- **Internal links**: `/koululomat-{year}`, `long-tail-pages.md` §3
- **Schema**: `HowTo` + `FAQPage`

### 11. Koulupäivälaskuri (school days between two dates)
- **URL**: `/koulupaivalaskuri`
- **Inputs**: two dates, school (for regional hiihtoloma week — varies
  by municipality)
- **Outputs**: school days between them, excluding weekends, public
  holidays, **and** school holidays (hiihtoloma/syysloma/kesäloma) —
  genuinely different exclusion set from `/tyopaivalaskuri`, which only
  excludes public holidays
- **Search intent**: parents/teachers counting actual school days in a
  range
- **Internal links**: `/koululomat-{year}`, `/tyopaivalaskuri`
- **Schema**: `HowTo` + `FAQPage`

## Government (2)

### 12. Kelan maksupäivälaskuri (Kela payment-period calculator)
- **URL**: `/kelan-maksupaivalaskuri`
- **Inputs**: a reference payment date
- **Outputs**: the next N 4-week payment dates (Kela's benefit payment
  cycle — see `long-tail-pages.md` §8; exact current period length
  should be confirmed against kela.fi before publishing)
- **Search intent**: benefit recipients predicting their next payment
  date
- **Internal links**: `/viikko-{week}-{year}`, `long-tail-pages.md` §8
- **Schema**: `HowTo` + `FAQPage`

### 13. Määräaikalaskuri julkishallinnon päätöksille (administrative deadline calculator)
- **URL**: `/maaraaikalaskuri`
- **Inputs**: trigger date (e.g. decision date), deadline length in
  days
- **Outputs**: deadline date, which week it falls in — Finnish
  administrative deadlines (hallintolaki) are commonly specified in
  calendar days, not working days; flagging that the exact
  calendar-vs-working-day rule varies by statute and needs verification
  per use case before this calculator asserts one universally
- **Search intent**: public-sector staff or citizens calculating a
  statutory response/appeal deadline
- **Internal links**: `/paivien-erotus`, `/pyhapaivat-{year}`
- **Schema**: `HowTo` + `FAQPage`

## Construction (3)

### 14. Viikkoaikataululaskuri (weekly schedule calculator)
- **URL**: `/viikkoaikataululaskuri`
- **Inputs**: project start date, duration in weeks
- **Outputs**: a week-by-week date table (the actual "viikkoaikataulu"
  format used in Finnish construction PM — see `long-tail-pages.md` §5)
- **Search intent**: site managers building a viikkoaikataulu from a
  start date and duration
- **Internal links**: `/tulosta-{year}`, `long-tail-pages.md` §5
- **Schema**: `HowTo` + `FAQPage`

### 15. Työmaan etenemislaskuri (project-week progress calculator)
- **URL**: `/tyomaan-etenemislaskuri`
- **Inputs**: project start date, total duration in weeks, today's date
- **Outputs**: current project week number (e.g. "week 14 of 32"),
  percentage complete
- **Search intent**: site managers reporting how far into the schedule
  a project currently is
- **Internal links**: `/viikkoaikataululaskuri` (above), `/vuosi-{year}`
- **Schema**: `HowTo` + `FAQPage`

### 16. Takuuajan päättymislaskuri (defects-liability period calculator)
- **URL**: `/takuuaika-laskuri`
- **Inputs**: completion (handover) date, warranty period length
  (commonly 2 years under YSE 1998, Finland's standard construction
  contract terms — confirm against the specific contract before
  publishing a default)
- **Outputs**: warranty end date, which week it falls in
- **Search intent**: contractors/clients checking when a construction
  warranty period ends
- **Internal links**: `/vuosi-{year}`, `/viikko-{week}-{year}`
- **Schema**: `HowTo` + `FAQPage`

## One cross-category idea

### 17. Muistutuslaskuri N viikkoa ennen (N-weeks-before reminder calculator)
- **URL**: `/muistutuslaskuri`
- **Inputs**: target date, number of weeks of advance notice needed
- **Outputs**: the date N weeks before the target, its week number
- **Search intent**: generic enough to serve HR (review reminders),
  construction (material order lead times), government (public
  notice periods) alike — the one idea in this list that isn't
  industry-specific, included because it's genuinely reusable rather
  than because a category needed a 4th entry
- **Internal links**: `/viikko-paivamaaraksi`, `/kuinka-monta-viikkoa-vuodessa`
- **Schema**: `HowTo` + `FAQPage`

---

## What I didn't include, and why

- **A second HR leave calculator** (sick leave accrual) — Finnish sick
  pay rules depend heavily on the specific CBA, more so than annual
  leave; a generic calculator would need so many caveats it'd stop being
  useful. Flagging rather than building on uncertain ground.
- **A generic "construction payroll" calculator** — this is just the
  Payroll section's overtime/pay-period calculators with a construction
  label; not a distinct idea.
- **Government budget-year calculators** — Finnish public-sector fiscal
  years do align with the calendar year (unlike private-sector
  `tilikausi`), so there's no non-trivial calculation to offer beyond
  what `/q{1-4}-{year}` already provides.

## Implementation notes

- Every calculator should reuse existing computation, not re-derive it:
  week/date math from `dateUtils.js`, working-day exclusion logic from
  the same functions `/tyopaivalaskuri` already calls — a new calculator
  duplicating that logic independently is exactly the kind of drift this
  session's other fixes have been about avoiding.
- Add to `CALCULATOR_SCHEMA` in `prerender.js` (the existing single
  object driving all 5 current calculators' `HowTo`+`FAQPage` schema) —
  not a new schema mechanism per calculator.
- Add to `/laskurit` (the calculator hub page) and `sitemapEntries()`.
- Several of these (8, 10, 14, 17) are close enough to the site's
  existing week/date math that they could share one generic "N weeks
  from a start date" component instead of 17 independent
  implementations — worth designing that shared piece before building
  the first industry-specific one.
