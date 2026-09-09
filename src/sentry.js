// src/sentry.js — imported first thing in main.jsx, before anything renders,
// so init-time errors are caught too. Opt-in: without VITE_SENTRY_DSN set,
// this is a no-op and the app behaves exactly as before.
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Low sample rate — this is a small app; full tracing isn't needed to
    // get value out of error tracking, just cheap enough to leave always on.
    tracesSampleRate: 0.1,
  });
}

export const isSentryEnabled = !!dsn;
export { Sentry };
