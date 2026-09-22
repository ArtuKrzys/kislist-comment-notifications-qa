import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.KIS_BASE_URL ?? 'https://kislist.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
