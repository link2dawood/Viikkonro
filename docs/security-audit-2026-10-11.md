# Viikkonro security and adversarial-input audit

Audit started 2026-10-11. Application source: `89a3a84`; live application deployment: `6d1e2c1`. The source difference is a directory-link test. This audit adds diagnostic scripts and documentation only; it does not repair or deploy application code.

**Result: not a clean security audit.** Confirmed input-handling weaknesses remain. No unauthorized data access, server-secret disclosure, browser script execution or payment bypass was demonstrated in the scenarios tested. That is a bounded result, not proof that such vulnerabilities cannot exist.

## Priority findings

| ID | Priority | Finding | Proven scope and recommended correction |
| --- | --- | --- | --- |
| SEC-A01 | High dependency-remediation priority | npm audit reports seven affected package entries: four high and three moderate. Production dependency audit reports one high entry, `sharp@0.35.3`, through `@vercel/og`. | Source inspection places `@vercel/og` in build-time image generation. No live image-decoder exploit was attempted or demonstrated. Update compatible dependency resolutions, clear the advisories and rebuild all image/PDF assets. Do not describe the upstream severity as a proven remote compromise of this site. |
| SEC-A02 | Medium | A small malicious SVG can consume excessive validation CPU. | An approximately 240KB SVG containing 60,000 unmatched CSS `url(` tokens exceeded a 5-second subprocess budget and was terminated. It is below the 512KB logo limit. `src/platform/design/branding.js:72` repeatedly searches for a closing parenthesis; size limits alone do not prevent this behavior. This shared validator runs during browser logo/draft handling. Replace the potentially quadratic scan with bounded, linear parsing and retain the prohibition on scripts/external resources. The paid server export accepts PNG only, so this probe does not establish a server-side SVG attack. |
| SEC-A03 | Medium reliability/availability | A large numeric value blanks the date calculator. | On `/paivamaaralaskuri`, setting start to `2100-12-31` and amount to `999999999` produced an uncaught holiday-calculation error and removed the main landmark. The input declares `max=10000`, but `calculate()` in `src/data/dateCalculator.js:93` does not enforce it or reject an invalid resulting Date. Enforce the actual amount limit in the engine, validate start/result/direction/unit, and display a Finnish error without unmounting the application. This is a user-triggered browser failure; remote denial of service was not demonstrated. |
| SEC-A04 | Medium | Shared calendar validation accepts inherited names and wrong types, or throws instead of returning validation issues. | `constructor`, `__proto__`, `toString` and `hasOwnProperty` pass truthy dictionary checks for rules/themes/products. Wrong collection types cause TypeError; string/object values pass boolean fields. In local paid-export HTTP probes, some malformed inputs returned 200 and others misleadingly returned 503 `payment_unavailable`. Oversized period spans and labels pass configuration validation but fail downstream event creation. Use own-property allowlists, strict field/container checks and shared period bounds, and return 400 for invalid requests. This is not demonstrated prototype pollution: a separate JSON `__proto__` probe did not mutate Object.prototype. See `src/platform/calendar/config.js`, `src/platform/calendar/periods.js`, `src/platform/design/layouts.js` and `src/platform/billing/http.js`. |
| SEC-A05 | Medium product/entitlement consistency | Company export input is less strict than the company editor about the selected year. | With a mocked verified 2027 purchase, export accepted an event and a closure entirely in 2028 while `config.year` remained 2027. The editor excludes these rows. Validate company event dates against the purchased year and require periods to overlap it; preserve valid cross-year closures. No payment was made and this is not cross-tenant access. The full 2028 built-in calendar was not unlocked. |
| SEC-A06 | Low current exposure; shared-export hardening | CSV formula protection omits a leading line feed. | `csvCell("\n=1+1", {escapeFormulas:true})` is quoted but is not prefixed with the protective apostrophe. Other tested prefixes (`=`, `+`, `-`, `@`, tab and CR) are protected. Include LF and assess relevant spreadsheet normalization behavior. Many current user-text paths trim leading whitespace, and XLSX writes inline strings. Actual formula execution in Excel/LibreOffice was not tested or demonstrated. See `src/platform/export/csv.js:16`. |
| SEC-A07 | Low current exposure; shared-export hardening | The general ICS serializer permits CRLF injection in a URL property. | One input event with a crafted URL produced two `BEGIN:VEVENT` records. TEXT summaries/descriptions escape newlines correctly; structural fields need rejection of control characters and valid URI/UID/stamp validation. Current Company ICS omits event URLs and validates its identities; no exploit through its public endpoint was demonstrated. See `src/platform/export/ics.js:67`. |
| SEC-A08 | Low defense-in-depth | Public pages have report-only CSP, not enforced CSP. | Live `/` and `/yrityskalenteri` headers contain `Content-Security-Policy-Report-Only` but no enforced policy. Report-only does not block injected resources. React escaping blocked the tested payloads, and private planner/widget pages do have enforced CSP. Promote a tested policy to enforcement after checking existing consent, analytics, CAPTCHA and form integrations. |

