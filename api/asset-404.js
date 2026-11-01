// Handles requests for missing static assets rewritten from /assets/* or /fonts/*
// Ensures missing chunks or missing static assets receive a 404 with no-cache/no-store,
// preventing browsers and CDNs from negative-caching 404s with a 1-year immutable cache.

export function handleMissingAsset() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export default {
  async fetch() {
    return handleMissingAsset();
  },
};
