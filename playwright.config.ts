import { defineConfig, devices } from '@playwright/test';
import AllureReporter from 'allure-playwright';

export default defineConfig({
  testDir: './src/tests',
  globalSetup: './src/setup/global-setup.ts',
  globalTeardown: './src/setup/global-teardown.ts',
  reporter: [
    ['allure-playwright', { outputDir: 'allure-results' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});