Other performance observation: counting working days from year 0100 to 9999 completed in approximately 3.9 seconds in an isolated Node process. The normal 2026–2028 range took approximately 45ms. The free calculator has no explicit range budget; large ranges can block the browser thread. The Business API working-day endpoint independently limits its date span and rejected oversized ranges in these tests.

Dependency entries reported by npm: `sharp`, `brace-expansion`, `browserslist`, `source-map-js`, `@vitest/mocker`, `baseline-browser-mapping`, and `vitest`. npm's count is affected package entries, not seven independently proven application exploits. Build/dev tools account for six of the seven entries. Advisory references: [sharp maintainer advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w), [sharp libheif advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c). CSV reference: [OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection).

## Results and tested behavior

| Check | Result |
| --- | --- |
| Existing unit suite | 984 passed, 9 existing skips across 87 files. |
| PostgreSQL security suite | 199 authorization/tenant-isolation assertions passed in a disposable database. Includes owner/manager/employee permissions, client boundaries, revoked access/races, quotas, direct table permissions and private purchase records. |
| New local input matrix | 377 cases: 314 met expectations and 63 flagged. Flags group into the findings above, not 63 separate vulnerabilities. |
| New browser matrix | 73 scenarios across 17 free/product/contact/login routes and corrupted saved drafts: 72 passed, one failed (date-calculator crash). Empty, small, large and HTML/script-like input classes tested. |
| Resource budgets | Normal date range passed; extreme range completed slowly; malformed SVG exceeded 5 seconds. Each child was limited to 128MB and 5 seconds. |
| Live read-only probes | 16 sensitive-path/API checks plus 16 anonymous database checks passed. Four additional page-header inspections identified the CSP observation. No live write, load flood or credential guessing performed. |
| Widget browser checks | Passed isolated embedding, injection payloads, message-source separation, CSP, keyboard/mobile, 100 events, leap/ISO boundaries and absence of data requests/storage. |
| Public build secret scan | 7,716 generated files scanned for six configured server-secret values; no matches. Secret values were never printed. This is not a complete historical secret scan. |
| Artifact suite/lint | 26 artifact tests passed; audit scripts passed ESLint. |

The local matrix demonstrates the following concrete behavior:

| Input/attack class | Observed handling |
| --- | --- |
| Null, scalar, array, empty or malformed billing JSON roots | Invalid requests return 400 with generic JSON; no provider identifiers/secrets disclosed. |
| Missing/invalid year, wrong export format and path-like format strings | Rejected. Selected-year event inconsistency is SEC-A05. |
| JSON nested 10,000 levels | Invalid checkout root rejected without a stack crash. |
| Billing body over 1MiB, including no declared Content-Length | Actual bytes counted and request rejected. |
| Newsletter body over 8KiB | 413. Malformed/missing consent/email/token fields return 400; no email-provider call occurred in the negative matrix. |
| Unsigned/malformed webhook data and payloads over 256KiB | Rejected; no notification/purchase was created. Existing unit tests cover signature verification, replay windows and paid-order reconciliation. |
| Wrong origin and wrong HTTP method | 403 and 405 respectively; unknown endpoint returns 404. Origin is CSRF defense, not identity authentication. |
| Forged/duplicate purchase cookies and malformed restore data | No export entitlement granted; signed cookie alone never proves payment. |
| Rate-limiter rejection and backend failure | 429 or sanitized 503; no fallback grant. Quota concurrency/isolation is also tested in PostgreSQL. |
| API missing/wrong keys, duplicate/unknown parameters, invalid years/dates/rules/cities | Rejected with 401/400; invalid parameters did not reach the mock quota store. All seven resource families covered. |
| Company event counts 0/1/500/501, period counts 0/1/100/101 and payday counts 0/1/60/61 | Valid boundaries accepted; counts above configured maxima rejected. Wrong collection types are SEC-A04. |
| Optional company names 0/1/80/81/100,000 chars; event names 0/1/120/121/100,000 chars | Optional empty branding accepted; overlong branding rejected; empty/overlong event titles rejected. |
| Invalid leap dates, months, days and non-date strings | Rejected. 2026/2027/2028 models have 365/365/366 days. |
| SVG scripts, handlers, embedded HTML, entities and external resource URLs | Rejected by the shared validator. Malformed CSS performance is SEC-A02. |
| Invalid/remote/SVG server logo payloads | Rejected; missing logo works. Existing HTTP tests also cover pixel/decompression-bomb bounds. |
| HTML/script-like form values and 1,000 malicious saved event rows | No browser script execution observed. Draft parsing bounds/normalizes stored data; no draft scenario crashed. |
| XLSX user strings and ICS TEXT newlines | Existing exporter tests pass safe string/XML handling and TEXT escaping. CSV LF and general ICS URL structural gaps remain SEC-A06/07. |

