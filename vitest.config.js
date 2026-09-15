import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deliberately separate from vite.config.js rather than adding a `test:`
// block there — that config carries build-time plugins (VitePWA's manifest/
// service-worker injection, the Sentry sourcemap uploader) that have no
// business running during a test collection pass. Vitest picks this file up
// automatically in preference to vite.config.js.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: false,
  },
});
