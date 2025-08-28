// playwright.config.ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Determine if running in CI environment
const isCI = !!process.env.CI;

// Load environment variables from .env file (change file based on environment if needed)
dotenv.config({
  path: isCI
    ? path.resolve(__dirname, '.env.ci') // Optional: use different .env for CI if you want
    : path.resolve(__dirname, '.env'),   // Default for local dev
});


export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'html-report', open: 'never' }],
  ],

  use: {
    headless: true,
    viewport: null,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5000,
    navigationTimeout: 30000,

    // Use BASE_URL loaded from .env or CI secrets
    baseURL: process.env.BASE_URL,

    launchOptions: {
      args: ['--start-maximized'],
      slowMo: 100,
    },
  },

  workers: 1,
});