Live anonymous reads covered team organizations/members/memberships/leaves/invites/shifts/availability and firm/client/role/calendar/template/audit/export tables. Public tables denied anonymous access; private commerce tables were not exposed through the public REST schema. Initial probes selected `id` on three tables without that column and returned 400; those probe selectors were corrected to their actual non-personal identifiers and access denial was verified again. No returned customer identifiers or personal data are stored in the report.

Contact-form scope: its timing trap and localStorage quota in `src/pages/ContactUs.jsx` are client-side conveniences and can be bypassed by a direct request. Third-party Web3Forms anti-abuse enforcement was not verified and no submission/email was sent. Do not count those browser checks as a server-enforced rate limit. Newsletter's separate server handler does validate its CAPTCHA result and consent fields.

## Reproduction

```sh
npm test -- --maxWorkers=4
npm run test:team:database
npm run test:predeploy:artifacts
npm audit --json
npm audit --omit=dev --json
node scripts/security-input-audit.mjs
node scripts/security-resource-audit.mjs
```

For browser input testing, serve the existing production build locally on port 4173 and provide an isolated Playwright installation:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
CHROMIUM_PATH=/path/to/chrome \
node scripts/security-forms.browser.mjs
```

The browser harness refuses non-localhost targets, blocks third-party traffic and mocks billing responses. The input harness injects mock paid orders/limits/email providers; it never makes a real payment. Resource probes run in isolated subprocesses. These diagnostic scripts intentionally exit nonzero for unresolved flags; they are not added to a green CI gate or disguised as passing tests.

Evidence in this environment: `/tmp/viikkonro-security-input-audit/`, `/tmp/viikkonro-security-browser/`, `/tmp/viikkonro-security-resource-audit/`, `/tmp/viikkonro-security-live-results.json`, `/tmp/viikkonro-security-secret-scan.json`, `/tmp/viikkonro-security-unit.log`, `/tmp/viikkonro-security-db.log`, and dependency-audit JSON files. Temporary evidence can expire; findings and reproducible scripts are retained here.

## Repair order and limits

1. Patch dependency advisories with compatible updates and rerun build/security checks.
2. Remove the SVG validation resource trap and enforce date-calculator limits without changing valid results.
3. Make shared validation strict and controlled; align paid company-export date restrictions with the editor.
4. Harden CSV/ICS structural handling, then stage and enforce public CSP with browser compatibility checks.
5. Rerun the diagnostic matrices until their flags are resolved or explicitly documented with a justified safe normalization, then add stable regression cases to the regular release gates.

No finite run checks every possible input. This did not include high-volume live denial-of-service attempts, all mobile engines, an external penetration test, every real authenticated browser role/organization combination, real refunds/charges/invoice inbox delivery, provider dashboard security settings, source-control history secret scanning, or production log-retention inspection. Local PostgreSQL tests establish migration behavior, not by themselves the security of every live configuration. The live anonymous checks add evidence but do not replace authenticated tenant testing. See the broader [deployment test checklist](predeployment-test-cases.md).
