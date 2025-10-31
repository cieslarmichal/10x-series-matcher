import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 *
 * Following project standards:
 * - Chromium/Desktop Chrome only
 * - Browser context isolation
 * - Trace viewer enabled for debugging
 * - Visual regression testing support
 */
export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test execution configuration
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env['CI'],

  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,

  // Workers on CI, can be adjusted based on CI resources
  workers: process.env['CI'] ? 2 : 1,

  // Reporter configuration
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env['BASE_URL'] || 'http://localhost:5173',

    // Collect trace on failure for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take
    actionTimeout: 10 * 1000,
  },

  // Configure projects for Chromium only (as per project standards)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable trace viewer for better debugging
        trace: 'retain-on-failure',
      },
    },

    // Mobile Chrome for responsive testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        trace: 'retain-on-failure',
      },
    },
  ],

  // Run local dev servers before starting tests
  webServer: [
    // Backend server on port 5000
    {
      command: 'cd ../backend && npm run dev',
      port: 5000,
      reuseExistingServer: !process.env['CI'],
      timeout: 120 * 1000,
    },
    // Frontend server on port 5173
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env['CI'],
      timeout: 120 * 1000,
    },
  ],
});
