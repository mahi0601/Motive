// Runs strictly after `vite build` has fully exited (see package.json's
// "build" script) — not as a Vite/Rollup plugin hook, deliberately.
//
// vite-plugin-pwa's service worker (sw.js, workbox-*.js) is emitted by a
// second, separate build pass that finishes after the main app bundle and
// after sentryVitePlugin's own upload+cleanup step, so its two source maps
// (sw.js.map, workbox-*.js.map) survive that cleanup and would otherwise
// ship publicly. A closeBundle-hook-based cleanup was tried and still ran
// too early — this script only needs the whole `vite build` process (both
// passes) to have exited, which the `&&` in the npm script guarantees.
//
// No-op when nothing set SENTRY_AUTH_TOKEN (build.sourcemap is false in that
// case in vite.config.js, so there's nothing here to delete).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = fileURLToPath(new URL('../dist', import.meta.url));

if (fs.existsSync(distDir)) {
  const stragglers = fs.readdirSync(distDir, { recursive: true }).filter((f) => f.endsWith('.map'));
  for (const f of stragglers) fs.rmSync(path.join(distDir, f));
  if (stragglers.length) console.log(`🧹 Removed ${stragglers.length} leftover source map(s) from dist/`);
}
