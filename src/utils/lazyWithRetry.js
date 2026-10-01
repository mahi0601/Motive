import { lazy } from 'react';

const GUARD = 'motive:chunk-reload';

// React.lazy for a code-split page, hardened for deploys: once a new version
// ships, the hashed chunk files an already-open tab points at are gone, so the
// dynamic import fails and the screen would stay blank. One automatic reload
// fetches the new index.html with its new chunks. The guard stops that from
// looping: a second failure straight after a reload is a real error and is
// thrown to the error boundary. A successful load clears the guard.
export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const module = await factory();
      try { sessionStorage.removeItem(GUARD); } catch { /* storage can be unavailable */ }
      return module;
    } catch (err) {
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(GUARD) === '1';
        sessionStorage.setItem(GUARD, '1');
      } catch { /* without storage we cannot guard, so do not reload */ alreadyReloaded = true; }
      if (alreadyReloaded) throw err;
      window.location.reload();
      return new Promise(() => {}); // the page is going away; keep the spinner up meanwhile
    }
  });
}
