import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  // Empty prefix so this also picks up non-VITE_-prefixed vars like
  // SITE_ORIGIN (set via Docker ARG/CI, not meant to be a public VITE_* var
  // since prerender.js reads it straight from process.env too).
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    // Exposes process.env.SITE_ORIGIN to client/SSR bundle code
    // (src/data/seo.js) as a build-time literal, since browsers have no real
    // process.env.
    define: {
      "process.env.SITE_ORIGIN": JSON.stringify(
        env.SITE_ORIGIN || "https://viikkonro.fi",
      ),
    },
    build: {
      // Modern browsers only -> less transpilation, smaller output.
      // Minification is on by default (oxc) in Vite 8 / rolldown.
      target: "es2020",
      reportCompressedSize: false,
      chunkSizeWarningLimit: 900,
      // Split framework code into stable, long-cacheable vendor chunks.
      // Skipped for the SSR build (prerendering), which is a single bundle.
      rollupOptions: isSsrBuild
        ? {}
        : {
            output: {
              // rolldown (Vite 8) requires the function form of manualChunks.
              manualChunks(id) {
                if (!id.includes("node_modules")) return;
                // pdfkit (2 MB) is loaded on demand by the company calendar export;
                // it must never be merged into the vendor chunk every page loads.
                if (id.includes("pdfkit")) return "pdfkit";
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
