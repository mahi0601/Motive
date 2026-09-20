import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Only upload source maps when a Sentry auth token is actually configured —
// keeps local dev and any CI run that hasn't set this up completely
// unaffected (no network calls, no org/project validation, no sourcemap
// emitted at all). Set SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT in the
// Netlify build environment to turn this on.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

// A release identifier shared by two things that otherwise have no reason
// to agree: the client's `Sentry.init({ release })` (so an error event is
// tagged with the build that produced it) and this same plugin's uploaded
// sourcemaps (so Sentry can actually match a minified stack trace back to
// source for that release). Netlify sets COMMIT_REF automatically; falling
// back to the local git SHA covers `npm run build` on a dev machine, and
// package.json's version is the last resort (e.g. no .git present at all).
function resolveRelease() {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 12);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'));
    return pkg.version;
  }
}
const release = resolveRelease();

export default defineConfig({
  // Inlined into the client bundle (see src/sentry.js) — deliberately NOT a
  // real .env var, since it has to be exactly the same string this file
  // hands the Sentry plugin below, not something set independently.
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(release),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['motive.svg'],
      manifest: {
        name: 'Motive — client-ready project delivery',
        short_name: 'Motive',
        description: 'Client-ready project delivery for small agencies. Run your work on a board; your client gets a live status page.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1418',
        theme_color: '#0e4c5c',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          // SVG fallback (crisp at any size where supported)
          { src: '/motive.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Precache the built app shell; SPA navigations fall back to index.html.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // Don't let the SW intercept API calls — they need the network + auth.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Google Fonts — cache-first, long TTL.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // keep the SW out of dev so HMR is unaffected
      },
    }),
    // Uploads this build's source maps to Sentry so production stack traces
    // are readable, then deletes the .map files from dist so raw source
    // isn't shipped publicly. `disable` makes this a complete no-op (no
    // network calls, no required org/project) when authToken is unset.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: sentryAuthToken,
      disable: !sentryAuthToken,
      release: {
        name: release,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ['dist/**/*.map'],
      },
    }),
  ],
  build: {
    // Needed for the plugin above to have anything to upload. Only emitted
    // when actually uploading (see filesToDeleteAfterUpload) — an unconfigured
    // build stays exactly as before, with no sourcemaps in the output.
    sourcemap: !!sentryAuthToken,
  },
})
