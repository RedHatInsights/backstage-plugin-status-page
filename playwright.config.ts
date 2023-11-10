// @ts-check
const { devices } = require('@playwright/test');
import dotenv from 'dotenv';
//import { PlaywrightTestConfig } from '@playwright/test';
dotenv.config({
  path: process.cwd() + 'playwright/variables.env',
});

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */

const RPconfig = {
  apiKey: process.env.REPORT_PORTAL_KEY,
  endpoint: process.env.REPORT_PORTAL_URL,
  project: process.env.REPORT_PORTAL_PROJECTNAME,
  launch: 'backstage-plugin-tests',
  description: 'Integration Test with Report Portal',
  includeTestSteps: true,
  logLaunchLink: true,
  attributes: [
    {
      key: 'branchName',
      value: process.env.CI_COMMIT_BRANCH,
    },
  ],
  debug: true,

  restClientConfig: {
    agent: {
      rejectUnauthorized: false,
    },
  },
};

const config = {
  //testDir: './plugins/',
  testMatch: '*plugins/*/e2e/*.spec.ts',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['line'],
    ['@reportportal/agent-js-playwright', RPconfig],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
      launchOptions: {
        // Put your chromium-specific args here
        args: [
          '--disable-features=CrossSiteDocumentBlockingIfIsolating,CrossSiteDocumentBlockingAlways,IsolateOrigins,site-per-process,--disable-gpu,--disable-dev-shm-usage',
        ],
      },
    },
    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: {
        channel: 'msedge',
      },
    },
  ],
};

module.exports = config;
