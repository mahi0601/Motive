// Wakes a sleeping API while the app's own files are still downloading and
// parsing, so the first real request (the session check) finds it warm instead
// of paying the whole cold start. Fire and forget: the response is opaque and
// ignored, and a failure changes nothing.
export function warmUpApi() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base || typeof fetch !== 'function') return;
  fetch(`${base.replace(/\/$/, '')}/api/health`, { mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).catch(() => {});
}
