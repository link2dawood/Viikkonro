# Predeployment test cases

Run the complete release gate with:

```sh
npm run test:predeploy
```

The command stops on the first failure. It runs lint and unit tests, creates the
production build, executes the generated-artifact cases below, rebuilds the SSR
bundle removed by prerendering, and completes the internal crawl check.

| ID | Test case | Required result |
| --- | --- | --- |
| PD-01 | Render critical Finnish and English landing pages | Each page has a targeted title, description, self-canonical, indexable robots state, and one visible H1. |
| PD-02 | Inspect the production sitemap | URLs are unique and use the production origin; required pages are present and PDFs are absent. |
| PD-03 | Parse generated JSON-LD | Parity, school-holiday, and workday pages contain their required WebPage, Article, FAQPage, and breadcrumb types. |
| PD-04 | Inspect cross-year week links | A normal week has seven valid alternatives; week 53 never links to a year without ISO week 53. |
| PD-05 | Inspect the 2028 school-holiday page | All five official city sources, the unknown-coverage notice, and the review date remain visible. |
| PD-06 | Inspect PDF output and Vercel headers | At least 1,000 PDFs remain generated and each PDF family maps to its matching HTML canonical. |
| PD-07 | Inspect the English surface | `/en` retains English document signals and reciprocal hreflang, and the Finnish site links to it. |
| PD-08 | Scan deployable text artifacts | No unresolved merge marker reaches generated HTML, XML, text, or JSON. |
| PD-09 | Inspect `/yrityskalenteri` | One H1, a self-canonical, indexable, WebPage, FAQPage, HowTo and breadcrumb schema, the watermarked free preview, a sitemap entry, links from the calendar and print pages, and its own styles (no other page carries them). |
| PD-10 | Scan production scripts | No script contains the development unlock or its text; the PDF library is a separate chunk that the entry script neither embeds nor preloads. |

The crawl phase separately requires every sitemap page within three clicks,
zero linked redirects or 404 pages, correct week metadata, valid English
signals, zero PDF sitemap entries, and a direct HTML download link for every
generated PDF.

The GitHub Actions workflow `Predeployment tests` runs this gate for every pull
request to `main`. It has read-only repository permission and performs no
deployment, sitemap submission, indexing request, or external write.
