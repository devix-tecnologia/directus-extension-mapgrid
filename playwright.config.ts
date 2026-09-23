import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  timeout: 180000,
  /*
   * Um worker so, sempre. Todos os specs dividem o mesmo Directus e o MESMO
   * preset do admin, e varios o resetam com `ensureMapGridPreset` antes de
   * medir. Em paralelo, um teste desfaz o preset no meio da espera do outro: o
   * `sort` gravado volta a `name`, os `fields` somem, e a falha parece do codigo.
   * O CI ja rodava assim; o local, com o padrao do Playwright, nao — e dava
   * resultado diferente conforme o numero de nucleos da maquina.
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  preserveOutput: 'always',
  outputDir: 'test-results',
  use: {
    baseURL: process.env.DIRECTUS_URL || 'http://localhost:8055',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
