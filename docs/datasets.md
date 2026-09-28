# Viikko Nro — Dataset Documentation

Machine-readable reference for every JSON dataset published under
`https://viikkonro.fi/data/`. Written for both developers integrating the
feeds and AI/RAG systems citing or ingesting them.

All datasets share the same conventions:

| | |
|---|---|
| Base URL | `https://viikkonro.fi/data/` |
| Format | Static JSON, one file per period, `Content-Type: application/json; charset=utf-8` |
| Auth | None |
| Rate limit | None |
| CORS | `Access-Control-Allow-Origin: *` (fetchable from any origin) |
| Caching | `Cache-Control: public, max-age=3600`, CDN `s-maxage=86400, stale-while-revalidate=604800` |
| Language | Names/labels in Finnish (`fi-FI`); field names and structure in English |
| License | Free to use with attribution — see `/kayttoehdot` |
| Schema version | Every file carries `schemaVersion` (currently `"1.0"`). It increments only when a field is removed or renamed; adding a field is not a breaking change. |
| Developer alias | `week`, `month` and `year` are also reachable at `/api/week/{week}/{year}.json`, `/api/month/{month}/{year}.json`, `/api/year/{year}.json` — permanent 301 redirects to the canonical `/data/` URLs below, identical content. |
| Discovery | `/data/index.json` (all families + URL patterns), `/data/dataset.json` (same, as schema.org/Dataset JSON-LD), `/data/knowledge-graph.json` (entity/relationship graph across the whole site) |
| Human docs | `/avoin-data` |

All dates are `YYYY-MM-DD` in the Europe/Helsinki calendar date (no time
component, no timezone offset — a date, not an instant). All datasets are
regenerated on every deploy and additionally once daily via a scheduled
rebuild, so "today"-relative content (e.g. which week is current) never goes
more than a day stale even without a code change.

---

## 1. Week dataset

### Purpose

One file per ISO 8601 week: its date range, working-day count, and any
public holidays or flag days landing in it. The data source for
`/viikko-{week}-{year}` pages.

### Schema

```
GET /data/week/{year}/{week}.json
GET /data/week/{year}/index.json   — every week in {year}: [{ week, url }]
GET /data/week/index.json          — every year: [{ year, weekCount, indexUrl }]
```

`{year}` is the **ISO week-year** (not necessarily the calendar year of
every day in the week — see Temporal coverage). `{week}` is `1`–`52` or
`1`–`53`.

