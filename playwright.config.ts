import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  
reporter: [
  ['list'],
  ['html', { outputFolder: 'html-report', open: 'never' }]
],

outputDir: 'test-results', // Keeps screenshots, videos, traces, etc.

  use: {
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: null,
    actionTimeout: 5000,
    navigationTimeout: 30000,
    launchOptions: {
      args: [
        '--start-fullscreen',
        '--window-size=1920,1080',
      ],
      slowMo: 0,
    },
  },
});
