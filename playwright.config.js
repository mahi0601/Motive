import { defineConfig, devices } from '@playwright/test';

// Two end-to-end tests that need a real browser and a real backend (see e2e/):
// jsdom cannot show a session surviving a reload, or an inline handler firing.
//
// The backend lives in its own repository. Point E2E_API_DIR at a checkout
// (default: a sibling folder) and E2E_DATABASE_URL at a THROWAWAY Postgres —
// never a real database; the tests create and delete their own users.
const API_PORT = 5055;
const WEB_PORT = 4173;
const apiDir = process.env.E2E_API_DIR || '../motive-backend';
const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error('Set E2E_DATABASE_URL to a throwaway Postgres (never a real database).');

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node src/index.js',
      cwd: apiDir,
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL: databaseUrl,
        JWT_SECRET: 'e2e-only-dummy-secret-0000000000000000000000',
        FRONTEND_URL: `http://localhost:${WEB_PORT}`,
        NODE_ENV: 'development',
        COOKIE_SAMESITE: 'lax',
        LOG_LEVEL: 'warn',
      },
    },
    {
      command: `npm run build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { VITE_API_BASE_URL: `http://localhost:${API_PORT}` },
    },
  ],
});
