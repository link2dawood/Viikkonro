# Contributing to Viikko Nro

Thanks for your interest in improving [viikkonro.fi](https://viikkonro.fi). This guide covers how to get set up, what makes a good pull request, and the extra care needed for changes that affect how the site appears in search results.

By taking part in this project, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contents

- [What we welcome](#what-we-welcome)
- [Before you start](#before-you-start)
- [Setting up](#setting-up)
- [Making a change](#making-a-change)
- [Coding standards](#coding-standards)
- [Testing](#testing)
- [SEO sensitive changes](#seo-sensitive-changes)
- [Pull request checklist](#pull-request-checklist)
- [Review and merging](#review-and-merging)

## What we welcome

**New to the project?** Look for issues labelled [good first issue](https://github.com/link2dawood/Viikkonro/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). They are small, self contained, and describe exactly what "done" looks like. Comment on one to claim it, so two people do not work on the same thing. Issues labelled [help wanted](https://github.com/link2dawood/Viikkonro/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) are bigger, but just as welcome.

**Very welcome**
- Bug fixes, especially wrong dates, wrong week numbers or wrong holidays
- Corrections to Finnish copy: typos, grammar, unclear wording
- Accessibility improvements
- Performance improvements that keep the output identical
- New tests, particularly around ISO week edge cases and year boundaries
- Documentation fixes

**Welcome, but open an issue first**
- New pages or page families
- New calculators or data feeds
- Any change to URLs, titles, descriptions or structured data
- New dependencies
- Visual redesigns

For these, a short discussion first saves everyone time. Several have design specs already in [`docs/`](docs/), so check there before proposing something new.

**Probably not a fit**
- Translating the whole site into another language. The site is Finnish by design, with a single English landing page at `/en`. See invariant 12 in the [SEO constitution](docs/SEO_CONSTITUTION.md).
- Adding a backend or database. The site is fully static on purpose.
- Changes that trade correctness for convenience, such as a simpler week calculation that is wrong at year boundaries.

**Reporting a security issue?** Do not open a public issue. Follow the [security policy](SECURITY.md) instead.

## Before you start

- **Search existing issues and pull requests** to avoid duplicating work.
- **For anything non trivial, open an issue** describing what you want to change and why. Use the templates, which ask the right questions.
- **Read [`CLAUDE.md`](CLAUDE.md)** for a tour of the architecture. It was written as guidance for an AI coding assistant, and doubles as the most complete architecture guide for human contributors.
- **If your change touches routes, content, metadata or structured data, read [`docs/SEO_CONSTITUTION.md`](docs/SEO_CONSTITUTION.md).** It is required reading for those changes, and reviewers will check against it.

## Setting up

You need **Node.js 22 or newer** and **npm**.

### 1. Fork and clone

Fork the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-username>/Viikkonro.git
cd Viikkonro
git remote add upstream https://github.com/link2dawood/Viikkonro.git
```

### 2. Install and run

```bash
npm ci
npm run dev
```

Use `npm ci` rather than `npm install` so you get exactly the versions in `package-lock.json`.

No environment variables are needed to develop, test or build. The contact form needs `VITE_WEB3FORMS_ACCESS_KEY` to actually send mail, but it renders fine without it.

### 3. Check everything works

```bash
npm run lint
npm test
```

Both should pass on a fresh clone. If they do not, please open an issue, because that is a bug.

## Making a change

### 1. Create a branch

Start from an up to date `main`:

```bash
git fetch upstream
git checkout -b fix/week-53-label upstream/main
```

Name branches after what they do, with a short prefix:

| Prefix | For |
| --- | --- |
| `fix/` | Bug fixes |
| `feat/` | New features or pages |
| `content/` | Copy and wording changes |
| `seo/` | Metadata, structured data, sitemap changes |
| `docs/` | Documentation only |
| `chore/` | Tooling, dependencies, CI |

### 2. Commit

Write commit messages in the imperative mood, in sentence case, describing the effect:

```
Fix week 53 label on the 2026 year page
Add school holidays for 2028
```

Keep each commit focused. If you notice an unrelated problem along the way, fix it in a separate pull request.

### 3. Keep your branch current

```bash
git fetch upstream
git rebase upstream/main
```

### 4. Open a pull request

Push your branch to your fork and open a pull request against `main`. The pull request template has a checklist; please fill it in rather than deleting it.

## Coding standards

ESLint enforces the basics (`npm run lint`). Beyond that, this codebase has a few conventions that matter more than style.

**Use the shared date logic.** All ISO week math lives in `src/components/dateUtils.js` (`isoWeek`, `isoYear`, `weeksInIsoYear`, `mondayOf`) along with the Finnish date formatters. Never reimplement week calculations. A second implementation is exactly how off by one errors at year boundaries creep in.

**Work in local time, not UTC.** Dates here are calendar dates in Finland. Avoid `new Date("2026-09-14")`, which parses as UTC midnight and shows the previous day west of Greenwich. Avoid `toISOString()` for formatting a date, which converts to UTC first. Build dates with `new Date(year, monthIndex, day)` and format them from their local parts.

**Keep one source of truth.** When the same fact appears in more than one place, such as FAQ text that is both visible on the page and in the FAQPage JSON-LD, it must come from one data module that both consumers import. Look at how `src/data/faqs.js` feeds both `FAQPage.jsx` and `prerender.js`, and follow that pattern. Never type the same content twice.

**Mind which modules plain Node imports.** `prerender.js` runs as plain Node with no Vite transform. Any module it imports, directly or indirectly, must:
- be a `.js` file, not `.jsx`
- use explicit `.js` extensions on its own relative imports

Vite resolves extensionless imports, so this mistake only shows up when you run `npm run build`.

**Write Finnish copy for Finnish pages.** All user facing text is in Finnish, except the `/en` page. If you are not a fluent Finnish speaker, that is fine for code changes; for copy changes, please say so in your pull request so a reviewer can check the language.

**Comment the why, not the what.** Much of this code exists because of a non obvious constraint, like a search engine quirk, a timezone trap or a hosting behavior. When you add code like that, leave a comment explaining the constraint, as the existing code does.

**Keep dependencies lean.** The site ships to every visitor, so please discuss new runtime dependencies in an issue first.

## Testing

```bash
npm test                         # run the whole suite once
npx vitest                       # watch mode while you work
npx vitest run src/data/holidays.test.js   # a single file
```

Tests live next to the code they test, as `src/data/*.test.js`.

**Add a test when you fix a bug.** The test should fail before your fix and pass after it.

**Test the edges.** For anything involving dates, include cases for:
- years with 53 ISO weeks (2020, 2026 and 2032 are examples)
- late December dates that belong to week 1 of the next year
- early January dates that belong to week 52 or 53 of the previous year
- leap years

**Check timezone independence** if your change handles dates. CI runs in UTC, and the suite should pass in any timezone:

```bash
TZ=UTC npm test
TZ=Europe/Helsinki npm test
TZ=America/Los_Angeles npm test
```

**Run the full build** when you change routing, page content, metadata, structured data or anything `prerender.js` imports:

```bash
npm run build
```

This takes a few minutes. It is the only way to catch a module that works in the dev server but breaks under plain Node, and it produces the real HTML that search engines see in `dist/`.

## SEO sensitive changes

Most of this site's visitors arrive from search. Its URLs, titles and structured data have been built up carefully, and a well meant change can quietly lose rankings that took months to earn. This section exists so that does not happen by accident.

### What counts as SEO sensitive

Your change is SEO sensitive if it touches any of:

- **URLs**: adding, removing or renaming routes, or changing slug formats
- **Metadata**: titles, meta descriptions, canonical URLs, `robots` directives
- **Structured data**: any JSON-LD produced in `prerender.js`
- **Page content** on existing pages, especially removing text, facts or FAQ entries
- **The sitemap**: `sitemapEntries()` in `src/data/seo.js` or the sitemap code in `prerender.js`
- **Redirects** in `vercel.json`
- **AI facing files**: `public/llms.txt`, `public/ai.txt`, or the generated `llms-*.txt`, `ai-manifest.txt` and knowledge graph
- **Anything under** `/data/`, `/pdf/`, `/og/` or `/discover/`

### The rules

The [SEO constitution](docs/SEO_CONSTITUTION.md) is the authority. It lists 15 invariants and the exact code that implements each one. The rules contributors trip over most often:

1. **Never break an existing URL.** If a URL must change, add a `301` redirect in `vercel.json` in the same pull request.
2. **Never add a second URL for existing content.** One piece of content, one URL.
3. **Register new page families everywhere.** A new kind of page needs an entry in `sitemapEntries()`, a node builder in `prerender.js`'s structured data dispatch, and a mention in the AI facing files. A page that renders but is missing from these is a regression.
4. **Keep visible FAQs and FAQ schema identical.** Both must come from the same data function. Never write FAQ text directly into `prerender.js`.
5. **Build JSON-LD page nodes with `pageNode()`.** Never assemble a `#webpage` node by hand.
6. **Respect the length limits.** Titles up to 60 characters, meta descriptions between 140 and 160. Tests enforce this for many page families but not all of them, so check new and static pages yourself.
7. **Do not hand edit generated files.** `sitemap.xml`, `llms-full.txt` and the others are regenerated on every build, so edits to the output are lost. Change the generator instead.
8. **Do not add `hreflang` or new English pages.** Only `/` and `/en` are language alternates.
9. **Do not remove content from an indexed page without a stated reason.** Shorter is not automatically better.
10. **Do not invent facts.** Every date, count and claim must be computed or come from a named, verifiable source.

If you edit evergreen explanatory text, also bump `CONTENT_UPDATED` in `src/data/seo.js`. It drives both the visible "Päivitetty" date and `dateModified` in structured data.

### How to propose one

1. **Open an issue first** using the **SEO or content change** template. Describe the change, which invariants it touches, and why it improves search visibility.
2. **Wait for agreement** before investing in the implementation. A change that relaxes an invariant, rather than extending it to a new page type, is a product decision for the maintainer.
3. **In your pull request, show real output.** Run `npm run build` and include evidence from `dist/`, not just the source diff. For example:
   ```bash
   # the generated head of a page you changed
   grep -E '<title>|name="description"|rel="canonical"' dist/viikko-38-2026.html

   # its structured data, pretty printed
   node -e 'const h=require("fs").readFileSync("dist/viikko-38-2026.html","utf8");
     for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
       console.log(JSON.stringify(JSON.parse(m[1]), null, 2))'

   # confirm vercel.json is still valid
   node -e "JSON.parse(require('fs').readFileSync('vercel.json'))"
   ```
4. **Fill in the SEO section of the pull request template.** Reviewers will not merge an SEO sensitive change without it.

If you are unsure whether your change counts, assume it does and ask in the issue.

## Pull request checklist

Before requesting review, confirm:

- [ ] The branch is up to date with `main`
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] New behavior has tests, and bug fixes have a regression test
- [ ] `npm run build` passes, if the change touches routes, content, metadata, structured data or anything `prerender.js` imports
- [ ] Week math uses `dateUtils.js` and dates are handled in local time
- [ ] Any content that appears in two places comes from one data module
- [ ] SEO sensitive changes follow the section above and include real build output
- [ ] Finnish copy has been checked by a fluent speaker, or the pull request says it needs checking
- [ ] The pull request description explains what changed and why
- [ ] Screenshots are included for visible changes

## Review and merging

- A maintainer will review your pull request as soon as they can. If it has been a while, a polite comment on the pull request is welcome.
- The CI checks must pass before a pull request can be merged.
- Pull requests are squash merged, so the pull request title becomes the commit message. Please make it a clear, imperative sentence.
- Every merge to `main` deploys to production automatically. That is why the checks above matter.

Thank you for contributing.
