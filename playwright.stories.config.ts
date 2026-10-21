import { defineConfig, devices } from '@playwright/test';

const STORYBOOK_PORT = 6099;
const STORYBOOK_URL = `http://localhost:${STORYBOOK_PORT}`;

/**
 * The stories' console check. Unlike the e2e suite it needs neither Docker nor
 * a Directus: `webServer` starts Storybook itself and tears it down at the end,
 * so `pnpm check:stories` runs on its own on any machine.
 */
export default defineConfig({
  testDir: './tests/stories',
  // a story only counts as clean once it has rendered, and the map takes a
  // while to give up on WebGL in headless mode
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : [['list']],
  outputDir: 'test-results/stories',
  use: {
    baseURL: STORYBOOK_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec storybook dev --ci --quiet --port ${STORYBOOK_PORT}`,
    url: STORYBOOK_URL,
    // Storybook takes close to a minute on its first start, with Vite's
    // dependencies still to be optimized
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
