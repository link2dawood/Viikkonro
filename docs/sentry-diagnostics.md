# Sentry browser error diagnostics

## Deployment setup

The production client reads the release name at build time. On Vercel it uses
`viikkonro@<VERCEL_GIT_COMMIT_SHA>`; `VITE_SENTRY_RELEASE` can override it.
The same name is passed to Sentry's Vite plugin when source-map upload is
enabled.

Set these as **production build environment variables** in Vercel:

- `SENTRY_AUTH_TOKEN`: private Sentry organization token with the minimum
  permissions needed to create releases and upload source maps.
- `SENTRY_ORG`: Sentry organization slug.
- `SENTRY_PROJECT`: Sentry project slug, not its numeric project ID.

When all three are present, the client build emits hidden source maps, uploads
them to Sentry, and removes them from `dist`. Without the credentials, the
ordinary build creates no source maps and makes no Sentry upload. Never use a
`VITE_` prefix for the auth token.

## What browser events retain

`src/errorReporting.js` keeps JavaScript asset filenames and line/column
locations only for same-site `/assets/*.js` files. Relative paths are
normalized. It still removes request URLs, query parameters, user data,
breadcrumbs, and arbitrary exception messages. A short allowlist reports
common native `RangeError` categories such as invalid date values and stack
overflow; any other message stays generic.

## Investigating an event

1. Open the event's **latest occurrence**, not only the issue summary.
2. Expand every chained exception. Check the original exception and React
   component-stack exception.
3. Confirm that the event release equals the deployed commit and that Sentry
   has processed that release's source maps.
4. Use the mapped app frame to reproduce the failing route and state, then add
   a regression check for the smallest input that triggers it.

Events recorded before release and source-map upload cannot be symbolicated
retroactively when the event itself contains no filename or location. For
example, event `ffe4b9f959ff4e4ca3049edcb6952e22` has a `RangeError` at line 205,
column 110, but its stored filename, release, and location are empty. Its
original cause cannot be inferred from that stored payload.
