/**
 * SPIKE v8 — DESCARTAVEL.
 *
 * O elo: o `setup()` do layout embutido roda de dentro do nosso `setup()`, fora
 * do `createLayoutWrapper`? E o estado chega ao componente E ao painel?
 */
import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

async function login(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_EMAIL);
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
}

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test('SPIKE v8: setup() deles chamado do nosso', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await ensureMapGridPreset();
  await login(page);

  const calls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(`/items/${COLLECTION_NAME}`) && !url.includes('aggregate')) {
      calls.push(decodeURIComponent(url.split('/items/')[1] ?? url));
    }
  });

  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.spike-bar')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(8_000);

  console.log(`\n[1] ${(await page.locator('.spike-bar').innerText()).replace(/\s+/g, ' ')}`);
  console.log(`[1] a grade deles desenhou? table=${await page.locator('.spike-pane--grid table').count()}`);
  console.log(`[1] ${(await page.locator('.spike-status').innerText()).replace(/\s+/g, ' ')}`);

  console.log(`\n[consultas] ${calls.length}`);
  calls.forEach((c, i) => console.log(`      [${i + 1}] ${c}`));

  await page.screenshot({ path: 'test-results/spike8-01-grade.png' });

  // a prova: o painel de opcoes recebe o MESMO estado, sem wrapper proprio
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();
  await page.waitForTimeout(2_000);

  const section = page.getByText(/SPIKE v8 — opcoes do tabular/i).first();
  if ((await section.count()) > 0) {
    await section.click();
    await page.waitForTimeout(3_000);
  }

  const painel = page.locator('[data-spike-panel]');
  console.log(`\n[2] painel presente? ${await painel.count()}`);
  if ((await painel.count()) > 0) {
    console.log(`[2] ${(await painel.getAttribute('data-spike-panel')) ?? ''}`);
  }

  const opts = page.locator('.spike-opts');
  if ((await opts.count()) > 0) {
    console.log(`[2] conteudo: ${(await opts.innerText()).replace(/\s+/g, ' ').slice(0, 200)}`);
  }

  console.log(`\n[3] consultas depois de abrir o painel: ${calls.length}`);
  await page.screenshot({ path: 'test-results/spike8-02-painel.png' });

  console.log(`\n[erros] ${errors.length === 0 ? 'nenhum' : JSON.stringify(errors.slice(0, 3))}`);
});
