import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: true,
  workers: 1,
  globalTimeout: 600_000,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
