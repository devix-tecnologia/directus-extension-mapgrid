import { defineConfig, devices } from '@playwright/test';

/**
 * Regenerates `docs/tela.jpg`, the screenshot the README shows at the top.
 *
 * Separate from the e2e config on purpose: this one produces an artefact rather
 * than asserting behaviour, so it must not run as part of the suite, and it
 * reuses the same seeded Directus the e2e tests use.
 */
export default defineConfig({
  testDir: './tests/screenshot',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results/screenshot',
  use: {
    baseURL: process.env.DIRECTUS_URL || 'http://localhost:8055',
    viewport: { width: 1600, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
