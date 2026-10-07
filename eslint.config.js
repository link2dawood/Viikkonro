import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-server', 'dist-ssr']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Several hydration-safe inputs intentionally receive today's value only
      // after mount so build-time HTML still matches the first client render.
      'react-hooks/set-state-in-effect': 'off',
      // Legacy JSX files still import React explicitly; the automatic JSX
      // runtime makes the binding appear unused even though the import is safe.
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
    },
  },
  {
    // SocialLinks intentionally colocates its reusable static link catalogue
    // with the component; exporting that data does not affect refresh state.
    files: ['src/components/SocialLinks.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Build-tooling config files run under Node, not the browser.
    files: ['vite.config.js', 'prerender.js', 'src/cli.js', 'src/gscClient.js', 'scripts/*.js', 'api/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Runs in both the browser bundle (client/SSR, via Vite's `define`) and
    // plain Node (prerender.js reads process.env directly) — needs both
    // global sets, not just browser.
    files: ['src/data/seo.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
