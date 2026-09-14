import { defineConfig, devices } from '@playwright/test';

const STORYBOOK_PORT = 6099;
const STORYBOOK_URL = `http://localhost:${STORYBOOK_PORT}`;

/**
 * Checagem do console das stories. Ao contrário da suíte e2e, não precisa de
 * Docker nem de um Directus: o `webServer` sobe o próprio Storybook e o derruba
 * ao terminar, então `pnpm check:stories` roda sozinho em qualquer máquina.
 */
export default defineConfig({
  testDir: './tests/stories',
  // uma story só é considerada limpa depois de renderizar, e o mapa leva um
  // tempo para desistir do WebGL no headless
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
    // o Storybook leva perto de um minuto para o primeiro start, com as
    // dependências do Vite ainda por otimizar
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
