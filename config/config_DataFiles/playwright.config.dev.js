"use strict";

var _require = require('@playwright/test'),
    defineConfig = _require.defineConfig;

var dotenv = require('dotenv');

var path = require('path'); // Load correct .env based on CI or local


var isCI = !!process.env.CI;
dotenv.config({
  path: isCI ? path.resolve(__dirname, '.env.ci') // CI environment
  : path.resolve(__dirname, '.env') // Local dev

});
module.exports = defineConfig({
  testDir: './tests',
  // Global test timeout per test
  timeout: 120000,
  // 2 minutes per test
  // Retry flaky tests up to 2 times
  retries: 2,
  // Workers — override to 1 on low-RAM systems unless running in CI
  workers: isCI ? 2 : 1,
  // Reporters: Console + HTML + Allure
  reporter: [['list'], ['html', {
    outputFolder: 'html-report',
    open: 'never'
  }], ['allure-playwright']],
  // Browser & test options
  use: {
    headless: true,
    // Enable headless
    viewport: null,
    // Fullscreen window
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    baseURL: process.env.BASE_URL,
    // Better navigation handling
    navigationTimeout: 60000,
    // Allow up to 60s for slow-loading pages
    actionTimeout: 5000,
    // Interactions time out in 5s
    // Browser launch settings
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: isCI ? 0 : 100 // Optional: slowMo for visual debugging

    }
  }
});