import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4200',
    channel: 'chrome',
    headless: true,
    launchOptions: {
      chromiumSandbox: false
    }
  },
  webServer: [
    {
      command: 'npm run start',
      cwd: '../backend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
});
