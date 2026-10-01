# Security headers for the static site

The Render static site (`motive-app`) does not read `netlify.toml` or `nginx.conf`, so it sends no security headers until they are added in **Render → the static site → Settings → Headers**. Add these for path `/*`.

Replace `<api-host>` with the host in `VITE_API_BASE_URL` (no scheme).

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'sha256-<hash of the theme script>'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://<api-host> wss://<api-host> https://*.ingest.sentry.io https://*.ingest.us.sentry.io; frame-src https://www.youtube.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self'` |
| `Referrer-Policy` | `no-referrer` |
| `X-Content-Type-Options` | `nosniff` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |

Differences from the README's starter policy:

- **No `'unsafe-inline'` for scripts.** `index.html` has one small inline script (it applies the saved theme before first paint). Allow it by hash instead: build, then run
  `node -e "const h=require('fs').readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];console.log('sha256-'+require('crypto').createHash('sha256').update(h).digest('base64'))"`
  and put the output in `script-src`. The hash changes whenever that script changes, so redo this when it does.
- **`connect-src` is pinned to the API origin** instead of any `https:`/`wss:` host, which limits where a compromised script could send data.
- **`Referrer-Policy: no-referrer`** so URLs carrying tokens (invite, status, reset) are never sent as a Referer.

Check with DevTools open: sign in, open the dashboard, a page with blocks, and Settings. Anything blocked appears in the Console. While tuning, send the same value as `Content-Security-Policy-Report-Only`.

Fonts are loaded from Google Fonts, which tells Google each visitor's IP address. Self-hosting them (the project already depends on `@fontsource/ibm-plex-sans`) would remove that and let you drop two entries from the policy.

The old Vercel production deployment and the Netlify site, if still live, should either be switched off or given the same headers.
