import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000, // Test timeout per test
  retries: 0,

  reporter: [
    ['list'], // optional, your preferred console reporter
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }] // HTML report saved here
  ],
  
   outputDir: 'test-results',  // Folder where results & traces go,

  use: {
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: null, // Let browser take full screen size
    actionTimeout: 5000,
    navigationTimeout: 30000,
    launchOptions: {
      args: [
        '--start-fullscreen', // Works for Chromium (Chrome/Edge)
        '--window-size=1920,1080', // Fallback for full screen
      ],

      slowMo: 0,
    },
  },
});
