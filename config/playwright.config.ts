// playwright.config.ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load the .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const isCI = !!process.env.CI;

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

    // Use BASE_URL from .env.test
    baseURL: process.env.BASE_URL,

    launchOptions: {
      args: ['--start-maximized'],
      slowMo: 100,
    },
  },

  workers: 1,
});
