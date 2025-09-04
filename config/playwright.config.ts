import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on environment
const isCI = !!process.env.CI;
dotenv.config({
  path: isCI
    ? path.resolve(__dirname, '.env.ci') // use .env.ci for CI
    : path.resolve(__dirname, '.env'),   // use .env for local development
});

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'html-report', open: 'never' }],
    ['allure-playwright'], // include allure reporter here only once
  ],

  use: {
    headless: true,
    viewport: null,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 5000,
    navigationTimeout: 30_000,

    baseURL: process.env.BASE_URL,

    launchOptions: {
      args: ['--start-maximized'],
      slowMo: 100,
    },
  },
});
