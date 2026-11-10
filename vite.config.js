import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  // Empty prefix so this also picks up non-VITE_-prefixed vars like
  // SITE_ORIGIN (set via Docker ARG/CI, not meant to be a public VITE_* var
  // since prerender.js reads it straight from process.env too).
  const env = loadEnv(mode, process.cwd(), "");
  const sentryRelease = env.VITE_SENTRY_RELEASE || (
    process.env.VERCEL_GIT_COMMIT_SHA
      ? `viikkonro@${process.env.VERCEL_GIT_COMMIT_SHA}`
      : ""
  );
  const sentryUploadEnabled = Boolean(
    !isSsrBuild &&
    process.env.SENTRY_AUTH_TOKEN &&
    (process.env.SENTRY_ORG || env.SENTRY_ORG) &&
    (process.env.SENTRY_PROJECT || env.SENTRY_PROJECT)
  );

  return {
    plugins: [
      react(),
      ...(sentryUploadEnabled
        ? [sentryVitePlugin({
            org: process.env.SENTRY_ORG || env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT || env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: sentryRelease ? { name: sentryRelease } : undefined,
            sourcemaps: { deleteSourcemapsAfterUpload: true },
          })]
        : []),
    ],
    resolve: {
      alias: { "virtual:route-page": fileURLToPath(new URL(
        isSsrBuild || mode === "test" ? "./src/routing/serverPage.js" : "./src/routing/clientPage.jsx", import.meta.url,
      )) },
    },
    // Exposes process.env.SITE_ORIGIN to client/SSR bundle code
    // (src/data/seo.js) as a build-time literal, since browsers have no real
    // process.env.
    define: {
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(sentryRelease),
      "process.env.SITE_ORIGIN": JSON.stringify(
        env.SITE_ORIGIN || "https://viikkonro.fi",
      ),
    },
    build: {
      // Upload private maps to Sentry only when all build credentials exist.
      // The plugin deletes them after upload, so no source map reaches Vercel.
      sourcemap: sentryUploadEnabled ? "hidden" : false,
      // Modern browsers only -> less transpilation, smaller output.
      // Minification is on by default (oxc) in Vite 8 / rolldown.
      target: "es2020",
      manifest: !isSsrBuild,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 900,
      // Split framework code into stable, long-cacheable vendor chunks.
      // Skipped for the SSR build (prerendering), which is a single bundle.
      rollupOptions: isSsrBuild
        ? {}
        : {
            input: { main: "index.html", team: "tiimin-lomat/suunnittelu.html" },
            output: {
              // rolldown (Vite 8) requires the function form of manualChunks.
              manualChunks(id) {
                if (!id.includes("node_modules")) return;
                // pdfkit (2 MB) is loaded on demand by the company calendar export;
                // it must never be merged into the vendor chunk every page loads.
                if (id.includes("pdfkit")) return "pdfkit";
                if (id.includes("@supabase/")) return "team-backend";
                if (id.includes("react-router")) return "router";
                if (
                  id.includes("/react-dom/") ||
                  id.includes("/react/") ||
                  id.includes("/scheduler/")
                ) {
                  return "react";
                }
                return "vendor";
              },
            },
          },
    },
  };
});