### Fields

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | string | Feed schema version |
| `week` | integer | ISO 8601 week number |
| `year` | integer | ISO week-year (matches the URL's `{year}`) |
| `startDate` | string (date) | Monday of this week |
| `endDate` | string (date) | Sunday of this week |
| `workingDays` | integer | Weekdays in this week minus official (statutory) holidays |
| `holidays` | array of `{name, date, official}` | Public holidays landing in this week |
| `flagDays` | array of `{name, date}` | Flag days landing in this week |
| `quarter` | integer (1–4) | Fiscal quarter containing the week's Monday |
| `season` | string | `"winter"` \| `"spring"` \| `"summer"` \| `"autumn"`, based on the week's Thursday |
| `url` | string | Canonical HTML page for this week |

### Example

`GET /data/week/2026/32.json`

```json
{
  "schemaVersion": "1.0",
  "week": 32,
  "year": 2026,
  "startDate": "2026-08-03",
  "endDate": "2026-08-09",
  "workingDays": 5,
  "holidays": [],
  "flagDays": [],
  "quarter": 3,
  "season": "summer",
  "url": "https://viikkonro.fi/viikko-32-2026"
}
```

### Usage

```bash
curl https://viikkonro.fi/data/week/2026/32.json
```

```js
const res = await fetch("https://viikkonro.fi/data/week/2026/32.json");
const week = await res.json();
```

Or via the developer alias: `GET /api/week/32/2026.json` (301 → the URL
above).

### Update frequency

Regenerated on every deploy and once daily (scheduled rebuild). Content for
a given week is static once past — only future/current-week framing
changes, and only insofar as holiday/flag-day data itself changes.

### Temporal coverage

2020–2035 (current year + the next 9, plus 6 prior years), 52 or 53 files
per year. Note the ISO week-year boundary: e.g. the week containing
29–31 December can belong to ISO week 1 of the *following* year — `{year}`
in the URL always means the ISO week-year, not the calendar year of every
day inside it.

---

## 2. Month dataset

### Purpose

One file per calendar month: which ISO weeks it spans, its working/weekend-
day counts, and any holidays or flag days in it. The data source for
`/kuukausi-{month}-{year}` pages.

### Schema

```
GET /data/month/{year}/{month}.json
GET /data/month/index.json   — every month: [{ year, month, url }]
```

`{year}` is the calendar year. `{month}` is `1`–`12`.

### Fields

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | string | Feed schema version |
| `month` | integer (1–12) | Calendar month |
| `year` | integer | Calendar year |
| `startDate` | string (date) | First day of the month |
| `endDate` | string (date) | Last day of the month |
| `weekCount` | integer | Number of distinct ISO weeks overlapping this month (4–6) |
| `weeks` | array of `{week, year}` | Each ISO week overlapping this month, in order, deduplicated |
| `workingDays` | integer | Weekdays in the month minus official holidays |
| `weekendDays` | integer | Saturdays + Sundays in the month |
| `holidays` | array of `{name, date, official}` | **Official (statutory) holidays only** falling in this month |
| `flagDays` | array of `{name, date}` | Flag days falling in this month |
| `quarter` | integer (1–4) | Fiscal quarter containing this month |
| `url` | string | Canonical HTML page for this month |

### Example

`GET /data/month/2026/8.json`

```json
{
  "schemaVersion": "1.0",
  "month": 8,
  "year": 2026,
  "startDate": "2026-08-01",
  "endDate": "2026-08-31",
  "weekCount": 6,
  "weeks": [
    { "week": 31, "year": 2026 },
    { "week": 32, "year": 2026 },
    { "week": 33, "year": 2026 },
    { "week": 34, "year": 2026 },
    { "week": 35, "year": 2026 },
    { "week": 36, "year": 2026 }
  ],
  "workingDays": 21,
  "weekendDays": 10,
  "holidays": [],
  "flagDays": [],
  "quarter": 3,
  "url": "https://viikkonro.fi/kuukausi-8-2026"
}
```

### Usage

```bash
curl https://viikkonro.fi/data/month/2026/8.json
```

Or via the developer alias: `GET /api/month/8/2026.json`.

### Update frequency

Regenerated on every deploy and once daily.

### Temporal coverage

2020–2035, 12 files per year.

---

## 3. Year dataset

### Purpose

One file per calendar year: total ISO weeks (52 or 53), working/weekend-day
totals, and the full holiday and flag-day lists for the year. The data
source for `/vuosi-{year}` pages.

### Schema

```
GET /data/year/{year}.json
GET /data/year/index.json   — every year: [{ year, url }]
```

### Fields

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | string | Feed schema version |
| `year` | integer | Calendar year |
| `weekCount` | integer | `52` or `53` |
| `workingDays` | integer | Weekdays in the year minus official holidays |
| `weekendDays` | integer | Saturdays + Sundays in the year |
| `holidays` | array of `{name, date, official}` | **All** named holidays (both statutory and the 2 unofficial eve days) |
| `flagDays` | array of `{name, date}` | All dated flag days of the year (22 from 2023 on) |
| `firstWeek` | `{week, year}` | The ISO week containing 1 January |
| `lastWeek` | `{week, year}` | The ISO week containing 31 December |
| `url` | string | Canonical HTML page for this year |

### Example

`GET /data/year/2026.json` (truncated)

```json
{
  "schemaVersion": "1.0",
  "year": 2026,
  "weekCount": 53,
  "workingDays": 254,
  "weekendDays": 104,
  "holidays": [
    { "name": "Uudenvuodenpäivä", "date": "2026-01-01", "official": true },
    { "name": "Loppiainen", "date": "2026-01-06", "official": true }
    // ... 13 more (15 total)
  ],
  "flagDays": [
    { "name": "J. L. Runebergin päivä", "date": "2026-02-05" },
    { "name": "Kalevalan päivä", "date": "2026-02-28" }
    // ... 12 more (14 total)
  ],
  "firstWeek": { "week": 1, "year": 2026 },
  "lastWeek": { "week": 53, "year": 2026 },
  "url": "https://viikkonro.fi/vuosi-2026"
}
```

### Usage

```bash
curl https://viikkonro.fi/data/year/2026.json
```

Or via the developer alias: `GET /api/year/2026.json`.

### Update frequency

Regenerated on every deploy and once daily.

### Temporal coverage

2020–2035, one file per year (16 files total).

---

## 4. Holiday dataset

### Purpose

One file per year listing Finland's named holidays with full temporal
context (weekday, ISO week) and official status. The data source for
`/pyhapaivat-{year}` (hub) and the 15 `/pyhat-{year}/{slug}` individual
holiday pages.

### Schema

```
GET /data/holidays/{year}.json
GET /data/holidays/index.json   — every year: [{ year, url }]
```

### Fields

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | string | Feed schema version |
| `year` | integer | Calendar year |
| `holidays` | array | See below |
| `url` | string | Canonical HTML page for the year's holiday hub |

Each item in `holidays[]`:

| Field | Type | Description |
|---|---|---|
| `name` | string | Finnish holiday name |
| `date` | string (date) | Date that year |
| `weekday` | string | Finnish weekday name (e.g. `"Torstai"`) |
| `week` | integer | ISO week number containing this date |
| `official` | boolean | `true` for the 13 statutory holidays; `false` for the 2 unofficial eve days (Juhannusaatto, Jouluaatto) |

15 holidays per year: Uudenvuodenpäivä, Loppiainen, Pitkäperjantai,
Pääsiäispäivä, 2. pääsiäispäivä, Vappu, Helatorstai, Helluntaipäivä,
Juhannusaatto, Juhannuspäivä, Pyhäinpäivä, Itsenäisyyspäivä, Jouluaatto,
Joulupäivä, Tapaninpäivä.

### Example

`GET /data/holidays/2026.json` (truncated)

```json
{
  "schemaVersion": "1.0",
  "year": 2026,
  "holidays": [
    {
      "name": "Uudenvuodenpäivä",
      "date": "2026-01-01",
      "weekday": "Torstai",
      "week": 1,
      "official": true
    },
    {
      "name": "Loppiainen",
      "date": "2026-01-06",
      "weekday": "Tiistai",
      "week": 2,
      "official": true
    }
    // ... 13 more
  ],
  "url": "https://viikkonro.fi/pyhapaivat-2026"
}
```

### Usage

```bash
curl https://viikkonro.fi/data/holidays/2026.json
```

Only statutory (`official: true`) holidays reduce the `workingDays` counts
published in the week/month/year/working-day datasets — eve days
(`official: false`) and all flag days do not.

### Update frequency

Regenerated on every deploy and once daily. Holiday *dates* for a given
year are fixed by rule (Easter-relative or fixed calendar date) and don't
change; regeneration keeps `schemaVersion`/derived fields in sync as the
underlying computation evolves.

### Temporal coverage

2020–2035, one file per year, 15 holidays each (movable feasts computed via
the Gregorian Easter algorithm, not hardcoded).

---

## 5. Working-day dataset

### Purpose

One file per calendar month with just its working/weekend-day split and
the official holidays that reduced it — a narrower, aggregate-focused
sibling of the month dataset. The data source for
`/tyopaivat-{monthSlug}-{year}` pages (and, in aggregate, the
`/tyopaivat-{year}` yearly hub).

### Schema

```
GET /data/monthly-working-days/{year}/{month}.json
GET /data/monthly-working-days/index.json   — every month: [{ year, month, url }]
```

`{month}` is the plain month number (`1`–`12`) — the feed URL does not use
the Finnish month-name slug the HTML page route does.

### Fields

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | string | Feed schema version |
| `month` | integer (1–12) | Calendar month |
| `year` | integer | Calendar year |
| `startDate` | string (date) | First day of the month |
| `endDate` | string (date) | Last day of the month |
| `workingDays` | integer | Weekdays in the month minus official holidays |
| `weekendDays` | integer | Saturdays + Sundays in the month |
| `holidays` | array of `{name, date, official}` | Official holidays in this month (always `official: true`) |
| `url` | string | Canonical HTML page — `/tyopaivat-{monthSlug}-{year}` |

### Example

`GET /data/monthly-working-days/2026/8.json`

```json
{
  "schemaVersion": "1.0",
  "month": 8,
  "year": 2026,
  "startDate": "2026-08-01",
  "endDate": "2026-08-31",
  "workingDays": 21,
  "weekendDays": 10,
  "holidays": [],
  "url": "https://viikkonro.fi/tyopaivat-elokuu-2026"
}
```

### Usage

```bash
curl https://viikkonro.fi/data/monthly-working-days/2026/8.json
```

For a single year's total working days, use the year dataset's
`workingDays` field instead of summing 12 monthly files.

### Update frequency

Regenerated on every deploy and once daily.

### Temporal coverage

2020–2035, 12 files per year.

---

## 6. Flag-day dataset

### Purpose

One file per year listing Finland's flag-flying days (liputuspäivät) with
category and any holiday overlap. The data source for
`/liputuspaivat-{year}` (there are no individual flag-day landing pages).

### Schema

```
GET /data/flag-days/{year}.json
GET /data/flag-days/index.json   — every year: [{ year, url }]
```

### Fields

| Field | Type | Description |
|---|---|---|
| `schemaVersion` | string | Feed schema version |
| `year` | integer | Calendar year |
| `flagDays` | array | See below |
| `url` | string | Canonical HTML page for the year's flag-day hub |

Each item in `flagDays[]`:

| Field | Type | Description |
|---|---|---|
| `name` | string | Finnish flag-day name |
| `altName` | string \| `null` | Alternate common name, where one exists (e.g. "Puolustusvoimain lippujuhlan päivä" / "Suomen lipun päivä") |
| `date` | string (date) | Date that year |
| `weekday` | string | Finnish weekday name |
| `week` | integer | ISO week number containing this date |
| `weekYear` | integer | ISO week-year containing this date |
| `category` | string | One of `"virallinen"` (in the flag-day decree 383/1978: Kalevalan päivä, Äitienpäivä, Puolustusvoimain lippujuhlan päivä, Isänpäivä), `"vakiintunut"` (customary flag day on the University of Helsinki list, e.g. J. L. Runebergin päivä), `"kansainvälinen"` (international observance Finland also flags for: Eurooppa-päivä, YK:n päivä) |
| `holidayOverlap` | string \| `null` | Name of the public holiday on the same date, if any (e.g. Itsenäisyyspäivä is both a holiday and a flag day); otherwise `null` |

All dated flag days per year (checked 2026-09-28 against
almanakka.helsinki.fi): the 7 official ones (Kalevalan päivä, Vappu,
Äitienpäivä, Puolustusvoimain lippujuhlan päivä, Juhannuspäivä as Suomen
lipun päivä, Isänpäivä, Itsenäisyyspäivä) and the customary ones (J. L.
Runebergin päivä, Minna Canthin päivä, Mikael Agricolan päivä / Suomen
kielen päivä, Kansallinen veteraanipäivä, Eurooppa-päivä, J. V. Snellmanin
päivä, Kaatuneitten muistopäivä, Eino Leinon päivä, Aleksis Kiven päivä,
YK:n päivä, Ruotsalaisuuden päivä, Jean Sibeliuksen päivä, Lapsen
oikeuksien päivä from 2020, Suomen luonnon päivä and Miina Sillanpään päivä
from 2023). Election days have no fixed date and are not included.

### Example

`GET /data/flag-days/2026.json` (truncated)

```json
{
  "schemaVersion": "1.0",
  "year": 2026,
  "flagDays": [
    {
      "name": "J. L. Runebergin päivä",
      "altName": null,
      "date": "2026-02-05",
      "weekday": "Torstai",
      "week": 6,
      "weekYear": 2026,
      "category": "virallinen",
      "holidayOverlap": null
    },
    {
      "name": "Kalevalan päivä",
      "altName": null,
      "date": "2026-02-28",
      "weekday": "Lauantai",
      "week": 9,
      "weekYear": 2026,
      "category": "virallinen",
      "holidayOverlap": null
    }
    // ... 12 more
  ],
  "url": "https://viikkonro.fi/liputuspaivat-2026"
}
```

### Usage

```bash
curl https://viikkonro.fi/data/flag-days/2026.json
```

Flag days never reduce `workingDays` in any dataset — only statutory
(`official: true`) holidays do.

### Update frequency

Regenerated on every deploy and once daily. Two flag days (Äitienpäivä,
Isänpäivä) are movable (2nd Sunday of May/November) and computed per year,
not hardcoded; the rest are fixed calendar dates.

### Temporal coverage

2020-2035, one file per year: 20 flag days in 2020-2022, 22 from 2023 on.

---

## Also available

Not detailed above but part of the same `/data/` surface:

- **Quarter dataset** — `/data/quarter/{year}/{quarter}.json`: one file per
  fiscal quarter (date range, months, week range, working/weekend-day
  counts, holidays).
- **`/data/index.json`** — machine-readable index of every dataset family
  and its URL pattern.
- **`/data/dataset.json`** — the same index as schema.org/Dataset JSON-LD.
- **`/data/knowledge-graph.json`** — entity map, relationship map, internal
  linking map and graph structure connecting every page and dataset on the
  site.
- **`/avoin-data`** — human-readable version of this documentation, kept in
  sync by hand.
