# Security Policy

## Supported versions

Viikko Nro is a continuously deployed website. Only the current production site and the `main` branch receive security fixes.

| Target | Supported |
| --- | --- |
| https://viikkonro.fi (production) | Yes |
| `main` branch | Yes |
| Older commits, forks, preview deployments | No |

The Android app and the Chrome extension live in separate repositories. Please report issues with them through the same channels below, and say which product you mean.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests or discussions.**

### Preferred: GitHub private vulnerability reporting

1. Go to the repository's **[Security tab](https://github.com/link2dawood/Viikkonro/security)**
2. Click **Report a vulnerability**
3. Fill in the form

This keeps the report private between you and the maintainers, and lets us work on a fix and credit you in a security advisory.

### Alternative: contact form

If you cannot use GitHub, use the contact form at <https://viikkonro.fi/ota-yhteytta>. **Do not put vulnerability details in the form.** Start your message with "Security report" and ask for a private channel, and we will reply to arrange one.

This matches the contact published in [`/.well-known/security.txt`](https://viikkonro.fi/.well-known/security.txt).

### What to include

- A description of the issue and its impact
- The affected URL, file or component
- Steps to reproduce, or a proof of concept
- Your browser and operating system, if relevant
- Whether you would like to be credited, and under what name

## What happens next

1. We acknowledge your report and confirm whether we can reproduce it.
2. We assess the impact and agree on a disclosure timeline with you.
3. We fix the issue. Every merge to `main` deploys to production automatically, so fixes go live quickly once merged.
4. We publish a security advisory, crediting you if you wish.

Please give us reasonable time to fix the issue before disclosing it publicly.

## Scope

**In scope**
- The website at viikkonro.fi and its subpages
- The static data feeds under `/data/` and the `/api/` aliases
- Build and deployment configuration in this repository, including `vercel.json` and the GitHub Actions workflows
- Cross site scripting, injection into prerendered pages or structured data, open redirects, and leaked secrets

**Out of scope**
- **The Web3Forms access key in the client bundle.** It is public by design: it can only deliver mail to one pre verified address and cannot read anything.
- **Contact form rate limiting.** The limit is enforced in the browser as a courtesy; abuse protection is Web3Forms' responsibility.
- Reports from automated scanners with no demonstrated impact, such as missing headers on static pages with no sensitive actions
- Clickjacking on pages without state changing actions
- Social engineering, and physical attacks
- Vulnerabilities in third party services themselves (Vercel, Cloudflare, Web3Forms, Google, Microsoft), which should go to those vendors
- Denial of service or load testing. **Please do not run volumetric tests against the production site.**

## Safe harbor

We will not pursue legal action against anyone who, in good faith:

- follows this policy and reports through the channels above
- avoids privacy violations, data destruction and service disruption
- only interacts with accounts and data they own, or with explicit permission
- gives us reasonable time to respond before any public disclosure

Thank you for helping keep Viikko Nro and its users safe.
