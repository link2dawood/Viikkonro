# Brevo email signup

The website now has a Vercel Function at `/api/newsletter`. The popup POSTs to
it; the function validates consent and a Cloudflare Turnstile token, then calls
Brevo's double opt-in API. Brevo stores subscribers. There is no additional
database. This private write operation is not an indexable resource; it returns
`noindex` and `no-store` headers.

## Account setup and activation

1. Verify your sending address/domain in Brevo and create a dedicated list for
   Finnish weekly reminders. Note its numeric list ID.
2. Create these **text** contact attributes with these exact names:
   `NEWSLETTER_CONSENT_VERSION`, `NEWSLETTER_REQUESTED_AT`, `NEWSLETTER_LANGUAGE`.
3. Create and activate a double opt-in email template. Its confirmation link
   must use `{{ params.DOIurl }}`. Include this consent text and version
   `weekly-fi-v1` in the template:

   > Haluan Viikkonron viikoittaiset muistutukset sähköpostiini. Voin perua tilauksen jokaisen viestin linkistä.

   Explain that messages contain the current week number and upcoming Finnish
   holidays. Keep this template version for consent records. Do not add pending
   contacts to the sending list through a separate API or import.
4. Create a Cloudflare Turnstile widget restricted to `viikkonro.fi` (or the
   exact test deployment hostname), and copy its site key and secret key.
5. Add these Vercel environment variables:

   | Variable | Value |
   | --- | --- |
   | `BREVO_API_KEY` | Private Brevo API key |
   | `BREVO_NEWSLETTER_LIST_ID` | Numeric list ID |
   | `BREVO_DOI_TEMPLATE_ID` | Numeric confirmation template ID |
   | `TURNSTILE_SECRET_KEY` | Private Turnstile secret |
   | `SITE_ORIGIN` | `https://viikkonro.fi` |
   | `VITE_TURNSTILE_SITE_KEY` | Public Turnstile site key |
   | `VITE_NEWSLETTER_ENDPOINT` | `/api/newsletter` |

   Real keys must not be committed or pasted into client code. `.env.example`
   contains placeholders; real env files are ignored. Leave both `VITE_*` settings
   empty until account setup and delivery are ready. Removing either disables
   the popup after a rebuild.
6. Configure weekly campaigns in Brevo using the confirmed list and an
   unsubscribe link in every email. This implementation handles **signup and
   confirmation**, not automatic generation or scheduling of weekly content.
   Do not activate the weekly offer before delivery is arranged. Monitor daily
   sending usage, including confirmation emails.
7. Configure an edge rate limit for POST `/api/newsletter` through your hosting
   firewall. Turnstile is mandatory and its single-use token prevents replay;
   it is not a hard daily sending cap or a distributed rate limiter.
8. Rebuild/deploy through the normal PR workflow. Test signup, inbox delivery,
   confirmation, list membership, unsubscribe and repeat signup with an address
   you control. Verify attribute names, sender identity, privacy details and
   retention practices. No live email was sent during implementation because
   account credentials were not available.

## Local development

`npm run dev` serves the frontend only. Use `vercel dev` with the environment
above to run the server endpoint; `vite preview` does not execute functions.
For a preview, set `SITE_ORIGIN` to that exact origin and allow its hostname
in Turnstile. The handler rejects any different browser Origin. Never expose
provider credentials in a `VITE_*` variable.

## Behavior and validation

The compact card appears 12 seconds after load, waiting for the cookie banner
to close. It stays out of prerendered HTML. Opening the form loads Turnstile,
independently of analytics consent. Tokens are checked on the server for the
expected hostname and `newsletter` action. A failed request gets a new token
before retry. Local storage contains only a dismissal timestamp, used for
30-day suppression; it contains no email address.

The handler bounds input to 8 KB, validates the fixed consent version and email,
uses server-owned list/template IDs, and times out external requests. It does
not log email addresses, tokens, keys or provider error bodies. Only a successful
Brevo response returns `{ "status": "confirmation_required" }`. This means a
request was accepted, not that the visitor is already subscribed. Provider
failures return generic errors without exposing contact details.

`npm run test:predeploy` covers validation, mocked provider success/failure,
bot rejection, consent, limits, static generation and crawl invariants. Live
account configuration and inbox delivery require the separate test above.

## Research

Reviewed 2026-10-07:

- [Brevo double opt-in API](https://developers.brevo.com/reference/create-doi-contact)
- [Cloudflare token verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Google interstitial guidance](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials)

Existing URLs, structured data and indexed answers remain intact. The privacy
page describes the signup integration and has an updated sitemap modification
date. A future Supabase database can store application preferences while Brevo
continues to handle subscription delivery and unsubscribe status.
