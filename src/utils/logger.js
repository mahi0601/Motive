// Centralized logger — wraps the existing src/sentry.js seam so every call
// site stops talking to console/Sentry directly. `context` is deliberately
// a narrow, explicit object (method/url/status, not a raw axios error or
// response body spread wholesale) — error objects in this app can carry
// comment text, task titles, page-block content, and workspace member
// records, and none of that should go to a third-party service unscrubbed.
import { Sentry, isSentryEnabled } from '../sentry';

const isDev = import.meta.env.DEV;

export const logger = {
  // `error` is for something that actually failed and is worth knowing
  // about in production — it reports to Sentry (when configured) as well
  // as logging to the console in dev.
  error(message, error, context = {}) {
    if (isDev) console.error(message, error, context);
    if (isSentryEnabled) {
      Sentry.captureException(error, { extra: { message, ...context } });
    }
  },
  // `warn` is for something worth knowing locally but not worth a Sentry
  // report — matches the severity judgment already implicit in this
  // codebase (e.g. a silent-refresh failure that's about to redirect to
  // /login anyway isn't a bug report, just useful to see while debugging).
  warn(message, context = {}) {
    if (isDev) console.warn(message, context);
  },
};
