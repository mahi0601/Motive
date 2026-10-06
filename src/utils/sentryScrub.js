// Secrets that live in this app's URLs: the public status-page token (/s/:t),
// workspace invite tokens (/invite/:t), the password-reset token and OAuth
// hand-off values in query strings, and the Stripe checkout session id.
// Sentry records the current URL on every event and in navigation/fetch
// breadcrumbs, so without this a bug report would carry a working credential
// into a third-party system. Mirrors scrubUrl in motive-backend's config/logger.js.
const TOKEN_PATH = /(\/(?:invite|s|api\/status|api\/invites|api\/payments\/session)\/)([^/?#]+)/gi;
const SENSITIVE_PARAMS = ['token', 'csrf', 'code', 'state', 'invite', 'session_id', 'error_description', 'email'];
const MASK = '[redacted]';

export function scrubUrl(url) {
  if (typeof url !== 'string' || !url) return url;
  let out = url.replace(TOKEN_PATH, `$1${MASK}`);
  const q = out.indexOf('?');
  if (q === -1) return out;
  const hashAt = out.indexOf('#', q);
  const query = out.slice(q + 1, hashAt === -1 ? undefined : hashAt);
  const rest = hashAt === -1 ? '' : out.slice(hashAt);
  const params = new URLSearchParams(query);
  SENSITIVE_PARAMS.forEach((key) => {
    if (params.has(key)) params.set(key, MASK);
  });
  out = `${out.slice(0, q)}?${params.toString()}${rest}`;
  return out;
}

const scrubQuery = (qs) => {
  if (typeof qs !== 'string') return qs;
  const params = new URLSearchParams(qs);
  SENSITIVE_PARAMS.forEach((key) => params.has(key) && params.set(key, MASK));
  return params.toString();
};

export function scrubBreadcrumb(crumb) {
  if (!crumb?.data) return crumb;
  const data = { ...crumb.data };
  ['url', 'from', 'to'].forEach((k) => {
    if (typeof data[k] === 'string') data[k] = scrubUrl(data[k]);
  });
  return { ...crumb, data };
}

export function scrubEvent(event) {
  if (!event) return event;
  const out = { ...event };
  if (out.request) {
    const req = { ...out.request };
    if (req.url) req.url = scrubUrl(req.url);
    if (req.query_string) req.query_string = scrubQuery(req.query_string);
    if (req.headers) {
      req.headers = { ...req.headers };
      ['Referer', 'referer', 'Referrer'].forEach((h) => req.headers[h] && (req.headers[h] = scrubUrl(req.headers[h])));
    }
    delete req.cookies;
    out.request = req;
  }
  if (typeof out.transaction === 'string') out.transaction = scrubUrl(out.transaction);
  if (Array.isArray(out.breadcrumbs)) out.breadcrumbs = out.breadcrumbs.map(scrubBreadcrumb);
  return out;
}
