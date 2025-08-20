// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'html-report', open: 'never' }],
  ],

  use: {
    headless: false,                  // Run with visible browser
    viewport: null,                   // Use full screen size of the browser window
    screenshot: 'only-on-failure',    // Capture screenshots on failures
    video: 'retain-on-failure',       // Keep videos for failed tests
    actionTimeout: 5000,
    navigationTimeout: 30000,

    launchOptions: {
      args: [
        '--start-maximized',          // Start browser maximized
      ],
      slowMo: 100,                    // Slow down for visibility
    },
  },

  workers: 1,                          // Run with 1 worker for debugging
});
