import { defineConfig, devices } from '@playwright/test';

// Helper to build a webServer config per project on a distinct port.
// Each browser starts its own instance to avoid shared in-memory task state flakiness.
function serverFor(port: number) {
  return {
    command: `PORT=${port} npm run start --prefix sample-app --if-present`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 20_000,
  } as const;
}

export default defineConfig({
  testDir: './src/tests',
  // Retries help deflake occasional network timing issues in CI only
  retries: process.env.CI ? 2 : 0,
  // Keep tests parallel but avoid over-saturation that could cause shared state collisions
  fullyParallel: true,
  // Limit workers in CI if needed (let Playwright decide locally)
  workers: process.env.CI ? 4 : undefined,
  reporter: [['allure-playwright', { outputDir: 'allure-results' }], ['list']],
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Start API (Express on :3000) and UI (Vite on :5173) together, as per sample-app/readme.md
  webServer: {
    command:
      // Start Postgres via Docker, wait healthy, then start API and UI
      `bash -lc '
        if [ -z "$CI" ]; then
          docker compose up -d postgres || docker-compose up -d postgres;
          # Wait for PG to be ready (local Docker only)
          for i in {1..60}; do
            if docker ps --format "{{.Names}} {{.Status}}" | grep -E "postgres.*(healthy|Up)" >/dev/null; then echo PG ready; break; fi; sleep 2; done;
        else
          echo "CI detected: using GitHub Actions Postgres service on 127.0.0.1:5432";
        fi
        export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=task_storage PGUSER=task_user PGPASSWORD=strongpassword;
        cd sample-app/server && (npm ci || npm install) && npm start &
        cd sample-app/client && (npm ci || npm install) && VITE_API_URL=http://127.0.0.1:3000 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
      '`,
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], baseURL: 'http://127.0.0.1:5173' } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], baseURL: 'http://127.0.0.1:5173' } },
  ],
});
