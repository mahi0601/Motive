<div align="center">
  <img src="assets/logo-animated.svg" width="120" height="120" alt="Motive logo" />

  # Motive

  A calm, fast workspace to capture ideas, organize pages, and get things done.

  [![CI](https://github.com/mahi0601/Motive/actions/workflows/ci.yml/badge.svg)](https://github.com/mahi0601/Motive/actions/workflows/ci.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  [Live demo](https://motive-theta.vercel.app) · [API repo](https://github.com/mahi0601/motive-backend)
</div>

<br>

A Notion/Todoist-style productivity app — React + Vite on the web, a native Android app via Capacitor, and an offline-capable PWA.

## Features

- Quick-add tasks with natural-language dates, subtasks, drag-and-drop, and templates
- Calendar view and a Momentum view for tracking progress over time
- Comments, attachments, and an activity feed for shared workspaces
- Realtime notifications and a keyboard-driven command palette
- Email or Google sign-in, installable as a PWA or a native Android app

The API lives in a sibling repo — [motive-backend](https://github.com/mahi0601/motive-backend).

## Quick start

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your running backend
npm run dev                 # http://localhost:5173
```

Get [motive-backend](https://github.com/mahi0601/motive-backend) running first — this app has nothing to talk to without it.

`npm run lint` · `npm run test` · `npm run build` — all three stay clean before every deploy (and run in CI).

<br>

<details>
<summary><strong>Deployment, logging, and Android details</strong></summary>

<br>

### Deploying (Netlify)

`netlify.toml`: build `npm ci && npm run build`, publish `dist`, SPA fallback (`/*` → `/index.html`), no-cache headers on the service worker files so PWA updates actually reach installed clients.

Set in the Netlify dashboard (Site settings → Environment variables):

| Var | Notes |
|---|---|
| `VITE_API_BASE_URL` | Your deployed API's origin (`https://<your-api-host>`). |
| `VITE_SENTRY_DSN` | Optional — a Sentry project (React platform). |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Optional, build-time only, deliberately *not* prefixed `VITE_` so they never reach the shipped bundle. Set all three to enable production source-map upload (`vite.config.js`). |

Nothing to set for `VITE_APP_VERSION` — `vite.config.js` derives it automatically from Netlify's `COMMIT_REF` (falling back to the local git SHA) and inlines it into the bundle, so every Sentry event is tagged with the exact release the uploaded sourcemaps belong to.

There's also a live Vercel deployment of this repo (linked at the top of this README) connected via Vercel's dashboard GitHub integration, outside any committed config — it auto-deploys on every push same as Netlify does. It currently has no `VITE_API_BASE_URL` set, so anything that talks to the API (login, tasks, etc.) won't work there yet; treat Netlify as the canonical, fully-configured deployment until that's set.

**One env var lives on the other repo but affects this one**: the backend's `FRONTEND_URL` must point at this app's real deployed origin — it feeds the CORS allow-list, the Stripe checkout redirect, and password-reset email links.

### Logging

`src/utils/logger.js` wraps `src/sentry.js`: `logger.warn(message, context)` is dev-console only, `logger.error(message, error, context)` also reports to Sentry when `VITE_SENTRY_DSN` is configured. Only two call sites use `.error` — `services/api.js`'s response interceptor and `components/ui/ErrorBoundary.jsx` — every other call site uses `.warn`, so a single failure is never reported to Sentry twice. `context` is always a small explicit object (a status code, a task id), never a raw error or response body.

### Android (Capacitor)

```bash
npm run android   # build + cap sync + open Android Studio
npm run apk        # build + cap sync + assemble a release APK
```

Requires `android/keystore.properties` (copy from `keystore.properties.example` and fill in) to produce a **signed** release build — without it, `assembleRelease` still succeeds but produces an unsigned APK. **Back up `android/motive-upload.keystore` and `keystore.properties` somewhere outside this machine** — both are gitignored on purpose, and losing them means losing the ability to ever update an existing Play Store listing.

Google Sign-In on Android needs the *same* Google OAuth client as the web flow (see the backend README). The native flow opens the system browser to complete the standard web OAuth flow, then hands the session back via a `com.motive.app://oauth-callback` deep link — no separate Android OAuth client or SHA-1 fingerprint needed.

Whenever you change anything under `src/`, re-run `npm run build && npx cap sync android` before assembling an APK — Capacitor's copy of the built web assets does **not** update itself.

### Project layout

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

</details>

## Contributing

Issues and pull requests are welcome. Fork, branch off `master`, keep `lint` / `test` / `build` clean, open a PR.

## License

[MIT](LICENSE) © Bipasha Bhattacharjee
