# Motive

A calm, fast workspace to capture ideas, organize pages, and get things done — a Notion/Todoist-style productivity app. React + Vite web app, shipped as a native Android app via Capacitor, with an offline-capable PWA build for the web.

The API is a **sibling repo**: [`../motive-backend`](../motive-backend). Two repos, two independent deploy targets — this app on Netlify, the API on Render.

## Local setup

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your running backend
npm run dev                # http://localhost:5173
```

Get the backend running first (see its own README) — this app has nothing to talk to without it. `VITE_SENTRY_DSN` is optional; everything else in `.env.example` (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) is a **build-time-only** Netlify setting, not something you need locally — see the Sentry section below.

`npm run lint` (ESLint flat config, `eslint.config.js`) — mainly enforcing `no-console`: everything logs through `src/utils/logger.js` instead (see "Logging" below), so a stray `console.log` fails lint rather than silently shipping. `npm run test` runs the Vitest suite (unit tests for the trickier pure logic — quick-add parsing, Momentum's client-side date math, etc.; nothing end-to-end). `npm run build` must also stay clean. All three are the guardrails that must pass before deploying.

## Deploying (Netlify)

`netlify.toml`: build `npm ci && npm run build`, publish `dist`, SPA fallback (`/*` → `/index.html`) already configured, plus no-cache headers on the service worker files so PWA updates actually reach installed clients.

Set in the Netlify dashboard (Site settings → Environment variables):
- `VITE_API_BASE_URL` — your deployed API's origin (`https://<your-api-host>`).
- `VITE_SENTRY_DSN` — optional, a Sentry project (React platform).
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — optional. Deliberately *not* prefixed `VITE_`, so unlike the two above these never end up in the shipped bundle. Set all three to enable production source-map upload (`vite.config.js`) — without them the build is unaffected, no sourcemaps generated, no network calls attempted.

Nothing to set for `VITE_APP_VERSION` — `vite.config.js` derives it automatically at build time (Netlify's `COMMIT_REF`, falling back to the local git SHA) and inlines it into the bundle, so every Sentry event is tagged with the exact release the uploaded sourcemaps belong to.

### Logging

`src/utils/logger.js` wraps `src/sentry.js`: `logger.warn(message, context)` is dev-console only (nothing shipped), `logger.error(message, error, context)` also reports to Sentry when `VITE_SENTRY_DSN` is configured. Only two call sites use `.error` — `services/api.js`'s response interceptor (every API failure, one central place) and `components/ui/ErrorBoundary.jsx` (React render crashes, which never go through an API call) — every other call site uses `.warn`, deliberately, so a single failure is never reported to Sentry twice. `context` is always a small explicit object (a status code, a task id), never a raw error or response body — those can carry comment text, task titles, and page content that shouldn't go to a third-party service unscrubbed.

**One env var lives on the other repo but affects this one**: the backend's `FRONTEND_URL` must point at this app's real deployed origin — it feeds the CORS allow-list, the Stripe checkout redirect, and password-reset email links. Update it in Render whenever this app's URL changes.

## Android (Capacitor)

```bash
npm run android   # build + cap sync + open Android Studio
npm run apk        # build + cap sync + assemble a release APK
```

Requires `android/keystore.properties` (copy from `keystore.properties.example` and fill in) to produce a **signed** release build — without it, `assembleRelease` still succeeds but produces an unsigned APK. **Back up `android/motive-upload.keystore` and `keystore.properties` somewhere outside this machine** — both are gitignored on purpose (never commit a signing key), which also means losing them means losing the ability to ever update an existing Play Store listing.

Google Sign-In on Android needs the *same* Google OAuth client as the web flow — see the backend README's Google OAuth section. No separate Android OAuth client or SHA-1 fingerprint is needed: the native flow opens the system browser to complete the standard web OAuth flow, then hands the session back to the app via a `com.motive.app://oauth-callback` deep link (registered in `android/app/src/main/AndroidManifest.xml`, handled by `src/hooks/useNativeOAuthCallback.js`) — Google itself never sees that custom scheme.

Whenever you change anything under `src/`, re-run `npm run build && npx cap sync android` before assembling an APK — Capacitor copies the built web assets into `android/app/src/main/assets/public`, and that copy does **not** update itself; a stale sync ships an old build inside a "new" APK with no warning.

## Project layout

```
src/
  pages/        one file per route
  components/   app/ calendar/ collab/ editor/ layout/ notifications/ tasks/ ui/
  context/      Auth, Theme, Workspace, Toast, NotificationSocket, CommandPalette
  hooks/        shared logic (useTasks, useNativeOAuthCallback, ...)
  services/     one file per backend resource — thin axios wrappers, see services/api.js
  routes/       AppRoutes + ProtectedRoute
```

`services/api.js` is the shared axios instance: in-memory access token (never localStorage — not reachable by XSS), automatic silent refresh via the httpOnly cookie on a 401, single de-duped refresh across concurrent requests.
