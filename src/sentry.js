// src/sentry.js — imported first thing in main.jsx, before anything renders,
// so init-time errors are caught too. Opt-in: without VITE_SENTRY_DSN set,
// this is a no-op and the app behaves exactly as before.
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Set by vite.config.js's `define` at build time (git SHA, or Netlify's
    // COMMIT_REF) — matches the release name the Sentry Vite plugin uploads
    // sourcemaps under, so a production stack trace actually resolves back
    // to real source instead of showing minified names.
    release: import.meta.env.VITE_APP_VERSION,
    // Already the v10 default — explicit here because this app logs task
    // titles, comments, and page content through this same pipeline
    // (src/utils/logger.js), and "Sentry won't silently start attaching PII"
    // shouldn't depend on nobody upgrading a default.
    sendDefaultPii: false,
    // Low sample rate — this is a small app; full tracing isn't needed to
    // get value out of error tracking, just cheap enough to leave always on.
    tracesSampleRate: 0.1,
  });
}

export const isSentryEnabled = !!dsn;
export { Sentry };
