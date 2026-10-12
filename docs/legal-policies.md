# Service information, privacy and purchase terms

The Finnish pages keep `/tietoa-meista`, `/tietosuoja` and `/kayttoehdot`.
The distinct refund guide is `/palautusehdot`. The shared footer and company
calendar purchase controls link to these documents. Refund FAQs share their
visible and JSON-LD source. No calendar calculations or permissions change.

## Operator details and disclosure scope

The operator confirmed Dawood Zafar, `https://dawoodzafar.us` and WhatsApp
`+9230633301114` for public contact. The known service email is
`hi@viikkonro.fi`. Viikkonro is an unregistered service name, not a registered
company. No registration number or country is invented. The operator explicitly
instructed that a postal address must not be added; the pages follow that
instruction. Customer billing addresses remain part of the existing private
purchase records and are unaffected.

This disclosure records confirmed contact details; it does not certify that
every supplier, business-registration or geographical-address obligation has
been satisfied. Polar's separate merchant identity and buyer terms remain
linked. The operator's actual jurisdiction and obligations have not been
established by this change. Do not describe this revision as legally certified.

The operator's latest selection on 12 October 2026 supersedes the earlier
money-back guarantee choice: unused purchases can be refunded within 14 days.
Unused means no paid calendar file has been downloaded with that purchase;
free preview and draft editing do not count. Defects and mandatory legal rights
are handled separately, including consumer rights after downloads. No blanket
exclusion of digital refunds is added.

There is no authoritative guest export-history database in this phase. Staff
review the buyer's statement and order information; neither the notice endpoint
nor analytics automatically establish usage or refund eligibility. Do not add
calendar contents, private purchase codes or browsing data to an eligibility
record. The notice endpoint accepts requests regardless of this voluntary
14-day period, because defect and statutory rights may apply beyond it.

Operational follow-up: confirm the applicable retention schedule, service-provider
agreements and international transfer arrangements, and document the legitimate
interest assessment for limited public cookieless analytics. The Android
disclosures are preserved from the existing policy; this web repository cannot
verify the installed Android binary. These pages are not a compliance
certification or a substitute for review of the operator's actual practices.

## Cancellation flow

1. The purchaser opens `/palautusehdot#peruuttaminen` from the footer or purchase
   area. An email alternative remains available, including a missing order ID.
2. They enter their name, purchase email and Polar order UUID. A separate review
   step requires confirmation before sending the notice.
3. `/api/billing/withdrawal` requires a same-origin JSON POST, bounds the body to
   8 KiB, validates fields and consumes the existing shared ten-per-minute
   recovery limit. Service failures fail closed.
4. The authoritative Polar adapter verifies the order's organization, product,
   payment and email. No account, live export cookie or unexpired calendar-year
   licence is required. This does not grant access to the calendar.
5. Mailjet receives a plain-text acknowledgement containing the contract,
   order UUID and receipt date/time. The purchaser is the recipient; the
   configured billing owner gets a BCC. Click/open tracking is disabled.
6. The API acknowledges a successful Mailjet submission. Provider acceptance
   is not proof of inbox delivery. Failed mail submissions return a clear error
   and preserve the email alternative. There is no new persistent outbox;
   separate deliberate submissions can send separate acknowledgements.
7. Staff review the notice and administer any eligible refund in Polar.
   Submission does not automatically refund, cancel payment or revoke access.
   Existing billing reconciliation revokes entitlement for a confirmed full
   refund; a partial refund retains entitlement.

The notice has no marketing consent, payment-card fields, private purchase code
or calendar content. The form and review text are Clarity-masked. There are no
notice analytics events or application payload logs. Existing server-only
Mailjet and billing credentials are reused; no secrets enter the client.

## References

Processing disclosures and provider references were reviewed 11 October 2026.
KKV consumer cancellation guidance was rechecked 12 October 2026 for the revised
unused-purchase policy. The latest policy and public contacts were selected by
the operator on 12 October 2026.

- [KKV cancellation rights and required online action from 19 June 2026](https://www.kkv.fi/kuluttaja-asiat/tietoa-ja-ohjeita-yrityksille/verkkokauppiaille/peruuttamisoikeus-ja-peruuttamisaika/)
- [KKV consumer cancellation rights](https://www.kkv.fi/kuluttaja-asiat/verkkokauppa/peruuttamisoikeus-verkkokaupassa/)
- [KKV refund timing and payment method](https://www.kkv.fi/kuluttaja-asiat/verkkokauppa/maksun-palauttaminen-kun-perut-verkkokauppaostoksen/)
- [Polar buyer terms and reseller role](https://polar.sh/legal/checkout-buyer-terms)
- [Polar privacy](https://polar.sh/legal/privacy-policy)
- [Supabase privacy](https://supabase.com/privacy)
- [Mailjet privacy](https://www.mailjet.com/legal/privacy-policy/)
- [Vercel privacy](https://vercel.com/legal/privacy-notice)
- [Microsoft Clarity retention, updated 30 June 2026](https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention)

## Verification

`npm run test:predeploy` includes the existing release gate and new policy
artifact checks. `src/platform/billing/withdrawal.test.js` exercises validation,
cross-origin access, bounded bodies, order/email matching, outages and private
untracked email acknowledgements. `src/pages/LegalPages.test.jsx` checks policy
content and routing data. `scripts/legal.browser.mjs` tests real hydration,
desktop/mobile layouts and the two-step form using mocked requests. No real
payment, refund or purchaser email is created by the tests.

Verification for this revision:

- ESLint passed.
- Full unit suite: 1,063 passed, nine existing skips across 91 files.
- Production build: 1,921 prerendered routes and 1,027 indexable sitemap URLs.
- All 33 generated-artifact cases passed, including four new legal cases.
- SSR rebuild and the complete internal-link crawl passed.
- Eight desktop/mobile legal-page cases plus cancellation validation, long
  Finnish name, review, editing, success, failure, receipt masking and print
  checks passed in Chromium with mocked API responses and no JavaScript errors.
- A schema comparison preserved every existing identifier/type across the
  1,026 previously indexed pages.

The operator's latest public contact and unused-purchase refund selections are
confirmed. No real customer payment, email or refund is created by verification.

## Files in this change

- Policy pages: `src/pages/AboutUs.jsx`, `PrivacyPolicy.jsx`,
  `TermsAndConditions.jsx`, and the new `RefundPolicy.jsx`.
- Shared policy data/contact/forms: `src/data/legalPolicies.js`,
  `src/components/LegalContact.jsx`, `WithdrawalForm.jsx`, and `legal.css`.
- Purchase and navigation: `src/AppRoutes.jsx`, `src/components/Footer.jsx`,
  `src/components/companyCalendar/Purchase.jsx`.
- Cancellation delivery: `api/billing/[action].js` and
  `src/platform/billing/withdrawal.js`.
- SEO: `src/data/seo.js`, `pageTopics.js`, `sitemapMetadata.js`, `prerender.js`,
  `public/ai.txt`, and `public/llms.txt`.
- Tests: `src/pages/LegalPages.test.jsx`,
  `src/platform/billing/withdrawal.test.js`, `withdrawalRoute.test.js`,
  `src/data/sitemapMetadata.test.js`, `scripts/legal-build.cases.mjs`,
  `scripts/legal.browser.mjs`, and the artifact command in `package.json`.
- Documentation: this file. Unrelated worktree files were preserved.
