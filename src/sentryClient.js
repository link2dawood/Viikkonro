// The only two Sentry entry points this application uses, re-exported by name.
//
// src/sentryLazy.js imports this module rather than @sentry/react directly.
// `import("@sentry/react")` asks for the whole namespace, which the bundler
// has to keep intact: it cannot know which exports the awaited object will be
// read for. That shipped the entire SDK, over 450 KB raw, instead of the paths
// actually reached. Naming the exports here gives the bundler a static import
// to tree-shake, and the dynamic boundary moves to this file.
//
// Nothing React-specific is left: hydrateRoot's error callbacks go through
// sentryLazy's own handler, because beforeSend (publicErrorEvent) strips the
// component stack that Sentry.reactErrorHandler() exists to attach.
export { init, captureException } from "@sentry/react";
