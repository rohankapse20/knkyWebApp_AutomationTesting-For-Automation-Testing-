"use strict";

const { defineConfig } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

// Detect CI environment
const isCI = !!process.env.CI;

// Load environment variables based on environment
dotenv.config({
  path: isCI
    ? path.resolve(__dirname, '.env.ci')  // CI
    : path.resolve(__dirname, '.env')     // Local
});

module.exports = defineConfig({
  testDir: './tests',

  // Global test timeout per test
  timeout: 120_000, // 2 minutes per test

  // Retry flaky tests up to 2 times
  retries: 2,

  // Use more workers in CI
  workers: isCI ? 2 : 1,

  // Reporters: Console, HTML, and Allure
  reporter: [
    ['list'],
    ['html', { outputFolder: 'config_DataFiles/html-report', open: 'never' }],
    ['allure-playwright']
  ],

  // ✅ Global browser/test settings
  use: {
    headless: true,
    viewport: null,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    baseURL: process.env.BASE_URL,

    navigationTimeout: 60_000,
    actionTimeout: 5_000,

    launchOptions: {
      args: ['--start-maximized'],
      slowMo: isCI ? 0 : 100
    }
  }
});
