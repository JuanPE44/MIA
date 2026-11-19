import { defineConfig, devices } from '@playwright/test';

const BASE = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 60_000,
  globalTimeout: 1_500_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }], ['json', { outputFile: 'test-results/report.json' }]],
  use: { baseURL: BASE, trace: 'off', actionTimeout: 8_000, screenshot: 'off', locale: 'es-ES' },
  webServer: { command: 'pnpm dev', url: BASE, reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: 'e2e/.auth/pro.json' },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, storageState: 'e2e/.auth/pro.json' },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts|keyboard|journeys/,
    },
  ],
});
