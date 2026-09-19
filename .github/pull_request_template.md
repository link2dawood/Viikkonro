## What this changes

<!-- A short summary of the change. The PR title becomes the squash commit message, so make it a clear imperative sentence. -->

## Why

<!-- The problem this solves. Link the issue it closes, e.g. "Closes #123". -->

Closes #

## Type of change

- [ ] Bug fix
- [ ] New feature or page
- [ ] Content or copy change
- [ ] SEO, metadata or structured data change
- [ ] Documentation
- [ ] Tooling, CI or dependencies

## Checklist

- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] New behavior has tests, and bug fixes include a regression test
- [ ] `npm run build` passes (required if this touches routes, content, metadata, structured data or anything `prerender.js` imports)
- [ ] Week math uses `src/components/dateUtils.js`, and dates are handled in local time, not UTC
- [ ] Content that appears in more than one place comes from a single data module
- [ ] Finnish copy has been checked by a fluent speaker, or I have noted below that it needs checking
- [ ] Screenshots are attached for visible changes

## SEO sensitive changes

<!--
Complete this section if the PR touches URLs, titles, descriptions, canonical
URLs, structured data, the sitemap, redirects, page content on existing pages,
or the AI facing files. Otherwise, tick the first box and delete the rest.
See docs/SEO_CONSTITUTION.md and the "SEO sensitive changes" section of CONTRIBUTING.md.
-->

- [ ] This PR does not touch anything SEO sensitive

Otherwise:

- [ ] I read `docs/SEO_CONSTITUTION.md` and list the invariants touched below
- [ ] No existing URL breaks, or a 301 redirect is added in `vercel.json`
- [ ] New page families are registered in `sitemapEntries()`, the structured data dispatch in `prerender.js`, and the AI facing files
- [ ] Visible FAQs and FAQ JSON-LD come from the same data function
- [ ] Titles are at most 60 characters and meta descriptions between 140 and 160
- [ ] No content was removed from an indexed page without a reason stated below
- [ ] Every new fact, date or count is computed or cited
- [ ] `CONTENT_UPDATED` in `src/data/seo.js` is bumped, if evergreen text changed

**Invariants touched:** <!-- e.g. 2 (schema coverage), 4 (sitemap) -->

**Evidence from `npm run build`:**

<!-- Paste relevant output from dist/: the generated <title>, meta description, canonical and JSON-LD for at least one affected page. -->

```
```

## Screenshots

<!-- Before and after, for visible changes. -->

## Notes for reviewers

<!-- Anything that needs particular attention, or that you are unsure about. -->
