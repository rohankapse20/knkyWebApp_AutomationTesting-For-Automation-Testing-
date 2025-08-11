import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180000, // 3 minutes per test
  retries: 1,
  reporter: [['html'], ['list']],
  use: {
    headless: false,            // Run with browser UI for debugging
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 100,              // Slow down actions to see steps visually
    },
  },
});
