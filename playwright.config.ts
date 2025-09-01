import { defineConfig, devices } from '@playwright/test';
import AllureReporter from 'allure-playwright';

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
  reporter: [
    ['allure-playwright', { outputDir: 'allure-results' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // We cannot attach webServer per project directly; instead we'll start separate servers via workers.
  // Simplest approach: keep a single dynamic port per worker not needed; revert to single server for now.
  webServer: {
    command: 'npm run start --prefix sample-app --if-present',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3000' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], baseURL: 'http://127.0.0.1:3000' } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], baseURL: 'http://127.0.0.1:3000' } },
  ],
});